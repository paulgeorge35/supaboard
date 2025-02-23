import { db, Role } from "@repo/database";
import type { NextFunction, Response } from "express";
import type { BareSessionRequest } from "../types";
import { application } from "./application.middleware";

async function memberPart(roles: Role[], request: BareSessionRequest, response: Response, next: NextFunction) {
    const user = request.auth?.id;
    const applicationId = request.application?.id;

    if (!user || !applicationId) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const existingMember = await db.member.findUnique({
        where: {
            userId_applicationId: {
                userId: user,
                applicationId,
            },
            role: roles.length > 0 ? {
                in: roles,
            } : undefined
        },
    });

    if (!existingMember && (roles.includes(Role.VIEWER) || roles.length === 0)) {
        await db.member.create({
            data: {
                userId: user,
                applicationId,
                role: Role.VIEWER,
            },
        });
        next();
        return;
    }

    if (!existingMember) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
    }

    next();
}

export const member = (...roles: Role[]) => (request: BareSessionRequest, response: Response, next: NextFunction) => {
    application(request, response, (err) => {
        if (err) {
            next(err);
            return;
        }

        memberPart(roles, request, response, next);
    });
}