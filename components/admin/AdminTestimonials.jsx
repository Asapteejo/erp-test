// src/components/admin/AdminTestimonials.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/public/testimonials', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }),
      axios.get('/api/public/testimonials/submissions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }),
    ])
      .then(([testRes, subRes]) => {
        setTestimonials(testRes.data);
        setSubmissions(subRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError('Failed to load testimonials');
        setLoading(false);
      });
  }, []);

  const handleApprove = async id => {
    try {
      await axios.post(`/api/admin/testimonials/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSubmissions(submissions.filter(s => s.id !== id));
      const res = await axios.get('/api/public/testimonials', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTestimonials(res.data);
      alert('Testimonial approved!');
    } catch (err) {
      console.error('Error approving testimonial:', err);
      alert('Error approving testimonial.');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await axios.delete(`/api/admin/testimonials/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTestimonials(testimonials.filter(t => t.id !== id));
      alert('Testimonial deleted!');
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      alert('Error deleting testimonial.');
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
      <h2 className="text-2xl font-semibold text-gray-800">Testimonial Management</h2>
      <h3 className="text-xl font-semibold text-gray-700">Pending Submissions</h3>
      {submissions.length === 0 ? (
        <p className="text-gray-600">No pending submissions.</p>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => (
            <div key={sub.id} className="p-4 border rounded bg-white shadow">
              <p><strong>Name:</strong> {sub.name}</p>
              <p><strong>Role:</strong> {sub.role || 'N/A'}</p>
              <p><strong>Message:</strong> {sub.message}</p>
              {sub.imageUrl && <img src={sub.imageUrl} alt={sub.name} className="w-16 h-16 rounded-full mt-2" />}
              <button
                onClick={() => handleApprove(sub.id)}
                className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-700 mt-6">Published Testimonials</h3>
      {testimonials.length === 0 ? (
        <p className="text-gray-600">No testimonials available.</p>
      ) : (
        <div className="space-y-4">
          {testimonials.map(item => (
            <div key={item.id} className="p-4 border rounded bg-white shadow flex justify-between items-center">
              <div>
                <p><strong>Name:</strong> {item.name}</p>
                <p><strong>Role:</strong> {item.role || 'N/A'}</p>
                <p><strong>Message:</strong> {item.message}</p>
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-full mt-2" />}
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminTestimonials;
