import { Link } from "@tanstack/react-router";

type EditHistoryProps = {
    boardSlug: string;
    feedbackSlug: string;
    edited: boolean;
}

export function EditHistory({ boardSlug, feedbackSlug, edited }: EditHistoryProps) {

    if (!edited) return null;

    return (
        <>
            <p className="text-xs text-gray-500">&bull;</p>
            <Link
                to="/$board/$feedback/edit-history"
                params={{ board: boardSlug, feedback: feedbackSlug }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
                Edit History
            </Link>
        </>
    )
}