import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const MissionVision = () => (
  <motion.div
    className="max-w-6xl mx-auto px-4 py-12"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Helmet>
      <title>Mission & Vision | Azmah College</title>
      <meta name="description" content="Learn about the mission and vision of Azmah College of Health Science." />
      <meta name="keywords" content="Azmah College, mission, vision" />
    </Helmet>
    <h1 className="text-4xl font-bold text-center mb-8 text-primary">Mission & Vision</h1>
    <p className="text-gray-600">Mission and vision content goes here.</p>
  </motion.div>
);

export default MissionVision;