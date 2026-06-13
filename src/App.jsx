import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Recordings from './pages/Recordings';
import Duplicates from './pages/Duplicates';
import Upload from './pages/Upload';
import TranscriptView from './pages/TranscriptView';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import { useAuthStore } from './store/useAuthStore';

// Protective Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected workspace routes */}
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="recordings" element={<Recordings />} />
          <Route path="duplicates" element={<Duplicates />} />
          <Route path="upload" element={<Upload />} />
          <Route path="transcripts/:recordingId" element={<TranscriptView />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
