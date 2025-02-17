import { Application, ApplicationInviteSummary, BoardFeedbackSummary, FeedbackDetailed, MemberSummary } from "@repo/database";
import { queryOptions } from "@tanstack/react-query";
import { fetchClient } from "../client";

export type ApplicationBoardsQueryData = (Pick<BoardFeedbackSummary, 'id' | 'name' | 'slug' | 'showOnHome'> & {
    count: number;
    feedbacks: FeedbackDetailed[];
})[]

export { type BoardFeedbackSummary, type FeedbackDetailed } from '@repo/database';

export const applicationBoardsQuery = queryOptions<ApplicationBoardsQueryData>({
    queryKey: ['application', 'boards'],
    queryFn: () => fetchClient("application/boards")
})


export const membersQuery = queryOptions<MemberSummary[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => fetchClient("admin/users")
})

export const memberQuery = (userId: string) => queryOptions<MemberSummary>({
    queryKey: ['admin', 'users', 'details', userId],
    queryFn: () => fetchClient(`admin/users/details/${userId}`)
})

export const applicationQuery = queryOptions<Application>({
    queryKey: ['application'],
    queryFn: () => fetchClient('application'),
})

export const applicationInvitesQuery = queryOptions<ApplicationInviteSummary[]>({
    queryKey: ['admin', 'invites'],
    queryFn: () => fetchClient("admin/users/invites")
})