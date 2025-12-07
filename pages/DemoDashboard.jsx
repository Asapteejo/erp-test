import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button.jsx";
import { Card } from "@/components/ui/card.jsx";
import { Dialog } from "@/components/ui/dialog.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Avatar } from "@/components/ui/avatar.jsx";

const DemoDashboard = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'free';

  // 🎯 Dynamic tier data
  const tiers = {
    free: {
      label: 'Free Plan',
      color: 'bg-gray-500',
      features: [
        { title: '3 Pre-loaded CBT Tests', desc: 'Math, English, Science', color: 'bg-gray-400' },
        { title: '50 Demo Students', desc: 'Auto-graded results', color: 'bg-gray-500' },
        { title: 'Basic Analytics', desc: 'Simple pass/fail overview', color: 'bg-gray-600' },
      ],
      notice: 'Limited access — upgrade to unlock more tests, schools, and reports.'
    },
    pro: {
      label: 'Pro Plan',
      color: 'bg-blue-500',
      features: [
        { title: '10 CBT Tests', desc: 'Custom subjects + results tracking', color: 'bg-blue-400' },
        { title: '200 Students', desc: 'Automated grading & analytics', color: 'bg-blue-500' },
        { title: 'Advanced Analytics', desc: 'Performance graphs & insights', color: 'bg-blue-600' },
      ],
      notice: 'You’re previewing Pro Plan — real usage requires a valid subscription.'
    },
    premium: {
      label: 'Premium Plan',
      color: 'bg-teal-500',
      features: [
        { title: 'Unlimited CBT Tests', desc: 'Create, manage, and analyze freely', color: 'bg-teal-400' },
        { title: 'Unlimited Students', desc: 'Full admin control', color: 'bg-teal-500' },
        { title: 'Full Analytics Suite', desc: 'Charts, exports, and GPA tracking', color: 'bg-teal-600' },
      ],
      notice: 'You’re previewing the Premium Plan — full experience after payment.'
    },
  };

  const activeTier = tiers[plan] || tiers.free;

  // Chart data
  const data = [
    { name: 'Passed', value: 65 },
    { name: 'Failed', value: 35 },
  ];
  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-50">
      <motion.h1
        className="text-4xl font-bold text-center mb-8 text-teal-600"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        🎮 TEEBOT ACADION SAAS - {activeTier.label} DEMO MODE
      </motion.h1>

      {/* Plan Notice */}
      <motion.div
        className={`${activeTier.color} text-white p-4 rounded-xl mb-10 text-center shadow-md`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="font-medium text-lg">{activeTier.notice}</p>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {activeTier.features.map((item, idx) => (
          <motion.div
            key={idx}
            className={`${item.color} text-white p-6 rounded-xl shadow-lg`}
            whileHover={{ scale: 1.05 }}
          >
            <h2 className="text-2xl font-bold">{item.title}</h2>
            <p className="text-teal-100">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts and Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <motion.div
          className="p-6 bg-white rounded-xl shadow border border-gray-100"
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="font-semibold text-lg mb-4 text-gray-800">📊 Pass Rate Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} dataKey="value" outerRadius={80} label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="p-6 bg-white rounded-xl shadow border border-gray-100 flex flex-col justify-between"
          whileHover={{ scale: 1.02 }}
        >
          <div>
            <h3 className="font-semibold text-lg mb-4 text-gray-800">⚠️ Demo Limit Notice</h3>
            <p className="text-gray-600 mb-4">
              This is a simulated preview of <strong>{activeTier.label}</strong>. 
              Your data won’t be saved — it’s for exploration only.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => (window.location.href = '/#pricing')}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              🚀 Upgrade Plan
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
            >
              🏠 Return Home
            </Button>
          </div>
        </motion.div>
      </div>
        {/* Paystack Payment Button */}
{(plan === 'pro' || plan === 'premium') && (
  <motion.div
    className="p-6 bg-white rounded-xl shadow border border-gray-100 mb-10 text-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.4 }}
  >
    <h3 className="font-semibold text-lg mb-4 text-gray-800">💳 Complete Your Subscription</h3>
    <p className="text-gray-600 mb-6">
      You’re currently previewing the <strong>{activeTier.label}</strong>. 
      Click below to make a secure payment via Paystack and unlock full access.
    </p>

    <Button
      onClick={() => {
        const paystackLinks = {
          pro: "https://paystack.com/pay/your-pro-plan-link",
          premium: "https://paystack.com/pay/your-premium-plan-link",
        };
        window.location.href = paystackLinks[plan];
      }}
      className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold"
    >
      Proceed to {activeTier.label} Payment
    </Button>
  </motion.div>
)}

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.button
          className="bg-teal-600 text-white py-4 px-8 rounded-lg text-xl w-full"
          whileHover={{ scale: 1.05 }}
          onClick={() => (window.location.href = '/admin')}
        >
          🏫 START ADMIN TEST
        </motion.button>
        <motion.button
          className="bg-purple-600 text-white py-4 px-8 rounded-lg text-xl w-full"
          whileHover={{ scale: 1.05 }}
          onClick={() => (window.location.href = '/sign-in')}
        >
          👨‍🎓 TAKE STUDENT TEST
        </motion.button>
      </div>

      {/* Demo Users */}
      <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-bold text-yellow-800 text-lg mb-2">📋 DEMO USERS (Copy & Paste):</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-yellow-900">Admin:</strong><br />
            <code className="bg-yellow-100 p-1 rounded">school1@azmah.com</code><br />
            <code className="bg-yellow-100 p-1 rounded">school123</code><br /><br />
            <strong>Go to:</strong> <code>/admin</code>
          </div>
          <div>
            <strong className="text-yellow-900">Student:</strong><br />
            <code className="bg-yellow-100 p-1 rounded">student@azmah.com</code><br />
            <code className="bg-yellow-100 p-1 rounded">student123</code><br /><br />
            <strong>Go to:</strong> <code>/sign-in</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoDashboard;
