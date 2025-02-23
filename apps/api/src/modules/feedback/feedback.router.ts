import { application, member } from '@/middleware';
import { Role } from '@repo/database';
import { Router } from 'express';
import { controller } from './feedback.controller';

const router = Router();

router.get('/', application, controller.feedback.getAll);
router.get('/:boardSlug/:feedbackSlug', application, controller.feedback.getBySlug);
router.get('/:feedbackId', application, controller.feedback.getById);
router.post('/:boardId/create', member(), controller.feedback.create);
router.put('/:boardSlug/:feedbackSlug', member(), controller.feedback.update);
router.delete('/:boardSlug/:feedbackSlug', member(), controller.feedback.delete);

router.get('/:boardSlug/:feedbackSlug/voters', application, controller.feedback.getVoters);
router.get('/:boardSlug/:feedbackSlug/activities', application, controller.feedback.getActivities);
router.get('/:boardSlug/:feedbackSlug/edit-history', application, controller.feedback.editHistory);

router.post('/:boardSlug/:feedbackSlug/comment', member(), controller.feedback.comment);
router.post('/:boardSlug/:feedbackSlug/like/:activityId', member(), controller.feedback.like);
router.post('/:boardSlug/:feedbackSlug/pin/:activityId', member(Role.ADMIN, Role.COLLABORATOR), controller.feedback.pin);
router.post('/:feedbackId/vote', member(), controller.feedback.vote);

router.post('/:roadmapSlug/add', member(Role.ADMIN, Role.COLLABORATOR), controller.feedback.addNewRoadmapItem);

export { router as feedbackRouter };
