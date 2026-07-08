/**
 * @file Register.jsx
 * @description Registration page — creates a new (student) account.
 *
 * FLOW: submit → POST /api/auth/register → on success alert + redirect to /login.
 * New accounts default to the 'student' role on the backend; the password is
 * bcrypt-hashed by a Mongoose pre-save hook (see backend/models/User.js).
 * Note: registration does NOT auto-login — the user is sent to the login page.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Register = () => {
  // Controlled form state for the sign-up fields.
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  /**
   * Creates the account, then redirects to the login page.
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      alert('Password is weak. Must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
      return;
    }
    try {
      await axiosInstance.post('/api/auth/register', formData);
      alert('Registration successful. Please log in.');
      navigate('/login');
    } catch (error) {
      // Typically a 400 when the email already exists.
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
