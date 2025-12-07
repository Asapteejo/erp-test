// src/pages/admin/AdminNewsList.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const AdminNewsList = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const response = await axios.get("/api/public/news");
      setNews(response.data);
    } catch (err) {
      console.error("Failed to fetch news", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news post?")) return;

    try {
      await axios.delete(`/api/public/news/${id}`);
      setNews(news.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Error deleting news item.");
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">News Management</h2>
        <Link
          to="/admin/news/new"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Add News
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : news.length === 0 ? (
        <p>No news posts available.</p>
      ) : (
        <table className="w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Title</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {news.map((item) => (
              <tr key={item.id}>
                <td className="border p-2">{item.title}</td>
                <td className="border p-2">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="border p-2 space-x-2">
                  <Link
                    to={`/admin/news/edit/${item.id}`}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminNewsList;
