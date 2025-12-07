
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } };
import { useClerkAuth } from '../hooks/useClerkAuth';
import toast from 'react-hot-toast';
import UpgradeModal from '../components/admin/UpgradeModal';

const CBTTest = () => {
  const { schoolId, cbtId } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn, getToken } = useClerkAuth();
  const [school, setSchool] = useState({ subscriptionTier: 'basic', fontFamily: 'Inter' });
  const [cbt, setCbt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [remainingTime, setRemainingTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', requiredTier: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: schoolData, error: schoolError }, { data: cbtData, error: cbtError }] = await Promise.all([
          supabase.from('schools').select('subscriptionTier, fontFamily').eq('id', schoolId).single(),
          supabase.from('cbts').select('*').eq('id', cbtId).eq('schoolId', schoolId).single(),
        ]);
        if (schoolError || cbtError) throw new Error('Failed to fetch data');
        if (schoolData.subscriptionTier === 'basic') {
          setUpgradeModal({ isOpen: true, feature: 'CBT access', requiredTier: 'Pro or Premium' });
          setLoading(false);
          return;
        }
        setSchool(schoolData);
        setCbt(cbtData);
        setRemainingTime(cbtData.duration * 60);
        setLoading(false);
        toast.success('CBT loaded successfully!');
      } catch (err) {
        console.error('Error fetching CBT:', err);
        toast.error('Failed to load CBT');
        setLoading(false);
      }
    };
    if (schoolId && cbtId && isSignedIn) fetchData();
  }, [schoolId, cbtId, isSignedIn]);

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

  useEffect(() => {
    let timer;
    if (remainingTime !== null && remainingTime > 0) {
      timer = setInterval(() => setRemainingTime(prev => prev - 1), 1000);
    }
    if (remainingTime === 0) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [remainingTime]);

  useEffect(() => {
    const handleBlur = () => {
      if (cbt) toast.error('Switching tabs is not allowed during CBT!');
    };
    if (cbt) window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [cbt]);

  const handleAnswerChange = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!cbt) return;
    setLoading(true);
    try {
      const token = await getToken();
      const score = cbt.questions.reduce((total, q) => total + (answers[q.id] === q.answer ? 1 : 0), 0);
      const { error } = await supabase.from('cbtResults').insert({
        schoolId,
        cbtId,
        userId: user.id,
        score,
        answers,
        takenAt: new Date(),
        released: false,
      });
      if (error) throw error;
      toast.success('CBT submitted successfully!');
      navigate(`/${schoolId}/student-portal/cbt-results`);
    } catch (err) {
      console.error('Error submitting CBT:', err);
      toast.error('Failed to submit CBT');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  if (loading) return <div className="text-center py-8 text-gray-600">Loading...</div>;

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
        onClose={() => navigate(`/${schoolId}/student-portal`)}
        feature={upgradeModal.feature}
        requiredTier={upgradeModal.requiredTier}
      />
      {cbt && (
        <>
          <motion.div
            className="flex justify-between items-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
            >
              {cbt.title}
            </h1>
            <div className="text-red-600 font-semibold">
              Time Left: {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
            </div>
          </motion.div>
          <motion.div
            className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {cbt.questions.map((q, i) => (
              <motion.div
                key={q.id}
                className="p-4 border rounded-lg mb-4 bg-white/30 backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <p className="font-semibold" style={{ fontFamily: 'var(--font-family)' }}>
                  {i + 1}. {q.text}
                </p>
                {q.options.map((opt, idx) => (
                  <label key={idx} className="block mt-2" style={{ fontFamily: 'var(--font-family)' }}>
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleAnswerChange(q.id, opt)}
                      className="mr-2"
                      aria-label={`Option ${opt} for question ${i + 1}`}
                    />
                    {opt}
                  </label>
                ))}
              </motion.div>
            ))}
            <motion.button
              onClick={handleSubmit}
              className="mt-4 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white py-2 px-4 rounded-lg hover:from-[var(--secondary-color)] hover:to-[var(--primary-color)] disabled:bg-gray-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              aria-label="Submit CBT"
            >
              Submit Test
            </motion.button>
            <motion.button
              onClick={() => navigate(`/${schoolId}/student-portal/cbt`)}
              className="ml-4 text-[var(--primary-color)] hover:underline"
              whileHover={{ scale: 1.05 }}
              disabled={loading}
              aria-label="Return to CBT list"
            >
              Return to CBT List
            </motion.button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default CBTTest;


















