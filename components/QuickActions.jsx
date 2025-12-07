// src/components/QuickActions.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const QuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { name: 'Apply Now', path: '/apply', icon: 'fas fa-graduation-cap' },
    { name: 'Contact Us', path: '/contact', icon: 'fas fa-envelope' },
    { name: 'Virtual Tour', path: '/tour', icon: 'fas fa-video' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        className="glass bg-primary text-white p-4 rounded-full shadow-lg hover:bg-nav-hover transition"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Toggle quick actions"
      >
        <i className={isOpen ? 'fas fa-times' : 'fas fa-plus'}></i>
      </motion.button>
      {isOpen && (
        <motion.div
          className="absolute bottom-16 right-0 bg-nav-bg rounded-lg shadow-lg p-4 flex flex-col gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          role="menu"
          aria-label="Quick actions menu"
        >
          {actions.map(action => (
            <Link
              key={action.name}
              to={action.path}
              className="flex items-center gap-2 text-nav-text hover:bg-nav-hover hover:text-white px-4 py-2 rounded transition"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              aria-label={action.name}
            >
              <i className={action.icon}></i> {action.name}
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default QuickActions;
