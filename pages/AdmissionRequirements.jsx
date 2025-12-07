import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const AdmissionRequirements = () => (
  <motion.div
    className="max-w-6xl mx-auto px-4 py-12"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Helmet>
      <title>Admission Requirements | Azmah College</title>
      <meta name="description" content="Learn about the admission requirements for Azmah College of Health Science." />
    </Helmet>
    <h1 className="text-4xl font-bold text-center mb-8 text-primary">Admission Requirements</h1>
    <p className="text-gray-600">Admission requirements content goes here.</p>
  </motion.div>
);

export default AdmissionRequirements;