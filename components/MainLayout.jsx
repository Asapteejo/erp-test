// src/components/MainLayout.jsx
import { Outlet, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from './Navbar';
import Footer from './Footer';
import QuickActions from './QuickActions';

const MainLayout = () => {
  const { schoolId } = useParams();
  const [customization, setCustomization] = useState({
    name: 'Loading...',
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    fontFamily: 'Inter',
    logoUrl: null,
    motto: '',
  });

  useEffect(() => {
    if (!schoolId) return;

    supabase
      .from('schools')
      .select('name, primaryColor, secondaryColor, fontFamily, logoUrl, motto, heroImageUrl')
      .eq('id', schoolId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCustomization(data);
          // Apply CSS variables
          document.documentElement.style.setProperty('--primary', data.primaryColor);
          document.documentElement.style.setProperty('--secondary', data.secondaryColor);
          document.documentElement.style.setProperty('--font-family', data.fontFamily || 'Inter');
        }
      });
  }, [schoolId]);

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: customization.fontFamily || 'Inter' }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:bg-primary focus:text-white p-2">
        Skip to main content
      </a>
      <header role="banner">
        <Navbar school={customization} />
      </header>
      <main id="main-content" className="flex-grow mt-16" role="main">
        <Outlet context={{ customization }} />  {/* Pass to children */}
      </main>
      <footer role="contentinfo">
        <Footer school={customization} />
      </footer>
      <QuickActions />
    </div>
  );
};

export default MainLayout;