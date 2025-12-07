// src/components/Footer.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Footer = ({ school }) => {
  const { t } = useTranslation();
  if (!school) return null;

  return (
    <motion.footer
      className="bg-gradient-to-t from-gray-900 to-gray-800 text-gray-300 py-16"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* About */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">{school.name}</h3>
          <p className="text-sm leading-relaxed">
            {school.footerAbout || 'Your school description will appear here.'}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
            <li><Link to="/academics" className="hover:text-white transition">Academics</Link></li>
            <li><Link to="/apply" className="hover:text-white transition">Admissions</Link></li>
            <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-lg font-bold text-white mb-4">Contact Info</h4>
          <ul className="space-y-3 text-sm">
            {school.footerEmail && (
              <li className="flex items-center gap-2">
                ✉️ <a href={`mailto:${school.footerEmail}`} className="hover:text-white transition">{school.footerEmail}</a>
              </li>
            )}
            {school.footerPhone && (
              <li className="flex items-center gap-2">
                📞 <a href={`tel:${school.footerPhone}`} className="hover:text-white transition">{school.footerPhone}</a>
              </li>
            )}
            {school.footerAddress && (
              <li className="flex items-center gap-2">
                📍 {school.footerAddress}
              </li>
            )}
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="text-lg font-bold text-white mb-4">Follow Us</h4>
          <div className="flex gap-4">
            {school.footerFacebook && <a href={school.footerFacebook} target="_blank" rel="noreferrer" className="text-2xl hover:text-white transition">Facebook</a>}
            {school.footerTwitter && <a href={school.footerTwitter} target="_blank" rel="noreferrer" className="text-2xl hover:text-white transition">Twitter</a>}
            {school.footerInstagram && <a href={school.footerInstagram} target="_blank" rel="noreferrer" className="text-2xl hover:text-white transition">Instagram</a>}
            {school.footerLinkedIn && <a href={school.footerLinkedIn} target="_blank" rel="noreferrer" className="text-2xl hover:text-white transition">LinkedIn</a>}
          </div>
        </div>
      </div>

      <div className="text-center text-sm mt-12 pt-8 border-t border-gray-700">
        © {new Date().getFullYear()} {school.name}. All rights reserved.
        {/* Optional: Remove "Powered by" on Premium */}
        {school.subscriptionTier !== 'premium' && (
          <span className="ml-2 opacity-70">
            Powered by <a href="https://teebotacadion.com" className="underline hover:text-white">TeeBot Acadion</a>
          </span>
        )}
      </div>
    </motion.footer>
  );
};

export default Footer;