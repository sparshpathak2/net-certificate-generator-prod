import express from 'express';
import { certificateController } from '../controllers/certificate.controller.js';
// import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all certificate routes
// router.use(authMiddleware);

// Get all certificate batches for logged-in user
router.get('/', certificateController.getAllCertificates);

// Get ALL individual certificates for logged-in user
router.get('/items', certificateController.getAllCertificateItems);

// Get single certificate batch by ID
router.get('/batch/:id', certificateController.getCertificateById);

// Get individual certificate item by ID
router.get('/item/:id', certificateController.getCertificateItemById);

// Download individual certificate
router.get('/item/:id/download', certificateController.downloadCertificate);

// Download batch ZIP (if stored)
router.get('/batch/:id/download', certificateController.downloadBatchZip);

export default router;