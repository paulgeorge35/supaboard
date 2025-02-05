import { useMutation, useQueryClient } from "@tanstack/react-query"
import { DateTime } from "luxon"
import { useState } from "react"
import { fetchClient } from "../lib/client"
import { cn, SORT_OPTIONS } from "../lib/utils"
import { FeedbackActivitiesQueryData, FeedbackActivitySummary } from "../routes/__root"
import { useAuthStore } from "../stores/auth-store"
import { Avatar } from "./avatar"
import { CommentForm } from "./comment-form"
import { Dropdown } from "./dropdown"
import { Icons } from "./icons"
import { LikeButton } from "./like-button"
import { PinButton } from "./pin-button"

type ActivitiesProps = {
    pinned?: FeedbackActivitySummary
    activities: FeedbackActivitySummary[]
    sort: 'newest' | 'oldest'
    setSort: (sort: 'newest' | 'oldest') => void
    feedbackSlug: string
    boardSlug: string
}

export function Activities({ pinned, activities, sort, setSort, feedbackSlug, boardSlug }: ActivitiesProps) {
    const queryClient = useQueryClient();
    const { user, application } = useAuthStore();
    const [commentValue, setCommentValue] = useState('');

    const { mutate: comment, isPending } = useMutation({
        mutationFn: async (content: string) => await fetchClient(`feedback/${boardSlug}/${feedbackSlug}/comment`, {
            method: 'POST',
            body: JSON.stringify({
                content
            })
        }),
        onMutate: (content) => {
            queryClient.cancelQueries({ queryKey: ['feedback', 'activities', boardSlug, feedbackSlug] });

            if (!user) return;

            const previousActivities = queryClient.getQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug]);

            queryClient.setQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug], (old) => {
                return {
                    ...old,
                    activities: [...(old?.activities ?? []), {
                        id: 'new',
                        author: {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar,
                            isAdmin: user.id === application?.ownerId
                        },
                        likes: 0,
                        likedByMe: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        public: true,
                        pinned: false,
                        type: 'FEEDBACK_COMMENT',
                        data: {
                            content
                        },
                        feedbackId: feedbackSlug,
                        authorId: user.id
                    }]
                }
            })

            return { previousActivities };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug], context?.previousActivities);
        },
        onSuccess: () => {
            setCommentValue('');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feedback', 'activities', boardSlug, feedbackSlug] });
        }
    })

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

    return (
        <>
            {user ? <span className='horizontal center-v gap-4 grid col-span-full grid-cols-subgrid'>
                <CommentForm onSubmit={comment} isPending={isPending} value={commentValue} onChange={setCommentValue} className="col-span-full md:col-span-1 md:col-start-2" />
            </span> :
                <span className="horizontal center-v gap-4 grid col-span-full grid-cols-subgrid">
                    <p className="col-start-2 border rounded-lg px-8 py-4 text-center bg-gray-50 text-sm text-gray-500 dark:bg-zinc-800/20 dark:text-zinc-400">Please login to comment</p>
                </span>
            }

            {pinned && <span className='horizontal center-v gap-4 grid col-span-full grid-cols-subgrid'>
                <span className='horizontal justify-end'>
                    <Avatar src={pinned.author.avatar ?? undefined} name={pinned.author.name} className='size-6' isAdmin={pinned.author.isAdmin} />
                </span>
                <span className='horizontal center-v justify-between'>
                    <p className={cn('text-sm font-medium', pinned.author.isAdmin && 'text-[var(--color-primary)]')}>{pinned.author.name}</p>
                    <p className="text-xs text-gray-700 font-bold uppercase horizontal center-v gap-1"><Icons.Pin size={12} /> Pinned</p>
                </span>
                {pinned.data.content && <p className='text-sm hyphens-auto font-light col-start-2'>{pinned.data.content}</p>}
                <span className='horizontal center-v gap-2 col-start-2'>
                    <LikeButton likes={pinned.likes} likedByMe={pinned.likedByMe} like={() => like(pinned.id)} isPending={isLikePending} />
                    <p className='text-xs text-gray-500'>&bull;</p>
                    <p className='text-xs text-gray-500'>{DateTime.fromJSDate(new Date(pinned.createdAt)).toFormat('MMMM dd, yyyy')}</p>
                    <PinButton pinned={pinned.pinned} pin={() => pin(pinned.id)} isPending={isPinPending} />
                </span>
            </span>}

            {activities.length > 0 && <span className='horizontal center-v gap-4 grid col-span-full grid-cols-subgrid'>
                <span className='horizontal center-v justify-between col-start-2'>
                    <p className='text-sm text-gray-500'>Activity Feed</p>
                    <Dropdown trigger={
                        <button className='text-sm text-gray-500 horizontal center-v justify-between border rounded-md px-2 py-1 w-32'>
                            {SORT_OPTIONS.find(o => o.value === sort)?.label} <Icons.ChevronDown size={16} />
                        </button>
                    } items={SORT_OPTIONS.map(o => ({
                        label: o.label,
                        onClick: () => setSort(o.value as 'newest' | 'oldest'),
                    }))} />
                </span>
            </span>}

            {activities.map(activity => (
                <span key={activity.id} className='horizontal center-v gap-4 grid col-span-full grid-cols-subgrid'>
                    <span className='horizontal justify-end'>
                        <Avatar src={activity.author.avatar ?? undefined} name={activity.author.name} className='size-6' isAdmin={activity.author.isAdmin} />
                    </span>
                    <p className={cn('text-sm font-medium', activity.author.isAdmin && 'text-[var(--color-primary)]')}>{activity.author.name}</p>
                    {activity.data.content && <p className='text-sm hyphens-auto font-light col-start-2'>{activity.data.content}</p>}
                    <span className='horizontal center-v gap-2 col-start-2'>
                        <LikeButton likes={activity.likes} likedByMe={activity.likedByMe} like={() => like(activity.id)} isPending={isLikePending} />
                        <p className='text-xs text-gray-500'>&bull;</p>
                        <p className='text-xs text-gray-500'>{DateTime.fromJSDate(new Date(activity.createdAt)).toFormat('MMMM dd, yyyy')}</p>
                        <PinButton pinned={activity.pinned} pin={() => pin(activity.id)} isPending={isPinPending} />
                    </span>
                </span>
            ))}
        </>
    )
}