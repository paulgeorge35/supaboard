import { ActivityType, db, FeedbackStatus, userSummarySelect } from "@repo/database";
import type { Response } from "express";
import { z } from "zod";
import type { BareSessionRequest } from "../../types";

const updateFeedbackSchema = z.object({
    boardId: z.string().uuid().optional(),
    status: z.nativeEnum(FeedbackStatus).optional(),
    ownerId: z.string().uuid().nullish(),
    estimatedTime: z.date().nullish(),
    tags: z.array(z.string()).optional(),
    categoryId: z.string().uuid().nullish(),
});

export async function updateFeedback(request: BareSessionRequest, res: Response) {
    const userId = request.auth?.id;
    const applicationId = request.application?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const { boardSlug, feedbackSlug } = request.params;

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

    const feedback = await db.feedback.findFirst({
        where: { slug: feedbackSlug, boardId: board.id },
        include: {
            category: {
                select: {
                    name: true,
                },
            },
            owner: {
                select: {
                    name: true,
                },
            },
            board: {
                select: {
                    name: true,
                },
            },
        },
    });
    if (!feedback) {
        res.status(404).json({ error: 'Feedback not found', code: 'NOT_FOUND' });
        return;
    }

    const { boardId, status, ownerId, estimatedTime, categoryId, tags } = updateFeedbackSchema.parse(request.body);

    const updatedFeedback = await db.$transaction(async (tx) => {
        if (tags) {
            const newTags = await tx.tag.findMany({
                where: {
                    applicationId,
                    name: {
                        in: tags,
                    },
                },
                select: { id: true },
            });
            const feedbackTags = await tx.tag.findMany({
                where: {
                    applicationId,
                    id: {
                        notIn: newTags.map((tag) => tag.id),
                    },
                    feedbacks: {
                        some: { id: feedback.id },
                    },
                },
                select: { id: true },
            });
            await tx.feedback.update({
                where: { id: feedback.id },
                data: {
                    tags: {
                        disconnect: feedbackTags.map((tag) => ({ id: tag.id })),
                        connect: newTags.map((tag) => ({ id: tag.id })),
                    },
                },
            });
        }
        const updatedFeedback = await tx.feedback.update({
            where: { id: feedback.id },
            include: {
                category: {
                    select: {
                        name: true,
                    },
                },
                owner: {
                    select: {
                        name: true,
                    },
                },
                board: {
                    select: {
                        name: true,
                        slug: true,
                    },
                },
            },
            data: {
                boardId,
                status,
                ownerId,
                estimatedDelivery: estimatedTime,
                categoryId,
            },
        });
        if (updatedFeedback.categoryId !== feedback.categoryId) {
            await tx.activity.create({
                data: {
                    type: ActivityType.FEEDBACK_CATEGORY_CHANGE,
                    data: {
                        from: feedback.category?.name,
                        to: updatedFeedback.category?.name,
                    },
                    authorId: userId,
                    feedbackId: feedback.id,
                },
            });
        }
        if (updatedFeedback.status !== feedback.status) {
            await tx.activity.create({
                data: {
                    type: ActivityType.FEEDBACK_STATUS_CHANGE,
                    data: {
                        from: feedback.status,
                        to: updatedFeedback.status,
                    },
                    authorId: userId,
                    feedbackId: feedback.id,
                },
            });
        }
        if (updatedFeedback.ownerId !== feedback.ownerId) {
            await tx.activity.create({
                data: {
                    type: ActivityType.FEEDBACK_OWNER_CHANGE,
                    data: {
                        from: feedback.owner?.name,
                        to: updatedFeedback.owner?.name,
                    },
                    authorId: userId,
                    feedbackId: feedback.id,
                },
            });
        }
        if (updatedFeedback.boardId !== feedback.boardId) {
            await tx.activity.create({
                data: {
                    type: ActivityType.FEEDBACK_BOARD_CHANGE,
                    data: {
                        from: feedback.board?.name,
                        to: updatedFeedback.board?.name,
                    },
                    authorId: userId,
                    feedbackId: feedback.id,
                },
            });
        }
        if (updatedFeedback.estimatedDelivery !== feedback.estimatedDelivery) {
            await tx.activity.create({
                data: {
                    type: ActivityType.FEEDBACK_ESTIMATED_DELIVERY_CHANGE,
                    data: {
                        from: feedback.estimatedDelivery,
                        to: updatedFeedback.estimatedDelivery,
                    },
                    authorId: userId,
                    feedbackId: feedback.id,
                },
            });
        }
        return updatedFeedback;
    });

    res.json(updatedFeedback);
}

export async function getUsers(request: BareSessionRequest, res: Response) {
    const applicationId = request.application?.id;

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const users = await db.user.findMany({
        where: {
            members: {
                some: {
                    applicationId,
                },
            },
        },
        select: userSummarySelect,
    });

    res.json(users);
}


const createTagSchema = z.object({
    name: z.string().trim(),
    feedbackId: z.string().uuid().optional(),
});

export async function createTag(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;
    const color = req.application?.color ?? '#a684ff'

    const { name, feedbackId } = createTagSchema.parse(req.body);


    const tag = await db.$transaction(async (tx) => {
        const existingTag = await tx.tag.findFirst({
            where: { name, applicationId }
        });

        if (existingTag) {
            return await tx.tag.update({
                where: { id: existingTag.id },
                data: {
                    name,
                    color,
                    feedbacks: {
                        connect: {
                            id: feedbackId,
                        },
                    },
                },
            });
        }

        return await tx.tag.create({
            data: {
                name,
                color,
                application: {
                    connect: {
                        id: applicationId,
                    },
                },
                feedbacks: {
                    connect: {
                        id: feedbackId,
                    },
                },
            },
        });

    })

    res.json(tag);
}

const searchSchema = z.string().optional().transform(
    (value) => {
        if (!value) return undefined;
        return value.trim()
    }
)

export async function getTags(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;
    const search = searchSchema.parse(req.query.search);

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const tags = await db.tag.findMany({ where: { applicationId, name: search } });

    res.json(tags);
}
