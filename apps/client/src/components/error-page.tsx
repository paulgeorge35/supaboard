import { ErrorComponentProps, Link } from "@tanstack/react-router";
import { Button } from "./button";
import { Logo } from "./logo";

type ErrorPageProps = {
  redirect?: string;
  title?: string;
  description?: string;
  showRedirect?: boolean;
  showRetry?: boolean;
  showErrorDetails?: boolean;
  error: ErrorComponentProps;
};

export function ErrorPage({
  redirect,
  title,
  description,
  showRedirect = true,
  showRetry = true,
  showErrorDetails = true,
  error,
}: ErrorPageProps) {
  const redirectTo = redirect ?? "/";

  return (
    <div className="vertical center gap-2 grow">
      <Logo className="m-4" />
      {showErrorDetails && (
        <>
          <div className="text-6xl font-bold text-gray-300 dark:text-zinc-600 mb-2">
            {error.error.message}
          </div>
          <pre className="text-sm text-gray-500 dark:text-zinc-400 whitespace-pre-wrap text-center">
            {error.error.name}
          </pre>
          {error.error.stack && (
            <pre className="text-sm text-gray-500 dark:text-zinc-400 whitespace-pre-wrap text-center">
              {error.error.stack}
            </pre>
          )}
          {error.info?.componentStack && (
            <pre className="text-sm text-gray-500 dark:text-zinc-400 whitespace-pre-wrap text-center">
              {error.info?.componentStack}
            </pre>
          )}
          {error.error.cause && (
            <pre className="text-sm text-gray-500 dark:text-zinc-400 whitespace-pre-wrap text-center">
              {JSON.stringify(error.error.cause, null, 2)}
            </pre>
          )}
        </>
      )}
      <h1 className="text-2xl font-bold">{title ?? "Something went wrong"}</h1>
      <p className="text-sm text-gray-500 dark:text-zinc-400 whitespace-pre-wrap text-center">
        {description ??
          "An unexpected error occurred. Please try again later \nor contact support if the problem persists."}
      </p>
      {showRetry && <Button onClick={() => error.reset()}>Retry</Button>}
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
