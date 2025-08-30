// services/apiService.js
import { apiClient } from '../utils/api';
import { FRONTEND_ENDPOINTS, AUTH_ENDPOINTS, PAYMENT_ENDPOINTS } from './API';

// Ministry Service
export const ministryService = {
  // Public endpoints
  getAll: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES),
  getVolunteerOpportunities: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES_VOLUNTEER),
  getUserMinistries: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES_USER),
  volunteer: (id, formData) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES_VOLUNTEER_ACTION(id), formData),
  contactLeaders: (id, message) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES_CONTACT(id), { message }),

  // Admin endpoints
  create: (ministryData) => apiClient.post(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.CREATE, ministryData),
  update: (id, ministryData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.UPDATE(id), ministryData),
  delete: (id) => apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.DELETE(id)),
  getVolunteers: (id) => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.VOLUNTEERS(id)),
  getStats: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.STATS),
  getCategories: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.CATEGORIES),
};

// Sermon Service
export const sermonService = {
  // Public endpoints
  getAll: (params = '') => apiClient.get(`${FRONTEND_ENDPOINTS.PUBLIC.SERMONS}${params}`),
  getFeatured: (limit = 3) => apiClient.get(`${FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FEATURED}&limit=${limit}`),
  getLiveStatus: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_LIVE),
  getCategories: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_CATEGORIES),
  getFavorites: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FAVORITES),
  addFavorite: (sermonId) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FAVORITE_ACTION(sermonId), { sermonId }),
  removeFavorite: (sermonId) => apiClient.delete(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FAVORITE_ACTION(sermonId)),

  // Admin endpoints
  create: (sermonData) => apiClient.post(FRONTEND_ENDPOINTS.ADMIN.SERMONS.CREATE, sermonData),
  update: (id, sermonData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.SERMONS.UPDATE(id), sermonData),
  delete: (id) => apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.SERMONS.DELETE(id)),
  getStats: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.SERMONS.STATS),
  startLive: () => apiClient.post(FRONTEND_ENDPOINTS.ADMIN.SERMONS.LIVE_START),
  stopLive: () => apiClient.post(FRONTEND_ENDPOINTS.ADMIN.SERMONS.LIVE_STOP),
};

// Event Service
export const eventService = {
  // Public endpoints
  getAll: (params = '') => apiClient.get(`${FRONTEND_ENDPOINTS.PUBLIC.EVENTS}${params}`),
  getUpcoming: (limit = 3) => apiClient.get(`${FRONTEND_ENDPOINTS.PUBLIC.EVENTS_UPCOMING}&limit=${limit}`),
  getUserRsvps: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.USER_RSVPS),
  getUserFavorites: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.USER_FAVORITES),
  rsvp: (eventId) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.EVENT_RSVP(eventId)),
  cancelRsvp: (eventId) => apiClient.delete(FRONTEND_ENDPOINTS.PUBLIC.EVENT_RSVP(eventId)),
  addFavorite: (eventId) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.EVENT_FAVORITE(eventId)),
  removeFavorite: (eventId) => apiClient.delete(FRONTEND_ENDPOINTS.PUBLIC.EVENT_FAVORITE(eventId)),

  // Admin endpoints
  create: (eventData) => apiClient.post(FRONTEND_ENDPOINTS.ADMIN.EVENTS.CREATE, eventData),
  update: (id, eventData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.EVENTS.UPDATE(id), eventData),
  delete: (id) => apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.EVENTS.DELETE(id)),
};

// Testimonial Service
export const testimonialService = {
  // Public endpoints
  getAll: (params = '') => apiClient.get(`${FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS}${params}`),
  getApproved: (limit = 6) => apiClient.get(`${FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS_APPROVED}&limit=${limit}`),
  getVideos: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS_VIDEOS),
  getCategories: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS_CATEGORIES),
  submit: (testimonialData) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS, testimonialData),

  // Admin endpoints
  create: (testimonialData) => apiClient.post(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.CREATE, testimonialData),
  update: (id, testimonialData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.UPDATE(id), testimonialData),
  delete: (id) => apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.DELETE(id)),
  getAllAdmin: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.ALL),
  getStats: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.STATS),
};

// Prayer Service
export const prayerService = {
  // Public endpoints
  getAll: (page = 1, limit = 10) => apiClient.get(`${FRONTEND_ENDPOINTS.PUBLIC.PRAYERS}?page=${page}&limit=${limit}`),
  getTeam: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.PRAYERS_TEAM),
  getMeetings: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.PRAYERS_MEETINGS),
  submit: (prayerData) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.PRAYERS, prayerData),
  prayForRequest: (prayerId) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.PRAYER_ACTION(prayerId)),

  // Admin endpoints
  update: (id, prayerData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.PRAYERS.UPDATE(id), prayerData),
  delete: (id) => apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.PRAYERS.DELETE(id)),
  getAllAdmin: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.PRAYERS.ALL),
  getStats: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.PRAYERS.STATS),
};

// Blog Service
export const blogService = {
  // Public endpoints
  getAll: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.BLOG),
  getCategories: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.BLOG_CATEGORIES),
  getFavorites: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.BLOG_FAVORITES),
  addFavorite: (postId) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.BLOG_FAVORITE_ACTION(postId), { postId }),
  removeFavorite: (postId) => apiClient.delete(FRONTEND_ENDPOINTS.PUBLIC.BLOG_FAVORITE_ACTION(postId)),
  subscribeNewsletter: (email) => apiClient.post('/newsletter/subscribe', { email }),

  // Admin endpoints
  create: (postData) => apiClient.post(FRONTEND_ENDPOINTS.ADMIN.BLOG.CREATE, postData),
  update: (id, postData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.BLOG.UPDATE(id), postData),
  delete: (id) => apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.BLOG.DELETE(id)),
  getAllAdmin: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.BLOG.ALL),
  getCategoriesAdmin: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.BLOG.CATEGORIES),
};

// Donation Service
export const donationService = {
  // Public endpoints
  getUserDonations: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.DONATIONS),
  createDonation: (donationData) => apiClient.post(PAYMENT_ENDPOINTS.CREATE_DONATION, donationData),
  downloadReceipt: (donationId) => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.RECEIPT(donationId), { responseType: 'blob' }),

  // Admin endpoints
  getAll: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.ALL),
  update: (id, donationData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.UPDATE(id), donationData),
  getStats: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.STATS),
  getRecent: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.RECENT),
  exportDonations: (format = 'csv') => apiClient.get(`${FRONTEND_ENDPOINTS.ADMIN.DONATIONS.EXPORT}?format=${format}`, { responseType: 'blob' }),
};

// User Service
export const userService = {
  // Admin endpoints
  getAll: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.USERS.BASE),
  create: (userData) => apiClient.post(FRONTEND_ENDPOINTS.ADMIN.USERS.CREATE, userData),
  update: (id, userData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.USERS.UPDATE(id), userData),
  delete: (id) => apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.USERS.DELETE(id)),
  getRoles: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.USERS.ROLES),
};

// Auth Service
export const authService = {
  login: (credentials) => apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials),
  register: (userData) => apiClient.post(AUTH_ENDPOINTS.REGISTER, userData),
  forgotPassword: (email) => apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email }),
  resetPassword: (token, newPassword) => apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, { token, newPassword }),
  verifyEmail: (token) => apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, { token }),
  resendVerification: (email) => apiClient.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email }),
  socialLogin: (provider) => window.location.href = AUTH_ENDPOINTS.SOCIAL_LOGIN(provider),
};

// Utility Services
export const utilityService = {
  getServiceTimes: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERVICE_TIMES),
  getChurchStats: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.CHURCH_STATS),
  getHeroContent: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.HERO_CONTENT),
  getLiveStatus: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.LIVE_STATUS),
};

export default {
  ministryService,
  sermonService,
  eventService,
  testimonialService,
  prayerService,
  blogService,
  donationService,
  userService,
  authService,
  utilityService,
};