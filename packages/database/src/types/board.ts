import { Prisma } from "../../generated/client";

export const boardSummarySelect = Prisma.validator<Prisma.BoardSelect>()({
    id: true,
    name: true,
    slug: true,
    title: true,
    details: true,
    detailsRequired: true,
    callToAction: true,
    buttonText: true,
    _count: {
        select: {
            feedbacks: true,
        },
    },
});

export type BoardSummary = Prisma.BoardGetPayload<{
    select: typeof boardSummarySelect;
}>;

export const boardFeedbackSummarySelect = Prisma.validator<Prisma.BoardSelect>()({
    id: true,
    name: true,
    slug: true,
    showOnHome: true,
    feedbacks: {
        where: {
            status: {
                in: ['OPEN','UNDER_REVIEW','PLANNED', 'IN_PROGRESS']
            }
        },
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            title: true,
            status: true,
            slug: true,
            votes: {
                select: {
                    authorId: true,
                }
            },
            board: {
                select: {
                    slug: true,
                    name: true,
                }
            },
            _count: {
                select: {
                    votes: true,
                },
            },
        },
    },
    _count: {
        select: {
            feedbacks: {
                where: {
                    status: {
                        notIn: ['CLOSED', 'RESOLVED']
                    }
                },
            },
        },
    },
});

export type BoardFeedbackSummary = Prisma.BoardGetPayload<{
    select: typeof boardFeedbackSummarySelect;
}>;