import { Router } from 'express';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { applicationMiddleware } from '../../middleware/application';
import { requireAuth } from '../../middleware/auth';
import { getApplication, getBoards, updateApplication } from './application.controller';

const router = Router();

router.get('/', applicationMiddleware, getApplication);
router.put('/', requireAuth, applicationMiddleware, adminMiddleware, updateApplication);
router.get('/boards', requireAuth, applicationMiddleware, getBoards);

export { router as applicationRouter };
