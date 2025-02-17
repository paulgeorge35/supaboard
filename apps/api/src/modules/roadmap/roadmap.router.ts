import { admin } from "@/middleware"
import { Router } from "express"
import controller from "./roadmap.controller"

const router = Router()

router.get("/", admin, controller.getAll)
router.get("/:roadmapSlug", admin, controller.getBySlug)
router.post("/", admin, controller.create)
router.post("/:roadmapSlug/rename", admin, controller.rename)
router.post("/:roadmapSlug/duplicate", admin, controller.duplicate)
router.delete("/:roadmapSlug", admin, controller.delete)

router.post("/:roadmapSlug/:feedbackId/add", admin, controller.add)
router.post("/:roadmapSlug/:feedbackId/remove", admin, controller.remove)
router.put("/:roadmapSlug/:feedbackId/update", admin, controller.update)

export { router as roadmapRouter }
