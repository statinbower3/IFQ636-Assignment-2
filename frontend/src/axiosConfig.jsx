/**
 * @file axiosConfig.jsx
 * @description Shared Axios instance used by every page/component that talks to
 *              the backend API.
 *
 * Centralising the configuration here means:
 *   - The API base URL is defined in ONE place (swap between local and live by
 *     toggling the two baseURL lines below).
 *   - The default 'Content-Type: application/json' header is applied to every
 *     request automatically.
 *
 * NOTE ON AUTH: This instance does NOT attach the JWT globally. Protected calls
 * pass the token per-request via an Authorization header, e.g.
 *   axiosInstance.get('/api/...', { headers: { Authorization: `Bearer ${user.token}` } })
 * (See Profile.jsx, CourseList.jsx, MyCourses.jsx, AdminPanel.jsx.)
 */

import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: 'http://localhost:5001', // local  — uncomment for local development
  baseURL: 'http://3.107.114.224:5001', // live   — EC2 public IP, backend on port 5001
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
