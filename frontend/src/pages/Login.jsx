import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogIn, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      toast.success(t('auth.loginButton'));
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'uz', label: "O'zbek" },
    { code: 'ru', label: 'Русский' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full -ml-12 -mb-12 opacity-50"></div>

          <div className="relative z-10">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4"
              >
                <BookOpen className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('auth.loginTitle')}
              </h1>
              <p className="text-gray-600">{t('auth.loginSubtitle')}</p>
            </div>

            {/* Language Selector */}
            <div className="flex justify-center mb-6 space-x-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    i18n.language === lang.code
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.username')}
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t('common.username')}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t('common.password')}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>{loading ? t('common.loading') : t('auth.loginButton')}</span>
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

// Card component for Login page
const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-xl p-8 ${className}`}>
      {children}
    </div>
  );
};

export default Login;

