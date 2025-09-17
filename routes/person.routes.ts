import express from 'express';
import { getPeople, addPerson, updatePerson, deletePerson, syncFromGoogleSheets } from '../controllers/person.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Define routes
router.get('/', getPeople);              // GET /api/people
router.post('/', addPerson);             // POST /api/people
router.put('/:id', updatePerson);        // PUT /api/people/:id
router.delete('/:id', deletePerson);     // DELETE /api/people/:id
router.post('/sync', syncFromGoogleSheets); // POST /api/people/sync - NEW SYNC ROUTE

export default router;
