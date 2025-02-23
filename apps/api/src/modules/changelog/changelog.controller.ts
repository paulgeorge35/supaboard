import type { BareSessionRequest } from "@/types";
import { parseAndThrowFirstError } from "@/util/error-parser";
import { redis } from "@/util/redis";
import { changelogDetailedInclude, changelogLabelSelect, ChangelogStatus, ChangelogTag, db, Prisma } from "@repo/database";
import type { Response } from "express";
import { z } from "zod";

const changelogsSchema = z.object({
    cursor: z.string().optional(),
    take: z.coerce.number().default(10),
    status: z.union([z.array(z.nativeEnum(ChangelogStatus)), z.nativeEnum(ChangelogStatus)]).optional().default(['DRAFT', 'PUBLISHED', 'SCHEDULED']),
    type: z.nativeEnum(ChangelogTag).optional(),
    labels: z.union([z.array(z.string()), z.string()]).optional(),
    search: z.string().optional().transform(
        (value) => {
            if (!value) return undefined;
            return value.trim().replace(/ +(?= )/g, '')
                .split(' ')
                .filter((word) => word.length > 2)
                .join(' | ');
        }
    )
});

const getAll = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id;
    const { success, data } = changelogsSchema.safeParse(req.query);

    if (!success) {
        res.status(400).json({ error: 'Invalid changelogs data' });
        return;
    }

    const where: Prisma.ChangelogWhereInput = {
        applicationId
    }

    if (data.status) {
        where.status = { in: Array.isArray(data.status) ? data.status : [data.status] }
    }

    if (data.type) {
        where.tags = {
            has: data.type
        }
    }

    if (data.search) {
        where.OR = [
            { title: { search: data.search } },
            { description: { search: data.search } }
        ]
    }

    if (data.labels) {
        where.labels = {
            some: {
                id: { in: Array.isArray(data.labels) ? data.labels : [data.labels] }
            }
        }
    }

    const changelogs = await db.changelog.findMany({
        include: changelogDetailedInclude,
        where,
        orderBy: {
            createdAt: 'desc'
        },
        take: data.take,
        cursor: data.cursor ? { id: data.cursor } : undefined,
        skip: data.cursor ? 1 : 0
    });

    res.status(200).json({
        changelogs,
        nextCursor: changelogs[changelogs.length - 1]?.id
    });
}

const getBySlug = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug } = req.params;

    const changelog = await db.changelog.findUnique({
        include: changelogDetailedInclude,
        where: {
            applicationId_slug: { applicationId, slug: changelogSlug }
        }
    });

    if (!changelog) {
        res.status(404).json({ error: 'Changelog not found' });
        return;
    }

    res.status(200).json({
        ...changelog,
        linkedFeedbacks: changelog.linkedFeedbacks.map((feedback) => ({
            id: feedback.id,
            title: feedback.title,
            status: feedback.status,
            votes: feedback._count.votes
        }))
    });
}

const generateUniqueSlug = async (title: string, applicationId: string, changelogSlug?: string) => {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 0;

    if (slug === changelogSlug) {
        return slug;
    }

    while (true) {
        const changelog = await db.changelog.findFirst({ where: { applicationId, slug } });

        if (!changelog) {
            return slug;
        }

        counter++;
        slug = `${baseSlug}-${counter}`;
    }
}

const changelogSchema = z.object({
    title: z.string().min(1),
    description: z.string().max(5000).optional(),
    tags: z.array(z.nativeEnum(ChangelogTag)).optional(),
    labelIds: z.array(z.string()).optional(),
    feedbackIds: z.array(z.string()).optional(),
})

const create = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { success, data, } = changelogSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({ error: 'Invalid changelog data' });
        return;
    }

    const slug = await generateUniqueSlug(data.title, applicationId);

    const changelog = await db.changelog.create({
        include: changelogDetailedInclude,
        data: {
            title: data.title,
            slug,
            description: data.description ?? '',
            applicationId,
            tags: data.tags,
            labels: {
                connect: data.labelIds?.map((id) => ({ id }))
            },
            linkedFeedbacks: {
                connect: data.feedbackIds?.map((id) => ({ id }))
            }
        }
    })

    res.status(201).json(changelog);
}

const update = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug } = req.params;
    const { success, data } = changelogSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({ error: 'Invalid changelog data' });
        return;
    }

    const slug = await generateUniqueSlug(data.title, applicationId, changelogSlug);

    const changelog = await db.$transaction(async (tx) => {
        const _changelog = await tx.changelog.update({
            where: { applicationId_slug: { applicationId, slug: changelogSlug } },
            include: changelogDetailedInclude,
            data: {
                title: data.title,
                slug,
                description: data.description,
                tags: data.tags,
            }
        });

        const changelog = await tx.changelog.update({
            where: { id: _changelog.id },
            include: changelogDetailedInclude,
            data: {
                labels: {
                    disconnect: _changelog.labels.filter((label) => !data.labelIds?.includes(label.id)),
                    connect: data.labelIds?.map((id) => ({ id }))
                },
                linkedFeedbacks: {
                    disconnect: _changelog.linkedFeedbacks.filter((feedback) => !data.feedbackIds?.includes(feedback.id)).map((feedback) => ({ id: feedback.id })),
                    connect: data.feedbackIds?.map((id) => ({ id }))
                }
            }
        })

        return changelog;
    })

    res.status(200).json({
        ...changelog,
        linkedFeedbacks: changelog.linkedFeedbacks.map((feedback) => ({
            id: feedback.id,
            title: feedback.title,
            status: feedback.status,
            votes: feedback._count.votes
        }))
    });
}

const deleteChangelog = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug } = req.params;

    await db.changelog.delete({ where: { applicationId_slug: { applicationId, slug: changelogSlug } } });

    res.status(200).json({ success: true });
}

const linkFeedback = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug, feedbackId } = req.params;

    const changelog = await db.changelog.findUnique({ where: { applicationId_slug: { applicationId, slug: changelogSlug } } });

    if (!changelog) {
        res.status(404).json({ error: 'Changelog not found' });
        return;
    }

    const feedback = await db.feedback.findUnique({ where: { id: feedbackId, changelogId: null } });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found' });
        return;
    }

    await db.feedback.update({ where: { id: feedbackId }, data: { changelogId: changelog.id } });

    res.status(200).json({ success: true });
}

const unlinkFeedback = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug, feedbackId } = req.params;

    const changelog = await db.changelog.findUnique({ where: { applicationId_slug: { applicationId, slug: changelogSlug } } });

    if (!changelog) {
        res.status(404).json({ error: 'Changelog not found' });
        return;
    }

    await db.feedback.update({ where: { id: feedbackId }, data: { changelogId: null } });

    res.status(200).json({ success: true });
}

const getLabels = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;

    const labels = await db.changelogLabel.findMany({ where: { applicationId }, select: changelogLabelSelect });

    res.status(200).json(labels.map((label) => ({
        id: label.id,
        name: label.name,
        count: label._count.changelogs
    })));
}

const labelNameSchema = z.object({
    name: z.string().min(1, { message: 'Label name is required' }).max(20, { message: 'Label name must not exceed 20 characters' })
});

const createLabel = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;

    const { name } = parseAndThrowFirstError(labelNameSchema, req.body, res);

    const label = await db.changelogLabel.create({ data: { name, applicationId } });

    res.status(201).json(label);
}



const updateLabel = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { labelId } = req.params;

    const { success, data } = z.object({
        name: z.string().min(1).max(20)
    }).safeParse(req.body);

    if (!success) {
        res.status(400).json({ error: 'Invalid label data' });
        return;
    }

    const label = await db.changelogLabel.findUnique({ where: { id: labelId, applicationId } });

    if (!label) {
        res.status(404).json({ error: 'Label not found' });
        return;
    }

    const updatedLabel = await db.changelogLabel.update({ where: { id: labelId }, data: { name: data.name } });

    res.status(200).json(updatedLabel);
}

const deleteLabel = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { labelId } = req.params;

    await db.changelogLabel.delete({ where: { id: labelId, applicationId } });

    res.status(200).json({ success: true });
}

const publish = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug } = req.params;

    const changelog = await db.changelog.findUnique({ where: { applicationId_slug: { applicationId, slug: changelogSlug } } });

    if (!changelog) {
        res.status(404).json({ error: 'Changelog not found' });
        return;
    }

    await db.changelog.update({ where: { id: changelog.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });

    res.status(200).json({ success: true });
}

const unpublish = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug } = req.params;

    await db.changelog.update({ where: { applicationId_slug: { applicationId, slug: changelogSlug } }, data: { status: 'DRAFT', publishedAt: null } });

    res.status(200).json({ success: true });
}

const scheduleSchema = z.object({
    date: z.string().transform((val) => new Date(val))
})

const schedule = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug } = req.params;
    const { success, data } = scheduleSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({ error: 'Invalid schedule data' });
        return;
    }

    await db.changelog.update({ where: { applicationId_slug: { applicationId, slug: changelogSlug } }, data: { status: 'SCHEDULED', scheduledAt: data.date } });

    res.status(200).json({ success: true });
}

const unschedule = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug } = req.params;

    await db.changelog.update({ where: { applicationId_slug: { applicationId, slug: changelogSlug } }, data: { status: 'DRAFT', scheduledAt: null } });

    res.status(200).json({ success: true });
}

const getResolvedFeedbacks = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;

    const feedbacks = await db.feedback.findMany({
        select: {
            id: true,
            title: true,
            status: true,
            board: {
                select: {
                    slug: true
                }
            },
            _count: {
                select: {
                    votes: true
                }
            }
        },
        where: {
            applicationId,
            changelogId: null,
            status: 'RESOLVED'
        }
    });

    res.status(200).json(feedbacks.map((feedback) => ({
        id: feedback.id,
        title: feedback.title,
        status: feedback.status,
        board: feedback.board,
        votes: feedback._count.votes
    })));
}

const getPublic = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const userId = req.auth?.id;

    const subscriber = userId ? await db.user.findFirst({
        select: { id: true },
        where: { id: userId, changelogSubscriptions: { some: { id: applicationId } } }
    })
        : null;

    const changelogs = await db.changelog.findMany({
        where: { applicationId, status: 'PUBLISHED', publishedAt: { not: null } },
        orderBy: { publishedAt: 'desc' },
        include: {
            likes: {
                select: {
                    id: true
                },
                where: {
                    authorId: req.auth?.id
                }
            },
            _count: {
                select: {
                    likes: true
                }
            }
        }
    });

    res.status(200).json({
        changelogs: changelogs.map((changelog) => ({
            ...changelog,
            likes: changelog._count.likes ?? 0,
            likedByMe: changelog?.likes && changelog.likes.length > 0 ? true : false,
        })),
        isSubscribed: subscriber ? true : false
    });
}

const getPublicBySlug = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug } = req.params;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const visitorId = `${ip}-${userAgent}`;
    const visitorKey = `changelog-${changelogSlug}-${visitorId}`;

    try {
        let shouldIncrementView = true;

        try {
            const visitor = await redis.get(visitorKey);
            if (!visitor) {
                await redis.set(visitorKey, '1', 'EX', 60 * 60 * 24); // Set with 24h expiry
            } else {
                shouldIncrementView = false;
            }
        } catch (redisError) {
            // Log Redis error but continue execution
            console.error('Redis error:', redisError);
        }

        if (shouldIncrementView) {
            await db.changelog.update({
                where: { applicationId_slug: { applicationId, slug: changelogSlug } },
                data: { views: { increment: 1 } }
            });
        }

        const changelog = await db.changelog.findUnique({
            where: { applicationId_slug: { applicationId, slug: changelogSlug } },
            include: {
                likes: {
                    select: {
                        id: true
                    },
                    where: {
                        authorId: req.auth?.id
                    }
                },
                _count: {
                    select: {
                        likes: true
                    }
                }
            }
        });

        if (!changelog) {
            res.status(404).json({ error: 'Changelog not found' });
            return;
        }

        res.status(200).json({
            ...changelog,
            likes: changelog._count.likes ?? 0,
            likedByMe: changelog.likes.length > 0
        });

    } catch (error) {
        console.error('Error in getPublicBySlug:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const like = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const { changelogSlug } = req.params;

    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const changelog = await db.changelog.findUnique({ where: { applicationId_slug: { applicationId, slug: changelogSlug } } });

    if (!changelog) {
        res.status(404).json({ error: 'Changelog not found' });
        return;
    }

    const like = await db.changelogLike.findUnique({ where: { changelogId_authorId: { changelogId: changelog.id, authorId: userId } } });

    if (like) {
        await db.changelogLike.delete({ where: { id: like.id } });
    } else {
        await db.changelogLike.create({ data: { changelogId: changelog.id, authorId: userId } });
    }

    res.status(200).json({ success: true });
}

const subscribe = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!;
    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    const isSubscribed = await db.user.findFirst({ where: { id: userId, changelogSubscriptions: { some: { id: applicationId } } } });

    if (isSubscribed) {
        await db.user.update({
            where: { id: userId },
            data: { changelogSubscriptions: { disconnect: { id: applicationId } } }
        });
    } else {
        await db.user.update({
            where: { id: userId },
            data: { changelogSubscriptions: { connect: { id: applicationId } } }
        });
    }

    res.status(200).json({ success: true });
}



export default {
    getAll,
    getBySlug,
    create,
    update,
    delete: deleteChangelog,
    linkFeedback,
    unlinkFeedback,
    getLabels,
    createLabel,
    updateLabel,
    deleteLabel,
    getResolvedFeedbacks,
    publish,
    unpublish,
    schedule,
    unschedule,
    getPublic,
    getPublicBySlug,
    like,
    subscribe
}