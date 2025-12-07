// src/components/admin/AdminUsers.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', departmentId: '', level: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
      axios.get('/api/public/departments'),
    ])
      .then(([usersRes, deptRes]) => {
        setUsers(usersRes.data);
        setDepartments(deptRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError('Failed to load users');
        setLoading(false);
      });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/user', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('User created!');
      setForm({ name: '', email: '', password: '', role: '', departmentId: '', level: '' });
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Error creating user.');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold text-gray-800">Manage Users</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input
          name="name"
          placeholder="Name"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          placeholder="Email"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.password}
          onChange={handleChange}
          required
        />
        <select
          name="role"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.role}
          onChange={handleChange}
          required
        >
          <option value="">Select Role</option>
          <option value="STUDENT">Student</option>
          <option value="LECTURER">Lecturer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          name="departmentId"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.departmentId}
          onChange={handleChange}
        >
          <option value="">Select Department (optional)</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input
          name="level"
          placeholder="Level (e.g., 100)"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.level}
          onChange={handleChange}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create User
        </button>
      </form>
      <div className="space-y-4">
        {users.map(u => (
          <div key={u.id} className="p-4 border rounded bg-white shadow">
            {u.name} – {u.role} {u.department?.name ? `(${u.department.name}, ${u.level} level)` : ''}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AdminUsers;
