// src/pages/PrivacyPolicy.jsx
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Shield, Lock, Heart, Users, Globe, Mail, 
  HeartHandshake, Sparkles, ThumbsUp, X } from 'lucide-react';

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <Helmet>
      <title>Privacy Policy • TeeBot Acadion</title>
      <meta name="description" content="We protect your school and student data like our own family." />
    </Helmet>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="max-w-5xl mx-auto px-6 py-16"
    >
      {/* Hero Trust Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl mb-8">
          <Shield size={28} />
          Your Data Is Safe With Us
        </div>
        <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Privacy Policy
        </h1>
        <p className="text-xl text-gray-600">Last updated: November 25, 2025</p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 md:p-16 border border-white/50">
        <div className="prose prose-lg max-w-none">
          <p className="text-xl leading-relaxed text-gray-700 mb-10">
            At <span className="font-bold text-purple-600">TeeBot Acadion</span>, we believe privacy isn't just a policy — 
            it's a promise. Your students' data, your school's information, and your trust are sacred to us.
          </p>

          <div className="grid md:grid-cols-3 gap-8 my-12">
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
              <Lock className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
              <h3 className="font-bold text-lg">Encrypted Everywhere</h3>
              <p className="text-sm text-gray-600 mt-2">All data encrypted at rest & in transit</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
              <Users className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="font-bold text-lg">School Controls Everything</h3>
              <p className="text-sm text-gray-600 mt-2">Only your school sees your data — never us</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl">
              <Heart className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
              <h3 className="font-bold text-lg">Built for Nigeria</h3>
              <p className="text-sm text-gray-600 mt-2">NDPR-compliant • Nigerian servers option</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mt-16 mb-6">What We Collect & Why</h2>
          <div className="space-y-6 text-lg">
            <div>
              <h3 className="font-bold text-purple-600 mb-2">School Information</h3>
              <p className="text-gray-700">Name, logo, colors, contact — to make your portal feel like home.</p>
            </div>
            <div>
              <h3 className="font-bold text-purple-600 mb-2">User Accounts</h3>
              <p className="text-gray-700">Name, email, role — to know who’s a teacher, student, or parent.</p>
            </div>
            <div>
              <h3 className="font-bold text-purple-600 mb-2">Student Records</h3>
              <p className="text-gray-700">Results, attendance, fees — stored securely and only visible to your school.</p>
            </div>
            <div>
              <h3 className="font-bold text-purple-600 mb-2">Payments</h3>
              <p className="text-gray-700">Handled 100% by Paystack. We never see your card details.</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mt-16 mb-6">We Will Never</h2>
          <ul className="space-y-4 text-lg">
            <li className="flex items-center gap-4">
              <X className="text-red-500" size={28} />
              <span>Sell your data</span>
            </li>
            <li className="flex items-center gap-4">
              <X className="text-red-500" size={28} />
              <span>Share student info with third parties</span>
            </li>
            <li className="flex items-center gap-4">
              <X className="text-red-500" size={28} />
              <span>Use your data for ads</span>
            </li>
          </ul>

          <h2 className="text-3xl font-bold mt-16 mb-6">Your Rights</h2>
          <p className="text-lg text-gray-700">
            You own your data. At any time, you can:
          </p>
          <ul className="mt-6 space-y-3 text-lg">
            <li>• Export all student records in Excel</li>
            <li>• Delete your entire school (instantly)</li>
            <li>• Request data removal (we comply within 24 hours)</li>
          </ul>

          <div className="mt-16 p-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl text-white text-center">
            <Globe className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">Built in Nigeria, for Nigeria</h3>
            <p className="text-lg opacity-90">
              Compliant with NDPR • Hosted securely • Loved by parents nationwide
            </p>
          </div>

          <p className="mt-16 text-center text-gray-600">
            Questions? Email us anytime at{' '}
            <a href="mailto:privacy@azmah.app" className="text-purple-600 hover:underline font-bold">
              privacy@azmah.app
            </a>
          </p>

          <p className="mt-12 text-center text-gray-500 italic">
            With love from the TeeBot Acadion team
          </p>
        </div>
      </div>
    </motion.div>
  </div>
);

export default PrivacyPolicy;