// src/pages/superadmin/CreateSchool.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useClerkAuth } from '../../hooks/useClerkAuth';

const TIERS = [
  { id: 'basic', name: 'Basic', price: '$49/mo', features: '2 Programs, Classic Layout' },
  { id: 'pro', name: 'Pro', price: '$99/mo', features: '5 Programs, Modern Layout, Fonts' },
  { id: 'premium', name: 'Premium', price: '$199/mo', features: 'Unlimited, Minimal Layout, Video' },
];

const CreateSchool = () => {
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const [form, setForm] = useState({
    name: '',
    tier: 'basic',
    adminEmail: '',
  });
  const [loading, setLoading] = useState(false);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.adminEmail) return toast.error('Fill all fields');

    setLoading(true);
    try {
      const token = await getToken();
      const slug = generateSlug(form.name);

      const res = await fetch('/api/saas/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          slug,
          tier: form.tier,
          adminEmail: form.adminEmail,
        }),
      });

      if (!res.ok) throw new Error('Failed to create');

      const data = await res.json();
      toast.success(`School created: /${slug}`);
      navigate('/saas/schools');
    } catch (err) {
      toast.error('Failed. Check console.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-teal-700 mb-8"
      >
        Create New School
      </motion.h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
            placeholder="Azmah College of Health Science"
            required
          />
          {form.name && (
            <p className="text-xs text-gray-500 mt-1">Portal: /{generateSlug(form.name)}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Tier</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <label
                key={tier.id}
                className={`block p-4 rounded-lg border-2 cursor-pointer transition ${
                  form.tier === tier.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={tier.id}
                  checked={form.tier === tier.id}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  className="sr-only"
                />
                <div className="font-semibold">{tier.name}</div>
                <div className="text-sm text-gray-600">{tier.price}</div>
                <div className="text-xs text-gray-500 mt-1">{tier.features}</div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Admin Email
          </label>
          <input
            type="email"
            value={form.adminEmail}
            onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
            placeholder="admin@azmah.com"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            An invite link will be sent to this email.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {loading ? 'Creating...' : 'Create School & Send Invite'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/saas/schools')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSchool;