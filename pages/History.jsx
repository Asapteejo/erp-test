import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const History = () => (
  <motion.div
    className="max-w-6xl mx-auto px-4 py-12"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Helmet>
      <title>History | Azmah College</title>
      <meta name="description" content="Discover the history of Azmah College of Health Science." />
      <meta name="keywords" content="Azmah College, history" />
    </Helmet>
    <h1 className="text-4xl font-bold text-center mb-8 text-primary">History</h1>
    <p className="text-gray-600">History content goes here.</p>
  </motion.div>
);

export default History;