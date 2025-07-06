import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

type ErrorPageProps = {
  redirect?: string;
  title?: string;
  description?: string;
  showRedirect?: boolean;
  errorCode?: string;
  showErrorCode?: boolean;
};

export function ErrorPage({
  redirect,
  title,
  description,
  showRedirect = true,
  errorCode,
  showErrorCode = false,
}: ErrorPageProps) {
  const redirectTo = redirect ?? "/";

  return (
    <div className="vertical center gap-2 grow">
      <Logo className="m-4" />
      {showErrorCode && errorCode && (
        <div className="text-6xl font-bold text-gray-300 dark:text-zinc-600 mb-2">
          {errorCode}
        </div>
      )}
      <h1 className="text-2xl font-bold">{title ?? "Something went wrong"}</h1>
      <p className="text-sm text-gray-500 dark:text-zinc-400 whitespace-pre-wrap text-center">
        {description ??
          "An unexpected error occurred. Please try again later \nor contact support if the problem persists."}
      </p>
      {showRedirect && (
        <Link
          to={redirectTo}
          className="m-4 text-sm text-[var(--color-primary)] px-4 py-2 rounded-md hover:bg-[var(--color-primary)]/10 dark:hover:bg-[var(--color-primary)]/10 transition-colors"
        >
          Go back
        </Link>
      )}
    </div>
  );
}
