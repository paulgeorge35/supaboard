import { application, member } from "@/middleware";
import { Role } from "@repo/database";
import { Router } from "express";
import { controller } from "./status.controller";

const router = Router()

router.get('/', application, controller.get)
router.post('/', member(Role.ADMIN), controller.create)
router.get('/:statusSlug', application, controller.getBySlug)
router.put('/:statusId', member(Role.ADMIN), controller.update)
router.delete('/:statusId', member(Role.ADMIN), controller.delete)

export { router as statusRouter };

