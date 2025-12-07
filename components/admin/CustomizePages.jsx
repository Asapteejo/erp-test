import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } };
import { useClerkAuth } from '../../hooks/useClerkAuth';
import toast from 'react-hot-toast';
import UpgradeModal from './UpgradeModal';

const CustomizePages = () => {
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const [school, setSchool] = useState({ subscriptionTier: 'basic', fontFamily: 'Inter' });
  const [pages, setPages] = useState({
    about: { title: '', content: '', imageUrl: '', imageFile: null },
    news: { title: '', content: '', imageUrl: '', imageFile: null },
    contact: { title: '', content: '', imageUrl: '', imageFile: null, googleMapEmbed: '' },
  });
  const [loading, setLoading] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, feature: '', requiredTier: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: pageData, error: pageError }, { data: schoolData, error: schoolError }] = await Promise.all([
          supabase.from('pageContents').select('slug, title, content, imageUrl, googleMapEmbed').eq('schoolId', schoolId),
          supabase.from('schools').select('subscriptionTier, fontFamily').eq('id', schoolId).single(),
        ]);
        if (pageError || schoolError) throw new Error('Failed to fetch data');
        const pageMap = pageData.reduce(
          (acc, page) => ({
            ...acc,
            [page.slug]: {
              title: page.title,
              content: page.content,
              imageUrl: page.imageUrl,
              imageFile: null,
              googleMapEmbed: page.googleMapEmbed || '',
            },
          }),
          { about: { title: '', content: '', imageUrl: '', imageFile: null }, news: { title: '', content: '', imageUrl: '', imageFile: null }, contact: { title: '', content: '', imageUrl: '', imageFile: null, googleMapEmbed: '' } }
        );
        setPages(pageMap);
        setSchool(schoolData || { subscriptionTier: 'basic', fontFamily: 'Inter' });
        setLoading(false);
        toast.success('Pages loaded successfully!');
      } catch (err) {
        console.error('Error fetching pages:', err);
        toast.error('Failed to load pages');
        setLoading(false);
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

  const handleChange = (section, field, value) => {
    if (section === 'contact' && field === 'googleMapEmbed' && school.subscriptionTier === 'basic') {
      setUpgradeModal({ isOpen: true, feature: 'Google Map embed', requiredTier: 'Pro or Premium' });
      return;
    }
    setPages(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleFileChange = (section, file) => {
    setPages(prev => ({
      ...prev,
      [section]: { ...prev[section], imageFile: file },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      for (const [slug, { title, content, imageFile, imageUrl, googleMapEmbed }] of Object.entries(pages)) {
        let newImageUrl = imageUrl;
        if (imageFile) {
          const { data, error } = await supabase.storage
            .from('school-assets')
            .upload(`pages/${schoolId}/${slug}/${imageFile.name}`, imageFile, { upsert: true });
          if (error) throw error;
          newImageUrl = supabase.storage.from('school-assets').getPublicUrl(data.path).data.publicUrl;
        }
        await supabase
          .from('pageContents')
          .upsert({
            slug,
            title,
            content,
            imageUrl: newImageUrl,
            googleMapEmbed: slug === 'contact' && school.subscriptionTier !== 'basic' ? googleMapEmbed : null,
            schoolId,
            updatedAt: new Date(),
          })
          .eq('schoolId', schoolId)
          .eq('slug', slug);
      }
      toast.success('Pages saved!');
      navigate(`/saas/dashboard?schoolId=${schoolId}`);
    } catch (err) {
      console.error('Error saving pages:', err);
      toast.error('Failed to save pages');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-600">Loading...</div>;

  return (
    <motion.div
      className="p-8 max-w-4xl mx-auto bg-[var(--background-color)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ '--font-family': school.fontFamily }}
    >
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, feature: '', requiredTier: '' })}
        feature={upgradeModal.feature}
        requiredTier={upgradeModal.requiredTier}
      />
      <motion.h2
        className="text-2xl font-semibold mb-4"
        style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Customize Pages
      </motion.h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {['about', 'news', 'contact'].map(section => (
          <motion.div
            key={section}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * ['about', 'news', 'contact'].indexOf(section), duration: 0.5 }}
          >
            <h3
              className="text-lg font-medium capitalize mb-4"
              style={{ fontFamily: 'var(--font-family)', color: 'var(--primary-color)' }}
            >
              {section} Page
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-family)' }}>
                Title
              </label>
              <input
                type="text"
                value={pages[section].title}
                onChange={(e) => handleChange(section, 'title', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white/30 backdrop-blur-sm"
                placeholder={`Enter ${section} title`}
                aria-label={`${section} page title`}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-family)' }}>
                Content
              </label>
              <textarea
                value={pages[section].content}
                onChange={(e) => handleChange(section, 'content', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-white/30 backdrop-blur-sm"
                rows={4}
                placeholder={`Enter ${section} content`}
                aria-label={`${section} page content`}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-family)' }}>
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(section, e.target.files[0])}
                className="w-full"
                aria-label={`${section} page image`}
              />
              {pages[section].imageUrl && (
                <img src={pages[section].imageUrl} alt={`${section} Image`} className="mt-2 w-32 h-20 object-cover rounded-lg" />
              )}
            </div>
            {section === 'contact' && (school.subscriptionTier === 'pro' || school.subscriptionTier === 'premium') && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ fontFamily: 'var(--font-family)' }}>
                  Google Map Embed
                </label>
                <input
                  type="text"
                  value={pages[section].googleMapEmbed}
                  onChange={(e) => handleChange(section, 'googleMapEmbed', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white/30 backdrop-blur-sm"
                  placeholder="Enter Google Map embed URL"
                  aria-label="Google Map embed URL"
                />
              </div>
            )}
            {section === 'contact' && school.subscriptionTier === 'basic' && (
              <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-family)' }}>
                Upgrade to Pro or Premium to add a Google Map embed
              </p>
            )}
          </motion.div>
        ))}
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white py-2 rounded-lg hover:from-[var(--secondary-color)] hover:to-[var(--primary-color)] disabled:bg-gray-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Save custom pages"
        >
          {loading ? 'Saving...' : 'Save Pages'}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default CustomizePages;
