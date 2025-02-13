import { ActivityOverview } from '@/components/admin/home/activity-overview'
import { Boards } from '@/components/admin/home/boards'
import { NewPosts } from '@/components/admin/home/new-posts'
import { PostsOverview } from '@/components/admin/home/posts-overview'
import { StalePosts } from '@/components/admin/home/stale-posts'
import { UserActivity } from '@/components/admin/home/user-activity'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
})

function RouteComponent() {

  return (
    <div className="vertical gap-4 max-w-4xl mx-auto w-full py-8 px-4 md:px-0 pt-22">
      <ActivityOverview />
      <span className="grid grid-cols-2 gap-4">
        <NewPosts />
        <StalePosts />
      </span>
      <UserActivity />
      <PostsOverview />
      <Boards />
    </div>
  )
}
