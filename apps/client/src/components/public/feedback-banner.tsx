import { useAuthStore } from "@/stores/auth-store";
import { Button } from "../button";
import { Icons } from "../icons";
import { ImageComponent } from "../image";

const SUPABOARD_DASHBOARD_URL = {
  name: "supaboard",
  logo: "https://pub-94f50e2c0f154399b75cb31a0ca78b47.r2.dev/logo/6599fa4e-a6d0-43a4-b3b5-edcc506a3de7-icon_128x128.png",
  url: "https://app.supaboard.io",
};

export const FeedbackBanner = () => {
  const { dismissedFeedbackBanner, setDismissedFeedbackBanner } =
    useAuthStore();

  if (dismissedFeedbackBanner) return null;

  return (
    <div className="border border-[var(--color-primary)] bg-[var(--color-primary)]/10 rounded-lg p-4 vertical gap-2">
      <span className="text-sm text-[var(--color-primary)] block flex-wrap items-center gap-1">
        If you've experienced any issues or have ideas for improvements, don't
        hesitate to leave a feedback on our
        <span className="font-bold px-1 py-0.5 bg-[var(--color-primary)]/10 rounded-md text-[var(--color-primary)] inline-flex items-center gap-1 mx-1 translate-y-0.5">
          {SUPABOARD_DASHBOARD_URL.logo && (
            <ImageComponent
              src={SUPABOARD_DASHBOARD_URL.logo}
              alt={SUPABOARD_DASHBOARD_URL.name}
              className="size-4"
            />
          )}
          {SUPABOARD_DASHBOARD_URL.name}
        </span>
        board
      </span>
      <span className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-[var(--color-primary)] dark:text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:!bg-[var(--color-primary)]/10"
          onClick={() => window.open(SUPABOARD_DASHBOARD_URL.url, "_blank")}
        >
          Create a new post
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="aspect-square text-[var(--color-primary)] dark:text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:hover:!bg-[var(--color-primary)]/10"
          onClick={() => setDismissedFeedbackBanner(true)}
        >
          <Icons.X className="size-4 !stroke-[var(--color-primary)] dark:!stroke-[var(--color-primary)]" />
        </Button>
      </span>
    </div>
  );
};
