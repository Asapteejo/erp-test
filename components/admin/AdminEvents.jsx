// src/components/admin/AdminEvents.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PaystackPop from '@paystack/inline-js';
import { motion } from 'framer-motion';

const AdminEvents = () => {
  const [users, setUsers] = useState([]);
  const [eventForm, setEventForm] = useState({ studentId: '', eventId: '', amount: '' });
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
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!eventForm.studentId || !eventForm.amount || !eventForm.eventId) {
        setError('All required fields must be filled');
        return;
      }
      const student = users.find(u => u.id === eventForm.studentId);
      if (!student) {
        setError('Student not found');
        return;
      }
      const response = await axios.post(
        `/api/admin/event/pay/${eventForm.studentId}`,
        { amount: parseFloat(eventForm.amount), eventId: eventForm.eventId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const { reference } = response.data;

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: student.email,
        amount: parseFloat(eventForm.amount) * 100,
        reference,
        onSuccess: async () => {
          try {
            const verifyResponse = await axios.post(
              `/api/admin/event/approve/${eventForm.studentId}`,
              { reference, eventId: eventForm.eventId },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            alert('Event payment verified! Invoice available.');
            setEventForm({ studentId: '', eventId: '', amount: '' });
            fetchPaymentHistory(eventForm.studentId);
          } catch (err) {
            console.error('Error verifying payment:', err);
            setError('Failed to verify event payment');
          }
        },
        onCancel: () => setError('Event payment cancelled'),
      });
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError('Failed to initiate event payment');
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
      <h2 className="text-2xl font-semibold text-gray-800">Manage Event Ticketing</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <select
          name="studentId"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={eventForm.studentId}
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
        <input
          name="eventId"
          placeholder="Event ID (e.g., EVENT123)"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={eventForm.eventId}
          onChange={handleChange}
        />
        <input
          name="amount"
          type="number"
          placeholder="Amount (NGN)"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={eventForm.amount}
          onChange={handleChange}
        />
        <button
          onClick={handlePayment}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          Initiate Payment
        </button>
      </div>
      {eventForm.studentId && (
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

export default AdminEvents;
