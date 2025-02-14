import { Boards, Categories, Owner, Status, Tags } from '@/components/admin';
import { DateRange } from '@/components/admin/feedback/sidebar/date';
import { feedbacksQuery } from '@/lib/query';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound, Outlet, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { useEffect, useMemo } from 'react';
import { z } from 'zod';

const feedbackSearchSchema = z.object({
  search: z.string().optional(),
  cursor: z.string().optional(),
  take: z.number().optional(),
  order: z.enum(['newest', 'oldest']).optional(),
  boards: z.array(z.string()).optional(),
  status: z.array(z.enum(['OPEN', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])).optional(),
  categories: z.array(z.string()).optional(),
  uncategorized: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  untagged: z.boolean().optional(),
  owner: z.string().optional(),
  unassigned: z.boolean().optional(),
  start: z.string().optional(),
  end: z.string().optional()
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

  const defaultBoardSlug = useMemo(() => {
    return boardSlug ?? application?.boards[0].slug;
  }, [boardSlug, application])

  if (!defaultBoardSlug) {
    throw notFound();
  }

  const { data, error } = useQuery(feedbacksQuery({ ...search, take: 1 }))

  useEffect(() => {
    if (boardSlug) return;

    if (error || (data && data.feedbacks.length === 0)) {
      if (application?.boards.length === 0) {
        router.navigate({ to: '/admin/settings/boards/create-new', replace: true })
        return;
      } else {
        router.navigate({ to: '/admin/feedback/$boardSlug', params: { boardSlug: application?.boards[0].slug! }, replace: true })
        return;
      }
    }

    if (data && data.feedbacks.length > 0) {
      router.navigate({ to: `/admin/feedback/${data.feedbacks[0].board.slug}/${data.feedbacks[0].slug}`, search, replace: true })
      return;
    }
  }, [defaultBoardSlug, data])


  return (
    <div className="grid grid-cols-[minmax(200px,250px)_minmax(300px,360px)_minmax(60%,1fr)] w-full h-full max-h-full pt-18">
      <div className="col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0">
        <div className="vertical gap-8 p-4">
          <DateRange />
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
