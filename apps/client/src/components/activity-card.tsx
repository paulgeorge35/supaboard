import { useAdminRoute } from "@/hooks/useAdminRoute";
import { fetchClient } from "@/lib/client";
import { FeedbackActivitiesQueryData, FeedbackActivitySummary, feedbackByIdQuery } from "@/lib/query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useBoolean } from "@paulgeorge35/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { DateTime } from "luxon";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { CommentContent } from "./comment-content";
import { CommentForm } from "./comment-form";
import { Icons } from "./icons";
import { ImageFile } from "./image-file";
import { LikeButton } from "./like-button";
import { ModalComponent } from "./modal-component";
import { PinButton } from "./pin-button";
import { Skeleton } from "./skeleton";
import { StatusBadge } from "./status-badge";

type ActivityCardProps = {
    activity: FeedbackActivitySummary;
    feedbackSlug: string
    boardSlug: string
    className?: string;
}

export function ActivityCard({ activity, feedbackSlug, boardSlug, className }: ActivityCardProps) {
    const { user } = useAuthStore();
    const [threadId, setThreadId] = useState<string | undefined>(undefined);
    const [replyTo, setReplyTo] = useState<string | undefined>(undefined);
    const queryClient = useQueryClient();

    const { mutate: like, isPending: isLikePending } = useMutation({
        mutationFn: async (activityId: string) => await fetchClient(`feedback/${boardSlug}/${feedbackSlug}/like/${activityId}`, {
            method: 'POST',
        }),
        onMutate: (activityId) => {
            queryClient.cancelQueries({ queryKey: ['feedback', 'activities', boardSlug, feedbackSlug] });

            const previousActivities = queryClient.getQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug]);

            queryClient.setQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug], (old) => {
                return {
                    ...old,
                    activities: old?.activities.map(activity => activity.id === activityId ? { ...activity, likedByMe: !activity.likedByMe } : activity) ?? []
                }
            })

            return { previousActivities };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug], context?.previousActivities);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feedback', 'activities', boardSlug, feedbackSlug] });
        }
    })

    const { mutate: pin, isPending: isPinPending } = useMutation({
        mutationFn: async (activityId: string) => await fetchClient(`feedback/${boardSlug}/${feedbackSlug}/pin/${activityId}`, {
            method: 'POST',
        }),
        onMutate: (activityId) => {
            queryClient.cancelQueries({ queryKey: ['feedback', 'activities', boardSlug, feedbackSlug] });

            const previousActivities = queryClient.getQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug]);

            queryClient.setQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug], (old) => {
                return {
                    ...old,
                    activities: old?.activities.map(activity => activity.id === activityId ? { ...activity, pinned: !activity.pinned } : activity) ?? []
                }
            })

            return { previousActivities };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug], context?.previousActivities);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feedback', 'activities', boardSlug, feedbackSlug] });
        }
    })

    const handleReplyOpen = () => {
        if (threadId) {
            setThreadId(undefined);
            setReplyTo(undefined);
            return;
        }
        if (user?.id !== activity.author.id) {
            setReplyTo(activity.author.name);
        }
        setThreadId(activity.threadId ?? activity.id);
    }

    return (
        <span className={cn('gap-2 grid col-span-full grid-cols-subgrid', className)}>
            {/* Activity author avatar */}
            <span className='horizontal justify-end'>
                <Avatar src={activity.author.avatar ?? undefined} name={activity.author.name} className='size-6' isAdmin={activity.author.isAdmin} />
            </span>
            <span className='horizontal items-baseline justify-between'>
                <span className="flex flex-col md:flex-row items-baseline gap-2">
                    {/* Activity author name */}
                    <p className={cn('text-sm font-medium', activity.author.isAdmin && 'text-[var(--color-primary)]')}>{activity.author.name}</p>
                    {/* Activity status change */}
                    {activity.type === 'FEEDBACK_STATUS_CHANGE' && (
                        <span className="horizontal center-v gap-1">
                            <p className="text-sm text-gray-500">marked this as</p>
                            <StatusBadge status={activity.data.to} />
                        </span>
                    )}
                </span>
                {/* Pinned activity marker */}
                {activity.pinned && <p className="text-xs text-[var(--color-primary)] [&>svg]:stroke-[var(--color-primary)] font-medium uppercase horizontal center-v gap-1"><Icons.Pin size={12} /> Pinned</p>}
            </span>

            {/* Merged feedback activity card */}
            <MergedActivityCard activity={activity} />

            {/* Activity text content */}
            <CommentContent content={activity.data.content} className="col-start-2" mention={activity.threadId ? activity.data.mention : undefined} />
            {/* Activity attachments */}
            {activity.files.length > 0 && <div className="col-start-2 horizontal flex-wrap gap-2">
                {activity.files.map(file => <ImageFile key={file} fileKey={file} />)}
            </div>}

            {/* Activity timestamp for mobile */}
            <p className='text-xs text-gray-500 md:hidden col-start-2 center-v gap-1'>
                {
                    DateTime.fromJSDate(new Date(activity.createdAt)).diffNow().as('hours') > -24
                        ? DateTime.fromJSDate(new Date(activity.createdAt)).toRelative()
                        : DateTime.fromJSDate(new Date(activity.createdAt)).toFormat('MMMM dd, yyyy, HH:mm')
                }
            </p>

            <span className='horizontal center-v gap-2 col-start-2'>
                {/* Like button */}
                <LikeButton likes={activity.likes} likedByMe={activity.likedByMe} like={() => like(activity.id)} isPending={isLikePending} />

                {/* Activity timestamp for desktop */}
                <span className='text-xs text-gray-500 dark:text-zinc-400 hidden md:flex horizontal center-v gap-2'>
                    <p className='text-xs text-gray-500 dark:text-zinc-400'>&bull;</p>
                    {
                        DateTime.fromJSDate(new Date(activity.createdAt)).diffNow().as('hours') > -24
                            ? DateTime.fromJSDate(new Date(activity.createdAt)).toRelative()
                            : DateTime.fromJSDate(new Date(activity.createdAt)).toFormat('MMMM dd, yyyy, HH:mm')
                    }
                </span>

                {/* Private activity */}
                {!activity.public && <p className="text-xs text-gray-500 dark:text-zinc-400">&bull; Private</p>}

                {/* Pin button */}
                {activity.public && activity.type !== 'FEEDBACK_MERGE' && <PinButton pinned={activity.pinned} pin={() => pin(activity.id)} isPending={isPinPending} />}

                {/* Unmerge button */}
                <UnmergeButton activity={activity} />

                {user && <>
                    <span className="text-xs text-gray-500">&bull;</span>
                    <button onClick={handleReplyOpen} className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300">
                        Reply
                    </button>
                </>}
            </span>

            <CommentForm
                boardSlug={boardSlug}
                feedbackSlug={feedbackSlug}
                threadId={threadId}
                isReply={true}
                replyTo={replyTo}
                className="col-start-2"
                resetReply={() => {
                    setThreadId(undefined);
                    setReplyTo(undefined);
                }}
            />

            {!activity.threadId && activity.replies?.length > 0 && <div className="col-start-2 vertical gap-2 pt-4">
                {activity.replies.map(reply => <ActivityCard key={reply.id} activity={reply as unknown as FeedbackActivitySummary} feedbackSlug={feedbackSlug} boardSlug={boardSlug} className="grid-cols-[auto_1fr]" />)}
            </div>}
        </span>
    )
}

type MergedActivityCardProps = {
    activity: FeedbackActivitySummary;
}

const MergedActivityCard = ({ activity }: MergedActivityCardProps) => {
    const feedbackId = activity.type === 'FEEDBACK_MERGE' ? activity.data.from : undefined;

    const { data: feedback, isLoading: isFeedbackLoading } = useQuery(feedbackByIdQuery(feedbackId));

    if (!feedbackId) return null;

    if (isFeedbackLoading) return (
        <span className="col-start-2 vertical gap-2">
            <Skeleton className="w-1/2 h-6 rounded-md" />
            <Skeleton className="w-full h-20 rounded-lg" />
        </span>
    )

    if (!feedback) return null;

    return (
        <span className="col-start-2 vertical gap-2">
            <p className="text-sm font-light">Merged in a post: </p>
            <div className="border rounded-lg p-4 grid grid-cols-[auto_1fr] gap-2">
                <h1 className="col-start-2">{feedback.title}</h1>
                <Avatar
                    src={feedback.author.avatar ?? undefined}
                    name={feedback.author.name}
                    className='size-6'
                    isAdmin={feedback.author.isAdmin}
                />
                <p className={cn('text-sm font-medium', feedback.author.isAdmin && 'text-[var(--color-primary)]')}>{feedback.author.name}</p>
                {feedback.description && <p className='text-sm hyphens-auto font-light col-start-2'>{feedback.description}</p>}
                {feedback.files.length > 0 && <div className="col-start-2 horizontal flex-wrap gap-2">
                    {feedback.files.map(file => <ImageFile key={file} fileKey={file} />)}
                </div>
                }
                <span className='text-xs text-gray-500 hidden md:flex horizontal center-v gap-1 col-start-2'>
                    {
                        DateTime.fromJSDate(new Date(feedback.createdAt)).diffNow().as('hours') > -24
                            ? DateTime.fromJSDate(new Date(feedback.createdAt)).toRelative()
                            : DateTime.fromJSDate(new Date(feedback.createdAt)).toFormat('MMMM dd, yyyy, HH:mm')
                    }
                </span>
            </div>
        </span>
    )
}

type UnmergeButtonProps = {
    activity: FeedbackActivitySummary;
}

const UnmergeButton = ({ activity }: UnmergeButtonProps) => {
    const search = useSearch({ strict: false });
    const { user, application } = useAuthStore();
    const isAdminRoute = useAdminRoute();
    const router = useRouter();
    const feedbackId = activity.type === 'FEEDBACK_MERGE' ? activity.data.from : undefined;
    const { data: feedback, isLoading: isFeedbackLoading } = useQuery(feedbackByIdQuery(feedbackId));

    const confimationModal = useBoolean(false);
    const { mutate: unmerge, isPending: isUnmergePending } = useMutation({
        mutationFn: async () => await fetchClient(`admin/feedback/${feedbackId}/unmerge`, {
            method: 'POST',
        }),
        onSuccess: () => {
            toast.success('Feedback unmerged successfully');
            if (isAdminRoute) {
                router.navigate({
                    to: '/admin/feedback/$boardSlug/$feedbackSlug',
                    params: { boardSlug: feedback?.board.slug!, feedbackSlug: feedback?.slug! },
                    search: search as any
                })
            } else {
                router.navigate({
                    to: '/$boardSlug/$feedbackSlug',
                    params: { boardSlug: feedback?.board.slug!, feedbackSlug: feedback?.slug! },
                    search: search as any
                })
            }
        },
        onError: () => {
            toast.error('Failed to unmerge feedback');
        }
    })

    if (user?.id !== application?.ownerId) return null;

    if (!feedbackId) return null;

    return (
        <>
            <ModalComponent isOpen={confimationModal.value} onClose={confimationModal.setFalse}>
                <div className='vertical gap-2'>
                    <h1 className='text-lg font-medium'>Unmerge feedback</h1>
                    <p className='text-sm text-gray-500 dark:text-zinc-400'>
                        Are you sure you want to unmerge this feedback?
                    </p>
                    <div className='horizontal justify-end gap-2'>
                        <Button disabled={isUnmergePending} variant='outline' color='secondary' size='sm' onClick={confimationModal.setFalse}>Cancel</Button>
                        <Button isLoading={isUnmergePending} color='primary' size='sm' onClick={() => unmerge()}>Unmerge</Button>
                    </div>
                </div>
            </ModalComponent>
            <span className="text-xs text-gray-500">&bull;</span>
            <button onClick={confimationModal.setTrue} disabled={isUnmergePending || isFeedbackLoading} className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300">
                Unmerge
            </button>
        </>
    )
}