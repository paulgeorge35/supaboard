import { NotFoundPage, VoteButton } from '@/components'
import { AdminComment } from '@/components/admin/admin-comment'
import { Details } from '@/components/admin/feedback/controls/details'
import { Roadmaps } from '@/components/admin/feedback/controls/roadmaps'
import { Tags } from '@/components/admin/feedback/controls/tags'
import { Voters } from '@/components/admin/feedback/controls/voters'
import { MergeButton } from '@/components/admin/feedback/merge-button'
import { Skeleton } from '@/components/skeleton'
import { fetchClient } from '@/lib/client'
import {
    feedbackQuery,
    FeedbackQueryData,
    feedbackVotersQuery,
    FeedbackVotersQueryData,
} from '@/lib/query/feedback'
import { useAuthStore } from '@/stores/auth-store'
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    createFileRoute,
    notFound,
    Outlet,
    useParams
} from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute(
    '/admin/feedback/$boardSlug/$feedbackSlug',
)({
    component: RouteComponent,
    notFoundComponent: () => <NotFoundPage title='Feedback not found' description='The feedback you are looking for does not exist.' showRedirect={false} />,
    context: () => {
        const queryClient = new QueryClient()
        return {
            queryClient,
        }
    },
    loader: async ({ context, params }) => {
        const feedback = await context.queryClient.fetchQuery(feedbackQuery(params.boardSlug, params.feedbackSlug))
        if (!feedback) {
            throw notFound()
        }
    },
})

function RouteComponent() {
    const { boardSlug, feedbackSlug } = useParams({
        from: Route.fullPath,
    })
    const { data: feedback, isLoading } = useQuery(
        feedbackQuery(boardSlug, feedbackSlug),
    )
    const queryClient = useQueryClient()
    const { application, user } = useAuthStore()

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

    return (
        <div className="md:border-4 border-zinc-300 dark:border-zinc-800 rounded-2xl max-h-full h-full min-w-[100dvw] lg:min-w-0">
            <span className="horizontal gap-2 center-v p-4 border-b h-20">
                <VoteButton
                    votes={feedback?.votes ?? 0}
                    votedByMe={feedback?.votedByMe ?? false}
                    vote={vote}
                    isPending={isPending}
                    isLoading={isLoading}
                />
                {isLoading ? (
                    <Skeleton className="h-7 w-48" />
                ) : (
                    <h1 className="text-lg font-medium">{feedback?.title}</h1>
                )}
                <MergeButton feedback={feedback} boardSlug={boardSlug} className="ml-auto" />
            </span>
            <div className="grid grid-cols-[minmax(400px,1fr)_minmax(250px,310px)] h-[calc(100%-80px)] overflow-x-scroll">
                <div className="vertical grow relative overflow-hidden">
                    <div className="h-full overflow-y-auto p-4 vertical items-start">
                        <Outlet />
                    </div>
                    <AdminComment />
                </div>
                <div className="p-4 border-l h-full w-full vertical gap-8 overflow-y-auto">
                    <Details />
                    <Tags feedbackId={feedback?.id ?? ''} tags={feedback?.tags ?? []} isLoading={isLoading} />
                    <Voters />
                    <Roadmaps feedbackId={feedback?.id ?? ''} roadmaps={feedback?.roadmaps ?? []} isLoading={isLoading} />
                </div>
            </div>
        </div>
    )
}
