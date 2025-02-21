import { ActivityType, Prisma } from "../../generated/client";

export const feeedbackSummarySelect = Prisma.validator<Prisma.FeedbackSelect>()({
    id: true,
    title: true,
    description: true,
    status: true,
    slug: true,
    board: {
        select: {
            name: true,
            slug: true,
        }
    },
    _count: {
        select: {
            votes: true,
            activities: {
                where: {
                    type: {
                        in: [ActivityType.FEEDBACK_COMMENT, ActivityType.FEEDBACK_STATUS_CHANGE]
                    }
                }
            },
        },
    },
});

export type FeedbackSummary = Prisma.FeedbackGetPayload<{
    select: typeof feeedbackSummarySelect;
}>;

export const feedbackDetail = (userId: string) => Prisma.validator<Prisma.FeedbackInclude>()({
    category: {
        select: {
            name: true,
            slug: true,
        },
    },
    changelog: {
        select: {
            slug: true,
        },
    },
    tags: {
        select: {
            id: true,
            name: true,
        },
    },
    votes: {
        select: {
            id: true,
            authorId: true,
        },
        where: {
            authorId: userId,
        },
        take: 1,
    },
    author: {
        select: {
            id: true,
            name: true,
            avatar: true,
        },
    },
    owner: {
        select: {
            id: true,
            name: true,
            avatar: true,
        },
    },
    roadmapItems: {
        select: {
            id: true,
            roadmap: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    },
    merged: {
        select: {
            id: true,
        },
        take: 1,
    },
    files: {
        select: {
            key: true,
        },
    },
    _count: {
        select: {
            votes: true,
        },
    },
})

export type FeedbackDetail = Prisma.FeedbackGetPayload<{
    include: ReturnType<typeof feedbackDetail>;
}>;

export const feedbackDetailMerged = Prisma.validator<Prisma.FeedbackInclude>()({
    author: {
        select: {
            id: true,
            name: true,
            avatar: true,
        },
    },
    board: {
        select: {
            slug: true,
        },
    },
    files: {
        select: {
            key: true,
        },
    },
})

export type FeedbackDetailMerged = Omit<Prisma.FeedbackGetPayload<{
    include: typeof feedbackDetailMerged;
}>, 'files'> & {
    author: {
        id: string;
        name: string;
        avatar: string | null;
        isAdmin: boolean;
    };
    files: string[];
}

export const feedbackAcivityInclude = Prisma.validator<Prisma.ActivityInclude>()({
    files: {
        select: {
            key: true,
        },
    },
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
})

export type FeedbackActivity = Prisma.ActivityGetPayload<{
    include: typeof feedbackAcivityInclude;
}>;