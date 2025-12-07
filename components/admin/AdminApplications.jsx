// src/components/admin/AdminApplications.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/admin/applications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(res => {
        setApplications(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications');
        setLoading(false);
      });
  }, []);

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await axios.delete(`/api/admin/applications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setApplications(applications.filter(a => a.id !== id));
      alert('Application deleted!');
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Error deleting application.');
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
      <h2 className="text-2xl font-semibold text-gray-800">Manage Applications</h2>
      {applications.length === 0 ? (
        <p className="text-gray-600">No applications available.</p>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="p-4 border rounded bg-white shadow">
              <p><strong>Name:</strong> {app.name}</p>
              <p><strong>Email:</strong> <a href={`mailto:${app.email}`} className="text-blue-600">{app.email}</a></p>
              <p><strong>Program:</strong> {app.program}</p>
              {app.documents && (
                <p>
                  <strong>Documents:</strong>{' '}
                  {JSON.parse(app.documents).map((doc, idx) => (
                    <a key={idx} href={doc} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      Document {idx + 1}
                    </a>
                  ))}
                </p>
              )}
              <p className="text-sm text-gray-500">Submitted on {new Date(app.createdAt).toLocaleString()}</p>
              <button
                onClick={() => handleDelete(app.id)}
                className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
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

export default AdminApplications;
