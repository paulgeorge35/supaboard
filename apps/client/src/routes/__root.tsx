import { NotFoundPage } from '@/components'
import { fetchClient } from '@/lib/client'
import { useAuthStore } from '@/stores/auth-store'
import { ApplicationSummary, BoardSummary, FeedbackCategory, FeedbackSummary, Tag, UserSummary, type Activity, type Board, type Feedback, type FeedbackStatus, type User } from '@repo/database'
import { QueryClient, queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useEffect } from 'react'
import { FeedbackSearch } from './admin/feedback'

type MeQueryData = {
  user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
  application: ApplicationSummary & {
    boards: BoardSummary[]
  }
}

export const meQuery = queryOptions<MeQueryData>({
  queryKey: ['me'],
  queryFn: () => fetchClient("auth/me")
})

export type BoardFeedbackSummary = Pick<Feedback, 'id' | 'title' | 'status' | 'slug'> & {
  votes: number;
  board: Pick<Board, 'name' | 'slug'>;
  votedByMe: boolean;
}

export type ApplicationBoardsQueryData = (Pick<Board, 'name' | 'slug'> & {
  count: number;
  feedbacks: BoardFeedbackSummary[]
})[]

export const applicationBoardsQuery = queryOptions<ApplicationBoardsQueryData>({
  queryKey: ['application', 'boards'],
  queryFn: () => fetchClient("application/boards")
})

export const feedbacksQuery = (queryParams?: FeedbackSearch) => queryOptions<FeedbackSummary[]>({
  queryKey: ['feedback', queryParams],
  queryFn: () => fetchClient("feedback", {
    queryParams
  })
})

export type BoardQueryData = Pick<Board, 'id' | 'name' | 'slug'> & {
  feedbacks: (Pick<Feedback, 'id' | 'title' | 'description' | 'status' | 'slug'> & {
    votes: number;
    activities: number;
    votedByMe: boolean;
  })[]
}
export const boardQuery = (slug?: string, search?: string, sort: 'newest' | 'oldest' = 'newest') => queryOptions<BoardQueryData>({
  queryKey: ['board', slug, search, sort],
  queryFn: () => fetchClient(`board/${slug}?${search ? `search=${search}&` : ''}${sort ? `sort=${sort}` : ''}`),
  enabled: !!slug
})


export type FeedbackQueryData = Pick<Feedback, 'id' | 'title' | 'description' | 'status' | 'slug' | 'createdAt' | 'edited' | 'estimatedDelivery'> & {
  votes: number;
  votedByMe: boolean;
  isDeletable: boolean;
  isEditable: boolean;
  author: Pick<User, 'id' | 'name' | 'avatar'> & {
    isAdmin: boolean;
  };
  owner?: Pick<User, 'id' | 'name' | 'avatar'>;
  category?: Pick<FeedbackCategory, 'name' | 'slug'>;
  tags: Pick<Tag, 'name' | 'color'>[];
}

export const feedbackQuery = (boardSlug: string, feedbackSlug: string) => queryOptions<FeedbackQueryData>({
  queryKey: ['feedback', boardSlug, feedbackSlug],
  queryFn: () => fetchClient(`feedback/${boardSlug}/${feedbackSlug}`)
})

export const tagsQuery = (search?: string) => queryOptions<Pick<Tag, 'name' | 'color'>[]>({
  queryKey: ['tags', search],
  queryFn: () => fetchClient("admin/tags", {
    queryParams: {
      search
    }
  })
})

export type ActivityCommentData = {
  content: string;
}

export type ActivityStatusChangeData = {
  status: FeedbackStatus;
  content?: string;
}

export type FeedbackActivitySummary = Activity & {
  likes: number;
  likedByMe: boolean;
  author: Pick<User, 'id' | 'name' | 'avatar'> & {
    isAdmin: boolean;
  };
  data: ActivityCommentData | ActivityStatusChangeData;
};

export type FeedbackActivitiesQueryData = {
  pinned?: FeedbackActivitySummary;
  activities: FeedbackActivitySummary[];
}

export const feedbackActivitiesQuery = (boardSlug: string, feedbackSlug: string, sort: 'newest' | 'oldest' = 'newest') => queryOptions<FeedbackActivitiesQueryData>({
  queryKey: ['feedback', 'activities', boardSlug, feedbackSlug, sort],
  queryFn: () => fetchClient(`feedback/${boardSlug}/${feedbackSlug}/activities?sort=${sort}`)
})

export type FeedbackVotersQueryData = (Pick<User, 'id' | 'name' | 'avatar'> & {
  isAdmin: boolean;
})[]

export const feedbackVotersQuery = (boardSlug: string, feedbackSlug: string) => queryOptions<FeedbackVotersQueryData>({
  queryKey: ['feedback', 'voters', boardSlug, feedbackSlug],
  queryFn: () => fetchClient(`feedback/${boardSlug}/${feedbackSlug}/voters`)
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

export const membersQuery = queryOptions<UserSummary[]>({
  queryKey: ['admin', 'users'],
  queryFn: () => fetchClient("admin/users")
})

export const Route = createRootRoute({
  notFoundComponent: () => <NotFoundPage redirect="https://supaboard.io" />,
  context: () => {
    const queryClient = new QueryClient()
    return {
      queryClient,
    }
  },
  loader: async ({ context }) => {
    const queryClient = context.queryClient
    return queryClient.ensureQueryData(meQuery)
  },
  component: () => {
    const { data } = useSuspenseQuery(meQuery)
    const { setUser, setApplication } = useAuthStore()

    useEffect(() => {
      setUser(data?.user)
      setApplication(data?.application)
    }, [data?.user, data?.application, setUser, setApplication])

    return <RootComponent />
  },
})

function RootComponent() {
  return (
    <div className='h-[100dvh] max-h-[100dvh]'>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  )
}
