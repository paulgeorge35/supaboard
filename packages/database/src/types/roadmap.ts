import { Prisma } from "../../generated/client";

export const roadmapSummarySelect = Prisma.validator<Prisma.RoadmapSelect>()({
    id: true,
    name: true,
    slug: true,
});

export type RoadmapSummary = Prisma.RoadmapGetPayload<{
    select: typeof roadmapSummarySelect;
}>;

export const roadmapDetailSelect = Prisma.validator<Prisma.RoadmapSelect>()({
    id: true,
    name: true,
    slug: true,
    items: {
        select: {
            impact: true,
            effort: true,
            feedback: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    estimatedDelivery: true,
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                    category: {
                        select: {
                            name: true,
                            slug: true,
                        },
                    },
                    tags: {
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
                    _count: {
                        select: {
                            votes: true,
                        },
                    },
                }
            }
        },
        orderBy: {
            feedback: {
                createdAt: 'desc',
            },
        },
    },
});

export type RoadmapDetail = Prisma.RoadmapGetPayload<{
    select: typeof roadmapDetailSelect;
}>;