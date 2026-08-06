import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { uploadToS3, uploadFileToS3 } from '../lib/s3.js';
import prisma from '../lib/prisma.js';

export const uploadCertificatesToS3 = async (certificateFiles, metadata) => {
    try {
        const uploadedFiles = [];
        
        // Upload each certificate individually
        for (const certFile of certificateFiles) {
            const key = `certificates/${metadata.batchId}/${path.basename(certFile)}`;
            const s3Url = await uploadFileToS3({
                filePath: certFile,
                key,
                isPublic: false
            });
            
            uploadedFiles.push({
                localPath: certFile,
                s3Url,
                key
            });
            
            // Save to database
            await prisma.bulkCertificateItem.create({
                data: {
                    certificateId: metadata.certificateId,
                    recipientName: certFile.recipientName,
                    recipientEmail: certFile.recipientEmail,
                    uniqueCode: certFile.uniqueCode,
                    filePath: s3Url,
                    isIssued: true,
                    issuedAt: new Date()
                }
            });
        }
        
        // Create ZIP file and upload to S3
        const zipKey = `certificates/${metadata.batchId}/all_certificates.zip`;
        const zipPath = path.join(process.cwd(), 'temp', `${metadata.batchId}.zip`);
        
        await createZipFile(certificateFiles.map(f => f.localPath), zipPath);
        
        const zipUrl = await uploadFileToS3({
            filePath: zipPath,
            key: zipKey,
            isPublic: false
        });
        
        // Clean up temp files
        fs.unlinkSync(zipPath);
        
        return {
            certificateUrls: uploadedFiles,
            zipUrl: zipUrl,
            batchId: metadata.batchId
        };
        
    } catch (error) {
        console.error('S3 upload error:', error);
        throw error;
    }
};

const createZipFile = async (files, outputPath) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', resolve);
        archive.on('error', reject);
        
        archive.pipe(output);
        
        files.forEach(file => {
            archive.file(file, { name: path.basename(file) });
        });
        
        archive.finalize();
    });
};