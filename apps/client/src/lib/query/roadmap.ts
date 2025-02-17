import { Board, Feedback, FeedbackCategory, RoadmapDetail, RoadmapSummary, User } from "@repo/database";
import { queryOptions } from "@tanstack/react-query";
import { fetchClient } from "../client";

export const roadmapsQuery = queryOptions<RoadmapSummary[]>({
    queryKey: ['roadmaps'],
    queryFn: () => fetchClient('/roadmap'),
})

export type RoadmapDetailResponse = Omit<RoadmapDetail, 'items'> & {
    items: (Pick<Feedback, 'id' | 'title' | 'slug' | 'status' | 'estimatedDelivery'> & {
        votes: number;
        tags: string[];
        impact: number;
        effort: number;
        owner: Pick<User, 'id' | 'name' | 'avatar'> | null;
        category: Pick<FeedbackCategory, 'name' | 'slug'> | null;
        board: Pick<Board, 'name' | 'slug'>;
    })[];
};

export const roadmapQuery = (roadmapSlug: string) => queryOptions<RoadmapDetailResponse>({
    queryKey: ['roadmap', roadmapSlug],
    queryFn: () => fetchClient(`/roadmap/${roadmapSlug}`),
})