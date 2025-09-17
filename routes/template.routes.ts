// backend/routes/template.routes.ts - ENHANCED VERSION
import express from 'express';
import {
  getTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '../controllers/template.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Template routes
router.get('/', getTemplates);           // GET /api/templates - Get all templates
router.post('/', createTemplate);       // POST /api/templates - Create template
router.get('/:id', getTemplateById);    // GET /api/templates/:id - Get template by ID
router.put('/:id', updateTemplate);     // PUT /api/templates/:id - Update template
router.delete('/:id', deleteTemplate);  // DELETE /api/templates/:id - Delete template

export default router;
