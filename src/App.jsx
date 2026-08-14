import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/components/Layout';
import Areas from '@/pages/Areas';
import Home from '@/pages/Home';
import { AreaProvider } from '@/lib/AreaContext';
import { I18nProvider } from '@/lib/I18nContext';
import Dashboard from '@/pages/Dashboard';
import CalendarPage from '@/pages/CalendarPage';
import TasksPage from '@/pages/TasksPage';
import CoursesPage from '@/pages/CoursesPage';
import ContactsPage from '@/pages/ContactsPage';
import PomodoroPage from '@/pages/PomodoroPage';
import TrashPage from '@/pages/TrashPage';
import ShareBoard from '@/pages/ShareBoard';
import Settings from '@/pages/Settings';
import EncouragePage from '@/pages/EncouragePage';
import { AnimatePresence } from 'framer-motion';
import SplashOverlay from '@/components/SplashOverlay';
import { applyTheme, getThemeMode } from '@/lib/theme';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/s/:token" element={<ShareBoard />} />
      <Route path="/" element={<Home />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/areas" element={<Areas />} />
        <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/encourage" element={<EncouragePage />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  useEffect(() => {
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSys = () => { if (getThemeMode() === 'system') applyTheme(); };
    mq.addEventListener('change', onSys);
    const onStorage = (e) => { if (!e.key || e.key === 'wc_theme' || e.key === 'wc_bg') applyTheme(); };
    window.addEventListener('storage', onStorage);
    return () => { mq.removeEventListener('change', onSys); window.removeEventListener('storage', onStorage); };
  }, []);

  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem('wc_splash'); } catch { return true; }
  });
  useEffect(() => {
    if (!showSplash) return;
    try { sessionStorage.setItem('wc_splash', '1'); } catch {}
    const t = setTimeout(() => setShowSplash(false), 2600);
    return () => clearTimeout(t);
  }, [showSplash]);

  return (
    <>
      <AnimatePresence>{showSplash && <SplashOverlay onClose={() => setShowSplash(false)} />}</AnimatePresence>
      <AuthProvider>
      <I18nProvider>
      <AreaProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </AreaProvider>
      </I18nProvider>
    </AuthProvider>
    </>
  )
}

export default App