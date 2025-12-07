import { useEffect, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Tabs, Tab, Box } from '@mui/material';
import { motion } from 'framer-motion';
import ReactGA from 'react-ga4';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Academics = () => {
  const [content, setContent] = useState({});
  const [courses, setCourses] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE_URL}/api/page/academics-structure`).catch(() => ({ data: {} })),
      axios.get(`${API_BASE_URL}/api/page/academics-requirements`).catch(() => ({ data: {} })),
      axios.get(`${API_BASE_URL}/api/courses`),
    ])
      .then(([structure, requirements, courses]) => {
        setContent({
          structure: structure.data,
          requirements: requirements.data,
        });
        setCourses(Array.isArray(courses.data) ? courses.data : []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch data:', error);
        setError('Failed to load academic content. Please try again later.');
        setLoading(false);
      });
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    ReactGA.event({ category: 'Academics', action: 'Tab Change', label: ['Program Structure', 'Courses Offered', 'Admission Requirements'][newValue] });
  };

  const departments = [...new Set(courses.map(c => c.department?.name))];

  if (loading) return <p className="text-center text-gray-500 py-8">Loading...</p>;
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Helmet>
        <title>Academic Programs | Azmah College of Health Science and Technology</title>
        <meta name="description" content="Explore academic programs, courses, and admission requirements at Azmah College of Health Science." />
        <meta name="keywords" content="Azmah College, academics, health science, courses" />
      </Helmet>

      <motion.h1
        className="text-4xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Academic Programs
      </motion.h1>

      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 4 }}>
        <Tab label="Program Structure" />
        <Tab label="Courses Offered" />
        <Tab label="Admission Requirements" />
      </Tabs>

      <Box>
        {tabValue === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{content.structure?.title || 'Program Structure'}</h2>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content.structure?.content || 'No program structure available.' }}
            />
          </motion.div>
        )}
        {tabValue === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Courses Offered</h2>
            <div className="mb-4">
              <select
                onChange={e => {
                  setFilter(e.target.value);
                  ReactGA.event({ category: 'Academics', action: 'Filter', label: e.target.value });
                }}
                className="p-2 border rounded"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            {courses.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {courses
                  .filter(c => filter === 'all' || c.department?.name === filter)
                  .map(course => (
                    <motion.div
                      key={course.id}
                      className="border rounded-lg p-6 shadow-md hover:shadow-lg transition"
                      whileHover={{ scale: 1.05 }}
                    >
                      <h3 className="text-xl font-semibold mb-2">{course.title} ({course.code})</h3>
                      <p className="text-gray-700">Credits: {course.creditUnit}</p>
                      <p className="text-gray-700">Department: {course.department?.name || 'N/A'}</p>
                    </motion.div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600">No courses available.</p>
            )}
          </motion.div>
        )}
        {tabValue === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{content.requirements?.title || 'Admission Requirements'}</h2>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content.requirements?.content || 'No admission requirements available.' }}
            />
          </motion.div>
        )}
      </Box>
    </div>
  );
};

export default Academics;