import { applicationSummarySelect, boardSummarySelect, db, DomainStatus } from "@repo/database";
import type { NextFunction, Response } from "express";
import type { BareSessionRequest } from "../types";
import { publicUrl } from "../util/s3";
import { session } from "./session.middleware";

const APP_DOMAIN = process.env.APP_DOMAIN as string;

async function applicationPart(req: BareSessionRequest, res: Response, next: NextFunction) {
    const origin = req.headers.origin ?? req.headers.host;
    const subdomain = origin?.match(/^https:\/\/([^.]+)\.supaboard\.io$/)?.[1];
    const customDomain = !subdomain ? origin?.replace(/^https?:\/\//, '') : undefined;
    const userId = req.auth?.id;

    if (!subdomain && !customDomain) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }


    const application = await db.application.findFirst({
        where: { customDomain, subdomain: subdomain },
        select: applicationSummarySelect
    });

    if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }

    const applicationUrl = application.customDomain && application.domainStatus === DomainStatus.VERIFIED ? `https://${application.customDomain}` : `https://${subdomain}.${APP_DOMAIN}`;

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

    const hasChangelog = await db.changelog.findFirst({
        where: {
            applicationId: application.id,
            publishedAt: {
                not: null,
            }
        },
    });

    req.application = {
        ...application,
        icon: application.icon ? publicUrl(application.icon) : undefined,
        logo: application.logo ? publicUrl(application.logo) : undefined,
        boards,
        url: applicationUrl,
        hasChangelog: !!hasChangelog,
    };
    next();
}

export async function application(req: BareSessionRequest, res: Response, next: NextFunction) {
    session(req, res, (err) => {
        if (err) {
            next(err);
            return;
        }

        applicationPart(req, res, next);
    });
}