import { admin, application } from '@/middleware';
import { Router } from 'express';
import { controller } from './feedback.controller';

const router = Router();

router.get('/', application, controller.feedback.getAll);
router.get('/:boardSlug/:feedbackSlug', application, controller.feedback.getBySlug);
router.get('/:feedbackId', application, controller.feedback.getById);
router.post('/:boardId/create', application, controller.feedback.create);
router.put('/:boardSlug/:feedbackSlug', application, controller.feedback.update);
router.delete('/:boardSlug/:feedbackSlug', application, controller.feedback.delete);

router.get('/:boardSlug/:feedbackSlug/voters', application, controller.feedback.getVoters);
router.get('/:boardSlug/:feedbackSlug/activities', application, controller.feedback.getActivities);
router.get('/:boardSlug/:feedbackSlug/edit-history', application, controller.feedback.editHistory);

router.post('/:boardSlug/:feedbackSlug/comment', application, controller.feedback.comment);
router.post('/:boardSlug/:feedbackSlug/like/:activityId', application, controller.feedback.like);
router.post('/:boardSlug/:feedbackSlug/pin/:activityId', application, controller.feedback.pin);
router.post('/:feedbackId/vote', application, controller.feedback.vote);

router.post('/:roadmapSlug/add', admin, controller.feedback.addNewRoadmapItem);

export { router as feedbackRouter };
