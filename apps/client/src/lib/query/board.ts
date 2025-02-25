import { Board, Feedback, Status } from "@repo/database";
import { queryOptions } from "@tanstack/react-query";
import { fetchClient } from "../client";

export type BoardQueryData = Pick<Board, 'id' | 'name' | 'slug' | 'title' | 'details' | 'detailsRequired' | 'callToAction' | 'buttonText'> & {
    feedbacks: (Pick<Feedback, 'id' | 'title' | 'description' | 'slug'> & {
      votes: number;
      status: Status;
      activities: number;
      votedByMe: boolean;
    })[]
  }

export const boardDetailedQuery = (slug?: string, search?: string, sort: 'newest' | 'oldest' = 'newest') => queryOptions<BoardQueryData>({
    queryKey: ['board', slug, 'detailed', search, sort],
    queryFn: () => fetchClient(`board/${slug}/detailed?${search ? `search=${search}&` : ''}${sort ? `sort=${sort}` : ''}`),
    enabled: !!slug,
    retry: false,
  })


export const boardQuery = (slug?: string) => queryOptions<Board>({
  queryKey: ['board', slug],
  queryFn: () => fetchClient(`board/${slug}`),
  retry: false,
})