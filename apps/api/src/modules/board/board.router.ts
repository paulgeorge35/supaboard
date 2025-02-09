import { Router } from 'express';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { applicationMiddleware } from '../../middleware/application';
import { requireAuth } from '../../middleware/auth';
import { categorySubscription, createCategory, deleteCategory, getBoardBySlug, getBoardBySlugDetailed, getCategories, updateBoard, updateCategory } from './board.controller';
const router = Router();

router.get('/:slug', requireAuth, applicationMiddleware, getBoardBySlug);
router.get('/:slug/detailed', requireAuth, applicationMiddleware, getBoardBySlugDetailed);
router.put('/:slug', requireAuth, applicationMiddleware, adminMiddleware, updateBoard);
router.get('/:slug/categories', requireAuth, applicationMiddleware, getCategories);
router.post('/:slug/categories', requireAuth, applicationMiddleware, adminMiddleware, createCategory);
router.put('/:slug/categories/:categorySlug', requireAuth, applicationMiddleware, adminMiddleware, updateCategory);
router.delete('/:slug/categories/:categorySlug', requireAuth, applicationMiddleware, adminMiddleware, deleteCategory);
router.post('/:slug/categories/:categorySlug/subscription', requireAuth, applicationMiddleware, categorySubscription);

export { router as boardRouter };
