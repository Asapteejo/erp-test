// C:\Users\HP\Desktop\azmah-frontend\src\components\TranscriptDownload.jsx
import { useState } from 'react';
import axios from 'axios';
import PaystackPop from '@paystack/inline-js';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useClerkAuth } from '../hooks/useClerkAuth';

const TranscriptDownload = ({ transcript, isOffline, onGeneratePDF }) => {
  const { user } = useAuth(); // Use useAuth instead of useContext(AuthContext)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Aligned with StudentDashboard.jsx
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxx';
  const amount = 1500 * 100; // NGN 1500 in kobo
  const config = { headers: { Authorization: `Bearer ${user?.token}` } };

  const handleDownload = async () => {
    if (isOffline) {
      setError('Offline: Downloads are disabled. Please connect to the internet.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/student/transcript/download`, {
        responseType: 'blob',
        ...config,
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Transcript_${user?.name || 'Student'}.pdf`; // Fixed user access
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowPayment(true);
        setError('You need to make payment before downloading your transcript.');
      } else {
        setError(err.response?.data?.message || 'Failed to download transcript.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportXLSX = () => {
    if (!transcript || isOffline) {
      setError('No transcript data available or offline mode enabled.');
      return;
    }
    const data = transcript.courses.map((c) => ({
      Course: c.course,
      Grade: c.grade,
      CreditUnit: c.creditUnit,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transcript');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Transcript_${user?.name || 'Student'}.xlsx`); // Fixed user access
  };

  const handlePayment = async () => {
    if (isOffline) {
      setError('Offline: Payments are disabled. Please connect to the internet.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/student/pay/transcript`,
        { amount: 1500 },
        config
      );
      const { reference } = response.data;

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: publicKey,
        email: user?.email || 'student@example.com', // Fixed user access
        amount,
        reference,
        metadata: {
          studentId: user?.id, // Fixed user access
          type: 'transcript',
        },
        onSuccess: async () => {
          try {
            await axios.post(
              `${API_BASE_URL}/api/student/pay/transcript/verify`,
              { reference },
              config
            );
            setShowPayment(false);
            setError('');
            handleDownload();
          } catch (err) {
            setError(err.response?.data?.message || 'Failed to verify payment.');
          }
        },
        onCancel: () => {
          setError('Payment was cancelled.');
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Download Official Transcript</h2>
      {loading && <p className="text-gray-600">Processing...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!showPayment ? (
        <div className="space-y-4">
          <button
            onClick={handleDownload}
            disabled={loading || isOffline || !user?.token}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {loading ? 'Processing...' : 'Download Transcript PDF'}
          </button>
          <button
            onClick={() => onGeneratePDF(transcript, 'transcript')} // Use onGeneratePDF prop
            disabled={loading || isOffline || !transcript}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 transition-colors"
          >
            Generate PDF Locally
          </button>
          <button
            onClick={handleExportXLSX}
            disabled={loading || isOffline || !transcript}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-300 transition-colors"
          >
            Download Transcript XLSX
          </button>
        </div>
      ) : (
        <button
          onClick={handlePayment}
          disabled={loading || isOffline || !user?.token}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-300 transition-colors"
        >
          Pay Now to Download
        </button>
      )}
    </div>
  );
};

export default TranscriptDownload;
