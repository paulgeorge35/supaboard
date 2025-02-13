import type { NextFunction, Response } from "express";
import type { BareSessionRequest } from "../types";
import { application } from "./application.middleware";

async function ownerPart(req: BareSessionRequest, res: Response, next: NextFunction) {
    if (!req.auth?.id || req.application?.ownerId !== req.auth.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }

    next();
}

export function owner(req: BareSessionRequest, res: Response, next: NextFunction) {
    application(req, res, (err) => {
        if (err) {
            next(err);
            return;
        }

        ownerPart(req, res, next);
    });
}