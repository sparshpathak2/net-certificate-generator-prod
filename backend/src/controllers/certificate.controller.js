import prisma from "../lib/prisma.js";

export const certificateController = {
  // Get all certificate batches for logged-in user
  getAllCertificates: async (req, res) => {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const certificates = await prisma.certificate.findMany({
        where: { adminId },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              filePath: true,
            },
          },
          certificates: {
            select: {
              id: true,
              recipientName: true,
              recipientEmail: true,
              uniqueCode: true,
              filePath: true,
              isIssued: true,
              issuedAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // const formattedCertificates = certificates.map(cert => ({
      //     id: cert.id,
      //     title: cert.title,
      //     template: cert.template,
      //     totalCount: cert.totalCount,
      //     status: cert.status,
      //     downloadUrl: cert.downloadUrl,
      //     createdAt: cert.createdAt,
      //     completedAt: cert.completedAt,
      //     certificates: cert.certificates
      // }));

      const formattedCertificates = certificates.map((cert) => ({
        id: cert.id,
        title: cert.title,
        template: cert.template,
        totalCount: cert.totalCount,
        status: cert.status,
        downloadUrl: cert.downloadUrl,
        createdAt: cert.createdAt,
        completedAt: cert.completedAt,
        certificates: cert.certificates.map((item) => ({
          id: item.id,
          recipientName: item.recipientName,
          recipientEmail: item.recipientEmail,
          uniqueCode: item.uniqueCode,
          downloadUrl: item.filePath, // ✅ Add S3 URL as downloadUrl
          isIssued: item.isIssued,
          issuedAt: item.issuedAt,
          createdAt: item.createdAt,
        })),
      }));

      res.json({
        success: true,
        count: formattedCertificates.length,
        certificates: formattedCertificates,
      });
    } catch (error) {
      console.error("Get all certificates error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get ALL individual certificates for logged-in user
  // getAllCertificateItems: async (req, res) => {
  //   try {
  //     const adminId = req.user?.id;

  //     if (!adminId) {
  //       return res.status(401).json({ error: "User not authenticated" });
  //     }

  //     const certificateItems = await prisma.bulkCertificateItem.findMany({
  //       where: {
  //         certificate: {
  //           adminId: adminId,
  //         },
  //       },
  //       include: {
  //         certificate: {
  //           include: {
  //             template: {
  //               select: {
  //                 id: true,
  //                 name: true,
  //               },
  //             },
  //             admin: {
  //               select: {
  //                 id: true,
  //                 name: true,
  //                 email: true,
  //                 role: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //       orderBy: { createdAt: "desc" },
  //     });

  //     const formattedItems = certificateItems.map((item) => ({
  //       id: item.id,
  //       uniqueCode: item.uniqueCode,
  //       recipientName: item.recipientName,
  //       recipientEmail: item.recipientEmail,
  //       isIssued: item.isIssued,
  //       issuedAt: item.issuedAt,
  //       createdAt: item.createdAt,
  //       downloadUrl: item.filePath,
  //       batchTitle: item.certificate.title,
  //       templateName: item.certificate.template?.name,
  //       // Admin (createdBy) details
  //       createdBy: {
  //         id: item.certificate.admin.id,
  //         name: item.certificate.admin.name,
  //         email: item.certificate.admin.email,
  //         role: item.certificate.admin.role,
  //       },
  //     }));

  //     res.json({
  //       success: true,
  //       count: formattedItems.length,
  //       certificates: formattedItems,
  //     });
  //   } catch (error) {
  //     console.error("Get all certificate items error:", error);
  //     res.status(500).json({ error: error.message });
  //   }
  // },

  getAllCertificateItems: async (req, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      console.log("userRole:", userRole)

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Build the where condition based on user role
      let whereCondition = {};

      // If user is SUPERADMIN, show all certificates
      if (userRole === "SUPERADMIN") {
        whereCondition = {}; // No filter - get all certificates
      } else {
        // For ADMIN users, only show certificates they created
        whereCondition = {
          certificate: {
            adminId: userId,
          },
        };
      }

      const certificateItems = await prisma.bulkCertificateItem.findMany({
        where: whereCondition,
        include: {
          certificate: {
            include: {
              template: {
                select: {
                  id: true,
                  name: true,
                },
              },
              admin: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedItems = certificateItems.map((item) => ({
        id: item.id,
        uniqueCode: item.uniqueCode,
        recipientName: item.recipientName,
        recipientEmail: item.recipientEmail,
        isIssued: item.isIssued,
        issuedAt: item.issuedAt,
        createdAt: item.createdAt,
        downloadUrl: item.filePath,
        batchTitle: item.certificate.title,
        templateName: item.certificate.template?.name,
        // Admin (createdBy) details
        createdBy: {
          id: item.certificate.admin.id,
          name: item.certificate.admin.name,
          email: item.certificate.admin.email,
          role: item.certificate.admin.role,
        },
      }));

      res.json({
        success: true,
        count: formattedItems.length,
        certificates: formattedItems,
      });
    } catch (error) {
      console.error("Get all certificate items error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get a single certificate batch by ID
  getCertificateById: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const certificate = await prisma.certificate.findFirst({
        where: {
          id: id,
          adminId: adminId,
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              filePath: true,
            },
          },
          certificates: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!certificate) {
        return res.status(404).json({ error: "Certificate batch not found" });
      }

      res.json({
        success: true,
        certificate,
      });
    } catch (error) {
      console.error("Get certificate by ID error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get a single certificate item (individual certificate) by ID
  getCertificateItemById: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const certificateItem = await prisma.bulkCertificateItem.findFirst({
        where: {
          id: id,
          certificate: {
            adminId: adminId,
          },
        },
        include: {
          certificate: {
            include: {
              template: true,
            },
          },
        },
      });

      if (!certificateItem) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      res.json({
        success: true,
        certificate: certificateItem,
      });
    } catch (error) {
      console.error("Get certificate item error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Download individual certificate
  downloadCertificate: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const certificateItem = await prisma.bulkCertificateItem.findFirst({
        where: {
          id: id,
          certificate: {
            adminId: adminId,
          },
        },
      });

      if (!certificateItem || !certificateItem.filePath) {
        return res.status(404).json({ error: "Certificate file not found" });
      }

      // Redirect to S3 URL for download
      res.redirect(certificateItem.filePath);
    } catch (error) {
      console.error("Download certificate error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Download batch ZIP (if stored)
  downloadBatchZip: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const certificate = await prisma.certificate.findFirst({
        where: {
          id: id,
          adminId: adminId,
        },
      });

      if (!certificate || !certificate.downloadUrl) {
        return res.status(404).json({ error: "Batch ZIP not found" });
      }

      res.redirect(certificate.downloadUrl);
    } catch (error) {
      console.error("Download batch ZIP error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get certificate by unique code (public endpoint - for verification)
  getCertificateByUniqueCode: async (req, res) => {
    try {
      const { uniqueCode } = req.params;

      const certificateItem = await prisma.bulkCertificateItem.findUnique({
        where: { uniqueCode },
        include: {
          certificate: {
            include: {
              template: true,
            },
          },
        },
      });

      if (!certificateItem) {
        return res.status(404).json({
          valid: false,
          message: "Certificate not found",
        });
      }

      // Create verification record
      await prisma.certificateVerification.create({
        data: {
          uniqueCode,
          certificateId: certificateItem.id,
          studentName: certificateItem.recipientName,
          studentEmail: certificateItem.recipientEmail || "",
          verifiedCount: 1,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      res.json({
        valid: true,
        certificate: {
          id: certificateItem.id,
          recipientName: certificateItem.recipientName,
          issuedAt: certificateItem.issuedAt,
          uniqueCode: certificateItem.uniqueCode,
          templateUrl: certificateItem.certificate?.template?.filePath,
        },
      });
    } catch (error) {
      console.error("Verify certificate error:", error);
      res.status(500).json({ error: error.message });
    }
  },
};
