import { Activity, FeedbackActivity, FeedbackDetail, FeedbackDetailMerged, FeedbackSummary, RoadmapSummary, User } from "@repo/database";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { fetchClient } from "../client";

const feedbackSearchSchema = z.object({
    search: z.string().optional(),
    cursor: z.string().optional(),
    take: z.number().optional(),
    order: z.enum(['newest', 'oldest']).optional(),
    boards: z.array(z.string()).optional(),
    status: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    uncategorized: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    untagged: z.boolean().optional(),
    owner: z.string().optional(),
    unassigned: z.boolean().optional(),
    start: z.string().optional(),
    end: z.string().optional()
})

export type FeedbackSearch = z.infer<typeof feedbackSearchSchema>

export interface FeedbackPage {
    feedbacks: FeedbackSummary[];
    nextCursor?: string | undefined;
}

export const feedbacksQuery = (queryParams?: FeedbackSearch) => queryOptions<FeedbackPage>({
    queryKey: ['feedback', queryParams],
    queryFn: () => fetchClient("feedback", {
        queryParams
    })
})

export const feedbacksInfiniteQuery = (queryParams?: FeedbackSearch) => ({
    queryKey: ['feedback', queryParams],
    queryFn: ({ pageParam }: { pageParam: string | undefined }): Promise<FeedbackPage> =>
        fetchClient("feedback", {
            queryParams: {
                ...queryParams,
                cursor: pageParam,
            },
        }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: FeedbackPage) => {
        return lastPage.nextCursor || undefined
    }
});

export type FeedbackQueryData = Omit<FeedbackDetail, '_count' | 'votes' | 'changelog' | 'files'> & {
    votes: number;
    votedByMe: boolean;
    isDeletable: boolean;
    isEditable: boolean;
    author: FeedbackDetail['author'] & {
        isAdmin: boolean;
    };
    roadmaps: RoadmapSummary[];
    changelogSlug?: string;
    files: string[];
}

export const feedbackQuery = (boardSlug: string, feedbackSlug: string) => queryOptions<FeedbackQueryData>({
    queryKey: ['feedback', boardSlug, feedbackSlug],
    queryFn: () => fetchClient(`feedback/${boardSlug}/${feedbackSlug}`),
    retry: false,
})

export interface ActivityCommentData {
    content: string;
    mention?: string;
    from?: string;
    to?: string;
}

export interface ActivityStatusChangeData {
    from: string;
    to: string;
    content?: string;
    mention?: string;
}

export interface ActivityMergeData {
    from: string;
    to?: string;
    content?: string;
    mention?: string;
}

type FeedbackActivitySummaryCore = Omit<FeedbackActivity, '_count' | 'files' | 'likes' | 'replies'> & {
    likes: number;
    likedByMe: boolean;
    files: string[];
    author: FeedbackActivity['author'] & {
        isAdmin: boolean;
    };
}

export type FeedbackActivitySummary = FeedbackActivitySummaryCore & {
    data: ActivityCommentData | ActivityStatusChangeData | ActivityMergeData;
    replies: (FeedbackActivitySummaryCore & {
        data: ActivityCommentData;
    })[];
}

export type FeedbackActivitiesQueryData = {
    pinned?: FeedbackActivitySummary;
    activities: FeedbackActivitySummary[];
}

export const feedbackActivitiesQuery = (boardSlug: string, feedbackSlug: string, sort: 'newest' | 'oldest' = 'newest') => queryOptions<FeedbackActivitiesQueryData>({
    queryKey: ['feedback', 'activities', boardSlug, feedbackSlug, sort],
    queryFn: () => fetchClient(`feedback/${boardSlug}/${feedbackSlug}/activities?sort=${sort}`)
})


export type FeedbackEditActivity = Activity & {
    from: {
        title: string;
        description: string;
    };
    to: {
        title: string;
        description: string;
    };
}

export type FeedbackEditHistoryQueryData = FeedbackEditActivity[];

export const feedbackEditHistoryQuery = (boardSlug: string, feedbackSlug: string) => queryOptions<FeedbackEditHistoryQueryData>({
    queryKey: ['feedback', 'edit-history', boardSlug, feedbackSlug],
    queryFn: () => fetchClient(`feedback/${boardSlug}/${feedbackSlug}/edit-history`)
})

export type FeedbackVotersQueryData = (Pick<User, 'id' | 'name' | 'avatar'> & {
    isAdmin: boolean;
})[]

export const feedbackVotersQuery = (boardSlug: string, feedbackSlug: string) => queryOptions<FeedbackVotersQueryData>({
    queryKey: ['feedback', 'voters', boardSlug, feedbackSlug],
    queryFn: () => fetchClient(`feedback/${boardSlug}/${feedbackSlug}/voters`)
})

export type FeedbackMergeQueryData = Omit<FeedbackSummary, '_count'> & {
    votes: number;
    activities: number;
}

export const feedbacksMergeQuery = (boardSlug?: string, feedbackSlug?: string) => queryOptions<FeedbackMergeQueryData[]>({
    queryKey: ['feedback', 'merge', boardSlug, feedbackSlug],
    queryFn: () => fetchClient(`admin/feedback/${boardSlug}/${feedbackSlug}/merge`),
    enabled: !!boardSlug && !!feedbackSlug
})

export type FeedbackByIdQueryData = FeedbackDetailMerged;

export const feedbackByIdQuery = (feedbackId?: string) => queryOptions<FeedbackByIdQueryData>({
    queryKey: ['feedback', feedbackId],
    queryFn: () => fetchClient(`feedback/${feedbackId}`),
    enabled: !!feedbackId
})