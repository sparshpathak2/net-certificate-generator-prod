// import axios from 'axios';
// import fs from 'fs';
// import path from 'path';
// import XLSX from 'xlsx';
// import { fileURLToPath } from 'url';
// import { processCertificateGeneration } from '../services/certificate.service.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export const generateController = {
//     generateCertificates: async (req, res) => {
//         try {
//             const { templateId, fields, fieldMapping } = req.body;
//             const excelFile = req.file;

//             // ✅ Get the authenticated user from the request (set by authMiddleware)
//             const adminId = req.user?.id;

//             if (!excelFile) {
//                 return res.status(400).json({
//                     error: 'Missing required: excel file is required'
//                 });
//             }

//             if (!templateId) {
//                 return res.status(400).json({
//                     error: 'Missing required: templateId is required'
//                 });
//             }

//             if (!adminId) {
//                 return res.status(401).json({
//                     error: 'User not authenticated'
//                 });
//             }

//             // Parse fields if they are strings
//             let parsedFields = fields;
//             let parsedFieldMapping = fieldMapping;

//             if (typeof fields === 'string') {
//                 parsedFields = JSON.parse(fields);
//             }
//             if (typeof fieldMapping === 'string') {
//                 parsedFieldMapping = JSON.parse(fieldMapping);
//             }

//             // Get template from database
//             const prisma = (await import('../lib/prisma.js')).default;
//             const template = await prisma.template.findUnique({
//                 where: { id: templateId }
//             });

//             if (!template) {
//                 return res.status(404).json({ error: 'Template not found' });
//             }

//             // Create temp directory
//             const tempDir = path.join(__dirname, '..', '..', 'temp');
//             if (!fs.existsSync(tempDir)) {
//                 fs.mkdirSync(tempDir, { recursive: true });
//             }

//             // Save excel file to temp
//             const tempExcelPath = path.join(tempDir, `excel_${Date.now()}_${excelFile.originalname}`);
//             fs.writeFileSync(tempExcelPath, excelFile.buffer);

//             // Download template from S3
//             const templateResponse = await axios.get(template.filePath, { responseType: 'arraybuffer' });
//             const tempTemplatePath = path.join(tempDir, `template_${Date.now()}.pdf`);
//             fs.writeFileSync(tempTemplatePath, templateResponse.data);

//             // Read Excel data
//             const workbook = XLSX.readFile(tempExcelPath);
//             const sheetName = workbook.SheetNames[0];
//             const worksheet = workbook.Sheets[sheetName];
//             const excelData = XLSX.utils.sheet_to_json(worksheet);

//             console.log(`Processing ${excelData.length} records...`);
//             console.log('Fields:', parsedFields.map(f => f.name));
//             console.log('Field mapping:', parsedFieldMapping);

//             // ✅ Pass templateId and adminId to the service
//             const result = await processCertificateGeneration({
//                 excelData,
//                 templatePath: tempTemplatePath,
//                 fields: parsedFields,
//                 fieldMapping: parsedFieldMapping,
//                 templateId: templateId,  // ✅ Pass templateId
//                 adminId: adminId,        // ✅ Pass adminId
//                 title: `Certificate Batch - ${new Date().toLocaleDateString()}`
//             });

//             // Send the ZIP file
//             res.setHeader('Content-Type', 'application/zip');
//             res.setHeader('Content-Disposition', `attachment; filename=certificates-${Date.now()}.zip`);

//             const fileStream = fs.createReadStream(result.zipPath);
//             fileStream.pipe(res);

//             // Clean up temp files after response
//             fileStream.on('end', () => {
//                 try {
//                     if (fs.existsSync(tempExcelPath)) fs.unlinkSync(tempExcelPath);
//                     if (fs.existsSync(tempTemplatePath)) fs.unlinkSync(tempTemplatePath);
//                     if (fs.existsSync(result.zipPath)) fs.unlinkSync(result.zipPath);
//                 } catch (err) {
//                     console.error('Cleanup error:', err);
//                 }
//             });

//         } catch (error) {
//             console.error('Generation error:', error);
//             res.status(500).json({ error: error.message || 'Internal server error' });
//         }
//     }
// };

import axios from "axios";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { fileURLToPath } from "url";
import { processCertificateGeneration } from "../services/certificate.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateController = {
  generateCertificates: async (req, res) => {
    try {
      const { templateId, fields, fieldMapping } = req.body;
      const excelFile = req.file;

      // ✅ Get the authenticated user from the request (set by authMiddleware)
      const adminId = req.user?.id;

      if (!excelFile) {
        return res.status(400).json({
          error: "Missing required: excel file is required",
        });
      }

      if (!templateId) {
        return res.status(400).json({
          error: "Missing required: templateId is required",
        });
      }

      if (!adminId) {
        return res.status(401).json({
          error: "User not authenticated",
        });
      }

      // Parse fields if they are strings
      let parsedFields = fields;
      let parsedFieldMapping = fieldMapping;

      if (typeof fields === "string") {
        parsedFields = JSON.parse(fields);
      }
      if (typeof fieldMapping === "string") {
        parsedFieldMapping = JSON.parse(fieldMapping);
      }

      // Get template from database
      const prisma = (await import("../lib/prisma.js")).default;
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Create temp directory
      const tempDir = path.join(__dirname, "..", "..", "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Save excel file to temp
      const tempExcelPath = path.join(
        tempDir,
        `excel_${Date.now()}_${excelFile.originalname}`,
      );
      fs.writeFileSync(tempExcelPath, excelFile.buffer);

      // Download template from S3
      const templateResponse = await axios.get(template.filePath, {
        responseType: "arraybuffer",
      });
      const tempTemplatePath = path.join(tempDir, `template_${Date.now()}.pdf`);
      fs.writeFileSync(tempTemplatePath, templateResponse.data);

      // Read Excel data
      const workbook = XLSX.readFile(tempExcelPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelData = XLSX.utils.sheet_to_json(worksheet);

      console.log(`Processing ${excelData.length} records...`);
      console.log(
        "Fields:",
        parsedFields.map((f) => f.name),
      );
      console.log("Field mapping:", parsedFieldMapping);

      // ✅ Pass templateId and adminId to the service
      const result = await processCertificateGeneration({
        excelData,
        templatePath: tempTemplatePath,
        fields: parsedFields,
        fieldMapping: parsedFieldMapping,
        templateId: templateId,
        adminId: adminId,
        title: `Certificate Batch - ${new Date().toLocaleDateString()}`,
      });

      // Send the ZIP file
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=certificates-${Date.now()}.zip`,
      );

      const fileStream = fs.createReadStream(result.zipPath);
      fileStream.pipe(res);

      // Clean up temp files after response
      fileStream.on("end", () => {
        try {
          if (fs.existsSync(tempExcelPath)) fs.unlinkSync(tempExcelPath);
          if (fs.existsSync(tempTemplatePath)) fs.unlinkSync(tempTemplatePath);
          if (fs.existsSync(result.zipPath)) fs.unlinkSync(result.zipPath);
          // Clean up the temp directory
          const tempBatchDir = path.dirname(result.zipPath);
          if (fs.existsSync(tempBatchDir)) {
            fs.rmdirSync(tempBatchDir, { recursive: true });
          }
        } catch (err) {
          console.error("Cleanup error:", err);
        }
      });
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  },

  /**
   * Download multiple certificates as a ZIP
   */
  downloadMultiple: async (req, res) => {
    try {
      const { certificateIds } = req.body;

      if (
        !certificateIds ||
        !Array.isArray(certificateIds) ||
        certificateIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide at least one certificate ID",
        });
      }

      console.log(`📦 Downloading ${certificateIds.length} certificates...`);

      // Fetch certificate items from database
      const certificateItems = await prisma.bulkCertificateItem.findMany({
        where: {
          id: {
            in: certificateIds,
          },
        },
        select: {
          id: true,
          recipientName: true,
          uniqueCode: true,
          filePath: true, // S3 URL
        },
      });

      if (certificateItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No certificates found",
        });
      }

      // Create temp directory
      const batchId = uuidv4();
      const tempDir = path.join(process.cwd(), "temp", `download_${batchId}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const downloadedFiles = [];

      // Download each certificate from S3
      for (const item of certificateItems) {
        try {
          // Generate a clean filename
          const fileName = `${item.recipientName.replace(/\s/g, "_")}_${item.uniqueCode}.pdf`;
          const localPath = path.join(tempDir, fileName);

          // Download from S3
          console.log(`⬇️ Downloading: ${fileName}`);
          const response = await axios.get(item.filePath, {
            responseType: "arraybuffer",
          });

          // Save locally
          fs.writeFileSync(localPath, response.data);
          downloadedFiles.push(localPath);
          console.log(`✅ Downloaded: ${fileName}`);
        } catch (error) {
          console.error(
            `❌ Failed to download certificate ${item.id}:`,
            error.message,
          );
          // Continue with other files
        }
      }

      if (downloadedFiles.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to download any certificates",
        });
      }

      // Create ZIP file
      const zipPath = path.join(tempDir, `certificates-${Date.now()}.zip`);
      console.log(`📦 Creating ZIP with ${downloadedFiles.length} files...`);

      await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
          console.log(
            `✅ ZIP created: ${zipPath}, size: ${archive.pointer()} bytes`,
          );
          resolve();
        });

        archive.on("error", (err) => {
          console.error("Archive error:", err);
          reject(err);
        });

        archive.pipe(output);

        for (const file of downloadedFiles) {
          const fileName = path.basename(file);
          console.log(`   Adding: ${fileName}`);
          archive.file(file, { name: fileName });
        }

        archive.finalize();
      });

      // Send ZIP file
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${path.basename(zipPath)}`,
      );

      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);

      // Clean up after response
      fileStream.on("end", () => {
        // Clean up downloaded files
        for (const file of downloadedFiles) {
          try {
            if (fs.existsSync(file)) fs.unlinkSync(file);
          } catch (err) {
            console.error("Cleanup error:", err);
          }
        }
        // Clean up ZIP
        try {
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
          if (fs.existsSync(tempDir))
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.error("Cleanup error:", err);
        }
      });
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to download certificates",
      });
    }
  },
};
