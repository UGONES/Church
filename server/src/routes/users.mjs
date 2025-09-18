import { Router } from 'express';
const router = Router();
import {
  getCurrentUser,
  updateProfile,
  addFamilyMember,
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
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateProfile);
router.post('/family', auth, addFamilyMember);
router.delete('/family/:memberId', auth, removeFamilyMember);
router.get('/dashboard', auth, getUserDashboard);

// Admin routes
router.get('/admin', auth, adminCheck, getAllUsers);
router.post('/admin/create', auth, adminCheck, createUser);
router.put('/admin/update/:id', auth, adminCheck, updateUser);
router.delete('/admin/delete/:id', auth, adminCheck, deleteUser);
router.get('/admin/roles', auth, adminCheck, getUserRoles);
router.get('/admin/membership-statuses', auth, adminCheck, getMembershipStatuses);

export default router;