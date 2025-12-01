import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  getMyAttendance, getClassGroups, getResources, getHomeworks, 
  getHomeworkSubmissions, markHomeworkCompleted, createPaymentRequest,
  createHomeworkSubmission, updateHomeworkSubmission, getGrades, getAnnouncements
} from '../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  CheckCircle, XCircle, Clock, Calendar, BookOpen, FileText, 
  GraduationCap, DollarSign, Download, Link as LinkIcon, Award, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import ScheduleCalendar from '../components/ScheduleCalendar';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('classes');
  const [attendances, setAttendances] = useState([]);
  const [classes, setClasses] = useState([]);
  const [resources, setResources] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [attendanceData, classesData, resourcesData, homeworksData, submissionsData] = await Promise.all([
        getMyAttendance().catch((err) => {
          console.error('Failed to load attendance:', err);
          return [];
        }),
        getClassGroups().catch((err) => {
          console.error('Failed to load classes:', err);
          return [];
        }),
        getResources().catch((err) => {
          console.error('Failed to load resources:', err);
          return [];
        }),
        getHomeworks().catch((err) => {
          console.error('Failed to load homeworks:', err);
          return [];
        }),
        getHomeworkSubmissions().catch((err) => {
          console.error('Failed to load submissions:', err);
          return [];
        })
      ]);
      
      setAttendances(Array.isArray(attendanceData) ? attendanceData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setResources(Array.isArray(resourcesData) ? resourcesData : []);
      setHomeworks(Array.isArray(homeworksData) ? homeworksData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'classes', label: t('student.myClasses'), icon: BookOpen },
    { id: 'schedule', label: t('student.schedule'), icon: Calendar },
    { id: 'materials', label: t('student.materials'), icon: FileText },
    { id: 'homework', label: t('student.homework'), icon: GraduationCap },
    { id: 'grades', label: t('student.grades'), icon: GraduationCap },
    { id: 'announcements', label: t('student.announcements'), icon: FileText },
    { id: 'attendance', label: t('student.attendance'), icon: Clock },
    { id: 'payment', label: t('student.payment'), icon: DollarSign },
  ];

  const calculateStats = () => {
    const total = attendances.length;
    if (total === 0) return { present: 0, absent: 0, late: 0, presentPercent: 0 };

    const present = attendances.filter((a) => a.status === 'present').length;
    const absent = attendances.filter((a) => a.status === 'absent').length;
    const late = attendances.filter((a) => a.status === 'late').length;
    const presentPercent = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, late, presentPercent, total };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMarkCompleted = async (submissionId) => {
    try {
      await markHomeworkCompleted(submissionId);
      loadAllData();
    } catch (error) {
      console.error('Failed to mark as completed:', error);
    }
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadAllData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('common.retry')}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('student.title')}</h1>
        <p className="text-gray-600">{t('student.dashboard')}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
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
        {activeTab === 'classes' && <ClassesTab classes={classes} />}
        {activeTab === 'schedule' && <ScheduleCalendar userRole="student" readOnly={true} />}
        {activeTab === 'materials' && <MaterialsTab resources={resources} classes={classes} />}
        {activeTab === 'homework' && <HomeworkTab homeworks={homeworks} submissions={submissions} onMarkCompleted={handleMarkCompleted} />}
        {activeTab === 'attendance' && <AttendanceTab attendances={attendances} stats={stats} getStatusColor={getStatusColor} t={t} />}
        {activeTab === 'payment' && <PaymentTab classes={classes} t={t} />}
      </motion.div>
    </div>
  );
};

const ClassesTab = ({ classes }) => {
  const { t } = useTranslation();

  if (classes.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('student.noClasses')}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {classes.map((cls, index) => (
        <motion.div
          key={cls.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.center_name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {cls.subject && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('admin.subject')}:</span> {cls.subject}
                </p>
              )}
              {cls.room && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('admin.room')}:</span> {cls.room}
                </p>
              )}
              {cls.cost && parseFloat(cls.cost) > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    {parseFloat(cls.cost).toLocaleString('uz-UZ')} {t('admin.currency')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

const MaterialsTab = ({ resources, classes }) => {
  const { t } = useTranslation();
  const [selectedClass, setSelectedClass] = useState('');

  const filteredResources = selectedClass
    ? resources.filter(r => r.class_group === parseInt(selectedClass))
    : resources;

  if (resources.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('student.noMaterials')}</p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {classes.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('admin.allClasses')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredResources.map((resource, index) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {resource.resource_type === 'link' ? (
                      <LinkIcon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                      {resource.resource_type_display || resource.resource_type}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                {resource.description && (
                  <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                )}
                <p className="text-xs text-gray-500">{resource.class_group_name}</p>
              </div>
              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                {resource.file_url && (
                  <button
                    onClick={() => window.open(resource.file_url, '_blank')}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">{t('admin.download')}</span>
                  </button>
                )}
                {resource.url && (
                  <button
                    onClick={() => window.open(resource.url, '_blank')}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="text-sm">{t('admin.openLink')}</span>
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const HomeworkTab = ({ homeworks, submissions, onMarkCompleted }) => {
  const { t } = useTranslation();
  const [submittingHomework, setSubmittingHomework] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const getSubmissionForHomework = (homeworkId) => {
    return submissions.find(s => s.homework === homeworkId);
  };

  const handleSubmitHomework = async (homeworkId, submissionId) => {
    if (!submissionFile && !submissionNotes.trim()) {
      toast.error(t('student.uploadFileOrNotes'));
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('homework', homeworkId);
      submitData.append('is_completed', 'true');
      if (submissionFile) {
        submitData.append('file', submissionFile);
      }
      if (submissionNotes.trim()) {
        submitData.append('notes', submissionNotes);
      }

      if (submissionId) {
        await updateHomeworkSubmission(submissionId, submitData);
      } else {
        await createHomeworkSubmission(submitData);
      }
      
      toast.success(t('student.homeworkSubmitted'));
      setSubmittingHomework(null);
      setSubmissionFile(null);
      setSubmissionNotes('');
      // Reload data
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (homeworks.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('student.noHomework')}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {homeworks.map((homework, index) => {
        const submission = getSubmissionForHomework(homework.id);
        const isOverdue = new Date(homework.due_date) < new Date() && !submission?.is_completed;

        return (
          <motion.div
            key={homework.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{homework.title}</h3>
                  {homework.description && (
                    <p className="text-sm text-gray-600 mb-2">{homework.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span>{homework.class_group_name}</span>
                    <span>
                      {t('student.dueDate')}: {new Date(homework.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  {homework.file_url && (
                    <div className="mt-2">
                      <a
                        href={homework.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t('student.downloadAttachment')}</span>
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {submission?.is_completed ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {t('student.completed')}
                    </span>
                  ) : isOverdue ? (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {t('student.overdue')}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {t('student.pending')}
                    </span>
                  )}
                </div>
              </div>
              
              {submission?.is_completed && submission?.file_url && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">{t('student.submittedFile')}:</p>
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('student.downloadSubmission')}</span>
                  </a>
                </div>
              )}

              {submission?.is_completed && submission?.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">{t('student.notes')}:</p>
                  <p className="text-sm text-gray-600">{submission.notes}</p>
                </div>
              )}

              {!submission?.is_completed && (
                <div className="space-y-4">
                  {submittingHomework === homework.id ? (
                    <div className="p-4 border border-gray-300 rounded-lg space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('student.uploadFile')}</label>
                        <input
                          type="file"
                          onChange={(e) => setSubmissionFile(e.target.files[0])}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('student.notes')}</label>
                        <textarea
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={t('student.notesPlaceholder')}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSubmitHomework(homework.id, submission?.id)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                          {loading ? t('common.loading') : t('student.submitHomework')}
                        </button>
                        <button
                          onClick={() => {
                            setSubmittingHomework(null);
                            setSubmissionFile(null);
                            setSubmissionNotes('');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSubmittingHomework(homework.id)}
                      className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('student.submitHomework')}
                    </button>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

const AttendanceTab = ({ attendances, stats, getStatusColor, t }) => {
  const pieData = [
    { name: t('teacher.present'), value: stats.present, color: '#10b981' },
    { name: t('teacher.absent'), value: stats.absent, color: '#ef4444' },
    { name: t('teacher.late'), value: stats.late, color: '#f59e0b' },
  ];

  const classData = attendances.reduce((acc, att) => {
    const className = att.class_group_name || 'Unknown';
    if (!acc[className]) {
      acc[className] = { present: 0, absent: 0, late: 0 };
    }
    acc[className][att.status]++;
    return acc;
  }, {});

  const barData = Object.entries(classData).map(([name, data]) => ({
    name,
    [t('teacher.present')]: data.present,
    [t('teacher.absent')]: data.absent,
    [t('teacher.late')]: data.late,
  }));

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.presentPercent}%</p>
              <p className="text-sm text-gray-600">{t('student.presentPercentage')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              <p className="text-sm text-gray-600">{t('student.absentCount')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
              <p className="text-sm text-gray-600">{t('student.lateCount')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="text-xl font-semibold mb-4">{t('student.attendanceSummary')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold mb-4">{t('student.attendanceSummaryByClass') || `${t('student.attendanceSummary')} by Class`}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={t('teacher.present')} fill="#10b981" />
              <Bar dataKey={t('teacher.absent')} fill="#ef4444" />
              <Bar dataKey={t('teacher.late')} fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Attendance Timeline */}
      <Card>
        <h3 className="text-xl font-semibold mb-4">{t('student.myAttendance')}</h3>
        {attendances.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('student.noAttendance')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendances.slice(0, 10).map((attendance, index) => (
              <motion.div
                key={attendance.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(attendance.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">{attendance.class_group_name}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    attendance.status
                  )}`}
                >
                  {t(`teacher.${attendance.status}`)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const PaymentTab = ({ classes, t }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate total owed
  const totalOwed = classes.reduce((sum, cls) => {
    return sum + (parseFloat(cls.cost) || 0);
  }, 0);

  const selectedClassData = classes.find(c => c.id === parseInt(selectedClass));

  const handlePayment = async () => {
    if (!selectedClass || !paymentMethod) {
      toast.error(t('student.selectPaymentMethod'));
      return;
    }

    if (!selectedClassData) {
      toast.error(t('admin.selectClassFirst'));
      return;
    }

    setLoading(true);
    try {
      const paymentResult = await createPaymentRequest(
        selectedClass,
        selectedClassData.cost,
        paymentMethod
      );
      
      if (paymentResult.payment_url) {
        // Redirect to payment gateway
        window.open(paymentResult.payment_url, '_blank');
        toast.success(t('student.paymentRedirect'));
      } else {
        toast.error(t('student.paymentError'));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('student.paymentError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold mb-4">{t('student.monthlyTuition')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.selectClass')}</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('admin.selectClass')}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {parseFloat(cls.cost || 0).toLocaleString('uz-UZ')} {t('admin.currency')}
                </option>
              ))}
            </select>
          </div>

          {selectedClassData && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{t('admin.amount')}:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {parseFloat(selectedClassData.cost || 0).toLocaleString('uz-UZ')} {t('admin.currency')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('student.paymentMethods')}</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('click')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === 'click'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">{t('student.click')}</div>
                      <div className="text-sm text-gray-600">+998 XX XXX XX XX</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('payme')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === 'payme'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-1">{t('student.payme')}</div>
                      <div className="text-sm text-gray-600">+998 XX XXX XX XX</div>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading || !paymentMethod}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? t('common.loading') : t('student.payNow')}
              </button>
            </>
          )}

          {!selectedClass && (
            <div className="text-center py-8 text-gray-500">
              {t('admin.selectClassFirst')}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">{t('student.totalOwed')}</h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t('admin.totalCost')}:</span>
            <span className="text-2xl font-bold text-gray-900">
              {totalOwed.toLocaleString('uz-UZ')} {t('admin.currency')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

const GradesTab = ({ grades, classes, t }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGrades = grades.filter((grade) => {
    const matchesClass = !selectedClass || grade.class_group === parseInt(selectedClass);
    const matchesSearch = grade.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.class_group_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const calculateAverage = () => {
    if (filteredGrades.length === 0) return 0;
    const total = filteredGrades.reduce((sum, grade) => {
      const percentage = grade.percentage || (grade.score / grade.max_score) * 100;
      return sum + percentage;
    }, 0);
    return (total / filteredGrades.length).toFixed(1);
  };

  if (grades.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('student.noGrades') || 'No grades available'}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{filteredGrades.length}</div>
            <div className="text-sm text-gray-600">{t('student.totalGrades') || 'Total Grades'}</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{calculateAverage()}%</div>
            <div className="text-sm text-gray-600">{t('student.averageScore') || 'Average Score'}</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {filteredGrades.filter(g => (g.percentage || (g.score / g.max_score) * 100) >= 80).length}
            </div>
            <div className="text-sm text-gray-600">{t('student.excellentGrades') || 'Excellent (80%+)'}</div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {classes.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('admin.allClasses') || 'All Classes'}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('admin.search') || 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Grades List */}
        <div className="space-y-3">
          {filteredGrades.map((grade) => {
            const percentage = grade.percentage || (grade.score / grade.max_score) * 100;
            const gradeColor = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
            
            return (
              <div key={grade.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{grade.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{grade.class_group_name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-600">
                        {t('student.gradeType')}: {grade.grade_type_display || grade.grade_type}
                      </span>
                      <span className="text-gray-600">
                        {t('student.date')}: {new Date(grade.date).toLocaleDateString()}
                      </span>
                    </div>
                    {grade.notes && (
                      <p className="text-sm text-gray-500 mt-2">{grade.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${gradeColor}`}>
                      {grade.score} / {grade.max_score}
                    </div>
                    <div className={`text-sm font-medium ${gradeColor}`}>
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const AnnouncementsTab = ({ announcements, t }) => {
  const sortedAnnouncements = [...announcements].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  if (announcements.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('student.noAnnouncements') || 'No announcements available'}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedAnnouncements.map((announcement) => (
        <Card key={announcement.id}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{announcement.title}</h3>
            <span className="text-sm text-gray-500">
              {new Date(announcement.created_at).toLocaleDateString()}
            </span>
          </div>
          {announcement.content && (
            <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
          )}
          {announcement.target_class && (
            <div className="mt-2">
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {announcement.target_class_name || announcement.target_class}
              </span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default StudentDashboard;
