import { application, member } from "@/middleware"
import { Role } from "@repo/database"
import { Router } from "express"
import controller from "./roadmap.controller"

const router = Router()

router.get("/", application, controller.getAll)
router.put("/settings", member(Role.ADMIN, Role.COLLABORATOR), controller.updateSettings)
router.get("/:roadmapSlug", application, controller.getBySlug)
router.post("/", member(Role.ADMIN, Role.COLLABORATOR), controller.create)
router.post("/:roadmapSlug/rename", member(Role.ADMIN, Role.COLLABORATOR), controller.rename)
router.post("/:roadmapSlug/duplicate", member(Role.ADMIN, Role.COLLABORATOR), controller.duplicate)
router.delete("/:roadmapSlug", member(Role.ADMIN, Role.COLLABORATOR), controller.delete)
router.post("/:roadmapSlug/archive", member(Role.ADMIN, Role.COLLABORATOR), controller.archive)
router.post("/:roadmapSlug/restore", member(Role.ADMIN, Role.COLLABORATOR), controller.restore)

router.post("/:roadmapSlug/:feedbackId/add", member(Role.ADMIN, Role.COLLABORATOR), controller.add)
router.post("/:roadmapSlug/:feedbackId/remove", member(Role.ADMIN, Role.COLLABORATOR), controller.remove)
router.put("/:roadmapSlug/:feedbackId/update", member(Role.ADMIN, Role.COLLABORATOR), controller.update)

export { router as roadmapRouter }
