import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar,
  GraduationCap,
  Building2,
  UserCog
} from 'lucide-react';

const Sidebar = ({ userRole }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const teacherMenu = [
    { path: '/', icon: LayoutDashboard, label: t('teacher.myClasses') },
  ];

  const adminMenu = [
    { path: '/', icon: LayoutDashboard, label: t('admin.title') },
  ];

  const studentMenu = [
    { path: '/', icon: LayoutDashboard, label: t('student.title') },
  ];

  const menuItems = userRole === 'admin' ? adminMenu : 
                   userRole === 'teacher' ? teacherMenu : 
                   studentMenu;

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <nav className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

