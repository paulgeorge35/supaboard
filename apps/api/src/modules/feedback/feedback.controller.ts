import { parseAndThrowFirstError } from "@/util/error-parser";
import { ActivityType, db, feedbackAcivityInclude, feedbackDetail, feedbackDetailMerged, FeedbackStatus, feeedbackSummarySelect, Prisma } from "@repo/database";
import type { Response } from "express";
import { DateTime } from "luxon";
import { z } from "zod";
import type { BareSessionRequest } from "../../types";

export async function vote(req: BareSessionRequest, res: Response) {
    const { feedbackId } = req.params;
    const { application } = req;

    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if (!application) {
        res.status(404).json({ error: 'Application not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findUnique({ where: { id: feedbackId, board: { applicationId: application.id } } });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    if (feedback.mergedIntoId) {
        res.status(400).json({ error: 'Feedback is merged into another feedback', code: 'BAD_REQUEST' });
        return;
    }

    await db.$transaction(async (tx) => {
        const existingVote = await tx.vote.findFirst({ where: { feedbackId: feedback.id, authorId: userId } });

        if (existingVote) {
            await tx.vote.delete({ where: { id: existingVote.id } });
            await tx.activity.deleteMany({ where: { feedbackId: feedback.id, authorId: userId, type: ActivityType.FEEDBACK_VOTE } });
        } else {
            await tx.vote.create({ data: { feedbackId: feedback.id, authorId: userId } });
            await tx.activity.create({ data: { feedbackId: feedback.id, data: {}, authorId: userId, type: ActivityType.FEEDBACK_VOTE } });
        }
    });

    res.status(200).json({ success: true });
}

const fileSchema = z.object({
    key: z.string(),
    name: z.string(),
    extension: z.string(),
    contentType: z.string(),
    size: z.number(),
});

const feedbackSchema = z.object({
    title: z.string().min(1).trim(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    roadmapSlug: z.string().optional(),
    files: z.array(fileSchema).optional(),
});

async function generateUniqueSlug(title: string, boardId: string): Promise<string> {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 0;

    while (true) {
        const existing = await db.feedback.findFirst({
            where: {
                boardId,
                slug,
            },
        });

        if (!existing) {
            return slug;
        }

        counter++;
        slug = `${baseSlug}-${counter}`;
    }
}

export async function createFeedback(req: BareSessionRequest<z.infer<typeof feedbackSchema>>, res: Response) {
    const { boardId } = req.params;
    const applicationId = req.application?.id!;
    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { success, data } = feedbackSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({ error: 'Invalid feedback data' });
        return;
    }

    const board = await db.board.findUnique({ where: { id: boardId, applicationId } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    if (board.detailsRequired && !data.description?.trim()) {
        res.status(400).json({ error: 'Description is required' });
        return;
    }

    const slug = await generateUniqueSlug(data.title, boardId);

    const feedback = await db.feedback.create({
        data: {
            title: data.title,
            description: data.description ?? '',
            slug,
            category: data.categoryId && data.categoryId !== 'uncategorized' ? { connect: { id: data.categoryId } } : undefined,
            board: { connect: { id: boardId } },
            application: { connect: { id: applicationId } },
            author: { connect: { id: userId } },
            files: data.files ? {
                createMany: {
                    data: data.files,
                },
            } : undefined,
            activities: {
                create: {
                    type: ActivityType.FEEDBACK_CREATE,
                    data: {
                        title: data.title,
                        description: data.description ?? '',
                        slug,
                    },
                    authorId: userId,
                },
            },
            roadmapItems: data.roadmapSlug ? {
                create: {
                    roadmap: { connect: { applicationId_slug: { applicationId, slug: data.roadmapSlug } } },
                },
            } : undefined,
        },
    });

    res.status(201).json(feedback);
}

export async function getFeedbackBySlug(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const applicationId = req.application?.id;
    const ownerId = req.application?.ownerId;
    const { boardSlug, feedbackSlug } = req.params;

    const member = userId ? await db.member.findFirst({ where: { userId, applicationId } }) : null;

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({
        where: { slug: feedbackSlug, boardId: board.id },
        include: feedbackDetail(userId!)
    });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    const hasActivity = await db.activity.findFirst({ where: { feedbackId: feedback.id } });

    res.status(200).json({
        id: feedback.id,
        title: feedback.title,
        description: feedback.description,
        slug: feedback.slug,
        edited: feedback.edited,
        status: feedback.status,
        estimatedDelivery: feedback.estimatedDelivery,
        publicEstimate: feedback.publicEstimate,
        votes: feedback._count.votes,
        tags: feedback.tags,
        category: feedback.category,
        votedByMe: feedback.votes.some((vote) => vote.authorId === userId),
        isDeletable: hasActivity ? !!member : userId === feedback.authorId,
        isEditable: userId === feedback.authorId,
        createdAt: feedback.createdAt,
        changelogSlug: feedback.changelog?.slug,
        files: feedback.files.map((file) => file.key),
        author: {
            id: feedback.author?.id ?? "deleted",
            name: feedback.author?.name ?? "Deleted User",
            avatar: feedback.author?.avatar ?? undefined,
            isAdmin: feedback.author?.id === ownerId,
        },
        merged: feedback.merged,
        roadmaps: feedback.roadmapItems.map((item) => ({
            id: item.roadmap?.id,
            name: item.roadmap?.name,
            slug: item.roadmap?.slug,
        })),
        owner: feedback.owner,
    });
}

export async function getFeedbackById(req: BareSessionRequest, res: Response) {
    const { feedbackId } = req.params;

    const feedback = await db.feedback.findUnique({ where: { id: feedbackId }, include: feedbackDetailMerged });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    res.status(200).json({
        ...feedback,
        author: {
            ...feedback.author,
            isAdmin: feedback.author?.id === req.application?.ownerId,
        },
        files: feedback.files.map((file) => file.key),
    });
}

export async function getVoters(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug } = req.params;
    const applicationId = req.application?.id;

    const application = await db.application.findUnique({ where: { id: applicationId } });

    if (!application) {
        res.status(404).json({ error: 'Application not found', code: 'NOT_FOUND' });
        return;
    }

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({ where: { slug: feedbackSlug, boardId: board.id } });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    const voters = await db.vote.findMany({
        where: { feedbackId: feedback.id },
        select: {
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });

    res.status(200).json(voters.map((voter) => ({ ...voter.author, isAdmin: voter.author.id === application.ownerId })));
}

const commentDataSchema = z.object({
    type: z.literal(ActivityType.FEEDBACK_COMMENT),
    content: z.string().min(1),
});

const statusChangeDataSchema = z.object({
    type: z.literal(ActivityType.FEEDBACK_STATUS_CHANGE),
    from: z.nativeEnum(FeedbackStatus),
    to: z.nativeEnum(FeedbackStatus),
    content: z.string().optional(),
});

const mergeDataSchema = z.object({
    type: z.literal(ActivityType.FEEDBACK_MERGE),
    from: z.string(),
});

const activityDataSchema = z.discriminatedUnion('type', [commentDataSchema, statusChangeDataSchema, mergeDataSchema]);

export async function getActivities(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug } = req.params;
    const { sort } = req.query;
    const applicationId = req.application?.id;
    const userId = req.auth?.id;

    const member = userId ? await db.member.findFirst({ where: { userId, applicationId } }) : null;

    const application = await db.application.findUnique({ where: { id: applicationId } });

    if (!application) {
        res.status(404).json({ error: 'Application not found', code: 'NOT_FOUND' });
        return;
    }

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });
    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({ where: { slug: feedbackSlug, boardId: board.id } });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    const activityTypes: ActivityType[] = [
        'FEEDBACK_COMMENT',
        'FEEDBACK_STATUS_CHANGE',
        'FEEDBACK_MERGE',
    ];

    const pinned = await db.activity.findFirst({
        where: {
            feedbackId: feedback.id,
            pinned: true,
            type: { in: activityTypes }
        },
        include: feedbackAcivityInclude(userId),
    });


    const activities = await db.activity.findMany({
        where: {
            feedbackId: feedback.id,
            type: { in: activityTypes },
            public: member ? undefined : true,
            threadId: null,
        },
        include: feedbackAcivityInclude(userId),
        orderBy: {
            createdAt: sort === 'newest' ? 'desc' : 'asc',
        },
    });

    const response = {
        pinned: pinned ? {
            ...pinned,
            data: activityDataSchema.parse({
                type: pinned.type,
                ...pinned.data as Prisma.JsonObject,
            }),
            likes: pinned._count.likes,
            likedByMe: pinned.likes?.length > 0,
            files: pinned.files.map((file) => file.key),
            author: {
                ...pinned.author,
                isAdmin: pinned.author.id === application.ownerId,
            },
            threadId: pinned.threadId,
            thread: pinned.thread,
            replies: pinned.replies.map((reply) => ({
                ...reply,
                data: activityDataSchema.parse({
                    type: reply.type,
                    ...reply.data as Prisma.JsonObject,
                }),
                likes: reply._count.likes,
                likedByMe: reply.likes?.length > 0,
                files: reply.files.map((file) => file.key),
                author: {
                    ...reply.author,
                    isAdmin: reply.author.id === application.ownerId,
                },
            })),
        } : undefined,
        activities: activities.map((activity) => ({
            ...activity,
            data: activity.data ? activityDataSchema.parse({
                type: activity.type,
                ...activity.data as Prisma.JsonObject,
            }) : undefined,
            likes: activity._count.likes,
            likedByMe: activity.likes?.length > 0,
            files: activity.files.map((file) => file.key),
            author: {
                ...activity.author,
                isAdmin: activity.author.id === application.ownerId,
            },
            threadId: activity.threadId,
            thread: activity.thread,
            replies: activity.replies.map((reply) => ({
                ...reply,
                data: activityDataSchema.parse({
                    type: reply.type,
                    ...reply.data as Prisma.JsonObject,
                }),
                likes: reply._count.likes,
                likedByMe: reply.likes?.length > 0,
                files: reply.files.map((file) => file.key),
                author: {
                    ...reply.author,
                    isAdmin: reply.author.id === application.ownerId,
                },
                threadId: reply.threadId,
                thread: reply.thread,
            })),
        })),
    }
    res.status(200).json(response);
}

const commentSchema = z.object({
    content: z.string().min(1).max(1000, { message: 'Comment must be less than 1000 characters' }),
    public: z.boolean().optional().default(true),
    files: z.array(fileSchema).optional(),
    threadId: z.string().optional(),
});

export async function comment(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug } = req.params;
    const applicationId = req.application?.id;
    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const data = parseAndThrowFirstError(commentSchema, req.body, res);

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({ where: { slug: feedbackSlug, boardId: board.id } });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    if (feedback.mergedIntoId) {
        res.status(400).json({ error: 'Feedback is merged into another feedback', code: 'BAD_REQUEST' });
        return;
    }

    const activityJson = {
        content: data.content,
    }

    const comment = await db.activity.create({
        data: {
            type: 'FEEDBACK_COMMENT',
            data: activityJson,
            feedback: { connect: { id: feedback.id } },
            author: { connect: { id: userId } },
            public: data.public,
            files: data.files ? {
                createMany: {
                    data: data.files,
                },
            } : undefined,
            thread: data.threadId ? { connect: { id: data.threadId } } : undefined,
        },
    });

    res.status(201).json(comment);
}

export async function like(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug, activityId } = req.params;
    const applicationId = req.application?.id;
    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({ where: { slug: feedbackSlug, boardId: board.id } });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    const activity = await db.activity.findFirst({ where: { id: activityId, feedbackId: feedback.id } });

    if (!activity) {
        res.status(404).json({ error: 'Activity not found', code: 'NOT_FOUND' });
        return;
    }

    const existingLike = await db.activityLike.findFirst({ where: { activityId: activity.id, authorId: userId } });

    if (existingLike) {
        await db.activityLike.delete({ where: { id: existingLike.id } });
    } else {
        await db.activityLike.create({ data: { activityId: activity.id, authorId: userId } });
    }

    res.status(200).json({ success: true });
}

export async function pin(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug, activityId } = req.params;
    const applicationId = req.application?.id;
    const ownerId = req.application?.ownerId;
    const userId = req.auth?.id;

    if (!userId || userId !== ownerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({ where: { slug: feedbackSlug, boardId: board.id } });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    const activity = await db.activity.findFirst({ where: { id: activityId, feedbackId: feedback.id } });

    if (!activity) {
        res.status(404).json({ error: 'Activity not found', code: 'NOT_FOUND' });
        return;
    }

    if (!activity.public) {
        res.status(403).json({ error: 'You are not allowed to pin a private activity' });
        return;
    }

    if (activity.pinned) {
        await db.activity.update({ where: { id: activityId }, data: { pinned: false } });
    } else {
        await db.$transaction(async (tx) => {
            await tx.activity.updateMany({ where: { feedbackId: feedback.id, pinned: true, id: { not: activityId } }, data: { pinned: false } });
            await tx.activity.update({ where: { id: activityId }, data: { pinned: true } });
        });
    }

    res.status(200).json({ success: true });
}

export async function updateFeedback(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug } = req.params;
    const applicationId = req.application?.id;
    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({ where: { slug: feedbackSlug, boardId: board.id } });

    
    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    if (feedback.mergedIntoId) {
        res.status(400).json({ error: 'Feedback is merged into another feedback', code: 'BAD_REQUEST' });
        return;
    }

    const { success, data } = feedbackSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({ error: 'Invalid feedback data' });
        return;
    }

    await db.$transaction(async (tx) => {
        await tx.feedback.update({
            where: { id: feedback.id }, data: {
                title: data.title,
                description: data.description,
                edited: true,
            }
        });

        await tx.activity.create({
            data: {
                type: 'FEEDBACK_UPDATE',
                data: {
                    from: {
                        title: feedback.title,
                        description: feedback.description,
                    },
                    to: {
                        title: data.title,
                        description: data.description,
                    }
                },
                feedback: { connect: { id: feedback.id } },
                author: { connect: { id: userId } },
            },
        });
    });

    res.status(200).json({ success: true });
}

export async function deleteFeedback(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug } = req.params;
    const applicationId = req.application?.id;
    const userId = req.auth?.id;


    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const member = await db.member.findFirst({ where: { userId, applicationId } });

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({ where: { slug: feedbackSlug, boardId: board.id } });


    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    const hasActivity = await db.activity.findFirst({ where: { feedbackId: feedback.id } });

    if (hasActivity) {
        if (member) {
            await db.feedback.delete({ where: { id: feedback.id } });
        } else {
            res.status(403).json({ error: 'You are not allowed to delete this feedback' });
            return;
        }
    } else {
        if (userId === feedback.authorId) {
            await db.feedback.delete({ where: { id: feedback.id } });
        } else {
            res.status(403).json({ error: 'You are not allowed to delete this feedback' });
            return;
        }
    }

    res.status(200).json({ success: true });
}

const editHistorySchema = z.object({
    from: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
    }),
    to: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
    }),
});

export async function editHistory(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug } = req.params;
    const applicationId = req.application?.id;

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({ where: { slug: feedbackSlug, boardId: board.id } });

    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    const activities = await db.activity.findMany({
        where: { feedbackId: feedback.id, type: 'FEEDBACK_UPDATE' },
        orderBy: { createdAt: 'asc' }
    });

    const result = activities.map((activity) => {
        return {
            ...activity,
            ...editHistorySchema.parse(activity.data),
        };
    });

    res.status(200).json(result);
}

const feedbacksSchema = z.object({
    cursor: z.string().optional(),
    take: z.coerce.number().default(10),
    order: z.enum(['newest', 'oldest']).default('newest'),
    boards: z.union([z.array(z.string()), z.string()]).optional(),
    status: z.union([z.array(z.nativeEnum(FeedbackStatus)), z.nativeEnum(FeedbackStatus)]).optional().default(['OPEN', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS']),
    categories: z.union([z.array(z.string()), z.string()]).optional(),
    uncategorized: z.coerce.boolean().optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
    untagged: z.coerce.boolean().optional(),
    owner: z.string().optional(),
    unassigned: z.coerce.boolean().optional(),
    start: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
    end: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
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

export async function getFeedbacks(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;
    const userId = req.auth?.id;

    const member = userId ? await db.member.findFirst({ where: { userId, applicationId } }) : null;

    const { success, data } = feedbacksSchema.safeParse(req.query);

    if (!success) {
        res.status(400).json({ error: 'Invalid feedbacks data' });
        return;
    }

    const { cursor, take, order, start, end, ...filters } = data;

    const where: Prisma.FeedbackWhereInput = {
        applicationId,
        mergedIntoId: null,
    };

    if (member) {
        if (filters?.boards) {
            where.board = {
                applicationId,
                slug: { in: Array.isArray(filters.boards) ? filters.boards : [filters.boards] },
            }
        } else {
            where.board = {
                applicationId,
            }
        }
    } else {
        if (filters?.boards) {
            where.board = {
                applicationId,
                slug: { in: Array.isArray(filters.boards) ? filters.boards : [filters.boards] },
                public: true,
            }
        } else {
            where.board = {
                applicationId,
                public: true,
            }
        }
    }

    if (filters?.status) {
        where.status = { in: Array.isArray(filters.status) ? filters.status : [filters.status] };
    }

    if (filters?.categories) {
        where.categoryId = { in: Array.isArray(filters.categories) ? filters.categories : [filters.categories] };
    }

    if (filters?.uncategorized && !filters.categories) {
        where.categoryId = null;
    }

    if (filters?.tags) {
        where.tags = { some: { name: { in: Array.isArray(filters.tags) ? filters.tags : [filters.tags] } } };
    }

    if (filters?.untagged && !filters.tags) {
        where.tags = { none: {} };
    }

    if (filters?.owner) {
        where.ownerId = filters.owner;
    }

    if (filters?.unassigned) {
        where.ownerId = null;
    }

    if (filters?.search) {
        where.title = { search: filters.search };
        where.description = { search: filters.search };
    }

    if (start || end) {
        if (start && end) {
            where.createdAt = { gte: start, lte: end };
        } else if (start) {
            where.createdAt = { gte: start };
        } else if (end) {
            where.createdAt = { lte: end };
        }
    }

    const orderBy: Prisma.FeedbackOrderByWithRelationInput = order === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' };

    const result = await db.feedback.findMany({
        where,
        orderBy,
        take,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        select: feeedbackSummarySelect,
    });

    res.status(200).json({
        feedbacks: result,
        nextCursor: result[result.length - 1]?.id,
    });
}

const addNewRoadmapItemSchema = z.object({
    title: z.string().min(1).max(100),
    boardSlug: z.string().min(1).max(100),
});

const addNewRoadmapItem = async (req: BareSessionRequest, res: Response) => {
    const applicationId = req.application?.id!
    const userId = req.auth?.id!

    const { roadmapSlug } = req.params;
    const { title, boardSlug } = addNewRoadmapItemSchema.parse(req.body);

    const roadmap = await db.roadmap.findUnique({ where: { applicationId_slug: { applicationId, slug: roadmapSlug } } })

    if (!roadmap) {
        res.status(404).json({ error: "Roadmap not found" })
        return;
    }

    const board = await db.board.findUnique({ where: { applicationId_slug: { applicationId, slug: boardSlug } } })

    if (!board) {
        res.status(404).json({ error: "Board not found" })
        return;
    }

    const slug = await generateUniqueSlug(title, board.id)

    await db.feedback.create({
        data: {
            title,
            boardId: board.id,
            applicationId,
            slug,
            authorId: userId,
            activities: {
                create: {
                    type: ActivityType.FEEDBACK_CREATE,
                    data: {
                        title,
                        description: '',
                        slug,
                    },
                    authorId: userId,
                }
            },
            roadmapItems: {
                create: {
                    roadmapId: roadmap.id,
                    effort: 1,
                }
            }
        }
    })

    res.status(200).json({ success: true })
}

export const controller = {
    feedback: {
        create: createFeedback,
        getAll: getFeedbacks,
        getBySlug: getFeedbackBySlug,
        getById: getFeedbackById,
        getVoters: getVoters,
        getActivities: getActivities,
        update: updateFeedback,
        delete: deleteFeedback,
        editHistory: editHistory,
        vote: vote,
        comment: comment,
        like: like,
        pin: pin,
        addNewRoadmapItem: addNewRoadmapItem,
    }
}