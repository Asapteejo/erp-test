import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } };
import toast from 'react-hot-toast';
import ReactGA from 'react-ga4';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const ContactUs = () => {
  const { schoolId } = useParams();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [pageContent, setPageContent] = useState({ title: 'Contact Us', content: '', imageUrl: '' });
  const [school, setSchool] = useState({ name: 'Azmah College', subscriptionTier: 'basic', fontFamily: 'Inter' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const [{ data: pageData, error: pageError }, { data: schoolData, error: schoolError }] = await Promise.all([
            supabase.from('pageContents').select('title, content, imageUrl').eq('schoolId', schoolId).eq('slug', 'contact').single(),
            supabase.from('schools').select('name, subscriptionTier, fontFamily').eq('id', schoolId).single(),
          ]);
          if (pageError || schoolError) throw new Error('Failed to fetch data');
          setPageContent(pageData || { title: 'Contact Us', content: '', imageUrl: '' });
          setSchool(schoolData || { name: 'Azmah College', subscriptionTier: 'basic', fontFamily: 'Inter' });
          setLoading(false);
          toast.success('Contact page loaded successfully!');
          return;
        } catch (err) {
          console.error(`Attempt ${i + 1} failed:`, err);
          if (i === retries - 1) {
            setError('Failed to load contact page');
            setLoading(false);
            toast.error('Failed to load contact page');
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
  }, [school.fontFamily]);

  const onSubmit = async data => {
    if (!executeRecaptcha) {
      setError('reCAPTCHA not ready');
      toast.error('reCAPTCHA not ready');
      return;
    }
    try {
      const recaptchaToken = await executeRecaptcha('contact_form');
      const { error } = await supabase
        .from('contactSubmissions')
        .insert({
          schoolId,
          name: data.name,
          email: data.email,
          message: data.message,
          recaptchaToken,
          createdAt: new Date(),
        });
      if (error) throw error;
      setSuccess('Message sent successfully!');
      setError(null);
      reset();
      ReactGA.event({ category: 'Form', action: 'Submit', label: 'Contact Form' });
      toast.success('Message sent successfully!');
    } catch (err) {
      setError('Failed to submit message');
      setSuccess(null);
      console.error('Contact form error:', err);
      toast.error('Failed to submit message');
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-600">Loading...</div>;

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Helmet>
        <title>{pageContent.title || 'Contact Us'} | {school.name}</title>
        <meta name="description" content={pageContent.content?.slice(0, 150) || 'Get in touch with us.'} />
        <meta name="keywords" content={`${school.name}, contact, support`} />
      </Helmet>
      <motion.h1
        className="text-3xl font-bold text-center mb-6"
        style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        role="heading"
        aria-level="1"
      >
        {pageContent.title || 'Contact Us'}
      </motion.h1>
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <motion.div
              animate={errors.name ? { x: [-10, 10, -10, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <label
                className="block text-gray-700"
                style={{ fontFamily: 'var(--font-family)' }}
                htmlFor="name"
              >
                Name
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'} bg-white/30 backdrop-blur-sm`}
                aria-label="Name"
                id="name"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </motion.div>
            <motion.div
              animate={errors.email ? { x: [-10, 10, -10, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <label
                className="block text-gray-700"
                style={{ fontFamily: 'var(--font-family)' }}
                htmlFor="email"
              >
                Email
              </label>
              <input
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                className={`w-full p-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'} bg-white/30 backdrop-blur-sm`}
                aria-label="Email"
                id="email"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </motion.div>
            <motion.div
              animate={errors.message ? { x: [-10, 10, -10, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <label
                className="block text-gray-700"
                style={{ fontFamily: 'var(--font-family)' }}
                htmlFor="message"
              >
                Message
              </label>
              <textarea
                {...register('message', { required: 'Message is required' })}
                className={`w-full p-2 border rounded-lg ${errors.message ? 'border-red-500' : 'border-gray-300'} bg-white/30 backdrop-blur-sm`}
                aria-label="Message"
                id="message"
                rows={4}
              />
              {errors.message && <p className="text-red-500 text-sm">{errors.message.message}</p>}
            </motion.div>
            {success && <p className="text-green-500">{success}</p>}
            {error && <p className="text-red-500">{error}</p>}
            <motion.button
              type="submit"
              className="gradient-btn px-4 py-2 rounded-lg w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white hover:from-[var(--secondary-color)] hover:to-[var(--primary-color)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Submit contact form"
            >
              Submit
            </motion.button>
          </form>
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-gray-700" style={{ fontFamily: 'var(--font-family)' }}>
              Email: info@{school.name.toLowerCase().replace(' ', '')}.edu.ng
            </p>
            <p className="text-gray-700" style={{ fontFamily: 'var(--font-family)' }}>
              Phone: +234 123 456 7890
            </p>
            <p className="text-gray-700" style={{ fontFamily: 'var(--font-family)' }}>
              Address: 123 Health St, Lagos, Nigeria
            </p>
          </motion.div>
        </motion.div>
        {(school.subscriptionTier === 'pro' || school.subscriptionTier === 'premium') && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
              <GoogleMap
                mapContainerStyle={{ height: '400px', width: '100%' }}
                center={{ lat: 6.5244, lng: 3.3792 }}
                zoom={15}
                options={{ disableDefaultUI: false }}
              >
                <Marker position={{ lat: 6.5244, lng: 3.3792 }} />
              </GoogleMap>
            </LoadScript>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ContactUs;