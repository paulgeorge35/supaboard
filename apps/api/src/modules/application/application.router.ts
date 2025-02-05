import { Router } from 'express';
import { applicationMiddleware } from '../../middleware/application';
import { requireAuth } from '../../middleware/auth';
import { getApplication, getBoards } from './application.controller';

const router = Router();

router.get('/', applicationMiddleware, getApplication);
router.get('/boards', requireAuth, applicationMiddleware, getBoards);

export { router as applicationRouter };
