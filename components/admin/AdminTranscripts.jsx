// src/components/admin/AdminTranscripts.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PaystackPop from '@paystack/inline-js';
import { motion } from 'framer-motion';

const AdminTranscripts = () => {
  const [users, setUsers] = useState([]);
  const [transcriptForm, setTranscriptForm] = useState({ studentId: '', amount: '' });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);
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

  const fetchStudentHistory = async studentId => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [paymentRes, downloadRes] = await Promise.all([
        axios.get(`/api/admin/payments/${studentId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`/api/admin/transcript/download-history/${studentId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);
      setPaymentHistory(paymentRes.data);
      setDownloadHistory(downloadRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load student history');
      setLoading(false);
    }
  };

  const handleChange = e => {
    setTranscriptForm({ ...transcriptForm, [e.target.name]: e.target.value });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!transcriptForm.studentId || !transcriptForm.amount) {
        setError('All required fields must be filled');
        return;
      }
      const student = users.find(u => u.id === transcriptForm.studentId);
      if (!student) {
        setError('Student not found');
        return;
      }
      const response = await axios.post(
        `/api/admin/transcript/pay/${transcriptForm.studentId}`,
        { amount: parseFloat(transcriptForm.amount) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const { reference } = response.data;

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: student.email,
        amount: parseFloat(transcriptForm.amount) * 100,
        reference,
        onSuccess: async () => {
          try {
            const verifyResponse = await axios.post(
              `/api/admin/transcript/approve/${transcriptForm.studentId}`,
              { reference },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            const paymentData = verifyResponse.data;
            alert('Transcript payment verified! Invoice available.');
            setTranscriptForm({ studentId: '', amount: '' });
            fetchStudentHistory(transcriptForm.studentId);
          } catch (err) {
            console.error('Error verifying payment:', err);
            setError('Failed to verify transcript payment');
          }
        },
        onCancel: () => setError('Transcript payment cancelled'),
      });
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError('Failed to initiate transcript payment');
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
      <h2 className="text-2xl font-semibold text-gray-800">Manage Transcript Payments</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <select
          name="studentId"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={transcriptForm.studentId}
          onChange={e => {
            handleChange(e);
            fetchStudentHistory(e.target.value);
          }}
        >
          <option value="">Select Student</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>
        <input
          name="amount"
          type="number"
          placeholder="Amount (NGN)"
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={transcriptForm.amount}
          onChange={handleChange}
        />
        <div className="flex space-x-4">
          <button
            onClick={handlePayment}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            Initiate Payment
          </button>
          <button
            onClick={() => fetchStudentHistory(transcriptForm.studentId)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            disabled={loading || !transcriptForm.studentId}
          >
            Refresh History
          </button>
        </div>
      </div>
      {transcriptForm.studentId && (
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
          <h3 className="text-xl font-semibold text-gray-700 mt-6">Transcript Download History</h3>
          {downloadHistory.length === 0 ? (
            <p className="text-gray-600">No download history.</p>
          ) : (
            <div className="space-y-4">
              {downloadHistory.map(d => (
                <div key={d.id} className="p-4 border rounded bg-white shadow">
                  <p>Downloaded on {new Date(d.downloadedAt).toLocaleDateString()}</p>
                  <a href={d.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    Download Again
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AdminTranscripts;
