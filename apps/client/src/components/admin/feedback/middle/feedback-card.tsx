import { Icons, StatusBadge } from "@/components";
import { cn } from "@/lib/utils";
import { FeedbackSummary } from "@repo/database";
import { Link, useSearch } from "@tanstack/react-router";

type FeedbackCardProps = {
    feedback: FeedbackSummary
    ref?: React.RefObject<HTMLDivElement>
}

export function FeedbackCard({ feedback, ref }: FeedbackCardProps) {
    const search = useSearch({ from: "/admin/feedback/$boardSlug" });
    const { board, slug, title, description, status, _count } = feedback;

    return (
        <>
            <Link
                preload={false}
                to={"/admin/feedback/$boardSlug/$feedbackSlug"}
                params={{ boardSlug: board.slug, feedbackSlug: slug }}
                search={search}
                activeProps={{ className: "[&>div]:bg-gray-900/5 [&>div]:border-l-2 [&>div]:border-[var(--color-primary)]" }}
            >
                <div ref={ref} className={cn("p-4 border-zinc-200 dark:border-zinc-800 vertical gap-2 bg-white dark:bg-zinc-900 hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200")}>
                    <h1 className="text-sm font-medium">{title}</h1>
                    <p className="text-sm text-gray-500 line-clamp-2">
                        {description}
                    </p>
                    <span className="horizontal gap-2 center-v">
                        <Icons.Triangle size={12} />
                        <span className="text-xs text-gray-500">
                            {_count.votes}
                        </span>
                        <Icons.MessageSquare size={12} />
                        <span className="text-xs text-gray-500">
                            {_count.activities}
                        </span>
                        {status.type !== 'DEFAULT' && (
                            <StatusBadge status={status.slug} className="ml-auto" />
                        )}
                    </span>
                </div>
            </Link>
            <hr />
        </>
    )
}