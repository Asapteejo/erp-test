import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminNewsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '',
    imageUrl: '',
    published: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  useEffect(() => {
    if (id) {
      axios.get(`/api/public/news/${id}`)
        .then(res => {
          setForm(res.data);
          setFetching(false);
        })
        .catch(err => {
          console.error('Failed to fetch news:', err);
          alert('Error fetching news data.');
          setFetching(false);
        });
    } else {
      setFetching(false);
    }
  }, [id]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await axios.put(`/api/public/news/${id}`, form);
        alert('News updated successfully!');
      } else {
        await axios.post('/api/public/news', form);
        alert('News created successfully!');
      }
      navigate('/admin/news');
    } catch (err) {
      console.error('Submit error:', err);
      alert('There was a problem saving the news.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{id ? 'Edit News Post' : 'Create News Post'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          >
            <option value="">Select Category</option>
            <option value="news">News</option>
            <option value="events">Events</option>
            <option value="deadlines">Deadlines</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Image URL</label>
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Content</label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={8}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="published"
              checked={form.published}
              onChange={handleChange}
              className="mr-2"
            />
            Publish Immediately
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Saving...' : id ? 'Update News' : 'Create News'}
        </button>
      </form>
    </div>
  );
};

export default AdminNewsForm;
