import { Button, StatusBadge } from "@/components"
import { Confetti } from "@/components/confetti"
import { FeedbackQueryData } from "@/lib/query"
import { Link } from "@tanstack/react-router"
import { useState } from 'react'

type FeedbackChangelogProps = {
    feedback: FeedbackQueryData
}

export const FeedbackChangelog = ({ feedback }: FeedbackChangelogProps) => {
    const [showConfetti, setShowConfetti] = useState(true)

    if (!feedback.changelogSlug) return null;
    return (
        <div className="grid grid-cols-[auto_1fr] gap-2 p-4 border rounded-lg">
            {feedback.status.type === 'COMPLETE' && <StatusBadge status={feedback.status.slug} variant='text' />}
            <span className="text-sm font-light text-gray-500 dark:text-zinc-400 col-span-full">
                Visit our changelog to read the official release notes <span className="inline-block relative">
                    🎉
                    {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
                </span>
            </span>
            <Link to="/changelog/$changelogSlug" params={{ changelogSlug: feedback.changelogSlug }} className="text-sm font-light text-gray-500 col-span-full">
                <Button size='sm'>
                    Learn more
                </Button>
            </Link>
        </div>
    )
}