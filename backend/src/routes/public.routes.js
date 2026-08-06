import express from 'express';
import { publicController } from '../controllers/public.controller.js';

const router = express.Router();

// Public routes (no authentication required - handled by auth middleware)
router.post('/claim-certificate', publicController.claimCertificate);
router.get('/request-status/:requestId', publicController.getRequestStatus);
router.get('/verify/:uniqueCode', publicController.verifyCertificate);

export default router;