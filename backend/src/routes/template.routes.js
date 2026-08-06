import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { templateController } from '../controllers/template.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Ensure templates directory exists
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'uploads', 'templates');
if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, TEMPLATES_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'template-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for templates
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|png|jpg|jpeg|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and image files are allowed'));
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for templates
});

// ========== PUBLIC ROUTES (NO AUTH REQUIRED) ==========
// These must come BEFORE any auth middleware
router.get('/public/claim/:claimUrl', templateController.getTemplateByClaimUrl);
router.get('/public/list', templateController.getPublicTemplates);

// ========== PROTECTED ROUTES (AUTH REQUIRED) ==========
// Routes - only use methods that exist in templateController
router.get('/', templateController.getAllTemplates);
// router.get('/', templateController.getTemplatesByUser);
// router.get('/all', templateController.getAllTemplates);
router.get('/:id', templateController.getTemplateById);
router.get('/file/:filename', templateController.getTemplate);
router.put('/:id/fields', templateController.updateTemplateFields);
router.put('/:id/claim-url', templateController.updateClaimUrl);
router.delete('/:id', templateController.deleteTemplate);

export default router;