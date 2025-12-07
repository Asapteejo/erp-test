// src/components/LanguageSwitcher.jsx
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="p-2 rounded border bg-white dark:bg-gray-800"
    >
      <option value="en">🇬🇧 English</option>
      <option value="fr">🇫🇷 Français</option>
      <option value="ar">🇸🇦 العربية</option>
      <option value="sw">🇰🇪 Kiswahili</option>
    </select>
  );
};

export default LanguageSwitcher;