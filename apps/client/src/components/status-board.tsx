import { fetchClient } from "@/lib/client";
import { applicationBoardsQuery, ApplicationBoardsQueryData, FeedbackDetailed } from "@/lib/query/application";
import { FeedbackStatusConfig } from "@/lib/utils";
import type { FeedbackStatus } from "@repo/database";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dot } from "./dot";
import { Icons } from "./icons";
import { VoteButton } from "./vote-button";

interface StatusBoardProps {
    status: FeedbackStatus;
    items: FeedbackDetailed[]
    admin?: boolean
}
export const StatusBoard = ({ status, items, admin }: StatusBoardProps) => {
    const { label } = FeedbackStatusConfig[status];
    const queryClient = useQueryClient();

    const { mutate: vote, isPending } = useMutation({
        mutationFn: (id: string) => fetchClient(`feedback/${id}/vote`, { method: "POST" }),
        onMutate: async (id: string) => {
            // Cancel any outgoing refetches
            queryClient.cancelQueries({ queryKey: applicationBoardsQuery.queryKey });

            // Snapshot previous values
            const previousBoards = queryClient.getQueryData(applicationBoardsQuery.queryKey)

            // Update applicationBoardsQuery
            queryClient.setQueryData(applicationBoardsQuery.queryKey, (old: ApplicationBoardsQueryData | undefined) => {
                if (!old) return undefined;

                return old.map(board => ({
                    ...board,
                    feedbacks: board.feedbacks.map(feedback =>
                        feedback.id === id
                            ? {
                                ...feedback,
                                votes: feedback.votedByMe ? feedback.votes - 1 : feedback.votes + 1,
                                votedByMe: !feedback.votedByMe
                            }
                            : feedback
                    )
                }))
            })

            return {
                previousBoards,
            }
        },
        onError: (_, __, context) => {
            // Roll back applicationBoardsQuery
            if (context?.previousBoards) {
                queryClient.setQueryData(applicationBoardsQuery.queryKey, context.previousBoards)
            }

            toast.error("Failed to vote")
        },
        onSettled: () => {
            // Invalidate both queries to ensure consistency
            queryClient.invalidateQueries({ queryKey: applicationBoardsQuery.queryKey })
        }
    })

    return (
        <div className='w-full border rounded-lg max-h-[400px] md:h-[400px] vertical'>
            <div className='w-full h-[50px] border-b bg-gray-50 dark:bg-zinc-800/20 rounded-t-lg horizontal center-v px-4 shrink-0'>
                <span className='text-sm font-medium horizontal center-v gap-2'><Dot status={status} />{label}</span>
            </div>
            <div className='flex-1 w-full p-4 vertical gap-4 overflow-y-auto'>
                {items.length === 0 && (
                    <div className='w-full h-full vertical center gap-2'>
                        <Icons.TicketX className='size-12 rounded-full p-3 bg-[var(--color-primary)]/10 stroke-[var(--color-primary)]' />
                        <p className='text-sm font-light text-gray-500 w-2/3 text-center text-balance'>No feedback reached this status yet</p>
                    </div>
                )}
                {items.map((item, index) => {
                    const to = admin ? `/admin/feedback/${item.board.slug}/${item.slug}` : `/${item.board.slug}/${item.slug}`
                    return (
                        <div key={`${item.board.slug}-${item.slug}`} className='w-full grid grid-cols-[auto_1fr] gap-4 text-sm horizontal items-start'>
                            <VoteButton votes={item.votes} votedByMe={item.votedByMe} vote={() => vote(item.id)} isPending={isPending} />
                            <Link to={to} className="vertical gap-1 group cursor-pointer">
                                <p className='font-medium group-hover:text-[var(--color-primary)] transition-colors duration-200'>{item.title}</p>
                                <p className='text-xs font-medium uppercase text-gray-500'>{item.board.name}</p>
                            </Link>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}