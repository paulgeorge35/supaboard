import { fetchClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import { FeedbackActivitiesQueryData, FeedbackActivitySummary } from "@/routes/__root";
import { FeedbackStatus } from "@repo/database";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { Avatar } from "./avatar";
import { Icons } from "./icons";
import { ImageFile } from "./image-file";
import { LikeButton } from "./like-button";
import { PinButton } from "./pin-button";
import { StatusBadge } from "./status-badge";

type ActivityCardProps = {
    activity: FeedbackActivitySummary;
    feedbackSlug: string
    boardSlug: string
}

export function ActivityCard({ activity, feedbackSlug, boardSlug }: ActivityCardProps) {
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

    return (
        <span className='horizontal gap-4 grid col-span-full grid-cols-subgrid'>
            <span className='horizontal justify-end'>
                <Avatar src={activity.author.avatar ?? undefined} name={activity.author.name} className='size-6' isAdmin={activity.author.isAdmin} />
            </span>
            <span className='horizontal items-baseline justify-between'>
                <span className="flex flex-col md:flex-row items-baseline gap-2">
                    <p className={cn('text-sm font-medium', activity.author.isAdmin && 'text-[var(--color-primary)]')}>{activity.author.name}</p>
                    {'to' in activity.data && activity.type === 'FEEDBACK_STATUS_CHANGE' && (
                        <span className="horizontal center-v gap-1">
                            <p className="text-sm text-gray-500">marked this as</p>
                            <StatusBadge status={activity.data.to as FeedbackStatus} />
                        </span>
                    )}
                </span>
                {activity.pinned && <p className="text-xs text-[var(--color-primary)] [&>svg]:stroke-[var(--color-primary)] font-medium uppercase horizontal center-v gap-1"><Icons.Pin size={12} /> Pinned</p>}
            </span>
            {activity.data.content && <p className='text-sm hyphens-auto font-light col-start-2'>{activity.data.content}</p>}
            {activity.files.length > 0 && <div className="col-start-2 horizontal flex-wrap gap-2">
                {activity.files.map(file => <ImageFile key={file} fileKey={file} />)}
            </div>}
            <p className='text-xs text-gray-500 md:hidden col-start-2 center-v gap-1'>
                {
                    DateTime.fromJSDate(new Date(activity.createdAt)).diffNow().as('hours') > -24
                        ? DateTime.fromJSDate(new Date(activity.createdAt)).toRelative()
                        : DateTime.fromJSDate(new Date(activity.createdAt)).toFormat('MMMM dd, yyyy, HH:mm')
                }
            </p>
            <span className='horizontal center-v gap-2 col-start-2'>
                <LikeButton likes={activity.likes} likedByMe={activity.likedByMe} like={() => like(activity.id)} isPending={isLikePending} />
                <span className='text-xs text-gray-500 hidden md:flex horizontal center-v gap-1'>
                    <p className='text-xs text-gray-500'>&bull;</p>
                    {
                        DateTime.fromJSDate(new Date(activity.createdAt)).diffNow().as('hours') > -24
                            ? DateTime.fromJSDate(new Date(activity.createdAt)).toRelative()
                            : DateTime.fromJSDate(new Date(activity.createdAt)).toFormat('MMMM dd, yyyy, HH:mm')
                    }
                </span>
                {!activity.public && <p className="text-xs text-gray-500">&bull; Private</p>}
                {activity.public && <PinButton pinned={activity.pinned} pin={() => pin(activity.id)} isPending={isPinPending} />}
            </span>
        </span>
    )
}