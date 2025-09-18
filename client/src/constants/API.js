// constants/endpoints.js

// Your existing admin endpoints (updated to match actual backend)
export const ADMIN_ENDPOINTS = {
  DASHBOARD: {
    STATS: '/admin/dashboard/stats',
    ACTIVITY: '/admin/activity/recent',
  },
  USERS: {
    BASE: '/users/admin',
    CREATE: '/users/admin/create',
    UPDATE: (id) => `/users/admin/update/${id}`,
    DELETE: (id) => `/users/admin/delete/${id}`,
    ROLES: '/users/admin/roles',
  },
  DONATIONS: {
    BASE: '/donations/admin/all',
    UPDATE: (id) => `/donations/admin/update/${id}`,
    STATS: '/donations/admin/stats',
    RECENT: '/donations/admin/recent',
    EXPORT: '/donations/admin/export',
  },
  PRAYER_REQUESTS: {
    BASE: '/prayers/admin/all',
    UPDATE: (id) => `/prayers/admin/update/${id}`,
    DELETE: (id) => `/prayers/admin/delete/${id}`,
    STATS: '/prayers/admin/stats',
  },
  EVENTS: {
    BASE: '/events',
    CREATE: '/events/admin/create',
    UPDATE: (id) => `/events/admin/update/${id}`,
    DELETE: (id) => `/events/admin/delete/${id}`,
  },
  SERMONS: {
    BASE: '/sermons',
    CREATE: '/sermons/admin',
    UPDATE: (id) => `/sermons/admin/${id}`,
    DELETE: (id) => `/sermons/admin/${id}`,
    STATS: '/sermons/admin/stats',
    LIVE: '/sermons/live',
    LIVE_START: '/sermons/admin/live/start',
    LIVE_STOP: '/sermons/admin/live/stop',
  },
  BLOG: {
    BASE: '/blog/admin/all',
    CREATE: '/blog/admin/create',
    UPDATE: (id) => `/blog/admin/update/${id}`,
    DELETE: (id) => `/blog/admin/delete/${id}`,
    CATEGORIES: '/blog/admin/categories',
  },
  MINISTRIES: {
    BASE: '/ministries',
    CREATE: '/ministries/admin/create',
    UPDATE: (id) => `/ministries/admin/update/${id}`,
    DELETE: (id) => `/ministries/admin/delete/${id}`,
    CATEGORIES: '/ministries/categories',
    VOLUNTEERS: (id) => `/ministries/admin/${id}/volunteers`,
    STATS: '/ministries/admin/stats',
  },
  TESTIMONIALS: {
    ALL: '/testimonials/admin/all',
    CREATE: '/testimonials/admin/create',
    UPDATE: (id) => `/testimonials/admin/update/${id}`,
    DELETE: (id) => `/testimonials/admin/delete/${id}`,
    STATS: '/testimonials/admin/stats'
  },
  SETTINGS: {
    BASE: '/settings',
    UPDATE: '/settings/update',
    RESET: '/settings/reset',
  },
  VOLUNTEERS: {
    BASE: '/volunteers/admin/all',
    STATS: '/volunteers/admin/stats',
    BY_ID: (id) => `/volunteers/admin/${id}`,
    UPDATE_STATUS: (id) => `/volunteers/admin/${id}/status`,
  }
};

// Frontend-friendly endpoints that map to your actual backend endpoints
export const FRONTEND_ENDPOINTS = {

  // Public read endpoints (for pages)
  PUBLIC: {
    MINISTRIES: '/api/ministries',
    MINISTRIES_VOLUNTEER: '/api/ministries/volunteer-opportunities',
    MINISTRIES_USER: '/api/ministries/user/ministries',
    MINISTRIES_VOLUNTEER_ACTION: (id) => `/api/ministries/${id}/volunteer`,
    MINISTRIES_CONTACT: (id) => `/api/ministries/${id}/contact`,

    SERMONS: '/api/sermons',
    SERMONS_FEATURED: '/api/sermons/featured',
    SERMONS_LIVE: '/api/sermons/live',
    SERMONS_CATEGORIES: '/api/sermons/categories',
    SERMONS_FAVORITES: '/api/sermons/favorites',
    SERMONS_FAVORITE_ACTION: (id) => `/api/sermons/favorites/${id}`,

    EVENTS: '/api/events',
    EVENTS_UPCOMING: '/api/events/upcoming',
    USER_RSVPS: '/api/events/user/rsvps',
    USER_FAVORITES: '/api/events/user/favorites',
    EVENT_RSVP: (id) => `/api/events/${id}/rsvp`,
    EVENT_FAVORITE: (id) => `/api/events/${id}/favorite`,

    TESTIMONIALS: '/testimonials',
    TESTIMONIALS_APPROVED: '/testimonials/approved',
    TESTIMONIALS_VIDEOS: '/testimonials/videos',
    TESTIMONIALS_CATEGORIES: '/testimonials/categories',

    PRAYERS: '/api/prayers',
    PRAYERS_TEAM: '/api/prayers/team',
    PRAYERS_MEETINGS: '/api/prayers/meetings',
    PRAYER_ACTION: (id) => `/api/prayers/${id}/pray`,

    BLOG: '/api/blog/posts',
    BLOG_CATEGORIES: '/api/blog/categories',
    BLOG_FAVORITES: '/api/blog/favorites',
    BLOG_FAVORITE_ACTION: (id) => `/api/blog/favorites/${id}`,

    SERVICE_TIMES: '/api/analytics/service-times',
    CHURCH_STATS: '/api/analytics/stats',
    HERO_CONTENT: '/api/analytics/hero-content',
    LIVE_STATUS: '/api/analytics/live-status',

    DONATIONS: '/api/donations',
    DONATIONS_PAYMENT_INTENT: '/api/donations/payment-intent',

    SOCIAL_SUCCESS: '/auth/success',
    SOCIAL_FAILURE: '/login?error=auth_failed'
  },

  // Admin write endpoints (mapped to your actual backend endpoints)
  ADMIN: {
    MINISTRIES: {
      BASE: ADMIN_ENDPOINTS.MINISTRIES.BASE,
      CREATE: ADMIN_ENDPOINTS.MINISTRIES.CREATE,
      UPDATE: ADMIN_ENDPOINTS.MINISTRIES.UPDATE,
      DELETE: ADMIN_ENDPOINTS.MINISTRIES.DELETE,
      CATEGORIES: ADMIN_ENDPOINTS.MINISTRIES.CATEGORIES,
      VOLUNTEERS: ADMIN_ENDPOINTS.MINISTRIES.VOLUNTEERS,
      STATS: ADMIN_ENDPOINTS.MINISTRIES.STATS,
    },
    SERMONS: {
      CREATE: ADMIN_ENDPOINTS.SERMONS.CREATE,
      UPDATE: ADMIN_ENDPOINTS.SERMONS.UPDATE,
      DELETE: ADMIN_ENDPOINTS.SERMONS.DELETE,
      STATS: ADMIN_ENDPOINTS.SERMONS.STATS,
      LIVE: ADMIN_ENDPOINTS.SERMONS.LIVE,
      LIVE_START: ADMIN_ENDPOINTS.SERMONS.LIVE_START,
      LIVE_STOP: ADMIN_ENDPOINTS.SERMONS.LIVE_STOP,
    },
    EVENTS: {
      CREATE: ADMIN_ENDPOINTS.EVENTS.CREATE,
      UPDATE: ADMIN_ENDPOINTS.EVENTS.UPDATE,
      DELETE: ADMIN_ENDPOINTS.EVENTS.DELETE,
    },
    TESTIMONIALS: {
      CREATE: ADMIN_ENDPOINTS.TESTIMONIALS.CREATE,
      UPDATE: ADMIN_ENDPOINTS.TESTIMONIALS.UPDATE,
      DELETE: ADMIN_ENDPOINTS.TESTIMONIALS.DELETE,
      ALL: ADMIN_ENDPOINTS.TESTIMONIALS.BASE,
      STATS: ADMIN_ENDPOINTS.TESTIMONIALS.STATS,
    },
    BLOG: {
      CREATE: ADMIN_ENDPOINTS.BLOG.CREATE,
      UPDATE: ADMIN_ENDPOINTS.BLOG.UPDATE,
      DELETE: ADMIN_ENDPOINTS.BLOG.DELETE,
      CATEGORIES: ADMIN_ENDPOINTS.BLOG.CATEGORIES,
      ALL: ADMIN_ENDPOINTS.BLOG.BASE,
    },
    PRAYERS: {
      UPDATE: ADMIN_ENDPOINTS.PRAYER_REQUESTS.UPDATE,
      DELETE: ADMIN_ENDPOINTS.PRAYER_REQUESTS.DELETE,
      ALL: ADMIN_ENDPOINTS.PRAYER_REQUESTS.BASE,
      STATS: ADMIN_ENDPOINTS.PRAYER_REQUESTS.STATS,
    },
    DONATIONS: {
      BASE: ADMIN_ENDPOINTS.DONATIONS.BASE,
      UPDATE: ADMIN_ENDPOINTS.DONATIONS.UPDATE,
      STATS: ADMIN_ENDPOINTS.DONATIONS.STATS,
      RECENT: ADMIN_ENDPOINTS.DONATIONS.RECENT,
      ALL: ADMIN_ENDPOINTS.DONATIONS.BASE,
      EXPORT: ADMIN_ENDPOINTS.DONATIONS.EXPORT,
      RECEIPT: (id) => `/api/donations/receipt/${id}`,
    },
    USERS: {
      BASE: ADMIN_ENDPOINTS.USERS.BASE,
      CREATE: ADMIN_ENDPOINTS.USERS.CREATE,
      UPDATE: ADMIN_ENDPOINTS.USERS.UPDATE,
      DELETE: ADMIN_ENDPOINTS.USERS.DELETE,
      ROLES: ADMIN_ENDPOINTS.USERS.ROLES,
    },
    VOLUNTEERS: {
      ALL: ADMIN_ENDPOINTS.VOLUNTEERS.BASE,
      STATS: ADMIN_ENDPOINTS.VOLUNTEERS.STATS,
      BY_ID: ADMIN_ENDPOINTS.VOLUNTEERS.BY_ID,
      UPDATE_STATUS: ADMIN_ENDPOINTS.VOLUNTEERS.UPDATE_STATUS,
    },
    DASHBOARD: {
      STATS: ADMIN_ENDPOINTS.DASHBOARD.STATS,
      ACTIVITY: ADMIN_ENDPOINTS.DASHBOARD.ACTIVITY,
    }
  },
  /*    SOCIAL: SOCIAL_AUTH_ENDPOINTS,*/

};

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VALIDATE_RESET_TOKEN: '/auth/validate-reset-token',
  CHANGE_PASSWORD: '/auth/change-password',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  SOCIAL_LOGIN: (provider) => `/auth/${provider}`,
  ME: '/auth/me',
  LOGOUT: '/auth/logout',
};

// Payment endpoints
export const PAYMENT_ENDPOINTS = {
  CREATE_DONATION: '/donations/create',
  CREATE_PAYMENT_INTENT: '/donations/create-payment-intent',
  CONFIRM_PAYMENT: '/donations/confirm-payment',
  DONATIONS_RECEIPT: (id) => `/api/donations/receipt/${id}`,
};

// constants/endpoints.js - Add to your existing file

export const SOCIAL_AUTH_ENDPOINTS = {
  // OAuth Initiation (redirect to backend)
  GOOGLE: '/auth/social/google',
  FACEBOOK: '/auth/social/facebook',

  // Social Account Management (API calls)
  LINK_ACCOUNT: '/auth/social/link',
  UNLINK_ACCOUNT: (provider) => `/auth/social/unlink/${provider}`,
  GET_ACCOUNTS: '/auth/social/accounts',

  // Direct token validation (for client-side auth)
  VALIDATE_GOOGLE: '/auth/social/validate/google',
  VALIDATE_FACEBOOK: '/auth/social/validate/facebook',

  // Frontend Redirect URLs
  SUCCESS_REDIRECT: (token, userId) =>
    `${window.location.origin}/auth/success?token=${token}&userId=${userId}`,
  FAILURE_REDIRECT: (error) =>
    `${window.location.origin}/login?error=${error}`
};

