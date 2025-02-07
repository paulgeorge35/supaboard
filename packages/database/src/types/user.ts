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
