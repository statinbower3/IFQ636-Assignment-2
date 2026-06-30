/**
 * @file RegistrationFacade.js
 * @description Implements the **Facade** design pattern for the course registration workflow.
 *
 * PATTERN: Facade
 * PURPOSE: Hides the multi-step complexity of enrolling or dropping a student
 *          behind a simple, clean interface. Instead of the controller knowing
 *          about Course, Enrollment, capacity checks, duplicate checks, and
 *          Observer events, it simply calls:
 *            `registrationFacade.enrollStudent(studentId, studentInfo, courseId)`
 *          The facade orchestrates all the subsystems internally.
 *
 * OOP CONCEPTS USED:
 *  - Class       : RegistrationFacade encapsulates the entire workflow.
 *  - Encapsulation: All helper steps are private methods (underscore convention).
 *                   Controllers interact only with `enrollStudent()` and `dropStudent()`.
 *
 * SUBSYSTEMS COORDINATED BY THE FACADE:
 *  1. Course model       — lookup, capacity enforcement.
 *  2. Enrollment model   — duplicate check, create/delete records.
 *  3. EnrollmentEventEmitter — Observer notifications.
 */

const Enrollment      = require('../../models/Enrollment');
const Course          = require('../../models/Course');
const enrollmentEmitter = require('../observer/EnrollmentEventEmitter');

class RegistrationFacade {

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC INTERFACE (the "facade")
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enrols a student in a course.
   *
   * Orchestrates internally:
   *   1. Find the course and verify it exists.
   *   2. Check that the course has available seats.
   *   3. Verify the student is not already enrolled.
   *   4. Create the Enrollment document.
   *   5. Increment the course's enrolled counter.
   *   6. Fire the Observer 'enrollment:created' event.
   *
   * @param {string} studentId   - MongoDB ObjectId of the student.
   * @param {Object} studentInfo - { name, email } used for Observer notifications.
   * @param {string} courseId    - MongoDB ObjectId of the course.
   * @returns {Promise<Object>}  The newly created Enrollment document.
   * @throws {Error} With `.statusCode` set to 400 or 404 on validation failures.
   */
  async enrollStudent(studentId, studentInfo, courseId) {
    const course    = await this._findCourse(courseId);       // Step 1
    this._checkCapacity(course);                              // Step 2
    await this._checkDuplicate(studentId, courseId);          // Step 3
    const enrollment = await this._createEnrollment(studentId, courseId); // Step 4
    await this._incrementEnrolled(course);                    // Step 5
    this._notifyEnrollment(studentInfo, course);              // Step 6
    return enrollment;
  }

  /**
   * Drops (withdraws) a student from a course.
   *
   * Orchestrates internally:
   *   1. Find and delete the Enrollment document.
   *   2. Decrement the course's enrolled counter.
   *   3. Fire the Observer 'enrollment:dropped' event.
   *
   * @param {string} studentId   - MongoDB ObjectId of the student.
   * @param {Object} studentInfo - { name, email } for Observer notifications.
   * @param {string} courseId    - MongoDB ObjectId of the course.
   * @returns {Promise<Object>}  The deleted Enrollment document.
   * @throws {Error} With `.statusCode = 404` if the enrollment is not found.
   */
  async dropStudent(studentId, studentInfo, courseId) {
    const enrollment = await this._deleteEnrollment(studentId, courseId); // Step 1
    const course     = await Course.findById(courseId);
    if (course) {
      await this._decrementEnrolled(course);                              // Step 2
      this._notifyDrop(studentInfo, course);                              // Step 3
    }
    return enrollment;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS (Encapsulation — underscore convention signals "internal")
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Looks up a course by ID; throws a 404 if not found.
   * @private
   * @param {string} courseId
   * @returns {Promise<Object>} Mongoose Course document.
   */
  async _findCourse(courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    return course;
  }

  /**
   * Checks that the course has at least one open seat.
   * Fires a 'course:full' Observer event before throwing if the course is at capacity.
   * @private
   * @param {Object} course - Mongoose Course document.
   */
  _checkCapacity(course) {
    if (course.enrolled >= course.capacity) {
      // Notify observers that the course is full before rejecting.
      enrollmentEmitter.notifyCourseFull({
        courseName: course.title,
        capacity:   course.capacity,
      });
      const err = new Error('Course is full');
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Ensures the student is not already enrolled in the course.
   * @private
   * @param {string} studentId
   * @param {string} courseId
   */
  async _checkDuplicate(studentId, courseId) {
    const existing = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existing) {
      const err = new Error('Already enrolled in this course');
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Creates the Enrollment document in MongoDB.
   * @private
   * @param {string} studentId
   * @param {string} courseId
   * @returns {Promise<Object>} The new Enrollment document.
   */
  async _createEnrollment(studentId, courseId) {
    return await Enrollment.create({ student: studentId, course: courseId });
  }

  /**
   * Increments the course's enrolled seat counter by 1.
   * @private
   * @param {Object} course - Mongoose Course document.
   */
  async _incrementEnrolled(course) {
    course.enrolled += 1;
    await course.save();
  }

  /**
   * Decrements the course's enrolled seat counter by 1 (min 0).
   * @private
   * @param {Object} course - Mongoose Course document.
   */
  async _decrementEnrolled(course) {
    if (course.enrolled > 0) {
      course.enrolled -= 1;
      await course.save();
    }
  }

  /**
   * Finds and removes the student's enrollment record.
   * Throws 404 if not found.
   * @private
   * @param {string} studentId
   * @param {string} courseId
   * @returns {Promise<Object>} The deleted Enrollment document.
   */
  async _deleteEnrollment(studentId, courseId) {
    const enrollment = await Enrollment.findOneAndDelete({
      student: studentId,
      course:  courseId,
    });
    if (!enrollment) {
      const err = new Error('Enrollment not found');
      err.statusCode = 404;
      throw err;
    }
    return enrollment;
  }

  /**
   * Fires the enrollment:created Observer event.
   * @private
   * @param {Object} studentInfo - { name, email }
   * @param {Object} course      - Mongoose Course document.
   */
  _notifyEnrollment(studentInfo, course) {
    enrollmentEmitter.notifyEnrollment({
      studentName:  studentInfo.name,
      studentEmail: studentInfo.email,
      courseName:   course.title,
    });
  }

  /**
   * Fires the enrollment:dropped Observer event.
   * @private
   * @param {Object} studentInfo - { name, email }
   * @param {Object} course      - Mongoose Course document.
   */
  _notifyDrop(studentInfo, course) {
    enrollmentEmitter.notifyDropped({
      studentName:  studentInfo.name,
      studentEmail: studentInfo.email,
      courseName:   course.title,
    });
  }
}

// Export a shared instance — callers don't need to instantiate it.
module.exports = new RegistrationFacade();
