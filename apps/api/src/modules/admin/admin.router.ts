import { Router } from "express";
import { applicationMiddleware } from "../../middleware/application";
import { requireAuth } from "../../middleware/auth";
import { memberMiddleware } from "../../middleware/member.middleware";
import { createTag, getTags, getUsers, updateFeedback } from "./admin.controller";

const router = Router();

router.put("/feedback/:boardSlug/:feedbackSlug", requireAuth, applicationMiddleware, memberMiddleware, updateFeedback);
router.get("/users", requireAuth, applicationMiddleware, memberMiddleware, getUsers);
router.get("/tags", requireAuth, applicationMiddleware, memberMiddleware, getTags);
router.post("/tags", requireAuth, applicationMiddleware, memberMiddleware, createTag);

export { router as adminRouter };
