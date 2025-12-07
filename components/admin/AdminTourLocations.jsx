// src/components/admin/AdminTourLocations.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminTourLocations = () => {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ name: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/public/tour-locations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(res => {
        setLocations(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tour locations:', err);
        setError('Failed to load tour locations');
        setLoading(false);
      });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/tour-locations', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('Tour location added!');
      setForm({ name: '', imageUrl: '' });
      const res = await axios.get('/api/public/tour-locations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setLocations(res.data);
    } catch (err) {
      console.error('Error creating tour location:', err);
      alert('Error creating tour location.');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this tour location?')) return;
    try {
      await axios.delete(`/api/admin/tour-locations/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setLocations(locations.filter(l => l.id !== id));
      alert('Tour location deleted!');
    } catch (err) {
      console.error('Error deleting tour location:', err);
      alert('Error deleting tour location.');
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
      <h2 className="text-2xl font-semibold text-gray-800">Manage Tour Locations</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input
          name="name"
          placeholder="Location Name (e.g., Lecture Hall)"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="imageUrl"
          placeholder="360° Image URL"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.imageUrl}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Location
        </button>
      </form>
      <div className="space-y-4">
        {locations.length === 0 ? (
          <p className="text-gray-600">No tour locations available.</p>
        ) : (
          locations.map(loc => (
            <div key={loc.id} className="p-4 border rounded bg-white shadow flex justify-between items-center">
              <div>
                <p><strong>Name:</strong> {loc.name}</p>
                <p><strong>Image:</strong> <a href={loc.imageUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a></p>
              </div>
              <button
                onClick={() => handleDelete(loc.id)}
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

export default AdminTourLocations;
