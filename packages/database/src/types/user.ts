import { Prisma } from '../../generated/client';

export const userSummarySelect = Prisma.validator<Prisma.UserSelect>()({
    id: true,
    name: true,
    email: true,
    avatar: true,
});

export type UserSummary = Prisma.UserGetPayload<{
    select: typeof userSummarySelect;
}>;

export const memberSummarySelect = Prisma.validator<Prisma.MemberSelect>()({
    role: true,
    createdAt: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            os: true,
            browser: true,
            device: true,
        },
    },
});

export type MemberSummary = Prisma.MemberGetPayload<{
    select: typeof memberSummarySelect;
}> & {
    lastActivity: Date | null;
};
