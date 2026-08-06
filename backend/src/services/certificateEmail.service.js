import { uploadToS3 } from "../lib/s3.js";
import prisma from "../lib/prisma.js";
import fs from "fs";
import path from "path";

function generateUniqueCode(studentName, courseName) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const nameSlug = studentName.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    return `CERT-${nameSlug}-${timestamp}-${randomStr}`;
}

async function generateSingleCertificate(templatePath, data, fields) {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const { height } = page.getSize();
    
    for (const field of fields) {
        let value = data[field.fieldLabel];
        if (!value) continue;
        
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16) / 255,
                g: parseInt(result[2], 16) / 255,
                b: parseInt(result[3], 16) / 255
            } : { r: 0, g: 0, b: 0 };
        }
        
        const { r, g, b } = hexToRgb(field.fontColor);
        
        let x = field.x;
        let y = field.y;
        
        const textWidth = font.widthOfTextAtSize(value, field.fontSize);
        
        if (field.alignment === 'center') {
            x = x - (textWidth / 2);
        } else if (field.alignment === 'right') {
            x = x - textWidth;
        }
        
        page.drawText(value, {
            x,
            y,
            size: field.fontSize,
            font,
            color: rgb(r, g, b),
        });
    }
    
    return await pdfDoc.save();
}

export async function generateAndSendCertificate({ request, template, fields, adminNotes }) {
    const uniqueCode = generateUniqueCode(request.studentName, request.courseName);
    const batchId = `single-${Date.now()}`;
    
    // Prepare data for certificate generation
    const data = {
        Name: request.studentName,
        Course: request.courseName,
        Department: request.department || "",
        Date: request.completionDate ? new Date(request.completionDate).toLocaleDateString() : new Date().toLocaleDateString(),
    };

    // Download template from S3
    const templateResponse = await fetch(template.filePath);
    const templateBuffer = await templateResponse.arrayBuffer();
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempTemplatePath = path.join(tempDir, `template_${Date.now()}.pdf`);
    fs.writeFileSync(tempTemplatePath, Buffer.from(templateBuffer));

    // Generate certificate
    const outputPath = path.join(tempDir, `cert_${uniqueCode}.pdf`);
    const pdfBytes = await generateSingleCertificate(tempTemplatePath, data, fields);
    fs.writeFileSync(outputPath, pdfBytes);

    // Upload to S3
    const key = `certificates/requests/${batchId}/${uniqueCode}.pdf`;
    const fileBuffer = fs.readFileSync(outputPath);
    const s3Url = await uploadToS3({
        buffer: fileBuffer,
        key,
        mimetype: 'application/pdf',
        isPublic: false
    });

    // Create verification record
    await prisma.certificateVerification.create({
        data: {
            uniqueCode,
            certificateId: `req-${request.id}`,
            studentName: request.studentName,
            studentEmail: request.studentEmail,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
    });

    // Queue email for student
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${uniqueCode}`;
    
    await prisma.emailQueue.create({
        data: {
            to: request.studentEmail,
            toName: request.studentName,
            subject: "🎉 Your Certificate is Ready!",
            content: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Congratulations, ${request.studentName}!</h2>
                    <p>Your certificate for <strong>${request.courseName}</strong> has been generated and is ready.</p>
                    <p>You can view and download your certificate using the link below:</p>
                    <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                        <a href="${verifyUrl}" style="color: #2563eb; text-decoration: none; word-break: break-all;">
                            ${verifyUrl}
                        </a>
                    </div>
                    <p>Your certificate code: <strong>${uniqueCode}</strong></p>
                    <p>You can use this code to verify your certificate online.</p>
                    <hr style="margin: 20px 0;" />
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated message. If you have any questions, please contact the administrator.
                    </p>
                </div>
            `,
            priority: 1,
        }
    });

    // Clean up temp files
    fs.unlinkSync(tempTemplatePath);
    fs.unlinkSync(outputPath);

    return {
        certificateUrl: s3Url,
        uniqueCode,
        verifyUrl
    };
}