import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { UserCog, GraduationCap, Plus, Edit, Trash2, Search, Sparkles } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, suggestUserCredentials } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const UsersTab = ({ role, onRefresh }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  const Icon = role === 'teacher' ? UserCog : GraduationCap;

  useEffect(() => {
    loadUsers();
  }, [role]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers({ role });
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await deleteUser(id);
      toast.success(t('admin.deleted'));
      loadUsers();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t('admin.deleteError'));
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
              placeholder={t('admin.searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>{t('admin.createUser')}</span>
        </Button>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.noUsers')}</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('common.name')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('common.email')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('common.username')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('admin.phone')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-gray-600">{user.username}</td>
                    <td className="py-3 px-4 text-gray-600">{user.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingUser(user);
                            setShowModal(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>{t('common.edit')}</span>
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(user.id)}
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
        <UserModal
          user={editingUser}
          role={role}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            loadUsers();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

const UserModal = ({ user, role, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    role: role,
  });
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const handleSuggestCredentials = async () => {
    if (!formData.first_name || !formData.last_name) {
      toast.error(t('admin.enterNameFirst'));
      return;
    }
    
    setSuggesting(true);
    try {
      const suggestion = await suggestUserCredentials(formData.first_name, formData.last_name);
      setFormData({
        ...formData,
        username: suggestion.suggested_username,
        password: suggestion.suggested_password
      });
      toast.success(t('admin.credentialsSuggested'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = { ...formData };
      if (user && !submitData.password) {
        delete submitData.password;
      }

      if (user) {
        await updateUser(user.id, submitData);
        toast.success(t('admin.updated'));
      } else {
        await createUser(submitData);
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
        <h2 className="text-2xl font-bold mb-4">
          {user ? t('admin.editUser') : t('admin.createUser')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.firstName')}</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.lastName')}</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {!user && (
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSuggestCredentials}
                disabled={suggesting || !formData.first_name || !formData.last_name}
                className="flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{suggesting ? t('common.loading') : t('admin.suggestCredentials')}</span>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.username')}</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.email')}</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('common.password')}</label>
            <input
              type="password"
              required={!user}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={user ? t('admin.leaveBlank') : ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.phone')} (+998 XX XXX XX XX)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                // Format phone number for Uzbekistan
                let value = e.target.value.replace(/\D/g, '');
                if (value.startsWith('998')) {
                  value = '+' + value;
                } else if (value && !value.startsWith('+998')) {
                  value = '+998' + value;
                }
                if (value.length > 13) value = value.slice(0, 13);
                setFormData({ ...formData, phone: value });
              }}
              placeholder="+998 XX XXX XX XX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : (user ? t('common.update') : t('common.create'))}
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

export default UsersTab;

