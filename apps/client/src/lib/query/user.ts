import { FeedbackStatus } from "@repo/database";
import { z } from "zod";
import { fetchClient } from "../client";

const userSearchSchema = z.object({
    search: z.string().optional(),
    cursor: z.string().optional(),
    take: z.number().optional(),
    order: z.enum(['last-activity', 'top-posters', 'top-voters']).optional(),
    filter: z.array(z.enum(['posts', 'votes', 'comments'])).optional(),
    start: z.string().optional(),
    end: z.string().optional()
})

export type UserSearch = z.infer<typeof userSearchSchema>

export type MembersPage = {
    data: MembersDetail[]
    nextCursor?: string | undefined;
}

export type MembersDetail = {
    id: string;
    name: string;
    email: string;
    avatar: string;
    lastActivity: Date;
    comments: number;
    votes: number;
    posts: number;
}

export const membersInfiniteQuery = (queryParams: UserSearch) => ({
    queryKey: ['admin', 'users', 'detailed', queryParams],
    queryFn: ({ pageParam }: { pageParam: string | undefined }): Promise<MembersPage> =>
        fetchClient("admin/users/detailed", {
            queryParams: {
                ...queryParams,
                cursor: pageParam,
            },
        }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: MembersPage) => {
        return lastPage.nextCursor || undefined
    }
})

const memberActivitySchema = z.object({
    cursor: z.string().optional(),
    take: z.number().optional(),
    filter: z.array(z.enum(['posts', 'votes', 'comments'])).optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    userId: z.string(),
});

export type MemberActivitySearch = z.infer<typeof memberActivitySchema>

export type MemberActivityPage = {
    data: MemberActivity[]
    nextCursor?: string | undefined;
}

export type MemberActivity = {
    id: string;
    title: string;
    description: string;
    status: FeedbackStatus;
    slug: string;
    boardSlug: string;
    comments: number;
    votes: number;
    posts: number;
    totalComments: number;
    totalVotes: number;
}

export const memberActivityInfiniteQuery = (queryParams: MemberActivitySearch) => ({
    queryKey: ['admin', 'users', 'activity', queryParams],
    queryFn: ({ pageParam }: { pageParam: string | undefined }): Promise<MemberActivityPage> =>
        fetchClient("admin/users/activity", {
            queryParams: { ...queryParams, cursor: pageParam },
        }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: MemberActivityPage) => {
        return lastPage.nextCursor || undefined
    }
});