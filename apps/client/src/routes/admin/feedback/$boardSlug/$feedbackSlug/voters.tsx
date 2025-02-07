import { Avatar, Skeleton } from '@/components'
import { cn } from '@/lib/utils'
import { feedbackVotersQuery } from '@/routes/__root'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound, useParams } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/admin/feedback/$boardSlug/$feedbackSlug/voters',
)({
    component: RouteComponent,
})


function RouteComponent() {
    const { boardSlug, feedbackSlug } = useParams({
        from: '/admin/feedback/$boardSlug/$feedbackSlug/voters',
    })

    const { data, isLoading } = useQuery(
        feedbackVotersQuery(boardSlug, feedbackSlug),
    )

    if (isLoading) return (
        <div className="grid grid-cols-subgrid col-span-full gap-2 border rounded-lg p-8">
            <Skeleton className="col-span-full h-10" />
        </div>
    )

    if (!data && !Array.isArray(data)) {
        throw notFound()
    }

    return (
        <div className="col-span-full vertical gap-4 w-full">
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