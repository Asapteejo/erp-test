import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const Courses = () => (
  <motion.div
    className="max-w-6xl mx-auto px-4 py-12"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Helmet>
      <title>Courses | Azmah College</title>
      <meta name="description" content="View all courses offered at Azmah College of Health Science." />
    </Helmet>
    <h1 className="text-4xl font-bold text-center mb-8 text-primary">Courses</h1>
        <p className="text-gray-600">Courses content goes</p>
      </motion.div>
    );
    
    export default Courses;