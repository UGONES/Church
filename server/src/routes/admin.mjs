// routes/admin.mjs
import { Router } from 'express';
import { body } from 'express-validator';
import {
  generateAdminCode, getAdminCodes, getUsers, updateUserRole, deactivateUser, activateUser, getDashboardStats
} from '../controllers/adminController.mjs';
import { auth } from '../middleware/auth.mjs';
import { adminCheck } from '../middleware/adminCheck.mjs';
import { handleValidationErrors } from '../middleware/validation.mjs';
import { generateAdminCodeValidation, updateUserRoleValidation } from '../utils/validators.mjs';

const router = Router();



router.post('/generate-code', auth, adminCheck, generateAdminCodeValidation, handleValidationErrors, generateAdminCode);
router.get('/codes', auth, adminCheck, getAdminCodes);
router.get('/users', auth, adminCheck, getUsers);
router.patch('/users/:userId/role', auth, adminCheck, updateUserRoleValidation, handleValidationErrors, updateUserRole);
router.patch('/users/:userId/deactivate', auth, adminCheck, deactivateUser);
router.patch('/users/:userId/activate', auth, adminCheck, activateUser);
router.get('/dashboard/stats', auth, adminCheck, getDashboardStats);

export default router;
