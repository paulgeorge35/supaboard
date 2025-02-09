import { Icons } from "@/components/icons";
import { StatusBoard } from "@/components/status-board";
import { applicationBoardsQuery } from "@/routes/__root";
import { useSuspenseQuery } from "@tanstack/react-query";

export function Boards() {
    const { data: boards } = useSuspenseQuery(applicationBoardsQuery)

    const plannedFeedbacks = boards.flatMap((board) =>
        board.feedbacks.filter((feedback) => feedback.status === 'PLANNED'),
    )
    const inProgressFeedbacks = boards.flatMap((board) =>
        board.feedbacks.filter((feedback) => feedback.status === 'IN_PROGRESS'),
    )
    const completeFeedbacks = boards.flatMap((board) =>
        board.feedbacks.filter((feedback) => feedback.status === 'RESOLVED'),
    )
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
                <StatusBoard status="PLANNED" items={plannedFeedbacks} admin={true} />
                <StatusBoard status="IN_PROGRESS" items={inProgressFeedbacks} admin={true} />
                <StatusBoard status="RESOLVED" items={completeFeedbacks} admin={true} />
            </div>
        </>
    )
}