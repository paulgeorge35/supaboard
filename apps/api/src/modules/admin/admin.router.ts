import { member, owner } from "@/middleware";
import { Role } from "@repo/database";
import { Router } from "express";
import { controller } from "./admin.controller";

const router = Router();

router.get("/feedback/:boardSlug/:feedbackSlug/merge", member(Role.ADMIN, Role.COLLABORATOR), controller.feedback.getMerge);
router.post("/feedback/:feedbackId/merge", member(Role.ADMIN, Role.COLLABORATOR), controller.feedback.merge);
router.post("/feedback/:feedbackId/unmerge", member(Role.ADMIN, Role.COLLABORATOR), controller.feedback.unmerge);
router.put("/feedback/:boardSlug/:feedbackSlug", member(Role.ADMIN, Role.COLLABORATOR), controller.feedback.update);
router.get("/activity-overview", member(Role.ADMIN, Role.COLLABORATOR), controller.activityOverview.get);
router.get("/stale-posts", member(Role.ADMIN, Role.COLLABORATOR), controller.activityOverview.stalePosts);
router.get("/new-posts", member(Role.ADMIN, Role.COLLABORATOR), controller.activityOverview.newPosts);
router.get("/user-activity", member(Role.ADMIN, Role.COLLABORATOR), controller.activityOverview.userActivity);
router.get("/posts-overview", member(Role.ADMIN, Role.COLLABORATOR), controller.activityOverview.postsOverview);

router.get("/users", member(Role.ADMIN, Role.COLLABORATOR), controller.users.get);
router.put("/users/:memberId/role", owner, controller.users.updateRole);
router.delete("/users/:userId", owner, controller.users.deleteMember);
router.get("/users/detailed", member(Role.ADMIN, Role.COLLABORATOR), controller.users.getDetailed);
router.get("/users/activity", member(Role.ADMIN, Role.COLLABORATOR), controller.users.activity);
router.get("/users/details/:userId", member(Role.ADMIN, Role.COLLABORATOR), controller.users.getMember);

router.get("/users/invites", member(Role.ADMIN, Role.COLLABORATOR), controller.users.invites.get);
router.post("/users/invites", member(Role.ADMIN), controller.users.invites.invite);
router.delete("/users/invites/:inviteId", member(Role.ADMIN), controller.users.invites.delete);

export { router as adminRouter };
