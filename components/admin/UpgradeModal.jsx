import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, feature, requiredTier }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg max-w-md w-full"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800" style={{ fontFamily: 'var(--font-family)' }}>
          Upgrade Required
        </h2>
        <p className="text-gray-600 mb-6" style={{ fontFamily: 'var(--font-family)' }}>
          The {feature} feature is only available on the {requiredTier} plan. Upgrade your subscription to unlock this feature.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            aria-label="Close upgrade modal"
          >
            Cancel
          </button>
          <Link
            to="/saas/subscription"
            className="gradient-btn px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white hover:from-[var(--secondary-color)] hover:to-[var(--primary-color)]"
            aria-label="Upgrade subscription"
          >
            Upgrade Now
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UpgradeModal;
