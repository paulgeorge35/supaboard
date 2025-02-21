import {
  Activities,
  Avatar,
  DeleteFeedbackButton,
  EditFeedbackButton,
  EditHistory,
  NotFoundPage,
  StatusBadge,
  VoteButton,
  VoteButtonSkeleton
} from '@/components'
import { ImageFile } from '@/components/image-file'
import { FeedbackChangelog, FeedbackInfo } from '@/components/public/feedback'
import { Skeleton } from '@/components/skeleton'
import { fetchClient } from '@/lib/client'
import {
  feedbackActivitiesQuery,
  feedbackQuery,
  FeedbackQueryData,
  feedbackVotersQuery,
  FeedbackVotersQueryData,
} from '@/lib/query/feedback'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import {
  createFileRoute,
  useParams
} from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_public/$boardSlug/$feedbackSlug/')({
  notFoundComponent: () => <NotFoundPage />,
  component: RouteComponent,
})

function FeedbackSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
      <div className="vertical gap-2 hidden md:block">
        <div className="grid grid-cols-[auto_1fr] gap-2 p-4 border rounded-lg">
          <h1 className="text-xs font-bold uppercase text-gray-500 col-span-full">
            Voters
          </h1>
          <div className="col-span-full vertical gap-2">
            {[1, 2, 3].map((i) => (
              <span key={i} className="horizontal gap-2 center-v">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="vertical grid grid-cols-[auto_1fr] gap-8">
        <span className="horizontal center-v gap-4 grid col-span-full grid-cols-subgrid">
          <VoteButtonSkeleton />
          <span className="vertical justify-between gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-6 w-24" />
          </span>
        </span>
        <span className="horizontal center-v gap-4 grid col-span-full grid-cols-subgrid">
          <Skeleton className="size-6 rounded-full" />
          <div className="vertical gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </span>
      </div>
    </div>
  )
}

function RouteComponent() {
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const queryClient = useQueryClient()
  const { user, application } = useAuthStore()
  const { boardSlug, feedbackSlug } = useParams({
    from: '/_public/$boardSlug/$feedbackSlug/',
  })

  const { data: feedbackVoters, isLoading: isFeedbackVotersLoading } = useQuery(
    feedbackVotersQuery(boardSlug, feedbackSlug),
  )
  const { data: feedback, isLoading: isFeedbackLoading } = useQuery(
    feedbackQuery(boardSlug, feedbackSlug),
  )
  const { data, isLoading: isActivitiesLoading } = useQuery(
    feedbackActivitiesQuery(boardSlug, feedbackSlug, sort),
  )

  const { mutate: vote, isPending } = useMutation({
    mutationFn: () =>
      fetchClient(`feedback/${feedback?.id}/vote`, { method: 'POST' }),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey,
      })
      await queryClient.cancelQueries({
        queryKey: feedbackVotersQuery(boardSlug, feedbackSlug).queryKey,
      })

      const previousFeedback = queryClient.getQueryData(
        feedbackQuery(boardSlug, feedbackSlug).queryKey,
      )
      const previousFeedbackVoters = queryClient.getQueryData(
        feedbackVotersQuery(boardSlug, feedbackSlug).queryKey,
      )

      queryClient.setQueryData(
        feedbackQuery(boardSlug, feedbackSlug).queryKey,
        (old: FeedbackQueryData | undefined) => {
          if (!old) return undefined

          return {
            ...old,
            votes: old.votedByMe ? old.votes - 1 : old.votes + 1,
            votedByMe: !old.votedByMe,
          }
        },
      )

      queryClient.setQueryData(
        feedbackVotersQuery(boardSlug, feedbackSlug).queryKey,
        (old: FeedbackVotersQueryData | undefined) => {
          if (!old) return []

          if (old.some((voter) => voter.id === user?.id)) {
            return old.filter((voter) => voter.id !== user?.id)
          }

          if (!user) return old

          return [
            ...old,
            {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              isAdmin: application?.ownerId === user.id,
            },
          ]
        },
      )

      return { previousFeedback, previousFeedbackVoters }
    },
    onError: (_, __, context) => {
      if (context?.previousFeedback) {
        queryClient.setQueryData(
          feedbackQuery(boardSlug, feedbackSlug).queryKey,
          context.previousFeedback,
        )
      }

      if (context?.previousFeedbackVoters) {
        queryClient.setQueryData(
          feedbackVotersQuery(boardSlug, feedbackSlug).queryKey,
          context.previousFeedbackVoters,
        )
      }

      toast.error('Failed to vote')
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: feedbackVotersQuery(boardSlug, feedbackSlug).queryKey,
      })
    },
  })

  if (isFeedbackLoading || isFeedbackVotersLoading || isActivitiesLoading) {
    return <FeedbackSkeleton />
  }

  if (!feedback || !feedbackVoters || !data) {
    return <NotFoundPage />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
      <div className="vertical gap-4">
        <FeedbackChangelog feedback={feedback} />
        <FeedbackInfo feedback={feedback} feedbackVoters={feedbackVoters} boardSlug={boardSlug} feedbackSlug={feedbackSlug} />
      </div>
      <div className="vertical grid grid-cols-[auto_1fr] gap-8">
        <span className="horizontal center-v gap-4 grid col-span-full grid-cols-subgrid">
          <VoteButton
            votes={feedback.votes}
            votedByMe={feedback.votedByMe}
            vote={vote}
            isPending={isPending}
          />
          <span className="vertical justify-between">
            <h1 className="font-medium text-lg">{feedback.title}</h1>
            {feedback.status !== 'OPEN' && <StatusBadge status={feedback.status} />}
          </span>
        </span>

        <span className="horizontal center-v gap-4 grid col-span-full grid-cols-subgrid">
          <span className="horizontal justify-end">
            <Avatar
              src={feedback.author.avatar ?? undefined}
              name={feedback.author.name}
              className="size-6"
              isAdmin={feedback.author.isAdmin}
            />
          </span>
          <p
            className={cn(
              'text-sm font-medium',
              feedback.author.isAdmin && 'text-[var(--color-primary)]',
            )}
          >
            {feedback.author.name}
          </p>
          <p className="text-sm hyphens-auto font-light col-start-2">
            {feedback.description}
          </p>
          {feedback.files.length > 0 && <div className="col-start-2 horizontal flex-wrap gap-2">
            {feedback.files.map(file => <ImageFile key={file} fileKey={file} />)}
          </div>}
          <span className="flex flex-col md:flex-row gap-2 col-start-2">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {DateTime.fromJSDate(new Date(feedback.createdAt)).diffNow().as('hours') > -24
                ? DateTime.fromJSDate(new Date(feedback.createdAt)).toRelative()
                : DateTime.fromJSDate(new Date(feedback.createdAt)).toFormat('MMMM dd, yyyy, HH:mm')
              }
            </p>
            <span className="horizontal center-v gap-2">
              <EditFeedbackButton
                isEditable={feedback.isEditable}
                boardSlug={boardSlug}
                feedbackSlug={feedbackSlug}
              />
              {feedback.isDeletable && (
                <DeleteFeedbackButton
                  boardSlug={boardSlug}
                  feedbackSlug={feedbackSlug}
                />
              )}
              <EditHistory
                boardSlug={boardSlug}
                feedbackSlug={feedbackSlug}
                edited={feedback.edited}
              />
            </span>
          </span>
        </span>

        <Activities
          pinned={data?.pinned}
          activities={data?.activities ?? []}
          sort={sort}
          setSort={setSort}
          feedbackSlug={feedbackSlug}
          boardSlug={boardSlug}
        />
      </div>
    </div>
  )
}
