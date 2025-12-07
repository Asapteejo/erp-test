import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useClerkAuth } from '../hooks/useClerkAuth';
import toast from 'react-hot-toast';
import PaystackPop from '@paystack/inline-js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Menu, X, Home, BookOpen, Brain, CreditCard, FileText, Clock, LogOut, Globe, Rocket, Crown, Users } from 'lucide-react';
import TranscriptDownload from '../components/TranscriptDownload';
import UpgradeModal from '../components/admin/UpgradeModal';

// Local storage helper
const storage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Error parsing ${key} from storage:`, err);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error saving ${key} to storage:`, err);
    }
  },
  remove: (key) => localStorage.removeItem(key),
};

const StudentDashboard = () => {
 // const { user, logout, getToken } = useClerkAuth();
 // TEMP FAKE USER — 100% SAFE TEST
const user = { id: 'test123', firstName: 'Aisha', emailAddress: 'aisha@school.com' };
const logout = () => console.log('logout');
const getToken = async () => 'fake-token';
  const { schoolId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [school, setSchool] = useState({ subscriptionTier: 'basic', fontFamily: 'Inter', paystackSubaccount: null });
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [transcript, setTranscript] = useState(null);
  const [cbtResults, setCbtResults] = useState([]);
  const [cbts, setCbts] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ type: '', amount: '', eventId: '', cbtId: '' });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);  
  const [errors, setErrors] = useState({});
  const [pendingActions, setPendingActions] = useState(storage.get('pendingActions') || []);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', requiredTier: '' });
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  //useEffect(() => {
    //const fetchSchool = async () => {
     // try {
       // const { data, error } = await supabase
        //  .from('schools')
          //.select('subscriptionTier, fontFamily, paystackSubaccount')
        //  .eq('id', schoolId)
          //.single();
        //if (error) throw error;
       // setSchool(data);
     // } catch (err) {
     //   console.error('Error fetching school:', err);
     //   toast.error('Failed to load school data');
    //  }
   // };
  //  if (schoolId) fetchSchool();
 // }, [schoolId]);

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
    document.documentElement.style.setProperty('--accent-color', '#10B981');
  }, [school.fontFamily]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingActions();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sanitizeInput = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[<>]/g, '');
  };

  useEffect(() => {
    const fetchData = async (table, setter, key, state, retries = 2) => {
  if (state?.length > 0 || (key === 'transcript' && state)) return;

  // Offline: use cache
  if (isOffline) {
    const cached = storage.get(key);
    if (cached) setter(cached);
    return;
  }

  try {
    setIsLoading(true);

    let query = supabase.from(table).select('*').eq('schoolId', schoolId);
    if (table === 'cbt_results')
      query = query.eq('studentId', user.id).select('*, cbt:cbts(*)');

    if (table === 'student_courses')
      query = query.eq('studentId', user.id).select('*, course:courses(*)');

    if (table === 'cbts')
      query = query.select('*, school:schools(*)');

    const { data, error } = await query;
    if (error) throw error;

    let normalizedData = data || [];

    // Normalize myCourses
    if (key === 'myCourses') {
      normalizedData = data.map(sc => ({
        id: sc.id,
        course: sc.course,
      }));
    }

    // Normalize CBT results
    if (key === 'cbtResults') {
      normalizedData = data.map(r => ({
        ...r,
        cBT: r.cbt, // fixed: was cBT → cbt
      }));
    }

    setter(normalizedData);
    storage.set(key, normalizedData);

  } catch (err) {
    console.error(`Error fetching ${key}:`, err);

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return fetchData(table, setter, key, state, retries - 1);
    }

    // Fallback to cache
    const cached = storage.get(key);
    if (cached) setter(cached);
  } finally {
    setIsLoading(false);
  }
};

    if (!user) {
      setErrors((prev) => ({ ...prev, auth: 'Please log in to access the dashboard.' }));
      navigate('/sign-in');
      return;
    }

    fetchData('courses', setCourses, 'courses', courses);
    fetchData('student_courses', setMyCourses, 'myCourses', myCourses);
    fetchData('transcripts', setTranscript, 'transcript', transcript);
    fetchData('cbt_results', setCbtResults, 'cbtResults', cbtResults);
    fetchData('payments', setPaymentHistory, 'paymentHistory', paymentHistory);
    fetchData('cbts', setCbts, 'cbts', cbts);
  }, [user, isOffline, navigate, schoolId]);

  // === FETCH ANALYTICS — SAFE IN DEV + PROD ===
useEffect(() => {
  const fetchAnalytics = async () => {
    if (school.subscriptionTier !== 'premium' || isOffline) {
      setAnalytics(null);
      return;
    }

    // In dev: skip real API call
    if (import.meta.env.DEV) {
      setAnalytics({
        totalResults: 1247,
        avgScore: 78.4,
        passRate: 89,
        scoreDistribution: [
          { score: '90-100', _count: { id: 234 } },
          { score: '80-89', _count: { id: 412 } },
          { score: '70-79', _count: { id: 301 } },
          { score: '60-69', _count: { id: 189 } },
          { score: '0-59', _count: { id: 111 } },
        ],
        monthlyTrend: [65, 72, 68, 78, 82, 88],
        topPerformers: [
          { user: { firstName: 'Aisha' }, score: 98 },
          { user: { firstName: 'Chinedu' }, score: 96 },
          { user: { firstName: 'Fatima' }, score: 94 },
          { user: { firstName: 'Ibrahim' }, score: 92 },
          { user: { firstName: 'Zainab' }, score: 90 },
        ],
      });
      return;
    }

    try {
      setIsLoadingAnalytics(true);
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/cbt/analytics/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error('Analytics fetch failed:', err);
      setAnalytics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  if (schoolId && user) fetchAnalytics();
}, [school.subscriptionTier, schoolId, isOffline, user, getToken]);

  useEffect(() => {
  const handleResize = () => {
    setSidebarOpen(window.innerWidth >= 1024);
  };
  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);


// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend
);

// Reusable Component: Course List
const CourseList = ({ courses, onRegister, isLoading, isOffline, subscriptionTier }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl"
  >
    <h2 className="text-3xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
      Available Courses
    </h2>

    {isOffline && (
      <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl text-yellow-300 text-sm">
        Offline Mode: Showing cached data
      </div>
    )}

    {courses.length === 0 ? (
      <div className="text-center py-20">
        <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
          <BookOpen size={48} className="text-white/40" />
        </div>
        <p className="text-xl text-white/60">No courses available for registration yet</p>
        <p className="text-sm text-white/40 mt-2">Check back later or contact your admin</p>
      </div>
    ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <motion.div
            key={c.id}
            whileHover={{ scale: 1.03, y: -4 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-purple-500/50 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-purple-300">{c.code}</h3>
                <p className="text-lg mt-2 text-white/90">{c.title}</p>
              </div>
              {c.creditUnit && (
                <span className="text-xs bg-purple-600/30 px-3 py-1 rounded-full text-purple-300">
                  {c.creditUnit} units
                </span>
              )}
            </div>

            {c.teacher && (
              <p className="text-sm text-white/70 mb-2 flex items-center gap-2">
                Teacher: {c.teacher}
              </p>
            )}

            {c.schedule && (
              <p className="text-sm text-green-400 mb-6 flex items-center gap-2">
                {c.schedule.day} • {c.schedule.time}
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRegister(c.id)}
              disabled={isLoading || isOffline || subscriptionTier === 'basic'}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 transition-all shadow-lg hover:shadow-purple-500/25"
            >
              {isLoading ? 'Registering...' : 'Register Now'}
            </motion.button>
          </motion.div>
        ))}
      </div>
    )}
  </motion.div>
);

// Reusable Component: My Courses
const MyCourses = ({ courses, onGeneratePDF, isLoading, isOffline, subscriptionTier }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl"
  >
    <h2 className="text-3xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
      My Registered Courses
    </h2>

    {isOffline && (
      <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl text-yellow-300 text-sm text-center">
        Offline Mode: Showing cached courses
      </div>
    )}

    {courses.length === 0 ? (
      <div className="text-center py-20">
        <div className="w-28 h-28 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
          <BookOpen size={56} className="text-white/40" />
        </div>
        <p className="text-2xl text-white/80 font-medium">No courses registered yet</p>
        <p className="text-white/50 mt-3">Go to "Courses" tab to register</p>
      </div>
    ) : (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-purple-300">{c.course.code}</h3>
                  <p className="text-lg mt-2 text-white/90">{c.course.title}</p>
                </div>
                {c.course.creditUnit && (
                  <span className="text-xs bg-purple-600/40 px-3 py-1.5 rounded-full text-purple-300 font-medium">
                    {c.course.creditUnit} units
                  </span>
                )}
              </div>

              {c.course.teacher && (
                <p className="text-sm text-white/70 mb-3 flex items-center gap-2">
                  Teacher: {c.course.teacher}
                </p>
              )}

              {c.course.schedule && (
                <p className="text-sm text-green-400 mb-4 flex items-center gap-2">
                  {c.course.schedule.day} • {c.course.schedule.time}
                </p>
              )}

              <div className="h-px bg-white/10 my-4" />

              <div className="text-xs text-white/50">
                Status: <span className="text-green-400 font-medium">Registered</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onGeneratePDF({ courses: courses.map(c => c.course) }, 'registration')}
            disabled={isLoading || isOffline || subscriptionTier === 'basic'}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 transition-all shadow-2xl hover:shadow-purple-500/40 flex items-center gap-3 mx-auto"
          >
            <Download size={24} />
            📄Download Registration Form (PDF)
          </motion.button>
        </div>
      </div>
    )}
  </motion.div>
);

// NEW: Parent Linking Component (Let student add their parents)
const ParentLinking = ({ user, schoolId, isOffline }) => {
  const [parentEmails, setParentEmails] = useState({ email1: '', email2: '', email3: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load existing parent emails
    if (user.parent_email1 || user.parent_email2 || user.parent_email3) {
      setParentEmails({
        email1: user.parent_email1 || '',
        email2: user.parent_email2 || '',
        email3: user.parent_email3 || '',
      });
    }
  }, [user]);

  const saveParents = async () => {
    if (isOffline) {
      toast.error('Cannot save while offline');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          parent_email1: parentEmails.email1.trim() || null,
          parent_email2: parentEmails.email2.trim() || null,
          parent_email3: parentEmails.email3.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Parents updated! They will be notified when they sign up.');
    } catch (err) {
      toast.error('Failed to save parent emails');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl"
    >
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Link Your Parents
      </h2>

      <p className="text-white/70 mb-8">
        Add your parents' emails so they can see your results, pay fees, and chat with teachers.
      </p>

      <div className="space-y-6">
        {['email1', 'email2', 'email3'].map((key, i) => (
          <div key={key}>
            <label className="text-white/80 text-sm font-medium mb-2 block">
              Parent {i + 1} Email {i === 0 && '(Main Guardian)'}
            </label>
            <input
              type="email"
              value={parentEmails[key]}
              onChange={(e) => setParentEmails({ ...parentEmails, [key]: e.target.value })}
              placeholder="parent@example.com"
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500/60 transition-all"
            />
          </div>
        ))}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={saveParents}
          disabled={isSaving || isOffline}
          className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 transition-all shadow-2xl hover:shadow-purple-500/40 flex items-center justify-center gap-3"
        >
          {isSaving ? 'Saving...' : 'Save Parent Emails'}
        </motion.button>
      </div>
    </motion.div>
  );
};

// Reusable Component: Transcript
const Transcript = ({ transcript, onGeneratePDF, onPay, isLoading, isOffline, transcriptPaid, subscriptionTier, school }) => {
  const transcriptFee = school?.transcriptFee || 50000; 

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl"
    >
      <h2 className="text-3xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
        Official Transcript
      </h2>

      {isOffline && (
        <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl text-yellow-300 text-center">
          Offline Mode: Transcript may be outdated
        </div>
      )}

      {transcript === null ? (
        <div className="text-center py-20">
          <div className="w-28 h-28 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
            <FileText size={56} className="text-white/40" />
          </div>
          <p className="text-2xl text-white/80">No transcript data available</p>
        </div>
      ) : !transcriptPaid ? (
        <div className="text-center py-20">
          <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center border-4 border-yellow-500/50">
            <Lock size={64} className="text-yellow-400" />
          </div>
          <h3 className="text-3xl font-bold text-yellow-400 mb-4">Access Restricted</h3>
          <p className="text-xl text-white/80 mb-8 max-w-md mx-auto">
            Your official transcript is ready, but requires a one-time payment to unlock.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPay}
            disabled={isLoading || isOffline}
            className="px-12 py-5 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl font-bold text-xl text-black hover:from-yellow-400 hover:to-orange-500 transition-all shadow-2xl hover:shadow-yellow-500/50 flex items-center gap-3 mx-auto"
          >
            <CreditCard size={28} />
            💳Pay ₦{transcriptFee.toLocaleString()} to Unlock Transcript
          </motion.button>
        </div>
    ) : (
      <div>
        <div className="text-center mb-10 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl border border-purple-500/50">
          <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            GPA: {transcript.gpa}
          </p>
          <p className="text-white/70 mt-2 text-lg">Cumulative Grade Point Average</p>
        </div>

        <div className="grid gap-4 mb-10">
          {transcript.courses.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-purple-500/50 transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-purple-300">{c.course.split(' - ')[0]}</h4>
                  <p className="text-lg text-white/90 mt-1">{c.course.split(' - ')[1]}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-green-400">{c.grade}</div>
                  <div className="text-sm text-white/60">{c.creditUnit} CU</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onGeneratePDF(transcript, 'transcript')}
            disabled={isLoading || isOffline}
            className="px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl hover:shadow-purple-500/40 flex items-center gap-3 mx-auto"
          >
            <Download size={28} />
            📄Download Official Transcript (PDF)
          </motion.button>
        </div>
      </div>
    )}
  </motion.div>
  );
};

// Reusable Component: CBT Results
const CBTResults = ({ results, isOffline, subscriptionTier, onExportResults }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl"
  >
    <h2 className="text-3xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
      CBT Results
    </h2>

    {isOffline && (
      <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl text-yellow-300 text-center">
        Offline Mode: Results may be outdated
      </div>
    )}

    {subscriptionTier === 'basic' ? (
      <div className="text-center py-20">
        <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center border-4 border-purple-500/50">
          <Lock size={64} className="text-purple-400" />
        </div>
        <h3 className="text-3xl font-bold text-purple-400 mb-4">Premium Feature</h3>
        <p className="text-xl text-white/80 mb-8 max-w-md mx-auto">
          CBT results and analytics are available on Pro or Premium plans.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setUpgradeModal({ isOpen: true, feature: 'CBT Results', requiredTier: 'Pro or Premium' })}
          className="px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl hover:shadow-purple-500/40 flex items-center gap-3 mx-auto"
        >
          <CreditCard size={28} />
          Upgrade to Unlock
        </motion.button>
      </div>
    ) : results.length === 0 ? (
      <div className="text-center py-20">
        <div className="w-28 h-28 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
          <Brain size={56} className="text-white/40" />
        </div>
        <p className="text-2xl text-white/80 font-medium">No CBT results yet</p>
        <p className="text-white/50 mt-3">Complete your first CBT to see results here</p>
      </div>
    ) : (
      <div className="space-y-6">
        {results.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-purple-500/50 transition-all duration-300 group"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-purple-300">{r.cBT.title}</h3>
                <div className="flex items-center gap-6 mt-3 text-sm">
                  <span className="text-white/80">
                    Taken: {new Date(r.takenAt).toLocaleDateString('en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </span>
                  <span className={`font-bold ${r.released ? 'text-green-400' : 'text-yellow-400'}`}>
                    {r.released ? 'Released' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                  {r.score}%
                </div>
                <p className="text-sm text-white/60 mt-1">Your Score</p>
              </div>
            </div>

            {subscriptionTier === 'premium' && r.released && (
              <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onExportResults(r)}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-emerald-500/40 flex items-center gap-2"
                >
                  <Download size={20} />
                  Export Result
                </motion.button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    )}
  </motion.div>
);
// Reusable Component: CBT Testing
const CBTTesting = ({ cbts, onStartCBT, isLoading, isOffline, subscriptionTier, onPayForCBT }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl"
  >
    <h2 className="text-3xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
      Available CBT Exams
    </h2>

    {isOffline && (
      <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl text-yellow-300 text-center">
        Offline Mode: CBT testing is disabled
      </div>
    )}

    {subscriptionTier === 'basic' ? (
      <div className="text-center py-20">
        <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center border-4 border-purple-500/50">
          <Lock size={64} className="text-purple-400" />
        </div>
        <h3 className="text-3xl font-bold text-purple-400 mb-4">Premium Feature</h3>
        <p className="text-xl text-white/80 mb-8 max-w-md mx-auto">
          CBT exams and real-time testing are available on Pro or Premium plans.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setUpgradeModal({ isOpen: true, feature: 'CBT Access', requiredTier: 'Pro or Premium' })}
          className="px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl hover:shadow-purple-500/40 flex items-center gap-3 mx-auto"
        >
          <CreditCard size={28} />
          Upgrade to Unlock CBT
        </motion.button>
      </div>
    ) : cbts.length === 0 ? (
      <div className="text-center py-20">
        <div className="w-28 h-28 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
          <Brain size={56} className="text-white/40" />
        </div>
        <p className="text-2xl text-white/80 font-medium">No CBT exams available</p>
        <p className="text-white/50 mt-3">Check back later — new tests coming soon!</p>
      </div>
    ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cbts.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03, y: -6 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-purple-500/50 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-purple-300">{c.title}</h3>
                <p className="text-white/80 mt-2">
                  {c.duration} minutes • {c.questions?.length || 0} questions
                </p>
              </div>
              {c.isPractice ? (
                <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/50">
                  FREE PRACTICE
                </span>
              ) : (
                <span className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold border border-amber-500/50">
                  PAID EXAM
                </span>
              )}
            </div>

            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (c.isPractice ? onStartCBT(c.id) : onPayForCBT(c.id))}
                disabled={isLoading || isOffline}
                className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-lg flex items-center justify-center gap-3 ${
                  c.isPractice
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/30'
                } disabled:from-gray-600 disabled:to-gray-700`}
              >
                {c.isPractice ? (
                  <>
                    <Rocket size={28} />
                    Start Free Practice
                  </>
                ) : (
                  <>
                    <CreditCard size={28} />
                    Pay & Start Exam
                  </>
                )}
              </motion.button>
            </div>

            {!c.isPractice && (
              <p className="text-center text-white/50 text-sm mt-4">
                One-time payment required
              </p>
            )}
          </motion.div>
        ))}
      </div>
    )}
  </motion.div>
);

// NEW: CBT Analytics Component (Premium Only)
const CBTAnalytics = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
        <p className="text-xl text-white/60 mt-6">Loading analytics...</p>
      </div>
    );
  }

  const scoreDistData = {
    labels: analytics.scoreDistribution.map(d => `${d.score}%`),
    datasets: [{
      data: analytics.scoreDistribution.map(d => d._count.id),
      backgroundColor: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      hoverOffset: 12,
    }],
  };

  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Average Score',
      data: analytics.monthlyTrend || [65, 72, 68, 78, 82, 88],
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#8B5CF6',
      pointRadius: 6,
      pointHoverRadius: 10,
    }],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl"
    >
      <h2 className="text-4xl font-bold mb-12 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent text-center">
        CBT Analytics Dashboard
      </h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center hover:border-purple-500/60 transition-all duration-300"
        >
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {analytics.totalResults}
          </div>
          <p className="text-white/80 mt-4 text-lg font-medium">Total Tests Taken</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-emerald-600/40 to-teal-600/40 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center hover:border-emerald-500/60 transition-all duration-300"
        >
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            {analytics.avgScore}%
          </div>
          <p className="text-white/80 mt-4 text-lg font-medium">Class Average</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-blue-600/40 to-cyan-600/40 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center hover:border-blue-500/60 transition-all duration-300"
        >
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {analytics.passRate}%
          </div>
          <p className="text-white/80 mt-4 text-lg font-medium">Pass Rate</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Score Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
        >
          <h3 className="text-2xl font-bold text-purple-300 mb-6 text-center">Score Distribution</h3>
          <div className="h-80">
            <Doughnut 
              data={scoreDistData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#e2e8f0', font: { size: 14 } } } }
              }} 
            />
          </div>
        </motion.div>

        {/* Performance Trend */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
        >
          <h3 className="text-2xl font-bold text-purple-300 mb-6 text-center">Performance Trend</h3>
          <div className="h-80">
            <Line 
              data={trendData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { 
                  legend: { labels: { color: '#e2e8f0' } },
                  tooltip: { backgroundColor: '#1e1b4b' }
                },
                scales: {
                  y: { ticks: { color: '#e2e8f0' }, grid: { color: '#ffffff10' } },
                  x: { ticks: { color: '#e2e8f0' }, grid: { color: '#ffffff10' } }
                }
              }} 
            />
          </div>
        </motion.div>
      </div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
      >
        <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Top 5 Performers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {analytics.topPerformers.map((p, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.1, y: -10 }}
              className="text-center group"
            >
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-2xl group-hover:shadow-yellow-500/50 transition-all">
                  {i + 1}
                </div>
                {i === 0 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Crown size={40} className="text-yellow-400 drop-shadow-lg" />
                  </div>
                )}
              </div>
              <p className="text-lg font-bold text-white/90">{p.user.firstName}</p>
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                {p.score}%
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Reusable Component: Payments (UPDATED WITH SPLIT BREAKDOWN)
const Payments = ({ onPayment, paymentForm, setPaymentForm, paymentHistory, isLoading, isOffline, school }) => {
  // Only ₦500 platform fee is hardcoded — everything else is school-controlled
  const PLATFORM_FEE = 500;

  // Commission based on school's plan
  const commissionRate = school.subscriptionTier === 'basic' 
    ? 0.05 
    : school.subscriptionTier === 'pro' 
      ? 0.03 
      : 0.02;

  // Dynamic fees from school settings (add these to your schools table)
  const feeConfig = {
    transcript: school.transcriptFee || 2000,
    cbt: school.cbtExamFee || 1000,
    application: school.applicationFee || 5000,
  };

  const baseAmount = parseFloat(paymentForm.amount) || 0;
  const commissionAmount = baseAmount * commissionRate;
  const totalAmount = baseAmount + PLATFORM_FEE;
  const schoolReceives = baseAmount - commissionAmount;

  // Auto-fill amount when type is selected
  useEffect(() => {
    if (paymentForm.type && !paymentForm.amount) {
      const autoAmounts = {
        transcript: feeConfig.transcript,
        cbt: feeConfig.cbt,
        application: feeConfig.application,
      };
      if (autoAmounts[paymentForm.type]) {
        setPaymentForm(prev => ({ ...prev, amount: autoAmounts[paymentForm.type].toString() }));
      }
    }
  }, [paymentForm.type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl"
    >
      <h2 className="text-4xl font-bold mb-12 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent text-center">
        Make Payment
      </h2>

      {isOffline && (
        <div className="mb-8 p-6 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-300 text-center">
          Offline Mode: Payments are disabled
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Payment Type */}
        <div>
          <label className="text-lg font-medium text-white/90 mb-3 block">
            Select Payment Type
          </label>
          <select
            value={paymentForm.type}
            onChange={(e) => setPaymentForm({ type: e.target.value, amount: '', eventId: '', cbtId: '' })}
            disabled={isOffline}
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white focus:outline-none focus:border-purple-500/60 transition-all text-lg"
          >
            <option value="">Choose payment type</option>
            <option value="fees">School Fees</option>
            <option value="hostel">Hostel Accommodation</option>
            <option value="transcript">Official Transcript</option>
            <option value="cbt">CBT Exam</option>
            <option value="application">Application Form</option>
            <option value="event">Event Registration</option>
          </select>
        </div>

        {/* Event ID for events */}
        {paymentForm.type === 'event' && (
          <div>
            <label className="text-white/90 font-medium mb-3 block">Event ID</label>
            <input
              type="text"
              placeholder="e.g. ORIENTATION2024"
              value={paymentForm.eventId || ''}
              onChange={(e) => setPaymentForm({ ...paymentForm, eventId: e.target.value })}
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500/60 transition-all"
            />
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="text-lg font-medium text-white/90 mb-3 block">
            Amount to Pay (₦)
          </label>
          <input
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            disabled={isOffline || ['transcript', 'cbt', 'application'].includes(paymentForm.type)}
            placeholder={
              paymentForm.type === 'transcript' ? `₦${feeConfig.transcript.toLocaleString()}` :
              paymentForm.type === 'cbt' ? `₦${feeConfig.cbt.toLocaleString()}` :
              paymentForm.type === 'application' ? `₦${feeConfig.application.toLocaleString()}` :
              "Enter amount"
            }
            className="w-full px-6 py-5 bg-white/10 backdrop-blur-xl border border border-white/20 rounded-2xl text-white text-2xl font-bold focus:outline-none focus:border-purple-500/60 transition-all disabled:text-white/60"
          />
        </div>

        {/* Beautiful Payment Breakdown */}
        {paymentForm.amount && paymentForm.type && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-8"
          >
            <h3 className="text-2xl font-bold text-center mb-8 text-white/90">
              Payment Summary
            </h3>

            <div className="space-y-6 text-xl">
              <div className="flex justify-between">
                <span className="text-white/80">Base Amount:</span>
                <span className="font-bold">₦{baseAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-cyan-400">
                <span>Platform Processing Fee:</span>
                <span className="font-bold">+₦{PLATFORM_FEE.toLocaleString()}</span>
              </div>

              <div className={`flex justify-between ${commissionRate === 0.05 ? 'text-red-400' : 'text-emerald-400'}`}>
                <span>SaaS Commission ({(commissionRate * 100).toFixed(0)}%):</span>
                <span className="font-bold">-₦{commissionAmount.toLocaleString()}</span>
              </div>

              <div className="border-t-2 border-white/20 pt-6">
                <div className="flex justify-between text-3xl font-black">
                  <span className="text-white/90">Total Amount:</span>
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-center pt-6">
                <p className="text-white/70 text-lg">
                  <strong>{school.name}</strong> receives:
                </p>
                <p className="text-4xl font-black text-emerald-400 mt-2">
                  ₦{schoolReceives.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pay Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPayment}
          disabled={isLoading || isOffline || !paymentForm.type || !paymentForm.amount}
          className="w-full py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl font-bold text-2xl text-white hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 transition-all shadow-2xl hover:shadow-purple-600/50 flex items-center justify-center gap-4"
        >
          {isLoading ? (
            <>Processing...</>
          ) : (
            <>
              <CreditCard size={32} />
              Pay ₦{totalAmount.toLocaleString()}
            </>
          )}
        </motion.button>

        {/* Payment History */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Payment History
          </h3>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-16 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
              <CreditCard size={64} className="mx-auto mb-6 text-white/30" />
              <p className="text-xl text-white/60">No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentHistory.map((p) => (
                <motion.div
                  key={p.reference}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xl font-bold text-purple-300">{p.type.toUpperCase()}</p>
                      <p className="text-white/70">₦{p.baseAmount.toLocaleString()} + ₦500 fee</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full font-bold ${
                      p.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/50'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">
                    {new Date(p.createdAt).toLocaleDateString('en-GB', { 
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                  {p.invoiceUrl && (
                    <a
                      href={p.invoiceUrl}
                      target="_blank"
                      className="inline-flex items-center gap-2 mt-4 text-purple-400 hover:text-purple-300 transition"
                    >
                      Download Invoice
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};


  const syncPendingActions = async () => {
  if (pendingActions.length === 0 || isOffline) return;

  setIsLoading(true);
  try {
    for (const action of pendingActions) {
      if (action.type === 'register_course') {
        await axios.post(
          `${API_BASE_URL}/api/student/courses/register`,
          { courseId: action.courseId },
          { headers: await getToken() }
        );
      }
    }
    setPendingActions([]);
    storage.remove('pendingActions');
    toast.success('All pending actions synced successfully!');
  } catch (err) {
    console.error('Sync failed:', err);
    toast.error('Some actions failed to sync. Will retry when online.');
  } finally {
    setIsLoading(false);
  }
};

const registerCourse = async (courseId) => {
  if (school.subscriptionTier === 'basic') {
    setUpgradeModal({
      isOpen: true,
      feature: 'Course Registration',
      requiredTier: 'Pro or Premium'
    });
    return;
  }

  if (isOffline) {
    // Save for later
    const newAction = { type: 'register_course', courseId, timestamp: Date.now() };
    const updated = [...pendingActions, newAction];
    setPendingActions(updated);
    storage.set('pendingActions', updated);
    
    toast.success('You\'re offline! Course saved and will register when you\'re back online', {
      icon: 'Saved',
      duration: 5000,
    });
    return;
  }

  setIsLoading(true);
  try {
    await axios.post(
      `${API_BASE_URL}/api/student/courses/register`,
      { courseId },
      { headers: { Authorization: `Bearer ${await getToken()}` } }
    );

    // Refresh courses
    const { data: updatedCourses } = await supabase
      .from('courses')
      .select('*')
      .eq('schoolId', schoolId);
    setCourses(updatedCourses);

    const { data: updatedMyCourses } = await supabase
      .from('student_courses')
      .select('*, course(*)')
      .eq('studentId', user.id);
    setMyCourses(updatedMyCourses.map(sc => ({ id: sc.id, course: sc.course })));

    toast.success('Course registered successfully!', {
      icon: 'Success',
    });
  } catch (err) {
    toast.error('Failed to register course. Please try again.');
    console.error('Registration error:', err);
  } finally {
    setIsLoading(false);
  }
};

const checkCbtPayment = async (cbtId) => {
  try {
    const { data } = await supabase
      .from('payments')
      .select('status')
      .eq('cbtId', cbtId)
      .eq('studentId', user.id)
      .eq('status', 'SUCCESS')
      .single();

    return data?.status === 'SUCCESS';
  } catch (err) {
    return false;
  }
};

  const startCBT = async (cbtId) => {
  if (school.subscriptionTier === 'basic') {
    setUpgradeModal({
      isOpen: true,
      feature: 'CBT Exams',
      requiredTier: 'Pro or Premium'
    });
    return;
  }

  if (isOffline) {
    toast.error('You\'re offline. CBT exams require internet connection.', {
      icon: 'No connection',
      duration: 6000,
    });
    return;
  }

  setIsLoading(true);
  try {
    const cbt = cbts.find(c => c.id === cbtId);
    if (!cbt) {
      toast.error('CBT not found. Please refresh and try again.');
      return;
    }

    if (cbt.isPractice) {
      toast.success(`Starting practice: ${cbt.title}`, { icon: 'Practice mode' });
      navigate(`/${schoolId}/cbt/${cbtId}`);
      return;
    }

    // Paid CBT — check payment
    const isPaid = await checkCbtPayment(cbtId);
    
    if (isPaid) {
      toast.success(`Welcome back! Starting: ${cbt.title}`, { icon: 'Success' });
      navigate(`/${schoolId}/cbt/${cbtId}`);
    } else {
      // Dynamic CBT fee from school settings
      const cbtFee = school.cbtExamFee || 1000;
      
      setPaymentForm({ 
        type: 'cbt', 
        amount: cbtFee.toString(), 
        cbtId 
      });
      
      toast.error(
        `Payment required: ₦${cbtFee.toLocaleString()} to start this CBT exam`,
        { 
          icon: 'Payment required',
          duration: 8000,
        }
      );
      
      navigate(`/${schoolId}/student-portal/payments`);
    }
  } catch (err) {
    console.error('CBT start error:', err);
    toast.error('Failed to load CBT. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

const handlePayment = async () => {
  if (isOffline) {
    toast.error('You\'re offline. Payments require internet connection.', {
      icon: 'No connection',
      duration: 6000,
    });
    return;
  }

  if (!paymentForm.type || !paymentForm.amount) {
    toast.error('Please select payment type and enter amount');
    return;
  }

  if (paymentForm.type === 'event' && !paymentForm.eventId) {
    toast.error('Event ID is required');
    return;
  }

  if (paymentForm.type === 'cbt' && !paymentForm.cbtId) {
    toast.error('CBT ID is missing');
    return;
  }

  setIsLoading(true);

  try {
    const token = await getToken();
    const baseAmount = parseFloat(paymentForm.amount);
    const platformFee = 500;
    const totalAmount = baseAmount + platformFee;

    const payload = {
      amount: baseAmount,
      ...(paymentForm.type === 'event' && { eventId: paymentForm.eventId }),
      ...(paymentForm.type === 'cbt' && { cbtId: paymentForm.cbtId }),
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/student/pay/${paymentForm.type}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { reference } = response.data;

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user.emailAddress,
      amount: totalAmount * 100,
      reference,
      metadata: {
        studentId: user.id,
        type: paymentForm.type,
        schoolId,
        baseAmount,
        platformFee,
        ...(paymentForm.type === 'event' && { eventId: paymentForm.eventId }),
        ...(paymentForm.type === 'cbt' && { cbtId: paymentForm.cbtId }),
      },
      onSuccess: async () => {
        try {
          await axios.post(
            `${API_BASE_URL}/api/student/pay/${paymentForm.type}/approve`,
            { reference },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          toast.success(`${paymentForm.type.toUpperCase()} payment successful!`, {
            icon: 'Success',
            duration: 6000,
          });

          // Reset form
          setPaymentForm({ type: '', amount: '', eventId: '', cbtId: '' });

          // Navigate based on payment type
          if (paymentForm.type === 'cbt' && paymentForm.cbtId) {
            toast.success('Starting your CBT exam now...', { icon: 'Exam' });
            navigate(`/${schoolId}/cbt/${paymentForm.cbtId}`);
          } else if (paymentForm.type === 'transcript') {
            setTranscript(prev => ({ ...prev, transcriptPaid: true }));
            toast.success('Transcript unlocked! You can now download it.', { icon: 'Unlocked' });
          }

          // Refresh payment history
          const { data } = await supabase
            .from('payments')
            .select('*')
            .eq('schoolId', schoolId)
            .eq('studentId', user.id)
            .order('createdAt', { ascending: false });
          setPaymentHistory(data || []);

        } catch (err) {
          console.error('Payment approval failed:', err);
          toast.error('Payment was successful but verification failed. Contact support.');
        }
      },
      onCancel: () => {
        toast.error('Payment cancelled', { icon: 'Cancelled' });
      },
    });
  } catch (err) {
    console.error('Payment initiation failed:', err);
    toast.error(err.response?.data?.error || 'Payment failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const generatePDF = (data, type = 'transcript') => {
  if (!data || !data.courses) {
    toast.error(`Invalid ${type} data. Cannot generate PDF.`, { icon: 'Warning' });
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const schoolName = school.name || 'Your School';

  // Header with school branding
  doc.setFontSize(22);
  doc.setTextColor(139, 92, 246); // Purple
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(
    type === 'transcript' ? 'Official Transcript' : 'Course Registration Form',
    pageWidth / 2,
    32,
    { align: 'center' }
  );

  // Student info
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text(`Student: ${user?.firstName || 'N/A'} ${user?.lastName || ''}`, 20, 45);
  doc.text(`ID: ${user?.id || 'N/A'}`, 20, 52);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 59);

  // Table
  const tableData = type === 'transcript'
    ? data.courses.map(c => [
        c.course.split(' - ')[0] || c.course,
        c.grade || 'N/A',
        c.creditUnit || 'N/A'
      ])
    : data.courses.map(c => [c.course?.code || c.code, c.course?.title || c.title]);

  doc.autoTable({
    startY: 70,
    head: [type === 'transcript' 
      ? ['Course Code', 'Grade', 'Credit Units'] 
      : ['Course Code', 'Course Title']
    ],
    body: tableData,
    theme: 'dark',
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 11,
      cellPadding: 6,
      textColor: 220,
    },
    alternateRowStyles: { fillColor: [30, 30, 40] },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
    },
  });

  // GPA for transcript
  if (type === 'transcript' && data.gpa) {
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(24);
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`GPA: ${data.gpa}`, pageWidth / 2, finalY, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(180, 180, 180);
    doc.text('Cumulative Grade Point Average', pageWidth / 2, finalY + 10, { align: 'center' });
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated by ${schoolName} • Powered by EduHive`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });

  // Save with school name
  const filename = `${schoolName.replace(/\s+/g, '_')}_${type}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);

  toast.success(`${type === 'transcript' ? 'Transcript' : 'Registration form'} downloaded!`, {
    icon: 'Downloaded',
    duration: 4000,
  });
};

const exportCBTResult = async (result) => {
  if (school.subscriptionTier !== 'premium') {
    setUpgradeModal({
      isOpen: true,
      feature: 'Export CBT Results',
      requiredTier: 'Premium'
    });
    return;
  }

  if (isOffline) {
    toast.error('Cannot export results offline', { icon: 'No connection' });
    return;
  }

  setIsLoading(true);
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246);
    doc.text(`${school.name || 'School'} - CBT Result`, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`Student: ${user?.firstName || 'N/A'} ${user?.lastName || ''}`, 20, 35);
    doc.text(`Exam: ${result.cBT.title}`, 20, 45);
    doc.text(`Score: ${result.score}%`, 20, 55);

    // Big score
    doc.setFontSize(60);
    doc.setTextColor(result.score >= 70 ? 34 : result.score >= 50 ? 251 : 239, 
                  result.score >= 70 ? 197 : result.score >= 50 ? 197 : 76, 
                  result.score >= 70 ? 94 : result.score >= 50 ? 59 : 76);
    doc.text(`${result.score}%`, pageWidth / 2, 100, { align: 'center' });

    // Status
    const status = result.score >= 70 ? 'PASS' : 'FAIL';
    const statusColor = result.score >= 70 ? [34, 197, 94] : [239, 76, 76];
    doc.setFillColor(...statusColor);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.roundedRect(pageWidth / 2 - 40, 115, 80, 30, 10, 10, 'F');
    doc.text(status, pageWidth / 2, 133, { align: 'center' });

    // Details
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(12);
    doc.text(`Taken: ${new Date(result.takenAt).toLocaleString()}`, 20, 160);
    doc.text(`Duration: ${result.cBT.duration} minutes`, 20, 170);
    doc.text(`Questions: ${result.cBT.questions?.length || 'N/A'}`, 20, 180);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Exported by ${user?.firstName} • Powered by EduHive`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });

    const filename = `${school.name?.replace(/\s+/g, '_') || 'School'}_CBT_${result.cBT.title.replace(/\s+/g, '_')}_${result.score}%.pdf`;
    doc.save(filename);

    toast.success('CBT result exported successfully!', { icon: 'Exported' });
  } catch (err) {
    console.error('Export failed:', err);
    toast.error('Failed to export result');
  } finally {
    setIsLoading(false);
  }
};

//if (!user) return <Navigate to="/sign-in" replace />;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/30 backdrop-blur-2xl border-r border-white/10 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-xl font-bold">
              {user.firstName?.[0] || 'S'}
            </div>
            <div>
              <h1 className="text-xl font-bold">{user.firstName || 'Student'}</h1>
              <p className="text-xs opacity-60">Student Portal</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {[
            { icon: Home, label: 'Courses', path: '' },
            { icon: BookOpen, label: 'My Courses', path: 'my-courses' },
            { icon: Clock, label: 'Timetable', path: 'timetable' },
            { icon: Brain, label: 'CBT', path: 'cbt' },
            { icon: FileText, label: 'Results', path: 'cbt-results' },
            { icon: CreditCard, label: 'Payments', path: 'payments' },
            { icon: FileText, label: 'Transcript', path: 'transcript' },
            { icon: Users, label: 'Link Parents', path: 'parents' },
          ].map(item => (
            <NavLink
              key={item.path}
              to={`/${schoolId}/student-portal${item.path ? '/' + item.path : ''}`}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => 
                `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="lg:ml-64 min-h-screen">
        {/* TOPBAR */}
        <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-black/30 backdrop-blur-2xl border-b border-white/10 z-40 flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Student Portal
          </h1>
          <div className="flex items-center gap-4">
            <NavLink
              to="/"
              className="px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Globe size={18} />
              Back to Website
            </NavLink>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold">
              {user.firstName?.[0]}
            </div>
          </div>
        </header>

        {/* ALL CONTENT INSIDE MAIN */}
        <main className="pt-20 px-6 pb-10">
          {location.pathname === `/${schoolId}/student-portal` && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Available Courses
              </h2>
              {courses.length === 0 ? (
                <div className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-12 text-center">
                  <p className="text-white/60 text-xl">No courses available for registration</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(c => (
                    <motion.div
                      key={c.id}
                      whileHover={{ scale: 1.03 }}
                      className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 hover:border-purple-500/50 transition-all"
                    >
                      <h3 className="text-2xl font-bold text-purple-300">{c.code}</h3>
                      <p className="text-lg mt-2">{c.title}</p>
                      {c.teacher && <p className="text-sm text-white/70 mt-3">Teacher: {c.teacher}</p>}
                      {c.schedule && (
                        <p className="text-sm text-green-400 mt-2">
                          {c.schedule.day} • {c.schedule.time}
                        </p>
                      )}
                      <button
                        onClick={() => registerCourse(c.id)}
                        className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition"
                      >
                        Register Now
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
      
      {location.pathname === `/${schoolId}/student-portal/my-courses` && (
        <MyCourses courses={myCourses} onGeneratePDF={generatePDF} isLoading={isLoading} isOffline={isOffline} subscriptionTier={school.subscriptionTier} />
      )}

      {location.pathname === `/${schoolId}/student-portal/timetable` && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl"
  >
    <h2 className="text-2xl font-bold text-gray-800 mb-8" style={{ fontFamily: 'var(--font-family)' }}>
      My Weekly Timetable
    </h2>

    <div className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 overflow-x-auto">
      <div className="grid grid-cols-8 gap-4 min-w-[900px]">
        {/* Headers */}
        <div></div>
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
          <div key={day} className="text-center">
            <p className="text-sm text-white/60">{day.slice(0, 3)}</p>
            <p className="text-lg font-bold text-purple-400">{day}</p>
          </div>
        ))}

        {/* Time slots */}
        {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(time => (
          <>
            <div className="text-right pr-4 text-white/80 font-medium text-sm flex items-center justify-end">
              {time}
            </div>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
              const course = myCourses
                .map(reg => reg.course)
                .find(c => c.schedule?.day === day && c.schedule?.time === time);

              return (
                <div
                  key={`${day}-${time}`}
                  className={`min-h-28 rounded-2xl border border-white/10 p-4 transition-all ${
                    course
                      ? 'bg-gradient-to-br from-purple-600/40 to-blue-600/40 hover:shadow-2xl hover:shadow-purple-500/30 cursor-pointer'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {course ? (
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-purple-300">{course.code}</p>
                      <p className="text-white/90">{course.title}</p>
                      <p className="text-white/70">{course.teacher}</p>
                      <p className="text-white/60 text-xs">Room {course.room}</p>
                    </div>
                  ) : (
                    <p className="text-white/30 text-center text-xs">Free</p>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  </motion.div>
)}
      
      {location.pathname === `/${schoolId}/student-portal/transcript` && (
        <>
          <Transcript
            transcript={transcript}
            onGeneratePDF={generatePDF}
            onPay={() => setPaymentForm({ type: 'transcript', amount: '2000' })}
            isLoading={isLoading}
            isOffline={isOffline}
            transcriptPaid={transcript?.transcriptPaid}
            subscriptionTier={school.subscriptionTier}
          />
          {transcript?.transcriptPaid && (
            <TranscriptDownload transcript={transcript} isOffline={isOffline} onGeneratePDF={generatePDF} />
          )}
        </>
      )}
      
      {location.pathname === `/${schoolId}/student-portal/cbt` && (
        <CBTTesting
          cbts={cbts}
          onStartCBT={startCBT}
          onPayForCBT={(cbtId) => setPaymentForm({ type: 'cbt', amount: '1000', cbtId })}
          isLoading={isLoading}
          isOffline={isOffline}
          subscriptionTier={school.subscriptionTier}
        />
      )}
      
      {location.pathname === `/${schoolId}/student-portal/cbt-results` && (
        <>
          <CBTResults
            results={cbtResults}
            isOffline={isOffline}
            subscriptionTier={school.subscriptionTier}
            onExportResults={exportCBTResult}
          />
          {school.subscriptionTier === 'premium' && (
            <CBTAnalytics analytics={analytics} isLoading={isLoadingAnalytics} />
          )}
        </>
      )}
      
      {location.pathname === `/${schoolId}/student-portal/parents` && (
      <ParentLinking user={user} schoolId={schoolId} isOffline={isOffline} />
       )}

      {location.pathname === `/${schoolId}/student-portal/payments` && (
        <Payments
          onPayment={handlePayment}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          paymentHistory={paymentHistory}
          isLoading={isLoading}
          isOffline={isOffline}
          school={school}
        />
      )}
            {/* FALLBACK — IF NO TAB MATCHES */}
      {![``, `my-courses`, `timetable`, `cbt`, `cbt-results`, `payments`, `transcript`, `parents`].some(
        tab => location.pathname === `/${schoolId}/student-portal${tab ? '/' + tab : ''}`
      ) && (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-black text-white mb-6">Welcome to Student Portal</h1>
            <p className="text-2xl text-white/80">Select a tab from the sidebar</p>
            <p className="text-lg text-cyan-300 mt-8">Logged in as {user?.firstName || 'Student'}</p>
          </div>
        </div>
      )}
        </main>
      </div>
       {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
    
  );
};

export default StudentDashboard;