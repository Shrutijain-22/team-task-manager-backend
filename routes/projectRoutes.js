import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkProjectAdmin, checkProjectMember } from '../middleware/projectRoleMiddleware.js';

const router = express.Router();

router.post('/', protect, createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, checkProjectMember, getProjectById);
router.put('/:id', protect, checkProjectAdmin, updateProject);
router.delete('/:id', protect, checkProjectAdmin, deleteProject);
router.put('/:id/add-member', protect, checkProjectAdmin, addMember);
router.put('/:id/remove-member', protect, checkProjectAdmin, removeMember);

export default router;
