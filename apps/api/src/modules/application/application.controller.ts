import type { BareSessionRequest } from "@/types";
import { subdomainBlacklist } from "@/util/blacklist";
import { parseAndThrowFirstError } from "@/util/error-parser";
import { boardFeedbackSummarySelect, db } from "@repo/database";
import { type Response } from "express";
import dns from 'node:dns/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from "zod";

const APP_DOMAIN = process.env.APP_DOMAIN as string;

export async function getApplication(req: BareSessionRequest, res: Response) {
    const application = await db.application.findFirst({
        where: { id: req.application?.id },
        include: {
            domains: {
                select: {
                    id: true,
                    domain: true,
                    custom: true,
                    primary: true,
                    verifiedAt: true,
                    failedAt: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            },
        },
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
        url: req.application?.url,
        api: req.application?.api,
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
    isChangelogPublic: z.boolean().optional(),
    isChangelogSubscribable: z.boolean().optional(),
});

export async function updateApplication(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const applicationId = req.application?.id;

    if (!userId || !applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const existingApplication = await db.application.findUnique({
        where: { id: applicationId },
        include: {
            domains: true,
        },
    });

    if (!existingApplication) {
        res.status(404).json({ error: 'Application not found', code: 'NOT_FOUND' });
        return;
    }

    const data = parseAndThrowFirstError(updateApplicationSchema, req.body, res);

    const isSubdomainChange = !!data.subdomain && existingApplication.domains.filter(d => !d.custom).map(d => d.domain).includes(`${data.subdomain}.${APP_DOMAIN}`);

    if (isSubdomainChange) {
        const application = await db.application.findFirst({
            where: { subdomain: data.subdomain, id: { not: applicationId } },
        });

        if (application) {
            res.status(400).json({ error: 'Subdomain is unavailable', code: 'SUBDOMAIN_UNAVAILABLE' });
            return;
        }

        if (!subdomainBlacklist.includes(data.subdomain!)) {
            res.status(400).json({ error: 'Subdomain is unavailable', code: 'SUBDOMAIN_UNAVAILABLE' });
            return;
        }
    }

    const application = await db.$transaction(async (tx) => {
        const application = await tx.application.update({
            where: { id: applicationId },
            data,
        });

        if (data.subdomain) {
            const defaultDomain = await tx.domain.findFirst({
                where: { applicationId, custom: false },
            });

            if (defaultDomain) {
                await tx.domain.update({
                    where: { id: defaultDomain.id },
                    data: {
                        domain: `${data.subdomain}.${APP_DOMAIN}`,
                    },
                });
            }
        }

        return application;
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
        id: board.id,
        name: board.name,
        slug: board.slug,
        showOnHome: board.showOnHome,
        includeInRoadmap: board.includeInRoadmap,
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

const getScriptPath = (scriptName: string) => {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    return path.join(currentDir, '../..', scriptName);
};

const addDomain = async (domain: string) => {
    const scriptPath = getScriptPath('add_domain.sh');

    const proc = Bun.spawn(['bash', scriptPath, domain], {
        cwd: path.dirname(scriptPath),
    });

    const output = await new Response(proc.stdout).text();
    const error = await new Response(proc.stderr).text();

    if (error) {
        console.error('Script error:', error);
        throw new Error(error);
    }

    return output;
};

const deleteDomain = async (domain: string) => {
    const scriptPath = getScriptPath('remove_domain.sh');

    const proc = Bun.spawn(['bash', scriptPath, domain], {
        cwd: path.dirname(scriptPath),
    });

    const output = await new Response(proc.stdout).text();
    const error = await new Response(proc.stderr).text();

    if (error) {
        console.error('Script error:', error);
        throw new Error(error);
    }

    return output;
};

export async function addCustomDomain(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const applicationId = req.application?.id;

    if (!userId || !applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const domains = await db.domain.findMany({
        where: {
            domain: req.body.domain,
            custom: true,
        }
    })

    if (domains.length > 0) {
        res.status(400).json({
            error: 'Domain already in use',
            code: 'DOMAIN_ALREADY_IN_USE',
        });
        return;
    }

    try {
        const cnameRecords = await dns.resolveCname(req.body.domain);
        if (!cnameRecords.includes(CNAME_VALUE)) {
            res.status(400).json({
                error: 'Invalid CNAME record',
                code: 'INVALID_CNAME',
                details: `Domain must have a CNAME record pointing to ${CNAME_VALUE}`
            });
            return;
        }
        await addDomain(req.body.domain);
    } catch (error) {
        console.error('Initial domain verification failed:', error);
    }

    await db.application.update({
        where: { id: applicationId },
        data: { domains: { create: { domain: req.body.domain } } },
    });

    res.status(200).json({ message: 'Domain added' });
}

async function retryVerification(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;
    const domainId = req.params.domainId;

    const domain = await db.domain.findUnique({
        where: { id: domainId, applicationId },
    });

    if (!domain) {
        res.status(404).json({ error: 'Domain not found', code: 'NOT_FOUND' });
        return;
    }

    await db.domain.update({
        where: { id: domainId },
        data: { failedAt: null },
    });

    res.status(200).json({ message: 'Domain verification retried' });
}

export async function removeDomain(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const applicationId = req.application?.id;
    const domainId = req.params.domainId;

    if (!userId || !applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const applicationDomain = await db.domain.findUnique({
        where: { id: domainId },
    });

    if (!applicationDomain) {
        res.status(404).json({ error: 'Domain not found', code: 'NOT_FOUND' });
        return;
    }

    if (applicationDomain.primary) {
        res.status(400).json({ error: 'Cannot remove primary domain', code: 'CANNOT_REMOVE_PRIMARY_DOMAIN' });
        return;
    }

    if (!applicationDomain.custom) {
        res.status(400).json({ error: 'Cannot remove default domain', code: 'CANNOT_REMOVE_DEFAULT_DOMAIN' });
        return;
    }

    try {
        await deleteDomain(applicationDomain.domain);
    } catch (error) {
        console.error('Domain deletion failed:', error);
        res.status(400).json({
            error: 'Failed to remove domain',
            code: 'FAILED_TO_REMOVE_DOMAIN',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
    }

    await db.application.update({
        where: { id: applicationId },
        data: { domains: { delete: { id: domainId } } },
    });

    res.status(200).json({ message: 'Domain removed' });
}

const setPrimaryDomain = async (req: BareSessionRequest, res: Response) => {
    const userId = req.auth?.id;
    const applicationId = req.application?.id;
    const domainId = req.params.domainId;

    if (!userId || !applicationId || !domainId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const domain = await db.domain.findUnique({
        where: { id: domainId },
    });

    if (!domain) {
        res.status(404).json({ error: 'Domain not found', code: 'NOT_FOUND' });
        return;
    }

    if (domain.primary) {
        res.status(200).json({ message: 'Primary domain set' });
        return;
    }
    
    if(!domain.verifiedAt) {
        res.status(400).json({ error: 'Domain not verified', code: 'DOMAIN_NOT_VERIFIED' });
        return;
    }

    await db.$transaction(async (tx) => {
        await tx.domain.updateMany({
            where: { applicationId },
            data: { primary: false },
        });

        await tx.domain.update({
            where: { id: domainId },
            data: { primary: true },
        });
    });

    res.status(200).json({ message: 'Primary domain set' });
}

const deleteApplication = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;

    const application = await db.application.findUnique({
        where: { id: applicationId },
    });

    if (!application) {
        res.status(404).json({ error: 'Application not found', code: 'NOT_FOUND' });
        return;
    }

    await db.application.delete({
        where: { id: application.id },
    });

    res.status(200).json({ message: 'Application deleted' });
}

export const controller = {
    application: {
        get: getApplication,
        update: updateApplication,
        boards: getBoards,
        addCustomDomain,
        removeDomain,
        retryVerification,
        delete: deleteApplication,
        setPrimaryDomain,
    },
};