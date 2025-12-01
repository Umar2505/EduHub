import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'uz', label: 'UZ' },
    { code: 'ru', label: 'RU' },
  ];

  if (!user) return null;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600">EduHub</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    i18n.language === lang.code
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                title={t('common.logout')}
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">{t('common.logout')}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

