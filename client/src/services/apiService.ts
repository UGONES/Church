// services/apiService.ts
import { apiClient } from '../utils/api';
import { FRONTEND_ENDPOINTS, AUTH_ENDPOINTS, PAYMENT_ENDPOINTS, SOCIAL_AUTH_ENDPOINTS } from '../constants/API';

// Add type definitions for Vite env variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Interfaces for data types
export interface MinistryData {
  [key: string]: any;
}

export interface SermonData {
  [key: string]: any;
}

export interface EventData {
  [key: string]: any;
}

export interface TestimonialData {
  [key: string]: any;
}

export interface PrayerData {
  [key: string]: any;
}

export interface BlogPostData {
  [key: string]: any;
}

export interface DonationData {
  [key: string]: any;
}

export interface UserData {
  [key: string]: any;
}

export interface VolunteerData {
  [key: string]: any;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface PaymentIntentData {
  [key: string]: any;
}

export interface PaymentConfirmationData {
  [key: string]: any;
}

export interface SocialLinkData {
  provider: string;
  token: string;
}

export interface AnalyticsEventData {
  [key: string]: any;
}

// Ministry Service
export const ministryService = {
  // Public endpoints
  getAll: (): Promise<any> => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES),
  getVolunteerOpportunities: (): Promise<any> => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES_VOLUNTEER),
  getUserMinistries: (): Promise<any> => apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES_USER),
  volunteer: (id: string, formData: FormData): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES_VOLUNTEER_ACTION(id), formData),
  contactLeaders: (id: string, message: string): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.MINISTRIES_CONTACT(id), { message }),

  // Admin endpoints
  create: (ministryData: MinistryData): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.CREATE, ministryData),
  update: (id: string, ministryData: MinistryData): Promise<any> => 
    apiClient.put(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.UPDATE(id), ministryData),
  delete: (id: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.DELETE(id)),
  getVolunteers: (id: string): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.VOLUNTEERS(id)),
  getStats: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.STATS),
  getCategories: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.MINISTRIES.CATEGORIES),
};

// Sermon Service
export const sermonService = {
  // Public endpoints
  getAll: (params: Record<string, any> = {}): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS, { params }),
  getFeatured: (limit: number = 3): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FEATURED, { params: { limit } }),
  getLiveStatus: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_LIVE),
  getCategories: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_CATEGORIES),
  getFavorites: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FAVORITES),
  addFavorite: (sermonId: string): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FAVORITE_ACTION(sermonId)),
  removeFavorite: (sermonId: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.PUBLIC.SERMONS_FAVORITE_ACTION(sermonId)),

  // Admin endpoints
  create: (sermonData: SermonData): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.ADMIN.SERMONS.CREATE, sermonData),
  update: (id: string, sermonData: SermonData): Promise<any> => 
    apiClient.put(FRONTEND_ENDPOINTS.ADMIN.SERMONS.UPDATE(id), sermonData),
  delete: (id: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.SERMONS.DELETE(id)),
  getStats: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.SERMONS.STATS),
  startLive: (): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.ADMIN.SERMONS.LIVE_START),
  stopLive: (): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.ADMIN.SERMONS.LIVE_STOP),
};

// Event Service
export const eventService = {
  // Public endpoints
  getAll: (params: Record<string, any> = {}): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.EVENTS, { params }),
  getUpcoming: (limit: number = 3): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.EVENTS_UPCOMING, { params: { limit } }),
  getUserRsvps: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.USER_RSVPS),
  getUserFavorites: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.USER_FAVORITES),
  rsvp: (eventId: string): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.EVENT_RSVP(eventId)),
  cancelRsvp: (eventId: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.PUBLIC.EVENT_RSVP(eventId)),
  addFavorite: (eventId: string): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.EVENT_FAVORITE(eventId)),
  removeFavorite: (eventId: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.PUBLIC.EVENT_FAVORITE(eventId)),

  // Admin endpoints
  create: (eventData: EventData): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.ADMIN.EVENTS.CREATE, eventData),
  update: (id: string, eventData: EventData): Promise<any> => 
    apiClient.put(FRONTEND_ENDPOINTS.ADMIN.EVENTS.UPDATE(id), eventData),
  delete: (id: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.EVENTS.DELETE(id)),
};

// Testimonial Service
export const testimonialService = {
  getAll: (params: Record<string, any> = {}): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS, { params }),
  getApproved: (limit: number = 6): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS_APPROVED, { params: { limit } }),
  getVideos: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS_VIDEOS),
  getCategories: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS_CATEGORIES),
  submit: (testimonialData: FormData): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.TESTIMONIALS, testimonialData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Admin endpoints
  getAllAdmin: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.ALL),
  create: (testimonialData: FormData): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.CREATE, testimonialData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  update: (id: string, testimonialData: FormData): Promise<any> => 
    apiClient.put(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.UPDATE(id), testimonialData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.DELETE(id)),
  getStats: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.TESTIMONIALS.STATS),
};

// Prayer Service
export const prayerService = {
  // Public endpoints
  getAll: (page: number = 1, limit: number = 10): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.PRAYERS, { params: { page, limit } }),
  getTeam: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.PRAYERS_TEAM),
  getMeetings: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.PRAYERS_MEETINGS),
  submit: (prayerData: PrayerData): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.PRAYERS, prayerData),
  prayForRequest: (prayerId: string): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.PRAYER_ACTION(prayerId)),

  // Admin endpoints
  update: (id: string, prayerData: PrayerData): Promise<any> => 
    apiClient.put(FRONTEND_ENDPOINTS.ADMIN.PRAYERS.UPDATE(id), prayerData),
  delete: (id: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.PRAYERS.DELETE(id)),
  getAllAdmin: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.PRAYERS.ALL),
  getStats: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.PRAYERS.STATS),
};

// Blog Service
export const blogService = {
  // Public endpoints
  getAll: (params: Record<string, any> = {}): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.BLOG, { params }),
  getCategories: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.BLOG_CATEGORIES),
  getFavorites: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.BLOG_FAVORITES),
  addFavorite: (postId: string): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.PUBLIC.BLOG_FAVORITE_ACTION(postId)),
  removeFavorite: (postId: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.PUBLIC.BLOG_FAVORITE_ACTION(postId)),
  subscribeNewsletter: (email: string): Promise<any> => 
    apiClient.post('/api/blog/newsletter/subscribe', { email }),

  // Admin endpoints
  create: (postData: BlogPostData): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.ADMIN.BLOG.CREATE, postData),
  update: (id: string, postData: BlogPostData): Promise<any> => 
    apiClient.put(FRONTEND_ENDPOINTS.ADMIN.BLOG.UPDATE(id), postData),
  delete: (id: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.BLOG.DELETE(id)),
  getAllAdmin: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.BLOG.ALL),
  getCategoriesAdmin: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.BLOG.CATEGORIES),
};

// Donation Service
export const donationService = {
  // Public endpoints
  getUserDonations: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.DONATIONS),
  createDonation: (donationData: DonationData): Promise<any> => 
    apiClient.post(PAYMENT_ENDPOINTS.CREATE_DONATION, donationData),
  createPaymentIntent: (intentData: PaymentIntentData): Promise<any> => 
    apiClient.post(PAYMENT_ENDPOINTS.CREATE_PAYMENT_INTENT, intentData).then(response => {
      console.log("API Response:", response);
      return response.data;
    }),
  confirmPayment: (confirmationData: PaymentConfirmationData): Promise<any> => 
    apiClient.post(PAYMENT_ENDPOINTS.CONFIRM_PAYMENT, confirmationData),
  downloadReceipt: (donationId: string): Promise<any> => 
    apiClient.get(PAYMENT_ENDPOINTS.DONATIONS_RECEIPT(donationId), { responseType: 'blob' }),

  // Admin endpoints
  getAll: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.BASE),
  update: (id: string, donationData: DonationData): Promise<any> => 
    apiClient.put(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.UPDATE(id), donationData),
  getStats: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.STATS),
  getRecent: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DONATIONS.RECENT),
  exportDonations: (format: string = 'csv'): Promise<any> => 
    apiClient.get(`${FRONTEND_ENDPOINTS.ADMIN.DONATIONS.EXPORT}?format=${format}`, { responseType: 'blob' }),
};

// User Service
export const userService = {
  // Admin endpoints
  getAll: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.USERS.BASE),
  create: (userData: UserData): Promise<any> => 
    apiClient.post(FRONTEND_ENDPOINTS.ADMIN.USERS.CREATE, userData),
  update: (id: string, userData: UserData): Promise<any> => 
    apiClient.put(FRONTEND_ENDPOINTS.ADMIN.USERS.UPDATE(id), userData),
  delete: (id: string): Promise<any> => 
    apiClient.delete(FRONTEND_ENDPOINTS.ADMIN.USERS.DELETE(id)),
  getRoles: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.USERS.ROLES),
};

// Volunteer Service
export const volunteerService = {
  // Admin endpoints
  getAll: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.VOLUNTEERS.ALL),
  getStats: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.VOLUNTEERS.STATS),
  getById: (id: string): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.VOLUNTEERS.BY_ID(id)),
  updateStatus: (id: string, statusData: any): Promise<any> => 
    apiClient.put(FRONTEND_ENDPOINTS.ADMIN.VOLUNTEERS.UPDATE_STATUS(id), statusData),
  
  // User endpoints
  getUserApplications: (): Promise<any> => 
    apiClient.get('/api/volunteers/user/applications'),
  getMinistryVolunteers: (ministryId: string): Promise<any> => 
    apiClient.get(`/api/volunteers/ministry/${ministryId}`),
};

// Auth Service
export const authService = {
  login: (credentials: AuthCredentials): Promise<any> => 
    apiClient.post(AUTH_ENDPOINTS.LOGIN, credentials),
  register: (userData: UserData): Promise<any> => 
    apiClient.post(AUTH_ENDPOINTS.REGISTER, userData),
  validateResetToken: (token: string): Promise<any> => 
    apiClient.post(AUTH_ENDPOINTS.VALIDATE_RESET_TOKEN, { token }),
  changePassword: (passwordData: PasswordData): Promise<any> => 
    apiClient.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData),
  forgotPassword: (email: string): Promise<any> => 
    apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email }),
  resetPassword: (token: string, newPassword: string): Promise<any> => 
    apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, { token, newPassword }),
  verifyEmail: (token: string): Promise<any> => 
    apiClient.get(`${AUTH_ENDPOINTS.VERIFY_EMAIL}/${token}`),
  resendVerification: (email: string): Promise<any> => 
    apiClient.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email }),
  getCurrentUser: (): Promise<any> => 
    apiClient.get(AUTH_ENDPOINTS.ME),
  logout: (): Promise<any> => 
    apiClient.post(AUTH_ENDPOINTS.LOGOUT),
  socialLogin: (provider: string, token: string): Promise<any> => 
    apiClient.post(`/auth/social/${provider}`, { token }),
  validateSocialToken: (provider: string, token: string): Promise<any> => 
    apiClient.post(`/auth/social/validate/${provider}`, { token })
};

// Utility Services
export const utilityService = {
  getServiceTimes: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.SERVICE_TIMES),
  getChurchStats: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.CHURCH_STATS),
  getHeroContent: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.HERO_CONTENT),
  getLiveStatus: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.PUBLIC.LIVE_STATUS),
  trackEvent: (eventData: AnalyticsEventData): Promise<any> => 
    apiClient.post('/api/analytics/track', eventData),
  getDashboardStats: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DASHBOARD.STATS),
  getRecentActivity: (): Promise<any> => 
    apiClient.get(FRONTEND_ENDPOINTS.ADMIN.DASHBOARD.ACTIVITY),
};

export const socialAuthService = {
  // OAuth Initiation (redirects)
  googleLogin: (): void => { 
    window.location.href = `${import.meta.env.VITE_API_URL}${SOCIAL_AUTH_ENDPOINTS.GOOGLE}`; 
  },
  facebookLogin: (): void => { 
    window.location.href = `${import.meta.env.VITE_API_URL}${SOCIAL_AUTH_ENDPOINTS.FACEBOOK}`; 
  },

  // Token Validation
  validateGoogleToken: (token: string): Promise<any> => 
    apiClient.post(SOCIAL_AUTH_ENDPOINTS.VALIDATE_GOOGLE, { token }),
  validateFacebookToken: (token: string): Promise<any> => 
    apiClient.post(SOCIAL_AUTH_ENDPOINTS.VALIDATE_FACEBOOK, { token }),

  // Social Account Management
  linkAccount: (linkData: SocialLinkData): Promise<any> => 
    apiClient.post(SOCIAL_AUTH_ENDPOINTS.LINK_ACCOUNT, linkData),
  unlinkAccount: (provider: string): Promise<any> => 
    apiClient.delete(SOCIAL_AUTH_ENDPOINTS.UNLINK_ACCOUNT(provider)),
  getLinkedAccounts: (): Promise<any> => 
    apiClient.get(SOCIAL_AUTH_ENDPOINTS.GET_ACCOUNTS),

  // Handle OAuth callback
  handleOAuthCallback: (): { token: string | null; userId: string | null; error: string | null } => {
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