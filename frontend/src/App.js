/**
 * @file App.js
 * @description Root component — defines the client-side routing table.
 *
 * Uses react-router-dom v6. <Navbar> renders on every page (it lives outside
 * <Routes>), while <Routes> swaps the page component based on the URL path.
 *
 * ROUTE GUARD:
 *   The "/admin" route is protected inline: if the logged-in user is not an
 *   admin, it redirects to "/courses" via <Navigate>. This is a client-side
 *   convenience guard only — the backend independently enforces admin access
 *   through the Proxy pattern and the adminOnly middleware, so the guard here
 *   cannot be bypassed to perform admin actions.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CourseList from './pages/CourseList';
import MyCourses from './pages/MyCourses';
import AdminPanel from './pages/AdminPanel';

function App() {
  // Pull the current user from global auth context to drive the admin guard.
  const { user } = useAuth();

  return (
    <Router>
      {/* Persistent navigation bar shown on all routes. */}
      <Navbar />
      <Routes>
        {/* Public landing + course browser (same component on "/" and "/courses"). */}
        <Route path="/" element={<CourseList />} />
        <Route path="/courses" element={<CourseList />} />

        {/* Student's own enrolments. */}
        <Route path="/my-courses" element={<MyCourses />} />

        {/* Admin-only route: redirect non-admins to the public course list.
            Optional chaining (user?.role) safely handles the logged-out case. */}
        <Route
          path="/admin"
          element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/courses" />}
        />

        {/* Auth + profile routes. */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
