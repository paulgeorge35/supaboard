import { admin, application, session } from '@/middleware';
import { Router } from 'express';
import { controller } from './board.controller';

const router = Router();

// Board
router.get('/:slug', session, application, controller.board.get);
router.get('/:slug/detailed', session, application, controller.board.getDetailed);
router.post('/', session, application, admin, controller.board.create);
router.put('/:slug', session, application, admin, controller.board.update);
router.delete('/:slug', session, application, admin, controller.board.delete);

// Category
router.get('/:slug/categories', session, application, controller.category.get);
router.post('/:slug/categories', session, application, admin, controller.category.create);
router.put('/:slug/categories/:categorySlug', session, application, admin, controller.category.update);
router.delete('/:slug/categories/:categorySlug', session, application, admin, controller.category.delete);
router.post('/:slug/categories/:categorySlug/subscription', session, application, controller.category.subscribe);

// Tag
router.get('/:slug/tags', session, application, controller.tag.get);
router.post('/:slug/tags', session, application, admin, controller.tag.create);
router.put('/:slug/tags/:tagId', session, application, admin, controller.tag.update);
router.delete('/:slug/tags/:tagId', session, application, admin, controller.tag.delete);

export { router as boardRouter };
