// src/pages/AboutUs.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const AboutUs = ({ schoolId, customization }) => {
  const [school, setSchool] = useState(customization || {
    name: 'Your School',
    customAbout: '',
    heroImageUrl: '/images/campus.jpg',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    fontFamily: 'Inter',
  });

  // Apply colors and font
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', school.primaryColor || '#3b82f6');
    document.documentElement.style.setProperty('--secondary', school.secondaryColor || '#1e40af');
    if (school.fontFamily && school.fontFamily !== 'Inter') {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${school.fontFamily.replace(' ', '+')}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [school]);

  return (
    <>
      <Helmet>
        <title>About Us | {school.name}</title>
        <meta name="description" content={school.customAbout?.slice(0, 160) || 'Learn more about our institution.'} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            style={{ fontFamily: school.fontFamily || 'Inter' }}
          >
            About {school.name}
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl max-w-3xl mx-auto"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Leading institution in health sciences and technology education
          </motion.p>
        </div>
      </section>

      {/* Our Journey Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-8" style={{ color: 'var(--primary)' }}>
              Our Journey
            </h2>
            <div
              className="prose prose-lg text-gray-700 space-y-4"
              style={{ fontFamily: school.fontFamily || 'Inter' }}
              dangerouslySetInnerHTML={{ __html: school.customAbout || 'We are committed to excellence in education...' }}
            />
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <LazyLoadImage
              src={school.heroImageUrl || '/images/about-preview.jpg'}
              alt="Our Campus"
              effect="blur"
              className="w-full rounded-3xl shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center bg-gray-900 text-white">
        <p style={{ fontFamily: school.fontFamily || 'Inter' }}>
          © {new Date().getFullYear()} {school.name}. All rights reserved.
        </p>
      </footer>
    </>
  );
};

export default AboutUs;