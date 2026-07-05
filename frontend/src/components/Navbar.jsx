/**
 * @file Navbar.jsx
 * @description Persistent top navigation bar, rendered on every route by App.js.
 *
 * The links shown are role-aware:
 *   - Logged out        → Login, Register.
 *   - Logged in (any)   → Courses, My Courses, Profile, Logout.
 *   - Logged in (admin) → additionally shows the Admin link.
 *
 * Reads the current user from AuthContext; logging out clears auth state and
 * redirects to the login page.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();   // current user + logout action from context
  const navigate = useNavigate();       // programmatic redirect after logout

  /**
   * Clears the session then sends the user to the login page.
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      {/* Brand / home link. */}
      <Link to="/" className="text-2xl font-bold">Course Registration</Link>
      <div>
        {/* Conditional rendering: authenticated vs guest link sets. */}
        {user ? (
          <>
            <Link to="/courses" className="mr-4">Courses</Link>
            <Link to="/my-courses" className="mr-4">My Courses</Link>
            {/* Admin link only for admin role. */}
            {user.role === 'admin' && (
              <Link to="/admin" className="mr-4">Admin</Link>
            )}
            <Link to="/profile" className="mr-4">Profile</Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4">Login</Link>
            <Link
              to="/register"
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
