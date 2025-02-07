import { Prisma } from "../../generated/client";

export const boardSummarySelect = Prisma.validator<Prisma.BoardSelect>()({
    id: true,
    name: true,
    slug: true,
    _count: {
        select: {
            feedbacks: true,
        },
    },
});

export type BoardSummary = Prisma.BoardGetPayload<{
    select: typeof boardSummarySelect;
}>;