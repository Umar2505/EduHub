import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const login = async (username, password) => {
  const response = await api.post('/token/', { username, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/me/');
  return response.data;
};

// Centers API
export const getCenters = async () => {
  const response = await api.get('/centers/');
  return response.data.results || response.data;
};

export const createCenter = async (data) => {
  const response = await api.post('/centers/', data);
  return response.data;
};

// Classes API
export const getClassGroups = async () => {
  const response = await api.get('/class-groups/');
  return response.data.results || response.data;
};

export const getClassGroup = async (id) => {
  const response = await api.get(`/class-groups/${id}/`);
  return response.data;
};

export const getClassGroupStudents = async (id) => {
  const response = await api.get(`/class-groups/${id}/students/`);
  return response.data;
};

export const getBillingSummary = async () => {
  const response = await api.get('/class-groups/billing_summary/');
  return response.data;
};

export const createClassGroup = async (data) => {
  const response = await api.post('/class-groups/', data);
  return response.data;
};

// Attendance API
export const getAttendances = async (params = {}) => {
  const response = await api.get('/attendances/', { params });
  return response.data.results || response.data;
};

export const getMyAttendance = async () => {
  const response = await api.get('/attendances/my_attendance/');
  return response.data;
};

export const bulkCreateAttendance = async (data) => {
  const response = await api.post('/attendances/bulk_create/', data);
  return response.data;
};

// Users API
export const getUsers = async (params = {}) => {
  const response = await api.get('/users/', { params });
  return response.data.results || response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/users/', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.patch(`/users/${id}/`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}/`);
  return response.data;
};

export const suggestUserCredentials = async (first_name, last_name) => {
  const response = await api.post('/users/suggest_credentials/', {
    first_name,
    last_name
  });
  return response.data;
};

// Centers API
export const updateCenter = async (id, data) => {
  const response = await api.patch(`/centers/${id}/`, data);
  return response.data;
};

export const deleteCenter = async (id) => {
  const response = await api.delete(`/centers/${id}/`);
  return response.data;
};

// Class Groups API
export const updateClassGroup = async (id, data) => {
  const response = await api.patch(`/class-groups/${id}/`, data);
  return response.data;
};

export const deleteClassGroup = async (id) => {
  const response = await api.delete(`/class-groups/${id}/`);
  return response.data;
};

// Schedules API
export const getSchedules = async (params = {}) => {
  const response = await api.get('/schedules/', { params });
  return response.data.results || response.data;
};

export const createSchedule = async (data) => {
  const response = await api.post('/schedules/', data);
  return response.data;
};

export const updateSchedule = async (id, data) => {
  const response = await api.patch(`/schedules/${id}/`, data);
  return response.data;
};

export const deleteSchedule = async (id) => {
  const response = await api.delete(`/schedules/${id}/`);
  return response.data;
};

export const getWeeklySchedule = async () => {
  const response = await api.get('/schedules/weekly/');
  return response.data;
};

// Grades API
export const getGrades = async (params = {}) => {
  const response = await api.get('/grades/', { params });
  return response.data.results || response.data;
};

export const createGrade = async (data) => {
  const response = await api.post('/grades/', data);
  return response.data;
};

export const updateGrade = async (id, data) => {
  const response = await api.patch(`/grades/${id}/`, data);
  return response.data;
};

export const deleteGrade = async (id) => {
  const response = await api.delete(`/grades/${id}/`);
  return response.data;
};

export const getGradeStatistics = async (params = {}) => {
  const response = await api.get('/grades/statistics/', { params });
  return response.data;
};

// Attendance Reports API
export const getAttendanceReport = async (params = {}) => {
  const response = await api.get('/attendances/report/', { params });
  return response.data;
};

// Resources API
export const getResources = async (params = {}) => {
  const response = await api.get('/resources/', { params });
  return response.data.results || response.data;
};

export const createResource = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  const response = await api.post('/resources/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await api.delete(`/resources/${id}/`);
  return response.data;
};

// Invoices API
export const getInvoices = async (params = {}) => {
  const response = await api.get('/invoices/', { params });
  return response.data.results || response.data;
};

export const createInvoice = async (data) => {
  const response = await api.post('/invoices/', data);
  return response.data;
};

export const updateInvoice = async (id, data) => {
  const response = await api.patch(`/invoices/${id}/`, data);
  return response.data;
};

export const markInvoicePaid = async (id) => {
  const response = await api.post(`/invoices/${id}/mark_paid/`);
  return response.data;
};

// Payments API
export const getPayments = async (params = {}) => {
  const response = await api.get('/payments/', { params });
  return response.data.results || response.data;
};

export const createPayment = async (data) => {
  const response = await api.post('/payments/', data);
  return response.data;
};

// Announcements API
export const getAnnouncements = async (params = {}) => {
  const response = await api.get('/announcements/', { params });
  return response.data.results || response.data;
};

export const createAnnouncement = async (data) => {
  const response = await api.post('/announcements/', data);
  return response.data;
};

export const updateAnnouncement = async (id, data) => {
  const response = await api.patch(`/announcements/${id}/`, data);
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  const response = await api.delete(`/announcements/${id}/`);
  return response.data;
};

// Homework API
export const getHomeworks = async (params = {}) => {
  const response = await api.get('/homeworks/', { params });
  return response.data.results || response.data;
};

export const createHomework = async (data) => {
  const config = {};
  if (data instanceof FormData) {
    // Don't set Content-Type for FormData - let browser set it with boundary
    config.headers = {};
  } else {
    config.headers = { 'Content-Type': 'application/json' };
  }
  const response = await api.post('/homeworks/', data, config);
  return response.data;
};

export const updateHomework = async (id, data) => {
  const config = {};
  if (data instanceof FormData) {
    // Don't set Content-Type for FormData - let browser set it with boundary
    config.headers = {};
  } else {
    config.headers = { 'Content-Type': 'application/json' };
  }
  const response = await api.patch(`/homeworks/${id}/`, data, config);
  return response.data;
};

export const deleteHomework = async (id) => {
  const response = await api.delete(`/homeworks/${id}/`);
  return response.data;
};

export const getHomeworkSubmissions = async (params = {}) => {
  const response = await api.get('/homework-submissions/', { params });
  return response.data.results || response.data;
};

export const createHomeworkSubmission = async (data) => {
  const config = {};
  if (data instanceof FormData) {
    // Don't set Content-Type for FormData - let browser set it with boundary
    config.headers = {};
  } else {
    config.headers = { 'Content-Type': 'application/json' };
  }
  const response = await api.post('/homework-submissions/', data, config);
  return response.data;
};

export const updateHomeworkSubmission = async (id, data) => {
  const config = {};
  if (data instanceof FormData) {
    // Don't set Content-Type for FormData - let browser set it with boundary
    config.headers = {};
  } else {
    config.headers = { 'Content-Type': 'application/json' };
  }
  const response = await api.patch(`/homework-submissions/${id}/`, data, config);
  return response.data;
};

export const markHomeworkCompleted = async (id) => {
  const response = await api.post(`/homework-submissions/${id}/mark_completed/`);
  return response.data;
};

// Payment Gateway API (Click/Payme)
export const createPaymentRequest = async (classGroupId, amount, paymentMethod) => {
  const response = await api.post('/invoices/create_payment/', {
    class_group: classGroupId,
    amount: amount,
    payment_method: paymentMethod
  });
  return response.data;
};

