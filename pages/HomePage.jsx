// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';   // ← THIS LINE IS MISSING
import UpgradeModal from '../components/admin/UpgradeModal';

const HomePage = () => {
  const { customization = {} } = useOutletContext() || {};
  const [school, setSchool] = useState(customization || {
    name: 'Your School',
    motto: 'Empowering the Future',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    logoUrl: '',
    heroImageUrl: '/images/hero.jpg',
    heroVideoUrl: '',
    customAbout: '',
    customPrograms: [],
    socialMediaIcons: [],
    socialMediaLinks: [],
    themeJson: null,
    customFont: null,
    faviconUrl: null,
    customDomain: null,
    subscriptionTier: 'basic',
  });

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const { t } = useTranslation();

  const isProOrPremium = ['pro', 'premium'].includes(school.subscriptionTier);

  // Load Custom Font + Favicon
  useEffect(() => {
    if (school.customFont) {
      const link = document.createElement('link');
      link.href = school.customFont;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (school.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = school.faviconUrl;
    }
  }, [school.customFont, school.faviconUrl]);

  // Apply colors
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', school.primaryColor || '#3b82f6');
    document.documentElement.style.setProperty('--secondary', school.secondaryColor || '#1e40af');
  }, [school.primaryColor, school.secondaryColor]);

  useEffect(() => {
    setSchool(prev => ({ ...prev, ...customization }));
  }, [customization]);

  const requireUpgrade = (feature) => {
    setUpgradeFeature(feature);
    setShowUpgrade(true);
  };

  const renderBlock = (block) => {
    switch (block.type) {
      case 'hero':
        return (
          <section className="relative h-screen flex items-center justify-center overflow-hidden">
            {school.heroVideoUrl && isProOrPremium ? (
              <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover">
                <source src={school.heroVideoUrl} type="video/mp4" />
              </video>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]" />
            )}
            <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
              {school.logoUrl && <img src={school.logoUrl} alt="Logo" className="h-24 mx-auto mb-8" />}
              <motion.h1 
                className="text-5xl md:text-7xl font-bold text-white mb-6"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
              >
                {block.title || school.name}
              </motion.h1>
              <motion.p 
                className="text-2xl md:text-4xl text-white mb-10 font-light"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {block.subtitle || school.motto}
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <RouterLink to="/apply" className="px-10 py-4 bg-white text-[var(--primary)] rounded-full text-xl font-bold hover:scale-105 transition shadow-2xl">
                  Apply Now
                </RouterLink>
                <RouterLink to="/tour" className="px-10 py-4 bg-transparent border-2 border-white text-white rounded-full text-xl font-bold hover:bg-white hover:text-[var(--primary)] transition">
                  Virtual Tour
                </RouterLink>
              </motion.div>
            </div>
          </section>
        );

      case 'programs':
        return (
          <section className="py-20 px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <motion.h2 
                className="text-5xl font-bold text-center mb-16" 
                style={{ color: 'var(--primary)' }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                Our Programs
              </motion.h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {(school.customPrograms || []).map((p, i) => (
                  <motion.div
                    key={i}
                    className="group relative overflow-hidden rounded-3xl shadow-2xl bg-white"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -10 }}
                  >
                    {p.imageUrl && (
                      <div className="h-64 overflow-hidden">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                      </div>
                    )}
                    <div className="p-8">
                      <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--primary)' }}>{p.name}</h3>
                      <p className="text-gray-600 mb-6">{p.description}</p>
                      <RouterLink to="/academics" className="text-[var(--secondary)] font-semibold hover:underline">
                        Explore Program →
                      </RouterLink>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section className="py-20 px-6 bg-white">
            <div className="max-w-6xl mx-auto text-center">
              <motion.h2 
                className="text-5xl font-bold mb-16" 
                style={{ color: 'var(--primary)' }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
              >
                Student Success Stories
              </motion.h2>
              <Swiper modules={[Pagination, Autoplay, Navigation]} navigation pagination={{ clickable: true }} autoplay={{ delay: 5000 }}>
                {block.items?.length > 0 ? block.items.map((t, i) => (
                  <SwiperSlide key={i}>
                    <div className="px-20 py-16">
                      <p className="text-3xl italic mb-8 text-gray-700">"{t.message}"</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>- {t.name}</p>
                    </div>
                  </SwiperSlide>
                )) : (
                  <SwiperSlide>
                    <div className="text-gray-500 py-20">No testimonials yet.</div>
                  </SwiperSlide>
                )}
              </Swiper>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section className="py-32 text-center text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl md:text-7xl font-bold mb-8">
                {block.title || 'Ready to Transform Your Future?'}
              </h2>
              <p className="text-2xl mb-12 max-w-3xl mx-auto">
                {block.text || school.motto}
              </p>
              <RouterLink 
                to="/apply" 
                className="inline-block px-12 py-6 bg-white text-[var(--primary)] text-2xl font-bold rounded-full shadow-2xl hover:scale-110 transition-transform"
              >
                Apply Today
              </RouterLink>
            </motion.div>
          </section>
        );

      // PREMIUM ONLY: Animated Stats Counter
      case 'stats':
        if (school.subscriptionTier !== 'premium') {
          return (
            <div className="py-20 text-center">
              <p className="text-3xl font-bold mb-4">Animated Stats Counter</p>
              <p className="text-gray-600">Premium Feature Only</p>
              <button onClick={() => requireUpgrade('animated stats')} className="mt-6 px-8 py-4 bg-purple-600 text-white rounded-lg">
                Upgrade to Premium
              </button>
            </div>
          );
        }
        return (
          <section className="py-20 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
              {[
                { number: 5000, label: 'Students Enrolled' },
                { number: 98, label: '% Placement Rate', suffix: '%' },
                { number: 150, label: 'Expert Faculty' },
                { number: 50, label: 'Countries Represented' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                >
                  <h3 className="text-5xl font-bold" style={{ color: 'var(--primary)' }}>
                    <CountUp end={stat.number} suffix={stat.suffix || '+'} />
                  </h3>
                  <p className="text-gray-600 mt-4">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  // Fallback layout if no theme
  const defaultLayout = [
    { type: 'hero' },
    { type: 'programs' },
    { type: 'testimonials', items: [] },
    { type: 'stats' }, // Premium only
    { type: 'cta' },
  ];

  const layout = school.themeJson?.blocks?.length > 0 ? school.themeJson.blocks : defaultLayout;

  return (
    <>
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={upgradeFeature}
        requiredTier={upgradeFeature === 'animated stats' ? 'Premium' : 'Pro'}
      />

      <Helmet>
        <title>{school.name} | Excellence in Education</title>
        <meta name="description" content={school.customAbout?.slice(0, 160) || 'Leading educational institution'} />
        {school.faviconUrl && <link rel="icon" href={school.faviconUrl} />}
        {(school.subscriptionTier === 'pro' || school.subscriptionTier === 'premium') && school.customDomain && (
          <link rel="canonical" href={`https://${school.customDomain}`} />
        )}
      </Helmet>

      <div className="min-h-screen" style={{ fontFamily: school.customFont ? 'Custom Font, sans-serif' : 'Inter, sans-serif' }}>
        {layout.map((block, i) => (
          <div key={i}>{renderBlock(block)}</div>
        ))}
      </div>
    </>
  );
};

// Simple CountUp component (add this at bottom of file)
const CountUp = ({ end, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start > end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return <>{count}{suffix}</>;
};

export default HomePage;