import { Language, Role, Theme } from '@repo/database';
import type { Request } from 'express';
import { z } from 'zod';

export type CustomRequest<A = undefined, W = undefined, T = undefined, B = undefined> = Request & {
    auth?: A;
    workspaces?: W;
    body?: T;
    application?: B;
};

export const workspaceSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
});

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
    logo: z.string().nullish(),
    icon: z.string().nullish(),
    color: z.string(),
    preferredTheme: z.nativeEnum(Theme),
    preferredLanguage: z.nativeEnum(Language),
    ownerId: z.string(),
    boards: z.array(z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
    })),
    url: z.string(),
    api: z.string(),
    hasChangelog: z.boolean().default(false),
    role: z.nativeEnum(Role).nullable(),
});

export const workspacesSchema = z.array(workspaceSchema);

export type ApplicationSession = z.infer<typeof applicationSchema>;

export type BareSession = z.infer<typeof bareSessionSchema>;

export type WorkspacesSession = z.infer<typeof workspacesSchema>;

export type BareSessionRequest<T = undefined> = CustomRequest<BareSession, WorkspacesSession, T, ApplicationSession>;
