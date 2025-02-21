import type { BareSessionRequest } from "@/types";
import { parseAndThrowFirstError } from "@/util/error-parser";
import { db, FeedbackStatus, Prisma } from "@repo/database";
import type { Response } from "express";
import { z } from "zod";

export async function getBoardBySlug(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const { slug } = req.params;

    const member = userId ? await db.user.findUnique({ where: { id: userId } }) : null;

    const board = await db.board.findFirst({
        where: {
            slug,
            applicationId: req.application?.id,
            public: member ? undefined : true,
        },
    });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    res.status(200).json(board);
}

const getBoardBySlugDetailedSchema = z.object({
    search: z.string().optional().transform(
        (value) => {
            if (!value) return undefined;
            return value.trim().replace(/ +(?= )/g, '')
                .split(' ')
                .filter((word) => word.length > 2)
                .join(' | ');
        }
    ),
    sort: z.enum(['newest', 'top']).default('newest').optional(),
    status: z.union([z.array(z.nativeEnum(FeedbackStatus)), z.nativeEnum(FeedbackStatus)]).optional().default(['OPEN', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS']),
});

export async function getBoardBySlugDetailed(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const { slug } = req.params;

    const member = userId ? await db.user.findUnique({ where: { id: userId } }) : null;

    const { search, sort, status } = parseAndThrowFirstError(getBoardBySlugDetailedSchema, req.query, res);

    const where: Prisma.FeedbackWhereInput = {};

    if (search) {
        where.OR = [
            { title: { search } },
            { description: { search } },
        ];
    }

    if (status) {
        where.status = { in: Array.isArray(status) ? status : [status] };
    }

    let orderBy: Prisma.FeedbackOrderByWithRelationInput = {};

    if (sort) {
        if (sort === 'newest') {
            orderBy = { createdAt: 'desc' };
        } else if (sort === 'top') {
            orderBy = { votes: { _count: 'desc' } };
        }
    }

    const board = await db.board.findFirst({
        where: { slug, applicationId: req.application?.id },
        include: {
            feedbacks: {
                where,
                orderBy,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    slug: true,
                    votes: {
                        select: {
                            authorId: true,
                        },
                    },
                    _count: {
                        select: {
                            votes: true,
                            activities: {
                                where: {
                                    public: member ? undefined : true,
                                    type: {
                                        in: ['FEEDBACK_COMMENT', 'FEEDBACK_STATUS_CHANGE', 'FEEDBACK_MERGE']
                                    }
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    res.status(200).json({
        ...board,
        feedbacks: board.feedbacks.map(feedback => ({
            id: feedback.id,
            title: feedback.title,
            description: feedback.description,
            status: feedback.status,
            slug: feedback.slug,
            votes: feedback._count.votes,
            activities: feedback._count.activities,
            votedByMe: feedback.votes.some(vote => vote.authorId === userId),
        })),
    });
}

const createBoardSchema = z.object({
    name: z.string(),
    description: z.string(),
    slug: z.string(),
});

export async function createBoard(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;
    const { name, description, slug } = createBoardSchema.parse(req.body);

    const existingBoard = await db.board.findFirst({ where: { slug, applicationId } });

    if (existingBoard) {
        res.status(400).json({ error: 'Board with this URL already exists', code: 'BOARD_SLUG_ALREADY_EXISTS' });
        return;
    }

    const board = await db.board.create({
        data: { name, description, slug, application: { connect: { id: applicationId } } },
    });

    res.status(200).json(board);
}

const updateBoardSchema = z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    callToAction: z.string().optional(),
    title: z.string().optional(),
    details: z.string().optional(),
    detailsRequired: z.boolean().optional(),
    buttonText: z.string().optional(),
    showOnHome: z.boolean().optional(),
    public: z.boolean().optional(),
});

export async function updateBoard(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;
    const { slug: boardSlug } = req.params;

    const updatedBoard = await db.$transaction(async (tx) => {
        const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId } });

        if (!board) {
            res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
            return;
        }

        const data = updateBoardSchema.parse(req.body);

        const existingBoard = await tx.board.findFirst({
            where: {
                AND: [
                    { slug: boardSlug },
                    { applicationId },
                    { id: { not: board.id } }
                ]
            }
        });

        if (existingBoard) {
            res.status(400).json({ error: 'Board with this URL already exists', code: 'BOARD_SLUG_ALREADY_EXISTS' });
            return;
        }

        return await tx.board.update({
            where: { id: board.id },
            data,
        });
    });

    res.status(200).json(updatedBoard);
}

export async function deleteBoard(req: BareSessionRequest, res: Response) {
    const { slug: boardSlug } = req.params;

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    await db.board.delete({ where: { id: board.id } });

    res.status(200).json({ message: 'Board deleted' });
}

const getCategoriesSchema = z.object({
    search: z.string().optional().transform(
        (value) => {
            if (!value) return undefined;
            return value.trim().replace(/ +(?= )/g, '')
                .split(' ')
                .filter((word) => word.length > 2)
                .join(' | ');
        }
    ),
    all: z.preprocess((val) => {
        if (val === undefined) return false;
        if (typeof val === "string") {
            return val.toLowerCase() === "true";
        }
        return val;
    }, z.boolean()),
});

export async function getCategories(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const { slug: boardSlug } = req.params;

    const { search, all } = getCategoriesSchema.parse(req.query);

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const member = userId ? await db.member.findFirst({ where: { userId, applicationId: req.application?.id } }) : null;

    let where: Prisma.FeedbackCategoryWhereInput = {};

    if (all) {
        where = { name: { search } };
    } else {
        where = { boardId: board.id, name: { search } };
    }

    const categories = await db.feedbackCategory.findMany({
        where,
        select: {
            id: true,
            name: true,
            slug: true,
            board: {
                select: {
                    slug: true,
                },
            },
            subscribers: {
                where: {
                    userId,
                },
                select: {
                    userId: true,
                },
            },
            _count: {
                select: {
                    feedbacks: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        }
    });

    const feedbacks = await db.feedback.count({
        where: {
            boardId: board.id,
            categoryId: null,
        },
    });

    const result = [
        {
            id: 'uncategorized',
            name: 'Uncategorized',
            slug: 'uncategorized',
            count: feedbacks,
            subscribed: member?.subscribedToUncategorized,
            board: {
                slug: board.slug,
            },
        },
        ...categories.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            board: category.board,
            count: category._count.feedbacks,
            subscribed: category.subscribers.some(subscriber => subscriber.userId === userId),
        })),
    ];

    res.status(200).json(result);
}

const categorySubscriptionSchema = z.object({
    subscribed: z.preprocess((val) => {
        if (val === undefined) return false;
        if (typeof val === "string") {
            return val.toLowerCase() === "true";
        }
        return val;
    }, z.boolean()),
});

export async function categorySubscription(req: BareSessionRequest, res: Response) {
    const userId = req.auth?.id;
    const { slug: boardSlug, categorySlug } = req.params;

    const { subscribed } = categorySubscriptionSchema.parse(req.query);

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const member = await db.member.findFirst({ where: { userId, applicationId: req.application?.id } });

    if (!member) {
        res.status(404).json({ error: 'Member not found', code: 'NOT_FOUND' });
        return;
    }

    if (categorySlug === 'uncategorized') {
        await db.member.update({
            where: { id: member.id },
            data: {
                subscribedToUncategorized: subscribed,
            },
        });

        res.status(200).json({ message: subscribed ? 'Subscribed to uncategorized' : 'Unsubscribed from uncategorized' });
        return;
    }

    const category = await db.feedbackCategory.findFirst({ where: { slug: categorySlug, boardId: board.id } });

    if (!category) {
        res.status(404).json({ error: 'Category not found', code: 'NOT_FOUND' });
        return;
    }

    if (subscribed) {
        await db.member.update({
            where: { id: member.id },
            data: {
                categoriesSubscribed: {
                    connect: { id: category.id },
                },
            },
        });
    } else {
        await db.member.update({
            where: { id: member.id },
            data: {
                categoriesSubscribed: {
                    disconnect: { id: category.id },
                },
            },
        });
    }

    res.status(200).json({ message: subscribed ? 'Subscribed to category' : 'Unsubscribed from category' });
}

const createCategorySchema = z.object({
    name: z.string(),
    subscribeAllAdmins: z.boolean().optional(),
});

export async function createCategory(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;
    const { slug: boardSlug } = req.params;
    const { name, subscribeAllAdmins } = createCategorySchema.parse(req.body);


    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const slug = await generateUniqueSlug(name, board.id);

    const category = await db.$transaction(async (tx) => {
        const existingCategory = await tx.feedbackCategory.findFirst({ where: { slug, boardId: board.id } });

        if (existingCategory) {
            res.status(400).json({ error: 'Category with this URL already exists', code: 'CATEGORY_SLUG_ALREADY_EXISTS' });
            return;
        }

        const category = await tx.feedbackCategory.create({
            data: { name, slug, boardId: board.id },
        });

        if (subscribeAllAdmins) {
            const members = await tx.member.findMany({ select: { id: true }, where: { applicationId, role: 'ADMIN' } });

            await tx.feedbackCategory.update({
                where: { id: category.id },
                data: {
                    subscribers: {
                        connect: members,
                    },
                },
            });
        }

        return category;
    });

    res.status(200).json(category);
}


async function generateUniqueSlug(name: string, boardId: string): Promise<string> {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 0;

    while (true) {
        const existing = await db.feedbackCategory.findFirst({
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

const updateCategorySchema = z.object({
    name: z.string(),
});

export async function updateCategory(req: BareSessionRequest, res: Response) {
    const { slug: boardSlug, categorySlug } = req.params;
    const { name } = updateCategorySchema.parse(req.body);

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const category = await db.feedbackCategory.findFirst({ where: { slug: categorySlug, boardId: board.id } });

    if (!category) {
        res.status(404).json({ error: 'Category not found', code: 'NOT_FOUND' });
        return;
    }

    const updatedCategory = await db.feedbackCategory.update({
        where: { id: category.id },
        data: { name },
    });

    res.status(200).json(updatedCategory);
}

export async function deleteCategory(req: BareSessionRequest, res: Response) {
    const { slug: boardSlug, categorySlug } = req.params;

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const category = await db.feedbackCategory.findFirst({ where: { slug: categorySlug, boardId: board.id } });

    if (!category) {
        res.status(404).json({ error: 'Category not found', code: 'NOT_FOUND' });
        return;
    }

    await db.feedbackCategory.delete({ where: { id: category.id } });

    res.status(200).json({ message: 'Category deleted' });
}

const createTagSchema = z.object({
    name: z.string().transform((val) => val.trim().replace(/ +(?= )/g, '')),
    feedbackId: z.string().uuid().optional(),
    throwError: z.boolean().optional().default(false),
});

export async function createTag(req: BareSessionRequest, res: Response) {
    const { slug: boardSlug } = req.params;
    const { name, throwError, feedbackId } = createTagSchema.parse(req.body);

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const tag = await db.$transaction(async (tx) => {
        const existingTag = await db.tag.findFirst({ where: { name, boardId: board.id } });

        if (existingTag) {
            if (throwError) {
                res.status(400).json({ error: 'Tag with this name already exists', code: 'TAG_ALREADY_EXISTS' });
                return;
            }

            if (feedbackId) {
                await tx.tag.update({
                    where: { id: existingTag.id },
                    data: { feedbacks: { connect: { id: feedbackId } } },
                });
            }

            res.status(200).json(existingTag);
            return;
        }

        return await db.tag.create({
            data: {
                name,
                board: { connect: { id: board.id } },
                feedbacks: feedbackId ? { connect: { id: feedbackId } } : undefined,
            },
        });
    });

    res.status(200).json(tag);
}

const updateTagSchema = z.object({
    name: z.string().optional().transform((val) => val ? val.trim().replace(/ +(?= )/g, '') : undefined),
});

export async function updateTag(req: BareSessionRequest, res: Response) {
    const { slug: boardSlug, tagId } = req.params;
    const { name } = updateTagSchema.parse(req.body);

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const tag = await db.tag.findFirst({ where: { id: tagId, boardId: board.id } });

    if (!tag) {
        res.status(404).json({ error: 'Tag not found', code: 'NOT_FOUND' });
        return;
    }

    const updatedTag = await db.tag.update({
        where: { id: tag.id },
        data: { name },
    });

    res.status(200).json(updatedTag);
}

export async function deleteTag(req: BareSessionRequest, res: Response) {
    const { slug: boardSlug, tagId } = req.params;

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    const tag = await db.tag.findFirst({ where: { id: tagId, boardId: board.id } });

    if (!tag) {
        res.status(404).json({ error: 'Tag not found', code: 'NOT_FOUND' });
        return;
    }

    await db.tag.delete({ where: { id: tag.id } });

    res.status(200).json({ message: 'Tag deleted' });
}

const getTagsSchema = z.object({
    search: z.string().optional().transform(
        (value) => {
            if (!value) return undefined;
            return value.trim().replace(/ +(?= )/g, '')
                .split(' ')
                .filter((word) => word.length > 2)
                .join(' | ');
        }
    ),
    all: z.preprocess((val) => {
        if (val === undefined) return false;
        if (typeof val === "string") {
            return val.toLowerCase() === "true";
        }
        return val;
    }, z.boolean()),
});

export async function getTags(req: BareSessionRequest, res: Response) {
    const { slug: boardSlug } = req.params;
    const { search, all } = getTagsSchema.parse(req.query);

    const board = await db.board.findFirst({ where: { slug: boardSlug, applicationId: req.application?.id } });

    if (!board) {
        res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
        return;
    }

    let where: Prisma.TagWhereInput = {};

    if (all) {
        where = { name: { search } };
    } else {
        where = { boardId: board.id, name: { search } };
    }

    const tags = await db.tag.findMany({
        where,
        select: {
            id: true,
            name: true,
            board: {
                select: {
                    slug: true,
                },
            },
            _count: {
                select: {
                    feedbacks: true,
                },
            },
        },
    });

    const result = tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        board: tag.board,
        count: tag._count.feedbacks,
    }));


    res.status(200).json(result);
}

export const controller = {
    tag: {
        create: createTag,
        update: updateTag,
        delete: deleteTag,
        get: getTags,
    },
    category: {
        create: createCategory,
        update: updateCategory,
        delete: deleteCategory,
        get: getCategories,
        subscribe: categorySubscription,
    },
    board: {
        create: createBoard,
        update: updateBoard,
        delete: deleteBoard,
        get: getBoardBySlug,
        getDetailed: getBoardBySlugDetailed,
    },
}