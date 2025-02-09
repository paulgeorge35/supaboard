import { SORT_OPTIONS } from "../lib/utils"
import { FeedbackActivitySummary } from "../routes/__root"
import { useAuthStore } from "../stores/auth-store"
import { ActivityCard } from "./activity-card"
import { CommentForm } from "./comment-form"
import { Dropdown } from "./dropdown"
import { Icons } from "./icons"

type ActivitiesProps = {
    pinned?: FeedbackActivitySummary
    activities: FeedbackActivitySummary[]
    sort: 'newest' | 'oldest'
    setSort: (sort: 'newest' | 'oldest') => void
    feedbackSlug: string
    boardSlug: string
}

export function Activities({ pinned, activities, sort, setSort, feedbackSlug, boardSlug }: ActivitiesProps) {
    const { user } = useAuthStore();

    return (
        <>
            {user ? <span className='horizontal center-v gap-4 grid col-span-full grid-cols-subgrid'>
                <CommentForm boardSlug={boardSlug} feedbackSlug={feedbackSlug} className="col-span-full md:col-span-1 md:col-start-2" />
            </span> :
                <span className="horizontal center-v gap-4 grid col-span-full grid-cols-subgrid">
                    <p className="col-start-2 border rounded-lg px-8 py-4 text-center bg-gray-50 text-sm text-gray-500 dark:bg-zinc-800/20 dark:text-zinc-400">Please login to comment</p>
                </span>
            }

            {pinned && <ActivityCard activity={pinned} feedbackSlug={feedbackSlug} boardSlug={boardSlug} />}

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
                <ActivityCard key={activity.id} activity={activity} feedbackSlug={feedbackSlug} boardSlug={boardSlug} />
            ))}
        </>
    )
}