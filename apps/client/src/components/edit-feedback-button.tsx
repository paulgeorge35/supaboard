import { Link } from "@tanstack/react-router";

type EditFeedbackButtonProps = {
    isEditable: boolean;
    boardSlug: string;
    feedbackSlug: string;
}

export function EditFeedbackButton({ isEditable, boardSlug, feedbackSlug }: EditFeedbackButtonProps) {

    if (!isEditable) return null;

    return (
        <>
            <p className="text-xs text-gray-500">&bull;</p>
            <Link
                to="/$board/$feedback/edit"
                params={{ board: boardSlug, feedback: feedbackSlug }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
                Edit
            </Link>
        </>
    )
}