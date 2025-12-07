// components/admin/AdminLayout.jsx
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../../hooks/useClerkAuth'; // Adjusted path if needed
import { motion } from 'framer-motion';

const AdminLayout = () => {
  const { user, logout, role } = useClerkAuth(); // Updated to include role
  const navigate = useNavigate();

  // Check for SUPER_ADMIN role
  if (!user || role !== 'SUPER_ADMIN') {
    console.log('Unauthorized access to AdminLayout, redirecting:', role);
    navigate('/unauthorized');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <motion.aside
        className="bg-blue-900 text-white w-64 p-6"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          {[
            { path: '/admin', label: 'Dashboard' },
            { path: '/admin/users', label: 'Users' },
            { path: '/admin/courses', label: 'Courses' },
            { path: '/admin/news', label: 'News' },
            { path: '/admin/departments', label: 'Departments' },
            { path: '/admin/testimonials', label: 'Testimonials' },
            { path: '/admin/accreditations', label: 'Accreditations' },
            { path: '/admin/contact-submissions', label: 'Contact Submissions' },
            { path: '/admin/applications', label: 'Applications' },
            { path: '/admin/cbt', label: 'CBT Manager' },
            { path: '/admin/cbt-results', label: 'CBT Results' },
            { path: '/admin/transcripts', label: 'Transcript Payments' },
            { path: '/admin/fees', label: 'School/Hostel Fees' },
            { path: '/admin/events', label: 'Event Ticketing' },
          ].map((link) => (
            <React.Fragment key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded transition ${
                    isActive ? 'bg-blue-700' : 'hover:bg-blue-800'
                  }`
                }
              >
                {link.label}
              </NavLink>
              {link.path === '/admin/events' && (
                <NavLink
                  to="/admin/tour-locations"
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded transition ${
                      isActive ? 'bg-blue-700' : 'hover:bg-blue-800'
                    }`
                  }
                >
                  Tour Locations
                </NavLink>
              )}
            </React.Fragment>
          ))}
          <NavLink
            to="/saas/dashboard"
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition ${isActive ? 'bg-blue-700' : 'hover:bg-blue-800'}`
            }
          >
            SaaS Dashboard
          </NavLink>
          <NavLink
            to="/admin/faqs"
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition ${isActive ? 'bg-blue-700' : 'hover:bg-blue-800'}`
            }
          >
            FAQs
          </NavLink>
        </nav>
        <button
          onClick={logout}
          className="mt-6 w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </motion.aside>
      <main className="flex-1 p-6">
        <motion.h1
          className="text-3xl font-bold mb-6 text-blue-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Admin Dashboard
        </motion.h1>
        <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
          <Outlet />
        </React.Suspense>
      </main>
    </div>
  );
};

export default AdminLayout;
