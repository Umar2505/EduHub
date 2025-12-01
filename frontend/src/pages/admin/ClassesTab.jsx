import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Edit, Trash2, Search, Users, Calendar } from 'lucide-react';
import {
  getClassGroups, createClassGroup, updateClassGroup, deleteClassGroup,
  getCenters, getUsers, getSchedules, createSchedule, updateSchedule, deleteSchedule
} from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const ClassesTab = ({ onRefresh }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getClassGroups();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteClassGroup(id);
      toast.success(t('admin.deleted'));
      loadClasses();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t('admin.deleteError'));
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cls.subject && cls.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cls.center_name && cls.center_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('admin.searchClasses')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>{t('admin.createClass')}</span>
        </Button>
      </div>

      {filteredClasses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.noClasses')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls, index) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{cls.name}</h3>
                  {cls.subject && (
                    <p className="text-sm text-blue-600 font-medium mb-2">{cls.subject}</p>
                  )}
                  <p className="text-gray-600 text-sm mb-2">{cls.center_name}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{cls.student_count || 0} {t('teacher.students')}</span>
                    </div>
                    {cls.room && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{cls.room}</span>
                      </div>
                    )}
                  </div>
                  {cls.teacher_name && (
                    <p className="text-sm text-gray-600 mt-2">
                      {t('admin.teacher')}: {cls.teacher_name}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingClass(cls);
                      setShowModal(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{t('common.edit')}</span>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(cls.id)}
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('common.delete')}</span>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <ClassModal
          classGroup={editingClass}
          onClose={() => {
            setShowModal(false);
            setEditingClass(null);
          }}
          onSuccess={() => {
            loadClasses();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

const ClassModal = ({ classGroup, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: classGroup?.name || '',
    subject: classGroup?.subject || '',
    center: classGroup?.center || '',
    teacher: classGroup?.teacher || '',
    room: classGroup?.room || '',
    cost: classGroup?.cost || '',
    students: classGroup?.students || [],
    scheduleTimes: {}, // { day: { enabled: bool, start_time: string, end_time: string } }
  });
  const [centers, setCenters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [existingSchedules, setExistingSchedules] = useState([]);

  useEffect(() => {
    loadData();
  }, [classGroup]);

  const loadData = async () => {
    try {
      const [centersData, teachersData, studentsData] = await Promise.all([
        getCenters(),
        getUsers({ role: 'teacher' }),
        getUsers({ role: 'student' }),
      ]);
      setCenters(Array.isArray(centersData) ? centersData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      
      // Load existing schedules if editing
      if (classGroup?.id) {
        try {
          const schedulesData = await getSchedules({ class_group: classGroup.id });
          setExistingSchedules(Array.isArray(schedulesData) ? schedulesData : []);
          
          // Initialize scheduleTimes from existing schedules
          const scheduleTimes = {};
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          days.forEach(day => {
            const daySchedule = schedulesData.find(s => s.day_of_week === day);
            if (daySchedule) {
              scheduleTimes[day] = {
                enabled: true,
                start_time: daySchedule.start_time,
                end_time: daySchedule.end_time,
              };
            } else {
              scheduleTimes[day] = {
                enabled: false,
                start_time: '09:00',
                end_time: '10:30',
              };
            }
          });
          setFormData(prev => ({ ...prev, scheduleTimes }));
        } catch (error) {
          console.error('Failed to load schedules:', error);
        }
      } else {
        // Initialize empty schedule times for new class
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const scheduleTimes = {};
        days.forEach(day => {
          scheduleTimes[day] = {
            enabled: false,
            start_time: '09:00',
            end_time: '10:30',
          };
        });
        setFormData(prev => ({ ...prev, scheduleTimes }));
      }
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        name: formData.name,
        subject: formData.subject,
        center: parseInt(formData.center),
        teacher: formData.teacher ? parseInt(formData.teacher) : null,
        room: formData.room,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        students: Array.isArray(formData.students) ? formData.students.map(s => parseInt(s)) : [],
      };

      let classId;
      if (classGroup) {
        await updateClassGroup(classGroup.id, submitData);
        classId = classGroup.id;
        toast.success(t('admin.updated'));
      } else {
        const newClass = await createClassGroup(submitData);
        classId = newClass.id;
        toast.success(t('admin.created'));
      }

      // Create/update schedules
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        const scheduleTime = formData.scheduleTimes[day];
        if (scheduleTime?.enabled) {
          const existingSchedule = existingSchedules.find(s => s.day_of_week === day);
          const scheduleData = {
            class_group: classId,
            day_of_week: day,
            start_time: scheduleTime.start_time,
            end_time: scheduleTime.end_time,
            room: formData.room || '',
          };

          if (existingSchedule) {
            await updateSchedule(existingSchedule.id, scheduleData);
          } else {
            await createSchedule(scheduleData);
          }
        } else {
          // Delete schedule if it exists but is now disabled
          const existingSchedule = existingSchedules.find(s => s.day_of_week === day);
          if (existingSchedule) {
            try {
              await deleteSchedule(existingSchedule.id);
            } catch (error) {
              console.error('Failed to delete schedule:', error);
            }
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
        <h2 className="text-2xl font-bold mb-4">
          {classGroup ? t('admin.editClass') : t('admin.createClass')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.className')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.subject')}</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.selectCenter')}</label>
              <select
                required
                value={formData.center}
                onChange={(e) => setFormData({ ...formData, center: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('admin.selectCenter')}</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.room')}</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.selectTeacher')}</label>
            <select
              value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('admin.noTeacher')}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name} ({teacher.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.cost')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.selectStudents')}</label>
            <select
              multiple
              size={5}
              value={formData.students}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, students: selected });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.username})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t('admin.holdCtrl')} {formData.students.length} {t('admin.selected')}
            </p>
          </div>

          {/* Schedule Times Section */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-3">{t('admin.classSchedule')}</label>
            <div className="space-y-3">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const scheduleTime = formData.scheduleTimes[day] || { enabled: false, start_time: '09:00', end_time: '10:30' };
                return (
                  <div key={day} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <label className="flex items-center space-x-2 cursor-pointer flex-1 min-w-[120px]">
                      <input
                        type="checkbox"
                        checked={scheduleTime.enabled}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            scheduleTimes: {
                              ...formData.scheduleTimes,
                              [day]: {
                                ...scheduleTime,
                                enabled: e.target.checked,
                              },
                            },
                          });
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="font-medium text-sm capitalize">{t(`admin.days.${day}`)}</span>
                    </label>
                    {scheduleTime.enabled && (
                      <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
                        <input
                          type="time"
                          value={scheduleTime.start_time}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              scheduleTimes: {
                                ...formData.scheduleTimes,
                                [day]: {
                                  ...scheduleTime,
                                  start_time: e.target.value,
                                },
                              },
                            });
                          }}
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          value={scheduleTime.end_time}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              scheduleTimes: {
                                ...formData.scheduleTimes,
                                [day]: {
                                  ...scheduleTime,
                                  end_time: e.target.value,
                                },
                              },
                            });
                          }}
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : (classGroup ? t('common.update') : t('common.create'))}
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

export default ClassesTab;

