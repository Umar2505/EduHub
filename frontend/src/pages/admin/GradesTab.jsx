import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Award, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { getGrades, createGrade, updateGrade, deleteGrade, getClassGroups, getUsers } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const GradesTab = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadGrades();
  }, [classFilter]);

  const loadClasses = async () => {
    try {
      const data = await getClassGroups();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('admin.loadError'));
    }
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      const params = {};
      if (classFilter) {
        params.class_group = classFilter;
      }
      const data = await getGrades(params);
      setGrades(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteGrade(id);
      toast.success(t('admin.deleted'));
      loadGrades();
    } catch (error) {
      toast.error(t('admin.deleteError'));
    }
  };

  const filteredGrades = grades.filter(grade =>
    grade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (grade.student_name && grade.student_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
              placeholder={t('admin.searchGrades')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('admin.allClasses')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{t('admin.addGrade')}</span>
          </Button>
        </div>
      </div>

      {filteredGrades.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.noGrades')}</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.student')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.class')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.title')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.gradeType')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.score')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.date')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((grade) => (
                  <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{grade.student_name}</td>
                    <td className="py-3 px-4 text-gray-600">{grade.class_group_name}</td>
                    <td className="py-3 px-4 font-medium">{grade.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                        {grade.grade_type_display || grade.grade_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">
                        {grade.score}/{grade.max_score} ({grade.percentage.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(grade.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingGrade(grade);
                            setShowModal(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>{t('common.edit')}</span>
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(grade.id)}
                          className="flex items-center space-x-1 px-3 py-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{t('common.delete')}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <GradeModal
          grade={editingGrade}
          onClose={() => {
            setShowModal(false);
            setEditingGrade(null);
          }}
          onSuccess={() => {
            loadGrades();
          }}
        />
      )}
    </div>
  );
};

const GradeModal = ({ grade, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    student: grade?.student || '',
    class_group: grade?.class_group || '',
    grade_type: grade?.grade_type || 'homework',
    title: grade?.title || '',
    score: grade?.score || '',
    max_score: grade?.max_score || 100,
    date: grade?.date || new Date().toISOString().split('T')[0],
    notes: grade?.notes || '',
  });
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        getUsers({ role: 'student' }),
        getClassGroups(),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
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
        ...formData,
        student: parseInt(formData.student),
        class_group: parseInt(formData.class_group),
        score: parseFloat(formData.score),
        max_score: parseFloat(formData.max_score),
      };

      if (grade) {
        await updateGrade(grade.id, submitData);
        toast.success(t('admin.updated'));
      } else {
        await createGrade(submitData);
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

  const gradeTypes = [
      { value: 'homework', label: t('admin.gradeTypeOptions.homework') },
    { value: 'quiz', label: t('admin.gradeTypeOptions.quiz') },
    { value: 'midterm', label: t('admin.gradeTypeOptions.midterm') },
    { value: 'final', label: t('admin.gradeTypeOptions.final') },
    { value: 'project', label: t('admin.gradeTypeOptions.project') },
    { value: 'participation', label: t('admin.gradeTypeOptions.participation') },
    { value: 'other', label: t('admin.gradeTypeOptions.other') },
  ];

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
          {grade ? t('admin.editGrade') : t('admin.addGrade')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.selectStudent')}</label>
              <select
                required
                value={formData.student}
                onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('admin.selectStudent')}</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.username})
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">{t('admin.gradeType')}</label>
              <select
                required
                value={formData.grade_type}
                onChange={(e) => setFormData({ ...formData, grade_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {gradeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.score')}</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.maxScore')}</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.date')}</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : (grade ? t('common.update') : t('common.create'))}
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

export default GradesTab;

