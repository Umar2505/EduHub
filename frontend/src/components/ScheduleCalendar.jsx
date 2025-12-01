import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getSchedules, getClassGroups } from '../utils/api';
import Card from './Card';
import toast from 'react-hot-toast';

const ScheduleCalendar = ({ 
  userRole = 'student', 
  onClassClick = null, 
  readOnly = false,
  classFilter = null // If provided, only show schedules for this class
}) => {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classFilter || '');
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  useEffect(() => {
    // Always load schedules - backend filters by user role automatically
    // If classFilter or selectedClass is provided, filter by that class
    // For teachers and students, load immediately without waiting for class selection
    if (userRole === 'teacher' || userRole === 'student') {
      // Load immediately for teachers/students
      loadSchedules();
    } else if (selectedClass || classFilter) {
      // For admins, only load if class is selected
      loadSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, classFilter, userRole]);
  
  // Initial load for teachers/students
  useEffect(() => {
    if (userRole === 'teacher' || userRole === 'student') {
      loadSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClasses = async () => {
    // Only load classes for admins (they need to select a class)
    // Teachers and students don't need class selection - backend filters automatically
    const requiresClassSelection = !userRole || userRole === 'admin';
    if (!requiresClassSelection) {
      setClasses([]);
      return;
    }
    
    try {
      const data = await getClassGroups();
      setClasses(Array.isArray(data) ? data : []);
      // Only auto-select first class if we're in admin mode
      if (data.length > 0 && !selectedClass && !classFilter) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error(t('admin.loadError'));
    }
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const classId = classFilter || selectedClass;
      
      // For teachers and students, load all their schedules (backend filters by role)
      // For admins, filter by selected class if provided
      const params = {};
      if (classId && userRole !== 'teacher' && userRole !== 'student') {
        // Only filter by class for admins
        params.class_group = classId;
      }
      
      const data = await getSchedules(params);
      const schedulesArray = Array.isArray(data) ? data : (data?.results || []);
      setSchedules(schedulesArray);
      console.log(`[ScheduleCalendar] Loaded ${schedulesArray.length} schedules for ${userRole}:`, schedulesArray);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error(t('admin.loadError'));
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // For teachers and students, don't require class selection - show all schedules
  // For admins, require class selection
  const requiresClassSelection = !userRole || userRole === 'admin';
  
  // Show loading state
  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-gray-600">{t('common.loading')}</div>
        </div>
      </Card>
    );
  }

  // If admin mode and no classes, show message
  if (requiresClassSelection && !classFilter && classes.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.noClasses')}</p>
        </div>
      </Card>
    );
  }
  
  // For teachers/students, show message if no schedules found
  if (!requiresClassSelection && schedules.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.noSchedules') || 'No schedules found. Please contact your administrator to set up class schedules.'}</p>
        </div>
      </Card>
    );
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
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

  const handleClassClick = (schedule, date) => {
    if (onClassClick && !readOnly) {
      onClassClick(schedule, date);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Class selector (only for admins or if not filtered) */}
      {requiresClassSelection && !classFilter && classes.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">{t('admin.selectClass')}</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('admin.allClasses') || 'All Classes'}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* For teachers/students, show schedules even without class selection */}
      {requiresClassSelection && !selectedClass && !classFilter ? (
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
                        className={`min-h-[80px] p-2 border rounded-lg transition-colors ${
                          date
                            ? date.toDateString() === new Date().toDateString()
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                            : 'bg-gray-50 border-transparent'
                        } ${date ? 'cursor-pointer' : ''}`}
                      >
                        {date && (
                          <>
                            <div className="font-medium text-gray-900 mb-1 text-sm">
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {daySchedules.slice(0, 2).map((schedule) => (
                                <div
                                  key={schedule.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClassClick(schedule, date);
                                  }}
                                  className={`text-xs p-1 rounded ${
                                    readOnly || !onClassClick
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{schedule.start_time} - {schedule.end_time}</span>
                                  </div>
                                  <div className="font-medium truncate">{schedule.class_group_name || schedule.class_group}</div>
                                </div>
                              ))}
                              {daySchedules.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{daySchedules.length - 2} more
                                </div>
                              )}
                            </div>
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
                <div className="grid grid-cols-8 gap-2">
                  <div className="font-semibold text-gray-600 py-2 text-sm">Time</div>
                  {getWeekDays(currentDate).map((day) => (
                    <div key={day.toISOString()} className="text-center font-semibold text-gray-600 py-2 text-sm border-b">
                      <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-xs text-gray-500">{day.getDate()}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  <div className="text-sm text-gray-500 py-2">All Day</div>
                  {getWeekDays(currentDate).map((day) => {
                    const daySchedules = getSchedulesForDate(day);
                    return (
                      <div key={day.toISOString()} className="min-h-[200px] border rounded-lg p-2">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            onClick={() => handleClassClick(schedule, day)}
                            className={`mb-2 p-2 rounded text-xs ${
                              readOnly || !onClassClick
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center space-x-1 mb-1">
                              <Clock className="w-3 h-3" />
                              <span>{schedule.start_time} - {schedule.end_time}</span>
                            </div>
                            <div className="font-medium">{schedule.class_group_name || schedule.class_group}</div>
                            {schedule.room && (
                              <div className="text-gray-600 text-xs mt-1">Room: {schedule.room}</div>
                            )}
                          </div>
                        ))}
                        {daySchedules.length === 0 && (
                          <div className="text-center text-gray-400 text-xs py-4">
                            {t('admin.noClassesToday')}
                          </div>
                        )}
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
                  <div className="text-center py-12 text-gray-500">
                    {t('admin.noClassesToday')}
                  </div>
                ) : (
                  getSchedulesForDate(currentDate).map((schedule) => (
                    <div
                      key={schedule.id}
                      onClick={() => handleClassClick(schedule, currentDate)}
                      className={`p-4 border rounded-lg ${
                        readOnly || !onClassClick
                          ? 'bg-white border-gray-200'
                          : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-lg">
                              {schedule.start_time} - {schedule.end_time}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {schedule.class_group_name || schedule.class_group}
                          </h3>
                          {schedule.room && (
                            <p className="text-gray-600">Room: {schedule.room}</p>
                          )}
                        </div>
                        {!readOnly && onClassClick && (
                          <div className="text-blue-600 text-sm font-medium">
                            {t('teacher.markAttendance') || 'Mark Attendance'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ScheduleCalendar;

