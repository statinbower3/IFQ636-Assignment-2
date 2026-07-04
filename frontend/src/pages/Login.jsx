/**
 * @file Login.jsx
 * @description Login page — authenticates a user and stores the session.
 *
 * FLOW: submit → POST /api/auth/login → on success call context login()
 * (which persists the user + JWT) → redirect to /courses. On failure an alert
 * is shown. The backend hashes/compares passwords with bcrypt and returns a
 * signed JWT; see backend/controllers/authController.js#loginUser.
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Login = () => {
  // Controlled form state for the credentials.
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();     // context action that persists the session
  const navigate = useNavigate();  // redirect after successful login

  /**
   * Sends credentials to the API; on success persists the session and navigates.
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/auth/login', formData);
      login(response.data);   // store user + token in context/localStorage
      navigate('/courses');   // send the user to the course browser
    } catch (error) {
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        {/* Controlled email input. */}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        {/* Controlled password input. */}
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
