/**
 * @file CourseServiceProxy.js
 * @description Implements the **Proxy** design pattern for course data access.
 *
 * PATTERN: Proxy (Protection / Logging Proxy)
 * PURPOSE: Wraps the real CourseService with two cross-cutting concerns:
 *   1. Role-based access control (admin-only mutations).
 *   2. Audit logging of every data-access operation.
 *
 * Callers (courseController) interact only with the proxy interface — they
 * never call CourseService directly. The proxy transparently delegates to
 * the real service after running its checks.
 *
 * OOP CONCEPTS USED:
 *  - Class       : CourseService (real subject) and CourseServiceProxy (proxy)
 *                  both implement the same operation signatures.
 *  - Encapsulation: The real service is a private `_realService` field; callers
 *                   cannot bypass the proxy to touch it.
 *  - Polymorphism : The proxy and real service share the same method names
 *                   (create, findAll, findById, update, delete) — swappable
 *                   without changing controller code.
 */

const Course     = require('../../models/Course');
const Enrollment = require('../../models/Enrollment');

// ─── Real Subject ─────────────────────────────────────────────────────────────

/**
 * CourseService — performs the actual CRUD operations on MongoDB.
 * This class should not be used directly by controllers; use CourseServiceProxy.
 */
class CourseService {
  /**
   * Creates a new course document.
   * @param {Object} data - Course fields.
   * @returns {Promise<Object>}
   */
  async create(data) {
    return await Course.create(data);
  }

  /**
   * Returns all course documents.
   * @returns {Promise<Object[]>}
   */
  async findAll() {
    return await Course.find();
  }

  /**
   * Returns a single course by MongoDB ObjectId.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await Course.findById(id);
  }

  /**
   * Updates a course by ID and returns the updated document.
   * @param {string} id
   * @param {Object} data - Fields to update.
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    return await Course.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Deletes a course and all its associated enrollment records.
   * @param {string} id
   * @returns {Promise<Object|null>} The deleted Course document.
   */
  async delete(id) {
    const course = await Course.findByIdAndDelete(id);
    if (course) {
      await Enrollment.deleteMany({ course: id });
    }
    return course;
  }
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

/**
 * CourseServiceProxy — guards and audits all operations on CourseService.
 *
 * Adds before each delegated call:
 *  - `_assertAdmin()`  — blocks non-admin users from mutating courses.
 *  - `_logAccess()`    — writes an audit log entry.
 */
class CourseServiceProxy {
  constructor() {
    /** @private {CourseService} The real service being proxied. */
    this._realService = new CourseService();
  }

  // ─── Proxy Guards (private) ────────────────────────────────────────────────

  /**
   * Writes an audit log entry for every access attempt.
   * @private
   * @param {string} action - Description of the operation.
   * @param {Object} user   - req.user object (may be null for public endpoints).
   */
  _logAccess(action, user) {
    const role = user ? user.role : 'guest';
    const name = user ? user.name : 'Anonymous';
    console.log(
      `[Proxy:Audit] action="${action}" | user="${name}" | role="${role}" | ${new Date().toISOString()}`
    );
  }

  /**
   * Throws a 403 error if the user is not an admin.
   * @private
   * @param {Object} user   - req.user.
   * @param {string} action - Action label for the error message.
   */
  _assertAdmin(user, action) {
    if (!user || user.role !== 'admin') {
      const err = new Error(`Access denied. "${action}" requires admin role.`);
      err.statusCode = 403;
      throw err;
    }
  }

  // ─── Proxied Operations ─────────────────────────────────────────────────────

  /**
   * Creates a course — admin only.
   * @param {Object} data - Course fields.
   * @param {Object} user - Authenticated user (req.user).
   * @returns {Promise<Object>}
   */
  async create(data, user) {
    this._assertAdmin(user, 'create_course');
    this._logAccess('create_course', user);
    return await this._realService.create(data);
  }

  /**
   * Returns all courses — public (no auth required).
   * @param {Object|null} user - Authenticated user or null.
   * @returns {Promise<Object[]>}
   */
  async findAll(user) {
    this._logAccess('list_courses', user);
    return await this._realService.findAll();
  }

  /**
   * Returns a single course by ID — public.
   * Throws 404 if the course does not exist.
   * @param {string}      id
   * @param {Object|null} user
   * @returns {Promise<Object>}
   */
  async findById(id, user) {
    this._logAccess('get_course', user);
    const course = await this._realService.findById(id);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    return course;
  }

  /**
   * Updates a course — admin only.
   * Throws 404 if the course does not exist.
   * @param {string} id
   * @param {Object} data
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  async update(id, data, user) {
    this._assertAdmin(user, 'update_course');
    this._logAccess('update_course', user);
    const course = await this._realService.update(id, data);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    return course;
  }

  /**
   * Deletes a course and its enrollments — admin only.
   * Throws 404 if the course does not exist.
   * @param {string} id
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  async delete(id, user) {
    this._assertAdmin(user, 'delete_course');
    this._logAccess('delete_course', user);
    const course = await this._realService.delete(id);
    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }
    return course;
  }
}

// Export a shared proxy instance.
module.exports = new CourseServiceProxy();
