import { Activity, FeedbackActivity, FeedbackDetail, FeedbackStatus, FeedbackSummary, User } from "@repo/database";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { fetchClient } from "../client";

const feedbackSearchSchema = z.object({
    search: z.string().optional(),
    cursor: z.string().optional(),
    take: z.number().optional(),
    order: z.enum(['newest', 'oldest']).optional(),
    boards: z.array(z.string()).optional(),
    status: z.array(z.enum(['OPEN', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])).optional(),
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

export type FeedbackQueryData = Omit<FeedbackDetail, '_count' | 'votes'> & {
    votes: number;
    votedByMe: boolean;
    isDeletable: boolean;
    isEditable: boolean;
    author: FeedbackDetail['author'] & {
        isAdmin: boolean;
    };
}

export const feedbackQuery = (boardSlug: string, feedbackSlug: string) => queryOptions<FeedbackQueryData>({
    queryKey: ['feedback', boardSlug, feedbackSlug],
    queryFn: () => fetchClient(`feedback/${boardSlug}/${feedbackSlug}`)
})

export interface ActivityCommentData {
    content: string;
}

export interface ActivityStatusChangeData {
    from: FeedbackStatus;
    to: FeedbackStatus;
    content?: string;
}

export type FeedbackActivitySummary = Omit<FeedbackActivity, '_count' | 'files' | 'likes'> & {
    likes: number;
    likedByMe: boolean;
    files: string[];
    author: FeedbackActivity['author'] & {
        isAdmin: boolean;
    };
    data: ActivityCommentData | ActivityStatusChangeData;
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