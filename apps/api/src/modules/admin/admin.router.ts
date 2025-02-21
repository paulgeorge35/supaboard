import { member, owner } from "@/middleware";
import { Router } from "express";
import { controller } from "./admin.controller";

const router = Router();

router.get("/feedback/:boardSlug/:feedbackSlug/merge", member, controller.feedback.getMerge);
router.post("/feedback/:feedbackId/merge", member, controller.feedback.merge);
router.post("/feedback/:feedbackId/unmerge", member, controller.feedback.unmerge);
router.put("/feedback/:boardSlug/:feedbackSlug", member, controller.feedback.update);
router.get("/activity-overview", member, controller.activityOverview.get);
router.get("/stale-posts", member, controller.activityOverview.stalePosts);
router.get("/new-posts", member, controller.activityOverview.newPosts);
router.get("/user-activity", member, controller.activityOverview.userActivity);
router.get("/posts-overview", member, controller.activityOverview.postsOverview);

router.get("/users", member, controller.users.get);
router.put("/users/:memberId/role", owner, controller.users.updateRole);
router.delete("/users/:memberId", owner, controller.users.deleteMember);
router.get("/users/detailed", member, controller.users.getDetailed);
router.get("/users/activity", member, controller.users.activity);
router.get("/users/details/:userId", member, controller.users.getMember);

router.get("/users/invites", member, controller.users.invites.get);
router.post("/users/invites", member, controller.users.invites.invite);
router.delete("/users/invites/:inviteId", member, controller.users.invites.delete);

export { router as adminRouter };
