// src/components/admin/AdminFAQs.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState({ question: '', answer: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/public/faqs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(res => {
        setFaqs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching FAQs:', err);
        setError('Failed to load FAQs');
        setLoading(false);
      });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/faqs', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('FAQ added!');
      setForm({ question: '', answer: '' });
      const res = await axios.get('/api/public/faqs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFaqs(res.data);
    } catch (err) {
      console.error('Error creating FAQ:', err);
      alert('Error creating FAQ.');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await axios.delete(`/api/admin/faqs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFaqs(faqs.filter(f => f.id !== id));
      alert('FAQ deleted!');
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      alert('Error deleting FAQ.');
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
      <h2 className="text-2xl font-semibold text-gray-800">Manage FAQs</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input
          name="question"
          placeholder="Question"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.question}
          onChange={handleChange}
          required
        />
        <textarea
          name="answer"
          placeholder="Answer"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.answer}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add FAQ
        </button>
      </form>
      <div className="space-y-4">
        {faqs.length === 0 ? (
          <p className="text-gray-600">No FAQs available.</p>
        ) : (
          faqs.map(faq => (
            <div key={faq.id} className="p-4 border rounded bg-white shadow flex justify-between items-center">
              <div>
                <p><strong>Question:</strong> {faq.question}</p>
                <p><strong>Answer:</strong> {faq.answer}</p>
              </div>
              <button
                onClick={() => handleDelete(faq.id)}
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

export default AdminFAQs;
