// services/apiService.js
import { apiClient } from '../utils/api';
import { FRONTEND_ENDPOINTS, AUTH_ENDPOINTS, PAYMENT_ENDPOINTS } from '../constants/API';

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
  getAll: (params = {}) => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS, { params }),
  getFeatured: (limit = 3) => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FEATURED, { params: { limit } }),
  getLiveStatus: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_LIVE),
  getCategories: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_CATEGORIES),
  getFavorites: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FAVORITES),
  addFavorite: (sermonId) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FAVORITE_ACTION(sermonId)),
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
  getAll: (params = {}) => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.EVENTS, { params }),
  getUpcoming: (limit = 3) => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.EVENTS_UPCOMING, { params: { limit } }),
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
  getAll: (params = {}) => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS, { params }),
  getApproved: (limit = 6) => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS_APPROVED, { params: { limit } }),
  getVideos: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS_VIDEOS),
  getCategories: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS_CATEGORIES),
  submit: (testimonialData) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS, testimonialData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Admin endpoints
  getAllAdmin: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.ALL),
  create: (testimonialData) => apiClient.post(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.CREATE, testimonialData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, testimonialData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.UPDATE(id), testimonialData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.DELETE(id)),
  getStats: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.STATS),
};

// Prayer Service
export const prayerService = {
  // Public endpoints
  getAll: (page = 1, limit = 10) => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.PRAYERS, { params: { page, limit } }),
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
  getAll: (params = {}) => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.BLOG, { params }),
  getCategories: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.BLOG_CATEGORIES),
  getFavorites: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.BLOG_FAVORITES),
  addFavorite: (postId) => apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.BLOG_FAVORITE_ACTION(postId)),
  removeFavorite: (postId) => apiClient.delete(FRONTEND_ENDPOINTS.PUBLIC.BLOG_FAVORITE_ACTION(postId)),
  subscribeNewsletter: (email) => apiClient.post('/api/blog/newsletter/subscribe', { email }),

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
  createPaymentIntent: (intentData) => apiClient.post(PAYMENT_ENDPOINTS.CREATE_PAYMENT_INTENT, intentData) .then(response => {
        console.log("API Response:", response);
        return response.data; 
      }),
  confirmPayment: (confirmationData) => apiClient.post(PAYMENT_ENDPOINTS.CONFIRM_PAYMENT, confirmationData),
  downloadReceipt: (donationId) => apiClient.get(PAYMENT_ENDPOINTS.DONATIONS_RECEIPT(donationId), { responseType: 'blob' }),

  // Admin endpoints
  getAll: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.BASE),
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

// Volunteer Service
export const volunteerService = {
  // Admin endpoints
  getAll: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.VOLUNTEERS.ALL),
  getStats: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.VOLUNTEERS.STATS),
  getById: (id) => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.VOLUNTEERS.BY_ID(id)),
  updateStatus: (id, statusData) => apiClient.put(FRONTEND_ENDPOINTS.ADMIN.VOLUNTEERS.UPDATE_STATUS(id), statusData),
  
  // User endpoints
  getUserApplications: () => apiClient.get('/api/volunteers/user/applications'),
  getMinistryVolunteers: (ministryId) => apiClient.get(`/api/volunteers/ministry/${ministryId}`),
};

// Auth Service
export const authService = {
  login: (credentials) => apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials),
  register: (userData) => apiClient.post(AUTH_ENDPOINTS.REGISTER, userData),
  validateResetToken: (token) => apiClient.post(AUTH_ENDPOINTS.VALIDATE_RESET_TOKEN, { token }),
  changePassword: (passwordData) => apiClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData),
  forgotPassword: (email) => apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email }),
  resetPassword: (token, newPassword) => apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, { token, newPassword }),
  verifyEmail: (token) => apiClient.get(`${AUTH_ENDPOINTS.VERIFY_EMAIL}/${token}`),
  resendVerification: (email) => apiClient.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email }),
  getCurrentUser: () => apiClient.get(AUTH_ENDPOINTS.ME),
  logout: () => apiClient.post(AUTH_ENDPOINTS.LOGOUT),
  socialLogin: (provider, token) => apiClient.post(`/auth/social/${provider}`, { token }),
  validateSocialToken: (provider, token) => apiClient.post(`/auth/social/validate/${provider}`, { token })};

// Utility Services
export const utilityService = {
  getServiceTimes: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERVICE_TIMES),
  getChurchStats: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.CHURCH_STATS),
  getHeroContent: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.HERO_CONTENT),
  getLiveStatus: () => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.LIVE_STATUS),
  trackEvent: (eventData) => apiClient.post('/api/analytics/track', eventData),
  getDashboardStats: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DASHBOARD.STATS),
  getRecentActivity: () => apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DASHBOARD.ACTIVITY),
};

export const socialAuthService = {
  // OAuth Initiation (redirects)
  googleLogin: () => { window.location.href = `${import.meta.env.VITE_API_URL}${FRONTEND_ENDPOINTS.SOCIAL.GOOGLE}`; },
  facebookLogin: () => { window.location.href = `${import.meta.env.VITE_API_URL}${FRONTEND_ENDPOINTS.SOCIAL.FACEBOOK}`; },

  // Token Validation
  validateGoogleToken: (token) => apiClient.post(FRONTEND_ENDPOINTS.SOCIAL.VALIDATE_GOOGLE, { token }),
  validateFacebookToken: (token) => apiClient.post(FRONTEND_ENDPOINTS.SOCIAL.VALIDATE_FACEBOOK, { token }),

  // Social Account Management
  linkAccount: (linkData) => apiClient.post(FRONTEND_ENDPOINTS.SOCIAL.LINK_ACCOUNT, linkData),
  unlinkAccount: (provider) => apiClient.delete(FRONTEND_ENDPOINTS.SOCIAL.UNLINK_ACCOUNT(provider)),
  getLinkedAccounts: () => apiClient.get(FRONTEND_ENDPOINTS.SOCIAL.GET_ACCOUNTS),

  // Handle OAuth callback
  handleOAuthCallback: () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      token: urlParams.get('token'),
      userId: urlParams.get('userId'),
      error: urlParams.get('error')
    };
  }
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
  volunteerService,
  authService,
  utilityService,
  socialAuthService,

};

