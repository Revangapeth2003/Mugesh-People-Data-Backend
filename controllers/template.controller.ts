// backend/controllers/template.controller.ts - POSTGRESQL VERSION
import { Request, Response } from 'express';
import { TemplateModel } from '../models/template.model';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    console.log('📖 Getting templates for user:', req.user?.email);

    const templates = await TemplateModel.findAll();
    
    console.log(`✅ Found ${templates.length} templates`);

    // Map to frontend format
    const mappedTemplates = templates.map(template => ({
      id: template.id,
      title: template.title,
      body: template.body,
      createdBy: template.created_by,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    }));

    res.json({
      success: true,
      data: mappedTemplates,
      count: mappedTemplates.length
    });

  } catch (error: unknown) {
    console.error('❌ Error getting templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { title, body } = req.body;

    console.log('📝 Creating template:', title);

    // Validation
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    const templateData = {
      title: title.trim(),
      body: body.trim(),
      created_by: req.user?.id!,
    };

    const template = await TemplateModel.create(templateData);
    
    console.log('✅ Template created successfully:', template.id);

    // Map to frontend format
    const mappedTemplate = {
      id: template.id,
      title: template.title,
      body: template.body,
      createdBy: template.created_by,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: mappedTemplate
    });

  } catch (error: unknown) {
    console.error('❌ Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating template',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const template = await TemplateModel.findById(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });

  } catch (error: unknown) {
    console.error('❌ Error getting template by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching template',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    const { title, body } = req.body;
    
    if (isNaN(templateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    // Validation
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    // Check if template exists
    const existingTemplate = await TemplateModel.findById(templateId);
    
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permission - users can only edit their own templates (unless superadmin)
    if (req.user?.role !== 'superadmin' && existingTemplate.created_by !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {
      title: title.trim(),
      body: body.trim()
    };

    const updatedTemplate = await TemplateModel.updateById(templateId, updateData);
    
    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });

  } catch (error: unknown) {
    console.error('❌ Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating template',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    console.log('🗑️ Deleting template:', templateId);

    // Check if template exists
    const existingTemplate = await TemplateModel.findById(templateId);
    
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permission - users can only delete their own templates (unless superadmin)
    if (req.user?.role !== 'superadmin' && existingTemplate.created_by !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const deletedTemplate = await TemplateModel.findByIdAndDelete(templateId);
    
    if (!deletedTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    console.log('✅ Template deleted successfully:', deletedTemplate.title);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error: unknown) {
    console.error('❌ Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting template',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
