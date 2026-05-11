import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard';
import TeachersList     from './pages/admin/TeachersList';
import Lessons          from './pages/admin/Lessons';
import Schedule         from './pages/admin/Schedule';
import QRCheckinData    from './pages/admin/QRCheckinData';
import VideoReviewList  from './pages/admin/VideoReviewList';
import Notifications    from './pages/admin/Notifications';
import Settings         from './pages/admin/Settings';

import Subjects         from './pages/admin/Subjects';
import Classes          from './pages/admin/Classes';

// Teacher pages
import TeacherDashboard  from './pages/teacher/TeacherDashboard';
import TeacherSchedule   from './pages/teacher/TeacherSchedule';
import TeacherStats      from './pages/teacher/TeacherStats';
import Notifications2    from './pages/admin/Notifications'; // teacher ham shu componentni ishlatadi

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* ── Admin Routes ── */}
        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route index            element={<AdminDashboard />} />
          <Route path="teachers"      element={<TeachersList />} />
          <Route path="subjects"      element={<Subjects />} />
          <Route path="classes"       element={<Classes />} />
          <Route path="lessons"       element={<Lessons />} />
          <Route path="schedule"      element={<Schedule />} />
          <Route path="qr-checkin"    element={<QRCheckinData />} />
          <Route path="video-review"  element={<VideoReviewList />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings"      element={<Settings />} />
        </Route>

        {/* ── Teacher Routes ── */}
        <Route path="/teacher" element={<DashboardLayout role="teacher" />}>
          <Route index                element={<TeacherDashboard />} />
          <Route path="schedule"      element={<TeacherSchedule />} />
          <Route path="qr-scan"       element={<TeacherDashboard />} />
          <Route path="stats"         element={<TeacherStats />} />
          <Route path="notifications" element={<Notifications2 />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
