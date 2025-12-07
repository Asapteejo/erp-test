// src/components/CommandPalette.jsx
import React, { useEffect, useState } from 'react';
import { Search, School, Plus, Download, Settings, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const actions = [
  { name: 'Create New School', icon: Plus, action: () => window.location.href = '/saas/schools/create' },
  { name: 'Export All Schools', icon: Download, action: () => document.querySelector('[data-export-csv]')?.click() },
  { name: 'Go to Schools List', icon: School, action: () => window.location.href = '/saas/schools' },
  { name: 'Trigger Maintenance Mode', icon: Zap, action: () => alert('Coming soon') },
  { name: 'View System Health', icon: Settings, action: () => alert('Health panel coming soon') },
];

export default function CommandPalette({ schools = [] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filtered = [
    ...actions.filter(a => a.name.toLowerCase().includes(search.toLowerCase())),
    ...schools
      .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
      .map(s => ({
        name: `Go to ${s.name}`,
        subtitle: s.subdomain + '.teebotacadion.com',
        icon: School,
        action: () => window.open(`/${s.subdomain}`, '_blank')
      }))
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-32 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
            >
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Search size={20} className="text-white/50" />
                    <input
                      autoFocus
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search schools or actions..."
                      className="bg-transparent outline-none text-white placeholder-white/50 flex-1 text-lg"
                    />
                    <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-center text-white/50 py-12">No results</p>
                  ) : (
                    filtered.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => { item.action(); setOpen(false); }}
                        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/10 transition text-left"
                      >
                        <item.icon size={20} className="text-white/70" />
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          {item.subtitle && <p className="text-white/50 text-sm">{item.subtitle}</p>}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-white/10 text-xs text-white/50 flex justify-between">
                  <span>↑↓ to navigate</span>
                  <span>↵ to select</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cmd+K Hint */}
      <div className="fixed bottom-8 left-8 z-40">
        <kbd className="px-3 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white/70 text-sm">
          Press <kbd className="mx-1 px-2 py-1 bg-white/20 rounded">⌘ K</kbd> for quick actions
        </kbd>
      </div>
    </>
  );
}