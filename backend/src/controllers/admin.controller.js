import prisma from "../lib/prisma.js";
import { generateAndSendCertificate } from "../services/certificateEmail.service.js";

export const adminController = {
    // Get all pending requests
    getPendingRequests: async (req, res) => {
        try {
            const requests = await prisma.certificateRequest.findMany({
                where: { status: "PENDING" },
                orderBy: { createdAt: 'desc' }
            });

            res.json({
                success: true,
                count: requests.length,
                requests
            });
        } catch (error) {
            console.error("Get pending requests error:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // Get all requests (with filters)
    getAllRequests: async (req, res) => {
        try {
            const { status } = req.query;
            const where = status ? { status } : {};
            
            const requests = await prisma.certificateRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });

            res.json({
                success: true,
                count: requests.length,
                requests
            });
        } catch (error) {
            console.error("Get all requests error:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // Get single request details
    getRequestById: async (req, res) => {
        try {
            const { id } = req.params;

            const request = await prisma.certificateRequest.findUnique({
                where: { id }
            });

            if (!request) {
                return res.status(404).json({ error: "Request not found" });
            }

            res.json({
                success: true,
                request
            });

        } catch (error) {
            console.error("Get request by ID error:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // Approve request and generate certificate
    // approveRequest: async (req, res) => {
    //     try {
    //         const { id } = req.params;
    //         const { templateId, adminNotes } = req.body;

    //         const request = await prisma.certificateRequest.findUnique({
    //             where: { id }
    //         });

    //         if (!request) {
    //             return res.status(404).json({ error: "Request not found" });
    //         }

    //         // Get template
    //         const template = await prisma.template.findUnique({
    //             where: { id: templateId }
    //         });

    //         if (!template) {
    //             return res.status(404).json({ error: "Template not found" });
    //         }

    //         // Get template fields
    //         const fields = await prisma.templateField.findMany({
    //             where: { templateId: template.id }
    //         });

    //         // Generate certificate and send email
    //         const result = await generateAndSendCertificate({
    //             request,
    //             template,
    //             fields,
    //             adminNotes
    //         });

    //         // Update request status
    //         await prisma.certificateRequest.update({
    //             where: { id },
    //             data: {
    //                 status: "GENERATED",
    //                 approvedAt: new Date(),
    //                 adminNotes,
    //                 certificateUrl: result.certificateUrl,
    //                 uniqueCode: result.uniqueCode,
    //             }
    //         });

    //         res.json({
    //             success: true,
    //             message: "Certificate generated and sent successfully",
    //             certificateUrl: result.certificateUrl
    //         });

    //     } catch (error) {
    //         console.error("Approve request error:", error);
    //         res.status(500).json({ error: error.message });
    //     }
    // },

    // Approve request and generate certificate
    approveRequest: async (req, res) => {
        try {
            const { id } = req.params;
            const { templateId, adminNotes } = req.body;

            // ✅ Validate templateId
            if (!templateId) {
                return res.status(400).json({ 
                    error: "templateId is required. Please select a template." 
                });
            }

            const request = await prisma.certificateRequest.findUnique({
                where: { id }
            });

            if (!request) {
                return res.status(404).json({ error: "Request not found" });
            }

            // Get template
            const template = await prisma.template.findUnique({
                where: { id: templateId }
            });

            if (!template) {
                return res.status(404).json({ error: "Template not found" });
            }

            // Get template fields
            const fields = await prisma.templateField.findMany({
                where: { templateId: template.id }
            });

            // Generate certificate and send email
            const result = await generateAndSendCertificate({
                request,
                template,
                fields,
                adminNotes
            });

            // Update request status
            await prisma.certificateRequest.update({
                where: { id },
                data: {
                    status: "GENERATED",
                    approvedAt: new Date(),
                    adminNotes: adminNotes || null,
                    certificateUrl: result.certificateUrl,
                    uniqueCode: result.uniqueCode,
                }
            });

            res.json({
                success: true,
                message: "Certificate generated and sent successfully",
                certificateUrl: result.certificateUrl,
                uniqueCode: result.uniqueCode
            });

        } catch (error) {
            console.error("Approve request error:", error);
            res.status(500).json({ error: error.message });
        }
    },

    // Reject request
    rejectRequest: async (req, res) => {
        try {
            const { id } = req.params;
            const { rejectionReason } = req.body;

            const request = await prisma.certificateRequest.findUnique({
                where: { id }
            });

            if (!request) {
                return res.status(404).json({ error: "Request not found" });
            }

            // Update request status
            await prisma.certificateRequest.update({
                where: { id },
                data: {
                    status: "REJECTED",
                    rejectionReason,
                }
            });

            // Send rejection email
            await prisma.emailQueue.create({
                data: {
                    to: request.studentEmail,
                    toName: request.studentName,
                    subject: "Certificate Request Update",
                    content: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px;">
                            <h2 style="color: #dc2626;">Certificate Request Status</h2>
                            <p>Dear ${request.studentName},</p>
                            <p>We regret to inform you that your certificate request for <strong>${request.courseName}</strong> has been rejected.</p>
                            <p><strong>Reason:</strong> ${rejectionReason || "No reason provided"}</p>
                            <p>If you have any questions, please contact the administrator.</p>
                            <br/>
                            <p>Regards,<br/>Certificate Management Team</p>
                        </div>
                    `,
                    priority: 2,
                }
            });

            res.json({
                success: true,
                message: "Request rejected successfully"
            });

        } catch (error) {
            console.error("Reject request error:", error);
            res.status(500).json({ error: error.message });
        }
    }
};