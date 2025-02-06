import { Link, useParams } from "@tanstack/react-router";
import { Feedback } from "../../../../../../../packages/database/generated/client";
import { Icons } from "../../../icons";
import { StatusBadge } from "../../../status-badge";


export function FeedbackCard({ slug, title, description, status, activities, votes }: Pick<Feedback, 'id' | 'title' | 'description' | 'status' | 'slug'> & {
    votes: number;
    activities: number;
    votedByMe: boolean;
}) {
    const { boardSlug } = useParams({ from: "/admin/feedback/$boardSlug" })

    return (
        <>
            <Link
                to={"/admin/feedback/$boardSlug/$feedbackSlug"}
                params={{ boardSlug, feedbackSlug: slug }}
                activeProps={{ className: "[&>div]:bg-gray-900/5 [&>div]:border-l-2 [&>div]:border-[var(--color-primary)]" }}
            >
                <div className="p-4 border-zinc-200 dark:border-zinc-800 vertical gap-2 bg-white dark:bg-zinc-900 hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200">
                    <h1 className="text-sm font-medium">{title}</h1>
                    <p className="text-sm text-gray-500 line-clamp-2">
                        {description}
                    </p>
                    <span className="horizontal gap-2 center-v">
                        <Icons.Triangle size={12} />
                        <span className="text-xs text-gray-500">
                            {votes}
                        </span>
                        <Icons.MessageSquare size={12} />
                        <span className="text-xs text-gray-500">
                            {activities}
                        </span>
                        {status !== 'OPEN' && (
                            <StatusBadge status={status} className="ml-auto" />
                        )}
                    </span>
                </div>
            </Link>
            <hr />
        </>
    )
}