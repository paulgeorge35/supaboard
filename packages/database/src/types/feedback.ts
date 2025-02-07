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

export const feedbackDetail = Prisma.validator<Prisma.FeedbackInclude>()({
    category: {
        select: {
            name: true,
            slug: true,
        },
    },
    tags: {
        select: {
            name: true,
            color: true,
        },
    },
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
    owner: {
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
})

export type FeedbackDetail = Prisma.FeedbackGetPayload<{
    include: typeof feedbackDetail;
}>;