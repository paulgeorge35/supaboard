import { application, member } from '@/middleware';
import { Role } from '@repo/database';
import { Router } from 'express';
import { controller } from './application.controller';

const router = Router();

router.get('/', application, controller.application.get);
router.put('/', member(Role.ADMIN), controller.application.update);
router.get('/boards', application, controller.application.boards);
router.post('/verify-domain', member(Role.ADMIN), controller.application.verifyDomain);
router.post('/remove-domain', member(Role.ADMIN), controller.application.removeDomain);
router.delete('/', member(Role.ADMIN), controller.application.delete);

export { router as applicationRouter };
