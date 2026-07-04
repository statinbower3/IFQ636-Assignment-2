/**
 * @file CourseList.jsx
 * @description Public course browser + enrolment action. Also the app's landing page.
 *
 * FLOW:
 *   - On mount → GET /api/courses (public) to list all courses in a card grid.
 *   - Enrol (logged-in users only) → POST /api/enrollments/:courseId with the
 *     Bearer token, then re-fetch the list so the enrolled/capacity counter and
 *     the "Course Full" state stay accurate.
 * The Enrol button is disabled when enrolled >= capacity. Backend-side, the
 * enrolment is handled by the Facade pattern (RegistrationFacade), which also
 * enforces capacity/duplicate checks and fires Observer events.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const CourseList = () => {
  const { user } = useAuth();                    // gate the Enrol button + supply token
  const [courses, setCourses] = useState([]);    // course list from the API
  const [message, setMessage] = useState('');    // inline status/error banner text

  // Load all courses once on mount (public endpoint — no token needed).
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axiosInstance.get('/api/courses');
        setCourses(response.data);
      } catch (error) {
        setMessage('Failed to load courses');
      }
    };
    fetchCourses();
  }, []);

  /**
   * Enrols the current user in a course, then refreshes the list so the
   * enrolled/capacity numbers update. Surfaces the backend's error message
   * (e.g. "Course is full", "Already enrolled") when present.
   * @param {string} courseId
   */
  const handleEnroll = async (courseId) => {
    try {
      await axiosInstance.post(`/api/enrollments/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage('Successfully enrolled!');
      // Re-fetch so the seat counter / "Course Full" state reflects the change.
      const response = await axiosInstance.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      // Prefer the API's message; fall back to a generic one.
      setMessage(error.response?.data?.message || 'Enrollment failed');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Available Courses</h1>
      {/* Status banner (success or error). */}
      {message && (
        <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4">{message}</div>
      )}
      {/* Responsive card grid: 1 / 2 / 3 columns by breakpoint. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course._id} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-2">{course.title}</h2>
            <p className="text-gray-600 mb-2">{course.description}</p>
            <p className="text-sm text-gray-500 mb-1">👨‍🏫 {course.instructor}</p>
            <p className="text-sm text-gray-500 mb-1">📅 {course.schedule}</p>
            <p className="text-sm text-gray-500 mb-4">
              👥 {course.enrolled}/{course.capacity} enrolled
            </p>
            {/* Enrol button only for authenticated users; disabled when full. */}
            {user && (
              <button
                onClick={() => handleEnroll(course._id)}
                disabled={course.enrolled >= course.capacity}
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {course.enrolled >= course.capacity ? 'Course Full' : 'Enroll'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseList;
