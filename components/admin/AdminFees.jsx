// src/components/admin/AdminFees.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PaystackPop from '@paystack/inline-js';
import { motion } from 'framer-motion';

const AdminFees = () => {
  const [users, setUsers] = useState([]);
  const [feesForm, setFeesForm] = useState({ 
    studentId: '', 
    amount: '', 
    type: '', 
    commissionPercent: 5  // New: Default 5% portal commission
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(res => {
        setUsers(res.data.filter(u => u.role === 'STUDENT'));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        setLoading(false);
      });
  }, []);

  const fetchPaymentHistory = async studentId => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/payments/${studentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPaymentHistory(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Failed to load payment history');
      setLoading(false);
    }
  };

  const handleChange = e => {
    setFeesForm({ ...feesForm, [e.target.name]: e.target.value });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!feesForm.studentId || !feesForm.amount || !feesForm.type) {
        setError('All required fields must be filled');
        return;
      }
      if (feesForm.commissionPercent < 0 || feesForm.commissionPercent > 100) {
        setError('Commission must be between 0-100%');
        return;
      }
      const student = users.find(u => u.id === feesForm.studentId);
      if (!student) {
        setError('Student not found');
        return;
      }
      const totalAmount = parseFloat(feesForm.amount);
      const portalCut = totalAmount * (feesForm.commissionPercent / 100);
      const schoolCut = totalAmount - portalCut;

      console.log('Split Payment:', { total: totalAmount, portal: portalCut, school: schoolCut, percent: feesForm.commissionPercent });

      const response = await axios.post(
        `/api/admin/${feesForm.type}/pay/${feesForm.studentId}`,
        { 
          amount: totalAmount,
          splitConfig: { // New: Send split details to backend
            commissionPercent: feesForm.commissionPercent,
            portalCut,
            schoolCut
          }
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const { reference } = response.data;

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: student.email,
        amount: totalAmount * 100, // Total (split handled backend)
        reference,
        onSuccess: async () => {
          try {
            const verifyResponse = await axios.post(
              `/api/admin/${feesForm.type}/approve/${feesForm.studentId}`,
              { reference },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            alert(`${feesForm.type.toUpperCase()} payment verified! Portal: ₦${portalCut.toFixed(0)}, School: ₦${schoolCut.toFixed(0)}. Invoice ready.`);
            setFeesForm({ studentId: '', amount: '', type: '', commissionPercent: 5 }); // Reset
            fetchPaymentHistory(feesForm.studentId);
          } catch (err) {
            console.error('Error verifying payment:', err);
            setError(`Failed to verify ${feesForm.type} payment`);
          }
        },
        onCancel: () => setError(`${feesForm.type.charAt(0).toUpperCase() + feesForm.type.slice(1)} payment cancelled`),
      });
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError(`Failed to initiate ${feesForm.type} payment: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold text-gray-800">Manage School/Hostel Fees (Split Payments)</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <select
          name="studentId"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={feesForm.studentId}
          onChange={e => {
            handleChange(e);
            fetchPaymentHistory(e.target.value);
          }}
        >
          <option value="">Select Student</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>
        <select
          name="type"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={feesForm.type}
          onChange={handleChange}
        >
          <option value="">Select Fee Type</option>
          <option value="fees">School Fees</option>
          <option value="hostel">Hostel Fees</option>
          <option value="transcript">Transcript</option>
          <option value="cbt">CBT Exam</option>
        </select>
        <input
          name="amount"
          type="number"
          placeholder="Total Amount (NGN)"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={feesForm.amount}
          onChange={handleChange}
        />
        {/* New: Commission Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Portal Commission (%)</label>
          <input
            name="commissionPercent"
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="5"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={feesForm.commissionPercent}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-500 mt-1">E.g., 5% to portal, 95% to school</p>
        </div>
        <button
          onClick={handlePayment}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          disabled={loading || !feesForm.studentId || !feesForm.amount || !feesForm.type}
        >
          {loading ? 'Initiating...' : 'Initiate Split Payment'}
        </button>
        {/* New: Split Preview */}
        {feesForm.amount && feesForm.commissionPercent > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
            <p><strong>Total:</strong> ₦{feesForm.amount}</p>
            <p><strong>Portal Cut ( {feesForm.commissionPercent}% ):</strong> ₦{(feesForm.amount * feesForm.commissionPercent / 100).toFixed(0)}</p>
            <p><strong>School Cut:</strong> ₦{(feesForm.amount * (100 - feesForm.commissionPercent) / 100).toFixed(0)}</p>
          </div>
        )}
      </div>
      {feesForm.studentId && (
        <>
          <h3 className="text-xl font-semibold text-gray-700 mt-6">Payment History</h3>
          {paymentHistory.length === 0 ? (
            <p className="text-gray-600">No payment history.</p>
          ) : (
            <div className="space-y-4">
              {paymentHistory.map(p => (
                <div key={p.reference} className="p-4 border rounded bg-white shadow">
                  <p><strong>Type:</strong> {p.type}</p>
                  <p><strong>Amount:</strong> ₦{p.amount}</p>
                  <p><strong>Status:</strong> {p.status}</p>
                  <p><strong>Date:</strong> {new Date(p.createdAt).toLocaleDateString()}</p>
                  {p.invoiceUrl && (
                    <a href={p.invoiceUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      Download Invoice
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AdminFees;
