import { Boards, Categories, FeedbackCard, Owner, Status, Tags } from '@/components/admin';
import { boardQuery } from '@/routes/__root';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/feedback/$boardSlug/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { boardSlug } = useParams({ from: '/admin/feedback/$boardSlug/' })
  const { data } = useQuery(boardQuery(boardSlug));

  return (
    <div className='grid grid-cols-[minmax(200px,320px)_minmax(300px,360px)_minmax(60%,1fr)] h-full max-h-full pt-18'>
      <div className='col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0'>
        <div className='vertical gap-8 p-4'>
          <Boards />
          <Status />
          <Tags />
          <Categories />
          <Owner />
        </div>
      </div>
      <div className=' col-span-1'>
        <div className='vertical gap-2 h-full'>
          <div className='w-full h-full bg-white dark:bg-zinc-900 z-10 border-l'>
            {data?.feedbacks.map((feedback) => (
              <FeedbackCard key={feedback.id} {...feedback} />
            ))}
          </div>
        </div>
      </div>
      <div className=' col-span-1 p-8 relative border-l'>
        <Outlet />
      </div>
    </div>
  )
}
