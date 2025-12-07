// src/components/SkeletonCard.jsx
import { motion } from 'framer-motion';

const SkeletonCard = () => (
  <motion.div
    className="glass rounded-lg p-6 animate-pulse"
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 0.8 }}
    transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
  >
    <div className="w-full h-48 bg-gray-300 rounded-lg mb-4"></div>
    <div className="h-6 bg-gray-300 rounded mb-2"></div>
    <div className="h-4 bg-gray-300 rounded mb-2"></div>
    <div className="h-4 bg-gray-300 rounded"></div>
  </motion.div>
);

export default SkeletonCard;
