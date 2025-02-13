import type { BareSessionRequest } from "@/types";
import { presignReadUrl, presignWriteUrl, remove } from "@/util/s3";
import type { Response } from "express";

export function getReadPresignedUrl(req: BareSessionRequest, res: Response) {
    const { key } = req.params;
    const url = presignReadUrl(key);
    res.json({ url });
};

export function getWritePresignedUrl(req: BareSessionRequest, res: Response) {
    const { key } = req.params;
    const url = presignWriteUrl(key);
    res.json({ url });
};

export async function deleteFile(req: BareSessionRequest, res: Response) {
    const { key } = req.params;
    await remove(key);
    res.json({ message: 'File deleted' });
};
