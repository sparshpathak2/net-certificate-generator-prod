import { PutObjectCommand, S3Client, GetObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug: Check if env vars are loaded
console.log('=== S3 Configuration ===');
console.log('AWS Region:', process.env.AWS_REGION);
console.log('AWS Bucket:', process.env.AWS_BUCKET_NAME);
console.log('AWS Access Key exists:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('AWS Secret Key exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
console.log('========================\n');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Check bucket access
const checkBucketAccess = async () => {
    try {
        const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
        await s3Client.send(command);
        console.log(`✅ Successfully connected to bucket: ${BUCKET_NAME}`);
        return true;
    } catch (error) {
        console.error(`❌ Cannot access bucket: ${BUCKET_NAME}`);
        console.error('Error details:', {
            code: error.Code,
            message: error.message,
            statusCode: error.$metadata?.httpStatusCode
        });
        return false;
    }
};

// Upload buffer to S3
export const uploadToS3 = async ({ buffer, key, mimetype, isPublic = true }) => {
    try {
        // First check bucket access
        await checkBucketAccess();
        
        console.log(`\n📤 Uploading to S3:`);
        console.log(`   Bucket: ${BUCKET_NAME}`);
        console.log(`   Key: ${key}`);
        console.log(`   Size: ${buffer.length} bytes`);
        console.log(`   Type: ${mimetype}`);
        console.log(`   Public: ${isPublic}`);
        
        const params = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimetype,
            ACL: "public-read"
        };
        
        // Make public readable if needed
        if (isPublic) {
            params.ACL = "public-read";
        }

        const command = new PutObjectCommand(params);
        const result = await s3Client.send(command);
        
        console.log(`✅ Upload successful! ETag: ${result.ETag}`);

        // Return the public URL
        const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        console.log(`🔗 URL: ${url}`);
        
        return url;
    } catch (err) {
        console.error("\n❌ S3 upload error details:");
        console.error(`   Code: ${err.Code || 'Unknown'}`);
        console.error(`   Message: ${err.message}`);
        console.error(`   Status Code: ${err.$metadata?.httpStatusCode || 'N/A'}`);
        console.error(`   Request ID: ${err.$metadata?.requestId || 'N/A'}`);
        
        // Specific error handling
        if (err.Code === 'AccessDenied') {
            console.error('\n🔧 FIX: Access Denied - Check:');
            console.error('   1. IAM user has correct permissions');
            console.error('   2. Bucket policy allows uploads');
            console.error('   3. Credentials are correct for this AWS account');
            throw new Error(`Access denied to S3 bucket. Please verify IAM permissions for bucket: ${BUCKET_NAME}`);
        } else if (err.Code === 'NoSuchBucket') {
            console.error(`\n🔧 FIX: Bucket does not exist: ${BUCKET_NAME}`);
            throw new Error(`Bucket "${BUCKET_NAME}" does not exist. Please create it first.`);
        } else if (err.Code === 'NetworkingError') {
            console.error('\n🔧 FIX: Network error - Check:');
            console.error('   1. Internet connection');
            console.error('   2. AWS region is correct');
            console.error('   3. No firewall blocking outbound connections');
            throw new Error(`Network error connecting to AWS: ${err.message}`);
        } else {
            throw new Error(`Failed to upload file to S3: ${err.message}`);
        }
    }
};

// Upload file from disk to S3
export const uploadFileToS3 = async ({ filePath, key, isPublic = true }) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const mimetype = getMimeType(filePath);
        
        return await uploadToS3({
            buffer: fileBuffer,
            key,
            mimetype,
            isPublic
        });
    } catch (err) {
        console.error("S3 file upload error:", err);
        throw new Error("Failed to upload file to S3");
    }
};

// Generate presigned URL for temporary access
export const getPresignedUrl = async (key, expiresIn = 3600) => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (err) {
        console.error("Presigned URL generation error:", err);
        throw new Error("Failed to generate presigned URL");
    }
};

// Helper: Get MIME type from file extension
const getMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
        '.csv': 'text/csv',
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
    };
    return mimeTypes[ext] || 'application/octet-stream';
};