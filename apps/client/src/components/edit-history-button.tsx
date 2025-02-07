import { Link } from "@tanstack/react-router";

type EditHistoryProps = {
    boardSlug: string;
    feedbackSlug: string;
    edited: boolean;
    to?: string;
}

export function EditHistory({ boardSlug, feedbackSlug, edited, to = "/$boardSlug/$feedbackSlug/edit-history" }: EditHistoryProps) {

    if (!edited) return null;

    return (
        <>
            <p className="text-xs text-gray-500">&bull;</p>
            <Link
                to={to ?? "/$boardSlug/$feedbackSlug/edit-history"}
                params={{ boardSlug, feedbackSlug }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
                Edit History
            </Link>
        </>
    )
}