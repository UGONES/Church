import { Router } from 'express';
const router = Router();

import {
    getAllTestimonials,
    getApprovedTestimonials,
    getVideoTestimonials,
    getTestimonialCategories,
    submitTestimonial,
    getAllTestimonialsAdmin,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    getTestimonialStats,
} from '../controllers/testimonialController.mjs';

import { auth, optionalAuth } from '../middleware/auth.mjs';
import { moderatorCheck } from '../middleware/adminCheck.mjs';
import { uploadVideo } from '../middleware/upload.mjs';
import { handleMediaUpload } from '../middleware/upload.mjs';


// -------- PUBLIC ROUTES --------
router.get('/', optionalAuth, getAllTestimonials);
router.get('/approved', optionalAuth, getApprovedTestimonials);
router.get('/videos', uploadVideo.single('video'), optionalAuth, getVideoTestimonials);
router.get('/categories', optionalAuth, getTestimonialCategories);
router.post('/', optionalAuth, handleMediaUpload, submitTestimonial);

// -------- ADMIN ROUTES --------
router.get('/admin/all', auth, moderatorCheck, getAllTestimonialsAdmin);
router.post('/admin/create', auth, moderatorCheck, handleMediaUpload, createTestimonial);
router.put('/admin/update/:id', auth, moderatorCheck, handleMediaUpload, updateTestimonial);
router.delete('/admin/delete/:id', auth, moderatorCheck, deleteTestimonial);
router.get('/admin/stats', auth, moderatorCheck, getTestimonialStats);

export default router;
