import { FeedbackActivitySummary } from "@/lib/query"
import { SORT_OPTIONS } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { ActivityCard } from "./activity-card"
import { CommentForm } from "./comment-form"
import { SelectComponent } from "./select"

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
                    <SelectComponent
                        className='w-32 h-9'
                        options={SORT_OPTIONS.map(o => ({
                            label: o.label,
                            value: o.value,
                        }))}
                        value={sort}
                        onChange={(value) => setSort(value as 'newest' | 'oldest')}
                    />
                </span>
            </span>}

            {activities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} feedbackSlug={feedbackSlug} boardSlug={boardSlug} />
            ))}
        </>
    )
}