import { Router } from 'express';
const router = Router();
import { 
    getAllBlogPosts, 
    getBlogCategories, 
    subscribeToNewsletter, 
    getFavoriteBlogPosts, 
    addFavoriteBlogPost, 
    removeFavoriteBlogPost, 
    getAllBlogPostsAdmin, 
    createBlogPost, 
    updateBlogPost, 
    deleteBlogPost, 
    getBlogCategoriesAdmin 
} from '../controllers/blogController.mjs';
import { auth, optionalAuth } from '../middleware/auth.mjs';
import { moderatorCheck } from '../middleware/adminCheck.mjs';
import { uploadImage } from '../middleware/upload.mjs';

// Public routes
router.get('/posts',  getAllBlogPosts);
router.get('/categories',  getBlogCategories);
router.post('/newsletter/subscribe', subscribeToNewsletter);

// Authenticated routes
router.get('/favorites', auth, getFavoriteBlogPosts);
router.post('/favorites/:id', auth, addFavoriteBlogPost);
router.delete('/favorites/:id', auth, removeFavoriteBlogPost);

// Admin routes - ADDED /admin PREFIX
router.get('/admin/all', auth, moderatorCheck, getAllBlogPostsAdmin);
router.post('/admin/create', auth, moderatorCheck, uploadImage.single('image'), createBlogPost);
router.put('/admin/update/:id', auth, moderatorCheck, uploadImage.single('image'), updateBlogPost);
router.delete('/admin/delete/:id', auth, moderatorCheck, deleteBlogPost);
router.get('/admin/categories', auth, moderatorCheck, getBlogCategoriesAdmin);

export default router;