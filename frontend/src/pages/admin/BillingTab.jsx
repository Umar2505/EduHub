import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Edit, CheckCircle, Search, Filter } from 'lucide-react';
import { getInvoices, createInvoice, updateInvoice, markInvoicePaid, getUsers, getCenters, getBillingSummary } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const BillingTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [billingSummary, setBillingSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeView, setActiveView] = useState('summary'); // 'summary' or 'invoices'
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, [statusFilter, activeView]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeView === 'summary') {
        const summaryData = await getBillingSummary();
        setBillingSummary(Array.isArray(summaryData) ? summaryData : []);
      } else {
        const params = {};
        if (statusFilter) {
          params.status = statusFilter;
        }
        const data = await getInvoices(params);
        setInvoices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast.error(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markInvoicePaid(id);
      toast.success(t('admin.invoiceMarkedPaid'));
      loadData();
    } catch (error) {
      toast.error(t('admin.error'));
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.student_name && invoice.student_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  const filteredSummary = billingSummary.filter(item =>
    item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('summary')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('admin.billingSummary')}
          </button>
          <button
            onClick={() => setActiveView('invoices')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'invoices'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('admin.invoices')}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeView === 'summary' ? t('admin.searchStudents') : t('admin.searchInvoices')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {activeView === 'invoices' && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('admin.allStatuses')}</option>
                <option value="draft">{t('admin.draft')}</option>
                <option value="sent">{t('admin.sent')}</option>
                <option value="paid">{t('admin.paid')}</option>
                <option value="overdue">{t('admin.overdue')}</option>
              </select>
              <Button onClick={() => setShowModal(true)} className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>{t('admin.createInvoice')}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {activeView === 'summary' && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">{t('admin.studentBilling')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.student')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('common.email')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.classesCount')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.totalCost')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.totalPaid')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.totalOwed')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummary.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      {t('admin.noStudents')}
                    </td>
                  </tr>
                ) : (
                  filteredSummary.map((item) => (
                    <tr key={item.student_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.student_name}</td>
                      <td className="py-3 px-4 text-gray-600">{item.email || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{item.classes_count}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.total_cost.toLocaleString('uz-UZ')} {t('admin.currency')}
                      </td>
                      <td className="py-3 px-4 text-green-600 font-medium">
                        {item.total_paid.toLocaleString('uz-UZ')} {t('admin.currency')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${
                          item.total_owed > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.total_owed.toLocaleString('uz-UZ')} {t('admin.currency')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeView === 'invoices' && (
        filteredInvoices.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('admin.noInvoices')}</p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.invoiceNumber')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.student')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.amount')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.dueDate')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.status')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                      <td className="py-3 px-4">{invoice.student_name}</td>
                      <td className="py-3 px-4 font-semibold">{parseFloat(invoice.amount).toLocaleString('uz-UZ')} {t('admin.currency')}</td>
                      <td className="py-3 px-4">{new Date(invoice.due_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status_display || invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {invoice.status !== 'paid' && (
                            <Button
                              variant="success"
                              onClick={() => handleMarkPaid(invoice.id)}
                              className="flex items-center space-x-1 px-3 py-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>{t('admin.markPaid')}</span>
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingInvoice(invoice);
                              setShowModal(true);
                            }}
                            className="flex items-center space-x-1 px-3 py-1"
                          >
                            <Edit className="w-4 h-4" />
                            <span>{t('common.edit')}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {showModal && (
        <InvoiceModal
          invoice={editingInvoice}
          onClose={() => {
            setShowModal(false);
            setEditingInvoice(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};

const InvoiceModal = ({ invoice, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    student: invoice?.student || '',
    center: invoice?.center || '',
    amount: invoice?.amount || '',
    due_date: invoice?.due_date || new Date().toISOString().split('T')[0],
    description: invoice?.description || '',
    status: invoice?.status || 'draft',
  });
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, centersData] = await Promise.all([
        getUsers({ role: 'student' }),
        getCenters(),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setCenters(Array.isArray(centersData) ? centersData : []);
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
        center: parseInt(formData.center),
        amount: parseFloat(formData.amount),
      };

      if (invoice) {
        await updateInvoice(invoice.id, submitData);
        toast.success(t('admin.updated'));
      } else {
        await createInvoice(submitData);
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
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-4">
          {invoice ? t('admin.editInvoice') : t('admin.createInvoice')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.selectStudent')}</label>
            <select
              required
              value={formData.student}
              onChange={(e) => setFormData({ ...formData, student: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={students.length === 0}
            >
              <option value="">{students.length === 0 ? t('admin.noStudentsAvailable') : t('admin.selectStudent')}</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name || ''} {student.last_name || ''} ({student.username})
                </option>
              ))}
            </select>
            {students.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">{t('admin.createStudentsFirst')}</p>
            )}
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.amount')}</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.dueDate')}</label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.status')}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">{t('admin.draft')}</option>
              <option value="sent">{t('admin.sent')}</option>
              <option value="paid">{t('admin.paid')}</option>
              <option value="overdue">{t('admin.overdue')}</option>
            </select>
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

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : (invoice ? t('common.update') : t('common.create'))}
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

export default BillingTab;

