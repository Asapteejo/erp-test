// src/components/admin/AdminDepartments.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', hodName: '', email: '', phone: '', established: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/public/departments')
      .then(res => {
        setDepartments(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching departments:', err);
        setError('Failed to load departments');
        setLoading(false);
      });
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'established' ? parseInt(value) : value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/departments', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('Department created!');
      setForm({ name: '', description: '', hodName: '', email: '', phone: '', established: '' });
      const res = await axios.get('/api/public/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Error creating department:', err);
      alert('Error creating department.');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await axios.delete(`/api/admin/departments/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setDepartments(departments.filter(d => d.id !== id));
      alert('Department deleted!');
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Error deleting department.');
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
      <h2 className="text-2xl font-semibold text-gray-800">Manage Departments</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input
          name="name"
          placeholder="Department Name"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.description}
          onChange={handleChange}
        />
        <input
          name="hodName"
          placeholder="Head of Department"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.hodName}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="Contact Email"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="phone"
          placeholder="Contact Phone"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          name="established"
          type="number"
          placeholder="Year Established"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.established}
          onChange={handleChange}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Department
        </button>
      </form>
      <div className="space-y-4">
        {departments.length === 0 ? (
          <p className="text-gray-600">No departments available.</p>
        ) : (
          departments.map(dept => (
            <div key={dept.id} className="p-4 border rounded bg-white shadow flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{dept.name}</h3>
                <p className="text-gray-600">{dept.description?.slice(0, 100) || 'No description.'}...</p>
                <p className="text-gray-600">Head: {dept.hodName || 'N/A'}</p>
              </div>
              <button
                onClick={() => handleDelete(dept.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default AdminDepartments;
