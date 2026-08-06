import prisma from "../lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

export const publicController = {
    // Submit certificate claim request
    claimCertificate: async (req, res) => {
        try {
            const {
                studentName,
                studentEmail,
                studentPhone,
                studentId,
                courseName,
                completionDate,
                department,
                additionalInfo
            } = req.body;

            // Validation
            if (!studentName || !studentEmail || !courseName) {
                return res.status(400).json({
                    success: false,
                    message: "Name, email, and course are required"
                });
            }

            // Check for duplicate pending request
            const existingRequest = await prisma.certificateRequest.findFirst({
                where: {
                    studentEmail,
                    courseName,
                    status: { in: ["PENDING", "APPROVED", "GENERATED"] }
                }
            });

            if (existingRequest) {
                return res.status(409).json({
                    success: false,
                    message: "You already have a pending request for this course"
                });
            }

            // Create certificate request
            const requestId = uuidv4();
            const certificateRequest = await prisma.certificateRequest.create({
                data: {
                    requestId,
                    studentName,
                    studentEmail,
                    studentPhone: studentPhone || null,
                    studentId: studentId || null,
                    courseName,
                    completionDate: completionDate ? new Date(completionDate) : null,
                    department: department || null,
                    additionalInfo: additionalInfo || null,
                    status: "PENDING",
                    ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
                    userAgent: req.headers['user-agent'] || null,
                }
            });

            // Add to email queue for admin notification
            await prisma.emailQueue.create({
                data: {
                    to: process.env.ADMIN_EMAIL || "admin@certificate.com",
                    toName: "Admin",
                    subject: "📋 New Certificate Request",
                    content: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px;">
                            <h2 style="color: #2563eb;">New Certificate Request</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0;"><strong>Request ID:</strong></td><td>${requestId}</td></tr>
                                <tr><td style="padding: 8px 0;"><strong>Student Name:</strong></td><td>${studentName}</td></tr>
                                <tr><td style="padding: 8px 0;"><strong>Student Email:</strong></td><td>${studentEmail}</td></tr>
                                <tr><td style="padding: 8px 0;"><strong>Course:</strong></td><td>${courseName}</td></tr>
                                <tr><td style="padding: 8px 0;"><strong>Department:</strong></td><td>${department || "N/A"}</td></tr>
                                <tr><td style="padding: 8px 0;"><strong>Submitted:</strong></td><td>${new Date().toLocaleString()}</td></tr>
                            </table>
                            <hr />
                            <p><strong>Additional Info:</strong></p>
                            <p>${additionalInfo || "None"}</p>
                            <hr />
                            <p style="margin-top: 20px;">
                                <a href="${process.env.ADMIN_URL}/admin/requests/${certificateRequest.id}" 
                                   style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                    View Request
                                </a>
                            </p>
                        </div>
                    `,
                    priority: 1,
                }
            });

            res.json({
                success: true,
                message: "Certificate request submitted successfully. You will receive an email once approved.",
                requestId: requestId
            });

        } catch (error) {
            console.error("Claim certificate error:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    },

    // Get request status (public)
    getRequestStatus: async (req, res) => {
        try {
            const { requestId } = req.params;

            const request = await prisma.certificateRequest.findUnique({
                where: { requestId },
                select: {
                    requestId: true,
                    studentName: true,
                    studentEmail: true,
                    courseName: true,
                    status: true,
                    rejectionReason: true,
                    certificateUrl: true,
                    uniqueCode: true,
                    createdAt: true,
                    approvedAt: true,
                }
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Request not found"
                });
            }

            // If approved, include verification link
            let verificationLink = null;
            if (request.uniqueCode) {
                verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${request.uniqueCode}`;
            }

            res.json({
                success: true,
                request: {
                    ...request,
                    verificationLink
                }
            });

        } catch (error) {
            console.error("Get request status error:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Internal server error"
            });
        }
    },

    // Public certificate verification
    verifyCertificate: async (req, res) => {
        try {
            const { uniqueCode } = req.params;

            const certificateItem = await prisma.bulkCertificateItem.findUnique({
                where: { uniqueCode },
                include: {
                    certificate: {
                        include: {
                            template: true
                        }
                    }
                }
            });

            if (!certificateItem) {
                return res.status(404).json({
                    valid: false,
                    message: "Certificate not found"
                });
            }

            // Create verification record
            await prisma.certificateVerification.create({
                data: {
                    uniqueCode,
                    certificateId: certificateItem.id,
                    studentName: certificateItem.recipientName,
                    studentEmail: certificateItem.recipientEmail || '',
                    verifiedCount: 1,
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            });

            res.json({
                valid: true,
                certificate: {
                    recipientName: certificateItem.recipientName,
                    issuedAt: certificateItem.issuedAt,
                    uniqueCode: certificateItem.uniqueCode,
                    templateUrl: certificateItem.certificate?.template?.filePath
                }
            });

        } catch (error) {
            console.error("Verify certificate error:", error);
            res.status(500).json({
                valid: false,
                message: error.message || "Internal server error"
            });
        }
    }
};