// C:\Users\HP\Desktop\azmah-frontend\src\components\Navbar.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { motion, useScroll, useTransform } from 'framer-motion';
import ReactGA from 'react-ga4';

const Navbar = () => {
  const { user, logout } = useClerkAuth(); 
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const height = useTransform(scrollY, [0, 100], [64, 48]);
  const fontSize = useTransform(scrollY, [0, 100], ['1rem', '0.875rem']);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      ReactGA.event({ category: 'Search', action: 'Submit', label: searchQuery });
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logout(); // Call logout from useAuth
    setActiveMenu(null);
    setIsOpen(false);
    ReactGA.event({ category: 'Auth', action: 'Logout', label: user?.name || 'User' });
  };

  const menuItems = [
    { name: 'About', path: '/about' },
    { name: 'Academics', path: '/academics' },
    { name: 'Admissions', path: '/apply' },
    { name: 'Events', path: '/events' },
    { name: 'News', path: '/news' },
    { name: 'Testimonials', path: '/testimonials' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <motion.nav
      className="bg-nav-bg text-nav-text fixed top-0 w-full z-50 shadow-lg"
      style={{ height }}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center space-x-2">
              <img src="/images/logo.png" alt="Azmah College" className="h-10 w-auto" />
              <motion.span style={{ fontSize }} className="text-2xl font-bold text-nav-text">
                Azmah College
              </motion.span>
            </NavLink>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-base font-bold focus:outline-none focus:ring-2 focus:ring-nav-hover ${
                    isActive ? 'bg-nav-hover text-white' : 'text-nav-text hover:bg-nav-hover hover:text-white'
                  } transition`
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                onClick={() => ReactGA.event({ category: 'Navigation', action: 'Click', label: item.name })}
              >
                {item.name}
              </NavLink>
            ))}
            <NavLink
              to="/apply"
              className="gradient-btn px-6 py-3 font-semibold text-lg text-white"
              aria-label="Apply to Azmah College"
              onClick={() => ReactGA.event({ category: 'CTA', action: 'Click', label: 'Navbar Apply Now' })}
            >
              Apply Now
            </NavLink>
            {user && (
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === 'user' ? null : 'user')}
                  className="px-4 py-2 rounded-md text-base font-bold hover:bg-nav-hover focus:outline-none focus:ring-2 focus:ring-nav-hover"
                  aria-label="User menu"
                >
                  <i className="fas fa-user-circle mr-2"></i> {user.name}
                </button>
                {activeMenu === 'user' && (
                  <motion.div
                    className="absolute top-full right-0 mt-2 w-48 bg-nav-bg rounded-md shadow-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    role="menu"
                    aria-labelledby="user-menu"
                  >
                    <NavLink
                      to={`/${user.role.toLowerCase()}-portal`}
                      className="block px-4 py-2 text-sm text-nav-text hover:bg-nav-hover focus:outline-none focus:ring-2 focus:ring-nav-hover"
                      role="menuitem"
                      onClick={() => ReactGA.event({ category: 'Navigation', action: 'Click', label: 'User Dashboard' })}
                    >
                      Dashboard
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-nav-text hover:bg-nav-hover focus:outline-none focus:ring-2 focus:ring-nav-hover"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            )}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="glass pl-10 pr-4 py-2 rounded-full text-sm text-text focus:outline-none focus:ring-2 focus:ring-nav-hover"
                aria-label="Search the site"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nav-text"
                aria-label="Submit search"
              >
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-nav-text hover:bg-nav-hover focus:outline-none focus:ring-2 focus:ring-nav-hover"
              aria-label="Toggle menu"
            >
              <i className={isOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <motion.div
          className="md:hidden bg-nav-bg"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <form onSubmit={handleSearch} className="mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="glass w-full px-4 py-2 rounded-md text-sm text-text focus:outline-none focus:ring-2 focus:ring-nav-hover"
                aria-label="Search the site"
              />
            </form>
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-md text-base font-bold focus:outline-none focus:ring-2 focus:ring-nav-hover ${
                    isActive ? 'bg-nav-hover text-white' : 'text-nav-text hover:bg-nav-hover hover:text-white'
                  } transition`
                }
                onClick={() => {
                  setIsOpen(false);
                  ReactGA.event({ category: 'Navigation', action: 'Click', label: item.name });
                }}
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                {item.name}
              </NavLink>
            ))}
            <NavLink
              to="/apply"
              className="block px-4 py-2 rounded-md text-base font-bold text-nav-text gradient-btn"
              onClick={() => {
                setIsOpen(false);
                ReactGA.event({ category: 'CTA', action: 'Click', label: 'Mobile Navbar Apply Now' });
              }}
            >
              Apply Now
            </NavLink>
            {user && (
              <>
                <NavLink
                  to={`/${user.role.toLowerCase()}-portal`}
                  className="block px-4 py-2 rounded-md text-base font-bold text-nav-text hover:bg-nav-hover focus:outline-none focus:ring-2 focus:ring-nav-hover"
                  onClick={() => {
                    setIsOpen(false);
                    ReactGA.event({ category: 'Navigation', action: 'Click', label: 'User Dashboard' });
                  }}
                >
                  Dashboard
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 rounded-md text-base font-bold text-nav-text hover:bg-nav-hover focus:outline-none focus:ring-2 focus:ring-nav-hover"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
