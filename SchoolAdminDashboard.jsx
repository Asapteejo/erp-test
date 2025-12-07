// src/pages/SchoolAdminDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { useClerkAuth } from '../hooks/useClerkAuth';
import HomePage from '../pages/HomePage';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import UpgradeModal from '../components/admin/UpgradeModal';
import { GlassInput, GlassSelect, GlassButton, GlassCard } from '../components/ui';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Bar as ChartJsBar } from 'react-chartjs-2';

import { 
  Menu, X, Home, Users, TrendingUp, Calendar, MessageCircle, Settings,
  Bell, Search, Moon, Sun, Download, Filter, Plus, Send,
  Clock, BookOpen, FileText, AlertCircle, Palette, Megaphone, Building2, Brain, Archive, BarChart3, CreditCard, Layout
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);


const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const SchoolAdminDashboard = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { getToken: getClerkToken, user, logout: clerkLogout } = useClerkAuth();

  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState(7);
  const [messages] = useState([
  { id: 1, name: "Dr. Adebayo", message: "New assignment uploaded", time: "10:21", avatar: "A" },
  { id: 2, name: "Student Union", message: "Meeting rescheduled", time: "10:08", avatar: "SU" },
  { id: 3, name: "Mrs. Okonkwo", message: "Grade submission deadline", time: "09:56", avatar: "O" },
]);

  // === FULL WORKING STATES FROM OLD DASHBOARD ===
  const [school, setSchool] = useState({ name: 'Loading...', subscriptionTier: 'basic', fontFamily: 'Inter' });
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    motto: '', primaryColor: '#3B82F6', secondaryColor: '#1E40AF', customAbout: '', layout: 'Classic',
    fontFamily: 'Inter', logoFile: null, heroImageFile: null, heroVideoFile: null,
    socialMediaIcons: [], socialMediaLinks: [], customPrograms: [{ name: '', description: '', imageFile: null }],
    footerAbout: '', footerEmail: '', footerPhone: '', footerAddress: '', footerFacebook: '', footerTwitter: '', footerInstagram: '', footerLinkedIn: ''
  });
  const [previewData, setPreviewData] = useState(formData);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', requiredTier: '' });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', type: 'lecturer', regNumber: '' });
  const [logoFile, setLogoFile] = useState(null);

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cbts, setCbts] = useState([]);
  const [selectedCbtId, setSelectedCbtId] = useState('');
  const [analytics, setAnalytics] = useState({});
  const [archivedResults, setArchivedResults] = useState([]);
  const [revenueChartData, setRevenueChartData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({ type: '', bankCode: '', accountNumber: '', accountName: '' });
  const [customFontUrl, setCustomFontUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  const [form, setForm] = useState({
  code: '',
  title: '',
  creditUnit: 3,
  teacher: '',
  room: '',
  schedule: {
    day: '',
    time: ''
  }
});
  const [cbtForm, setCbtForm] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [activityFeed, setActivityFeed] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [onlineUsersList, setOnlineUsersList] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // === FETCH SCHOOL ===
useEffect(() => {
  const fetchSchool = async () => {
    try {
      // In dev: skip Clerk token entirely — we already have fake auth
      if (!import.meta.env.DEV) {
        const token = await getClerkToken({ template: 'supabase' });
        if (token) {
          await supabase.auth.setSession({ access_token: token });
        }
      }

      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (error) throw error;
      setSchool(data);

      // Apply customization
      setFormData(prev => ({
        ...prev,
        motto: data.motto || '',
        primaryColor: data.primaryColor || '#3B82F6',
        secondaryColor: data.secondaryColor || '#1E40AF',
        layout: data.layout || 'Classic',
        fontFamily: data.fontFamily || 'Inter',
        socialMediaIcons: data.socialMediaIcons || [],
        socialMediaLinks: data.socialMediaLinks || [],
        customPrograms: data.customPrograms || [{ name: '', description: '', imageFile: null }],
      }));

      setPreviewData({ ...data, logoUrl: data.logoUrl, heroImageUrl: data.heroImageUrl });
      setDarkMode(data.darkMode ?? true);
    } catch (err) {
      console.error('School load error:', err);
      toast.error('Failed to load school data');
      // Don't break the whole dashboard if school fails to load
      setSchool({ name: 'My School', subscriptionTier: 'basic' });
    } finally {
      setLoading(false);
    }
  };

  if (schoolId) fetchSchool();
}, [schoolId, getClerkToken]);

  // Apply font
  useEffect(() => {
    if (school.fontFamily) {
      document.documentElement.style.setProperty('--font-family', school.fontFamily);
    }
  }, [school.fontFamily]);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Fetch tab data
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'customize') return;
    const endpoints = {
      users: '/api/admin/users',
      courses: '/api/admin/courses',
      announcements: '/api/admin/announcements',
      departments: '/api/admin/departments',
      cbt: '/api/admin/cbt/all',
      analytics: '/api/admin/analytics',
      cbtResults: '/api/admin/results/archive',
      accounts: '/api/subaccount/list',
    };
    if (endpoints[activeTab]) {
      fetchWithToken(endpoints[activeTab])
        .then(data => {
          if (activeTab === 'users') setUsers(data.users || []);
          if (activeTab === 'courses') setCourses(data || []);
          if (activeTab === 'announcements') setPosts(data || []);
          if (activeTab === 'departments') setDepartments(data || []);
          if (activeTab === 'cbt') setCbts(data || []);
          if (activeTab === 'analytics') { setAnalytics(data.basic || {}); fetchRevenue(); }
          if (activeTab === 'cbtResults') setArchivedResults(data || []);
          if (activeTab === 'accounts') setAccounts(data || []);
        })
        .catch(() => toast.error('Failed to load data'));
    }
  }, [activeTab]);
  
  // === REAL-TIME MAGIC ===
useEffect(() => {
  const channel = supabase
    .channel(`school-${schoolId}`, {
      config: { broadcast: { self: true }, presence: { key: user?.id } }
    });

  // Track online users
  channel
    .on('presence', { event: 'sync' }, () => {
      const presence = channel.presenceState();
      setOnlineUsers(Object.keys(presence).length);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      setActivityFeed(prev => [...prev.slice(0, 9), {
        type: 'join',
        message: `${newPresences[0].user_name || 'Someone'} joined`,
        time: new Date().toLocaleTimeString()
      }]);
    });

  // Listen to payments
  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, (payload) => {
      toast.success(`New payment: ₦${payload.new.amount} from ${payload.new.student_name}`);
      setNotifications(prev => prev + 1);
      setActivityFeed(prev => [...prev.slice(0, 9), {
        type: 'payment',
        message: `₦${payload.new.amount} from ${payload.new.student_name}`,
        time: new Date().toLocaleTimeString()
      }]);
    });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [schoolId, user]);

// === REAL-TIME ONLINE USERS LIST (Who’s Online) ===
useEffect(() => {
  const channel = supabase.channel(`school-${schoolId}`, {
    config: { presence: { key: user?.id } }
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const presence = channel.presenceState();
      const list = Object.entries(presence).map(([key, val]) => ({
        id: key,
        name: val[0]?.user_name || 'Anonymous',
        role: val[0]?.role || 'Student',
        status: val[0]?.status || 'online'
      }));
      setOnlineUsersList(list);
      setOnlineUsers(list.length);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      setActivityFeed(prev => [...prev.slice(0, 9), {
        type: 'join',
        message: `${newPresences[0].user_name || 'Someone'} joined`,
        time: new Date().toLocaleTimeString()
      }]);
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      setActivityFeed(prev => [...prev.slice(0, 9), {
        type: 'leave',
        message: `${leftPresences[0].user_name || 'Someone'} left`,
        time: new Date().toLocaleTimeString()
      }]);
    });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [schoolId, user]);

  const fetchWithToken = async (url) => {
    const token = await getClerkToken();
    const res = await axios.get(`${API_BASE_URL}${url}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  };

  const fetchRevenue = async () => {
    const data = await fetchWithToken('/api/admin/revenue');
    setRevenueChartData({
      labels: ['Basic (5%)', 'Pro (3%)', 'Premium (2%)'],
      datasets: [{ label: 'Revenue (₦)', data: [data.basicRevenue || 0, data.proRevenue || 0, data.premiumRevenue || 0], backgroundColor: ['#EF4444', '#F59E0B', '#10B981'] }],
    });
  };

  const handleChange = (e, index) => {
    const { name, value, files } = e.target;
    const file = files ? files[0] : null;
    if (name.startsWith('customPrograms')) {
      const newPrograms = [...formData.customPrograms];
      newPrograms[index][name.split('.')[2]] = file || value;
      setFormData({ ...formData, customPrograms: newPrograms });
      setPreviewData({ ...previewData, customPrograms: newPrograms.map(p => ({ ...p, imageUrl: p.imageFile ? URL.createObjectURL(p.imageFile) : p.imageUrl })) });
    } else {
      setFormData({ ...formData, [name]: file || value });
      setPreviewData({ ...previewData, [name]: file ? URL.createObjectURL(file) : value });
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const token = await getClerkToken();
    let logoUrl = school.logoUrl;
    if (formData.logoFile) {
      const { data } = await supabase.storage
        .from("school-assets")
        .upload(
          `logos/${schoolId}/${formData.logoFile.name}`,
          formData.logoFile,
          { upsert: true }
        );

      logoUrl = supabase.storage
        .from("school-assets")
        .getPublicUrl(data.path).data.publicUrl;
    }
    const faviconUrl = formData.faviconUrl || school.faviconUrl || null;
    await supabase
      .from("schools")
      .update({
        motto: formData.motto,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        logoUrl,
        faviconUrl,    
      })
      .eq("id", schoolId);

    toast.success("Saved!");
  } catch (err) {
    toast.error("Save failed");
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const sendInvite = async () => {
    if (!inviteForm.email) return toast.error('Email required');
    try {
      const token = await getClerkToken();
      await fetch('/api/invite', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...inviteForm, schoolId }) });
      toast.success('Invite sent!');
      setShowInviteModal(false);
    } catch {
      toast.error('Failed');
    }
  };
  const handleDragEnd = (result) => {
  if (!result.destination || school.subscriptionTier === 'basic') return;
  const items = Array.from(formData.customPrograms);
  const [reordered] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reordered);
  setFormData({ ...formData, customPrograms: items });
};

const addProgram = () => {
  if (formData.customPrograms.length >= (school.subscriptionTier === 'premium' ? 20 : 5)) {
    setUpgradeModal({ isOpen: true, feature: 'more programs', requiredTier: 'Premium' });
    return;
  }
  setFormData({
    ...formData,
    customPrograms: [...formData.customPrograms, { name: '', description: '', imageFile: null }]
  });
};

const removeProgram = (index) => {
  setFormData({
    ...formData,
    customPrograms: formData.customPrograms.filter((_, i) => i !== index)
  });
};

const handleSocialMediaIconChange = (index, file) => {
  const newIcons = [...formData.socialMediaIcons];
  newIcons[index] = file;
  setFormData({ ...formData, socialMediaIcons: newIcons });
};

const addSocialMediaIcon = () => {
  if (formData.socialMediaIcons.length >= 5) {
    setUpgradeModal({ isOpen: true, feature: 'more social icons', requiredTier: 'Premium' });
    return;
  }
  setFormData({
    ...formData,
    socialMediaIcons: [...formData.socialMediaIcons, null],
    socialMediaLinks: [...formData.socialMediaLinks, '']
  });
};

const handleCreate = async (type) => {
  try {
    const token = await getClerkToken();
    await axios.post(`${API_BASE_URL}/api/admin/${type}`, form, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Created!');
    setForm({});
  } catch {
    toast.error('Failed');
  }
};

const handleAddAccount = async (e) => {
  e.preventDefault();
  try {
    const token = await getClerkToken();
    const res = await axios.post(`${API_BASE_URL}/api/subaccount/create`, newAccount, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAccounts([...accounts, res.data.subaccount]);
    toast.success('Account added');
  } catch {
    toast.error('Failed');
  }
};

const handleSaveTheme = async () => {
  try {
    const token = await getClerkToken();
    await axios.post(`${API_BASE_URL}/api/schools/theme`, {
      schoolId, customFont: customFontUrl, faviconUrl, customDomain
    }, { headers: { Authorization: `Bearer ${token}` } });
    toast.success('Theme saved');
  } catch {
    toast.error('Failed');
  }
};

const sanitizeInput = (str) => str.replace(/[<>&]/g, '');

  // Real-time mock data (replace with Supabase later)
  const [performanceData] = useState([
    { week: '1 week', score: 100 },
    { week: '2 week', score: 63 },
    { week: '3 week', score: 27 },
    { week: '4 week', score: 81 },
  ]);

  const [attendance] = useState(83);
  const [stats] = useState({
    groups: 6,
    students: 127,
    lessons: 34,
  });

  const calendarDays = useMemo(() => {
    const start = startOfWeek(new Date());
    return Array.from({ length: 35 }, (_, i) => {
      const date = addDays(start, i);
      return {
        date,
        day: format(date, 'd'),
        isToday: isToday(date),
        hasEvent: Math.random() > 0.7,
      };
    });
  }, []);

  const programPlan = [
    { type: 'Lesson', title: 'Mathematics 101', time: '40 min', icon: BookOpen },
    { type: 'Test', title: 'Physics Midterm', time: '15 min / 10 questions', icon: FileText },
    { type: 'Homework', title: 'Nothing is here yet', status: 'pending', icon: AlertCircle },
    { type: 'Lesson', title: 'English Literature', time: '25 min', icon: BookOpen },
  ];
  
  const generateAISummary = async () => {
  const res = await fetch('/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schoolId })
  });
  const { summary } = await res.json();
  setAiSummary(summary);
};
  
const speak = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
  }
};

const startTyping = () => {
  supabase.channel(`school-${schoolId}`).track({ status: 'typing...' });
};

const stopTyping = () => {
  supabase.channel(`school-${schoolId}`).track({ status: 'online' });
};
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0f0f0f]' : 'bg-gray-50'} text-white font-sans`}>
      {/* SAFEK'S EXACT SIDEBAR (mobile + desktop perfect) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/30 backdrop-blur-2xl border-r border-white/10 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
         <div className="flex items-center gap-3">
  {school.logoUrl ? (
    <img 
      src={school.logoUrl} 
      alt={school.name} 
      className="w-10 h-10 rounded-xl object-cover border border-white/20"
    />
  ) : (
    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg">
      {school.name?.[0]?.toUpperCase() || 'S'}
    </div>
  )}
  <div>
    <h1 className="text-xl font-bold">{school.name || 'Loading...'}</h1>
    <p className="text-xs opacity-60">Admin Portal</p>
  </div>
</div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {[
            { icon: Home, label: 'Overview', tab: 'overview' },
            { icon: Palette, label: 'Customize Site', tab: 'customize' },
            { icon: Users, label: 'Users', tab: 'users' },
            { icon: BookOpen, label: 'Courses', tab: 'courses' },
            { icon: Brain, label: 'CBT System', tab: 'cbt' },
            { icon: CreditCard, label: 'Payments', tab: 'accounts' },
            { icon: BarChart3, label: 'Analytics', tab: 'analytics' },
            { icon: MessageCircle, label: 'Messages', tab: 'messages', badge: 3 },
            { icon: Settings, label: 'Settings', tab: 'settings' },
          ].map(item => (
            <button
              key={item.tab}
              onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.tab 
                  ? 'bg-white/20 shadow-lg' 
                  : 'hover:bg-white/10'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {item.badge && <span className="ml-auto bg-purple-500 text-xs px-2 py-1 rounded-full">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
  onClick={async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try {
      await supabase
        .from('schools')
        .update({ darkMode: newMode })
        .eq('id', schoolId);
    } catch (err) {
      toast.error('Failed to save theme preference');
    }
  }}
  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition"
>
  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
  <span>{darkMode ? 'Light' : 'Dark'} Mode</span>
</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* TOPBAR */}
        <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-black/30 backdrop-blur-2xl border-b border-white/10 z-40 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white/10 rounded-xl border border-white/20 focus:border-purple-500 focus:outline-none w-64 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-white/10">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {notifications}
              </span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold">
              {user?.firstName?.[0] || 'A'}
            </div>
            <button onClick={clerkLogout} className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-xl text-sm">
              Logout
            </button>
          </div>
        </header>

    {/* Page Content */}
        <main className="pt-20 px-6 pb-10">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome back, Admin
                 </h1>
                    <p className="text-white/60 text-xl mt-2">Here's what's happening in your school today</p>
                  <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all">
                    Start the Lesson
                  </button>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>
                {/* Performance + Attendance */}
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Performance Chart */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-bold">Student Performance</h2>
                      <select className="px-6 py-3 bg-white/10 rounded-xl border border-white/20">
                        <option>Group 1</option>
                      </select>
                    </div>
                    <div className="flex gap-4 mb-6">
                      {['Daily', 'Weekly', 'Monthly'].map((period) => (
                        <button
                          key={period}
                          className={`px-6 py-3 rounded-xl transition-all ${
                            period === 'Weekly'
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="week" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                          />
                          <Bar dataKey="score" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Attendance Ring */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center"
                  >
                    <h3 className="text-2xl font-bold mb-6">Attendance</h3>
                    <div className="relative">
                      <ResponsiveContainer width={200} height={200}>
                        <PieChart>
                          <Pie
                            data={[{ value: attendance }, { value: 100 - attendance }]}
                            innerRadius={70}
                            outerRadius={90}
                            dataKey="value"
                          >
                            <Cell fill="#8b5cf6" />
                            <Cell fill="#333" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-5xl font-black">{attendance}%</div>
                        </div>
                      </div>
                    </div>
                    <button className="mt-8 px-8 py-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all flex items-center gap-3">
                      <Download size={20} />
                      Download Report
                    </button>
                  </motion.div>
                </div>

                {/* Calendar + Program Plan */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8"
                  >
                    <h2 className="text-3xl font-bold mb-6">November 2023</h2>
                    <div className="grid grid-cols-7 gap-2 text-center">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="text-white/60 font-medium py-3">{day}</div>
                      ))}
                      {calendarDays.map((d, i) => (
                        <div
                          key={i}
                          className={`py-4 rounded-2xl transition-all ${
                            d.isToday
                              ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold'
                              : d.hasEvent
                              ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                              : 'hover:bg-white/10 cursor-pointer'
                          }`}
                        >
                          {d.day}
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Program Plan */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-3xl font-bold">Program Plan</h2>
                    {programPlan.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 flex items-center gap-6"
                      >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                          item.type === 'Lesson' ? 'bg-blue-600' :
                          item.type === 'Test' ? 'bg-purple-600' :
                          'bg-gray-600'
                        }`}>
                          <item.icon size={32} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold">{item.title}</h4>
                          <p className="text-white/60 flex items-center gap-2">
                            <Clock size={16} />
                            {item.time || item.status}
                          </p>
                        </div>
                        <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                          <Send size={20} />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-8">
                    {[
                      { label: 'Total groups', value: stats.groups, icon: Users },
                      { label: 'Total students', value: stats.students, icon: Users },
                      { label: 'Total planned lessons', value: stats.lessons, icon: Calendar },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 text-center"
                      >
                        <stat.icon size={48} className="mx-auto mb-4 text-purple-400" />
                        <div className="text-5xl font-black">{stat.value}</div>
                        <p className="text-white/60 mt-2">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
                {/* Live Activity Feed */}
              <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8"
>
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-3xl font-bold">Live Activity</h2>
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-green-400 font-bold">{onlineUsers} online</span>
    </div>
  </div>
  <div className="space-y-4">
    {activityFeed.length === 0 ? (
      <p className="text-white/60 text-center py-8">No activity yet...</p>
    ) : (
      activityFeed.map((item, i) => (
        <motion.div
          key={i}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4 bg-white/5 rounded-2xl p-4"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            item.type === 'payment' ? 'bg-green-600' : 'bg-blue-600'
          }`}>
            {item.type === 'payment' ? '₦' : '●'}
          </div>
          <div className="flex-1">
            <p className="font-medium">{item.message}</p>
            <p className="text-white/60 text-sm">{item.time}</p>
          </div>
        </motion.div>
      ))
    )}
  </div>
</motion.div>
{/* Online Users List */}
{(school.subscriptionTier === 'pro' || school.subscriptionTier === 'premium') && (
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8"
>
  <h2 className="text-3xl font-bold mb-6">Users Online Now</h2>
  <div className="space-y-3">
    {onlineUsersList.length === 0 ? (
      <p className="text-white/60 text-center py-8">No one online yet</p>
    ) : (
      onlineUsersList.map((u) => (
        <div key={u.id} className="flex items-center gap-4 bg-white/5 rounded-2xl p-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {u.name[0]}
          </div>
          <div>
            <p className="font-medium">{u.name}</p>
            <p className="text-sm text-white/60">{u.role} • {u.status}</p>
          </div>
        </div>
      ))
    )}
  </div>
</motion.div>
)}
  {/* AI Summary & Voice — Available in Pro & Premium */}
{school.subscriptionTier === 'premium' ? (
  <>
    <button onClick={generateAISummary} className="px-6 py-3 bg-purple-600 rounded-xl hover:bg-purple-700">
      Generate AI Summary
    </button>
    {aiSummary && (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-3xl text-white">
        <h3 className="text-2xl font-bold mb-3">AI Summary</h3>
        <p>{aiSummary}</p>
      </div>
    )}

    <button
      onClick={() => speak(`Attention! CBT starts in 5 minutes. ${onlineUsers} students are ready.`)}
      className="px-6 py-3 bg-orange-600 rounded-xl hover:bg-orange-700 flex items-center gap-3"
    >
      <Send size={20} />
      {isSpeaking ? 'Speaking...' : 'Announce'}
    </button>
  </>
) : (
  <div className="bg-gray-800/50 backdrop-blur p-8 rounded-3xl border border-white/10 text-center">
    <p className="text-white/70 mb-4 text-lg">AI Summary & Voice Announcements</p>
    <p className="text-white/50 text-sm mb-6">Available only in Premium plan</p>
    <button 
      onClick={() => setUpgradeModal({ isOpen: true, feature: 'AI & Voice Features', requiredTier: 'Premium' })}
      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold"
    >
      Upgrade to Premium
    </button>
  </div>
)}
      {activeTab === 'customize' && (
           <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid lg:grid-cols-2 gap-10 bg-gray-50 p-8 rounded-3xl shadow-xl"
      >
            {/* LEFT COLUMN: Forms */}
            <div className="space-y-8 bg-white p-10 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold text-gray-800">Customize Your School</h2>
                <button onClick={() => setShowInviteModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl font-bold">
                  Invite User
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <motion.div whileHover={{ scale: 1.02 }}>
                  <label className="block text-lg font-semibold mb-3">Motto</label>
                  <input name="motto" value={formData.motto} onChange={handleChange} placeholder="Excellence in Education" className="w-full p-5 border-2 rounded-xl text-lg" />
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }}>
              <label className="block text-lg font-semibold mb-3">School Logo</label>
              <input 
                type="file" 
                name="logoFile" 
                accept="image/*" 
                onChange={handleChange} 
                className="w-full p-5 border-2 rounded-xl" 
            />
                {formData.logoFile && (
                <div className="mt-4">
                <img 
                 src={URL.createObjectURL(formData.logoFile)} 
                alt="Logo Preview" 
        className="w-40 h-40 object-contain rounded-lg border-2 border-gray-300"
      />
    </div>
  )}
</motion.div>
{(school.subscriptionTier === 'pro' || school.subscriptionTier === 'premium') && (
<GlassInput
    placeholder="Favicon URL (e.g. https://yourschool.com/favicon.ico)"
    value={formData.faviconUrl || ''}
    onChange={handleChange}
    name="faviconUrl"
    />
    )}
      <div className="grid grid-cols-2 gap-6">
      <motion.div whileHover={{ scale: 1.05 }}>
      <label className="block text-lg font-semibold mb-3">Primary Color</label>
      <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} className="w-full h-20 rounded-xl cursor-pointer" />
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }}>
      <label className="block text-lg font-semibold mb-3">Secondary Color</label>
      <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="w-full h-20 rounded-xl cursor-pointer" />
      </motion.div>

      </div>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <label className="block text-lg font-semibold mb-3">Font Family</label>
                  <select name="fontFamily" value={formData.fontFamily} onChange={handleChange} className="w-full p-5 border-2 rounded-xl text-lg">
                    <option>Inter</option>
                    {school.subscriptionTier !== 'basic' && (
                      <>
                        <option>Roboto</option>
                        <option>Lora</option>
                        <option>Montserrat</option>
                      </>
                    )}
                  </select>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }}>
                  <label className="block text-lg font-semibold mb-3">Layout</label>
                  <select name="layout" value={formData.layout} onChange={handleChange} className="w-full p-5 border-2 rounded-xl text-lg">
                    <option>Classic</option>
                    {school.subscriptionTier !== 'basic' && <option>Modern</option>}
                    {school.subscriptionTier === 'premium' && <option>Minimal</option>}
                  </select>
                </motion.div>

                {/* Custom Programs */}
                <motion.div className="bg-white/50 p-4 rounded-lg shadow-sm" whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-family)' }}>Custom Programs</h3>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="programs">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {formData.customPrograms.map((program, index) => (
                            <Draggable key={index} draggableId={`program-${index}`} index={index}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="border p-4 rounded-lg mb-4 bg-white/30 backdrop-blur-sm">
                                  <div className="mb-2">
                                    <label className="block text-sm font-medium mb-1">Program Name</label>
                                    <input type="text" name={`customPrograms.${index}.name`} value={program.name} onChange={(e) => handleChange(e, index)} className="w-full border rounded-lg px-3 py-2 bg-white/30 backdrop-blur-sm" placeholder="e.g., Undergraduate Studies" />
                                  </div>
                                  <div className="mb-2">
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea name={`customPrograms.${index}.description`} value={program.description} onChange={(e) => handleChange(e, index)} className="w-full border rounded-lg px-3 py-2 bg-white/30 backdrop-blur-sm" rows={3} placeholder="Program description" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Program Image</label>
                                    <input type="file" name={`customPrograms.${index}.imageFile`} accept="image/*" onChange={(e) => handleChange(e, index)} className="w-full" />
                                    {program.imageUrl && <img src={program.imageUrl} alt={`Program ${index + 1}`} className="mt-2 w-32 h-20 object-cover rounded" />}
                                  </div>
                                  {formData.customPrograms.length > 1 && (
                                    <button type="button" onClick={() => removeProgram(index)} className="mt-2 text-red-600 hover:underline">Remove Program</button>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  <button type="button" onClick={addProgram} className="text-blue-600 hover:underline">Add Program</button>
                </motion.div>

                {/* Social Media (Pro+) */}
                {(school?.subscriptionTier === 'pro' || school?.subscriptionTier === 'premium') && (
                  <motion.div className="bg-white/50 p-4 rounded-lg shadow-sm" whileHover={{ scale: 1.02 }}>
                    <h3 className="text-lg font-medium mb-2">Social Media Icons & Links</h3>
                    {formData.socialMediaIcons.map((icon, index) => (
                      <div key={index} className="mb-4">
                        <label className="block text-sm font-medium mb-1">Icon {index + 1}</label>
                        <input type="file" accept="image/*" onChange={(e) => handleSocialMediaIconChange(index, e.target.files[0])} className="w-full mb-2" />
                        <input type="url" name={`socialMediaLinks.${index}`} value={formData.socialMediaLinks[index] || ''} onChange={(e) => handleChange(e, index)} className="w-full border rounded-lg px-3 py-2 bg-white/30 backdrop-blur-sm" placeholder="e.g., https://twitter.com/school" />
                        {school?.socialMediaIcons?.[index] && <img src={school.socialMediaIcons[index]} alt={`Icon ${index + 1}`} className="mt-2 w-10 h-10 object-contain" />}
                      </div>
                    ))}
                    <button type="button" onClick={addSocialMediaIcon} className="text-blue-600 hover:underline">Add Icon</button>
                  </motion.div>
                )}
              {/* Footer Customization */}
              <motion.div whileHover={{ scale: 1.02 }}>
              <h3 className="text-2xl font-bold mb-6">Footer Content</h3>
              <div className="grid md:grid-cols-2 gap-6">
              <GlassInput placeholder="About text in footer" value={formData.footerAbout || ''} onChange={handleChange} name="footerAbout" />
              <GlassInput placeholder="Email" value={formData.footerEmail || ''} onChange={handleChange} name="footerEmail" />
              <GlassInput placeholder="Phone" value={formData.footerPhone || ''} onChange={handleChange} name="footerPhone" />
              <GlassInput placeholder="Address" value={formData.footerAddress || ''} onChange={handleChange} name="footerAddress" />
              <GlassInput placeholder="Facebook URL" value={formData.footerFacebook || ''} onChange={handleChange} name="footerFacebook" />
              <GlassInput placeholder="Twitter URL" value={formData.footerTwitter || ''} onChange={handleChange} name="footerTwitter" />
              <GlassInput placeholder="Instagram URL" value={formData.footerInstagram || ''} onChange={handleChange} name="footerInstagram" />
              <GlassInput placeholder="LinkedIn URL" value={formData.footerLinkedIn || ''} onChange={handleChange} name="footerLinkedIn" />
               </div>
              </motion.div>
                {/* Hero Image & Video */}
                <motion.div whileHover={{ scale: 1.02 }}>
                  <label className="block text-lg font-semibold mb-3">Hero Image</label>
                  <input type="file" name="heroImageFile" accept="image/*" onChange={handleChange} className="w-full p-5 border-2 rounded-xl" />
                </motion.div>

                {school?.subscriptionTier === 'premium' && (
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <label className="block text-lg font-semibold mb-3">Hero Video (Premium)</label>
                    <input type="file" name="heroVideoFile" accept="video/*" onChange={handleChange} className="w-full p-5 border-2 rounded-xl" />
                  </motion.div>
                )}

                <button type="submit" disabled={loading} className="w-full mt-8 bg-teal-600 text-white py-5 rounded-xl text-xl font-bold hover:bg-teal-700 disabled:opacity-50 transition shadow-lg">
                  {loading ? 'Saving Customizations...' : 'Save All Changes'}
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: Live Preview */}
            <div className="space-y-8">
              <h2 className="text-4xl font-bold mb-10 text-center text-gray-800">Live Preview</h2>
              <div className="border-8 border-gray-200 rounded-3xl overflow-hidden shadow-2xl bg-white">
                <HomePage 
                  schoolId={schoolId} 
                  customization={{ 
                    ...previewData, 
                    name: school.name || 'Your School',
                    fontFamily: school.fontFamily || 'Inter'
                  }} 
                />
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'users' && (
  <GlassCard title="👥 Manage Users">
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <GlassInput 
        placeholder="Full Name" 
        value={form.name} 
        onChange={(e) => setForm({ ...form, name: sanitizeInput(e.target.value) })} 
      />

      <GlassInput 
        placeholder="Email" 
        value={form.email} 
        onChange={(e) => setForm({ ...form, email: sanitizeInput(e.target.value) })} 
      />

      <GlassInput 
        type="password" 
        placeholder="Password" 
        value={form.password} 
        onChange={(e) => setForm({ ...form, password: e.target.value })} 
      />

      <GlassSelect 
        value={form.role} 
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option value="">Select Role</option>
        <option value="STUDENT">STUDENT</option>
        <option value="LECTURER">LECTURER</option>
      </GlassSelect>
    </div>

    <GlassButton onClick={() => handleCreate('user')}>
      Create User
    </GlassButton>

    <div className="grid md:grid-cols-3 gap-4 mt-6">
      {users.slice(0, 9).map((u) => (
        <motion.div 
          key={u.id} 
          className="p-3 bg-white/50 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <p className="font-semibold">{u.name}</p>
          <p className="text-sm text-gray-600">{u.role}</p>
        </motion.div>
      ))}
    </div>
  </GlassCard>
)}

        {activeTab === 'courses' && (
  <div className="space-y-10">
    {/* ===== COURSE CREATION FORM (UPGRADED) ===== */}
    <GlassCard title="Create New Course">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GlassInput
          placeholder="Code (e.g. MTH101)"
          value={form.code || ''}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        />
        <GlassInput
          placeholder="Course Title"
          value={form.title || ''}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <GlassInput
          type="number"
          placeholder="Credit Units"
          value={form.creditUnit || ''}
          onChange={(e) => setForm({ ...form, creditUnit: parseInt(e.target.value) || 0 })}
        />
        <GlassInput
          placeholder="Teacher Name"
          value={form.teacher || ''}
          onChange={(e) => setForm({ ...form, teacher: e.target.value })}
        />
        <GlassInput
          placeholder="Room (e.g. Hall A3)"
          value={form.room || ''}
          onChange={(e) => setForm({ ...form, room: e.target.value })}
        />
        <GlassSelect
          value={form.schedule?.day || ''}
          onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, day: e.target.value } })}
        >
          <option value="">Select Day</option>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </GlassSelect>
        <GlassSelect
          value={form.schedule?.time || ''}
          onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, time: e.target.value } })}
        >
          <option value="">Select Time</option>
          {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </GlassSelect>
      </div>

      <div className="mt-8 flex gap-4">
        <GlassButton onClick={() => handleCreate('course')}>
          Create Course
        </GlassButton>
        <GlassButton variant="secondary" onClick={() => setForm({})}>
          Clear Form
        </GlassButton>
      </div>
    </GlassCard>

    {/* ===== COURSE LIST (IMPROVED) ===== */}
    <GlassCard title="All Courses">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <p className="col-span-full text-center text-white/60 py-12">No courses yet. Create one above!</p>
        ) : (
          courses.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ scale: 1.03 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-purple-300">{c.code}</h3>
                <span className="text-xs bg-purple-600/30 px-3 py-1 rounded-full">
                  {c.creditUnit} units
                </span>
              </div>
              <p className="text-lg font-medium mb-3">{c.title}</p>
              {c.teacher && <p className="text-sm text-white/80">Teacher: {c.teacher}</p>}
              {c.room && <p className="text-sm text-white/70">Room: {c.room}</p>}
              {c.schedule?.day && c.schedule?.time && (
                <p className="text-xs text-green-400 mt-2">
                  {c.schedule.day} • {c.schedule.time}
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </GlassCard>

    {/* ===== DYNAMIC WEEKLY TIMETABLE (REAL DATA) ===== */}
    <GlassCard title="Weekly Timetable">
      <div className="bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 overflow-x-auto">
        <div className="grid grid-cols-8 gap-4 min-w-[900px]">
          {/* Empty corner + Day headers */}
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
                const course = courses.find(c => 
                  c.schedule?.day === day && c.schedule?.time === time
                );

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
    </GlassCard>
  </div>
)}

        {activeTab === 'cbt' && (
  <GlassCard title="🧠 CBT Manager">
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="font-bold text-xl mb-4">Create New CBT</h3>
        <GlassInput placeholder="Title" value={cbtForm.title} onChange={e => setCbtForm({...cbtForm, title: e.target.value})} />
        <GlassInput type="number" placeholder="Duration (minutes)" value={cbtForm.duration} onChange={e => setCbtForm({...cbtForm, duration: +e.target.value})} />
        <GlassButton onClick={() => handleCreate('cbt/create')}>Create CBT</GlassButton>
      </div>

      {(school.subscriptionTier === 'pro' || school.subscriptionTier === 'premium') && (
        <div>
          <h3 className="font-bold text-xl mb-4">Bulk Import Questions (Pro+)</h3>
          <form action={`/api/cbt-import/import/${selectedCbtId}`} method="POST" encType="multipart/form-data">
            <select onChange={e => setSelectedCbtId(e.target.value)} className="w-full p-3 border rounded mb-3">
              <option>Select CBT</option>
              {cbts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input type="file" accept=".csv,.xlsx,.pdf,.docx" className="w-full p-3 border rounded mb-3" />
            <GlassButton type="submit">Import Questions</GlassButton>
          </form>
        </div>
      )}
    </div>
  </GlassCard>
)}

{activeTab === 'accounts' && (
  <div className="bg-white rounded-3xl shadow-2xl p-10">
    <h2 className="text-3xl font-bold mb-8">Payment Receiving Accounts</h2>
    
    <div className="grid gap-6 mb-10">
      {accounts.length === 0 ? (
        <p className="text-gray-500">No accounts added yet.</p>
      ) : (
        accounts.map((acc) => (
          <div key={acc.id} className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-200">
            <h4 className="font-bold text-lg capitalize">{acc.accountType} Account</h4>
            <p className="text-gray-700">{acc.bankName} • {acc.accountNumber}</p>
            <p className="text-sm text-gray-600">{acc.accountName}</p>
            <p className="text-xs text-green-600 mt-2">✓ Active on Paystack</p>
          </div>
        ))
      )}
    </div>

    <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-lg font-medium mb-2">Account Type</label>
        <select
          value={newAccount.type}
          onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
          className="w-full p-4 border-2 rounded-xl"
          required
        >
          <option value="">Select Type</option>
          <option value="fees">School Fees</option>
          <option value="hostel">Hostel</option>
          <option value="indexing">Indexing</option>
          <option value="application">Application Fee</option>
          <option value="cbt">CBT Exam</option>
          <option value="transcript">Transcript</option>
        </select>
      </div>

      <div>
        <label className="block text-lg font-medium mb-2">Bank Code (e.g. 057 for Zenith)</label>
        <input
          type="text"
          placeholder="057"
          value={newAccount.bankCode}
          onChange={(e) => setNewAccount({ ...newAccount, bankCode: e.target.value })}
          className="w-full p-4 border-2 rounded-xl"
          required
        />
      </div>

      <div>
        <label className="block text-lg font-medium mb-2">Account Number</label>
        <input
          type="text"
          placeholder="0123456789"
          value={newAccount.accountNumber}
          onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
          className="w-full p-4 border-2 rounded-xl"
          required
        />
      </div>

      <div>
        <label className="block text-lg font-medium mb-2">Account Name</label>
        <input
          type="text"
          placeholder="College of Health Science"
          value={newAccount.accountName}
          onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
          className="w-full p-4 border-2 rounded-xl"
          required
        />
      </div>

      <div className="md:col-span-2">
        <GlassButton type="submit" className="w-full py-4 text-xl">
          Add Receiving Account
        </GlassButton>
      </div>
    </form>
  </div>
)}
{activeTab === 'theme' && (
  <div className="grid lg:grid-cols-2 gap-8">
    {/* Left: Builder */}
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold mb-6">Drag & Drop Theme Builder</h2>
      <p className="text-gray-600 mb-6">Drag blocks to build your homepage</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-center cursor-move">
          Hero Section
        </div>
        <div className="p-6 bg-purple-50 border-2 border-dashed border-purple-300 rounded-xl text-center cursor-move">
          Programs Grid
        </div>
        <div className="p-6 bg-green-50 border-2 border-dashed border-green-300 rounded-xl text-center cursor-move">
          Testimonials
        </div>
        <div className="p-6 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl text-center cursor-move">
          News & Events
        </div>
      </div>

      <GlassInput
  placeholder="Google Font URL"
  value={customFontUrl}
  onChange={(e) => setCustomFontUrl(e.target.value)}
  className="mb-4"
/>
      <GlassInput
  placeholder="Favicon URL"
  value={faviconUrl}
  onChange={(e) => setFaviconUrl(e.target.value)}
  className="mb-4"
/>
     <div>
  <label className="block text-lg font-medium mb-2">Custom Domain (Pro & Premium)</label>
  <input
    type="text"
    placeholder={school.subscriptionTier === 'basic' ? 'Upgrade to Pro for custom domain' : 'e.g.myschool.edu.ng'}
    value={customDomain}
    onChange={(e) => {
      if (school.subscriptionTier === 'basic') {
        setUpgradeModal({ isOpen: true, feature: 'custom domain', requiredTier: 'Pro or Premium' });
        return;
      }
      setCustomDomain(e.target.value);
    }}
    disabled={school.subscriptionTier === 'basic'}
    className={`w-full p-4 border-2 rounded-xl ${school.subscriptionTier === 'basic' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
  />
  {school.subscriptionTier === 'basic' && (
    <p className="text-sm text-gray-500 mt-2">
      Upgrade to Pro or Premium to use your own domain (myschool.edu.ng)
    </p>
  )}
</div>

      <GlassButton onClick={handleSaveTheme} className="w-full py-4 text-xl">
  Save Theme
</GlassButton>
    </div>

    {/* Right: Live Preview */}
    <div className="bg-gray-100 rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-gray-800 text-white p-4 text-center">Live Preview - {school.customDomain || school.subdomain + '.yourdomain.com'}</div>
      <iframe src={`/preview/${schoolId}`} className="w-full h-screen" />
    </div>
  </div>
)}
        {activeTab === 'analytics' && (
  <div className="grid md:grid-cols-2 gap-6">

    <GlassCard title="📊 System Overview">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
          <div className="text-2xl font-bold">{analytics.studentCount || 0}</div>
          <div className="text-sm">Students</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg">
          <div className="text-2xl font-bold">{analytics.lecturerCount || 0}</div>
          <div className="text-sm">Lecturers</div>
        </div>
      </div>
    </GlassCard>

    <GlassCard title="💰 Revenue Breakdown">
      {revenueChartData ? (
        <div className="h-64">
          <ChartJsBar data={revenueChartData} />
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </GlassCard>

  </div>
)}
      </AnimatePresence>
        </main>
      </div>

      {/* Messages Sidebar */}
      <AnimatePresence>
        {/* === REAL-TIME CHAT — PREMIUM ONLY === */}
{activeTab === 'messages' && (
  <>
    {school.subscriptionTier === 'premium' ? (
      // PREMIUM: Full Real-Time Chat
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-20 bottom-0 w-96 bg-black/40 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <MessageCircle className="text-purple-400" />
              School Chat
            </h2>
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-white/60 text-sm mt-1">Real-time messaging</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-white/50 py-12">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ x: msg.name === user?.firstName ? 50 : -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`flex gap-3 ${msg.name === user?.firstName ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {msg.avatar}
                </div>
                <div className={`max-w-xs ${msg.name === user?.firstName ? 'text-right' : ''}`}>
                  <p className="text-xs text-white/60 mb-1">{msg.name}</p>
                  <div className="bg-white/10 rounded-2xl px-4 py-3 inline-block">
                    <p className="text-white/90">{msg.message}</p>
                  </div>
                  <p className="text-white/40 text-xs mt-1">{msg.time}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-white/10">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-white/10 rounded-xl px-5 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setMessages(prev => [...prev, {
                    id: Date.now(),
                    name: user?.firstName || 'You',
                    message: e.target.value,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    avatar: (user?.firstName?.[0] || 'Y').toUpperCase()
                  }]);
                  e.target.value = '';
                }
              }}
            />
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 p-3 rounded-xl transition transform hover:scale-110">
              <Send size={22} />
            </button>
          </div>
        </div>
      </motion.div>
    ) : (
      // NON-PREMIUM: Upgrade Prompt
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        className="fixed right-0 top-20 bottom-0 w-96 bg-black/40 backdrop-blur-2xl border-l border-white/10 z-50 flex items-center justify-center p-8"
      >
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <MessageCircle size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Real-Time School Chat</h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Instant messaging between admins, teachers, and parents — only available in Premium.
          </p>
          <button
            onClick={() => setUpgradeModal({ isOpen: true, feature: 'Real-Time Chat', requiredTier: 'Premium' })}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold text-lg transform hover:scale-105 transition"
          >
            Upgrade to Premium
          </button>
        </div>
      </motion.div>
    )}
  </>
)}
</AnimatePresence>
   {sidebarOpen && (
        <div
          className={`fixed inset-0 bg-black/70 z-40 lg:hidden transition-opacity ${
            activeTab === 'messages' ? 'z-[60]' : ''
          }`}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SchoolAdminDashboard;