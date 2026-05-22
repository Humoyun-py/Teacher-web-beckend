// ─── Avtomatik URL aniqlash ───────────────────────────────────────────────────
// Localhost'da ishlayotgan bo'lsa → lokal backend, aks holda → Render production
const BASE_URL = 'https://teacher-web-beckend.onrender.com/api/v1';

// ─── Token yangilash ──────────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ─── Render uyqusidan himoya (retry + timeout) ───────────────────────────────
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      console.warn(`⚠️ So'rov urinish ${attempt}/${maxRetries} muvaffaqiyatsiz:`, err.message);
      if (attempt === maxRetries) throw err;
      // Render uyg'onishi uchun kutish (har safar ko'proq)
      const waitMs = attempt * 3000;
      console.log(`⏳ ${waitMs / 1000}s kutilmoqda, server uyg'onmoqda...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
};

export const refreshTokens = async () => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) throw new Error('No refresh token');
  const res = await fetchWithRetry(`${BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  // Backend returns { access_token }
  const newAccess = data.access_token || data.access;
  if (newAccess) localStorage.setItem('access_token', newAccess);
  return newAccess;
};

// ─── Universal Request ────────────────────────────────────────────────────────
export const request = async (endpoint, options = {}, retry = true) => {
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 401 → token yangilash (403 = permission error, refresh qilinmaydi)
  if (response.status === 401 && retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (tok) => resolve(request(endpoint, options, false)),
          reject,
        });
      });
    }
    isRefreshing = true;
    try {
      await refreshTokens();
      isRefreshing = false;
      processQueue(null);
      return request(endpoint, options, false);
    } catch (err) {
      isRefreshing = false;
      processQueue(err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw err;
    }
  }

  if (response.status === 204) return {};

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return data;
};

// ─── Multipart (file upload) ─────────────────────────────────────────────────
export const requestFormData = async (endpoint, formData, method = 'POST') => {
  const token = localStorage.getItem('access_token');
  const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (response.status === 204) return {};
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw { status: response.status, data };
  return data;
};

// ─── API ──────────────────────────────────────────────────────────────────────
export const api = {

  // ══════════════════════════════════════════
  // 🔐 AUTH
  // ══════════════════════════════════════════
  login: (username, password) =>
    request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),

  register: (data) =>
    request('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),

  refreshToken: (refresh) =>
    request('/auth/refresh/', { method: 'POST', body: JSON.stringify({ refresh }) }),

  getProfile: () => request('/auth/profile/'),

  updateProfile: (data) =>
    request('/auth/profile/', { method: 'PATCH', body: JSON.stringify(data) }),

  changePassword: (old_password, new_password, new_password_confirm) =>
    request('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password, new_password_confirm }),
    }),

  // ══════════════════════════════════════════
  // 👨🏫 TEACHERS
  // ══════════════════════════════════════════
  getTeachers: (params = '') => request(`/teachers/${params}`),
  getTeacher: (id) => request(`/teachers/${id}/`),
  createTeacher: (data) =>
    request('/teachers/', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (id, data) =>
    request(`/teachers/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patchTeacher: (id, data) =>
    request(`/teachers/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTeacher: (id) =>
    request(`/teachers/${id}/`, { method: 'DELETE' }),
  assignSubjectsToTeacher: (id, subject_ids) =>
    request(`/teachers/${id}/assign_subjects/`, {
      method: 'POST',
      body: JSON.stringify({ subject_ids }),
    }),
  assignClassesToTeacher: (id, class_ids) =>
    request(`/teachers/${id}/assign_classes/`, {
      method: 'POST',
      body: JSON.stringify({ class_ids }),
    }),
  getTeacherStatusInfo: (id) => request(`/teachers/${id}/status_info/`),
  getTeacherSalaryReport: (id, month, year) =>
    request(`/teachers/${id}/salary_report/?month=${month}&year=${year}`),

  // ── Subjects ──
  getSubjects: () => request('/teachers/subjects/'),
  getSubject: (id) => request(`/teachers/subjects/${id}/`),
  createSubject: (data) =>
    request('/teachers/subjects/', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id, data) =>
    request(`/teachers/subjects/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id) =>
    request(`/teachers/subjects/${id}/`, { method: 'DELETE' }),

  // ── Classes ──
  getClasses: () => request('/teachers/classes/'),
  getClass: (id) => request(`/teachers/classes/${id}/`),
  createClass: (data) =>
    request('/teachers/classes/', { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id, data) =>
    request(`/teachers/classes/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id) =>
    request(`/teachers/classes/${id}/`, { method: 'DELETE' }),

  // ══════════════════════════════════════════
  // 📅 SCHEDULES
  // ══════════════════════════════════════════
  getSchedules: (params = '') => request(`/lessons/schedules/${params}`),
  getSchedule: (id) => request(`/lessons/schedules/${id}/`),
  createSchedule: (data) =>
    request('/lessons/schedules/', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id, data) =>
    request(`/lessons/schedules/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patchSchedule: (id, data) =>
    request(`/lessons/schedules/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSchedule: (id) =>
    request(`/lessons/schedules/${id}/`, { method: 'DELETE' }),
  getWeeklySchedules: (params = '') => request(`/lessons/schedules/weekly/${params}`),
  checkScheduleConflict: (data) =>
    request('/lessons/schedules/check_conflict/', { method: 'POST', body: JSON.stringify(data) }),

  // ══════════════════════════════════════════
  // 📅 LESSONS
  // ══════════════════════════════════════════
  getLessons: (params = '') => request(`/lessons/${params}`),
  getLesson: (id) => request(`/lessons/${id}/`),
  createLesson: (data) =>
    request('/lessons/', { method: 'POST', body: JSON.stringify(data) }),
  updateLesson: (id, data) =>
    request(`/lessons/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patchLesson: (id, data) =>
    request(`/lessons/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLesson: (id) =>
    request(`/lessons/${id}/`, { method: 'DELETE' }),
  startLesson: (lesson_id) =>
    request('/lessons/start/', { method: 'POST', body: JSON.stringify({ lesson_id }) }),
  endLesson: (lesson_id, notes = '') =>
    request('/lessons/end/', { method: 'POST', body: JSON.stringify({ lesson_id, notes }) }),
  getLessonsToday: () => request('/lessons/today/'),
  getMissedLessons: (params = '') => request(`/lessons/missed/${params}`),
  getLateLessons: (params = '') => request(`/lessons/late_started/${params}`),
  generateLessonsFromSchedule: (date) =>
    request('/lessons/generate_from_schedule/', { method: 'POST', body: JSON.stringify({ date }) }),

  // ── Replacements ──
  replaceLesson: (lesson_id, replacement_teacher_id, reason = '') =>
    request('/lessons/replace/', { method: 'POST', body: JSON.stringify({ lesson_id, replacement_teacher_id, reason }) }),
  approveReplace: (lesson_id, action) =>
    request('/lessons/approve-replace/', { method: 'POST', body: JSON.stringify({ lesson_id, action }) }),
  cancelReplace: (lesson_id) =>
    request('/lessons/cancel-replace/', { method: 'POST', body: JSON.stringify({ lesson_id }) }),
  getReplacements: () => request('/lessons/replacements/'),

  // ══════════════════════════════════════════
  // 📍 ATTENDANCE
  // ══════════════════════════════════════════
  checkIn: (qr_code) =>
    request('/attendance/check-in/', { method: 'POST', body: JSON.stringify({ qr_code }) }),

  getAttendanceLogs: (params = '') => request(`/attendance/${params}`),
  getAttendance: (id) => request(`/attendance/${id}/`),
  updateAttendance: (id, data) =>
    request(`/attendance/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patchAttendance: (id, data) =>
    request(`/attendance/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAttendanceToday: () => request('/attendance/today/'),
  markAbsent: (date) =>
    request('/attendance/mark_absent/', { method: 'POST', body: JSON.stringify({ date }) }),

  // QR Codes
  getQRCodes: () => request('/attendance/qrcodes/'),
  getQRCode: (id) => request(`/attendance/qrcodes/${id}/`),
  createQRCode: (data) =>
    request('/attendance/qrcodes/', { method: 'POST', body: JSON.stringify(data) }),
  deleteQRCode: (id) =>
    request(`/attendance/qrcodes/${id}/`, { method: 'DELETE' }),
  getQRCodeImage: (id) => `${BASE_URL}/attendance/qrcodes/${id}/image/`,
  generateStaticQR: () =>
    request('/attendance/qrcodes/generate_static/', { method: 'POST', body: JSON.stringify({}) }),

  // ══════════════════════════════════════════
  // 🖼️ PHOTOS
  // ══════════════════════════════════════════
  getPhotos: (params = '') => request(`/photos/${params}`),
  getPhoto: (id) => request(`/photos/${id}/`),
  uploadPhoto: (lesson_id, file, description = '') => {
    const formData = new FormData();
    formData.append('lesson', lesson_id);
    formData.append('photo', file);
    if (description) formData.append('description', description);
    return requestFormData('/photos/', formData);
  },
  deletePhoto: (id) => request(`/photos/${id}/`, { method: 'DELETE' }),
  reviewPhoto: (photo_id, status, review_notes = '') =>
    request(`/photos/${photo_id}/review/`, {
      method: 'POST',
      body: JSON.stringify({ status, review_notes }),
    }),
  getPendingPhotos: () => request('/photos/pending/'),
  getMissingPhotos: (params = '') => request(`/photos/missing/${params}`),
  getPhotoStats: () => request('/photos/stats/'),

  // ══════════════════════════════════════════
  // 📊 ANALYTICS
  // ══════════════════════════════════════════
  getAdminDashboard: () => request('/analytics/admin-dashboard/'),
  getTeacherDashboard: () => request('/analytics/teacher-dashboard/'),

  // ══════════════════════════════════════════
  // 🔔 NOTIFICATIONS
  // ══════════════════════════════════════════
  getNotifications: () => request('/notifications/'),
  getNotification: (id) => request(`/notifications/${id}/`),
  markAsRead: (notification_ids) =>
    request('/notifications/mark_as_read/', {
      method: 'POST',
      body: JSON.stringify({ notification_ids }),
    }),
  getUnreadCount: () => request('/notifications/unread_count/'),

  getPhotoUrl: (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const host = 'https://teacher-web-beckend.onrender.com';
    const path = url.startsWith('/') ? url : '/' + url;
    return `${host}${path}`;
  },
};
