/**
 * @file StudentUser.js
 * @description Concrete subclass of BaseUser representing a student.
 *
 * OOP CONCEPTS DEMONSTRATED:
 *  - Inheritance  : `StudentUser extends BaseUser` — inherits all base behaviour.
 *  - Polymorphism : Overrides `getPermissions()` and `describe()` (method overriding).
 *                   Simulates method overloading in `trackEnrollment()` by inspecting
 *                   the argument type at runtime (JavaScript has no native overloading).
 *  - Encapsulation: `_enrolledCourseIds` is a protected-by-convention list that
 *                   tracks the student's courses in memory during a session.
 */

const BaseUser = require('./BaseUser');

class StudentUser extends BaseUser {
  // ─── Constructor ────────────────────────────────────────────────────────────

  /**
   * @param {Object}   userData - Raw user data from UserFactory.
   */
  constructor(userData) {
    // Call parent constructor; force role to 'student'.
    super({ ...userData, role: 'student' });

    /**
     * @protected {string[]} _enrolledCourseIds
     * In-memory list of course IDs the student is enrolled in during this session.
     */
    this._enrolledCourseIds = [];
  }

  // ─── Method Overriding (Polymorphism) ───────────────────────────────────────

  /**
   * Returns the restricted set of permissions available to a student.
   * OVERRIDES BaseUser.getPermissions().
   *
   * @override
   * @returns {string[]}
   */
  getPermissions() {
    return [
      'enroll_course',
      'drop_course',
      'view_courses',
      'view_my_enrollments',
    ];
  }

  /**
   * Returns a student-specific description that includes enrolment count.
   * OVERRIDES BaseUser.describe().
   *
   * @override
   * @returns {string}
   */
  describe() {
    return `Student: ${this.name} <${this.email}> [enrolled in ${this._enrolledCourseIds.length} course(s)]`;
  }

  // ─── Method Overloading Simulation (Polymorphism) ───────────────────────────

  /**
   * Tracks a course enrolment in memory.
   *
   * Simulates method overloading:
   *  - If `courseInput` is a string  → adds a single course ID.
   *  - If `courseInput` is an array  → adds multiple course IDs at once.
   *
   * JavaScript does not support native method overloading; this pattern uses
   * runtime type-checking to replicate the behaviour.
   *
   * @param {string|string[]} courseInput - A single course ID or an array of IDs.
   */
  trackEnrollment(courseInput) {
    if (typeof courseInput === 'string') {
      // Overload 1 — single course ID
      this._enrolledCourseIds.push(courseInput);
    } else if (Array.isArray(courseInput)) {
      // Overload 2 — bulk course IDs
      this._enrolledCourseIds.push(...courseInput);
    } else {
      throw new TypeError('trackEnrollment expects a string or an array of strings.');
    }
  }

  /**
   * Returns the number of courses this student is currently tracking.
   *
   * @returns {number}
   */
  getEnrolledCount() {
    return this._enrolledCourseIds.length;
  }

  /**
   * Returns a copy of the tracked course IDs.
   *
   * @returns {string[]}
   */
  getEnrolledCourseIds() {
    return [...this._enrolledCourseIds];
  }
}

module.exports = StudentUser;
