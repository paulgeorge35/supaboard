import { Router } from 'express';
import { applicationMiddleware } from '../../middleware/application';
import { requireAuth } from '../../middleware/auth';
import { getBoardBySlug } from './board.controller';
const router = Router();

router.get('/:slug', requireAuth, applicationMiddleware, getBoardBySlug);

export { router as boardRouter };
