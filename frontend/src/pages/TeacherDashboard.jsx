import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getClassGroups, getHomeworks, getHomeworkSubmissions, createHomework, updateHomework, deleteHomework, updateHomeworkSubmission, getResources, createResource, deleteResource, getClassGroupStudents, bulkCreateAttendance, getGrades, getAnnouncements, getAttendanceReport } from '../utils/api';
import { BookOpen, Users, Calendar, GraduationCap, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, FileText, Search, Download, Link as LinkIcon, TrendingUp, Award, Bell } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import ScheduleCalendar from '../components/ScheduleCalendar';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [resources, setResources] = useState([]);
  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, homeworksData, resourcesData, gradesData, announcementsData] = await Promise.all([
        getClassGroups().catch(() => []),
        getHomeworks().catch(() => []),
        getResources().catch(() => []),
        getGrades().catch(() => []),
        getAnnouncements().catch(() => [])
      ]);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setHomeworks(Array.isArray(homeworksData) ? homeworksData : []);
      setResources(Array.isArray(resourcesData) ? resourcesData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      
      // Load statistics if classes exist
      if (classesData.length > 0) {
        try {
          const statsData = await getAttendanceReport({ class_group: classesData[0].id });
          setStats(statsData);
        } catch (err) {
          console.error('Failed to load stats:', err);
        }
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: t('teacher.overview'), icon: TrendingUp },
    { id: 'classes', label: t('teacher.myClasses'), icon: BookOpen },
    { id: 'schedule', label: t('teacher.schedule'), icon: Calendar },
    { id: 'homework', label: t('teacher.homework'), icon: GraduationCap },
    { id: 'grades', label: t('teacher.grades'), icon: Award },
    { id: 'materials', label: t('teacher.materials'), icon: FileText },
    { id: 'announcements', label: t('teacher.announcements'), icon: Bell },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">{t('common.loading')}</div>
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('teacher.title')}</h1>
        <p className="text-gray-600">{t('teacher.dashboard')}</p>
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
        {activeTab === 'overview' && <OverviewTab classes={classes} homeworks={homeworks} grades={grades} stats={stats} t={t} />}
        {activeTab === 'classes' && <ClassesTab classes={classes} t={t} />}
        {activeTab === 'schedule' && <ScheduleTab classes={classes} t={t} />}
        {activeTab === 'homework' && <HomeworkTab homeworks={homeworks} classes={classes} onRefresh={loadData} t={t} />}
        {activeTab === 'grades' && <GradesTab grades={grades} classes={classes} onRefresh={loadData} t={t} />}
        {activeTab === 'materials' && <MaterialsTab resources={resources} classes={classes} onRefresh={loadData} t={t} />}
        {activeTab === 'announcements' && <AnnouncementsTab announcements={announcements} onRefresh={loadData} t={t} />}
      </motion.div>
    </div>
  );
};

const ClassesTab = ({ classes, t }) => {
  if (classes.length === 0) {
    return (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">{t('teacher.noClasses')}</p>
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
          <Card className="h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-500">{cls.center_name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      {cls.student_count || 0} {t('teacher.totalStudents')}
                    </span>
                  </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                {t('teacher.viewSchedule') || 'View schedule tab to mark attendance'}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

const HomeworkTab = ({ homeworks, classes, onRefresh, t }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');

  const filteredHomeworks = selectedClass
    ? homeworks.filter(h => h.class_group === parseInt(selectedClass))
    : homeworks;

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteHomework(id);
      toast.success(t('admin.deleted'));
      onRefresh();
    } catch (error) {
      toast.error(t('admin.deleteError'));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        {classes.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>{t('teacher.createHomework')}</span>
        </Button>
      </div>

      {filteredHomeworks.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('teacher.noHomework')}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHomeworks.map((homework, index) => (
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
                        {t('teacher.dueDate')}: {new Date(homework.due_date).toLocaleDateString()}
                      </span>
                      <span>
                        {homework.completed_count || 0} / {homework.submission_count || 0} {t('teacher.completed')}
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
                          <span>{t('teacher.downloadAttachment')}</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingHomework(homework);
                        setShowModal(true);
                      }}
                      className="p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(homework.id)}
                      className="p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                  <button
                  onClick={() => {
                    setEditingHomework(homework);
                    setShowModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {t('teacher.viewSubmissions')}
                </button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <HomeworkModal
          homework={editingHomework}
          classes={classes}
          onClose={() => {
            setShowModal(false);
            setEditingHomework(null);
          }}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

const HomeworkModal = ({ homework, classes, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    class_group: homework?.class_group || '',
    title: homework?.title || '',
    description: homework?.description || '',
    due_date: homework?.due_date || new Date().toISOString().split('T')[0],
    max_points: homework?.max_points || 100,
    file: null,
  });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(homework ? 'view' : 'create');

  useEffect(() => {
    if (homework && viewMode === 'view') {
      loadSubmissions();
    }
  }, [homework, viewMode]);

  const loadSubmissions = async () => {
    try {
      const data = await getHomeworkSubmissions({ homework: homework.id });
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('class_group', formData.class_group);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('due_date', formData.due_date);
      submitData.append('max_points', formData.max_points);
      if (formData.file) {
        submitData.append('file', formData.file);
      }

      if (homework) {
        await updateHomework(homework.id, submitData);
        toast.success(t('admin.updated'));
      } else {
        await createHomework(submitData);
        toast.success(t('admin.created'));
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (submissionId, isCompleted) => {
    try {
      await updateHomeworkSubmission(submissionId, { is_completed: isCompleted });
      loadSubmissions();
      toast.success(t('admin.updated'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleGradeSubmission = async (submissionId, score) => {
    try {
      await updateHomeworkSubmission(submissionId, { score: parseFloat(score) || null });
      loadSubmissions();
      toast.success(t('teacher.gradeUpdated') || 'Grade updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    }
  };

  if (viewMode === 'view' && homework) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{homework.title}</h2>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => setViewMode('edit')}>
                {t('common.edit')}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">{homework.description}</p>
            {homework.file_url && (
              <div className="mb-4">
                <a
                  href={homework.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('teacher.downloadAttachment')}</span>
                </a>
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>{t('teacher.dueDate')}: {new Date(homework.due_date).toLocaleDateString()}</span>
              <span>{homework.class_group_name}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('teacher.submissions')}</h3>
            {submissions.length === 0 ? (
              <p className="text-gray-500">{t('teacher.noSubmissions')}</p>
            ) : (
              <div className="space-y-2">
                {submissions.map((submission) => (
                  <div key={submission.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{submission.student_name}</p>
                        {submission.notes && (
                          <p className="text-sm text-gray-600 mt-1">{submission.notes}</p>
                        )}
                        {submission.file_url && (
                          <a
                            href={submission.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1 mt-1"
                          >
                            <Download className="w-4 h-4" />
                            <span>{t('teacher.downloadSubmission')}</span>
                          </a>
                        )}
                        {submission.submitted_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t('teacher.submittedAt') || 'Submitted'}: {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.is_completed ? (
                          <span className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span>{t('teacher.completed')}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMarkCompleted(submission.id, true)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            {t('teacher.markCompleted')}
                          </button>
                        )}
                      </div>
                    </div>
                    {submission.is_completed && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('teacher.grade') || 'Grade'} (/{homework.max_points || 100})
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max={homework.max_points || 100}
                                step="0.01"
                                value={submission.score || ''}
                                onChange={(e) => {
                                  const newScore = e.target.value === '' ? null : e.target.value;
                                  handleGradeSubmission(submission.id, newScore);
                                }}
                                placeholder={t('teacher.enterGrade') || 'Enter grade'}
                                className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                              {submission.score !== null && submission.score !== undefined && homework.max_points && (
                                <span className="text-sm text-gray-600">
                                  ({((parseFloat(submission.score) / parseFloat(homework.max_points)) * 100).toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-4">
          {homework ? t('teacher.editHomework') : t('teacher.createHomework')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.selectClass')}</label>
            <select
              required
              value={formData.class_group}
              onChange={(e) => setFormData({ ...formData, class_group: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('admin.selectClass')}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.title')}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.dueDate')}</label>
            <input
              type="date"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.maxPoints') || 'Max Points'}</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={formData.max_points}
              onChange={(e) => setFormData({ ...formData, max_points: parseFloat(e.target.value) || 100 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.attachment')}</label>
            <input
              type="file"
              onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              accept=".pdf,.doc,.docx,.txt,.zip,.rar"
            />
            {homework?.file_url && (
              <div className="mt-2">
                <a
                  href={homework.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('teacher.downloadAttachment')}</span>
                </a>
              </div>
            )}
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : (homework ? t('common.update') : t('common.create'))}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const MaterialsTab = ({ resources, classes, onRefresh, t }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResources = resources.filter(resource => {
    const matchesClass = !selectedClass || resource.class_group === parseInt(selectedClass);
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesClass && matchesSearch;
  });

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteResource(id);
      toast.success(t('admin.deleted'));
      onRefresh();
    } catch (error) {
      toast.error(t('admin.deleteError'));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex-1 min-w-[200px]">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('admin.allClasses')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder={t('admin.searchResources')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{t('admin.uploadResource')}</span>
          </Button>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('teacher.noMaterials')}</p>
          </div>
        </Card>
      ) : (
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
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-600" />
                      )}
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                        {resource.resource_type_display || resource.resource_type}
                      </span>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(resource.id)}
                      className="p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t('admin.download')}</span>
                    </button>
                  )}
                  {resource.url && (
                    <button
                      onClick={() => window.open(resource.url, '_blank')}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>{t('admin.openLink')}</span>
                  </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <ResourceModal
          classes={classes}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

const ResourceModal = ({ classes, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    class_group: '',
    title: '',
    description: '',
    resource_type: 'pdf',
    file: null,
    url: '',
  });
  const [loading, setLoading] = useState(false);

  const resourceTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'video', label: t('admin.video') },
    { value: 'link', label: t('admin.link') },
    { value: 'document', label: t('admin.document') },
    { value: 'image', label: t('admin.image') },
    { value: 'other', label: t('admin.other') },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        class_group: parseInt(formData.class_group),
      };

      if (formData.resource_type === 'link' && !formData.url) {
        toast.error(t('admin.urlRequired'));
        setLoading(false);
        return;
      }

      if (formData.resource_type !== 'link' && !formData.file) {
        toast.error(t('admin.fileRequired'));
        setLoading(false);
        return;
      }

      await createResource(submitData);
      toast.success(t('admin.created'));
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-4">{t('admin.uploadResource')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.selectClass')}</label>
            <select
              required
              value={formData.class_group}
              onChange={(e) => setFormData({ ...formData, class_group: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('admin.selectClass')}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.title')}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.resourceType')}</label>
            <select
              required
              value={formData.resource_type}
              onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {resourceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {formData.resource_type === 'link' ? (
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.url')}</label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.file')}</label>
              <input
                type="file"
                required
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                accept={
                  formData.resource_type === 'image' ? 'image/*' :
                  formData.resource_type === 'video' ? 'video/*' :
                  formData.resource_type === 'pdf' ? '.pdf' :
                  '*'
                }
              />
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : t('admin.upload')}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ScheduleTab = ({ classes, t }) => {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleClassClick = (schedule, date) => {
    setSelectedSchedule(schedule);
    setSelectedDate(date);
    setShowAttendanceModal(true);
  };

  return (
    <>
      <ScheduleCalendar
        userRole="teacher"
        onClassClick={handleClassClick}
        readOnly={false}
      />
      {showAttendanceModal && (
        <AttendanceModal
          schedule={selectedSchedule}
          date={selectedDate}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedSchedule(null);
            setSelectedDate(null);
          }}
          t={t}
        />
      )}
    </>
  );
};

const AttendanceModal = ({ schedule, date, onClose, t }) => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classGroup, setClassGroup] = useState(null);

  useEffect(() => {
    if (schedule) {
      loadClassData();
    }
  }, [schedule]);

  useEffect(() => {
    if (students.length > 0) {
      const initialAttendance = {};
      students.forEach((student) => {
        initialAttendance[student.id] = 'absent';
      });
      setAttendance(initialAttendance);
    }
  }, [students]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const classId = schedule.class_group || schedule.class_group_id;
      if (!classId) {
        toast.error('Class ID not found');
        return;
      }

      const [classData, studentsData] = await Promise.all([
        getClassGroups().then(classes => classes.find(c => c.id === classId)),
        getClassGroupStudents(classId),
      ]);
      setClassGroup(classData);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (error) {
      toast.error('Failed to load class data');
      console.error('Failed to load class data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSave = async () => {
    if (!schedule) {
      toast.error(t('teacher.selectClass'));
      return;
    }

    setSaving(true);
    try {
      const classId = schedule.class_group || schedule.class_group_id;
      const attendances = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status,
      }));

      await bulkCreateAttendance({
        class_group: parseInt(classId),
        date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        attendances,
      });

      toast.success(t('teacher.attendanceSaved'));
      onClose();
    } catch (error) {
      toast.error(t('teacher.attendanceError'));
      console.error('Failed to save attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5" />;
      case 'absent':
        return <XCircle className="w-5 h-5" />;
      case 'late':
        return <Clock className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status, isSelected) => {
    if (!isSelected) return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    
    switch (status) {
      case 'present':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'absent':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'late':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-4">{t('teacher.markAttendance')}</h2>
        
        {classGroup && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold">{classGroup.name}</p>
            <p className="text-sm text-gray-600">
              {date ? date.toLocaleDateString() : new Date().toLocaleDateString()} - {schedule.start_time} - {schedule.end_time}
            </p>
          </div>
        )}

        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => {
                students.forEach((student) => {
                  handleStatusChange(student.id, 'present');
                });
              }}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm font-medium"
            >
              {t('teacher.markAllPresent') || 'Mark All Present'}
            </button>
            <button
              onClick={() => {
                students.forEach((student) => {
                  handleStatusChange(student.id, 'absent');
                });
              }}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 text-sm font-medium"
            >
              {t('teacher.markAllAbsent') || 'Mark All Absent'}
            </button>
            <button
              onClick={() => {
                students.forEach((student) => {
                  handleStatusChange(student.id, 'late');
                });
              }}
              className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm font-medium"
            >
              {t('teacher.markAllLate') || 'Mark All Late'}
            </button>
          </div>

          <div className="space-y-2">
            {students.map((student) => {
              const status = attendance[student.id] || 'absent';
              return (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-gray-500">{student.username}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {['present', 'absent', 'late'].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(student.id, s)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${getStatusColor(s, status === s)}`}
                      >
                        {getStatusIcon(s)}
                        <span>{t(`teacher.${s}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex space-x-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? t('common.loading') : t('teacher.saveAttendance')}
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const OverviewTab = ({ classes, homeworks, grades, stats, t }) => {
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
  const pendingHomeworks = homeworks.filter(hw => {
    // Count homeworks that have submissions but not all are completed
    return true; // Simplified for now
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{t('teacher.totalClasses') || 'Total Classes'}</p>
            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
          </div>
          <BookOpen className="w-12 h-12 text-blue-500" />
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{t('teacher.totalStudents') || 'Total Students'}</p>
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          </div>
          <Users className="w-12 h-12 text-green-500" />
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{t('teacher.totalHomeworks') || 'Total Homeworks'}</p>
            <p className="text-2xl font-bold text-gray-900">{homeworks.length}</p>
          </div>
          <GraduationCap className="w-12 h-12 text-purple-500" />
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{t('teacher.totalGrades') || 'Total Grades'}</p>
            <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
          </div>
          <Award className="w-12 h-12 text-yellow-500" />
        </div>
      </Card>
    </div>
  );
};

const GradesTab = ({ grades, classes, onRefresh, t }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGrades = grades.filter((grade) => {
    const matchesClass = !selectedClass || grade.class_group === parseInt(selectedClass);
    const matchesSearch = grade.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.class_group_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  if (grades.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('teacher.noGrades') || 'No grades available'}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('teacher.filterByClass') || 'Filter by Class'}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('teacher.allClasses') || 'All Classes'}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.search') || 'Search'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('teacher.searchGrades') || 'Search grades...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Grades List */}
      <div className="space-y-4">
        {filteredGrades.map((grade) => (
          <Card key={grade.id}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{grade.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {grade.class_group_name || `Class ${grade.class_group}`}
                </p>
                {grade.comment && (
                  <p className="text-gray-700 mt-2">{grade.comment}</p>
                )}
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-blue-600">
                  {grade.score}/{grade.max_score}
                </div>
                <div className="text-sm text-gray-500">
                  {grade.percentage ? `${grade.percentage}%` : `${((grade.score / grade.max_score) * 100).toFixed(1)}%`}
                </div>
              </div>
            </div>
            {grade.student_name && (
              <div className="mt-2 text-sm text-gray-600">
                {t('teacher.student') || 'Student'}: {grade.student_name}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

const AnnouncementsTab = ({ announcements, onRefresh, t }) => {
  const sortedAnnouncements = [...announcements].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  if (announcements.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('teacher.noAnnouncements') || 'No announcements available'}</p>
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

export default TeacherDashboard;
