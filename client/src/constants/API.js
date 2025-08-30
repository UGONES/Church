// constants/endpoints.js

// Your existing admin endpoints (don't change these)
export const ADMIN_ENDPOINTS = {
  DASHBOARD: {
    STATS: '/admin/dashboard/stats',
    ACTIVITY: '/admin/activity/recent',
  },
  USERS: {
    BASE: '/admin/users',
    CREATE: '/admin/users/create',
    UPDATE: (id) => `/admin/users/update/${id}`,
    DELETE: (id) => `/admin/users/delete/${id}`,
    ROLES: '/admin/users/roles',
  },
  DONATIONS: {
    BASE: '/admin/donations',
    UPDATE: (id) => `/admin/donations/update/${id}`,
  },
  PRAYER_REQUESTS: {
    BASE: '/admin/prayer-requests',
    UPDATE: (id) => `/admin/prayer-requests/update/${id}`,
    DELETE: (id) => `/admin/prayer-requests/delete/${id}`,
  },
  EVENTS: {
    BASE: '/admin/events',
    CREATE: '/admin/events/create',
    UPDATE: (id) => `/admin/events/update/${id}`,
    DELETE: (id) => `/admin/events/delete/${id}`,
  },
  SERMONS: {
    BASE: '/sermons',
    CREATE: '/sermons',
    UPDATE: (id) => `/sermons/${id}`,
    DELETE: (id) => `/sermons/${id}`,
    STATS: '/sermons/stats',
    LIVE: '/sermons/live',
    LIVE_START: '/sermons/live/start',
    LIVE_STOP: '/sermons/live/stop',
  },
  BLOG: {
    BASE: '/admin/blog',
    CREATE: '/admin/blog/create',
    UPDATE: (id) => `/admin/blog/update/${id}`,
    DELETE: (id) => `/admin/blog/delete/${id}`,
    CATEGORIES: '/admin/blog/categories',
  },
  MINISTRIES: {
    BASE: '/admin/ministries',
    CREATE: '/admin/ministries/create',
    UPDATE: (id) => `/admin/ministries/update/${id}`,
    DELETE: (id) => `/admin/ministries/delete/${id}`,
    CATEGORIES: '/admin/ministries/categories',
  },
  TESTIMONIALS: {
    BASE: '/admin/testimonials',
    CREATE: '/admin/testimonials/create',
    UPDATE: (id) => `/admin/testimonials/update/${id}`,
    DELETE: (id) => `/admin/testimonials/delete/${id}`,
  },
  SETTINGS: {
    BASE: '/admin/settings',
    UPDATE: '/admin/settings/update',
    RESET: '/admin/settings/reset',
  },
};

// Frontend-friendly endpoints that map to your admin endpoints
export const FRONTEND_ENDPOINTS = {
  // Public read endpoints (for pages)
  PUBLIC: {
    MINISTRIES: '/api/ministries',
    MINISTRIES_VOLUNTEER: '/api/ministries/volunteer-opportunities',
    MINISTRIES_USER: '/api/user/ministries',
    MINISTRIES_VOLUNTEER_ACTION: (id) => `/api/ministries/${id}/volunteer`,
    MINISTRIES_CONTACT: (id) => `/api/ministries/${id}/contact`,
    
    SERMONS: '/api/sermons',
    SERMONS_FEATURED: '/api/sermons?featured=true',
    SERMONS_LIVE: '/api/sermons/live',
    SERMONS_CATEGORIES: '/api/sermons/categories',
    SERMONS_FAVORITES: '/api/sermons/favorites',
    SERMONS_FAVORITE_ACTION: (id) => `/api/sermons/favorites/${id}`,
    
    EVENTS: '/api/events',
    EVENTS_UPCOMING: '/api/events?upcoming=true',
    USER_RSVPS: '/api/user/rsvps',
    USER_FAVORITES: '/api/user/favorites',
    EVENT_RSVP: (id) => `/api/events/${id}/rsvp`,
    EVENT_FAVORITE: (id) => `/api/events/${id}/favorite`,
    
    TESTIMONIALS: '/api/testimonials',
    TESTIMONIALS_APPROVED: '/api/testimonials?approved=true',
    TESTIMONIALS_VIDEOS: '/api/testimonials/videos',
    TESTIMONIALS_CATEGORIES: '/api/testimonials/categories',
    
    PRAYERS: '/api/prayers',
    PRAYERS_TEAM: '/api/prayers/team',
    PRAYERS_MEETINGS: '/api/prayers/meetings',
    PRAYER_ACTION: (id) => `/api/prayers/${id}/pray`,
    
    BLOG: '/api/blog/posts',
    BLOG_CATEGORIES: '/api/blog/categories',
    BLOG_FAVORITES: '/api/blog/favorites',
    BLOG_FAVORITE_ACTION: (id) => `/api/blog/favorites/${id}`,
    
    SERVICE_TIMES: '/api/service-times',
    CHURCH_STATS: '/api/stats',
    HERO_CONTENT: '/api/hero-content',
    LIVE_STATUS: '/api/live-status',
  },
  
  // Admin write endpoints (mapped to your existing admin endpoints)
  ADMIN: {
    MINISTRIES: {
      BASE: ADMIN_ENDPOINTS.MINISTRIES.BASE,
      CREATE: ADMIN_ENDPOINTS.MINISTRIES.CREATE,
      UPDATE: ADMIN_ENDPOINTS.MINISTRIES.UPDATE,
      DELETE: ADMIN_ENDPOINTS.MINISTRIES.DELETE,
      CATEGORIES: ADMIN_ENDPOINTS.MINISTRIES.CATEGORIES,
      VOLUNTEERS: (id) => `/api/admin/ministries/${id}/volunteers`,
      STATS: '/api/admin/ministries/stats',
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
      ALL: '/api/admin/testimonials',
      STATS: '/api/admin/testimonials/stats',
    },
    BLOG: {
      CREATE: ADMIN_ENDPOINTS.BLOG.CREATE,
      UPDATE: ADMIN_ENDPOINTS.BLOG.UPDATE,
      DELETE: ADMIN_ENDPOINTS.BLOG.DELETE,
      CATEGORIES: ADMIN_ENDPOINTS.BLOG.CATEGORIES,
      ALL: '/api/admin/blog',
    },
    PRAYERS: {
      UPDATE: ADMIN_ENDPOINTS.PRAYER_REQUESTS.UPDATE,
      DELETE: ADMIN_ENDPOINTS.PRAYER_REQUESTS.DELETE,
      ALL: '/api/admin/prayers',
      STATS: '/api/admin/prayers/stats',
    },
    DONATIONS: {
      BASE: ADMIN_ENDPOINTS.DONATIONS.BASE,
      UPDATE: ADMIN_ENDPOINTS.DONATIONS.UPDATE,
      STATS: '/admin/donation-stats',
      RECENT: '/admin/recent-donations',
      ALL: '/admin/donations',
      EXPORT: '/admin/export-donations',
      RECEIPT: (id) => `/api/donations/receipt/${id}`,
    },
    USERS: {
      BASE: ADMIN_ENDPOINTS.USERS.BASE,
      CREATE: ADMIN_ENDPOINTS.USERS.CREATE,
      UPDATE: ADMIN_ENDPOINTS.USERS.UPDATE,
      DELETE: ADMIN_ENDPOINTS.USERS.DELETE,
      ROLES: ADMIN_ENDPOINTS.USERS.ROLES,
    }
  }
};

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  SOCIAL_LOGIN: (provider) => `/auth/${provider}`,
};

// Payment endpoints
export const PAYMENT_ENDPOINTS = {
  CREATE_DONATION: '/payments/create-donation',
};