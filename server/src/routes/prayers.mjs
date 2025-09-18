import { Router } from 'express';
const router = Router();
import { 
    getAllPrayerRequests, 
    getPrayerTeam, 
    getPrayerMeetings, 
    submitPrayerRequest, 
    prayForRequest, 
    getAllPrayerRequestsAdmin, 
    updatePrayerRequest, 
    deletePrayerRequest, 
    getPrayerStats 
} from '../controllers/prayerController.mjs';
import { auth, optionalAuth } from '../middleware/auth.mjs';
import { moderatorCheck } from '../middleware/adminCheck.mjs';

// Public routes
router.get('/', getAllPrayerRequests);
router.get('/team', getPrayerTeam);
router.get('/meetings', getPrayerMeetings);
router.post('/', submitPrayerRequest);
router.post('/:id/pray', optionalAuth, prayForRequest);

// Admin routes - ADDED /admin PREFIX
router.get('/admin/all', auth, moderatorCheck, getAllPrayerRequestsAdmin);
router.put('/admin/update/:id', auth, moderatorCheck, updatePrayerRequest);
router.delete('/admin/delete/:id', auth, moderatorCheck, deletePrayerRequest);
router.get('/admin/stats', auth, moderatorCheck, getPrayerStats);

export default router;