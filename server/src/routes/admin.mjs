import { Router } from 'express';
const router = Router();
import { body } from 'express-validator';
import {
     generateAdminCode, 
     getAdminCodes, 
     getUsers, 
     updateUserRole, 
     deactivateUser, 
     activateUser, 
     getDashboardStats 
    } from '../controllers/adminController.mjs';
import { auth } from '../middleware/auth.mjs';
import { adminCheck } from '../middleware/adminCheck.mjs';
 

// Validation rules
const generateAdminCodeValidation = [
  body('description').notEmpty().withMessage('Description is required'),
  body('role').isIn(['admin', 'moderator']).withMessage('Role must be admin or moderator'),
  body('maxUsage').isInt({ min: 1 }).withMessage('Max usage must be at least 1'),
  body('expiresInDays').isInt({ min: 1 }).withMessage('Expires in days must be at least 1')
];

const updateUserRoleValidation = [
  body('role').isIn(['user', 'moderator', 'admin']).withMessage('Invalid role')
];

// Routes
router.post('/generate-code', auth, adminCheck, generateAdminCodeValidation, generateAdminCode);
router.get('/codes', auth, adminCheck, getAdminCodes);
router.get('/users', auth, adminCheck, getUsers);
router.patch('/users/:userId/role', auth, adminCheck, updateUserRoleValidation, updateUserRole);
router.patch('/users/:userId/deactivate', auth, adminCheck, deactivateUser);
router.patch('/users/:userId/activate', auth, adminCheck, activateUser);
router.get('/dashboard/stats', auth, adminCheck, getDashboardStats);

export default router;