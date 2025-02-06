import { ActivityType, db, FeedbackStatus } from "@repo/database";
import type { Response } from "express";
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

    const existingVote = await db.vote.findFirst({ where: { feedbackId: feedback.id, authorId: userId } });

    if (existingVote) {
        await db.vote.delete({ where: { id: existingVote.id } });
    } else {
        await db.vote.create({ data: { feedbackId: feedback.id, authorId: userId } });
    }

    res.status(200).json({ success: true });
}

const feedbackSchema = z.object({
    title: z.string().min(1).trim(),
    description: z.string().min(1).trim(),
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
    const applicationId = req.application?.id;
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

    const slug = await generateUniqueSlug(data.title, boardId);

    const feedback = await db.feedback.create({
        data: {
            title: data.title,
            description: data.description,
            slug,
            board: { connect: { id: boardId } },
            application: { connect: { id: applicationId } },
            author: { connect: { id: userId } },
        },
    });

    res.status(201).json(feedback);
}

export async function getFeedbackBySlug(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const { boardSlug, feedbackSlug } = req.params;
    const { application } = req;

    const member = userId ? await db.member.findFirst({ where: { userId, applicationId: application?.id } }) : null;

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const feedback = await db.feedback.findFirst({
        where: { slug: feedbackSlug, boardId: board.id },
        include: {
            votes: {
                select: {
                    id: true,
                    authorId: true,
                },
                take: 5,
            },
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    votes: true,
                },
            },
        },
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
        votes: feedback._count.votes,
        votedByMe: feedback.votes.some((vote) => vote.authorId === userId),
        isDeletable: hasActivity ? !!member : userId === feedback.authorId,
        isEditable: userId === feedback.authorId,
        createdAt: feedback.createdAt,
        author: {
            id: feedback.author?.id ?? "deleted",
            name: feedback.author?.name ?? "Deleted User",
            avatar: feedback.author?.avatar ?? undefined,
            isAdmin: feedback.author?.id === application?.ownerId,
        },
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
    content: z.string().min(1),
});

const statusChangeDataSchema = z.object({
    status: z.nativeEnum(FeedbackStatus),
    content: z.string().optional(),
});

const activityDataSchema = z.union([commentDataSchema, statusChangeDataSchema]);

export async function getActivities(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug } = req.params;
    const { sort } = req.query;
    const applicationId = req.application?.id;
    const userId = req.auth?.id;

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
    ];

    const pinned = await db.activity.findFirst({
        where: { feedbackId: feedback.id, pinned: true, type: { in: activityTypes } },
        include: {
            likes: {
                select: {
                    id: true,
                    authorId: true,
                },
            },
            _count: {
                select: {
                    likes: true,
                },
            },
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });

    const activities = await db.activity.findMany({
        where: { feedbackId: feedback.id, type: { in: activityTypes } },
        include: {
            likes: {
                select: {
                    id: true,
                    authorId: true,
                },
            },
            _count: {
                select: {
                    likes: true,
                },
            },
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
        orderBy: {
            createdAt: sort === 'newest' ? 'desc' : 'asc',
        },
    });

    const response = {
        pinned: pinned ? {
            ...pinned,
            data: activityDataSchema.parse(pinned.data),
            likes: pinned._count.likes,
            likedByMe: pinned.likes.some((like) => like.authorId === userId),
            author: {
                ...pinned.author,
                isAdmin: pinned.author.id === application.ownerId,
            },
        } : undefined,
        activities: activities.map((activity) => ({
            ...activity,
            data: activityDataSchema.parse(activity.data),
            likes: activity._count.likes,
            likedByMe: activity.likes.some((like) => like.authorId === userId),
            author: {
                ...activity.author,
                isAdmin: activity.author.id === application.ownerId,
            },
        })),
    }
    res.status(200).json(response);
}

const commentSchema = z.object({
    content: z.string().min(1),
});

export async function comment(req: BareSessionRequest, res: Response) {
    const { boardSlug, feedbackSlug } = req.params;
    const applicationId = req.application?.id;
    const userId = req.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { success, data } = commentSchema.safeParse(req.body);

    if (!success) {
        res.status(400).json({ error: 'Invalid comment data' });
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

    const activityJson = {
        content: data.content,
    }

    const comment = await db.activity.create({
        data: {
            type: 'FEEDBACK_COMMENT',
            data: activityJson,
            feedback: { connect: { id: feedback.id } },
            author: { connect: { id: userId } },
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