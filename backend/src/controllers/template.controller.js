import prisma from "../lib/prisma.js";

export const templateController = {
  // Get all templates
  // getAllTemplates: async (req, res) => {
  //   try {
  //     const templates = await prisma.template.findMany({
  //       orderBy: { createdAt: "desc" },
  //     });

  //     const formattedTemplates = templates.map((template) => ({
  //       id: template.id,
  //       filename: template.name,
  //       originalName: template.name,
  //       s3Url: template.filePath,
  //       claimUrl: template.claimUrl,
  //       isPublic: template.isPublic,
  //       size: 0,
  //       createdAt: template.createdAt,
  //       modifiedAt: template.updatedAt,
  //     }));

  //     res.json({
  //       success: true,
  //       count: formattedTemplates.length,
  //       templates: formattedTemplates,
  //     });
  //   } catch (error) {
  //     console.error("Get all templates error:", error);
  //     res.status(500).json({ error: error.message });
  //   }
  // },

  getAllTemplates: async (req, res) => {
    try {
      // ✅ Get the logged-in user from request
      const user = req.user;

      console.log("user at getAllTemplates", user)

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      // ✅ Check user role - SUPERADMIN sees all, others see only their own
      const isSuperAdmin = user.role === "SUPERADMIN";

      const templates = await prisma.template.findMany({
        where: isSuperAdmin
          ? {} // ✅ SUPERADMIN: get all templates
          : { adminId: user.id }, // ✅ Regular admin: get only their templates
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              certificates: true,
              requests: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedTemplates = templates.map((template) => ({
        id: template.id,
        filename: template.name,
        originalName: template.name,
        s3Url: template.filePath,
        claimUrl: template.claimUrl,
        isPublic: template.isPublic,
        adminId: template.adminId, // ✅ Include adminId to show ownership
        fields: template.fields,
        stats: {
          certificatesCount: template._count.certificates,
          requestsCount: template._count.requests,
        },
        size: 0,
        createdAt: template.createdAt,
        modifiedAt: template.updatedAt,
      }));

      res.json({
        success: true,
        count: formattedTemplates.length,
        templates: formattedTemplates,
        // ✅ Include user context in response
        user: {
          id: user.id,
          role: user.role,
          isSuperAdmin,
        },
      });
    } catch (error) {
      console.error("Get all templates error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  getTemplatesByUser: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const templates = await prisma.template.findMany({
        where: {
          adminId: userId,
        },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              certificates: true,
              requests: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedTemplates = templates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        filePath: template.filePath,
        thumbnail: template.thumbnail,
        claimUrl: template.claimUrl,
        isPublic: template.isPublic,
        requireUrn: template.requireUrn,
        fields: template.fields.map((field) => ({
          id: field.id,
          fieldName: field.fieldName,
          fieldLabel: field.fieldLabel,
          x: field.x,
          y: field.y,
          fontSize: field.fontSize,
          fontColor: field.fontColor,
          alignment: field.alignment,
          isRequired: field.isRequired,
          isDefault: field.isDefault,
          order: field.order,
        })),
        stats: {
          certificatesCount: template._count.certificates,
          requestsCount: template._count.requests,
        },
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }));

      res.json({
        success: true,
        count: formattedTemplates.length,
        templates: formattedTemplates,
      });
    } catch (error) {
      console.error("Get templates by user error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get template by ID
  // getTemplateById: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const template = await prisma.template.findUnique({
  //       where: { id },
  //       include: {
  //         fields: {
  //           orderBy: { order: "asc" },
  //         },
  //       },
  //     });

  //     if (!template) {
  //       return res.status(404).json({ error: "Template not found" });
  //     }

  //     res.json({
  //       success: true,
  //       template: {
  //         id: template.id,
  //         filename: template.name,
  //         originalName: template.name,
  //         s3Url: template.filePath,
  //         claimUrl: template.claimUrl,
  //         isPublic: template.isPublic,
  //         fields: template.fields,
  //         size: 0,
  //         createdAt: template.createdAt,
  //         modifiedAt: template.updatedAt,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Get template by ID error:", error);
  //     res.status(500).json({ error: error.message });
  //   }
  // },

  // Get template by ID
  getTemplateById: async (req, res) => {
    try {
      const { id } = req.params;
      const template = await prisma.template.findUnique({
        where: { id },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      res.json({
        success: true,
        template: {
          id: template.id,
          filename: template.name,
          originalName: template.name,
          s3Url: template.filePath,
          claimUrl: template.claimUrl,
          isPublic: template.isPublic,
          requireUrn: template.requireUrn,
          fields: template.fields.map((field) => ({
            id: field.id,
            fieldName: field.fieldName,
            fieldLabel: field.fieldLabel,
            x: field.x,
            y: field.y,
            fontSize: field.fontSize,
            fontColor: field.fontColor,
            alignment: field.alignment,
            isRequired: field.isRequired,
            isDefault: field.isDefault, // ✅ Include isDefault flag
            order: field.order,
          })),
          size: 0,
          createdAt: template.createdAt,
          modifiedAt: template.updatedAt,
        },
      });
    } catch (error) {
      console.error("Get template by ID error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get template file by filename (for download)
  getTemplate: async (req, res) => {
    try {
      const { filename } = req.params;
      const template = await prisma.template.findFirst({
        where: { name: filename },
      });

      if (!template || !template.filePath) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Redirect to S3 URL or send file
      res.redirect(template.filePath);
    } catch (error) {
      console.error("Get template error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get template by claim URL (public - no auth)
  // getTemplateByClaimUrl: async (req, res) => {
  //   try {
  //     const { claimUrl } = req.params;

  //     const template = await prisma.template.findFirst({
  //       where: {
  //         claimUrl,
  //         isPublic: true,
  //         isActive: true,
  //       },
  //       include: {
  //         fields: {
  //           orderBy: { order: "asc" },
  //         },
  //       },
  //     });

  //     if (!template) {
  //       return res.status(404).json({
  //         success: false,
  //         error: "Invalid claim URL or form is not active"
  //       });
  //     }

  //     res.json({
  //       success: true,
  //       template: {
  //         id: template.id,
  //         name: template.name,
  //         description: template.description,
  //         fields: template.fields.map(field => ({
  //           id: field.id,
  //           fieldLabel: field.fieldLabel,
  //           fieldName: field.fieldName,
  //           isRequired: field.isRequired,
  //         })),
  //         thumbnail: template.thumbnail,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Get template by claim URL error:", error);
  //     res.status(500).json({ error: error.message });
  //   }
  // },

  // Get template by claim URL (public - no auth)
  getTemplateByClaimUrl: async (req, res) => {
    try {
      const { claimUrl } = req.params;

      const template = await prisma.template.findFirst({
        where: {
          claimUrl,
          isPublic: true,
          isActive: true,
        },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Invalid claim URL or form is not active",
        });
      }

      // ✅ Define default fields (always present)
      const defaultFields = [
        {
          id: "default_name",
          fieldName: "studentName",
          fieldLabel: "Full Name",
          isRequired: true,
          fieldType: "text",
          isDefault: true,
        },
        {
          id: "default_email",
          fieldName: "studentEmail",
          fieldLabel: "Email Address",
          isRequired: true,
          fieldType: "email",
          isDefault: true,
        },
        {
          id: "default_urn",
          fieldName: "studentUrn",
          fieldLabel: "URN (University Registration Number)",
          isRequired: template.requireUrn, // ✅ Depends on template setting
          fieldType: "text",
          isDefault: true,
        },
        {
          id: "default_date",
          fieldName: "completionDate",
          fieldLabel: "Completion Date",
          isRequired: false,
          fieldType: "date",
          isDefault: true,
        },
      ];

      // ✅ Combine default fields with custom fields from database
      const allFields = [
        ...defaultFields,
        ...template.fields.map((field) => ({
          id: field.id,
          fieldName: field.fieldName,
          fieldLabel: field.fieldLabel,
          isRequired: field.isRequired,
          fieldType: "text",
          isDefault: false,
        })),
      ];

      res.json({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          requireUrn: template.requireUrn,
          fields: allFields,
          thumbnail: template.thumbnail,
        },
      });
    } catch (error) {
      console.error("Get template by claim URL error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get all public templates (for admin to see which have claim forms)
  getPublicTemplates: async (req, res) => {
    try {
      const templates = await prisma.template.findMany({
        where: {
          isPublic: true,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          claimUrl: true,
          description: true,
          createdAt: true,
          _count: {
            select: { requests: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        templates,
      });
    } catch (error) {
      console.error("Get public templates error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Generate/Update claim URL for template
  // updateClaimUrl: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const { claimUrl, isPublic } = req.body;

  //     if (!claimUrl) {
  //       return res.status(400).json({
  //         error: "Claim URL is required"
  //       });
  //     }

  //     // Check if claimUrl is unique (excluding current template)
  //     const existing = await prisma.template.findFirst({
  //       where: {
  //         claimUrl,
  //         id: { not: id },
  //       },
  //     });

  //     if (existing) {
  //       return res.status(400).json({
  //         error: "Claim URL already exists. Please use a different one."
  //       });
  //     }

  //     const template = await prisma.template.update({
  //       where: { id },
  //       data: {
  //         claimUrl,
  //         isPublic: isPublic !== undefined ? isPublic : true,
  //       },
  //     });

  //     const claimFormUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/claim/${claimUrl}`;

  //     res.json({
  //       success: true,
  //       message: "Claim URL updated successfully",
  //       template: {
  //         id: template.id,
  //         name: template.name,
  //         claimUrl: template.claimUrl,
  //         isPublic: template.isPublic,
  //       },
  //       claimFormUrl,
  //     });
  //   } catch (error) {
  //     console.error("Update claim URL error:", error);
  //     res.status(500).json({ error: error.message });
  //   }
  // },

  // Generate/Update claim URL for template
  updateClaimUrl: async (req, res) => {
    try {
      const { id } = req.params;
      const { claimUrl, isPublic, requireUrn } = req.body; // ✅ Add requireUrn

      if (!claimUrl) {
        return res.status(400).json({
          error: "Claim URL is required",
        });
      }

      // Check if claimUrl is unique (excluding current template)
      const existing = await prisma.template.findFirst({
        where: {
          claimUrl,
          id: { not: id },
        },
      });

      if (existing) {
        return res.status(400).json({
          error: "Claim URL already exists. Please use a different one.",
        });
      }

      const template = await prisma.template.update({
        where: { id },
        data: {
          claimUrl,
          isPublic: isPublic !== undefined ? isPublic : true,
          requireUrn: requireUrn !== undefined ? requireUrn : false, // ✅ Save requireUrn
        },
      });

      const claimFormUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/claim/${claimUrl}`;

      res.json({
        success: true,
        message: "Claim URL updated successfully",
        template: {
          id: template.id,
          name: template.name,
          claimUrl: template.claimUrl,
          isPublic: template.isPublic,
          requireUrn: template.requireUrn, // ✅ Return requireUrn
        },
        claimFormUrl,
      });
    } catch (error) {
      console.error("Update claim URL error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update template fields - Replace all fields
  // updateTemplateFields: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const { fields } = req.body;

  //     // Verify template exists
  //     const template = await prisma.template.findUnique({
  //       where: { id },
  //     });

  //     if (!template) {
  //       return res.status(404).json({ error: "Template not found" });
  //     }

  //     // Delete all existing fields for this template
  //     await prisma.templateField.deleteMany({
  //       where: { templateId: id },
  //     });

  //     // Create all fields from scratch
  //     for (let i = 0; i < fields.length; i++) {
  //       const field = fields[i];
  //       await prisma.templateField.create({
  //         data: {
  //           templateId: id,
  //           fieldName: field.fieldName,
  //           fieldLabel: field.fieldLabel,
  //           x: field.x,
  //           y: field.y,
  //           fontSize: field.fontSize,
  //           fontColor: field.fontColor,
  //           alignment: field.alignment,
  //           isRequired: field.isRequired ?? true,
  //           order: i,
  //         },
  //       });
  //     }

  //     // Return updated template with fields
  //     const updatedTemplate = await prisma.template.findUnique({
  //       where: { id },
  //       include: {
  //         fields: {
  //           orderBy: { order: "asc" },
  //         },
  //       },
  //     });

  //     res.json({
  //       success: true,
  //       message: "Template fields updated successfully",
  //       template: updatedTemplate,
  //     });
  //   } catch (error) {
  //     console.error("Update template fields error:", error);
  //     res.status(500).json({ error: error.message });
  //   }
  // },

  // Update template fields - Preserve default fields, only replace custom fields
  updateTemplateFields: async (req, res) => {
    try {
      const { id } = req.params;
      const { fields } = req.body;

      // Verify template exists
      const template = await prisma.template.findUnique({
        where: { id },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // ✅ Separate default fields from custom fields
      const defaultFields = fields.filter((f) => f.isDefault === true);
      const customFields = fields.filter((f) => f.isDefault !== true);

      // ✅ Update default fields (preserve their IDs, update positions/fonts)
      for (const field of defaultFields) {
        if (field.id) {
          // Update existing default field
          await prisma.templateField.update({
            where: { id: field.id },
            data: {
              x: field.x,
              y: field.y,
              fontSize: field.fontSize,
              fontColor: field.fontColor,
              alignment: field.alignment,
              isRequired: field.isRequired ?? true,
              order: field.order ?? 0,
            },
          });
        } else {
          // Create new default field (should not happen, but just in case)
          await prisma.templateField.create({
            data: {
              templateId: id,
              fieldName: field.fieldName,
              fieldLabel: field.fieldLabel,
              x: field.x,
              y: field.y,
              fontSize: field.fontSize,
              fontColor: field.fontColor,
              alignment: field.alignment,
              isRequired: field.isRequired ?? true,
              isDefault: true,
              order: field.order ?? 0,
            },
          });
        }
      }

      // ✅ Delete ONLY custom fields (not default fields)
      await prisma.templateField.deleteMany({
        where: {
          templateId: id,
          isDefault: false,
        },
      });

      // ✅ Create only custom fields
      for (let i = 0; i < customFields.length; i++) {
        const field = customFields[i];
        await prisma.templateField.create({
          data: {
            templateId: id,
            fieldName: field.fieldName,
            fieldLabel: field.fieldLabel,
            x: field.x,
            y: field.y,
            fontSize: field.fontSize,
            fontColor: field.fontColor,
            alignment: field.alignment,
            isRequired: field.isRequired ?? true,
            isDefault: false,
            order: i,
          },
        });
      }

      // Return updated template with all fields
      const updatedTemplate = await prisma.template.findUnique({
        where: { id },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      });

      res.json({
        success: true,
        message: "Template fields updated successfully",
        template: updatedTemplate,
      });
    } catch (error) {
      console.error("Update template fields error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete template
  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      const template = await prisma.template.findUnique({
        where: { id },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      await prisma.template.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Template deleted successfully",
      });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ error: error.message });
    }
  },
};
