import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react';
import { getCenters, createCenter, updateCenter, deleteCenter } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const CentersTab = ({ onRefresh }) => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      const data = await getCenters();
      setCenters(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteCenter(id);
      toast.success(t('admin.deleted'));
      loadCenters();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t('admin.deleteError'));
    }
  };

  const filteredCenters = centers.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (center.address && center.address.toLowerCase().includes(searchTerm.toLowerCase()))
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
              placeholder={t('admin.searchCenters')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>{t('admin.createCenter')}</span>
        </Button>
      </div>

      {filteredCenters.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.noCenters')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCenters.map((center, index) => (
            <motion.div
              key={center.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{center.name}</h3>
                    <p className="text-gray-600 text-sm">{center.address || t('admin.noAddress')}</p>
                  </div>
                </div>
                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingCenter(center);
                      setShowModal(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{t('common.edit')}</span>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(center.id)}
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
        <CenterModal
          center={editingCenter}
          onClose={() => {
            setShowModal(false);
            setEditingCenter(null);
          }}
          onSuccess={() => {
            loadCenters();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

const CenterModal = ({ center, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: center?.name || '',
    address: center?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (center) {
        await updateCenter(center.id, formData);
        toast.success(t('admin.updated'));
      } else {
        await createCenter(formData);
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
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-4">
          {center ? t('admin.editCenter') : t('admin.createCenter')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.centerName')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.centerAddress')}</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : (center ? t('common.update') : t('common.create'))}
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

export default CentersTab;

