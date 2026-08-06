import prisma from "../lib/prisma.js";

export const verificationController = {
    verifyCertificate: async (req, res) => {
        try {
            const { uniqueCode } = req.params;
            
            const certificate = await prisma.bulkCertificateItem.findUnique({
                where: { uniqueCode },
                include: {
                    certificate: {
                        include: {
                            template: true
                        }
                    }
                }
            });
            
            if (!certificate) {
                return res.status(404).json({ 
                    valid: false, 
                    message: "Certificate not found" 
                });
            }
            
            // Create verification record
            await prisma.certificateVerification.create({
                data: {
                    uniqueCode,
                    certificateId: certificate.id,
                    studentName: certificate.recipientName,
                    studentEmail: certificate.recipientEmail || '',
                    verifiedCount: 1,
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            });
            
            return res.json({
                valid: true,
                certificate: {
                    recipientName: certificate.recipientName,
                    issuedAt: certificate.issuedAt,
                    templateUrl: certificate.certificate?.template?.filePath
                }
            });
        } catch (error) {
            console.error("Verification error:", error);
            res.status(500).json({ error: error.message });
        }
    }
};