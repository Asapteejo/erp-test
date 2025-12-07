

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stepper, Step, StepLabel, Button } from '@mui/material';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } };
import toast from 'react-hot-toast';
import ReactGA from 'react-ga4';
import UpgradeModal from '../components/admin/UpgradeModal';

const ApplyForm = () => {
  const { schoolId } = useParams();
  const { control, handleSubmit, formState: { errors }, reset } = useForm();
  const [files, setFiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [school, setSchool] = useState({ name: 'Azmah College', fontFamily: 'Inter', subscriptionTier: 'basic' });
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', requiredTier: '' });
  const steps = ['Personal Info', 'Program Selection', 'Documents'];

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
          toast.success('Application form loaded successfully!');
          return;
        } catch (err) {
          console.error(`Attempt ${i + 1} failed:`, err);
          if (i === retries - 1) {
            toast.error('Failed to load application form');
            setLoading(false);
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

  const onSubmit = async data => {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => form.append(key, value));
    for (let i = 0; i < files.length; i++) {
      form.append('documents', files[i]);
    }
    try {
      let documents = [];
      for (const file of files) {
        const { data: uploadData, error } = await supabase.storage
          .from('school-assets')
          .upload(`applications/${schoolId}/${Date.now()}/${file.name}`, file, { upsert: true });
        if (error) throw error;
        documents.push(supabase.storage.from('school-assets').getPublicUrl(uploadData.path).data.publicUrl);
      }
      const { error } = await supabase
        .from('applications')
        .insert({
          schoolId,
          name: data.name,
          email: data.email,
          program: data.program,
          documents,
          createdAt: new Date(),
        });
      if (error) throw error;
      ReactGA.event({ category: 'Form', action: 'Submit', label: 'Application Form' });
      toast.success('Application submitted successfully! Check the portal for next steps.');
      setFiles([]);
      setActiveStep(0);
      reset();
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Error submitting application. Please try again.');
    }
  };

  const handleProgramChange = (value) => {
    if (school?.subscriptionTier === 'basic' && departments.length > 2 && departments.findIndex(dept => dept.name === value) >= 2) {
      setUpgradeModal({ isOpen: true, feature: 'additional programs', requiredTier: 'Pro or Premium' });
      return false;
    }
    return true;
  };

  if (loading) return <div className="text-center py-8 text-gray-600">Loading...</div>;

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ '--font-family': school.fontFamily }}
    >
      <Helmet>
        <title>Apply Now | {school.name}</title>
        <meta name="description" content={`Apply to join ${school.name} and start your journey in education.`} />
        <meta name="keywords" content={`${school.name}, apply, admissions`} />
      </Helmet>
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, feature: '', requiredTier: '' })}
        feature={upgradeModal.feature}
        requiredTier={upgradeModal.requiredTier}
      />
      <motion.h1
        className="text-4xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        role="heading"
        aria-level="1"
      >
        Apply to {school.name}
      </motion.h1>
      <motion.p
        className="text-gray-600 text-center mb-6"
        style={{ fontFamily: 'var(--font-family)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Ready to join us? Fill out the form below to start your application.
      </motion.p>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 max-w-lg mx-auto bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {activeStep === 0 && (
          <>
            <motion.div animate={errors.name ? { x: [-10, 10, -10, 0] } : {}} transition={{ duration: 0.3 }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`w-full p-3 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'} bg-white/30 backdrop-blur-sm`}
                    placeholder="Your Name"
                    aria-label="Your Name"
                  />
                )}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </motion.div>
            <motion.div animate={errors.email ? { x: [-10, 10, -10, 0] } : {}} transition={{ duration: 0.3 }}>
              <Controller
                name="email"
                control={control}
                rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } }}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'} bg-white/30 backdrop-blur-sm`}
                    placeholder="Your Email"
                    aria-label="Your Email"
                  />
                )}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </motion.div>
          </>
        )}
        {activeStep === 1 && (
          <motion.div animate={errors.program ? { x: [-10, 10, -10, 0] } : {}} transition={{ duration: 0.3 }}>
            <Controller
              name="program"
              control={control}
              rules={{ required: 'Program is required' }}
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => {
                    if (handleProgramChange(e.target.value)) field.onChange(e);
                  }}
                  className={`w-full p-3 border rounded-lg ${errors.program ? 'border-red-500' : 'border-gray-300'} bg-white/30 backdrop-blur-sm`}
                  aria-label="Select Program"
                >
                  <option value="">Select a Program</option>
                  {departments.slice(0, school.subscriptionTier === 'basic' ? 2 : Infinity).map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              )}
            />
            {errors.program && <p className="text-red-500 text-sm">{errors.program.message}</p>}
            {school.subscriptionTier === 'basic' && departments.length > 2 && (
              <p className="text-sm text-gray-500 mt-1">Upgrade to Pro or Premium for more program options</p>
            )}
          </motion.div>
        )}
        {activeStep === 2 && (
          <input
            type="file"
            multiple
            onChange={e => setFiles(e.target.files)}
            className="w-full p-3 border rounded-lg bg-white/30 backdrop-blur-sm"
            aria-label="Upload Documents"
          />
        )}
        <div className="flex justify-between">
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
            className="px-4 py-2 bg-gray-300 rounded"
            aria-label="Previous step"
          >
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button
              onClick={() => setActiveStep(prev => prev + 1)}
              className="px-4 py-2 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white rounded hover:from-[var(--secondary-color)] hover:to-[var(--primary-color)]"
              aria-label="Next step"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="gradient-btn px-4 py-2 rounded bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white hover:from-[var(--secondary-color)] hover:to-[var(--primary-color)]"
              aria-label="Submit application"
            >
              Submit Application
            </Button>
          )}
        </div>
      </motion.form>
      <p className="text-center mt-6 text-gray-600" style={{ fontFamily: 'var(--font-family)' }}>
        Already a student?{' '}
        <RouterLink to={`/${schoolId}/login`} className="text-[var(--primary-color)] hover:underline" aria-label="Login to the portal">
          Login to the Portal
        </RouterLink>
      </p>
    </motion.div>
  );
};

export default ApplyForm;