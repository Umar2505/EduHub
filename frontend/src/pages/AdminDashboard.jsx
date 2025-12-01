import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Building2, BookOpen, UserCog, GraduationCap, Calendar,
  BarChart3, FileText, DollarSign, Award
} from 'lucide-react';
import CentersTab from './admin/CentersTab';
import ClassesTab from './admin/ClassesTab';
import UsersTab from './admin/UsersTab';
import SchedulesTab from './admin/SchedulesTab';
import GradesTab from './admin/GradesTab';
import ReportsTab from './admin/ReportsTab';
import ResourcesTab from './admin/ResourcesTab';
import BillingTab from './admin/BillingTab';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('centers');
  const { t } = useTranslation();

  const tabs = [
    { id: 'centers', icon: Building2, label: t('admin.centers') },
    { id: 'classes', icon: BookOpen, label: t('admin.classes') },
    { id: 'schedules', icon: Calendar, label: t('admin.schedules') },
    { id: 'teachers', icon: UserCog, label: t('admin.teachers') },
    { id: 'students', icon: GraduationCap, label: t('admin.students') },
    { id: 'grades', icon: Award, label: t('admin.grades') },
    { id: 'reports', icon: BarChart3, label: t('admin.reports') },
    { id: 'resources', icon: FileText, label: t('admin.resources') },
    { id: 'billing', icon: DollarSign, label: t('admin.billing') },
  ];

  const handleRefresh = () => {
    // Trigger refresh if needed
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.title')}</h1>
        <p className="text-gray-600">{t('admin.subtitle')}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'centers' && <CentersTab onRefresh={handleRefresh} />}
        {activeTab === 'classes' && <ClassesTab onRefresh={handleRefresh} />}
        {activeTab === 'schedules' && <SchedulesTab />}
        {activeTab === 'teachers' && <UsersTab role="teacher" onRefresh={handleRefresh} />}
        {activeTab === 'students' && <UsersTab role="student" onRefresh={handleRefresh} />}
        {activeTab === 'grades' && <GradesTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'billing' && <BillingTab />}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
