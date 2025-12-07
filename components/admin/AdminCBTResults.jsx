// src/components/admin/AdminCBTResults.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

const AdminCBTResults = () => {
  const [results, setResults] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filter, setFilter] = useState({ departmentId: '', levelId: '', year: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/results/archive', {
        params: filter,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }),
      axios.get('/api/public/departments'),
    ])
      .then(([resultsRes, deptRes]) => {
        setResults(resultsRes.data);
        setDepartments(deptRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError('Failed to load results');
        setLoading(false);
      });
  }, [filter]);

  const handleFilterChange = e => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const generateFilename = extension => {
    const department = departments.find(d => d.id === filter.departmentId)?.name || 'AllDepartments';
    const level = filter.levelId || 'AllLevels';
    const year = filter.year || new Date().getFullYear();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `CBT_Results_${department}_${level}_${year}_${date}.${extension}`;
  };

  const exportToCSV = async () => {
    if (!results.length) {
      alert('No results to export');
      return;
    }
    try {
      setLoading(true);
      const csvData = results.map(r => ({
        Student: r.student.name,
        Department: r.student.department?.name || 'N/A',
        Level: r.student.level || 'N/A',
        CBT: r.cbt.title,
        Score: r.score,
        Date: new Date(r.takenAt).toLocaleDateString(),
      }));
      const csv = Papa.unparse(csvData);
      const response = await axios.post(
        '/api/export/csv',
        { data: csv, filename: generateFilename('csv') },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const { url } = response.data;
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFilename('csv');
      link.click();
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  const exportToXLSX = async () => {
    if (!results.length) {
      alert('No results to export');
      return;
    }
    try {
      setLoading(true);
      const worksheetData = results.map(r => ({
        Student: r.student.name,
        Department: r.student.department?.name || 'N/A',
        Level: r.student.level || 'N/A',
        CBT: r.cbt.title,
        Score: r.score,
        Date: new Date(r.takenAt).toLocaleDateString(),
      }));
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'CBT Results');
      const xlsxBuffer = XLSX.write(workbook, { type: 'array' });
      const response = await axios.post(
        '/api/export/xlsx',
        { data: xlsxBuffer, filename: generateFilename('xlsx') },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/octet-stream',
          },
        }
      );
      const { url } = response.data;
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFilename('xlsx');
      link.click();
    } catch (err) {
      console.error('Error exporting XLSX:', err);
      alert('Failed to export XLSX');
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
      <h2 className="text-2xl font-semibold text-gray-800">CBT Results</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Filter Results</h3>
        <div className="space-y-4">
          <select
            name="departmentId"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter.departmentId}
            onChange={handleFilterChange}
          >
            <option value="">Filter by Department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            name="levelId"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter.levelId}
            onChange={handleFilterChange}
          >
            <option value="">Filter by Level</option>
            {[...Array(6)].map((_, i) => (
              <option key={i} value={`${100 * (i + 1)}`}>{100 * (i + 1)}</option>
            ))}
          </select>
          <input
            name="year"
            type="number"
            placeholder="Year (e.g., 2025)"
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter.year}
            onChange={handleFilterChange}
          />
        </div>
        <div className="flex space-x-4 mt-4">
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={loading}
          >
            Export to CSV
          </button>
          <button
            onClick={exportToXLSX}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            Export to XLSX
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {results.length === 0 ? (
          <p className="text-gray-600">No results available.</p>
        ) : (
          results.map(r => (
            <div key={r.id} className="p-4 border rounded bg-white shadow">
              <p><strong>Student:</strong> {r.student.name}</p>
              <p><strong>Department:</strong> {r.student.department?.name || 'N/A'}</p>
              <p><strong>Level:</strong> {r.student.level || 'N/A'}</p>
              <p><strong>CBT:</strong> {r.cbt.title}</p>
              <p><strong>Score:</strong> {r.score}</p>
              <p className="text-sm text-gray-500">Taken on {new Date(r.takenAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default AdminCBTResults;
