import { Avatar } from "@/components";
import { Dropdown } from "@/components/dropdown";
import { Icons } from "@/components/icons";
import { fetchClient } from "@/lib/client";
import { cn, FeedbackStatusConfig } from "@/lib/utils";
import { feedbackQuery, FeedbackQueryData, feedbacksQuery, membersQuery } from "@/routes/__root";
import { Route as FeedbackRoute } from "@/routes/admin/feedback";
import { Route } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug";
import { useAuthStore } from "@/stores/auth-store";
import { FeedbackStatus, FeedbackSummary } from "@repo/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearch } from "@tanstack/react-router";

type FeedbackUpdateData = {
    boardId?: string;
    status?: FeedbackStatus;
    ownerId?: string | null;
}

export function Details() {
    const queryClient = useQueryClient();
    const search = useSearch({ from: FeedbackRoute.fullPath });
    const router = useRouter()
    const { boardSlug, feedbackSlug } = useParams({
        from: Route.fullPath,
    })

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: FeedbackUpdateData) => fetchClient(`admin/feedback/${boardSlug}/${feedbackSlug}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        onMutate: (data) => {
            queryClient.cancelQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug) });
            queryClient.cancelQueries({ queryKey: feedbacksQuery(search).queryKey });

            const previousFeedback = queryClient.getQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey)
            const previousFeedbacks = queryClient.getQueryData(feedbacksQuery(search).queryKey)

            queryClient.setQueryData(
                feedbackQuery(boardSlug, feedbackSlug).queryKey,
                (old: FeedbackQueryData | undefined) => {
                    if (!old) return undefined;
                    return {
                        ...old,
                        ...data
                    }
                }
            )

            queryClient.setQueryData(
                feedbacksQuery(search).queryKey,
                (old: FeedbackSummary[] | undefined) => {
                    if (!old) return undefined;
                    return old.map(feedback => feedback.id === feedbackSlug ? { ...feedback, ...data } : feedback);
                }
            )

            return { previousFeedback, previousFeedbacks };
        },
        onError: (_, __, context) => {
            if (context?.previousFeedback) {
                queryClient.setQueryData(
                    feedbackQuery(boardSlug, feedbackSlug).queryKey,
                    context.previousFeedback,
                )
            }
            if (context?.previousFeedbacks) {
                queryClient.setQueryData(
                    feedbacksQuery(search).queryKey,
                    context.previousFeedbacks,
                )
            }
        },
        onSettled: (data) => {
            queryClient.invalidateQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });
            queryClient.invalidateQueries({ queryKey: feedbacksQuery(search).queryKey });
            router.navigate({ to: '/admin/feedback/$boardSlug/$feedbackSlug', params: { boardSlug: data.board.slug, feedbackSlug: data.slug }, search, replace: true });
        }
    })
    return (
        <div className="grid grid-cols-[auto_1fr] gap-1 max-w-full">
            <h1 className="text-sm font-medium col-span-full">Details</h1>
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Public link</p>
            <LinkComponent />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Board</p>
            <BoardComponent isPending={isPending} updateData={mutate} />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Status</p>
            <StatusComponent isPending={isPending} updateData={mutate} />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Owner</p>
            <OwnerComponent isPending={isPending} updateData={mutate} />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Estimated</p>
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Category</p>
        </div>
    )
}

const LinkComponent = () => {
    const { boardSlug, feedbackSlug } = useParams({
        from: Route.fullPath,
    })

    return (
        <span className="horizontal gap-1 min-w-0 group relative">
            <a
                href={`${window.location.origin}/${boardSlug}/${feedbackSlug}`}
                className="pl-2 py-1 text-sm font-light underline truncate min-w-0"
            >
                {`${window.location.origin}/${boardSlug}/${feedbackSlug}`}
            </a>
            <button
                className="absolute right-0 top-1/2 -translate-y-1/2 flex-shrink-0 hidden group-hover:flex size-7 m-0 border rounded-md p-1 horizontal center [&>svg]:stroke-gray-400 dark:[&>svg]:stroke-zinc-300 hover:bg-gray-100/50 dark:hover:bg-zinc-700/50 transition-colors duration-150 cursor-pointer"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${boardSlug}/${feedbackSlug}`)}
            >
                <Icons.Copy className="size-4" />
            </button>
            <div className="hidden w-8 flex-shrink-0 group-hover:block h-1" />
        </span>
    )
}

const BoardComponent = ({ isPending, updateData }: { isPending: boolean, updateData: (data: FeedbackUpdateData) => void }) => {
    const { application } = useAuthStore();
    const { boardSlug } = useParams({
        from: Route.fullPath,
    })

    if (!application?.boards) return null;

    const board = application.boards.find(board => board.slug === boardSlug);

    return (
        <Dropdown
            wrapperClassName="max-w-fit"
            disabled={isPending}
            trigger={
                <div className={cn("text-sm font-light rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer gap-1",
                    "horizontal center-v min-w-0 group relative px-2 py-1"
                )}>
                    <span className="truncate min-w-0">{board?.name}</span>
                    <Icons.ChevronDown className="size-3" />
                </div>
            }
            items={application.boards.map(board => ({
                label: board.name,
                onClick: () => updateData({ boardId: board.id })
            }))}
        />
    )
}

const StatusComponent = ({ isPending, updateData }: { isPending: boolean, updateData: (data: FeedbackUpdateData) => void }) => {
    const { boardSlug, feedbackSlug } = useParams({
        from: Route.fullPath,
    })
    const { data: feedback } = useQuery(feedbackQuery(boardSlug, feedbackSlug));

    if (!feedback) return null;

    const status = FeedbackStatusConfig[feedback.status];

    return (
        <Dropdown
            wrapperClassName="max-w-fit"
            disabled={isPending}
            trigger={
                <div className={cn("text-sm font-light rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer gap-1",
                    "horizontal center-v min-w-0 group relative px-2 py-1"
                )}>
                    <span className="truncate">{status.label}</span>
                    <Icons.ChevronDown className="size-3" />
                </div>
            }
            items={Object.entries(FeedbackStatusConfig).map(([key, value]) => ({
                label: value.label,
                className: `text-xs uppercase font-medium ${value.text} ${key === feedback.status ? 'bg-gray-100 dark:bg-zinc-800/20' : ''}`,
                onClick: () => updateData({ status: key as FeedbackStatus })
            }))}
        />
    )
}

const OwnerComponent = ({ isPending, updateData }: { isPending: boolean, updateData: (data: FeedbackUpdateData) => void }) => {
    const { data: users } = useQuery(membersQuery);

    const { boardSlug, feedbackSlug } = useParams({
        from: Route.fullPath,
    })
    const { data: feedback } = useQuery(feedbackQuery(boardSlug, feedbackSlug));

    return (
        <Dropdown
            wrapperClassName="max-w-fit"
            trigger={
                <div className={cn("text-sm font-light rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer gap-1 hover:pr-8",
                    "horizontal center-v min-w-0 group relative px-2 py-1"
                )}>
                    {feedback?.owner && <Avatar
                        src={feedback?.owner?.avatar ?? undefined}
                        name={feedback?.owner?.name ?? 'Unassigned'}
                        className="size-5 text-xs shrink-0"
                    />}
                    <span className="truncate min-w-0">
                        {feedback?.owner?.name ?? 'Unassigned'}
                    </span>
                    <button
                        className="absolute right-0 top-1/2 -translate-y-1/2 flex-shrink-0 hidden group-hover:flex size-7 m-0 border rounded-md p-1 horizontal center [&>svg]:stroke-gray-400 dark:[&>svg]:stroke-zinc-300 hover:bg-gray-100/50 dark:hover:bg-zinc-700/50 transition-colors duration-150 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            updateData({ ownerId: null })
                        }}
                    >
                        <Icons.X className="size-4" />
                    </button>
                </div>
            }
            disabled={isPending || !users}
            items={users?.map(user => ({
                label: user.name,
                onClick: () => updateData({ ownerId: user.id })
            })) ?? []}
        />
    )
}