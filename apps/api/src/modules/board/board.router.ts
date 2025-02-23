import { application, member } from '@/middleware';
import { Role } from '@repo/database';
import { Router } from 'express';
import { controller } from './board.controller';

const router = Router();

// Board
router.get('/:slug', application, controller.board.get);
router.get('/:slug/detailed', application, controller.board.getDetailed);
router.post('/', member(Role.ADMIN, Role.COLLABORATOR), controller.board.create);
router.put('/:slug', member(Role.ADMIN, Role.COLLABORATOR), controller.board.update);
router.delete('/:slug', member(Role.ADMIN, Role.COLLABORATOR), controller.board.delete);

// Category
router.get('/:slug/categories', application, controller.category.get);
router.post('/:slug/categories', member(Role.ADMIN, Role.COLLABORATOR), controller.category.create);
router.put('/:slug/categories/:categorySlug', member(Role.ADMIN, Role.COLLABORATOR), controller.category.update);
router.delete('/:slug/categories/:categorySlug', member(Role.ADMIN, Role.COLLABORATOR), controller.category.delete);
router.post('/:slug/categories/:categorySlug/subscription', member(), controller.category.subscribe);

// Tag
router.get('/:slug/tags', application, controller.tag.get);
router.post('/:slug/tags', member(Role.ADMIN, Role.COLLABORATOR), controller.tag.create);
router.put('/:slug/tags/:tagId', member(Role.ADMIN, Role.COLLABORATOR), controller.tag.update);
router.delete('/:slug/tags/:tagId', member(Role.ADMIN, Role.COLLABORATOR), controller.tag.delete);

export { router as boardRouter };
