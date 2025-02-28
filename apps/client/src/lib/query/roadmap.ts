import { Board, Feedback, FeedbackCategory, RoadmapDetail, RoadmapSummary, User } from "@repo/database";
import { queryOptions } from "@tanstack/react-query";
import { fetchClient } from "../client";
import { Status } from "./status";

export const roadmapsQuery = queryOptions<RoadmapSummary[]>({
    queryKey: ['roadmaps'],
    queryFn: () => fetchClient('/roadmap'),
})

export const archivedRoadmapsQuery = queryOptions<RoadmapSummary[]>({
    queryKey: ['archived-roadmaps'],
    queryFn: () => fetchClient('/roadmap', { queryParams: { isArchived: true } }),
})

export type RoadmapDetailResponse = Omit<RoadmapDetail, 'items'> & {
    items: (Pick<Feedback, 'id' | 'title' | 'slug' | 'estimatedDelivery'> & {
        status: Status,
        votes: number;
        tags: string[];
        impact: number;
        effort: number;
        score: number;
        owner: Pick<User, 'id' | 'name' | 'avatar'> | null;
        category: Pick<FeedbackCategory, 'name' | 'slug'> | null;
        board: Pick<Board, 'name' | 'slug'>;
    })[];
};

export const roadmapQuery = (roadmapSlug: string) => queryOptions<RoadmapDetailResponse>({
    queryKey: ['roadmap', roadmapSlug],
    queryFn: () => fetchClient(`/roadmap/${roadmapSlug}`),
})