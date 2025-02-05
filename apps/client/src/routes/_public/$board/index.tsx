import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute, Link, notFound, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { FeedbackForm } from '../../../components/feedback-form'
import { FiltersInput } from '../../../components/filters-input'
import { Icons } from '../../../components/icons'
import { NotFoundPage } from '../../../components/not-found'
import { StatusBadge } from '../../../components/status-badge'
import { VoteButton } from '../../../components/vote-button'
import { fetchClient } from '../../../lib/client'
import { cn } from '../../../lib/utils'
import { applicationBoardsQuery, boardQuery, BoardQueryData } from '../../__root'

export const Route = createFileRoute('/_public/$board/')({
  component: RouteComponent,
  notFoundComponent: () => <NotFoundPage />,
  loader: async ({ params }) => {
    const { board: boardSlug } = params
    const board = await fetchClient(`board/${boardSlug}`)

    if (!board) {
      throw notFound();
    }

    return {
      board,
    }
  },
})

function RouteComponent() {
  const [search, setSearch] = useState('')
  const { board: boardSlug } = useParams({ from: '/_public/$board/' })
  const { data: boards } = useSuspenseQuery(applicationBoardsQuery)
  const { data: board } = useQuery(boardQuery(boardSlug, search))
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
      <div className="vertical gap-2">
        <h1 className="text-xs font-medium uppercase text-gray-500 px-3">
          Boards
        </h1>
        <div className="vertical gap-2">
          {boards.map((board) => (
            <Link
              key={board.slug}
              to={toBoard(board.slug)}
              className="text-sm font-light transition-colors duration-200 text-gray-500 hover:bg-gray-900/5 dark:text-zinc-400 dark:hover:bg-zinc-800/20 rounded-lg px-3 py-2 truncate"
              activeProps={{ className: '!text-gray-800 dark:!text-zinc-100 !bg-gray-900/5 dark:!bg-zinc-800/20' }}
            >
              {board.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="vertical gap-2">
        <h1 className="font-medium">Give Feedback</h1>
        <div className="vertical">
          <FeedbackForm boardId={board?.id} />

          <div className="border rounded-t-lg horizontal center-v justify-between gap-2 px-4 py-2 bg-gray-50 mt-4 dark:bg-zinc-800/20">
            <FiltersInput onChange={setSearch} />
          </div>
          {board?.feedbacks.map((feedback, index) => (
            <Link
              key={feedback.slug}
              to={feedback.slug}
              className={cn(
                'p-4 border border-t-0 grid grid-cols-[1fr_auto] items-start transition-colors duration-200 hover:bg-gray-900/5',
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
