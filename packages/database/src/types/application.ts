import { Prisma } from "../../generated/client";

export const applicationSummarySelect = Prisma.validator<Prisma.ApplicationSelect>()({
    id: true,
    name: true,
    subdomain: true,
    customDomain: true,
    domainStatus: true,
    logoUrl: true,
    iconUrl: true,
    color: true,
    preferredTheme: true,
    preferredLanguage: true,
    ownerId: true,
});

export type ApplicationSummary = Prisma.ApplicationGetPayload<{
    select: typeof applicationSummarySelect;
}>;