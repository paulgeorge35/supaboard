import type { BareSessionRequest } from "@/types";
import { boardFeedbackSummarySelect, db, DomainStatus } from "@repo/database";
import { type Response } from "express";
import dns from 'node:dns/promises';
import path from 'node:path';
import { z } from "zod";

export async function getApplication(req: BareSessionRequest, res: Response) {
    const application = await db.application.findUnique({
        where: { id: req.application?.id },
    });

    if (!application) {
        res.status(404).json({ error: 'Application not found', code: 'NOT_FOUND' });
        return;
    }

    const stats = await db.$transaction(async (tx) => {
        const feedbacks = await tx.feedback.count({
            where: {
                applicationId: application.id,
            },
        });
        const votes = await tx.vote.count({
            where: {
                feedback: {
                    applicationId: application.id,
                },
            },
        });
        const comments = await tx.activity.count({
            where: {
                type: 'FEEDBACK_COMMENT',
                feedback: {
                    applicationId: application.id,
                },
            },
        });
        const users = await tx.member.count({
            where: {
                applicationId: application.id,
            },
        });

        return {
            feedbacks,
            votes,
            comments,
            users,
        };
    });

    res.status(200).json({
        ...application,
        ...stats,
    });
}

const updateApplicationSchema = z.object({
    logo: z.string().nullish(),
    icon: z.string().nullish(),
    name: z.string().min(3).optional(),
    subdomain: z.string().min(3).optional(),
    color: z.string().min(1).optional(),
    preferredTheme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
    preferredLanguage: z.enum(['EN', 'RO']).optional(),
});

export async function updateApplication(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const applicationId = req.application?.id;

    if (!userId || !applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const data = updateApplicationSchema.parse(req.body);

    const application = await db.application.update({
        where: { id: req.application?.id },
        data,
    });

    res.status(200).json(application);
}

export async function getBoards(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;

    const member = userId ? await db.user.findUnique({ where: { id: userId } }) : null;

    const boards = await db.board.findMany({
        where: { applicationId: req.application?.id, public: member ? undefined : true },
        select: boardFeedbackSummarySelect,
    });

    res.status(200).json(boards.map(board => ({
        name: board.name,
        slug: board.slug,
        showOnHome: board.showOnHome,
        count: board._count.feedbacks,
        feedbacks: board.feedbacks.map(feedback => ({
            id: feedback.id,
            title: feedback.title,
            status: feedback.status,
            slug: feedback.slug,
            votes: feedback._count.votes,
            votedByMe: feedback.votes.some(vote => vote.authorId === req.auth?.id),
            board: {
                slug: feedback.board.slug,
                name: feedback.board.name,
            },
        })),
    })));
}

const CNAME_VALUE = 'cname.supaboard.io';

const addDomain = (domain: string) => {
    const scriptPath = path.join(import.meta.dir, 'add_domain.sh');
    return Bun.spawn(['sh', scriptPath, domain], {
        cwd: import.meta.dir,
    });
};

export async function verifyDomain(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const applicationId = req.application?.id;

    if (!userId || !applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    try {
        const cnameRecords = await dns.resolveCname(req.body.domain);
        console.log('CNAME records:', cnameRecords);
        if (!cnameRecords.includes(CNAME_VALUE)) {
            res.status(400).json({
                error: 'Invalid CNAME record',
                code: 'INVALID_CNAME',
                details: `Domain must have a CNAME record pointing to ${CNAME_VALUE}`
            });
            return;
        }
    } catch (error) {
        res.status(400).json({
            error: 'DNS verification failed',
            code: 'DNS_VERIFICATION_FAILED',
            details: 'Could not verify domain. Please ensure the domain exists and has proper DNS records.'
        });
        return;
    }

    try {
        addDomain(req.body.domain);
    } catch (error) {
        console.error('Domain addition failed:', error);
        res.status(400).json({
            error: 'Failed to add domain',
            code: 'FAILED_TO_ADD_DOMAIN',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
    }

    await db.application.update({
        where: { id: applicationId },
        data: { domainStatus: DomainStatus.VERIFIED, customDomain: req.body.domain },
    });

    res.status(200).json({ message: 'Domain verified' });
}

export const controller = {
    application: {
        get: getApplication,
        update: updateApplication,
        boards: getBoards,
        verifyDomain,
    },
};