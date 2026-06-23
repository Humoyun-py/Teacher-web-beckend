// ─── Avtomatik URL aniqlash ───────────────────────────────────────────────────
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000/api/v1' 
  : 'https://teacher-web-beckend.onrender.com/api/v1';

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
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (response.status === 204) return {};
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw { status: response.status, data };
  return data;
};

export const pingServer = () => request('/ping/').catch(() => { });

export const api = {
  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH — /api/v1/auth/
  // ═══════════════════════════════════════════════════════════════════════════
  login: (username, password) => request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (d) => request('/auth/register/', { method: 'POST', body: JSON.stringify(d) }),
  refreshToken: (refresh_token) => request('/auth/refresh/', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  getProfile: () => request('/auth/profile/'),
  updateProfile: (d) => request('/auth/profile/', { method: 'PATCH', body: JSON.stringify(d) }),
  changePassword: (d) => request('/auth/change-password/', { method: 'POST', body: JSON.stringify(d) }),

  // Users (IT Support / Admin)
  getUsers: (p = '') => request(`/auth/users/${p}`),
  getUserDetail: (id) => request(`/auth/users/${id}/`),
  updateUser: (id, d) => request(`/auth/users/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteUser: (id) => request(`/auth/users/${id}/`, { method: 'DELETE' }),

  // Admins (IT Support)
  getAdmins: () => request('/auth/admins/'),
  createAdmin: (d) => request('/auth/admins/', { method: 'POST', body: JSON.stringify(d) }),

  // Password Reset (IT Support)
  resetUserPassword: (user_id, new_password) => request('/auth/reset-password/', { method: 'POST', body: JSON.stringify({ user_id, new_password }) }),

  // Audit Logs (IT Support)
  getAuditLogs: (p = '') => request(`/auth/audit-logs/${p}`),
  getAuditLogDetail: (id) => request(`/auth/audit-logs/${id}/`),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEACHERS — /api/v1/teachers/
  // ═══════════════════════════════════════════════════════════════════════════
  getTeachers: (p = '') => request(`/teachers/${p}`),
  getTeacher: (id) => request(`/teachers/${id}/`),
  createTeacher: (d) => request('/teachers/', { method: 'POST', body: JSON.stringify(d) }),
  updateTeacher: (id, d) => request(`/teachers/${id}/`, { method: 'PUT', body: JSON.stringify(d) }),
  patchTeacher: (id, d) => request(`/teachers/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteTeacher: (id) => request(`/teachers/${id}/`, { method: 'DELETE' }),
  assignSubjectsToTeacher: (id, s) => request(`/teachers/${id}/assign_subjects/`, { method: 'POST', body: JSON.stringify({ subject_ids: s }) }),
  assignClassesToTeacher: (id, c) => request(`/teachers/${id}/assign_classes/`, { method: 'POST', body: JSON.stringify({ class_ids: c }) }),
  getTeacherStatusInfo: (id) => request(`/teachers/${id}/status_info/`),
  getTeacherSalaryReport: (id, month, year) => {
    const q = (month && year) ? `?month=${month}&year=${year}` : '';
    return request(`/teachers/${id}/salary_report/${q}`);
  },

  // Subjects
  getSubjects: () => request('/teachers/subjects/'),
  getSubject: (id) => request(`/teachers/subjects/${id}/`),
  createSubject: (d) => request('/teachers/subjects/', { method: 'POST', body: JSON.stringify(d) }),
  updateSubject: (id, d) => request(`/teachers/subjects/${id}/`, { method: 'PUT', body: JSON.stringify(d) }),
  patchSubject: (id, d) => request(`/teachers/subjects/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteSubject: (id) => request(`/teachers/subjects/${id}/`, { method: 'DELETE' }),

  // Classes
  getClasses: () => request('/teachers/classes/'),
  getClass: (id) => request(`/teachers/classes/${id}/`),
  createClass: (d) => request('/teachers/classes/', { method: 'POST', body: JSON.stringify(d) }),
  updateClass: (id, d) => request(`/teachers/classes/${id}/`, { method: 'PUT', body: JSON.stringify(d) }),
  patchClass: (id, d) => request(`/teachers/classes/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteClass: (id) => request(`/teachers/classes/${id}/`, { method: 'DELETE' }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSONS — /api/v1/lessons/
  // ═══════════════════════════════════════════════════════════════════════════
  getLessons: (p = '') => request(`/lessons/${p}`),
  getLesson: (id) => request(`/lessons/${id}/`),
  createLesson: (d) => request('/lessons/', { method: 'POST', body: JSON.stringify(d) }),
  updateLesson: (id, d) => request(`/lessons/${id}/`, { method: 'PUT', body: JSON.stringify(d) }),
  patchLesson: (id, d) => request(`/lessons/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteLesson: (id) => request(`/lessons/${id}/`, { method: 'DELETE' }),
  startLesson: (lesson_id) => request('/lessons/start/', { method: 'POST', body: JSON.stringify({ lesson_id }) }),
  endLesson: (lesson_id, notes = '') => request('/lessons/end/', { method: 'POST', body: JSON.stringify({ lesson_id, notes }) }),
  getLessonsToday: () => request('/lessons/today/'),
  getMissedLessons: (p = '') => request(`/lessons/missed/${p}`),
  getLateStartedLessons: (p = '') => request(`/lessons/late_started/${p}`),
  generateFromSchedule: (date) => request('/lessons/generate_from_schedule/', { method: 'POST', body: JSON.stringify({ date }) }),

  // Replacements
  replaceLesson: (d) => request('/lessons/replace/', { method: 'POST', body: JSON.stringify(d) }),
  approveReplace: (lesson_id, action) => request('/lessons/approve-replace/', { method: 'POST', body: JSON.stringify({ lesson_id, action }) }),
  cancelReplace: (lesson_id) => request('/lessons/cancel-replace/', { method: 'POST', body: JSON.stringify({ lesson_id }) }),
  getReplacements: () => request('/lessons/replacements/'),

  // Schedules
  getSchedules: (p = '') => request(`/lessons/schedules/${p}`),
  getSchedule: (id) => request(`/lessons/schedules/${id}/`),
  createSchedule: (d) => request('/lessons/schedules/', { method: 'POST', body: JSON.stringify(d) }),
  updateSchedule: (id, d) => request(`/lessons/schedules/${id}/`, { method: 'PUT', body: JSON.stringify(d) }),
  patchSchedule: (id, d) => request(`/lessons/schedules/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteSchedule: (id) => request(`/lessons/schedules/${id}/`, { method: 'DELETE' }),
  getWeeklySchedules: (p = '') => request(`/lessons/schedules/weekly/${p}`),
  checkScheduleConflict: (d) => request('/lessons/schedules/check_conflict/', { method: 'POST', body: JSON.stringify(d) }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE — /api/v1/attendance/
  // ═══════════════════════════════════════════════════════════════════════════
  getAttendanceLogs: (p = '') => request(`/attendance/${p}`),
  getAttendance: (id) => request(`/attendance/${id}/`),
  patchAttendance: (id, d) => request(`/attendance/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteAttendance: (id) => request(`/attendance/${id}/`, { method: 'DELETE' }),
  getAttendanceToday: () => request('/attendance/today/'),
  markAbsent: (date) => request('/attendance/mark_absent/', { method: 'POST', body: JSON.stringify({ date }) }),

  // QR Codes
  getQRCodes: (p = '') => request(`/attendance/qrcodes/${p}`),
  getQRCode: (id) => request(`/attendance/qrcodes/${id}/`),
  createQRCode: (d) => request('/attendance/qrcodes/', { method: 'POST', body: JSON.stringify(d) }),
  deleteQRCode: (id) => request(`/attendance/qrcodes/${id}/`, { method: 'DELETE' }),
  getQRImage: (id) => `${BASE_URL}/attendance/qrcodes/${id}/image/`,
  generateStaticQR: () => request('/attendance/qrcodes/generate_static/', { method: 'POST' }),

  // QR Check-in (Teacher)
  checkIn: (qr_code) => request('/attendance/check-in/', { method: 'POST', body: JSON.stringify({ qr_code }) }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — /api/v1/analytics/
  // ═══════════════════════════════════════════════════════════════════════════
  getAdminDashboard: () => request('/analytics/admin-dashboard/'),
  getTeacherDashboard: () => request('/analytics/teacher-dashboard/'),
  getWeeklyStats: () => request('/analytics/weekly/'),
  getMonthlyStats: (p = '') => request(`/analytics/monthly/${p}`),
  getTeacherRanking: (p = '') => request(`/analytics/teacher-ranking/${p}`),
  getAttendanceReport: (p = '') => request(`/analytics/attendance-report/${p}`),
  getLessonReport: (p = '') => request(`/analytics/lesson-report/${p}`),

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS — /api/v1/notifications/
  // ═══════════════════════════════════════════════════════════════════════════
  getNotifications: () => request('/notifications/'),
  getUnreadCount: () => request('/notifications/unread_count/'),
  markAsRead: (ids) => request('/notifications/mark_as_read/', { method: 'POST', body: JSON.stringify({ notification_ids: ids }) }),
  markAllRead: () => request('/notifications/mark_all_read/', { method: 'POST' }),
  sendNotification: (d) => request('/notifications/send/', { method: 'POST', body: JSON.stringify(d) }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PHOTOS — /api/v1/photos/
  // ═══════════════════════════════════════════════════════════════════════════
  getPhotos: (p = '') => request(`/photos/${p}`),
  getPhoto: (id) => request(`/photos/${id}/`),
  uploadPhoto: (formData) => request('/photos/', { method: 'POST', body: formData }),
  reviewPhoto: (id, statusVal, review_notes = '') => request(`/photos/${id}/review/`, { method: 'POST', body: JSON.stringify({ status: statusVal, review_notes }) }),
  getPendingPhotos: () => request('/photos/pending/'),
  getMissingPhotos: (p = '') => request(`/photos/missing/${p}`),
  getMissingByTeacher: (p = '') => request(`/photos/missing-by-teacher/${p}`),
  getPhotoStats: () => request('/photos/stats/'),

  getPhotoUrl: (u) => u ? (u.startsWith('http') ? u : `https://teacher-web-beckend.onrender.com${u.startsWith('/') ? u : '/' + u}`) : '',

  // ═══════════════════════════════════════════════════════════════════════════
  // KPI — /api/v1/kpi/
  // ═══════════════════════════════════════════════════════════════════════════
  getKPIRecords: (p = '') => request(`/kpi/${p}`),
  getKPIRecord: (id) => request(`/kpi/${id}/`),
  calculateKPI: (d) => request('/kpi/calculate/', { method: 'POST', body: JSON.stringify(d) }),
  getKPIRanking: (p = '') => request(`/kpi/ranking/${p}`),

  // ═══════════════════════════════════════════════════════════════════════════
  // SALARY — /api/v1/salary/
  // ═══════════════════════════════════════════════════════════════════════════
  getSalaryRecords: (p = '') => request(`/salary/${p}`),
  getSalaryRecord: (id) => request(`/salary/${id}/`),
  calculateSalary: (d) => request('/salary/calculate/', { method: 'POST', body: JSON.stringify(d) }),
  approveSalary: (id) => request(`/salary/${id}/approve/`, { method: 'POST' }),
  paySalary: (id) => request(`/salary/${id}/pay/`, { method: 'POST' }),
  getSalaryReport: (p = '') => request(`/salary/report/${p}`),

  // ═══════════════════════════════════════════════════════════════════════════
  // CCTV — /api/v1/cctv/
  // ═══════════════════════════════════════════════════════════════════════════
  getCCTVCameras: (p = '') => request(`/cctv/${p}`),
  getCCTVCamera: (id) => request(`/cctv/${id}/`),
  createCCTVCamera: (d) => request('/cctv/', { method: 'POST', body: JSON.stringify(d) }),
  updateCCTVCamera: (id, d) => request(`/cctv/${id}/`, { method: 'PUT', body: JSON.stringify(d) }),
  patchCCTVCamera: (id, d) => request(`/cctv/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteCCTVCamera: (id) => request(`/cctv/${id}/`, { method: 'DELETE' }),
  healthCheckCamera: (id) => request(`/cctv/${id}/health_check/`, { method: 'POST' }),
  checkAllCameras: () => request('/cctv/check_all/', { method: 'POST' }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM SETTINGS — /api/v1/settings/
  // ═══════════════════════════════════════════════════════════════════════════
  getSystemSettings: (p = '') => request(`/settings/${p}`),
  getSystemSetting: (key) => request(`/settings/${key}/`),
  createSystemSetting: (d) => request('/settings/', { method: 'POST', body: JSON.stringify(d) }),
  updateSystemSetting: (key, d) => request(`/settings/${key}/`, { method: 'PUT', body: JSON.stringify(d) }),
  patchSystemSetting: (key, d) => request(`/settings/${key}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteSystemSetting: (key) => request(`/settings/${key}/`, { method: 'DELETE' }),

  // ═══════════════════════════════════════════════════════════════════════════
  // RESTORE — /api/v1/restore/
  // ═══════════════════════════════════════════════════════════════════════════
  getDeletedRecords: (modelName) => request(`/restore/deleted/${modelName}/`),
  restoreRecord: (modelName, pk) => request(`/restore/restore/${modelName}/${pk}/`, { method: 'POST' }),

  // ═══════════════════════════════════════════════════════════════════════════
  // IT TOOLS — /api/v1/it-tools/
  // ═══════════════════════════════════════════════════════════════════════════
  actAs: (user_id) => request('/it-tools/act-as/', { method: 'POST', body: JSON.stringify({ user_id }) }),
  fixAttendance: (d) => request('/it-tools/fix-attendance/', { method: 'POST', body: JSON.stringify(d) }),
  fixLesson: (d) => request('/it-tools/fix-lesson/', { method: 'POST', body: JSON.stringify(d) }),
  fixSalary: (d) => request('/it-tools/fix-salary/', { method: 'POST', body: JSON.stringify(d) }),
  fixKPI: (d) => request('/it-tools/fix-kpi/', { method: 'POST', body: JSON.stringify(d) }),
};
