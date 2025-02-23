import { application, member } from "@/middleware";
import { Role } from "@repo/database";
import { Router } from "express";
import controller from "./changelog.controller";

const router = Router();

router.get('/labels', application, controller.getLabels);
router.post('/labels', member(Role.ADMIN, Role.COLLABORATOR), controller.createLabel);
router.put('/labels/:labelId', member(Role.ADMIN, Role.COLLABORATOR), controller.updateLabel);
router.delete('/labels/:labelId', member(Role.ADMIN, Role.COLLABORATOR), controller.deleteLabel);

router.get('/public', application, controller.getPublic);
router.post('/public/subscribe', application, controller.subscribe);
router.get('/public/:changelogSlug', application, controller.getPublicBySlug);
router.post('/public/:changelogSlug/like', application, controller.like);

router.get('/feedbacks/resolved', member(Role.ADMIN), controller.getResolvedFeedbacks);

router.get('/', application, controller.getAll);
router.get('/:changelogSlug', application, controller.getBySlug);
router.post('/', member(Role.ADMIN, Role.COLLABORATOR), controller.create);
router.put('/:changelogSlug', member(Role.ADMIN, Role.COLLABORATOR), controller.update);

router.put('/:changelogSlug/publish', member(Role.ADMIN, Role.COLLABORATOR), controller.publish);
router.put('/:changelogSlug/unpublish', member(Role.ADMIN, Role.COLLABORATOR), controller.unpublish);
router.put('/:changelogSlug/schedule', member(Role.ADMIN, Role.COLLABORATOR), controller.schedule);
router.put('/:changelogSlug/unschedule', member(Role.ADMIN, Role.COLLABORATOR), controller.unschedule);

router.delete('/:changelogSlug', member(Role.ADMIN, Role.COLLABORATOR), controller.delete);
router.post('/:changelogSlug/:feedbackId/link', member(Role.ADMIN, Role.COLLABORATOR), controller.linkFeedback);
router.post('/:changelogSlug/:feedbackId/unlink', member(Role.ADMIN, Role.COLLABORATOR), controller.unlinkFeedback);


export { router as changelogRouter };
