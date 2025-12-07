// src/pages/superadmin/SchoolList.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import useSWR from 'swr';

// FETCHER WITH AUTH
const fetcher = async (url, getToken) => {
  const token = await getToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const SchoolList = () => {
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const [page, setPage] = useState(1);
  const perPage = 10;

  // SWR: AUTO-CACHE + DEBOUNCE
  const { data, error, isLoading, mutate } = useSWR(
    `/api/saas/v1/schools?page=${page}&perPage=${perPage}`,
    (url) => fetcher(url, getToken),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,     // Only refetch every 5s
      refreshInterval: 0,         // No auto-refresh
      onError: () => toast.error('Failed to load schools'),
    }
  );

  const upgradeTier = async (subdomain, tier) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/saas/schools/${subdomain}/tier`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) throw new Error();

      toast.success(`Upgraded to ${tier.toUpperCase()}`);
      
      // Optimistic update + refresh cache
      mutate((currentData) => {
        if (!currentData?.schools) return currentData;
        return {
          ...currentData,
          schools: currentData.schools.map((sc) =>
            sc.subdomain === subdomain ? { ...sc, subscriptionTier: tier } : sc
          ),
        };
      }, false);

      // Revalidate after 1s
      setTimeout(() => mutate(), 1000);
    } catch (err) {
      toast.error('Failed to upgrade tier');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load schools. <button onClick={() => mutate()} className="underline">Retry</button>
      </div>
    );
  }

  const { schools = [], total = 0, totalPages = 1 } = data || {};

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-teal-700">All Schools</h1>
        <button
          onClick={() => navigate('/saas/schools/create')}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition"
        >
          + Create School
        </button>
      </motion.div>

      <div className="grid gap-6">
        {schools.length > 0 ? (
          schools.map((school, i) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl shadow-md p-6 flex justify-between items-center hover:shadow-lg transition"
            >
              <div>
                <h3 className="text-xl font-semibold">{school.name}</h3>
                <p className="text-sm text-gray-500">/{school.subdomain}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Auto-Approved
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    school.subscriptionTier === 'premium'
                      ? 'bg-purple-100 text-purple-700'
                      : school.subscriptionTier === 'pro'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {school.subscriptionTier.toUpperCase()}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => upgradeTier(school.subdomain, 'pro')}
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                  >
                    Pro
                  </button>
                  <button
                    onClick={() => upgradeTier(school.subdomain, 'premium')}
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                  >
                    Premium
                  </button>
                </div>
                <a
                  href={`/${school.subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline text-sm font-medium"
                >
                  View
                </a>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">No schools found</div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SchoolList;