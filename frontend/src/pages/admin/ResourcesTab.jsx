import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, Download, Link as LinkIcon, Search } from 'lucide-react';
import { getResources, createResource, deleteResource, getClassGroups } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const ResourcesTab = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadResources();
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

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await getResources({ class_group: selectedClass });
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteResource(id);
      toast.success(t('admin.deleted'));
      loadResources();
    } catch (error) {
      toast.error(t('admin.deleteError'));
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Don't show loading if we're just waiting for classes to load initially
  // Only show loading when we have a selected class and are loading resources
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
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
          <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{t('admin.uploadResource')}</span>
          </Button>
        )}
      </div>

      {classes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{t('admin.noClasses')}</p>
            <p className="text-sm text-gray-500">{t('admin.createClassFirst')}</p>
          </div>
        </Card>
      ) : !selectedClass ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.selectClassFirst')}</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.searchResources')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-gray-600">{t('common.loading')}</div>
              </div>
            </Card>
          ) : filteredResources.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('admin.noResources')}</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {t('admin.uploadedBy')} {resource.uploaded_by_name}
                      </p>
                    </div>
                    <div className="flex space-x-2 pt-4 border-t border-gray-200">
                      {resource.file_url && (
                        <Button
                          variant="secondary"
                          onClick={() => window.open(resource.file_url, '_blank')}
                          className="flex-1 flex items-center justify-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>{t('admin.download')}</span>
                        </Button>
                      )}
                      {resource.url && (
                        <Button
                          variant="secondary"
                          onClick={() => window.open(resource.url, '_blank')}
                          className="flex-1 flex items-center justify-center space-x-1"
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>{t('admin.openLink')}</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && selectedClass && (
        <ResourceModal
          classId={selectedClass}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            loadResources();
          }}
        />
      )}
    </div>
  );
};

const ResourceModal = ({ classId, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    class_group: classId,
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
        class_group: parseInt(classId),
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

export default ResourcesTab;

