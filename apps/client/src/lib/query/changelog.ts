import { Changelog, ChangelogDetailed, ChangelogLabelSummary, FeedbackStatus } from "@repo/database";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { fetchClient } from "../client";

const searchParams = z.object({
    search: z.string().optional(),
    status: z.array(z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED'])).optional(),
    type: z.enum(['ALL', 'NEW', 'IMPROVED', 'FIXED']).optional(),
    labels: z.array(z.string()).optional(),
})

export type ChangelogSearch = z.infer<typeof searchParams>

export type ChangelogPage = {
    changelogs: ChangelogDetailed[];
    nextCursor?: string | undefined;
}

export const changelogsInfiniteQuery = (queryParams?: ChangelogSearch) => ({
    queryKey: ['changelogs', 'all'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }): Promise<ChangelogPage> =>
        fetchClient("changelog", {
            queryParams: {
                ...queryParams,
                cursor: pageParam
            }
        }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: ChangelogPage) => {
        return lastPage.nextCursor || undefined
    }
})

export const changelogQuery = (slug: string) => queryOptions<ChangelogDetailed>({
    queryKey: ['changelog', slug],
    queryFn: () => fetchClient(`changelog/${slug}`),
    retry: false,
})

export const changelogLabelsQuery = queryOptions<ChangelogLabelSummary[]>({
    queryKey: ['changelog', 'labels'],
    queryFn: () => fetchClient(`changelog/labels`)
})

type ChangelogFeedback = {
    id: string;
    title: string;
    status: FeedbackStatus;
    board: { slug: string };
    votes: number;
}

export const changelogFeedbacksQuery = queryOptions<ChangelogFeedback[]>({
    queryKey: ['changelog', 'feedbacks', 'resolved'],
    queryFn: () => fetchClient(`changelog/feedbacks/resolved`)
})

export type ChangelogPublic = Changelog & { likes: number, likedByMe: boolean };

export type ChangelogsPublicQueryData = {
    changelogs: ChangelogPublic[];
    isSubscribed: boolean;
}

export const changelogPublicQuery = queryOptions<ChangelogsPublicQueryData>({
    queryKey: ['changelog', 'public'],
    queryFn: () => fetchClient(`changelog/public`)
})

export const changelogPublicBySlugQuery = (slug: string) => queryOptions<ChangelogPublic>({
    queryKey: ['changelog', 'public', slug],
    queryFn: () => fetchClient(`changelog/public/${slug}`),
    throwOnError: true,
    retry: false,
})