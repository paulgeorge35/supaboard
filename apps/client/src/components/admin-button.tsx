import { Link, useParams } from "@tanstack/react-router";
import { Icons } from "./icons";

export function AdminButton({ isAdmin }: { isAdmin: boolean }) {
    if (!isAdmin) return null;

    const { boardSlug, feedbackSlug } = useParams({ strict: false })
    const path = boardSlug && feedbackSlug ? `/admin/feedback/${boardSlug}/${feedbackSlug}` : boardSlug ? `/admin/feedback/${boardSlug}` : '/admin/feedback'

    return (
        <Link to={path} className="text-sm text-gray-500 hover:text-gray-700 horizontal gap-2 center-v [&>svg]:stroke-gray-500 border rounded-lg px-2 py-1">
            <Icons.Eye className="size-4" />
            Admin
        </Link>
    )
}