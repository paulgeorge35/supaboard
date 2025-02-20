import { admin, application } from "@/middleware";
import { Router } from "express";
import controller from "./changelog.controller";

const router = Router();

router.get('/labels', application, controller.getLabels);
router.post('/labels', admin, controller.createLabel);
router.put('/labels/:labelId', admin, controller.updateLabel);
router.delete('/labels/:labelId', admin, controller.deleteLabel);

router.get('/public', application, controller.getPublic);
router.get('/public/:changelogSlug', application, controller.getPublicBySlug);
router.post('/public/:changelogSlug/like', application, controller.like);

router.get('/feedbacks/resolved', admin, controller.getResolvedFeedbacks);

router.get('/', application, controller.getAll);
router.get('/:changelogSlug', application, controller.getBySlug);
router.post('/', admin, controller.create);
router.put('/:changelogSlug', admin, controller.update);

router.put('/:changelogSlug/publish', admin, controller.publish);
router.put('/:changelogSlug/unpublish', admin, controller.unpublish);
router.put('/:changelogSlug/schedule', admin, controller.schedule);
router.put('/:changelogSlug/unschedule', admin, controller.unschedule);

router.delete('/:changelogSlug', admin, controller.delete);
router.post('/:changelogSlug/:feedbackId/link', admin, controller.linkFeedback);
router.post('/:changelogSlug/:feedbackId/unlink', admin, controller.unlinkFeedback);


export { router as changelogRouter };
