import { Link } from "@tanstack/react-router";

export function NotFoundPage({ redirect }: { redirect?: string }) {
    const redirectTo = redirect ?? '/'
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold">Not found</h1>
            <p className="text-sm text-gray-500">The page you are looking for does not exist.</p>
            <Link to={redirectTo} className="text-sm text-[var(--color-primary)]">Go back to the home page</Link>
        </div>
    )
}
