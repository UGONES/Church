import { Router } from 'express';
const router = Router();
import { 
    getAllVolunteers, 
    getVolunteerStats, 
    getVolunteerById, 
    updateVolunteerStatus, 
    getUserVolunteerApplications, 
    getMinistryVolunteers 
} from '../controllers/volunteerController.mjs';
import { auth } from '../middleware/auth.mjs';
import { moderatorCheck } from '../middleware/adminCheck.mjs';

// Admin routes - ADDED /admin PREFIX
router.get('/admin/all', auth, moderatorCheck, getAllVolunteers);
router.get('/admin/stats', auth, moderatorCheck, getVolunteerStats);
router.get('/admin/:id', auth, moderatorCheck, getVolunteerById);
router.put('/admin/:id/status', auth, moderatorCheck, updateVolunteerStatus);

// Authenticated routes
router.get('/user/applications', auth, getUserVolunteerApplications);
router.get('/ministry/:ministryId', auth, getMinistryVolunteers);

export default router;