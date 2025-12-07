import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } };
import { useClerkAuth } from '../../hooks/useClerkAuth';
import toast from 'react-hot-toast';
import UpgradeModal from './UpgradeModal';

const AdminCBT = () => {
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const [school, setSchool] = useState({ subscriptionTier: 'basic', fontFamily: 'Inter' });
  const [cbts, setCbts] = useState([]);
  const [cbtForm, setCbtForm] = useState({ title: '', description: '', duration: '' });
  const [questionForm, setQuestionForm] = useState({ cbtId: '', text: '', options: ['', '', '', ''], answer: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', requiredTier: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: cbtData, error: cbtError }, { data: schoolData, error: schoolError }] = await Promise.all([
          supabase.from('cbts').select('*').eq('schoolId', schoolId),
          supabase.from('schools').select('subscriptionTier, fontFamily').eq('id', schoolId).single(),
        ]);
        if (cbtError || schoolError) throw new Error('Failed to fetch data');
        setSchool(schoolData);
        setCbts(schoolData.subscriptionTier === 'basic' ? [] : cbtData || []);
        setLoading(false);
        toast.success('CBTs loaded successfully!');
      } catch (err) {
        console.error('Error fetching CBTs:', err);
        setError('Failed to load CBTs');
        setLoading(false);
        toast.error('Failed to load CBTs');
      }
    };
    if (schoolId) fetchData();
  }, [schoolId]);

  useEffect(() => {
    if (school.fontFamily && school.fontFamily !== 'Inter') {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${school.fontFamily.replace(' ', '+')}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    document.documentElement.style.setProperty('--font-family', school.fontFamily);
    document.documentElement.style.setProperty('--primary-color', '#3B82F6');
    document.documentElement.style.setProperty('--secondary-color', '#1E40AF');
  }, [school.fontFamily]);

  const handleCbtChange = (e) => {
    const { name, value } = e.target;
    setCbtForm({ ...cbtForm, [name]: name === 'duration' ? parseInt(value) : value });
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('option')) {
      const index = parseInt(name.split('-')[1]);
      const options = [...questionForm.options];
      options[index] = value;
      setQuestionForm({ ...questionForm, options });
    } else {
      setQuestionForm({ ...questionForm, [name]: value });
    }
  };

  const handleCbtSubmit = async (e) => {
    e.preventDefault();
    if (school.subscriptionTier === 'basic') {
      setUpgradeModal({ isOpen: true, feature: 'CBT creation', requiredTier: 'Pro or Premium' });
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const { error } = await supabase
        .from('cbts')
        .insert({ ...cbtForm, schoolId, questions: [], createdAt: new Date() });
      if (error) throw error;
      toast.success('CBT created!');
      setCbtForm({ title: '', description: '', duration: '' });
      const { data } = await supabase.from('cbts').select('*').eq('schoolId', schoolId);
      setCbts(data || []);
    } catch (err) {
      console.error('Error creating CBT:', err);
      toast.error('Error creating CBT.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (school.subscriptionTier === 'basic') {
      setUpgradeModal({ isOpen: true, feature: 'CBT question creation', requiredTier: 'Pro or Premium' });
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const question = {
        id: Date.now().toString(),
        text: questionForm.text,
        options: questionForm.options,
        answer: questionForm.answer,
      };
      const { data: cbtData, error: fetchError } = await supabase
        .from('cbts')
        .select('questions')
        .eq('id', questionForm.cbtId)
        .eq('schoolId', schoolId)
        .single();
      if (fetchError) throw fetchError;
      const updatedQuestions = [...(cbtData.questions || []), question];
      const { error: updateError } = await supabase
        .from('cbts')
        .update({ questions: updatedQuestions })
        .eq('id', questionForm.cbtId)
        .eq('schoolId', schoolId);
      if (updateError) throw updateError;
      toast.success('Question added!');
      setQuestionForm({ cbtId: '', text: '', options: ['', '', '', ''], answer: '' });
      const { data } = await supabase.from('cbts').select('*').eq('schoolId', schoolId);
      setCbts(data || []);
    } catch (err) {
      console.error('Error adding question:', err);
      toast.error('Error adding question.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCbt = async (cbtId) => {
    if (school.subscriptionTier === 'basic') {
      setUpgradeModal({ isOpen: true, feature: 'CBT deletion', requiredTier: 'Pro or Premium' });
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const { error } = await supabase
        .from('cbts')
        .delete()
        .eq('id', cbtId)
        .eq('schoolId', schoolId);
      if (error) throw error;
      toast.success('CBT deleted!');
      const { data } = await supabase.from('cbts').select('*').eq('schoolId', schoolId);
      setCbts(data || []);
    } catch (err) {
      console.error('Error deleting CBT:', err);
      toast.error('Error deleting CBT.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-600" style={{ fontFamily: 'var(--font-family)' }}>Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500" style={{ fontFamily: 'var(--font-family)' }}>{error}</div>;

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-12 bg-[var(--background-color)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ '--font-family': school.fontFamily }}
    >
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, feature: '', requiredTier: '' })}
        feature={upgradeModal.feature}
        requiredTier={upgradeModal.requiredTier}
      />
      <motion.h2
        className="text-2xl font-semibold mb-6"
        style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        CBT Manager
      </motion.h2>

      {/* Create CBT */}
      <motion.div
        className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}>
          Create New CBT
        </h3>
        <form onSubmit={handleCbtSubmit} className="space-y-4">
          <input
            name="title"
            placeholder="CBT Title"
            className="w-full p-3 border rounded-lg bg-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            value={cbtForm.title}
            onChange={handleCbtChange}
            required
            aria-label="CBT title"
            style={{ fontFamily: 'var(--font-family)' }}
          />
          <textarea
            name="description"
            placeholder="CBT Description"
            className="w-full p-3 border rounded-lg bg-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            value={cbtForm.description}
            onChange={handleCbtChange}
            rows={4}
            aria-label="CBT description"
            style={{ fontFamily: 'var(--font-family)' }}
          />
          <input
            name="duration"
            type="number"
            placeholder="Duration (minutes)"
            className="w-full p-3 border rounded-lg bg-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            value={cbtForm.duration}
            onChange={handleCbtChange}
            required
            aria-label="CBT duration"
            style={{ fontFamily: 'var(--font-family)' }}
          />
          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white py-2 rounded-lg hover:from-[var(--secondary-color)] hover:to-[var(--primary-color)] disabled:bg-gray-300"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Create CBT"
          >
            Create CBT
          </motion.button>
        </form>
      </motion.div>

      {/* Add Question */}
      <motion.div
        className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}>
          Add Question to CBT
        </h3>
        <form onSubmit={handleQuestionSubmit} className="space-y-4">
          <select
            name="cbtId"
            className="w-full p-3 border rounded-lg bg-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            value={questionForm.cbtId}
            onChange={handleQuestionChange}
            required
            aria-label="Select CBT"
            style={{ fontFamily: 'var(--font-family)' }}
          >
            <option value="">Select CBT</option>
            {cbts.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <textarea
            name="text"
            placeholder="Question Text"
            className="w-full p-3 border rounded-lg bg-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            value={questionForm.text}
            onChange={handleQuestionChange}
            required
            rows={4}
            aria-label="Question text"
            style={{ fontFamily: 'var(--font-family)' }}
          />
          {['A', 'B', 'C', 'D'].map((opt, i) => (
            <input
              key={i}
              name={`option-${i}`}
              placeholder={`Option ${opt}`}
              className="w-full p-3 border rounded-lg bg-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] mt-2"
              value={questionForm.options[i]}
              onChange={handleQuestionChange}
              required
              aria-label={`Option ${opt}`}
              style={{ fontFamily: 'var(--font-family)' }}
            />
          ))}
          <select
            name="answer"
            className="w-full p-3 border rounded-lg bg-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            value={questionForm.answer}
            onChange={handleQuestionChange}
            required
            aria-label="Select correct answer"
            style={{ fontFamily: 'var(--font-family)' }}
          >
            <option value="">Select Correct Answer</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-[var(--accent-color)] to-[var(--primary-color)] text-white py-2 rounded-lg hover:from-[var(--primary-color)] hover:to-[var(--accent-color)] disabled:bg-gray-300"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add question"
          >
            Add Question
          </motion.button>
        </form>
      </motion.div>

      {/* List CBTs */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}>
          Available CBTs
        </h3>
        {cbts.length === 0 ? (
          <p className="text-gray-600" style={{ fontFamily: 'var(--font-family)' }}>
            {school.subscriptionTier === 'basic'
              ? 'CBT access requires a Pro or Premium plan. Upgrade to create CBTs.'
              : 'No CBTs available.'}
          </p>
        ) : (
          cbts.map(cbt => (
            <motion.div
              key={cbt.id}
              className="p-4 border rounded-lg bg-white/30 backdrop-blur-sm shadow-md"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <h4 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}>
                {cbt.title}
              </h4>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-family)' }}>
                {cbt.description?.slice(0, 100) || 'No description provided.'}...
              </p>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-family)' }}>Duration: {cbt.duration} minutes</p>
              <p className="text-gray-600" style={{ fontFamily: 'var(--font-family)' }}>Questions: {cbt.questions?.length || 0}</p>
              <motion.button
                onClick={() => handleDeleteCbt(cbt.id)}
                className="mt-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-red-600 disabled:bg-gray-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
                aria-label={`Delete CBT: ${cbt.title}`}
              >
                Delete
              </motion.button>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminCBT;
