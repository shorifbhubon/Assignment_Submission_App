import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ResetPassword } from './components/auth/ResetPassword';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';

function AuthScreen() {
  const [screen, setScreen] = useState<'login' | 'register' | 'reset'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      {screen === 'login' && (
        <Login
          onSwitchToRegister={() => setScreen('register')}
          onSwitchToReset={() => setScreen('reset')}
        />
      )}
      {screen === 'register' && (
        <Register onSwitchToLogin={() => setScreen('login')} />
      )}
      {screen === 'reset' && (
        <ResetPassword onSwitchToLogin={() => setScreen('login')} />
      )}
    </div>
  );
}

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>
        {profile.role === 'teacher' ? (
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        ) : (
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
// trigger redeploy