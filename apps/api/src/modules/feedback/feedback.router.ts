import { Router } from 'express';
import { applicationMiddleware } from '../../middleware/application';
import { requireAuth } from '../../middleware/auth';
import { comment, createFeedback, getActivities, getFeedbackBySlug, getVoters, like, pin, vote } from './feedback.controller';

const router = Router();

router.post('/:boardId/create', requireAuth, applicationMiddleware, createFeedback);
router.post('/:feedbackId/vote', requireAuth, applicationMiddleware, vote);
router.get('/:boardSlug/:feedbackSlug', requireAuth, applicationMiddleware, getFeedbackBySlug);
router.get('/:boardSlug/:feedbackSlug/voters', requireAuth, applicationMiddleware, getVoters);
router.get('/:boardSlug/:feedbackSlug/activities', requireAuth, applicationMiddleware, getActivities);
router.post('/:boardSlug/:feedbackSlug/comment', requireAuth, applicationMiddleware, comment);
router.post('/:boardSlug/:feedbackSlug/like/:activityId', requireAuth, applicationMiddleware, like);
router.post('/:boardSlug/:feedbackSlug/pin/:activityId', requireAuth, applicationMiddleware, pin);

export { router as feedbackRouter };
