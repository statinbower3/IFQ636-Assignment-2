/**
 * @file index.js
 * @description React application entry point.
 *
 * Bootstraps the React tree into the DOM node <div id="root"> (defined in
 * public/index.html) and wraps the whole app in two providers:
 *
 *   1. <React.StrictMode> — a development-only helper that double-invokes
 *      lifecycle logic to surface unsafe side effects. It renders nothing.
 *   2. <AuthProvider>     — makes the global auth state (current user, login,
 *      logout) available to every component via the useAuth() hook. It is placed
 *      ABOVE <App /> so that routing and every page can read the logged-in user.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// React 18 concurrent root — replaces the legacy ReactDOM.render().
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* AuthProvider must wrap App so useAuth() works anywhere in the tree. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
