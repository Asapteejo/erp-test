import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useInView } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } };
import toast from 'react-hot-toast';
import SkeletonCard from '../components/SkeletonCard';
import UpgradeModal from '../components/admin/UpgradeModal';

const Departments = () => {
  const { schoolId } = useParams();
  const [departments, setDepartments] = useState([]);
  const [school, setSchool] = useState({ name: 'Azmah College', fontFamily: 'Inter', subscriptionTier: 'basic' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', requiredTier: '' });
  const departmentsRef = useRef(null);
  const departmentsInView = useInView(departmentsRef, { once: true, margin: '-100px' });

  useEffect(() => {
    const fetchData = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const [{ data: deptData, error: deptError }, { data: schoolData, error: schoolError }] = await Promise.all([
            supabase.from('departments').select('*').eq('schoolId', schoolId),
            supabase.from('schools').select('name, fontFamily, subscriptionTier').eq('id', schoolId).single(),
          ]);
          if (deptError || schoolError) throw new Error('Failed to fetch data');
          setDepartments(deptData || []);
          setSchool(schoolData || { name: 'Azmah College', fontFamily: 'Inter', subscriptionTier: 'basic' });
          setLoading(false);
          toast.success('Departments loaded successfully!');
          return;
        } catch (err) {
          console.error(`Attempt ${i + 1} failed:`, err);
          if (i === retries - 1) {
            setError('Failed to load departments');
            setLoading(false);
            toast.error('Failed to load departments');
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    };
    if (schoolId) fetchData();
  }, [schoolId]);

  useEffect(() => {
    if (school.fontFamily && school.fontFamily !== 'Inter') {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${school.fontFamily.replace(' ', '+')}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    document.documentElement.style.setProperty('--font-family', school.fontFamily);
    document.documentElement.style.setProperty('--primary-color', '#3B82F6');
    document.documentElement.style.setProperty('--secondary-color', '#1E40AF');
  }, [school.fontFamily]);

  const handleDepartmentClick = (deptId) => {
    if (school.subscriptionTier === 'basic') {
      setUpgradeModal({ isOpen: true, feature: 'detailed department views', requiredTier: 'Pro or Premium' });
      return false;
    }
    return true;
  };

  return (
    <motion.div
      ref={departmentsRef}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: departmentsInView ? 1 : 0, x: departmentsInView ? 0 : 100 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      style={{ '--font-family': school.fontFamily }}
    >
      <Helmet>
        <title>Departments | {school.name}</title>
        <meta name="description" content={`Explore departments at ${school.name}.`} />
        <meta name="keywords" content={`${school.name}, departments, education`} />
      </Helmet>
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, feature: '', requiredTier: '' })}
        feature={upgradeModal.feature}
        requiredTier={upgradeModal.requiredTier}
      />
      <motion.h1
        className="text-4xl font-bold text-center mb-10"
        style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        role="heading"
        aria-level="1"
      >
        Our Departments
      </motion.h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <p className="text-center text-red-600" style={{ fontFamily: 'var(--font-family)' }}>{error}</p>
      ) : departments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {departments.map(dept => (
            <motion.div
              key={dept.id}
              className="glass rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm"
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={`/departments/${dept.id}`}
                onClick={(e) => {
                  if (!handleDepartmentClick(dept.id)) e.preventDefault();
                }}
                aria-label={`View details for ${dept.name}`}
              >
                {dept.imageUrl ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <LazyLoadImage
                      src={dept.imageUrl}
                      placeholderSrc="/images/placeholder.jpg"
                      alt={dept.name}
                      effect="blur"
                      className="w-full h-56 object-cover rounded-lg mb-4"
                      loading="lazy"
                    />
                  </motion.div>
                ) : (
                  <i className="fas fa-university fa-4x mb-4 block text-center" style={{ color: 'var(--primary-color)' }}></i>
                )}
                <h2
                  className="text-2xl font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
                >
                  {dept.name}
                </h2>
                <p className="text-gray-600 mb-4" style={{ fontFamily: 'var(--font-family)' }}>
                  {dept.description?.slice(0, 120) || 'No description provided.'}...
                </p>
                {dept.hodName && (
                  <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-family)' }}>
                    Head: <span className="font-medium">{dept.hodName}</span>
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600" style={{ fontFamily: 'var(--font-family)' }}>
          No departments available right now.
        </p>
      )}
    </motion.div>
  );
};

export default Departments;