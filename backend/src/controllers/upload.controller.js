import path from "path";
import fs from "fs";
import { processExcelFile } from "../services/excel.service.js";
import { uploadToS3 } from "../lib/s3.js";
import prisma from "../lib/prisma.js";

export const uploadController = {
  // Upload Excel file to S3
  uploadExcel: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { originalname, buffer, mimetype } = req.file;
      const timestamp = Date.now();
      const key = `excel/${timestamp}_${originalname}`;

      const s3Url = await uploadToS3({
        buffer,
        key,
        mimetype,
        isPublic: false,
      });

      const localPath = path.join(
        process.cwd(),
        "uploads",
        `excel_${timestamp}_${originalname}`,
      );
      fs.writeFileSync(localPath, buffer);

      const { headers, data, rowCount } = await processExcelFile(localPath);

      res.json({
        success: true,
        fileId: timestamp,
        filePath: localPath,
        s3Url: s3Url,
        headers: headers,
        data: data.slice(0, 5),
        rowCount: rowCount,
        message: "File uploaded successfully to S3",
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Upload template to S3 and save to database
  uploadTemplate: async (req, res) => {
    try {
      // ✅ Get user directly from req (set by authMiddleware)
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No template uploaded" });
      }

      const { originalname, buffer, mimetype } = req.file;
      const timestamp = Date.now();
      const safeName = originalname.replace(/\s/g, "_");
      const key = `templates/${timestamp}_${safeName}`;

      // Upload to S3 - get the REAL URL from AWS
      const s3Url = await uploadToS3({ buffer, key, mimetype, isPublic: true });

      // ✅ SAVE TO DATABASE with the S3 URL
      const template = await prisma.template.create({
        data: {
          name: originalname,
          filePath: s3Url, // ← Store the ACTUAL S3 URL
          adminId: user?.id, // You'll need to get the actual admin ID
        },
      });

      // Save locally for backup (optional)
      //   const localPath = path.join(
      //     process.cwd(),
      //     "uploads",
      //     "templates",
      //     `${timestamp}_${safeName}`,
      //   );
      //   const templateDir = path.join(process.cwd(), "uploads", "templates");
      //   if (!fs.existsSync(templateDir)) {
      //     fs.mkdirSync(templateDir, { recursive: true });
      //   }
      //   fs.writeFileSync(localPath, buffer);

      res.json({
        success: true,
        id: template.id,
        s3Url: s3Url, // ← Return the exact URL from AWS
        originalName: originalname,
        size: req.file.size,
        message: "Template uploaded successfully to S3",
      });
    } catch (error) {
      console.error("Template upload error:", error);
      res.status(500).json({ error: error.message });
    }
  },
};
