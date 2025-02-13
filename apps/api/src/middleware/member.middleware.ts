import { db } from "@repo/database";
import type { NextFunction, Response } from "express";
import type { BareSessionRequest } from "../types";
import { application } from "./application.middleware";

async function memberPart(request: BareSessionRequest, response: Response, next: NextFunction) {
    const user = request.auth?.id;
    const applicationId = request.application?.id;

    if (!user || !applicationId) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const member = await db.member.findUnique({
        where: {
            userId_applicationId: {
                userId: user,
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

export async function member(request: BareSessionRequest, response: Response, next: NextFunction) {
    application(request, response, (err) => {
        if (err) {
            next(err);
            return;
        }

        memberPart(request, response, next);
    });
}