import { Router } from 'express';
const router = Router();
import multer from 'multer';
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
  stopLiveStream 
} from '../controllers/sermonController.mjs';
import { auth, optionalAuth } from '../middleware/auth.mjs';
import { moderatorCheck } from '../middleware/adminCheck.mjs';

// Configure multer for file uploads (using memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and audio files are allowed'), false);
    }
  }
});

// Public routes
router.get('/', getAllSermons);
router.get('/live', getLiveSermons);
router.get('/categories', getSermonCategories);
router.get('/featured', getFeaturedSermons);

// Authenticated routes
router.get('/favorites', optionalAuth, getFavoriteSermons);
router.post('/favorites/:id', auth, addFavoriteSermon);
router.delete('/favorites/:id', auth, removeFavoriteSermon);

// Admin routes - ADDED /admin PREFIX
router.post('/admin', auth, moderatorCheck, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), createSermon);

router.put('/admin/:id', auth, moderatorCheck, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), updateSermon);

router.delete('/admin/:id', auth, moderatorCheck, deleteSermon);
router.get('/admin/stats', auth, moderatorCheck, getSermonStats);
router.post('/admin/live/start', auth, moderatorCheck, startLiveStream);
router.post('/admin/live/stop', auth, moderatorCheck, stopLiveStream);

export default router;