import { Router } from "express";
import { deleteFile, getReadPresignedUrl, getWritePresignedUrl } from "./storage.controller";

const router = Router();

router.delete('/:key', deleteFile);
router.get('/:key(*)/read', getReadPresignedUrl);
router.put('/:key(*)/write', getWritePresignedUrl);

export { router as storageRouter };
