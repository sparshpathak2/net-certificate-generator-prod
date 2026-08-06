import express from 'express';
import { adminController } from '../controllers/admin.controller.js';

const router = express.Router();

// Request management
router.get('/requests/pending', adminController.getPendingRequests);
router.get('/requests', adminController.getAllRequests);
router.get('/requests/:id', adminController.getRequestById);
router.post('/requests/:id/approve', adminController.approveRequest);
router.post('/requests/:id/reject', adminController.rejectRequest);

export default router;