import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactGA from 'react-ga4';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      let newTheme;
      if (prev === 'system') newTheme = 'light';
      else if (prev === 'light') newTheme = 'dark';
      else newTheme = 'system';
      
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.remove('light', 'dark');
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (newTheme === 'light') {
        document.documentElement.classList.add('light');
      }
      ReactGA.event({ category: 'Theme', action: 'Toggle', label: newTheme });
      return newTheme;
    });
  };

  return (
    <motion.button
      className="fixed bottom-4 left-4 z-[1100] bg-primary text-white rounded-full p-3 shadow-lg hover:bg-nav-hover focus:outline-none focus:ring-2 focus:ring-nav-hover group"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'} mode`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {theme === 'system' ? (
        <i className="fas fa-desktop text-lg"></i>
      ) : theme === 'light' ? (
        <i className="fas fa-sun text-lg"></i>
      ) : (
        <i className="fas fa-moon text-lg"></i>
      )}
      <span className="absolute bottom-14 left-12 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
        {theme === 'system' ? 'System Default' : theme === 'light' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </motion.button>
  );
};

export default ThemeToggle;
