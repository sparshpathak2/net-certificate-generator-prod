import prisma from "../lib/prisma.js";

export const templateController = {
  // Get all templates
  getAllTemplates: async (req, res) => {
    try {
      const templates = await prisma.template.findMany({
        orderBy: { createdAt: "desc" },
      });

      const formattedTemplates = templates.map((template) => ({
        id: template.id,
        filename: template.name,
        originalName: template.name,
        s3Url: template.filePath,
        size: 0,
        createdAt: template.createdAt,
        modifiedAt: template.updatedAt,
      }));

      res.json({
        success: true,
        count: formattedTemplates.length,
        templates: formattedTemplates,
      });
    } catch (error) {
      console.error("Get all templates error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get template by ID
  //   getTemplateById: async (req, res) => {
  //     try {
  //       const { id } = req.params;
  //       const template = await prisma.template.findUnique({
  //         where: { id },
  //       });

  //       if (!template) {
  //         return res.status(404).json({ error: "Template not found" });
  //       }

  //       res.json({
  //         success: true,
  //         template: {
  //           id: template.id,
  //           filename: template.name,
  //           originalName: template.name,
  //           s3Url: template.filePath,
  //           size: 0,
  //           createdAt: template.createdAt,
  //           modifiedAt: template.updatedAt,
  //         },
  //       });
  //     } catch (error) {
  //       console.error("Get template by ID error:", error);
  //       res.status(500).json({ error: error.message });
  //     }
  //   },
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
          fields: template.fields, // Raw field data from database
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

  // Update template fields (add, edit, delete in one call)
  // updateTemplateFields: async (req, res) => {
  //     try {
  //         const { id } = req.params;
  //         const { fields } = req.body; // Array of field objects

  //         // Verify template exists
  //         const template = await prisma.template.findUnique({
  //             where: { id }
  //         });

  //         if (!template) {
  //             return res.status(404).json({ error: 'Template not found' });
  //         }

  //         // Get existing fields
  //         const existingFields = await prisma.templateField.findMany({
  //             where: { templateId: id }
  //         });

  //         const existingFieldIds = existingFields.map(f => f.id);
  //         const incomingFieldIds = fields.filter(f => f.id).map(f => f.id);

  //         // 1. Delete fields that are not in the incoming array
  //         const fieldsToDelete = existingFieldIds.filter(id => !incomingFieldIds.includes(id));

  //         if (fieldsToDelete.length > 0) {
  //             await prisma.templateField.deleteMany({
  //                 where: {
  //                     id: { in: fieldsToDelete }
  //                 }
  //             });
  //         }

  //         // 2. Update or create fields
  //         for (let i = 0; i < fields.length; i++) {
  //             const field = fields[i];

  //             if (field.id) {
  //                 // Update existing field
  //                 await prisma.templateField.update({
  //                     where: { id: field.id },
  //                     data: {
  //                         fieldName: field.fieldName,
  //                         fieldLabel: field.fieldLabel,
  //                         x: field.x,
  //                         y: field.y,
  //                         fontSize: field.fontSize,
  //                         fontColor: field.fontColor,
  //                         alignment: field.alignment,
  //                         isRequired: field.isRequired ?? true,
  //                         order: i,
  //                         updatedAt: new Date()
  //                     }
  //                 });
  //             } else {
  //                 // Create new field
  //                 await prisma.templateField.create({
  //                     data: {
  //                         templateId: id,
  //                         fieldName: field.fieldName,
  //                         fieldLabel: field.fieldLabel,
  //                         x: field.x,
  //                         y: field.y,
  //                         fontSize: field.fontSize,
  //                         fontColor: field.fontColor,
  //                         alignment: field.alignment,
  //                         isRequired: field.isRequired ?? true,
  //                         order: i
  //                     }
  //                 });
  //             }
  //         }

  //         // Return updated template with fields
  //         const updatedTemplate = await prisma.template.findUnique({
  //             where: { id },
  //             include: {
  //                 fields: {
  //                     orderBy: { order: 'asc' }
  //                 }
  //             }
  //         });

  //         res.json({
  //             success: true,
  //             message: 'Template fields updated successfully',
  //             template: updatedTemplate
  //         });

  //     } catch (error) {
  //         console.error('Update template fields error:', error);
  //         res.status(500).json({ error: error.message });
  //     }
  // },
  // Update template fields - Replace all fields
  updateTemplateFields: async (req, res) => {
    try {
      const { id } = req.params;
      const { fields } = req.body; // Array of field objects

      // Verify template exists
      const template = await prisma.template.findUnique({
        where: { id },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Delete all existing fields for this template
      await prisma.templateField.deleteMany({
        where: { templateId: id },
      });

      // Create all fields from scratch
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
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
            order: i,
          },
        });
      }

      // Return updated template with fields
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
