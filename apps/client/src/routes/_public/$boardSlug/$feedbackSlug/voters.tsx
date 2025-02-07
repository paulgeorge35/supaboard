import { Avatar } from '@/components'
import { cn } from '@/lib/utils'
import { feedbackVotersQuery } from '@/routes/__root'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_public/$boardSlug/$feedbackSlug/voters',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { boardSlug, feedbackSlug } = useParams({
    from: '/_public/$boardSlug/$feedbackSlug/voters',
  })

  const { data } = useSuspenseQuery(
    feedbackVotersQuery(boardSlug, feedbackSlug),
  )

  return (
    <div className="grid grid-cols-subgrid col-span-full gap-2 border rounded-lg p-8">
      {data?.map((voter) => (
        <div key={voter.id} className="flex items-center gap-2">
          <Avatar
            src={voter.avatar ?? undefined}
            name={voter.name}
            className="size-6"
            isAdmin={voter.isAdmin}
          />
          <span
            className={cn(
              'text-sm font-light',
              voter.isAdmin && 'text-blue-500 font-normal',
            )}
          >
            {voter.name}
          </span>
        </div>
      ))}
    </div>
  )
}
