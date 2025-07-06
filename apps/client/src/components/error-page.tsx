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
        <div className="vertical gap-4 w-full max-w-2xl">
          {/* Error Message */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Error Message
              </span>
            </div>
            <div className="font-mono text-sm text-red-800 dark:text-red-200">
              {error.error.message}
            </div>
          </div>

          {/* Error Type */}
          {error.error.name && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Error Type
                </span>
              </div>
              <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
                {error.error.name}
              </div>
            </div>
          )}

          {/* Stack Trace */}
          {error.error.stack && (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Stack Trace
                </span>
              </div>
              <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap overflow-x-auto">
                {error.error.stack}
              </pre>
            </div>
          )}

          {/* Component Stack */}
          {error.info?.componentStack && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Component Stack
                </span>
              </div>
              <pre className="font-mono text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap overflow-x-auto">
                {error.info.componentStack}
              </pre>
            </div>
          )}

          {/* Error Cause */}
          {error.error.cause && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Error Cause
                </span>
              </div>
              <pre className="font-mono text-xs text-amber-800 dark:text-amber-200 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(error.error.cause as object, null, 2)}
              </pre>
            </div>
          )}
        </div>
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
