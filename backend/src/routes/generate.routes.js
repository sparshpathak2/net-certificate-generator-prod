// import express from 'express';
// import axios from 'axios';
// import FormData from 'form-data';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// // import archiver from 'archiver';
// import * as archiver from 'archiver';
// import { v4 as uuidv4 } from 'uuid';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const router = express.Router();

// router.post('/', async (req, res) => {
//     try {
//         const { excelPath, templatePath, mapping, coordinates } = req.body;

//         // Call Python service
//         const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

//         const formData = new FormData();
//         formData.append('excel_file', fs.createReadStream(excelPath));
//         formData.append('template_file', fs.createReadStream(templatePath));
//         formData.append('mapping', JSON.stringify(mapping));
//         formData.append('coordinates', JSON.stringify(coordinates));

//         const response = await axios.post(`${pythonServiceUrl}/generate-certificates`, formData, {
//             headers: formData.getHeaders(),
//             responseType: 'stream'
//         });

//         // Set response headers for file download
//         res.setHeader('Content-Type', 'application/zip');
//         res.setHeader('Content-Disposition', `attachment; filename=certificates-${uuidv4()}.zip`);

//         // Pipe the response to client
//         response.data.pipe(res);

//     } catch (error) {
//         console.error('Generation error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// export default router;


// import express from 'express';
// import { generateController } from '../controllers/generate.controller.js';

// const router = express.Router();

// // Generate certificates
// router.post('/', generateController.generateCertificates);

// export default router;


// import express from 'express';
// import multer from 'multer';
// import { generateController } from '../controllers/generate.controller.js';

// const router = express.Router();

// // Configure multer for file uploads (memory storage)
// const storage = multer.memoryStorage();
// const upload = multer({ 
//     storage: storage,
//     limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
// });

// // Generate certificates - support both JSON and FormData
// router.post('/', upload.fields([{ name: 'excel', maxCount: 1 }]), generateController.generateCertificates);

// export default router;

import express from 'express';
import multer from 'multer';
import { generateController } from '../controllers/generate.controller.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Generate certificates - support FormData with file
router.post('/', upload.single('excel'), generateController.generateCertificates);
router.post('/download-multiple', generateController.downloadMultiple);

export default router;