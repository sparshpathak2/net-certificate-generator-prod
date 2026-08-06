import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadController } from '../controllers/upload.controller.js';

const router = express.Router();

// Configure multer for memory storage (for S3 upload)
const storage = multer.memoryStorage();

// File filters
const excelFileFilter = (req, file, cb) => {
    const extname = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.xlsm'];
    const isValidExtension = allowedExtensions.includes(extname);
    
    if (isValidExtension) {
        cb(null, true);
    } else {
        cb(new Error(`Only Excel files are allowed. Received: ${file.originalname}`));
    }
};

const templateFileFilter = (req, file, cb) => {
    const extname = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const isValidExtension = allowedExtensions.includes(extname);
    
    if (isValidExtension) {
        cb(null, true);
    } else {
        cb(new Error(`Only PDF and image files are allowed. Received: ${file.originalname}`));
    }
};

// Multer configurations
const uploadExcel = multer({ 
    storage: storage,
    fileFilter: excelFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadTemplate = multer({ 
    storage: storage,
    fileFilter: templateFileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
});

// Routes
router.post('/excel', uploadExcel.single('file'), uploadController.uploadExcel);
router.post('/template', uploadTemplate.single('template'), uploadController.uploadTemplate);

export default router;