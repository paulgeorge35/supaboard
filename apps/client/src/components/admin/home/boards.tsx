import { Icons } from "@/components/icons";
import { StatusBoard } from "@/components/status-board";
import { applicationBoardsQuery } from "@/lib/query";
import { useSuspenseQuery } from "@tanstack/react-query";

export function Boards() {
    const { data: boards } = useSuspenseQuery(applicationBoardsQuery)

    const plannedFeedbacks = boards.flatMap((board) =>
        board.feedbacks.filter((feedback) => feedback.status === 'PLANNED'),
    )
    const inProgressFeedbacks = boards.flatMap((board) =>
        board.feedbacks.filter((feedback) => feedback.status === 'IN_PROGRESS'),
    )
    const underReviewFeedbacks = boards.flatMap((board) =>
        board.feedbacks.filter((feedback) => feedback.status === 'UNDER_REVIEW'),
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
                <StatusBoard status="UNDER_REVIEW" items={underReviewFeedbacks} admin={true} />
                <StatusBoard status="PLANNED" items={plannedFeedbacks} admin={true} />
                <StatusBoard status="IN_PROGRESS" items={inProgressFeedbacks} admin={true} />
            </div>
        </>
    )
}