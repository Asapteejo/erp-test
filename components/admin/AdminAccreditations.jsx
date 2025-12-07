// src/components/admin/AdminAccreditations.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminAccreditations = () => {
  const [accreditations, setAccreditations] = useState([]);
  const [form, setForm] = useState({ name: '', imageUrl: '', link: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/admin/accreditations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(res => {
        setAccreditations(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching accreditations:', err);
        setError('Failed to load accreditations');
        setLoading(false);
      });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/accreditations', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('Accreditation added!');
      setForm({ name: '', imageUrl: '', link: '' });
      const res = await axios.get('/api/admin/accreditations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAccreditations(res.data);
    } catch (err) {
      console.error('Error creating accreditation:', err);
      alert('Error creating accreditation.');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this accreditation?')) return;
    try {
      await axios.delete(`/api/admin/accreditations/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAccreditations(accreditations.filter(a => a.id !== id));
      alert('Accreditation deleted!');
    } catch (err) {
      console.error('Error deleting accreditation:', err);
      alert('Error deleting accreditation.');
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
      <h2 className="text-2xl font-semibold text-gray-800">Manage Accreditations</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input
          name="name"
          placeholder="Accreditation Name"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="imageUrl"
          placeholder="Image URL"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.imageUrl}
          onChange={handleChange}
        />
        <input
          name="link"
          placeholder="Accreditation Link"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.link}
          onChange={handleChange}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Accreditation
        </button>
      </form>
      <div className="space-y-4">
        {accreditations.length === 0 ? (
          <p className="text-gray-600">No accreditations available.</p>
        ) : (
          accreditations.map(acc => (
            <div key={acc.id} className="p-4 border rounded bg-white shadow flex justify-between items-center">
              <div>
                <p><strong>Name:</strong> {acc.name}</p>
                {acc.imageUrl && <img src={acc.imageUrl} alt={acc.name} className="w-24 h-24 object-contain mt-2" />}
                {acc.link && (
                  <p>
                    <strong>Link:</strong> <a href={acc.link} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{acc.link}</a>
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(acc.id)}
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

export default AdminAccreditations;
