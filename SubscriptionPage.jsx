import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } };
import { useClerkAuth } from '../hooks/useClerkAuth';
import toast from 'react-hot-toast';

const SubscriptionPage = () => {
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const navigate = useNavigate();
  const { user, isSignedIn } = useClerkAuth();
  const [school, setSchool] = useState({ subscriptionTier: 'basic' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('subscriptionTier, fontFamily')
          .eq('id', schoolId)
          .single();
        if (error) throw error;
        setSchool(data || { subscriptionTier: 'basic', fontFamily: 'Inter' });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching school:', err);
        toast.error('Failed to load subscription details');
        setLoading(false);
      }
    };
    if (schoolId) fetchSchool();
  }, [schoolId]);

  useEffect(() => {
    if (school.fontFamily && school.fontFamily !== 'Inter') {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${school.fontFamily.replace(' ', '+')}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    document.documentElement.style.setProperty('--font-family', school.fontFamily || 'Inter');
    document.documentElement.style.setProperty('--primary-color', '#3B82F6');
    document.documentElement.style.setProperty('--secondary-color', '#1E40AF');
  }, [school.fontFamily]);

  const handleUpgrade = async (tier) => {
    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }
    setLoading(true);
    try {
      // Simulate subscription upgrade (replace with actual payment integration, e.g., Stripe)
      const { error } = await supabase
        .from('schools')
        .update({ subscriptionTier: tier })
        .eq('id', schoolId);
      if (error) throw error;
      toast.success(`Upgraded to ${tier} plan!`);
      navigate(`/saas/dashboard?schoolId=${schoolId}`);
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      toast.error('Failed to upgrade subscription');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-600">Loading...</div>;

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ '--font-family': school.fontFamily || 'Inter' }}
    >
      <motion.h1
        className="text-4xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Upgrade Your Subscription
      </motion.h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Basic', 'Pro', 'Premium'].map(tier => (
          <motion.div
            key={tier}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <h2
              className="text-2xl font-semibold mb-4"
              style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
            >
              {tier} Plan
            </h2>
            <ul className="text-gray-600 mb-6" style={{ fontFamily: 'var(--font-family)' }}>
              {tier === 'Basic' && (
                <>
                  <li>Classic layout</li>
                  <li>Inter font</li>
                  <li>Max 2 programs</li>
                  <li>No video uploads</li>
                  <li>No social media icons</li>
                </>
              )}
              {tier === 'Pro' && (
                <>
                  <li>Classic & Modern layouts</li>
                  <li>Roboto, Lora, Montserrat fonts</li>
                  <li>Max 5 programs</li>
                  <li>Max 3 social media icons</li>
                  <li>Campus Life & Testimonials</li>
                  <li>Google Map on Contact</li>
                  <li>Limited CBT access</li>
                </>
              )}
              {tier === 'Premium' && (
                <>
                  <li>All layouts (Classic, Modern, Minimal)</li>
                  <li>All fonts (plus Poppins, Open Sans)</li>
                  <li>Unlimited programs</li>
                  <li>Video uploads</li>
                  <li>Unlimited social media icons</li>
                  <li>Full CBT access</li>
                </>
              )}
            </ul>
            <button
              onClick={() => handleUpgrade(tier.toLowerCase())}
              disabled={loading || school.subscriptionTier === tier.toLowerCase()}
              className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white py-2 rounded-lg hover:from-[var(--secondary-color)] hover:to-[var(--primary-color)] disabled:bg-gray-300"
              aria-label={`Upgrade to ${tier} plan`}
            >
              {school.subscriptionTier === tier.toLowerCase() ? 'Current Plan' : `Upgrade to ${tier}`}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SubscriptionPage;