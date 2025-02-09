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