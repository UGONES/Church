import { Router } from 'express';
const router = Router();
import { 
  getAllSermons, 
  getLiveSermons, 
  getSermonCategories, 
  getFeaturedSermons, 
  getFavoriteSermons, 
  addFavoriteSermon, 
  removeFavoriteSermon, 
  createSermon, 
  updateSermon, 
  deleteSermon, 
  getSermonStats, 
  startLiveStream, 
  stopLiveStream,
  getStreamConfig,
  testStreamConnection,
  getStreamHealth,
  getLiveStatus, // ADD THIS
  handleStreamWebhook, // ADD THIS
  generateKey
} from '../controllers/sermonController.mjs';
import { auth, optionalAuth } from '../middleware/auth.mjs';
import { moderatorCheck } from '../middleware/adminCheck.mjs';
import { handleMediaUpload } from '../middleware/upload.mjs';

// Public routes
router.get('/', getAllSermons);
router.get('/live', getLiveSermons);
router.get('/live/status', getLiveStatus); 
router.get('/categories', getSermonCategories);
router.get('/featured', getFeaturedSermons);
router.get('/live-key', generateKey);

// Webhook route (no auth required for RTMP server)
router.post('/webhooks/stream', handleStreamWebhook); 

// Authenticated routes
router.get('/favorites', optionalAuth, getFavoriteSermons);
router.post('/favorites/:id', auth, addFavoriteSermon);
router.delete('/favorites/:id', auth, removeFavoriteSermon);

// Stream configuration routes
router.get('/stream/config/:sermonId', auth, getStreamConfig);
router.post('/stream/test/:sermonId', auth, moderatorCheck, testStreamConnection);
router.get('/stream/health/:sermonId', auth, getStreamHealth);

// Admin routes
router.post('/admin', auth, moderatorCheck, handleMediaUpload, createSermon);
router.put('/admin/:id', auth, moderatorCheck, handleMediaUpload, updateSermon);
router.delete('/admin/:id', auth, moderatorCheck, deleteSermon);
router.get('/admin/stats', auth, moderatorCheck, getSermonStats);
router.post('/admin/live/start', auth, moderatorCheck, startLiveStream);
router.post('/admin/live/stop/:sermonId', auth, moderatorCheck, stopLiveStream); 

export default router;