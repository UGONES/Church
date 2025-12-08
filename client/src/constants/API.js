// constants/endpoints.js

// =============== USER ENDPOINTS ===============
export const USER_ENDPOINTS = {
  ME: "/users/me", // renamed USERS -> ME for clarity
  PROFILE: "/users/me/full-profile",
  UPDATE_PROFILE: "/users/profile/update",
  DASHBOARD: "/users/dashboard",
  AVATAR: "/users/upload-avatar",
  COVERPHOTO: "/users/upload-cover",
  FAVORITES: "/users/favorites",

  FAMILY: {
    BASE: "/users/family",
    MEMBER: (id) => `/users/family/${id}`,
  },

  // Only keep if backend supports them
  COMMUNICATION: "/users/communication",       
  DONATIONS: "/users/donations",                
  VOLUNTEER_APPLICATIONS: "/users/volunteers/applications", 

  // Admin user management
  ADMIN: {
    BASE: "/users/admin",
    CREATE: "/users/admin/create",
    UPDATE: (id) => `/users/admin/update/${id}`,
    DELETE: (id) => `/users/admin/delete/${id}`,
    ACTIVATE: (id) => `/users/admin/activate/${id}`,   
    DEACTIVATE: (id) => `/users/admin/deactivate/${id}`, 
    ROLES: "/users/admin/roles",
    MEMBERSHIP_STATUSES: "/users/admin/membership-statuses",
  },
};

// =============== ADMIN ENDPOINTS ===============
export const ADMIN_ENDPOINTS = {
  DASHBOARD: {
    STATS: "/analytics/admin/dashboard/stats",
    ACTIVITY: "/analytics/admin/activity/recent",
  },
  USERS: {
    BASE: "/users/admin",
    STATS: "/analytics/admin/users/stats",
    CREATE: USER_ENDPOINTS.ADMIN.CREATE,
    UPDATE: USER_ENDPOINTS.ADMIN.UPDATE,
    DELETE: USER_ENDPOINTS.ADMIN.DELETE,
    ROLES: USER_ENDPOINTS.ADMIN.ROLES,
  },
  DONATIONS: {
    BASE: "/donations/admin/all",
    UPDATE: (id) => `/donations/admin/update/${id}`,
    STATS: "/donations/admin/stats",
    RECENT: "/donations/admin/recent",
    EXPORT: "/donations/admin/export",
  },
  PRAYER_REQUESTS: {
    BASE: "/prayers/admin/all",
    UPDATE: (id) => `/prayers/admin/update/${id}`,
    DELETE: (id) => `/prayers/admin/delete/${id}`,
    STATS: "/prayers/admin/stats",
  },
  EVENTS: {
    BASE: "/events",
    CREATE: "/events/admin/create",
    UPDATE: (id) => `/events/admin/update/${id}`,
    DELETE: (id) => `/events/admin/delete/${id}`,
  },
  SERMONS: {
    BASE: "/sermons",
    CREATE: "/sermons/admin",
    UPDATE: (id) => `/sermons/admin/${id}`,
    DELETE: (id) => `/sermons/admin/${id}`,
    STATS: "/sermons/admin/stats",
    LIVE: "/sermons/live",
    LIVE_START: (id) => `/sermons/admin/live/start${id}`,
    LIVE_STOP: (id)=> `/sermons/admin/live/stop${id}`,
  },
  BLOGS: {
    BASE: "/blogs/admin/all",
    CREATE: "/blogs/admin/create",
    UPDATE: (id) => `/blogs/admin/update/${id}`,
    DELETE: (id) => `/blogs/admin/delete/${id}`,
    CATEGORIES: "/blogs/admin/categories",
  },
  MINISTRIES: {
    BASE: "/ministries/admin",
    CREATE: "/ministries/admin/create",
    CATEGORIES: "/ministries/admin/categories",
    UPDATE: (id) => `/ministries/admin/update/${id}`,
    DELETE: (id) => `/ministries/admin/delete/${id}`,
    VOLUNTEERS: (id) => `/ministries/admin/${id}/volunteers`,
    STATS: "/ministries/admin/stats",
  },
  TESTIMONIALS: {
    ALL: "/testimonials/admin/all",
    CREATE: "/testimonials/admin/create",
    UPDATE: (id) => `/testimonials/admin/update/${id}`,
    DELETE: (id) => `/testimonials/admin/delete/${id}`,
    STATS: "/testimonials/admin/stats",
  },
  SETTINGS: {
    BASE: "/settings",
    UPDATE: "/settings/update",
    RESET: "/settings/reset",
  },
  VOLUNTEERS: {
    BASE: "/volunteers/admin/all",
    STATS: "/volunteers/admin/stats",
    BY_ID: (id) => `/volunteers/admin/${id}`,
    UPDATE_STATUS: (id) => `/volunteers/admin/${id}/status`,
  },
  CODES: {
    CODE: "/admin/codes",
    GENERATE_CODE: "/admin/generate-code",
  },
};

// =============== PUBLIC ENDPOINTS ===============
export const PUBLIC_ENDPOINTS = {
  MINISTRIES: "/ministries",
  MINISTRIES_VOLUNTEER: "/ministries/volunteer-opportunities",
  MINISTRIES_USER: "/ministries/user/ministries",
  MINISTRIES_VOLUNTEER_ACTION: (id) => `/ministries/${id}/volunteer`,
  MINISTRIES_CONTACT: (id) => `/ministries/${id}/contact`,
  MINISTRIES_CATEGORIES: "/ministries/categories",
  MINISTRIES_JOIN: "/ministries/join",

  SERMONS: "/sermons",
  SERMONS_FEATURED: "/sermons/featured",
  SERMONS_LIVE: "/sermons/live",
  SERMONS_CATEGORIES: "/sermons/categories",
  SERMONS_FAVORITES: "/sermons/favorites",
  SERMONS_FAVORITE_ACTION: (id) => `/sermons/favorites/${id}`,
  // SERMONS_STREAM_CONFIG: 

  EVENTS: "/events",
  EVENTS_UPCOMING: "/events/upcoming",
  USER_RSVPS: "/events/user/rsvps",
  USER_FAVORITES: "/events/user/favorites",
  EVENT_RSVP: (id) => `/events/${id}/rsvp`,
  EVENT_FAVORITE: (id) => `/events/${id}/favorite`,

  TESTIMONIALS: "/testimonials",
  TESTIMONIALS_APPROVED: "/testimonials/approved",
  TESTIMONIALS_VIDEOS: "/testimonials/videos",
  TESTIMONIALS_CATEGORIES: "/testimonials/categories",

  PRAYERS: "/prayers",
  PRAYERS_TEAM: "/prayers/team",
  PRAYERS_MEETINGS: "/prayers/meetings",
  PRAYER_ACTION: (id) => `/prayers/${id}/pray`,

  BLOGS: "/blogs/posts",
  BLOGS_CATEGORIES: "/blogs/categories",
  BLOGS_FAVORITES: "/blogs/favorites",
  BLOGS_FAVORITE_ACTION: (id) => `/blogs/favorites/${id}`,

  SERVICE_TIMES: "/analytics/service-times",
  CHURCH_STATS: "/analytics/stats",
  HERO_CONTENT: "/analytics/hero-content",
  LIVE_STATUS: "/analytics/live-status",

  DONATIONS: "/donations",
  DONATIONS_PAYMENT_INTENT: "/donations/payment-intent",

  SOCIAL_SUCCESS: "/auth/success",
  SOCIAL_FAILURE: "/login?error=auth_failed",
};

// =============== AUTH ENDPOINTS ===============
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password/",
  VERIFY_EMAIL: "/auth/verify-email/",
  RESEND_VERIFICATION: "/auth/resend-verification",
  ME: "/auth/me",
  LOGOUT: "/auth/logout",
  CLAIM_CODE: "/auth/claim-code",
  // Optional: only add these if you implement them server-side,
  CHANGE_PASSWORD: "/auth/change-password",
  VALIDATE_RESET_TOKEN: "/auth/validate-reset-token",
  // SOCIAL_LOGIN: (provider) => `/auth/social/${provider}`,
};

// =============== PAYMENT ENDPOINTS ===============
export const PAYMENT_ENDPOINTS = {
  CREATE_DONATION: "/donations/create",
  CREATE_PAYMENT_INTENT: "/donations/create-payment-intent",
  CONFIRM_PAYMENT: "/donations/confirm-payment",
  DONATIONS_RECEIPT: (id) => `/donations/receipt/${id}`,
};

// =============== SOCIAL ENDPOINTS ===============
export const SOCIAL_AUTH_ENDPOINTS = {
  GOOGLE: "/auth/social/google",
  FACEBOOK: "/auth/social/facebook",
  LINK_ACCOUNT: "/auth/social/link",
  UNLINK_ACCOUNT: (provider) => `/auth/social/unlink/${provider}`,
  GET_ACCOUNTS: "/auth/social/accounts",
  VALIDATE_GOOGLE: "/auth/social/validate/google",
  VALIDATE_FACEBOOK: "/auth/social/facebook",
  SUCCESS_REDIRECT: (token, userId) => `${window.location.origin}/auth/success?token=${token}&userId=${userId}`,
  FAILURE_REDIRECT: (error) => `${window.location.origin}/login?error=${error}`,
};
