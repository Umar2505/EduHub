import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, Plus, Edit, Trash2, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, getClassGroups } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const SchedulesTab = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const { t } = useTranslation();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSchedules();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getClassGroups();
      setClasses(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error(t('admin.loadError'));
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await getSchedules({ class_group: selectedClass });
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteSchedule(id);
      toast.success(t('admin.deleted'));
      loadSchedules();
    } catch (error) {
      toast.error(t('admin.deleteError'));
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getWeekDays = (date) => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getSchedulesForDate = (date) => {
    if (!date) return [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    return schedules.filter(s => s.day_of_week === dayName);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = (date) => {
    const weekDays = getWeekDays(date);
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const formatDay = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleDateClick = (date) => {
    if (date) {
      setCurrentDate(date);
      setViewMode('day');
    }
  };

  // Don't show loading if we're just waiting for classes to load initially
  // Only show loading when we have a selected class and are loading schedules
  if (loading && !selectedClass && classes.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-gray-600">{t('common.loading')}</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">{t('admin.selectClass')}</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
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
        {selectedClass && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-700'
                }`}
              >
                {t('admin.month')}
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-700'
                }`}
              >
                {t('admin.week')}
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-gray-700'
                }`}
              >
                {t('admin.day')}
              </button>
            </div>
            <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{t('admin.addSchedule')}</span>
            </Button>
          </div>
        )}
      </div>

      {classes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{t('admin.noClasses')}</p>
            <p className="text-sm text-gray-500">{t('admin.createClassFirst')}</p>
          </div>
        </Card>
      ) : !selectedClass ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.selectClassFirst')}</p>
          </div>
        </Card>
      ) : (
        <Card>
          {/* Navigation */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (viewMode === 'month') navigateMonth(-1);
                  else if (viewMode === 'week') navigateWeek(-1);
                  else navigateDay(-1);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (viewMode === 'month') navigateMonth(1);
                  else if (viewMode === 'week') navigateWeek(1);
                  else navigateDay(1);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold ml-2">
                {viewMode === 'month' && formatMonthYear(currentDate)}
                {viewMode === 'week' && formatWeekRange(currentDate)}
                {viewMode === 'day' && formatDay(currentDate)}
              </h2>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {t('admin.today')}
            </button>
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((date, index) => {
                    const daySchedules = date ? getSchedulesForDate(date) : [];
                    return (
                      <div
                        key={index}
                        onClick={() => handleDateClick(date)}
                        className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition-colors ${
                          date
                            ? date.toDateString() === new Date().toDateString()
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                            : 'bg-gray-50 border-transparent'
                        }`}
                      >
                        {date && (
                          <>
                            <div className="font-medium text-gray-900 mb-1 text-sm">
                              {date.getDate()}
                            </div>
                            {daySchedules.length > 0 && (
                              <div className="space-y-1">
                                {daySchedules.slice(0, 2).map((schedule) => (
                                  <div
                                    key={schedule.id}
                                    className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate"
                                  >
                                    {schedule.start_time}
                                  </div>
                                ))}
                                {daySchedules.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{daySchedules.length - 2} more
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-7 gap-2">
                  {getWeekDays(currentDate).map((date, index) => {
                    const daySchedules = getSchedulesForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={index}
                        onClick={() => handleDateClick(date)}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-gray-900 mb-2">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {date.getDate()}
                        </div>
                        <div className="space-y-2">
                          {daySchedules.length === 0 ? (
                            <p className="text-xs text-gray-400">{t('admin.noClassesToday')}</p>
                          ) : (
                            daySchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="text-xs bg-blue-100 text-blue-800 rounded p-2"
                              >
                                <div className="font-medium">{schedule.start_time} - {schedule.end_time}</div>
                                {schedule.room && (
                                  <div className="text-blue-600 mt-1">{schedule.room}</div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <div>
              <div className="space-y-3">
                {getSchedulesForDate(currentDate).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">{t('admin.noSchedules')}</p>
                  </div>
                ) : (
                  getSchedulesForDate(currentDate)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Clock className="w-5 h-5 text-blue-600" />
                              <span className="font-semibold text-gray-900">
                                {schedule.start_time} - {schedule.end_time}
                              </span>
                            </div>
                            {schedule.room && (
                              <p className="text-sm text-gray-600 mb-2">{t('admin.room')}: {schedule.room}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              {t(`admin.days.${schedule.day_of_week}`)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingSchedule(schedule);
                                setShowModal(true);
                              }}
                              className="p-2"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDelete(schedule.id)}
                              className="p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {showModal && selectedClass && (
        <ScheduleModal
          schedule={editingSchedule}
          classId={selectedClass}
          onClose={() => {
            setShowModal(false);
            setEditingSchedule(null);
          }}
          onSuccess={() => {
            loadSchedules();
          }}
        />
      )}
    </div>
  );
};

const ScheduleModal = ({ schedule, classId, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    class_group: classId,
    day_of_week: schedule?.day_of_week || 'monday',
    start_time: schedule?.start_time || '09:00',
    end_time: schedule?.end_time || '10:30',
    room: schedule?.room || '',
  });
  const [loading, setLoading] = useState(false);

  const days = [
    { value: 'monday', label: t('admin.days.monday') },
    { value: 'tuesday', label: t('admin.days.tuesday') },
    { value: 'wednesday', label: t('admin.days.wednesday') },
    { value: 'thursday', label: t('admin.days.thursday') },
    { value: 'friday', label: t('admin.days.friday') },
    { value: 'saturday', label: t('admin.days.saturday') },
    { value: 'sunday', label: t('admin.days.sunday') },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        class_group: parseInt(classId),
      };

      if (schedule) {
        await updateSchedule(schedule.id, submitData);
        toast.success(t('admin.updated'));
      } else {
        await createSchedule(submitData);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {schedule ? t('admin.editSchedule') : t('admin.addSchedule')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.day')}</label>
            <select
              required
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {days.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.startTime')}</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.endTime')}</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : (schedule ? t('common.update') : t('common.create'))}
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

export default SchedulesTab;
