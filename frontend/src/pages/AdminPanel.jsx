/**
 * @file AdminPanel.jsx
 * @description Admin-only dashboard: create/edit/delete courses and view all
 *              courses and all enrolments.
 *
 * ACCESS: App.js only mounts this route for users with role 'admin' (redirecting
 * others to /courses). The backend independently enforces admin access on the
 * write endpoints via the Proxy pattern + adminOnly middleware, so the UI guard
 * is convenience only, not the security boundary.
 *
 * SECTIONS:
 *   1. Course form   — create (POST /api/courses) or edit (PUT /api/courses/:id).
 *   2. All courses   — table with Edit/Delete (DELETE cascades enrolments backend-side).
 *   3. All enrolments — read-only table (GET /api/enrollments/all).
 * All write/admin calls send the Bearer token from AuthContext.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const AdminPanel = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);          // all courses (table + form target)
  const [enrollments, setEnrollments] = useState([]);  // all enrolments (read-only table)
  const [message, setMessage] = useState('');          // status/error banner
  const [editingCourse, setEditingCourse] = useState(null); // course being edited, or null
  // Controlled course form. `capacity` is kept as a string here (input value) and
  // coerced by the backend/Mongoose schema (Number) on save.
  const [formData, setFormData] = useState({
    title: '', description: '', instructor: '', schedule: '', capacity: ''
  });

  // Initial data load. NOTE: a second, identical useEffect exists below — the
  // two are redundant (both run once on mount, firing the same two fetches
  // twice). Harmless but wasteful; one of them can be safely removed.
  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, []);

  /**
   * Loads all courses (public endpoint).
   */
  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      setMessage('Failed to load courses');
    }
  };

  /**
   * Loads all enrolment records (admin view). Uses optional chaining on the
   * token so it won't throw if `user` briefly isn't ready.
   */
  const fetchEnrollments = async () => {   // plain async function
    try {
      const response = await axiosInstance.get('/api/enrollments/all', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setEnrollments(response.data);
    } catch (error) {
      setMessage('Failed to load enrollments');
    }
  };

  // Redundant duplicate of the mount effect above (see note). Kept as-is to
  // preserve existing behaviour; consider deleting one of the two.
  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, []); 

  /**
   * Submits the course form. Updates an existing course when `editingCourse` is
   * set (PUT), otherwise creates a new one (POST). Resets the form and reloads
   * the course list on success.
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axiosInstance.put(`/api/courses/${editingCourse._id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMessage('Course updated successfully!');
      } else {
        await axiosInstance.post('/api/courses', formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMessage('Course created successfully!');
      }
      // Clear the form + exit edit mode, then refresh the table.
      setFormData({ title: '', description: '', instructor: '', schedule: '', capacity: '' });
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      setMessage('Failed to save course');
    }
  };

  /**
   * Enters edit mode: remembers the course and pre-fills the form from it.
   * @param {Object} course
   */
  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      schedule: course.schedule,
      capacity: course.capacity
    });
  };

  /**
   * Deletes a course after a confirm() prompt, then refreshes the list.
   * Backend cascades the delete to the course's enrolment records.
   * @param {string} courseId
   */
  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await axiosInstance.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage('Course deleted successfully!');
      fetchCourses();
    } catch (error) {
      setMessage('Failed to delete course');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      {message && (
        <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4">{message}</div>
      )}

      {/* ── Section 1: Course create/edit form ── */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {editingCourse ? 'Edit Course' : 'Create New Course'}
        </h2>
        <form onSubmit={handleSubmit}>
          {/* All fields are controlled + required (HTML5 validation). */}
          <input
            type="text"
            placeholder="Course Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Instructor Name"
            value={formData.instructor}
            onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Schedule (e.g. Monday 9am-11am)"
            value={formData.schedule}
            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              {editingCourse ? 'Update Course' : 'Create Course'}
            </button>
            {/* Cancel only appears in edit mode: clears the form + exits edit mode. */}
            {editingCourse && (
              <button
                type="button"
                onClick={() => { setEditingCourse(null); setFormData({ title: '', description: '', instructor: '', schedule: '', capacity: '' }); }}
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Section 2: All courses table with row actions ── */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">All Courses</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Title</th>
              <th className="p-3">Instructor</th>
              <th className="p-3">Schedule</th>
              <th className="p-3">Enrolled</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id} className="border-t">
                <td className="p-3">{course.title}</td>
                <td className="p-3">{course.instructor}</td>
                <td className="p-3">{course.schedule}</td>
                <td className="p-3">{course.enrolled}/{course.capacity}</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Section 3: All enrolments (read-only) ── */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">All Enrollments</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Student</th>
              <th className="p-3">Email</th>
              <th className="p-3">Course</th>
              <th className="p-3">Instructor</th>
            </tr>
          </thead>
          <tbody>
            {/* student/course are populated sub-docs; optional chaining guards any
                enrolment whose referenced doc was removed. */}
            {enrollments.map((enrollment) => (
              <tr key={enrollment._id} className="border-t">
                <td className="p-3">{enrollment.student?.name}</td>
                <td className="p-3">{enrollment.student?.email}</td>
                <td className="p-3">{enrollment.course?.title}</td>
                <td className="p-3">{enrollment.course?.instructor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
