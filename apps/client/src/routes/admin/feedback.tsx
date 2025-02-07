import { Boards, Categories, Owner, Status, Tags } from '@/components/admin';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound, Outlet, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { useEffect } from 'react';
import { z } from 'zod';
import { boardQuery } from '../__root';

const feedbackSearchSchema = z.object({
  boards: z.array(z.string()).optional(),
  status: z.array(z.enum(['OPEN', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])).optional(),
  categories: z.array(z.string()).optional(),
  uncategorized: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  untagged: z.boolean().optional(),
  owner: z.string().optional(),
  unassigned: z.boolean().optional(),
})

export type FeedbackSearch = z.infer<typeof feedbackSearchSchema>

export const Route = createFileRoute('/admin/feedback')({
  validateSearch: zodValidator(feedbackSearchSchema),
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter();
  const search = useSearch({ from: Route.fullPath })
  const { application } = useAuthStore()
  const { boardSlug } = useParams({ strict: false })

  const defaultBoardSlug = boardSlug ?? application?.boards[0].slug;

  if (!defaultBoardSlug) {
    throw notFound();
  }

  const { data, error } = useQuery(boardQuery(defaultBoardSlug))

  useEffect(() => {
    if (error || (data && data.feedbacks.length === 0)) {
      throw notFound();
    }

    if (data && data.feedbacks.length > 0) {
      console.log("feedback[1]: Navigating to /admin/feedback/$boardSlug/$feedbackSlug", `boardSlug: ${defaultBoardSlug}`, `feedbackSlug: ${data?.feedbacks[0].slug}`)
      router.navigate({ to: `/admin/feedback/${defaultBoardSlug}/${data?.feedbacks[0].slug}`, search })
    }
  }, [defaultBoardSlug])


  return (
    <div className="grid grid-cols-[minmax(200px,250px)_minmax(300px,360px)_minmax(60%,1fr)] w-full h-full max-h-full pt-18">
      <div className="col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0">
        <div className="vertical gap-8 p-4">
          <Boards />
          <Status />
          <Tags />
          <Categories />
          <Owner />
        </div>
      </div>
      <Outlet />
    </div>
  )
}
