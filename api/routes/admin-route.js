import express from 'express';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { apiCallLimiter } from '../middleware/rateLimiter.js';
import {
  getAdminStats,
  getAdminUsers,
  getAdminSurveys,
  getAdminPurchases,
  getAdminSubscriptions,
  getAdminDriPayments,
} from '../controllers/admin-controller.js';

const router = express.Router();

router.use(apiCallLimiter, verifyJwt);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.get('/surveys', getAdminSurveys);
router.get('/purchases', getAdminPurchases);
router.get('/subscriptions', getAdminSubscriptions);
router.get('/dri-payments', getAdminDriPayments);

export default router;
