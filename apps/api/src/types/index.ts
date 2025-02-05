import { DomainStatus, Language, Theme } from '@repo/database';
import type { Request } from 'express';
import { z } from 'zod';

export type CustomRequest<A = undefined, T = undefined, B = undefined> = Request & {
    auth?: A;
    body?: T;
    application?: B;
};

export const bareSessionSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
});

export const applicationSchema = z.object({
    id: z.string(),
    name: z.string(),
    subdomain: z.string(),
    customDomain: z.string().nullish(),
    domainStatus: z.nativeEnum(DomainStatus),
    logoUrl: z.string().nullish(),
    iconUrl: z.string().nullish(),
    color: z.string().nullish(),
    preferredTheme: z.nativeEnum(Theme),
    preferredLanguage: z.nativeEnum(Language),
    ownerId: z.string(),
});

export type ApplicationSession = z.infer<typeof applicationSchema>;

export type BareSession = z.infer<typeof bareSessionSchema>;

export type BareSessionRequest<T = undefined> = CustomRequest<BareSession, T, ApplicationSession>;
