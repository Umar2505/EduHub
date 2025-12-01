import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // This component is only rendered when user is authenticated (via PrivateRoute)
  // So we can safely access user.role
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  } else if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  } else if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  return <div>Loading...</div>;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        
        {user ? (
          <div className="flex">
            <Sidebar userRole={user.role} />
            <div className="flex-1 flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

