// src/components/admin/AdminCourses.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ code: '', title: '', creditUnit: '', departmentId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/courses', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
      axios.get('/api/public/departments'),
    ])
      .then(([coursesRes, deptRes]) => {
        setCourses(coursesRes.data);
        setDepartments(deptRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError('Failed to load courses');
        setLoading(false);
      });
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'creditUnit' ? parseInt(value) : value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/course', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('Course created!');
      setForm({ code: '', title: '', creditUnit: '', departmentId: '' });
      const res = await axios.get('/api/admin/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCourses(res.data);
    } catch (err) {
      console.error('Error creating course:', err);
      alert('Error creating course.');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await axios.delete(`/api/admin/courses/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCourses(courses.filter(c => c.id !== id));
      alert('Course deleted!');
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Error deleting course.');
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
      <h2 className="text-2xl font-semibold text-gray-800">Manage Courses</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input
          name="code"
          placeholder="Course Code (e.g., BIO101)"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.code}
          onChange={handleChange}
          required
        />
        <input
          name="title"
          placeholder="Course Title"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          name="creditUnit"
          type="number"
          placeholder="Credit Units"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.creditUnit}
          onChange={handleChange}
          required
        />
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
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Course
        </button>
      </form>
      <div className="space-y-4">
        {courses.length === 0 ? (
          <p className="text-gray-600">No courses available.</p>
        ) : (
          courses.map(c => (
            <div key={c.id} className="p-4 border rounded bg-white shadow flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{c.code} – {c.title}</h3>
                <p className="text-gray-600">Credits: {c.creditUnit} | Department: {c.department?.name || 'N/A'}</p>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
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

export default AdminCourses;
