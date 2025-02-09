import { applicationSummarySelect, boardSummarySelect, db } from "@repo/database";
import type { NextFunction, Response } from "express";
import type { BareSessionRequest } from "../types";
import { publicUrl } from "../util/s3";

export async function applicationMiddleware(req: BareSessionRequest, res: Response, next: NextFunction) {
    const origin = req.headers.origin ?? req.headers.host;
    const subdomain = origin?.match(/^https:\/\/([^.]+)\.supaboard\.io$/)?.[1];
    const customDomain = !subdomain && origin !== 'http://localhost:3001' ? origin?.replace(/^https?:\/\//, '') : undefined;
    let localSubdomain = undefined;
    const userId = req.auth?.id;

    if (origin === 'http://localhost:3001') {
        localSubdomain = 'alpha';
    }

    if (!subdomain && !customDomain && !localSubdomain) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }


    const application = await db.application.findFirst({
        where: { customDomain, subdomain: subdomain || localSubdomain },
        select: applicationSummarySelect
    });

    if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }

    const member = userId ? await db.member.findFirst({
        where: {
            userId,
            applicationId: application.id,
        }
    }) : null;

    const boards = await db.board.findMany({
        where: {
            applicationId: application.id,
            public: member ? undefined : true,
        },
        select: boardSummarySelect
    });

    req.application = {
        ...application,
        icon: application.icon ? publicUrl(application.icon) : undefined,
        logo: application.logo ? publicUrl(application.logo) : undefined,
        boards
    };
    next();
}