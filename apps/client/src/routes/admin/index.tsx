import { ActivityOverview } from "@/components/admin/home/activity-overview";
import { Boards } from "@/components/admin/home/boards";
import { PostsOverview } from "@/components/admin/home/posts-overview";
import { UserActivity } from "@/components/admin/home/user-activity";
import { FeedbackBanner } from "@/components/public/feedback-banner";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="vertical gap-4 max-w-4xl mx-auto w-full py-8 px-4 md:px-0 pt-22">
      <FeedbackBanner />
      <ActivityOverview />
      <span className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* <NewPosts />
        <StalePosts /> */}
      </span>
      <UserActivity />
      <PostsOverview />
      <Boards />
    </div>
  );
}
