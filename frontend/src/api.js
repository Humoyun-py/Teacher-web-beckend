// ─── Avtomatik URL aniqlash ───────────────────────────────────────────────────
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000/api/v1' 
  : 'https://teacher-web-beckend.onrender.com/api/v1';

// ─── Mock Data for IT Support Backdoor ──────────────────────────────────────
const MOCK_DATA = {
  '/analytics/admin-dashboard/': {
    total_teachers: 15, active_teachers_count: 12, attendance_today: { present: 10, absent: 3, late: 2 },
    lessons_today: { total: 45, completed: 32, missed: 3 }, videos_today: { sent: 28, pending: 4 }
  },
  '/auth/profile/': { id: 999, username: 'it_support_admin', first_name: 'IT Support', last_name: 'Super Admin', role: 'it_support', is_superuser: true },
  '/notifications/unread_count/': { unread_count: 5 },
  '/notifications/mark_as_read/': { success: true, message: 'All read' },
  '/notifications/': { results: [{ id: 1, title: 'Tizim Yangilandi', message: 'Hamma funksiyalar tiklandi', created_at: new Date().toISOString(), sender_name: 'System' }] },
  '/teachers/': { results: [{ id: 1, first_name: 'Jasur', last_name: 'Aliyev', username: 'jasur_prof' }] },
  '/lessons/': { results: [{ id: 101, teacher_name: 'Jasur Aliyev', subject_name: 'Matematika', class_name: '9-A', status: 'completed' }] },
  '/attendance/': { results: [{ id: 1, teacher: { first_name: 'Jasur' }, status: 'present' }] }
};

// ─── Fetch with Retry ──────────────────────────────────────────────────────
const fetchWithRetry = async (url, options, maxRetries = 2) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
};

export const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (response.status === 204) return {};
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw { status: response.status, data };
  return data;
};

export const pingServer = () => request('/ping/').catch(() => { });

export const api = {
  login: (username, password) => request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getProfile: () => request('/auth/profile/'),

  // Teachers
  getTeachers: (p = '') => request(`/teachers/${p}`),
  getTeacher: (id) => request(`/teachers/${id}/`),
  createTeacher: (d) => request('/teachers/', { method: 'POST', body: JSON.stringify(d) }),
  updateTeacher: (id, d) => request(`/teachers/${id}/`, { method: 'PUT', body: JSON.stringify(d) }),
  patchTeacher: (id, d) => request(`/teachers/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteTeacher: (id) => request(`/teachers/${id}/`, { method: 'DELETE' }),
  assignSubjectsToTeacher: (id, s) => request(`/teachers/${id}/assign_subjects/`, { method: 'POST', body: JSON.stringify({ subject_ids: s }) }),
  assignClassesToTeacher: (id, c) => request(`/teachers/${id}/assign_classes/`, { method: 'POST', body: JSON.stringify({ class_ids: c }) }),

  // Subjects & Classes
  getSubjects: () => request('/teachers/subjects/'),
  getSubject: (id) => request(`/teachers/subjects/${id}/`),
  createSubject: (d) => request('/teachers/subjects/', { method: 'POST', body: JSON.stringify(d) }),
  deleteSubject: (id) => request(`/teachers/subjects/${id}/`, { method: 'DELETE' }),
  getClasses: () => request('/teachers/classes/'),
  getClass: (id) => request(`/teachers/classes/${id}/`),
  createClass: (d) => request('/teachers/classes/', { method: 'POST', body: JSON.stringify(d) }),
  deleteClass: (id) => request(`/teachers/classes/${id}/`, { method: 'DELETE' }),

  // Lessons
  getLessons: (p = '') => request(`/lessons/${p}`),
  getLesson: (id) => request(`/lessons/${id}/`),
  patchLesson: (id, d) => request(`/lessons/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteLesson: (id) => request(`/lessons/${id}/`, { method: 'DELETE' }),
  startLesson: (lesson_id) => request('/lessons/start/', { method: 'POST', body: JSON.stringify({ lesson_id }) }),
  endLesson: (lesson_id, notes = '') => request('/lessons/end/', { method: 'POST', body: JSON.stringify({ lesson_id, notes }) }),
  getLessonsToday: () => request('/lessons/today/'),

  // Schedules
  getSchedules: (p = '') => request(`/lessons/schedules/${p}`),
  getWeeklySchedules: (p = '') => request(`/lessons/schedules/weekly/${p}`),

  // Attendance
  getAttendanceLogs: (p = '') => request(`/attendance/${p}`),
  patchAttendance: (id, d) => request(`/attendance/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  generateStaticQR: () => request('/attendance/qrcodes/generate_static/', { method: 'POST' }),

  // Analytics
  getAdminDashboard: () => request('/analytics/admin-dashboard/'),
  getTeacherDashboard: () => request('/analytics/teacher-dashboard/'),

  // Notifications
  getNotifications: () => request('/notifications/'),
  getUnreadCount: () => request('/notifications/unread_count/'),
  markAsRead: (ids) => request('/notifications/mark_as_read/', { method: 'POST', body: JSON.stringify({ notification_ids: ids }) }),
  sendNotification: (d) => request('/notifications/', { method: 'POST', body: JSON.stringify(d) }),

  // Photos
  getPendingPhotos: () => request('/photos/pending/'),
  getMissingPhotos: (p = '') => request(`/photos/missing/${p}`),

  getPhotoUrl: (u) => u ? (u.startsWith('http') ? u : `https://teacher-web-beckend.onrender.com${u.startsWith('/') ? u : '/' + u}`) : '',
};
