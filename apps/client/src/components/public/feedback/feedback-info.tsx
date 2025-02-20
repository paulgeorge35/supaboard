import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"

import { Avatar } from "@/components"
import { FeedbackQueryData, FeedbackVotersQueryData } from "@/lib/query"
import { useMediaQuery } from "@paulgeorge35/hooks"
import { DateTime } from "luxon"

type FeedbackInfoProps = {
    feedback: FeedbackQueryData
    feedbackVoters: FeedbackVotersQueryData;
    boardSlug: string;
    feedbackSlug: string;
}

export const FeedbackInfo = ({ feedback, feedbackVoters, boardSlug, feedbackSlug }: FeedbackInfoProps) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    return (
        <div className="grid grid-cols-[auto_1fr] gap-4 p-4 border rounded-lg">
            {feedback.estimatedDelivery && feedback.publicEstimate && (
                <span className='vertical gap-1 col-span-full'>
                    <h1 className="text-xs font-bold uppercase text-gray-500 dark:text-zinc-300 col-span-full">
                        Estimated
                    </h1>
                    <p className="text-sm font-light text-gray-500 dark:text-zinc-400 col-span-full">
                        {feedback.estimatedDelivery
                            ? DateTime.fromJSDate(
                                new Date(feedback.estimatedDelivery),
                            ).toFormat('MMMM yyyy')
                            : 'Not estimated'}
                    </p>
                </span>
            )}
            {feedback.category && (
                <span className='vertical gap-1 col-span-full'>
                    <h1 className="text-xs font-bold uppercase text-gray-500 dark:text-zinc-300 col-span-full">
                        Category
                    </h1>
                    <p className="text-sm font-light text-gray-500 dark:text-zinc-400 col-span-full">
                        {feedback.category.name}
                    </p>
                </span>
            )}
            <h1 className="text-xs font-bold uppercase text-gray-500 dark:text-zinc-300 col-span-full">
                Voters
            </h1>
            {feedbackVoters.slice(0, isMobile ? 3 : 5).map((voter) => (
                <span
                    key={`voter-${voter.id}`}
                    className="horizontal gap-2 center-v col-span-full"
                >
                    <Avatar
                        src={voter.avatar ?? undefined}
                        name={voter.name}
                        className="size-6"
                        isAdmin={voter.isAdmin}
                    />
                    <span
                        className={cn(
                            'text-sm font-light',
                            voter.isAdmin && 'text-[var(--color-primary)] font-normal',
                        )}
                    >
                        {voter.name}
                    </span>
                </span>
            ))}
            {feedbackVoters.length > (isMobile ? 3 : 5) && (
                <Link
                    to="/$boardSlug/$feedbackSlug/voters"
                    params={{ boardSlug, feedbackSlug }}
                    className="text-sm font-light col-start-2 text-[var(--color-primary)] hover:text-[var(--color-primary)]/80"
                >
                    and {feedbackVoters.length - (isMobile ? 3 : 5)} more
                </Link>
            )}
            {feedbackVoters.length === 0 && (
                <span className="text-sm font-light text-gray-500 dark:text-zinc-400 col-span-full">
                    No voters yet
                </span>
            )}
        </div>
    )
};