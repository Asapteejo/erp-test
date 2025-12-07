// src/pages/school/SchoolRoute.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

const SchoolRoute = () => {
  const { subdomain } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-teal-700 mb-4">
        Welcome to {subdomain.toUpperCase()}
      </h1>
      <p className="text-gray-600">
        This is the public landing page for <strong>{subdomain}</strong>
      </p>
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <p>Apply, view programs, pay fees — all here.</p>
        <button className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">
          Apply Now
        </button>
      </div>
    </div>
  );
};

export default SchoolRoute;