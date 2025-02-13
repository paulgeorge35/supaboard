import { db } from "@repo/database";
import type { NextFunction, Response } from "express";
import type { BareSessionRequest } from "../types";
import { application } from "./application.middleware";

async function adminPart(request: BareSessionRequest, response: Response, next: NextFunction) {
    const userId = request.auth?.id;
    const applicationId = request.application?.id;

    if (!userId || !applicationId) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const member = await db.member.findUnique({
        where: {
            role: 'ADMIN',
            userId_applicationId: {
                userId,
                applicationId,
            },
        },
    });

    if (!member) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
    }

    next();
}

export async function admin(request: BareSessionRequest, response: Response, next: NextFunction) {
    application(request, response, (err) => {
        if (err) {
            next(err);
            return;
        }

        adminPart(request, response, next);
    });
}