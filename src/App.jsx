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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
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
