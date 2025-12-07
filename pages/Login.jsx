import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useClerkAuth';
import { Helmet } from 'react-helmet-async';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // New: School state from localStorage (ties to App.jsx selector)
  const [selectedSchool, setSelectedSchool] = useState(localStorage.getItem('selectedSchool') || '');
  const [showSchoolSelector, setShowSchoolSelector] = useState(!selectedSchool);

  useEffect(() => {
    if (user?.role && !isLoading) {
      console.log('Navigating based on role:', user.role);
      const target =
        user.role === 'ADMIN' ? '/admin' :
        user.role === 'STUDENT' ? '/student-portal' :
        '/lecturer-portal';
      navigate(target, { replace: true });
    }
  }, [user?.role, navigate, isLoading]);

  const handleSchoolSelect = (e) => {
    const school = e.target.value;
    setSelectedSchool(school);
    localStorage.setItem('selectedSchool', school); // Sync with App.jsx
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called! Email:', email);
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    console.log('Submitting login with:', { email });
    try {
      await login(email, password);
      setIsLoading(false);
    } catch (err) {
      console.error('Login failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (showSchoolSelector) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4 text-center">Select Your School</h2>
          <select 
            value={selectedSchool}
            onChange={handleSchoolSelect}
            className="w-full border rounded px-3 py-2 mb-4 text-sm"
            required
          >
            <option value="">Choose a school...</option>
            <option value="azmah-college">Azmah College of Health Science</option>
            <option value="high-school-x">High School X</option>
            {/* Add more options as schools sign up */}
          </select>
          <button 
            onClick={() => setShowSchoolSelector(false)}
            disabled={!selectedSchool}
            className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue to Login
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            New school? <Link to="/contact" className="text-blue-600">Contact us</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Helmet>
        <title>Login - {selectedSchool ? selectedSchool.toUpperCase() : 'Azmah'} Portal</title>
      </Helmet>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Welcome to {selectedSchool || 'Azmah'} Portal</h3>
        <p className="text-sm text-gray-500">School: {selectedSchool}</p>
        <button 
          onClick={() => setShowSchoolSelector(true)}
          className="text-blue-600 hover:underline text-sm mt-2"
        >
          Change School
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 disabled:bg-blue-300"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="mt-4 text-center">
        Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
      </p>
    </div>
  );
};

export default Login;