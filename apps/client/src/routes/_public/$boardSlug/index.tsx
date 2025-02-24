import {
  FeedbackForm,
  FiltersInput,
  Icons,
  NotFoundPage,
  StatusBadge,
  VoteButton,
} from '@/components'
import { Skeleton } from '@/components/skeleton'
import { fetchClient } from '@/lib/client'
import { applicationBoardsQuery, boardDetailedQuery, BoardQueryData } from '@/lib/query'
import { cn } from '@/lib/utils'
import {
  QueryClient,
  useMutation,
  useQueryClient,
  useSuspenseQuery
} from '@tanstack/react-query'
import {
  createFileRoute,
  getRouteApi,
  Link,
  notFound,
  useParams,
  useRouter,
  useSearch
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

const searchSchema = z.object({
  search: z.string().optional(),
})

export const Route = createFileRoute('/_public/$boardSlug/')({
  validateSearch: searchSchema,
  context: () => {
    const queryClient = new QueryClient()
    return {
      queryClient,
    }
  },
  loaderDeps: ({ search: { search } }) => ({ search }),
  loader: async ({ context, params, deps: { search } }) => {
    const { queryClient } = context;
    const board = await queryClient.fetchQuery(boardDetailedQuery(params.boardSlug, search));
    if (!board) {
      throw notFound();
    }
    return board;
  },
  component: RouteComponent,
  notFoundComponent: () => <NotFoundPage title="Board not found" description="The board you are looking for does not exist." />,
})

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState('');

  const { boardSlug } = useParams({ from: '/_public/$boardSlug/' })
  const search = useSearch({ from: '/_public/$boardSlug/' });

  const router = useRouter();
  const { data: boards, isLoading: isBoardsLoading } = useSuspenseQuery(applicationBoardsQuery)
  const board = getRouteApi('/_public/$boardSlug/').useLoaderData();
  const queryClient = useQueryClient()

  const toBoard = (slug: string) => `/${slug}`

  const { mutate: vote, isPending } = useMutation({
    mutationFn: (feedbackId: string) =>
      fetchClient(`feedback/${feedbackId}/vote`, { method: 'POST' }),
    onMutate: async (feedbackId: string) => {
      const feedback = board?.feedbacks.find((f) => f.id === feedbackId)
      if (!feedback) return

      await queryClient.cancelQueries({
        queryKey: ['board', boardSlug, search],
      })

      const boardQueries = queryClient.getQueriesData<BoardQueryData>({
        queryKey: ['board', boardSlug, search],
      })

      const previousBoardsData = new Map(boardQueries)

      boardQueries.forEach(([queryKey, boardData]) => {
        if (!boardData) return

        queryClient.setQueryData(queryKey, {
          ...boardData,
          feedbacks: boardData.feedbacks.map((feedback) =>
            feedback.id === feedbackId
              ? {
                ...feedback,
                votes: feedback.votedByMe
                  ? feedback.votes - 1
                  : feedback.votes + 1,
                votedByMe: !feedback.votedByMe,
              }
              : feedback,
          ),
        })
      })

      return {
        previousBoardsData,
      }
    },
    onError: (_, __, context) => {
      context?.previousBoardsData?.forEach((data, queryKey) => {
        queryClient.setQueryData(queryKey, data)
      })

      toast.error('Failed to vote')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })

  useEffect(() => {
    if (search) {
      setTimeout(() => {
        router.navigate({
          to: '/$boardSlug',
          params: { boardSlug },
          search: { search: searchQuery !== '' ? searchQuery : undefined },
          replace: true,
        })
      }, 500)
    }
  }, [searchQuery])

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
      <div className="vertical gap-2">
        <h1 className="text-xs font-medium uppercase text-gray-500 px-3">
          Boards
        </h1>
        <div className="vertical gap-2">
          {isBoardsLoading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-lg mx-3" />
              ))}
            </>
          ) : (
            boards.map((board) => (
              <Link
                key={board.slug}
                to={toBoard(board.slug)}
                className="text-sm font-light transition-colors duration-200 text-gray-500 hover:bg-gray-900/5 dark:text-zinc-400 dark:hover:bg-zinc-800/20 rounded-lg px-3 py-2 truncate"
                activeProps={{
                  className:
                    '!text-gray-800 dark:!text-zinc-100 !bg-gray-900/5 dark:!bg-zinc-800/20',
                }}
              >
                {board.name}
              </Link>
            ))
          )}
        </div>
      </div>
      <div className="vertical gap-2">
        <h1 className="font-medium">{board?.callToAction}</h1>
        <div className="vertical">
          <FeedbackForm />

          <div className="border rounded-t-lg horizontal center-v justify-between gap-2 px-4 py-2 bg-gray-50 mt-4 dark:bg-zinc-800/20">
            <FiltersInput onChange={setSearchQuery} />
          </div>
          {board?.feedbacks.map((feedback, index) => (
            <FeedbackCard
              key={feedback.id}
              feedback={feedback}
              index={index}
              board={board}
              vote={vote}
              isPending={isPending}
            />
          ))}
          {board?.feedbacks.length === 0 && (
            <p className="text-sm text-gray-500 p-4 border border-t-0 rounded-b-lg">
              There are no feedbacks yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

type FeedbackCardProps = {
  feedback: BoardQueryData['feedbacks'][number]
  index: number
  board: BoardQueryData
  vote: (feedbackId: string) => void
  isPending: boolean
}

const FeedbackCard = ({ feedback, index, board, vote, isPending }: FeedbackCardProps) => {
  return (
    <Link
      key={feedback.slug}
      to={feedback.slug}
      className={cn(
        'p-4 border border-t-0 grid grid-cols-[1fr_auto] items-start transition-colors duration-200 hover:bg-gray-300/20 dark:hover:bg-zinc-800/20',
        {
          'rounded-b-lg': index === board?.feedbacks.length - 1,
        },
      )}
    >
      <div className="vertical gap-2">
        <h2 className="text-sm font-medium">{feedback.title}</h2>
        <p className="text-sm text-gray-500 line-clamp-2">
          {feedback.description}
        </p>
        <span className="horizontal gap-2 center-v">
          <Icons.MessageSquare size={12} />
          <span className="text-xs text-gray-500">
            {feedback.activities}
          </span>
          {feedback.status !== 'OPEN' && (
            <>
              <span className="text-gray-500 text-xs">&bull;</span>
              <StatusBadge status={feedback.status} />
            </>
          )}
        </span>
      </div>
      <VoteButton
        votes={feedback.votes}
        votedByMe={feedback.votedByMe}
        vote={() => vote(feedback.id)}
        isPending={isPending}
      />
    </Link>
  )
}

const FeedbackCardSkeleton = ({ isLast }: { isLast: boolean }) => {
  return (
    <div
      className={cn(
        'p-4 border border-t-0 grid grid-cols-[1fr_auto] items-start gap-4',
        {
          'rounded-b-lg': isLast,
        },
      )}
    >
      <div className="vertical gap-2 w-full">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-[72px] w-[72px] rounded-lg" />
    </div>
  )
}