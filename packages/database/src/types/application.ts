import { Board, Prisma } from "../../generated/client";
import { BoardFeedbackSummary } from "./board";

export const workspaceSelect = Prisma.validator<Prisma.ApplicationSelect>()({
    id: true,
    name: true,
});

export type Workspace = Prisma.ApplicationGetPayload<{
    select: typeof workspaceSelect;
}>& {
    url: string;
};

export const applicationSummarySelect = (where?: Prisma.DomainWhereInput) => Prisma.validator<Prisma.ApplicationSelect>()({
    id: true,
    name: true,
    subdomain: true,
    domains: {
        select: {
            domain: true,
            custom: true,
            primary: true,
        },
        where,
    },
    logo: true,
    icon: true,
    color: true,
    preferredTheme: true,
    preferredLanguage: true,
    ownerId: true,
    isChangelogPublic: true,
    isChangelogSubscribable: true,
});

export type ApplicationSummary = Prisma.ApplicationGetPayload<{
    select: ReturnType<typeof applicationSummarySelect>;
}>;

export type FeedbackDetailed = Pick<BoardFeedbackSummary['feedbacks'][number], 'id' | 'title' | 'status' | 'slug'> & {
    votes: number;
    votedByMe: boolean;
    board: Pick<Board, 'slug' | 'name'>;
}

export const applicationInviteSummarySelect = Prisma.validator<Prisma.ApplicationInviteSelect>()({
    id: true,
    email: true,
    role: true,
});

export type ApplicationInviteSummary = Prisma.ApplicationInviteGetPayload<{
    select: typeof applicationInviteSummarySelect;
}>;