import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from './routes/upload.routes.js';
import generateRoutes from './routes/generate.routes.js';
import templateRoutes from './routes/template.routes.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
import certificateRoutes from './routes/certificate.routes.js';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Ensure required directories exist
const directories = ['uploads', 'temp', 'generated_certificates'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// app.use(authMiddleware);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/generated', express.static(path.join(__dirname, '..', 'generated_certificates')));

app.use(authMiddleware);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/certificates', certificateRoutes);
// app.get('/api/verify/:uniqueCode', certificateController.getCertificateByUniqueCode);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'OK', timestamp: new Date() });
// });

// Start server - Listen on all network interfaces
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on http://127.0.0.1:${PORT}`);
  console.log(`   Or on your network: http://<your-ip>:${PORT}`);
});