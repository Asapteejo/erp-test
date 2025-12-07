
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/public/departments`)
      .then(res => {
        setDepartments(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load departments:', err);
        setError('Failed to load departments. Please try again later.');
        setLoading(false);
      });
  }, []);

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Helmet>
        <title>Departments | Azmah College</title>
        <meta name="description" content="Explore departments at Azmah College of Health Science." />
        <meta name="keywords" content="Azmah College, departments, health science" />
      </Helmet>
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-900">Our Departments</h1>
      {loading ? (
        <p className="text-center text-gray-500">Loading departments...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map(dept => (
            <Link
              to={`/departments/${dept.id}`}
              key={dept.id}
              className="border rounded-lg shadow-sm p-6 bg-white hover:shadow-lg transition"
            >
              {dept.imageUrl ? (
                <img src={dept.imageUrl} alt={dept.name} className="w-full h-48 object-cover rounded mb-4" />
              ) : (
                <i className="fas fa-university fa-3x text-blue-600 mb-4"></i>
              )}
              <h2 className="text-xl font-semibold text-blue-900">{dept.name}</h2>
              <p className="text-gray-700 mt-2">{dept.description?.slice(0, 100) || 'No description provided.'}...</p>
              {dept.hodName && (
                <p className="mt-4 text-sm text-gray-500">
                  Head of Department: <span className="font-medium">{dept.hodName}</span>
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No departments available right now.</p>
      )}
    </motion.div>
  );
};

export default Departments;
