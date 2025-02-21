import { Link, useSearch } from "@tanstack/react-router";

type EditFeedbackButtonProps = {
    isEditable: boolean;
    boardSlug: string;
    feedbackSlug: string;
    to?: string;
}

export function EditFeedbackButton({ isEditable, boardSlug, feedbackSlug, to = "/$boardSlug/$feedbackSlug/edit" }: EditFeedbackButtonProps) {
    const search = useSearch({ strict: false })
    if (!isEditable) return null;

    return (
        <>
            <p className="text-xs text-gray-500">&bull;</p>
            <Link
                to={to}
                params={{ boardSlug, feedbackSlug }}
                search={search}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
                Edit
            </Link>
        </>
    )
}