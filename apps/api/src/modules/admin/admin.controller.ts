import { sendInvitationEmail } from "@/util";
import { activityOverview, ActivityType, ApplicationInviteStatus, applicationInviteSummarySelect, db, FeedbackStatus, getLatestPosts, memberActivity, membersDetail, memberSummarySelect, postOverviewAllBoards, postOverviewCategories, postOverviewTags, Role, userSummarySelect } from "@repo/database";
import type { Response } from "express";
import { DateTime } from "luxon";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
import type { BareSessionRequest } from "../../types";

const fileSchema = z.object({
    key: z.string(),
    name: z.string(),
    extension: z.string(),
    contentType: z.string(),
    size: z.number(),
});

const updateFeedbackSchema = z.object({
    boardId: z.string().uuid().optional(),
    status: z.nativeEnum(FeedbackStatus).optional(),
    ownerId: z.string().uuid().nullish(),
    estimatedDelivery: z.coerce.date().nullish(),
    publicEstimate: z.boolean().optional().default(true),
    tags: z.array(z.string().uuid()).optional(),
    categoryId: z.string().nullish(),
    content: z.string().optional().transform((value) => {
        if (!value) return undefined;
        return value.trim() === '' ? undefined : value;
    }),
    files: z.array(fileSchema).optional(),
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

    const { boardId, status, ownerId, estimatedDelivery, publicEstimate, categoryId, tags, content, files } = updateFeedbackSchema.parse(request.body);

    const updatedFeedback = await db.$transaction(async (tx) => {
        if (tags) {
            const newTags = await tx.tag.findMany({
                where: {
                    boardId: board.id,
                    id: {
                        in: tags,
                    },
                },
                select: { id: true },
            });
            const feedbackTags = await tx.tag.findMany({
                where: {
                    boardId: board.id,
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
                estimatedDelivery,
                publicEstimate,
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
                        content,
                    },
                    files: files ? {
                        createMany: {
                            data: files,
                        },
                    } : undefined,
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
                        content,
                    },
                    files: files ? {
                        createMany: {
                            data: files,
                        },
                    } : undefined,
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
                        content,
                    },
                    files: files ? {
                        createMany: {
                            data: files,
                        },
                    } : undefined,
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
                        content,
                    },
                    files: files ? {
                        createMany: {
                            data: files,
                        },
                    } : undefined,
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
                        content,
                    },
                    files: files ? {
                        createMany: {
                            data: files,
                        },
                    } : undefined,
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

    const members = await db.member.findMany({
        where: {
            applicationId,
        },
        select: {
            role: true,
            user: {
                select: userSummarySelect,
            }
        },
    });

    res.json(members);
}

export async function getMember(request: BareSessionRequest, res: Response) {
    const applicationId = request.application?.id;
    const userId = request.params.userId;

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const member = await db.member.findFirst({
        where: { userId, applicationId },
        select: memberSummarySelect,
    });

    const lastActivity = await db.activity.aggregate({
        where: {
            authorId: userId,
            feedback: { applicationId },
        },
        _max: {
            createdAt: true,
        },
    });

    res.status(200).json({
        ...member,
        lastActivity: lastActivity._max.createdAt,
    });
}


const userSearchSchema = z.object({
    cursor: z.string().optional(),
    take: z.number().default(10),
    order: z.enum(['last-activity', 'top-posters', 'top-voters']).default('last-activity'),
    filter: z.union([z.array(z.enum(['posts', 'votes', 'comments'])), z.enum(['posts', 'votes', 'comments'])]).optional().default(['posts', 'votes', 'comments']).transform((value) => Array.isArray(value) ? value : [value]),
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

export async function getDetailedUsers(request: BareSessionRequest, res: Response) {
    const applicationId = request.application?.id;

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const { cursor, take, order, start, end, search, filter } = userSearchSchema.parse(request.query);

    const old = cursor ? await db.$queryRawTyped(membersDetail(
        applicationId,
        start ?? DateTime.fromFormat('2000-01-01', 'yyyy-MM-dd').toJSDate(),
        end ?? DateTime.fromFormat('2100-01-01', 'yyyy-MM-dd').toJSDate(),
        order,
        take,
        0,
        '',
        filter?.includes('comments') ? 1 : 0,
        filter?.includes('votes') ? 1 : 0,
        filter?.includes('posts') ? 1 : 0,
    )) : [];

    const members = await db.$queryRawTyped(membersDetail(
        applicationId,
        start ?? DateTime.fromFormat('2000-01-01', 'yyyy-MM-dd').toJSDate(),
        end ?? DateTime.fromFormat('2100-01-01', 'yyyy-MM-dd').toJSDate(),
        order,
        take,
        cursor ? (old.findIndex((member) => member.id === cursor) ?? 0) + 1 : 0,
        search ?? '',
        filter?.includes('comments') ? 1 : 0,
        filter?.includes('votes') ? 1 : 0,
        filter?.includes('posts') ? 1 : 0,
    ));

    res.json({
        data: members,
        nextCursor: members.length === take ? members[members.length - 1].id : undefined,
    });
}

const memberActivitySchema = z.object({
    cursor: z.string().optional(),
    take: z.number().default(10),
    filter: z.union([z.array(z.enum(['posts', 'votes', 'comments'])), z.enum(['posts', 'votes', 'comments'])]).optional().default(['posts', 'votes', 'comments']).transform((value) => Array.isArray(value) ? value : [value]),
    start: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
    end: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
    userId: z.string(),
});

export async function getMemberActivity(request: BareSessionRequest, res: Response) {
    const applicationId = request.application?.id;

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const { cursor, take, filter, start, end, userId } = memberActivitySchema.parse(request.query);

    const old = cursor ? await db.$queryRawTyped(memberActivity(
        applicationId,
        start ?? DateTime.fromFormat('2000-01-01', 'yyyy-MM-dd').toJSDate(),
        end ?? DateTime.fromFormat('2100-01-01', 'yyyy-MM-dd').toJSDate(),
        userId,
        filter?.includes('comments') ? 1 : 0,
        filter?.includes('votes') ? 1 : 0,
        filter?.includes('posts') ? 1 : 0,
        take,
        0,
    )) : [];

    const members = await db.$queryRawTyped(memberActivity(
        applicationId,
        start ?? DateTime.fromFormat('2000-01-01', 'yyyy-MM-dd').toJSDate(),
        end ?? DateTime.fromFormat('2100-01-01', 'yyyy-MM-dd').toJSDate(),
        userId,
        filter?.includes('comments') ? 1 : 0,
        filter?.includes('votes') ? 1 : 0,
        filter?.includes('posts') ? 1 : 0,
        take,
        cursor ? (old.findIndex((member) => member.id === cursor) ?? 0) + 1 : 0,
    ));

    res.json({
        data: members,
        nextCursor: members.length === take ? members[members.length - 1].id : undefined,
    });
}

export async function getInvites(request: BareSessionRequest, res: Response) {
    const applicationId = request.application?.id;

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const invites = await db.applicationInvite.findMany({
        select: applicationInviteSummarySelect,
        where: {
            applicationId,
            status: ApplicationInviteStatus.PENDING,
            expiresAt: {
                gt: DateTime.now().toJSDate(),
            },
        },
    });

    res.json(invites);
}

const inviteUsersSchema = z.object({
    emails: z.array(z.string().email()),
    role: z.nativeEnum(Role),
});

export async function inviteUsers(request: BareSessionRequest, res: Response) {
    const applicationId = request.application?.id;
    const userId = request.auth?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const { emails, role } = inviteUsersSchema.parse(request.body);

    const invites = await db.$transaction(async (tx) => {
        const toDelete = await tx.applicationInvite.findMany({
            where: {
                applicationId,
                email: {
                    in: emails,
                },
                status: ApplicationInviteStatus.PENDING,
            },
        });

        const ignoredEmails = await tx.applicationInvite.findMany({
            where: {
                applicationId,
                email: {
                    in: emails,
                },
                status: ApplicationInviteStatus.ACCEPTED,
            },
        });

        await tx.applicationInvite.deleteMany({
            where: {
                id: {
                    in: toDelete.map((invite) => invite.id),
                },
            }
        });

        const existingUsers = await tx.user.findMany({
            where: {
                email: {
                    in: emails,
                },
            },
        });

        let remainingEmails = emails.filter((email) => !ignoredEmails.find((invite) => invite.email === email)).map((email) => {
            const existingUser = existingUsers.find((user) => user.email === email);
            return {
                email,
                userId: existingUser?.id,
            };
        });

        await tx.applicationInvite.createMany({
            data: remainingEmails.map((email) => ({
                email: email.email,
                role,
                applicationId,
                token: uuidv4(),
                expiresAt: DateTime.now().plus({ days: 7 }).toJSDate(),
                invitedById: userId,
                userId: email.userId,
            }))
        });

        const invites = await tx.applicationInvite.findMany({
            where: {
                applicationId,
                email: {
                    in: remainingEmails.map((email) => email.email),
                },
            },
        });

        for (const invite of invites) {
            sendInvitationEmail({
                email: invite.email,
                invitedByUsername: request.auth?.name!,
                invitedByEmail: request.auth?.email!,
                teamName: request.application?.name!,
                inviteLink: `${request.application?.url}/invite/${invite.token}`,
            });
        }

        return await tx.applicationInvite.findMany({
            select: applicationInviteSummarySelect,
            where: {
                applicationId,
                email: {
                    in: remainingEmails.map((email) => email.email),
                },
            },
        });;
    });

    res.json(invites);
}

export async function deleteInvite(request: BareSessionRequest, res: Response) {
    const userId = request.auth?.id;
    const inviteId = request.params.inviteId;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    await db.applicationInvite.delete({
        where: {
            id: inviteId,
        },
    });

    res.json({ success: true });
}

const updateRoleSchema = z.object({
    role: z.nativeEnum(Role),
});

export async function updateRole(request: BareSessionRequest, res: Response) {
    const userId = request.auth?.id;
    const memberId = request.params.memberId;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const { role } = updateRoleSchema.parse(request.body);

    if (userId === memberId) {
        res.status(400).json({ error: 'Cannot update your own role', code: 'CANNOT_UPDATE_YOUR_OWN_ROLE' });
        return;
    }

    await db.member.update({
        where: {
            id: memberId,
        },
        data: {
            role,
        },
    });

    res.json({ success: true });
}

export async function deleteMember(request: BareSessionRequest, res: Response) {
    const userId = request.auth?.id;
    const memberId = request.params.memberId;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    if (userId === memberId) {
        res.status(400).json({ error: 'Cannot delete yourself', code: 'CANNOT_DELETE_YOURSELF' });
        return;
    }

    await db.member.delete({
        where: {
            id: memberId,
        },
    });

    res.json({ success: true });
}

const activityOverviewSchema = z.object({
    start: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
    end: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
})

export async function getActivityOverview(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;

    const range = activityOverviewSchema.parse(req.query);

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const data = await db.$queryRawTyped(activityOverview(applicationId, range.start ?? DateTime.fromFormat('2000-01-01', 'yyyy-MM-dd').toJSDate(), range.end ?? DateTime.fromFormat('2100-01-01', 'yyyy-MM-dd').toJSDate()));

    const dataBefore = range.start && range.end ? await db.$queryRawTyped(activityOverview(applicationId,
        DateTime.fromJSDate(range.start).minus({ days: DateTime.fromJSDate(range.end).diff(DateTime.fromJSDate(range.start), 'days').days }).toJSDate(),
        DateTime.fromJSDate(range.start).toJSDate())) : [];

    const comments = data.map((row, index) => ({
        date: index,
        count: row.comment_count ?? 0,
    }));
    const commentsTotal = comments.reduce((acc, curr) => acc + curr.count, 0);
    const commentsBefore = dataBefore.map((row) => row.comment_count ?? 0).reduce((acc, curr) => acc + curr, 0);
    const commentsPercentageIncrease = ((commentsTotal - commentsBefore) / commentsBefore) * 100;
    const commentsTrend = commentsPercentageIncrease > 0 ? 'increase' : commentsPercentageIncrease < 0 ? 'decrease' : 'no change';

    const votes = data.map((row, index) => ({
        date: index,
        count: row.vote_count ?? 0,
    }));
    const votesTotal = votes.reduce((acc, curr) => acc + curr.count, 0);
    const votesBefore = dataBefore.map((row) => row.vote_count ?? 0).reduce((acc, curr) => acc + curr, 0);
    const votesPercentageIncrease = ((votesTotal - votesBefore) / votesBefore) * 100;
    const votesTrend = votesPercentageIncrease > 0 ? 'increase' : votesPercentageIncrease < 0 ? 'decrease' : 'no change';

    const statusChanges = data.map((row, index) => ({
        date: index,
        count: row.status_change_count ?? 0,
    }));
    const statusChangesTotal = statusChanges.reduce((acc, curr) => acc + curr.count, 0);
    const statusChangesBefore = dataBefore.map((row) => row.status_change_count ?? 0).reduce((acc, curr) => acc + curr, 0);
    const statusChangesPercentageIncrease = ((statusChangesTotal - statusChangesBefore) / statusChangesBefore) * 100;
    const statusChangesTrend = statusChangesPercentageIncrease > 0 ? 'increase' : statusChangesPercentageIncrease < 0 ? 'decrease' : 'no change';

    const feedbacks = data.map((row, index) => ({
        date: index,
        count: row.feedback_count ?? 0,
    }));
    const feedbacksTotal = feedbacks.reduce((acc, curr) => acc + curr.count, 0);
    const feedbacksBefore = dataBefore.map((row) => row.feedback_count ?? 0).reduce((acc, curr) => acc + curr, 0);
    const feedbacksPercentageIncrease = ((feedbacksTotal - feedbacksBefore) / feedbacksBefore) * 100;
    const feedbacksTrend = feedbacksPercentageIncrease > 0 ? 'increase' : feedbacksPercentageIncrease < 0 ? 'decrease' : 'no change';

    res.json({
        comments: {
            data: comments,
            total: commentsTotal,
            trend: range.start && range.end ? commentsTrend : undefined,
            percentageIncrease: range.start && range.end ? commentsPercentageIncrease : undefined,
        },
        votes: {
            data: votes,
            total: votesTotal,
            trend: range.start && range.end ? votesTrend : undefined,
            percentageIncrease: range.start && range.end ? votesPercentageIncrease : undefined,
        },
        statusChanges: {
            data: statusChanges,
            total: statusChangesTotal,
            trend: range.start && range.end ? statusChangesTrend : undefined,
            percentageIncrease: range.start && range.end ? statusChangesPercentageIncrease : undefined,
        },
        feedbacks: {
            data: feedbacks,
            total: feedbacksTotal,
            trend: range.start && range.end ? feedbacksTrend : undefined,
            percentageIncrease: range.start && range.end ? feedbacksPercentageIncrease : undefined,
        },
    });
}

const newPostsSchema = z.object({
    take: z.coerce.number().optional().default(3),
});

export async function getNewPosts(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;
    const userId = req.auth?.id;
    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const { take } = newPostsSchema.parse(req.query);

    const posts = await db.feedback.findMany({
        select: {
            id: true,
            title: true,
            slug: true,
            board: {
                select: {
                    slug: true,
                },
            },
            votes: {
                select: {
                    id: true,
                },
                where: {
                    authorId: userId!,
                },
                take: 1,
            },
            _count: {
                select: {
                    votes: true,
                },
            },
        },
        where: {
            applicationId,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take,
    });

    res.json(posts.map((post) => ({
        ...post,
        votes: post._count.votes,
        boardSlug: post.board.slug,
        votedByMe: post.votes.length > 0,
        board: undefined,
        _count: undefined,
    })));
}

const stalePostsSchema = z.object({
    take: z.coerce.number().optional().default(3),
});

export async function getStalePosts(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;
    const userId = req.auth?.id;

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const { take } = stalePostsSchema.parse(req.query);

    const posts = await db.$queryRawTyped(getLatestPosts(userId!, applicationId, take));

    res.json(posts.map((post) => ({
        ...post,
        lastActivityAt: post.lastActivityAt ?? post.createdAt,
    })));
}

const userActivitySchema = z.object({
    start: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
    end: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
})

export async function userActivity(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const { start, end } = userActivitySchema.parse(req.query);

    const activity = await db.user.findMany({
        where: {
            members: {
                some: {
                    applicationId,
                },
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            _count: {
                select: {
                    votes: {
                        where: {
                            createdAt: { gte: start, lte: end },
                            feedback: {
                                applicationId,
                            }
                        },
                    },
                    feedbacks: {
                        where: {
                            createdAt: { gte: start, lte: end },
                            applicationId,
                        },
                    },
                    activities: {
                        where: {
                            createdAt: { gte: start, lte: end },
                            type: ActivityType.FEEDBACK_COMMENT,
                            feedback: {
                                applicationId,
                            }
                        },
                    },
                }
            }
        }
    })

    res.json(activity.map((user) => ({
        ...user,
        _count: undefined,
        votes: user._count.votes,
        comments: user._count.activities,
        feedbacks: user._count.feedbacks,
    })));
}

const postsOverviewSchema = z.object({
    start: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
    end: z.string().optional().transform((value) => value && DateTime.fromFormat(value, 'yyyy-MM-dd').isValid ? DateTime.fromFormat(value, 'yyyy-MM-dd').toJSDate() : undefined),
    boardSlug: z.string().optional(),
    groupBy: z.enum(['tag', 'category']).optional(),
})

export async function postsOverview(req: BareSessionRequest, res: Response) {
    const applicationId = req.application?.id;

    if (!applicationId) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }

    const { start, end, boardSlug, groupBy } = postsOverviewSchema.parse(req.query);

    if (boardSlug === 'all') {
        const data = await db.$queryRawTyped(postOverviewAllBoards(applicationId,
            start ?? DateTime.fromFormat('2000-01-01', 'yyyy-MM-dd').toJSDate(),
            end ?? DateTime.fromFormat('2100-01-01', 'yyyy-MM-dd').toJSDate()
        ));

        res.status(200).json(data.map((row) => ({
            name: row.name,
            total: row.total ?? 0,
        })));
    }
    if (groupBy === 'tag' && boardSlug) {
        const data = await db.$queryRawTyped(postOverviewTags(applicationId, boardSlug,
            start ?? DateTime.fromFormat('2000-01-01', 'yyyy-MM-dd').toJSDate(),
            end ?? DateTime.fromFormat('2100-01-01', 'yyyy-MM-dd').toJSDate()
        ));

        res.status(200).json(data);
    }
    if (groupBy === 'category' && boardSlug) {
        const data = await db.$queryRawTyped(postOverviewCategories(applicationId, boardSlug,
            start ?? DateTime.fromFormat('2000-01-01', 'yyyy-MM-dd').toJSDate(),
            end ?? DateTime.fromFormat('2100-01-01', 'yyyy-MM-dd').toJSDate()
        ));
        res.status(200).json(data);
    }
}

export const controller = {
    feedback: {
        update: updateFeedback,
    },
    users: {
        get: getUsers,
        getDetailed: getDetailedUsers,
        getMember: getMember,
        activity: getMemberActivity,
        updateRole: updateRole,
        deleteMember: deleteMember,
        invites: {
            get: getInvites,
            invite: inviteUsers,
            delete: deleteInvite,
        },
    },
    activityOverview: {
        get: getActivityOverview,
        stalePosts: getStalePosts,
        newPosts: getNewPosts,
        userActivity: userActivity,
        postsOverview: postsOverview,
    },
};
