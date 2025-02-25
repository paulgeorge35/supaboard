import { Icons } from "@/components/icons";
import { StatusBoard } from "@/components/status-board";
import { applicationBoardsQuery, statusesQuery } from "@/lib/query";
import { useSuspenseQuery } from "@tanstack/react-query";

export function Boards() {
    const { data: boards } = useSuspenseQuery(applicationBoardsQuery)
    const { data: statuses } = useSuspenseQuery(statusesQuery)
    return (
        <>
            <span className="horizontal center-v justify-between">
                <h1 className="font-medium">Roadmap</h1>
                <button
                    type="button"
                    className="button button-small button-secondary"
                >
                    <Icons.Filter size={14} />
                    Filters
                </button>
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {statuses?.filter(status => status.includeInRoadmap).map(status => (
                    <StatusBoard key={status.slug} status={status} items={boards.flatMap(board => board.feedbacks.filter(feedback => feedback.status.slug === status.slug))} admin={true} />
                ))}
            </div>
        </>
    )
}