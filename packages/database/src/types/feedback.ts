import { Prisma } from "../../generated/client";

export const feeedbackSummarySelect = Prisma.validator<Prisma.FeedbackSelect>()({
    id: true,
    title: true,
    description: true,
    status: true,
    slug: true,
    board: {
        select: {
            slug: true,
        }
    },
    _count: {
        select: {
            votes: true,
            activities: true,
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
                    name: true,
                    slug: true,
                },
            },
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