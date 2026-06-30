/**
 * @file enrollmentController.js
 * @description Handles course enrollment and drop operations.
 *
 * PATTERNS USED:
 *  - Facade   : `registrationFacade.enrollStudent()` and `.dropStudent()` hide
 *               all internal steps (course lookup, capacity check, duplicate check,
 *               DB write, counter update, Observer notification) behind two simple
 *               method calls. The controller stays thin and focused.
 *  - Observer : Events are fired *inside* the Facade (via EnrollmentEventEmitter)
 *               so the controller itself never needs to know about logging or
 *               notification concerns.
 *
 * OOP CONCEPTS:
 *  - Encapsulation: The controller does not know about Course, Enrollment models
 *                   or the EventEmitter. All that complexity is behind the Facade.
 *  - Polymorphism : enrollStudent / dropStudent on the facade share a common
 *                   error-handling interface (err.statusCode) regardless of
 *                   which internal step failed.
 */

const Enrollment          = require('../models/Enrollment');
const registrationFacade  = require('../patterns/facade/RegistrationFacade');

// ─── Route Controllers ────────────────────────────────────────────────────────

/**
 * POST /api/enrollments/:courseId
 * Enrols the authenticated student in the specified course.
 *
 * FACADE: A single call to `registrationFacade.enrollStudent()` handles:
 *   course lookup → capacity check → duplicate check → DB insert →
 *   seat counter update → Observer notification.
 *
 * @param {import('express').Request}  req - Params: { courseId }, req.user set by auth chain.
 * @param {import('express').Response} res
 */
const enrollCourse = async (req, res) => {
  try {
    // Pass student identity for Observer notifications inside the Facade.
    const studentInfo = { name: req.user.name, email: req.user.email };

    // FACADE: one call replaces ~30 lines of inline logic.
    const enrollment = await registrationFacade.enrollStudent(
      req.user.id,
      studentInfo,
      req.params.courseId
    );

    return res.status(201).json(enrollment);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/enrollments/my
 * Returns all courses the authenticated student is enrolled in.
 *
 * @param {import('express').Request}  req - req.user set by auth chain.
 * @param {import('express').Response} res
 */
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate('course');
    return res.status(200).json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/enrollments/:courseId
 * Drops (withdraws) the authenticated student from the specified course.
 *
 * FACADE: `registrationFacade.dropStudent()` handles enrollment lookup,
 * deletion, seat counter decrement, and Observer notification.
 *
 * @param {import('express').Request}  req - Params: { courseId }
 * @param {import('express').Response} res
 */
const dropCourse = async (req, res) => {
  try {
    const studentInfo = { name: req.user.name, email: req.user.email };

    // FACADE: drop logic + Observer notification in one call.
    await registrationFacade.dropStudent(
      req.user.id,
      studentInfo,
      req.params.courseId
    );

    return res.status(200).json({ message: 'Course dropped successfully' });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/enrollments/all
 * Returns all enrollment records (admin use).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('student', 'name email')
      .populate('course',  'title instructor');
    return res.status(200).json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { enrollCourse, getMyEnrollments, dropCourse, getAllEnrollments };
