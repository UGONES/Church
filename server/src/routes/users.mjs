import { Router } from 'express';
const router = Router();
import {
  getCurrentUser,
  updateProfile,
  addFamilyMember,
  trackLoginActivity,
  removeFamilyMember,
  getUserDashboard,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserRoles,
  getMembershipStatuses
} from '../controllers/userController.mjs';
import { auth } from '../middleware/auth.mjs';
import { adminCheck, moderatorCheck } from '../middleware/adminCheck.mjs';

// User routes (authenticated)
router.get('/me', auth, getCurrentUser, trackLoginActivity);
router.put('/profile', auth, updateProfile);
router.post('/family', auth, addFamilyMember);
router.delete('/family/:memberId', auth, removeFamilyMember);
router.get('/dashboard', auth, getUserDashboard);

// Admin routes
router.get('/admin', auth, adminCheck, getAllUsers);
router.post('/admin/create', auth, adminCheck, moderatorCheck, createUser);
router.put('/admin/update/:id', auth, adminCheck, moderatorCheck, updateUser);
router.delete('/admin/delete/:id', auth, adminCheck, deleteUser);
router.get('/admin/roles', auth, adminCheck, getUserRoles);
router.get('/admin/membership-statuses', auth, adminCheck, moderatorCheck, getMembershipStatuses);

export default router;