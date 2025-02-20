import { Button, StatusBadge } from "@/components"
import { FeedbackQueryData } from "@/lib/query"
import { Link } from "@tanstack/react-router"

type FeedbackChangelogProps = {
    feedback: FeedbackQueryData
}

export const FeedbackChangelog = ({ feedback }: FeedbackChangelogProps) => {
    if (!feedback.changelogSlug) return null;
    return (
        <div className="grid grid-cols-[auto_1fr] gap-2 p-4 border rounded-lg">
            {feedback.status === 'RESOLVED' && <StatusBadge status={feedback.status} variant='text' />}
            <p className="text-sm font-light text-gray-500 dark:text-zinc-400 col-span-full">
                Visit our changelog to read the official release notes 🎉
            </p>
            <Link to="/changelog/$changelogSlug" params={{ changelogSlug: feedback.changelogSlug }} className="text-sm font-light text-gray-500 col-span-full">
                <Button size='sm'>
                    Learn more
                </Button>
            </Link>
        </div>
    )
}