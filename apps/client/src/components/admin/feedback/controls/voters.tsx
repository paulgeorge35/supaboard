import { Avatar } from "@/components/avatar";
import { Skeleton } from "@/components/skeleton";
import { feedbackVotersQuery } from "@/routes/__root";
import { useQuery } from "@tanstack/react-query";
import { Link, notFound, useParams } from "@tanstack/react-router";

export function Voters() {
    const { boardSlug, feedbackSlug } = useParams({
        from: '/admin/feedback/$boardSlug/$feedbackSlug',
    })

    const { data, isLoading } = useQuery(feedbackVotersQuery(boardSlug, feedbackSlug));

    if (isLoading) {
        return <Skeleton className="col-span-full h-10" />
    }

    if (!data) {
        throw notFound()
    }

    if (data.length === 0) return null;

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">{`${data.length} ${data.length === 1 ? 'Voter' : 'Voters'}`}</h1>
            {data.length > 0 && <Link
                to="/admin/feedback/$boardSlug/$feedbackSlug/voters"
                params={{ boardSlug, feedbackSlug }}
                className="border rounded-lg p-4 col-span-full horizontal dark:bg-zinc-900 hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200"
            >
                {data.slice(0, 5).map((voter, index) => (
                    <Avatar
                        key={voter.id}
                        src={voter.avatar ?? undefined}
                        name={voter.name}
                        style={{
                            marginLeft: index > 0 ? `-${index * 5}px` : undefined,
                            mask: index > 0 ? 'radial-gradient(circle 18px at -10px 50%, transparent 99%, #fff 100%)' : undefined
                        }}
                    />
                ))}
            </Link>}
        </div>
    )
}