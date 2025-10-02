// services/apiService.js
import { apiClient } from "../utils/api";
import {
  PUBLIC_ENDPOINTS,
  ADMIN_ENDPOINTS,
  USER_ENDPOINTS,
  AUTH_ENDPOINTS,
  PAYMENT_ENDPOINTS,
  SOCIAL_AUTH_ENDPOINTS,
} from "../constants/API";

// ================= MINISTRIES =================
export const ministryService = {
  getAll: () => apiClient.get(PUBLIC_ENDPOINTS.MINISTRIES),
  getVolunteerOpportunities: () =>
    apiClient.get(PUBLIC_ENDPOINTS.MINISTRIES_VOLUNTEER),
  getUserMinistries: () => apiClient.get(PUBLIC_ENDPOINTS.MINISTRIES_USER),
  volunteer: (id, formData) =>
    apiClient.post(PUBLIC_ENDPOINTS.MINISTRIES_VOLUNTEER_ACTION(id), formData),
  contactLeaders: (id, message) =>
    apiClient.post(PUBLIC_ENDPOINTS.MINISTRIES_CONTACT(id), { message }),

  // Admin
  create: (data) => apiClient.post(ADMIN_ENDPOINTS.MINISTRIES.CREATE, data),
  update: (id, data) =>
    apiClient.put(ADMIN_ENDPOINTS.MINISTRIES.UPDATE(id), data),
  delete: (id) => apiClient.delete(ADMIN_ENDPOINTS.MINISTRIES.DELETE(id)),
  getVolunteers: (id) =>
    apiClient.get(ADMIN_ENDPOINTS.MINISTRIES.VOLUNTEERS(id)),
  getStats: () => apiClient.get(ADMIN_ENDPOINTS.MINISTRIES.STATS),
  getCategories: () => apiClient.get(ADMIN_ENDPOINTS.MINISTRIES.CATEGORIES),
};

// ================= SERMONS =================
export const sermonService = {
  getAll: (params = {}) => apiClient.get(PUBLIC_ENDPOINTS.SERMONS, { params }),
  getFeatured: (limit = 3) =>
    apiClient.get(PUBLIC_ENDPOINTS.SERMONS_FEATURED, { params: { limit } }),
  getLiveStatus: () => apiClient.get(PUBLIC_ENDPOINTS.SERMONS_LIVE),
  getCategories: () => apiClient.get(PUBLIC_ENDPOINTS.SERMONS_CATEGORIES),
  getFavorites: () => apiClient.get(PUBLIC_ENDPOINTS.SERMONS_FAVORITES),
  addFavorite: (id) =>
    apiClient.post(PUBLIC_ENDPOINTS.SERMONS_FAVORITE_ACTION(id)),
  removeFavorite: (id) =>
    apiClient.delete(PUBLIC_ENDPOINTS.SERMONS_FAVORITE_ACTION(id)),

  // Admin
  create: (data) => apiClient.post(ADMIN_ENDPOINTS.SERMONS.CREATE, data),
  update: (id, data) => apiClient.put(ADMIN_ENDPOINTS.SERMONS.UPDATE(id), data),
  delete: (id) => apiClient.delete(ADMIN_ENDPOINTS.SERMONS.DELETE(id)),
  getStats: () => apiClient.get(ADMIN_ENDPOINTS.SERMONS.STATS),
  startLiveStream: () => apiClient.post(ADMIN_ENDPOINTS.SERMONS.LIVE_START),
  stopLiveStream: () => apiClient.post(ADMIN_ENDPOINTS.SERMONS.LIVE_STOP),
};

// ================= EVENTS =================
export const eventService = {
  getAll: (params = {}) => apiClient.get(PUBLIC_ENDPOINTS.EVENTS, { params }),
  getUpcoming: (limit = 3) =>
    apiClient.get(PUBLIC_ENDPOINTS.EVENTS_UPCOMING, { params: { limit } }),
  getUserRsvps: () => apiClient.get(PUBLIC_ENDPOINTS.USER_RSVPS),
  getUserFavorites: () => apiClient.get(PUBLIC_ENDPOINTS.USER_FAVORITES),
  rsvp: (id) => apiClient.post(PUBLIC_ENDPOINTS.EVENT_RSVP(id)),
  cancelRsvp: (id) => apiClient.delete(PUBLIC_ENDPOINTS.EVENT_RSVP(id)),
  addFavorite: (id) => apiClient.post(PUBLIC_ENDPOINTS.EVENT_FAVORITE(id)),
  removeFavorite: (id) => apiClient.delete(PUBLIC_ENDPOINTS.EVENT_FAVORITE(id)),
  getUserPastRsvps: () => apiClient.get(PUBLIC_ENDPOINTS.USER_PAST_RSVPS),
  addToCalendar: (eventId) =>
    apiClient.post(
      PUBLIC_ENDPOINTS.CALENDAR_ADD_EVENT.replace(":eventId", eventId),
    ),
  getEventRecording: (eventId) =>
    apiClient.get(
      PUBLIC_ENDPOINTS.EVENT_RECORDING.replace(":eventId", eventId),
    ),
  getEventMaterials: (eventId) =>
    apiClient.get(
      PUBLIC_ENDPOINTS.EVENT_MATERIALS.replace(":eventId", eventId),
    ),

  // Admin
  create: (data) => apiClient.post(ADMIN_ENDPOINTS.EVENTS.CREATE, data),
  update: (id, data) => apiClient.put(ADMIN_ENDPOINTS.EVENTS.UPDATE(id), data),
  delete: (id) => apiClient.delete(ADMIN_ENDPOINTS.EVENTS.DELETE(id)),
};

// ================= TESTIMONIALS =================
export const testimonialService = {
  getAll: (params = {}) =>
    apiClient.get(PUBLIC_ENDPOINTS.TESTIMONIALS, { params }),
  getApproved: (limit = 6) =>
    apiClient.get(PUBLIC_ENDPOINTS.TESTIMONIALS_APPROVED, {
      params: { limit },
    }),
  getVideos: () => apiClient.get(PUBLIC_ENDPOINTS.TESTIMONIALS_VIDEOS),
  getCategories: () => apiClient.get(PUBLIC_ENDPOINTS.TESTIMONIALS_CATEGORIES),
  submit: (data) =>
    apiClient.post(PUBLIC_ENDPOINTS.TESTIMONIALS, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Admin
  getAllAdmin: () => apiClient.get(ADMIN_ENDPOINTS.TESTIMONIALS.ALL),
  create: (data) =>
    apiClient.post(ADMIN_ENDPOINTS.TESTIMONIALS.CREATE, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) =>
    apiClient.put(ADMIN_ENDPOINTS.TESTIMONIALS.UPDATE(id), data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => apiClient.delete(ADMIN_ENDPOINTS.TESTIMONIALS.DELETE(id)),
  getStats: () => apiClient.get(ADMIN_ENDPOINTS.TESTIMONIALS.STATS),
};

// ================= PRAYERS =================
export const prayerService = {
  getAll: (page = 1, limit = 10) =>
    apiClient.get(PUBLIC_ENDPOINTS.PRAYERS, { params: { page, limit } }),
  getTeam: () => apiClient.get(PUBLIC_ENDPOINTS.PRAYERS_TEAM),
  getMeetings: () => apiClient.get(PUBLIC_ENDPOINTS.PRAYERS_MEETINGS),
  submit: (data) => apiClient.post(PUBLIC_ENDPOINTS.PRAYERS, data),
  prayForRequest: (id) => apiClient.post(PUBLIC_ENDPOINTS.PRAYER_ACTION(id)),

  // Admin
  update: (id, data) =>
    apiClient.put(ADMIN_ENDPOINTS.PRAYER_REQUESTS.UPDATE(id), data),
  delete: (id) => apiClient.delete(ADMIN_ENDPOINTS.PRAYER_REQUESTS.DELETE(id)),
  getAllAdmin: () => apiClient.get(ADMIN_ENDPOINTS.PRAYER_REQUESTS.BASE),
  getStats: () => apiClient.get(ADMIN_ENDPOINTS.PRAYER_REQUESTS.STATS),
};

// ================= BLOG =================
export const blogService = {
  getAll: (params = {}) => apiClient.get(PUBLIC_ENDPOINTS.BLOG, { params }),
  getCategories: () => apiClient.get(PUBLIC_ENDPOINTS.BLOG_CATEGORIES),
  getFavorites: () => apiClient.get(PUBLIC_ENDPOINTS.BLOG_FAVORITES),
  addFavorite: (id) =>
    apiClient.post(PUBLIC_ENDPOINTS.BLOG_FAVORITE_ACTION(id)),
  removeFavorite: (id) =>
    apiClient.delete(PUBLIC_ENDPOINTS.BLOG_FAVORITE_ACTION(id)),
  subscribeNewsletter: (email) =>
    apiClient.post("/api/blog/newsletter/subscribe", { email }),

  // Admin
  create: (data) => apiClient.post(ADMIN_ENDPOINTS.BLOG.CREATE, data),
  update: (id, data) => apiClient.put(ADMIN_ENDPOINTS.BLOG.UPDATE(id), data),
  delete: (id) => apiClient.delete(ADMIN_ENDPOINTS.BLOG.DELETE(id)),
  getAllAdmin: () => apiClient.get(ADMIN_ENDPOINTS.BLOG.BASE),
  getCategoriesAdmin: () => apiClient.get(ADMIN_ENDPOINTS.BLOG.CATEGORIES),
};

// ================= DONATIONS =================
export const donationService = {
  getUserDonations: () => apiClient.get(PUBLIC_ENDPOINTS.DONATIONS),
  createDonation: (data) =>
    apiClient.post(PAYMENT_ENDPOINTS.CREATE_DONATION, data),
  createPaymentIntent: (data) =>
    apiClient
      .post(PAYMENT_ENDPOINTS.CREATE_PAYMENT_INTENT, data)
      .then((res) => res.data),
  confirmPayment: (data) =>
    apiClient.post(PAYMENT_ENDPOINTS.CONFIRM_PAYMENT, data),
  downloadReceipt: (id) =>
    apiClient.get(PAYMENT_ENDPOINTS.DONATIONS_RECEIPT(id), {
      responseType: "blob",
    }),

  // Admin
  getAll: () => apiClient.get(ADMIN_ENDPOINTS.DONATIONS.BASE),
  update: (id, data) =>
    apiClient.put(ADMIN_ENDPOINTS.DONATIONS.UPDATE(id), data),
  getStats: () => apiClient.get(ADMIN_ENDPOINTS.DONATIONS.STATS),
  getRecent: () => apiClient.get(ADMIN_ENDPOINTS.DONATIONS.RECENT),
  exportDonations: (format = "csv") =>
    apiClient.get(`${ADMIN_ENDPOINTS.DONATIONS.EXPORT}?format=${format}`, {
      responseType: "blob",
    }),
};

// ================= USER SERVICE =================
export const userService = {
  getMe: () => apiClient.get(USER_ENDPOINTS.USERS),
  getProfile: () => apiClient.get(USER_ENDPOINTS.PROFILE),
  updateProfile: (data) => apiClient.put(USER_ENDPOINTS.UPDATE_PROFILE, data),
  getDashboard: () => apiClient.get(USER_ENDPOINTS.DASHBOARD),
  getFamily: () => apiClient.get(USER_ENDPOINTS.FAMILY.BASE),
  addFamilyMember: (data) => apiClient.post(USER_ENDPOINTS.FAMILY.BASE, data),
  removeFamilyMember: (id) =>
    apiClient.delete(USER_ENDPOINTS.FAMILY.MEMBER(id)),
  updateCommunication: (prefs) =>
    apiClient.put(USER_ENDPOINTS.COMMUNICATION, prefs),
  trackLogin: () => apiClient.post(USER_ENDPOINTS.TRACK_LOGIN), // ✅ ADDED

  // Admin user management
  getAllUsers: (params = {}) =>
    apiClient.get(USER_ENDPOINTS.ADMIN.BASE, { params }),
  createUser: (data) => apiClient.post(USER_ENDPOINTS.ADMIN.CREATE, data),
  updateUser: (id, data) =>
    apiClient.put(USER_ENDPOINTS.ADMIN.UPDATE(id), data),
  deleteUser: (id) => apiClient.delete(USER_ENDPOINTS.ADMIN.DELETE(id)),
  activateUser: (id) => apiClient.patch(USER_ENDPOINTS.ADMIN.ACTIVATE(id)), // ✅ ADDED
  deactivateUser: (id) => apiClient.patch(USER_ENDPOINTS.ADMIN.DEACTIVATE(id)), // ✅ ADDED
  getUserRoles: () => apiClient.get(USER_ENDPOINTS.ADMIN.ROLES), // ✅ ADDED
  getMembershipStatuses: () =>
    apiClient.get(USER_ENDPOINTS.ADMIN.MEMBERSHIP_STATUSES), // ✅
};

// ================= VOLUNTEERS =================
export const volunteerService = {
  getAll: () => apiClient.get(ADMIN_ENDPOINTS.VOLUNTEERS.BASE),
  getStats: () => apiClient.get(ADMIN_ENDPOINTS.VOLUNTEERS.STATS),
  getById: (id) => apiClient.get(ADMIN_ENDPOINTS.VOLUNTEERS.BY_ID(id)),
  updateStatus: (id, data) =>
    apiClient.put(ADMIN_ENDPOINTS.VOLUNTEERS.UPDATE_STATUS(id), data),
  getUserApplications: () => apiClient.get("/api/volunteers/user/applications"),
  getMinistryVolunteers: (id) =>
    apiClient.get(`/api/volunteers/ministry/${id}`),
};

// ================= ADMIN SERVICE =================
export const adminService = {
  getDashboardStats: () => apiClient.get(ADMIN_ENDPOINTS.DASHBOARD.STATS),
  getRecentActivity: () => apiClient.get(ADMIN_ENDPOINTS.DASHBOARD.ACTIVITY),
  generateAdminCode: (data) =>
    apiClient.post(ADMIN_ENDPOINTS.CODES.GENERATE_CODE, data),
  getAdminCodes: (params = {}) =>
    apiClient.get(ADMIN_ENDPOINTS.CODES.CODE, { params }),

  // Ministries
  getMinistries: () => apiClient.get(ADMIN_ENDPOINTS.MINISTRIES.BASE),
  createMinistry: (data) =>
    apiClient.post(ADMIN_ENDPOINTS.MINISTRIES.CREATE, data),
  updateMinistry: (id, data) =>
    apiClient.put(ADMIN_ENDPOINTS.MINISTRIES.UPDATE(id), data),
  deleteMinistry: (id) =>
    apiClient.delete(ADMIN_ENDPOINTS.MINISTRIES.DELETE(id)),
  getMinistryCategories: () =>
    apiClient.get(ADMIN_ENDPOINTS.MINISTRIES.CATEGORIES),

  // Blog
  getBlogPosts: () => apiClient.get(ADMIN_ENDPOINTS.BLOG.BASE),
  createBlogPost: (data) => apiClient.post(ADMIN_ENDPOINTS.BLOG.CREATE, data),
  updateBlogPost: (id, data) =>
    apiClient.put(ADMIN_ENDPOINTS.BLOG.UPDATE(id), data),
  deleteBlogPost: (id) => apiClient.delete(ADMIN_ENDPOINTS.BLOG.DELETE(id)),
  getBlogCategories: () => apiClient.get(ADMIN_ENDPOINTS.BLOG.CATEGORIES),

  // Testimonials
  getTestimonials: () => apiClient.get(ADMIN_ENDPOINTS.TESTIMONIALS.ALL),
  createTestimonial: (data) =>
    apiClient.post(ADMIN_ENDPOINTS.TESTIMONIALS.CREATE, data),
  updateTestimonial: (id, data) =>
    apiClient.put(ADMIN_ENDPOINTS.TESTIMONIALS.UPDATE(id), data),
  deleteTestimonial: (id) =>
    apiClient.delete(ADMIN_ENDPOINTS.TESTIMONIALS.DELETE(id)),

  // Settings
  getSettings: () => apiClient.get(ADMIN_ENDPOINTS.SETTINGS.BASE),
  updateSettings: (data) =>
    apiClient.put(ADMIN_ENDPOINTS.SETTINGS.UPDATE, data),
  resetSettings: () => apiClient.post(ADMIN_ENDPOINTS.SETTINGS.RESET),
};

// ================= AUTH SERVICE =================
export const authService = {
  login: (credentials) => {
    const payload = {
      email: credentials.email,
      password: credentials.password,
    };
    if (credentials.adminCode) {
      payload.adminCode = credentials.adminCode;
    }
    return apiClient.post(AUTH_ENDPOINTS.LOGIN, payload);
  },

  register: (data) => apiClient.post(AUTH_ENDPOINTS.REGISTER, data),
  verifyEmail: (token) =>
    apiClient.get(`${AUTH_ENDPOINTS.VERIFY_EMAIL}${token}`),
  resendVerification: (email) =>
    apiClient.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email }),
  forgotPassword: (email) =>
    apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email }),
  resetPassword: (token, password) =>
    apiClient.post(`${AUTH_ENDPOINTS.RESET_PASSWORD}${token}`, { password }),
  changePassword: (data) =>
    apiClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, data),
  validateResetToken: (token) =>
    apiClient.post(AUTH_ENDPOINTS.VALIDATE_RESET_TOKEN, { token }),
  getCurrentUser: () => apiClient.get(AUTH_ENDPOINTS.ME),
  logout: () => apiClient.post(AUTH_ENDPOINTS.LOGOUT),
  claimAdminCode: (code) => apiClient.post(AUTH_ENDPOINTS.CLAIM_CODE, { code }),
};

// ================= UTILITY =================
export const utilityService = {
  getServiceTimes: () => apiClient.get(PUBLIC_ENDPOINTS.SERVICE_TIMES),
  getChurchStats: () => apiClient.get(PUBLIC_ENDPOINTS.CHURCH_STATS),
  getHeroContent: () => apiClient.get(PUBLIC_ENDPOINTS.HERO_CONTENT),
  getLiveStatus: () => apiClient.get(PUBLIC_ENDPOINTS.LIVE_STATUS),
  trackEvent: (data) => apiClient.post("/api/analytics/track", data),
  getDashboardStats: () => apiClient.get(ADMIN_ENDPOINTS.DASHBOARD.STATS),
  getRecentActivity: () => apiClient.get(ADMIN_ENDPOINTS.DASHBOARD.ACTIVITY),
};

// ================= SOCIAL =================
export const socialAuthService = {
  googleLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}${SOCIAL_AUTH_ENDPOINTS.GOOGLE}`;
  },
  facebookLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}${SOCIAL_AUTH_ENDPOINTS.FACEBOOK}`;
  },

  validateGoogleToken: (token) =>
    apiClient.post(SOCIAL_AUTH_ENDPOINTS.VALIDATE_GOOGLE, { token }),
  validateFacebookToken: (token) =>
    apiClient.post(SOCIAL_AUTH_ENDPOINTS.VALIDATE_FACEBOOK, { token }),

  linkAccount: (data) =>
    apiClient.post(SOCIAL_AUTH_ENDPOINTS.LINK_ACCOUNT, data),
  unlinkAccount: (provider) =>
    apiClient.delete(SOCIAL_AUTH_ENDPOINTS.UNLINK_ACCOUNT(provider)),
  getLinkedAccounts: () => apiClient.get(SOCIAL_AUTH_ENDPOINTS.GET_ACCOUNTS),

  handleOAuthCallback: () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      token: urlParams.get("token"),
      userId: urlParams.get("userId"),
      error: urlParams.get("error"),
    };
  },
};

// ================= EXPORT =================
export default {
  ministryService,
  sermonService,
  eventService,
  testimonialService,
  prayerService,
  blogService,
  donationService,
  userService,
  volunteerService,
  adminService,
  authService,
  utilityService,
  socialAuthService,
};
