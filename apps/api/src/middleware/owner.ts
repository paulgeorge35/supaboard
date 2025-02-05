import type { NextFunction, Response } from "express";
import type { BareSessionRequest } from "../types";

export async function ownerMiddleware(req: BareSessionRequest, res: Response, next: NextFunction) {
    if (!req.auth?.id || req.application?.ownerId !== req.auth.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }

    next();
}
