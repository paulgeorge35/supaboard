import { useAuthStore } from "@/stores/auth-store";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { Icons } from "./icons";

export function AdminButton() {
    const { application } = useAuthStore();
    const location = useLocation();
    
    let path = '/admin';
    
    const { boardSlug, feedbackSlug, changelogSlug } = useParams({ strict: false })
    if (boardSlug) {
        path = `/admin/feedback/${boardSlug}`
        if (feedbackSlug) {
            path = `/admin/feedback/${boardSlug}/${feedbackSlug}`
        }
    }
    
    if (location.pathname.startsWith('/changelog')) {
        path = '/admin/changelog'
        if (changelogSlug) {
            path = `/admin/changelog/${changelogSlug}/edit`
        }
    }
    
    if (application?.role !== undefined && (application.role === null || !['ADMIN', 'COLLABORATOR'].includes(application.role))) return null;

    return (
        <Link to={path} preload={false} className="text-sm text-gray-500 hover:text-gray-700 horizontal gap-2 center-v [&>svg]:stroke-gray-500 border rounded-lg px-2 py-1">
            <Icons.Eye className="size-4" />
            Admin
        </Link>
    )
}