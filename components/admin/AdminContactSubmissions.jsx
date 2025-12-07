// src/components/admin/AdminContactSubmissions.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminContactSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await axios.get('/api/public/contact-submissions', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSubmissions(res.data);
      } catch (err) {
        console.error('Error fetching contact submissions:', err);
        setError('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Contact Form Submissions</h1>
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : submissions.length === 0 ? (
        <p className="text-center text-gray-600">No submissions found.</p>
      ) : (
        <div className="space-y-6">
          {submissions.map(submission => (
            <div key={submission.id} className="border p-4 rounded-lg shadow-sm bg-white">
              <p className="text-gray-700"><strong>Name:</strong> {submission.name}</p>
              <p className="text-gray-700"><strong>Email:</strong> {submission.email}</p>
              <p className="text-gray-700"><strong>Message:</strong></p>
              <p className="text-gray-600 whitespace-pre-wrap">{submission.message}</p>
              <p className="text-sm text-gray-500 mt-2">
                Submitted on {new Date(submission.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminContactSubmissions;
