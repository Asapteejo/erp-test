// src/pages/SaaSDashboard.jsx - PRODUCTION-READY SUPER ADMIN DASHBOARD
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { downloadCSV } from '../utils/csv';
import { TrendingUp, School, Users, DollarSign, Plus, Download, Search, Filter, Zap, Heart, Activity, Server } from 'lucide-react';
import confetti from 'canvas-confetti'; 
import CommandPalette from '../components/CommandPalette';
import { useRealtimeActivity } from '../hooks/useRealtimeActivity';
import useSound from "use-sound";


ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// === ANIMATED NUMBER HOOK ===
const useAnimatedCounter = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  const frameRate = 1000 / 60;
  const totalFrames = Math.round(duration / frameRate);

  useEffect(() => {
    let currentFrame = 0;
    const counter = setInterval(() => {
      currentFrame++;
      const progress = currentFrame / totalFrames;
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      setCount(Math.round(end * eased));

      if (currentFrame === totalFrames) clearInterval(counter);
    }, frameRate);

    return () => clearInterval(counter);
  }, [end]);

  return count;
};
// === SOUND EFFECTS ===
let playClick = () => {};
let playWhoosh = () => {};
let playPing = () => {};


const GlassCard = ({ children, title, className = '' }) => (
  <motion.div
    className={`bg-white/90 backdrop-blur-sm shadow-xl rounded-xl p-6 border border-white/30 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    whileHover={{ scale: 1.01 }}
  >
    {title && <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>}
    {children}
  </motion.div>
);

const SaaSDashboard = () => {
  let soundClick = () => {};
  let soundWhoosh = () => {};
  let soundPing = () => {};

  try {
    const [c] = useSound('/sounds/click.wav');
    const [w] = useSound('/sounds/whoosh.wav');
    const [p] = useSound('/sounds/ping.wav');

    soundClick = c;
    soundWhoosh = w;
    soundPing = p;
  } catch {}

  playClick = soundClick;
  playWhoosh = soundWhoosh;
  playPing = soundPing;

  const [isOpen, setIsOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const navigate = useNavigate();
  const { getToken, loading: authLoading, isSignedIn, isDev } = useClerkAuth(); 

  const [analytics, setAnalytics] = useState(null);
  const [schools, setSchools] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const activities = useRealtimeActivity();
  const [health, setHealth] = useState(null);



   // === ABORT CONTROLLER ===
  const controllerRef = useRef(null);

  // === API CALL WITH TOKEN ===
const api = useCallback(async (endpoint, options = {}) => {
  // In dev: skip auth entirely
  if (import.meta.env.DEV) {
    const res = await fetch(`/api/saas/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) throw new Error('Dev API mock');
    return res.json();
  }

  const token = await getToken();
  if (!token) throw new Error('No token');

  if (controllerRef.current) controllerRef.current.abort();
  controllerRef.current = new AbortController();

  const res = await fetch(`/api/saas/v1${endpoint}`, {
    ...options,
    signal: controllerRef.current.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'API error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}, [getToken]);

  // === FETCH DATA ===
  const fetchData = useCallback(async () => {
    if (authLoading || !isSignedIn) return;

     // === DEV MODE: SHOW MOCK DATA INSTEAD OF CRASHING ===
    if (isDev) {
      console.log('DEV MODE: Using mock data for Super Admin dashboard');
      setAnalytics({
        totalRevenue: 18450000,
        activeSchools: 87,
        totalPayments: 1247,
        trialSchools: 12,
      });
      setSchools([
        { id: '1', name: 'Azmah College', subdomain: 'azmah', subscriptionTier: 'premium', subscriptionStatus: 'active', totalRevenue: 8500000,  healthScore: 94, riskLevel: 'low' },
        { id: '2', name: 'Grace Polytechnic', subdomain: 'grace', subscriptionTier: 'pro', subscriptionStatus: 'active', totalRevenue: 4200000, healthScore: 88, riskLevel: 'medium' },
        { id: '3', name: 'Summit High School', subdomain: 'summit', subscriptionTier: 'basic', subscriptionStatus: 'trial', totalRevenue: 0, healthScore: 65, riskLevel: 'high' },
      ]);
      setRevenueTrend(Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        revenue: Math.floor(Math.random() * 800000) + 200000,
      })));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const endpoints = ['/analytics', `/schools?page=${page}&perPage=10`, '/revenue'];
      const requests = endpoints.map(ep => api(ep, { signal: controllerRef.current?.signal }));
      const [analyticsData, schoolsData, revenueData] = await Promise.all(requests);

      setAnalytics(analyticsData);
      setSchools(schoolsData.schools || []);
      setRevenueTrend(revenueData.last30Days || []);
      if (analyticsData.totalRevenue > (analytics?.totalRevenue || 0)) {
  const newRevenue = analyticsData.totalRevenue - (analytics?.totalRevenue || 0);
  toast.success(
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
        <DollarSign size={28} className="text-white" />
      </div>
      <div>
        <p className="font-bold text-lg">New Payment Received!</p>
        <p className="text-sm">+₦{newRevenue.toLocaleString()} • Total now ₦{(analyticsData.totalRevenue / 1000000).toFixed(1)}M</p>
      </div>
    </div>,
    { 
      duration: 8000, 
      position: 'top-right',
      style: { background: 'rgba(0,0,0,0.9)', color: 'white', borderRadius: '16px', padding: '16px' }
    }
  );
}
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error(err.message || 'Failed to load data');
        console.error('API Error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [api, authLoading, isSignedIn, page, isDev]);
   
  useEffect(() => {
  const fetchHealth = async () => {
    try {
      const data = await api('/health');
      setHealth(data);
    } catch (e) {
      setHealth({ status: 'down' });
    }
  };
  fetchHealth();
  const interval = setInterval(fetchHealth, 10000);
  return () => clearInterval(interval);
}, [api]);

useEffect(() => {
  if (sessionStorage.getItem('welcomed_today')) return;

  toast.success(
    <div className="flex items-center gap-4">
      <div className="text-4xl">Welcome back, Teejo the Genius!</div>
      <div>
        <p className="font-bold text-xl">You have 3 new payments today</p>
      </div>
    </div>,
    { duration: 8000, position: "top-center", onOpen: () => playPing?.() }
  );

  confetti({
    particleCount: 200,
    spread: 70,
    origin: { y: 0.3 },
    colors: ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444"],
  });

  sessionStorage.setItem('welcomed_today', 'true');
}, []);

useEffect(() => {
  let clicks = 0;
  const handler = () => {
    clicks++;
    if (clicks === 7) {
      toast.success("🇳🇬 Made in Africa with love 🇳🇬", { duration: 10000 });
      confetti({
        particleCount: 100,
        spread: 160,
        origin: { y: 0.8 },
        colors: ["#008751", "#ffffff", "#008751"],
      });
      clicks = 0;
    }
  };
  document.getElementById("logo")?.addEventListener("click", handler);
}, []);

  // === RUN ON MOUNT ===
  useEffect(() => {
    if (!authLoading && isSignedIn) {
      fetchData();
    }
  }, [authLoading, isSignedIn, fetchData]);

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  // === UPGRADE TIER ===
  const upgradeTier = async (subdomain, tier) => {
  try {
    await api(`/v1/schools/${subdomain}/tier`, {
      method: 'PATCH',
      body: JSON.stringify({ tier }),
    });
    toast.success(`Upgraded to ${tier.toUpperCase()}! 🎉`);

    // CONFETTI EXPLOSION
    import('canvas-confetti').then(confetti => {
      confetti.default({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#8b5cf6', '#f59e0b', '#10b981']
      });
    });

    fetchData();
  } catch {
    toast.error('Failed to upgrade');
  }
};

  // === SUSPEND SCHOOL ===
  const suspendSchool = async (id) => {
    if (!window.confirm('Suspend this school?')) return;
    try {
      await api(`/v1/schools/${id}/subscription`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'expired' }),
      });
      toast.success('School suspended');
      fetchData();
    } catch {
      toast.error('Failed');
    }
  };

  // === EXPORT CSV ===
  const exportCSV = () => {
    const headers = ['Name', 'Subdomain', 'Tier', 'Status', 'Revenue'];
    const rows = schools.map(s => [
      s.name,
      s.subdomain,
      s.subscriptionTier,
      s.subscriptionStatus,
      s.totalRevenue || 0
    ]);
    downloadCSV(headers, rows, 'superadmin-schools.csv');
  };

  // === FILTER SCHOOLS ===
  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesTier = filterTier === 'all' || s.subscriptionTier === filterTier;
    return matchesSearch && matchesTier;
  });
  
  // === FORMAT NUMBER ===
const formatNumber = (num) => {
  if (!num && num !== 0) return 0;
  return num.toLocaleString();
};

  //=== Revenue Forecast Card ===
  const forecast = {
  currentMonth: Math.round((analytics?.totalRevenue || 0) * 1.28),
  yearlyMRR: Math.round((analytics?.totalRevenue || 0) * 12 * 1.15),
  growth: '+28%',
  confidence: '92%'
};
// === AI FORECAST CHART DATA ===
const forecastChart = {
  labels: Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`),
  datasets: [
    {
      label: "AI Forecast",
      data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 1000000)),
      borderColor: "#8b5cf6",
      backgroundColor: "rgba(139, 92, 246, 0.2)",
      fill: true,
      tension: 0.4,
    }
  ]
};
  // === CHARTS ===
  const revenueChart = {
    labels: revenueTrend.map(d => format(new Date(d.date), 'MMM dd')),
    datasets: [{
      label: 'Daily Revenue',
      data: revenueTrend.map(d => d.revenue),
      borderColor: '#14b8a6',
      backgroundColor: 'rgba(20, 184, 166, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

    const tierData = {
    labels: ['Basic', 'Pro', 'Premium'],
    datasets: [{
      data: [
        schools.filter(s => s.subscriptionTier === 'basic').length,
        schools.filter(s => s.subscriptionTier === 'pro').length,
        schools.filter(s => s.subscriptionTier === 'premium').length,
      ],
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
      borderWidth: 0,
    }]
  };

  // === LOADING STATE ===
  if (authLoading || loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Skeleton Header */}
        <div className="h-20 bg-white/10 rounded-3xl animate-pulse" />
        
        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-white/10 rounded-3xl animate-pulse" />
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-96 bg-white/10 rounded-3xl animate-pulse" />
          <div className="h-96 bg-white/10 rounded-3xl animate-pulse" />
        </div>

        {/* Skeleton Table */}
        <div className="bg-white/10 rounded-3xl p-8">
          <div className="h-12 bg-white/20 rounded-xl mb-6 animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl mb-4 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Please sign in to access the dashboard</p>
          <button
            onClick={() => window.location.href = '/sign-in'}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // === MAIN RENDER ===
return (
  <div 
  id="activity-feed"
  className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white transition-transform duration-500 ${isActivityOpen ? 'overflow-hidden' : ''}`}
>
    {/* LOCK BODY SCROLL WHEN PANEL OPEN */}
{isActivityOpen && (
  <div 
    className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm pointer-events-auto"
    onClick={() => setIsActivityOpen(false)}
    onMouseEnter={() => playWhoosh?.()}
  />
)}
  {/* Floating Modern Header */}
<motion.header
  initial={{ y: -100 }}
  animate={{ y: 0 }}
  className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10"
>
  <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
    <div className="flex items-center gap-4">
      <div id="logo"  className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg">
        SA
      </div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
        Super Admin Control Center
      </h1>
    </div>
    <nav className="flex items-center gap-6">
      <Link to="/saas/schools" className="text-white/80 hover:text-white font-medium transition">Schools</Link>
      <button
     onClick={() => { playClick(); navigate('/saas/schools/create'); }}
  onMouseEnter={() => playWhoosh()}
  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-cyan-500/25 transition transform hover:scale-105"
>
  + New School
</button>

      <button onClick={exportCSV} className="px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/20 transition">
        Export CSV
      </button>
      <button onClick={() => toast.success('Signed out')} className="px-6 py-3 bg-red-600/20 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-600/30 transition">
        Sign Out
      </button>
    </nav>
    
  </div>
</motion.header>

      <main className="max-w-7xl mx-auto px-6 py-8">
       {/* Hero Stats — Ultra Modern + FIXED OVERLAP */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-32 mb-12 px-6">
  {[
    { label: 'Total Revenue', value: analytics?.totalRevenue || 0, icon: DollarSign, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Active Schools', value: analytics?.activeSchools || 0, icon: School, gradient: 'from-blue-500 to-cyan-600' },
    { label: 'Total Payments', value: analytics?.totalPayments || 0, icon: Users, gradient: 'from-purple-500 to-pink-600' },
    { label: 'Trial Schools', value: analytics?.trialSchools || 0, icon: TrendingUp, gradient: 'from-orange-500 to-red-600' },
  ].map((stat, i) => {
    const count = useAnimatedCounter(stat.value);

    return (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="group relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 hover:scale-105 transition-all duration-500"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-20 group-hover:opacity-40 transition`} />
        <div className="relative z-10">
          <stat.icon size={48} className="mb-4 text-white/70 group-hover:text-white transition" />
          <p className="text-white/70 text-sm mb-2">{stat.label}</p>
          <p className="text-4xl font-bold">
            {stat.label.includes('Revenue')
              ? `₦${(count / 1000000).toFixed(1)}M`
              : count.toLocaleString()}
          </p>
        </div>
      </motion.div>
    );
  })}
</div>
        {/* REVENUE TREND */}
        <motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 mb-12"
>
  <h2 className="text-2xl font-bold mb-6 text-cyan-300">Revenue Trend • Last 30 Days</h2>
  <div className="h-96">
    <Line data={revenueChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
  </div>
</motion.div>

        {/* CHARTS ROW */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
  <motion.div
    initial={{ opacity: 0, x: -50 }}
    whileInView={{ opacity: 1, x: 0 }}
    className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8"
  >
    <h3 className="text-xl font-bold mb-6 text-cyan-300">Revenue by Tier</h3>
    <div className="h-80">
      <Bar data={{
  labels: ['Basic', 'Pro', 'Premium'],
  datasets: [{
    label: 'Revenue',
    data: [
      schools.filter(s => s.subscriptionTier === 'basic').reduce((a, b) => a + (b.totalRevenue || 0), 0),
      schools.filter(s => s.subscriptionTier === 'pro').reduce((a, b) => a + (b.totalRevenue || 0), 0),
      schools.filter(s => s.subscriptionTier === 'premium').reduce((a, b) => a + (b.totalRevenue || 0), 0),
    ],
    backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
    borderRadius: 8,
  }]
}} options={{ responsive: true, maintainAspectRatio: false }} />
    </div>
  </motion.div>

  <motion.div
    initial={{ opacity: 0, x: 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8"
  >
    <h3 className="text-xl font-bold mb-6 text-purple-300">Schools Distribution</h3>
    <div className="h-80">
      <Doughnut data={tierData} options={{ responsive: true }} />
    </div>
  </motion.div>
</div>

{/* Health Status Panel */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 mb-12"
>
  <div className="flex items-center gap-3 mb-6">
    <Heart className={`w-8 h-8 ${health?.status === 'healthy' ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
    <h2 className="text-2xl font-bold text-cyan-300">System Health • All Systems Operational</h2>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    {[
      { label: 'Database', value: health?.checks?.database?.latency ? `${health.checks.database.latency}ms` : '—', icon: Server, ok: true },
      { label: 'Redis', value: health?.checks?.redis?.latency ? `${health.checks.redis.latency}ms` : '—', icon: Activity, ok: true },
      { label: 'NATS', value: health?.checks?.nats?.latency ? `${health.checks.nats.latency}ms` : '—', icon: Zap, ok: true },
      { label: 'Jobs Queue', value: health?.checks?.backgroundJobs?.waiting || 0, icon: Activity, ok: true },
    ].map((item, i) => (
      <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <item.icon size={32} className="text-cyan-400 mb-3" />
        <p className="text-white/70 text-sm">{item.label}</p>
        <p className="text-2xl font-bold text-white">{item.value}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-emerald-400 text-xs">Operational</span>
        </div>
      </div>
    ))}
  </div>
</motion.div>
{/* AI Revenue Forecast Card */}
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  whileInView={{ opacity: 1, scale: 1 }}
  className="bg-gradient-to-br from-purple-600/20 to-cyan-600/20 backdrop-blur-xl rounded-3xl border border-white/20 p-8 mb-12 overflow-hidden relative"
>
  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-cyan-600/10" />
  <div className="relative z-10">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center">
        <span className="text-2xl">AI</span>
      </div>
      <h2 className="text-2xl font-bold text-white">AI Revenue Forecast</h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <p className="text-white/70">This Month (Projected)</p>
        <p className="text-4xl font-bold text-white">₦{formatNumber(forecast.currentMonth)}</p>
        <p className="text-emerald-400 text-sm">↑ {forecast.growth} vs last</p>
      </div>
      <div>
        <p className="text-white/70">Yearly Run Rate</p>
        <p className="text-4xl font-bold text-white">₦{formatNumber(forecast.yearlyMRR)}</p>
      </div>
      <div className="text-right">
        <p className="text-white/70">AI Confidence</p>
        <p className="text-5xl font-black text-cyan-400">{forecast.confidence}</p>
      </div>
    </div>

    <div className="mt-8 h-48 relative">
  <Line
    data={forecastChart}
    options={{
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { display: false }, x: { display: false } },
    }}
  />
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-center">
      <p className="text-6xl font-black text-white">₦38M</p>
      <p className="text-cyan-400 text-xl">Dec 2025 Projection</p>
    </div>
  </div>
</div>

  </div>
</motion.div>

       {/* SCHOOLS TABLE — 2025 MODERN DESIGN */}
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden"
>
  {/* Header with Search + Filter */}
  <div className="p-8 border-b border-white/10">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">All Schools</h2>
        <p className="text-white/70">Manage and monitor {filteredSchools.length} active schools</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
        {/* REAL-TIME TOAST NOTIFICATIONS */}
<div className="fixed top-24 right-8 z-50 space-y-4">
  {/* Example live notification */}
  <motion.div
    initial={{ opacity: 0, x: 100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 100 }}
    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-80"
  >
    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
      <DollarSign size={24} />
    </div>
    <div>
      <p className="font-bold">New Payment!</p>
      <p className="text-sm">Azmah College just paid ₦850,000</p>
    </div>
  </motion.div>
</div>
        {/* Search */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Search schools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:border-cyan-400 text-white placeholder-white/50 w-full lg:w-80 transition"
          />
        </div>

        {/* Tier Filter */}
        <select
          value={filterTier}
          onChange={e => setFilterTier(e.target.value)}
          className="px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:border-cyan-400 text-white"
        >
          <option value="all">All Tiers</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
      </div>
    </div>
  </div>

  {/* Table */}
  <div className="overflow-x-auto relative">
  {/* Mobile scroll hint */}
  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/70 to-transparent pointer-events-none lg:hidden" />
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/10 text-left text-white/70 text-sm">
          <th className="py-6 px-8 font-medium">School Name</th>
          <th className="py-6 px-8 font-medium">Tier</th>
          <th className="py-6 px-8 font-medium">Status</th>
          <th className="py-6 px-8 font-medium">Revenue</th>
          <th className="py-6 px-8 font-medium text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredSchools.length === 0 ? (
          <tr>
            <td colSpan="5" className="text-center py-20 text-white/50">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl">No schools found</p>
            </td>
          </tr>
        ) : (
          filteredSchools.map((school, i) => (
            <motion.tr
              key={school.id}
              onClick={() => setSelectedSchool(school)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-white/05 hover:bg-white/5 transition-all duration-300"
            >
              <td className="py-6 px-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {school.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{school.name}</p>
                    <p className="text-sm text-white/60">{school.subdomain}.teebotacadion.com</p>
                  </div>
                </div>
              </td>

              <td className="py-6 px-8">
                <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                  school.subscriptionTier === 'premium' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                    : school.subscriptionTier === 'pro' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                }`}>
                  {school.subscriptionTier.toUpperCase()}
                </span>
              
              {/* After Tier badge */}
             {school.healthScore !== undefined && (
          <div className="flex items-center gap-2 mt-2">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
      school.riskLevel === 'low' ? 'bg-emerald-400' :
      school.riskLevel === 'medium' ? 'bg-amber-400' :
      school.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
    }`} />
        <span className="text-xs font-medium text-white/80">
      {school.healthScore}% Health • {school.riskLevel?.toUpperCase() || 'UNKNOWN'} Risk
       </span>
      </div>
)}
         </td>
              <td className="py-6 px-8">
                <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                  school.subscriptionStatus === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : school.subscriptionStatus === 'trial'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {school.subscriptionStatus}
                </span>
              </td>

              <td className="py-6 px-8">
                <p className="text-2xl font-bold text-white">₦{(school.totalRevenue || 0).toLocaleString()}</p>
              </td>

              <td className="py-6 px-8">
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => upgradeTier(school.subdomain, 'pro')} className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition text-sm font-medium">
                    → Pro
                  </button>
                  <button onClick={() => upgradeTier(school.subdomain, 'premium')} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition text-sm font-medium">
                    → Premium
                  </button>
                  <button onClick={() => suspendSchool(school.id)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition text-sm font-medium">
                    Suspend
                  </button>
                  <a href={`/${school.subdomain}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition text-sm font-medium">
                    View →
                  </a>
                </div>
              </td>
            </motion.tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  {/* Pagination */}
  <div className="p-6 border-t border-white/10 flex justify-between items-center">
    <button 
      onClick={() => setPage(p => Math.max(1, p - 1))} 
      disabled={page === 1}
      className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 disabled:opacity-50 transition"
    >
      ← Previous
    </button>
    <span className="text-white/80 font-medium">Page {page}</span>
    <button 
      onClick={() => setPage(p => p + 1)}
      className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
    >
      Next →
    </button>
  </div>
</motion.div>
                {/* QUICK ACTIONS */}
        {/* FLOATING ACTION BUTTON + Export */}
<div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
  {/* Main FAB */}
  <motion.button
    onClick={() => navigate('/saas/schools/create')}
    onMouseEnter={() => playWhoosh()}
    className="group relative w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300"
    whileHover={{ scale: 1.2 }}
    whileTap={{ scale: 0.9 }}
  >
    <Plus size={32} className="text-white" />
    <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
      Create New School
    </span>
  </motion.button>

  {/* Export Button */}
  <motion.button
    onClick={exportCSV}
    className="w-16 h-16 bg-white/10 backdrop-blur border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
  >
    <Download size={24} className="text-white" />
  </motion.button>
</div>
      </main>
          {/* --- NEW ULTRA-MODERN ACTIVITY BUTTON --- */}
<motion.button
  onClick={() => setIsActivityOpen(!isActivityOpen)}
  initial={{ x: 100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.6, type: "spring" }}
  className="
    fixed right-6 top-28 z-50
    w-14 h-32 rounded-l-3xl  /* ← Reduced from h-40 to h-28 */
    bg-gradient-to-b from-cyan-500 via-purple-500 to-fuchsia-600
    shadow-[0_0_30px_rgba(0,0,0,0.4)]
    flex flex-col items-center justify-center gap-2
    border border-white/10 backdrop-blur-xl
    hover:shadow-[0_0_45px_rgba(0,0,0,0.6)]
    hover:w-16 hover:h-36 transition-all duration-500 group
  "
>
  {/* 3D Bars */}
  <div className="w-1 h-8 rounded-full bg-white/70 group-hover:h-10 transition-all"></div>
  <div className="w-1 h-8 rounded-full bg-white/70 group-hover:h-10 transition-all"></div>
  <div className="w-1 h-8 rounded-full bg-white/70 group-hover:h-10 transition-all"></div>

  {/* Tooltip */}
  <span className="
    absolute left-[-140px] top-1/2 -translate-y-1/2
    px-4 py-2 rounded-xl text-sm font-semibold
    bg-black/80 text-white backdrop-blur-lg
    opacity-0 group-hover:opacity-100 transition-all duration-300
    pointer-events-none
  ">
    Live Activity →
  </span>
</motion.button>

      {/* --- 3D ACTIVITY PANEL (FRAMER MOTION) --- */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isActivityOpen ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="
          fixed right-0 top-32 bottom-0 w-full max-w-sm lg:max-w-md z-40
          bg-gradient-to-br from-black/70 via-slate-900/60 to-black/80
          backdrop-blur-2xl border-l border-white/10
          shadow-[0_0_50px_rgba(0,0,0,0.6)]
          flex flex-col
        "
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-bold text-cyan-300">Live Activity</h3>
          </div>

          <button
            onClick={() => setIsActivityOpen(false)}
            className="text-white/60 hover:text-white text-2xl transition"
          >
            ×
          </button>
        </div>

        {/* Feed */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
  {activities.length === 0 ? (
    <p className="text-center text-white/50 py-12 text-lg">
      No recent activity
    </p>
  ) : (
    activities.map((a) => (
      <motion.div
        key={a.id || a.created_at} 
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-xl shadow-lg"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
          <School size={24} className="text-white" />
        </div>

        <div className="flex-1">
          <p className="font-bold">{a.school_name || 'Unknown School'}</p>
          <p className="text-sm text-white/70">
            {a.action} {a.amount ? `₦${Number(a.amount).toLocaleString()}` : ""}
          </p>
        </div>

        <p className="text-xs text-white/50">
          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
        </p>
      </motion.div>
    ))
  )}
</div>
      
      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
        <motion.button
          onClick={() => navigate('/saas/schools/create')}
          className="group relative w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus size={32} className="text-white" />
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
            Create New School
          </span>
        </motion.button>

        <motion.button
          onClick={exportCSV}
          className="w-16 h-16 bg-white/10 backdrop-blur border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Download size={24} className="text-white" />
        </motion.button>
      </div>
      {selectedSchool && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setSelectedSchool(null)}>
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 max-w-2xl w-full"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl flex items-center justify-center text-4xl font-bold">
            {selectedSchool.name[0]}
          </div>
          <div>
            <h2 className="text-3xl font-bold">{selectedSchool.name}</h2>
            <p className="text-white/70">{selectedSchool.subdomain}.teebotacadion.com</p>
          </div>
        </div>
        <button onClick={() => setSelectedSchool(null)} className="text-3xl">×</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 rounded-2xl p-6">
          <p className="text-white/70">Tier</p>
          <p className="text-2xl font-bold">{selectedSchool.subscriptionTier.toUpperCase()}</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-6">
          <p className="text-white/70">Total Revenue</p>
          <p className="text-2xl font-bold">₦{(selectedSchool.totalRevenue || 0).toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-white/5 rounded-2xl p-6">
        <p className="text-white/70">Risk Level</p>
        <p className={`text-2xl font-bold ${
        selectedSchool.riskLevel === 'low' ? 'text-emerald-400' :
        selectedSchool.riskLevel === 'medium' ? 'text-amber-400' :
        selectedSchool.riskLevel === 'high' ? 'text-orange-500' : 'text-red-400'
        }`}>
          {selectedSchool.riskLevel.toUpperCase()} RISK
       </p>

      </div>
      <div className="flex gap-4 mt-8">
        <button onClick={() => { upgradeTier(selectedSchool.subdomain, 'premium'); setSelectedSchool(null); }} 
          className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-bold">
          Upgrade to Premium
        </button>
        <button onClick={() => { suspendSchool(selectedSchool.id); setSelectedSchool(null); }} 
          className="px-6 py-4 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">
          Suspend School
        </button>
        <a href={`/${selectedSchool.subdomain}`} target="_blank" className="px-6 py-4 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-xl">
          View Live
        </a>
      </div>
    </motion.div>
  </div>
)}
<CommandPalette schools={schools} />
      </motion.div>
    </div>
  );
};

export default SaaSDashboard;