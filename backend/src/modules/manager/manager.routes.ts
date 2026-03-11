import { Router } from 'express';
import { asyncHandler } from '../../utils/response';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  handleListAdmins,
  handleCreateAdmin,
  handleDeactivateAdmin,
  handleReactivateAdmin,
  handleListClients,
  handleSetPropertyPriority,
} from './manager.controller';

export const managerRouter = Router();

// All manager routes require authentication + manager role
managerRouter.use(requireAuth, requireRole('manager'));

managerRouter.get('/admins', asyncHandler(handleListAdmins));
managerRouter.post('/admins', asyncHandler(handleCreateAdmin));
managerRouter.delete('/admins/:id', asyncHandler(handleDeactivateAdmin));
managerRouter.patch('/admins/:id/reactivate', asyncHandler(handleReactivateAdmin));
managerRouter.get('/clients', asyncHandler(handleListClients));
managerRouter.patch('/properties/:id/priority', asyncHandler(handleSetPropertyPriority));
