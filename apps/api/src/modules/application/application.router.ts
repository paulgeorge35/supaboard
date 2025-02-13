import { admin, application } from '@/middleware';
import { Router } from 'express';
import { controller } from './application.controller';

const router = Router();

router.get('/', application, controller.application.get);
router.put('/', admin, controller.application.update);
router.get('/boards', application, controller.application.boards);

export { router as applicationRouter };
