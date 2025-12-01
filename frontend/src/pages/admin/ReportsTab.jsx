import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Download } from 'lucide-react';
import { getAttendanceReport, getGradeStatistics, getClassGroups } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../../components/Card';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const ReportsTab = () => {
  const [activeReport, setActiveReport] = useState('attendance');
  const [classId, setClassId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [classes, setClasses] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [gradeData, setGradeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (activeReport === 'attendance' && classId) {
      loadAttendanceReport();
    } else if (activeReport === 'grades' && classId) {
      loadGradeReport();
    }
  }, [activeReport, classId, month]);

  const loadClasses = async () => {
    try {
      const data = await getClassGroups();
      setClasses(Array.isArray(data) ? data : []);
      if (data.length > 0 && !classId) {
        setClassId(data[0].id);
      }
    } catch (error) {
      toast.error(t('admin.loadError'));
    }
  };

  const loadAttendanceReport = async () => {
    try {
      setLoading(true);
      const params = { class_group: classId };
      if (month) {
        params.month = month;
      }
      const data = await getAttendanceReport(params);
      setAttendanceData(data);
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadGradeReport = async () => {
    try {
      setLoading(true);
      const params = { class_group: classId };
      const data = await getGradeStatistics(params);
      setGradeData(data);
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const attendanceChartData = attendanceData?.by_student?.map(student => ({
    name: student.student_name,
    present: student.present,
    absent: student.absent,
    late: student.late,
  })) || [];

  const gradeChartData = gradeData?.by_type ? Object.entries(gradeData.by_type).map(([type, data]) => ({
    name: t(`admin.gradeTypeOptions.${type}`) || type,
    average: parseFloat(data.average.toFixed(1)),
    count: data.count,
  })) : [];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <div>
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveReport('attendance')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeReport === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('admin.attendanceReport')}
        </button>
        <button
          onClick={() => setActiveReport('grades')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeReport === 'grades'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('admin.gradesReport')}
        </button>
      </div>

      <div className="mb-6 flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">{t('admin.selectClass')}</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
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
        {activeReport === 'attendance' && (
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">{t('admin.month')}</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : activeReport === 'attendance' && attendanceData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{attendanceData.summary.total}</p>
                  <p className="text-sm text-gray-600">{t('admin.totalRecords')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{attendanceData.summary.present}</p>
                  <p className="text-sm text-gray-600">{t('teacher.present')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{attendanceData.summary.absent}</p>
                  <p className="text-sm text-gray-600">{t('teacher.absent')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{attendanceData.summary.present_rate}%</p>
                  <p className="text-sm text-gray-600">{t('admin.presentRate')}</p>
                </div>
              </div>
            </Card>
          </div>

          {attendanceChartData.length > 0 && (
            <Card>
              <h3 className="text-xl font-semibold mb-4">{t('admin.attendanceByStudent')}</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#10b981" name={t('teacher.present')} />
                  <Bar dataKey="absent" fill="#ef4444" name={t('teacher.absent')} />
                  <Bar dataKey="late" fill="#f59e0b" name={t('teacher.late')} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card>
            <h3 className="text-xl font-semibold mb-4">{t('admin.studentDetails')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">{t('common.name')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('teacher.present')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('teacher.absent')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('teacher.late')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.presentRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.by_student.map((student, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{student.student_name}</td>
                      <td className="py-3 px-4">{student.present}</td>
                      <td className="py-3 px-4">{student.absent}</td>
                      <td className="py-3 px-4">{student.late}</td>
                      <td className="py-3 px-4 font-semibold">{student.present_rate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : activeReport === 'grades' && gradeData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{gradeData.total_grades}</p>
                  <p className="text-sm text-gray-600">{t('admin.totalGrades')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{gradeData.average_score.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">{t('admin.averageScore')}</p>
                </div>
              </div>
            </Card>
          </div>

          {gradeChartData.length > 0 && (
            <Card>
              <h3 className="text-xl font-semibold mb-4">{t('admin.gradesByType')}</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={gradeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#3b82f6" name={t('admin.averageScore')} />
                  <Bar dataKey="count" fill="#8b5cf6" name={t('admin.count')} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.selectClassForReport')}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportsTab;

