/**
 * @file AuthContext.js
 * @description Global authentication state using React's Context API.
 *
 * Provides the logged-in user object plus login() / logout() helpers to the
 * entire component tree, so any component can call useAuth() instead of having
 * the user threaded down through props.
 *
 * PERSISTENCE: The user (including their JWT) is mirrored to localStorage so a
 * page refresh does not log the user out. On first load the provider rehydrates
 * its state from localStorage; login() writes to it and logout() clears it.
 *
 * SECURITY NOTE: Storing a JWT in localStorage is convenient but readable by any
 * script on the page (XSS exposure). It is acceptable for this assignment's
 * scope; a production app would typically prefer an httpOnly cookie.
 */

import React, { createContext, useState, useContext } from 'react';

// The context object itself — consumed indirectly through the useAuth() hook.
const AuthContext = createContext();

/**
 * AuthProvider — wraps the app (in index.js) and supplies auth state/actions.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The subtree that gets access to auth.
 */
export const AuthProvider = ({ children }) => {
  // Lazy initialiser: runs once on mount to rehydrate the user from localStorage.
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null; // rehydrate on load, or start logged out
  });

  /**
   * Logs a user in: stores the returned user object (with token) in state and
   * persists it so the session survives a refresh.
   * @param {Object} userData - The API response from /api/auth/login (id, name, email, role, token).
   */
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // persist
  };

  /**
   * Logs the user out: clears both React state and the persisted copy.
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user'); // clear
  };

  // Expose the user and the two actions to all descendants.
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — convenience hook so components can read auth state without importing
 * the context object directly.
 * @returns {{ user: Object|null, login: Function, logout: Function }}
 */
export const useAuth = () => useContext(AuthContext);
