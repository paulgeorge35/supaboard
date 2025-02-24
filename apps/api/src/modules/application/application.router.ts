import { application, member } from '@/middleware';
import { Role } from '@repo/database';
import { Router } from 'express';
import { controller } from './application.controller';

const router = Router();

router.get('/', application, controller.application.get);
router.put('/', member(Role.ADMIN), controller.application.update);
router.get('/boards', application, controller.application.boards);
router.post('/add-custom-domain', member(Role.ADMIN), controller.application.addCustomDomain);
router.post('/remove-domain/:domainId', member(Role.ADMIN), controller.application.removeDomain);
router.post('/primary-domain/:domainId', member(Role.ADMIN), controller.application.setPrimaryDomain);
router.post('/retry-verification/:domainId', member(Role.ADMIN), controller.application.retryVerification);
router.delete('/', member(Role.ADMIN), controller.application.delete);

export { router as applicationRouter };
