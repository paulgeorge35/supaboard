import type { Activity, Application, Board, Feedback, FeedbackStatus, User } from '@repo/database'
import { QueryClient, queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useEffect } from 'react'
import { Toaster as Sonner } from 'sonner'
import { AdminButton } from '../components/admin-button'
import { AuthButtons } from '../components/auth-buttons'
import { Icons } from '../components/icons'
import { fetchClient } from '../lib/client'
import { useAuthStore } from '../stores/auth-store'

type MeQueryData = {
  user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
  application: Pick<Application, 'id' | 'name' | 'subdomain' | 'customDomain' | 'domainStatus' | 'logoUrl' | 'iconUrl' | 'color' | 'preferredTheme' | 'preferredLanguage' | 'ownerId'>
}

export const meQuery = queryOptions<MeQueryData>({
  queryKey: ['me'],
  queryFn: () => fetchClient("auth/me")
})

export type FeedbackSummary = Pick<Feedback, 'id' | 'title' | 'status' | 'slug'> & {
  votes: number;
  board: Pick<Board, 'name' | 'slug'>;
  votedByMe: boolean;
}

export type ApplicationBoardsQueryData = (Pick<Board, 'name' | 'slug'> & {
  count: number;
  feedbacks: FeedbackSummary[]
})[]

export const applicationBoardsQuery = queryOptions<ApplicationBoardsQueryData>({
  queryKey: ['application', 'boards'],
  queryFn: () => fetchClient("application/boards")
})

export type BoardQueryData = Pick<Board, 'id' | 'name' | 'slug'> & {
  feedbacks: (Pick<Feedback, 'id' | 'title' | 'description' | 'status' | 'slug'> & {
    votes: number;
    activities: number;
    votedByMe: boolean;
  })[]
}
export const boardQuery = (slug: string) => queryOptions<BoardQueryData>({
  queryKey: ['board', slug],
  queryFn: () => fetchClient(`board/${slug}`)
})


export type FeedbackQueryData = Pick<Feedback, 'id' | 'title' | 'description' | 'status' | 'slug' | 'createdAt'> & {
  votes: number;
  votedByMe: boolean;
  author: Pick<User, 'id' | 'name' | 'avatar'> & {
    isAdmin: boolean;
  };
}

export const feedbackQuery = (boardSlug: string, feedbackSlug: string) => queryOptions<FeedbackQueryData>({
  queryKey: ['feedback', boardSlug, feedbackSlug],
  queryFn: () => fetchClient(`feedback/${boardSlug}/${feedbackSlug}`)
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

export const Route = createRootRoute({
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
    const { data: boards } = useSuspenseQuery(applicationBoardsQuery)
    const { setUser, setApplication } = useAuthStore()

    useEffect(() => {
      setUser(data?.user)
      setApplication(data?.application)
    }, [data?.user, data?.application, setUser, setApplication])

    return <RootComponent
      user={data?.user}
      application={data?.application}
      boards={boards}
      isAdmin={data?.user?.id === data?.application.ownerId}
    />
  },
})

type RootComponentProps = {
  user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
  application: Pick<Application, 'id' | 'name' | 'subdomain' | 'customDomain' | 'domainStatus' | 'logoUrl' | 'iconUrl' | 'color' | 'preferredTheme' | 'preferredLanguage' | 'ownerId'>
  boards: ApplicationBoardsQueryData
  isAdmin: boolean
}

function RootComponent({ user, application, boards, isAdmin }: RootComponentProps) {
  useEffect(() => {
    const theme = application.preferredTheme.toLowerCase()
    if (theme === 'system') {
      localStorage.removeItem('currentTheme')
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      localStorage.currentTheme = theme
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [application.preferredTheme])

  useEffect(() => {
    if (application.iconUrl) {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = application.iconUrl
      document.head.appendChild(link)
    }
    document.title = `${application.name} Feedback`
  }, [application.iconUrl, application.name])

  const defaultBoard = boards[0]?.slug ?? '/';

  return (
    <>
      <div className="vertical justify-end gap-2 text-lg max-w-4xl mx-auto w-full pt-4">
        <div className='horizontal center-v gap-2 justify-between'>
          <span className='horizontal gap-2 center-v'>
            {application.logoUrl && <img src={application.logoUrl} alt={application.name} className='size-8' />}
            <h1 className='text-2xl font-medium'>{application.name}</h1>
          </span>
          <span className='horizontal gap-2 center-v'>
            <AdminButton isAdmin={isAdmin} />
            <AuthButtons user={user} />
          </span>
        </div>
        <div className="horizontal items-end gap-2 text-lg max-w-4xl mx-auto w-full">
          <Link
            to="/"
            activeProps={{
              className: '!border-gray-500 !text-black [&>svg]:!stroke-black',
            }}
            className='-mb-[1px] border-b-[1px] border-transparent font-medium text-gray-400 px-3 py-2 text-sm horizontal center-v gap-2 [&>svg]:stroke-gray-400'
            activeOptions={{ exact: true }}
          >
            <Icons.Map className='size-4' />
            Roadmap
          </Link>
          <Link
            to={defaultBoard}
            activeProps={{
              className: '!border-gray-500 !text-black [&>svg]:!stroke-black',
            }}
            disabled={defaultBoard === '/'}
            className='-mb-[1px] border-b-[1px] border-transparent font-medium text-gray-400 px-3 py-2 text-sm horizontal center-v gap-2 [&>svg]:stroke-gray-400'
          >
            <Icons.Lightbulb className='size-4' />
            Feedback
          </Link>
        </div>
      </div>
      <hr />
      <div className="vertical gap-4 max-w-4xl mx-auto w-full py-8">
        <Outlet />
      </div>
      <Sonner />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}
