import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

type NotFoundPageProps = {
    redirect?: string;
    title?: string;
    description?: string;
    showRedirect?: boolean;
}

export function NotFoundPage({ redirect, title, description, showRedirect = true }: NotFoundPageProps) {
    const redirectTo = redirect ?? '/'
    return (
        <div className="vertical center gap-2 grow">
            <Logo className="m-4" />
            <h1 className="text-2xl font-bold">{title ?? 'Page could not be found'}</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 whitespace-pre-wrap text-center">{description ?? 'The resource you are looking for might not exist \nor you might lack permission to access it.'}</p>
            {showRedirect && (
                <Link to={redirectTo} className="m-4 text-sm text-[var(--color-primary)] px-4 py-2 rounded-md hover:bg-[var(--color-primary)]/10 dark:hover:bg-[var(--color-primary)]/10 transition-colors">
                    Go back
                </Link>
            )}
        </div>
    )
}
