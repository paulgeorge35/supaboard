import { db } from "@repo/database";
import type { NextFunction, Response } from "express";
import type { BareSessionRequest } from "../types";

export async function applicationMiddleware(req: BareSessionRequest, res: Response, next: NextFunction) {
    const origin = req.headers.origin ?? req.headers.host;
    const subdomain = origin?.match(/^https:\/\/([^.]+)\.supaboard\.io$/)?.[1];
    const customDomain = !subdomain && origin !== 'http://localhost:3001' ? origin?.replace(/^https?:\/\//, '') : undefined;
    let localSubdomain = undefined;

    if(origin === 'http://localhost:3001') {
        localSubdomain = 'alpha';
    }

    if (!subdomain && !customDomain && !localSubdomain) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }


    const application = await db.application.findFirst({
        where: { customDomain, subdomain: subdomain || localSubdomain },
        select: {
            id: true,
            name: true,
            subdomain: true,
            customDomain: true,
            domainStatus: true,
            logoUrl: true,
            iconUrl: true,
            color: true,
            preferredTheme: true,
            preferredLanguage: true,
            ownerId: true,
        }
    });

    if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }

    const boards = await db.board.findMany({
        where: {
            applicationId: application.id,
        },
        select: {
            id: true,
            name: true,
            slug: true,
        }
    });

    req.application = { ...application, boards };
    next();
}