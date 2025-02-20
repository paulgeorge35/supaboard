import { FeedbackStatus, Prisma } from "../../generated/client";

export const changelogDetailedInclude = Prisma.validator<Prisma.ChangelogInclude>()({
    labels: {
        select: {
            id: true,
            name: true,
        },
    },
    linkedFeedbacks: {
        select: {
            id: true,
            title: true,
            slug: true,
            board: {
                select: {
                    slug: true,
                }
            },
            status: true,
            _count: {
                select: {
                    votes: true,
                },
            },
        },
    },
});

export type ChangelogDetailed = Omit<Prisma.ChangelogGetPayload<{
    include: typeof changelogDetailedInclude;
}>, 'linkedFeedbacks'> & {
    linkedFeedbacks: {
        id: string;
        title: string;
        status: FeedbackStatus;
        board: { slug: string };
        votes: number;
    }[];
};

export const changelogLabelSelect = Prisma.validator<Prisma.ChangelogLabelSelect>()({
    id: true,
    name: true,
    _count: {
        select: {
            changelogs: true,
        },
    },
});

type ChangelogLabel = Prisma.ChangelogLabelGetPayload<{
    select: typeof changelogLabelSelect;
}>;

export type ChangelogLabelSummary = Omit<ChangelogLabel, '_count'> & {
    count: number;
}