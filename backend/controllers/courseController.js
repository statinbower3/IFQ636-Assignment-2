/**
 * @file courseController.js
 * @description Handles CRUD operations for courses.
 *
 * PATTERNS USED:
 *  - Proxy    : All database operations go through `courseProxy` (CourseServiceProxy).
 *               The proxy enforces role-based access control and writes audit logs
 *               before delegating to the real CourseService.
 *  - Strategy : When listing courses, an optional `?sortBy` query parameter selects
 *               a sorting strategy at runtime (title | capacity | enrolled | availability).
 *               The CourseSorter context holds the strategy and executes it.
 *
 * OOP CONCEPTS:
 *  - Polymorphism : courseProxy.create(), .findAll(), .findById(), .update(), .delete()
 *                   all share the same proxy interface but each one may run different
 *                   access checks (method overriding inside the proxy).
 *  - Encapsulation: The proxy hides access-control and audit logic from the controller.
 *                   The strategy hides sorting algorithm details from the controller.
 */

const courseProxy  = require('../patterns/proxy/CourseServiceProxy');
const { CourseSorter, getStrategy } = require('../patterns/strategy/CourseSortStrategy');

// ─── Route Controllers ────────────────────────────────────────────────────────

/**
 * POST /api/courses
 * Creates a new course. Admin only (enforced by the Proxy).
 *
 * PROXY: courseProxy.create() verifies admin role and logs the action
 * before inserting the document.
 *
 * @param {import('express').Request}  req - Body: { title, description, instructor, schedule, capacity }
 * @param {import('express').Response} res
 */
const createCourse = async (req, res) => {
  try {
    const { title, description, instructor, schedule, capacity } = req.body;
    // PROXY: access control + audit log happen inside the proxy.
    const course = await courseProxy.create(
      { title, description, instructor, schedule, capacity },
      req.user  // proxy uses this to check role
    );
    return res.status(201).json(course);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/courses
 * Returns all courses. Public endpoint.
 *
 * STRATEGY: If `?sortBy=<value>` is present in the query string, the
 * CourseSorter selects the matching strategy at runtime and sorts the results
 * before returning them. Default sort is by title.
 *
 * Supported values: title | capacity | enrolled | availability
 *
 * PROXY: logs the access (no auth required for reads).
 *
 * @param {import('express').Request}  req - Query: { sortBy? }
 * @param {import('express').Response} res
 */
const getCourses = async (req, res) => {
  try {
    // PROXY: delegates to real service after logging.
    const courses = await courseProxy.findAll(req.user || null);

    // STRATEGY: select the right sort algorithm from the query param.
    const sortBy  = req.query.sortBy;  // e.g. ?sortBy=capacity
    const sorter  = new CourseSorter(getStrategy(sortBy));
    const sorted  = sorter.sort(courses);

    // DECORATOR: add availability info to each course 
    const decorated = sorted.map((course) => {
      const plain = course.toObject ? course.toObject() : course;
      const availability = course.getAvailabilityInfo
        ? course.getAvailabilityInfo()
        : { seatsRemaining: plain.capacity - plain.enrolled, status: 'available' };
      return { ...plain, ...availability };
    });

    return res.status(200).json(decorated);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/courses/:id
 * Returns a single course by ID. Public endpoint.
 *
 * PROXY: logs access; throws 404 (with statusCode) if not found.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const getCourseById = async (req, res) => {
  try {
    const course = await courseProxy.findById(req.params.id, req.user || null);
    return res.status(200).json(course);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message });
  }
};

/**
 * PUT /api/courses/:id
 * Updates an existing course. Admin only (enforced by the Proxy).
 *
 * @param {import('express').Request}  req - Params: { id }, Body: course fields
 * @param {import('express').Response} res
 */
const updateCourse = async (req, res) => {
  try {
    const course = await courseProxy.update(req.params.id, req.body, req.user);
    return res.status(200).json(course);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message });
  }
};

/**
 * DELETE /api/courses/:id
 * Deletes a course and all its enrollments. Admin only (enforced by the Proxy).
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const deleteCourse = async (req, res) => {
  try {
    await courseProxy.delete(req.params.id, req.user);
    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message });
  }
};

module.exports = { createCourse, getCourses, getCourseById, updateCourse, deleteCourse };
