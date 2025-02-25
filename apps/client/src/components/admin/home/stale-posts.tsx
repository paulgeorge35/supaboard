import { Icons, StatusBadge, VoteButton } from "@/components";
import { fetchClient } from "@/lib/client";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { DateTime } from "luxon";
import { toast } from "sonner";

type StalePostsQueryData = {
    id: string;
    title: string;
    slug: string;
    boardSlug: string;
    status: string;
    createdAt: Date;
    lastActivityAt: Date;
    votes: number;
    votedByMe: boolean;
}

const stalePostsQuery = queryOptions<StalePostsQueryData[]>({
    queryKey: ['admin', 'stale-posts'],
    queryFn: () => fetchClient('/admin/stale-posts'),
});

export function StalePosts() {
    const queryClient = useQueryClient();
    const { data } = useQuery(stalePostsQuery);

    const { mutate: vote, isPending } = useMutation({
        mutationFn: (id: string) => fetchClient(`feedback/${id}/vote`, { method: "POST" }),
        onMutate: async (id: string) => {
            queryClient.cancelQueries({ queryKey: stalePostsQuery.queryKey });

            const previousPosts = queryClient.getQueryData(stalePostsQuery.queryKey)

            queryClient.setQueryData(stalePostsQuery.queryKey, (old: StalePostsQueryData[] | undefined) => {
                if (!old) return undefined;

                return old.map(post => post.id === id ? { ...post, votedByMe: !post.votedByMe, votes: post.votes + (post.votedByMe ? -1 : 1) } : post)
            })

            return {
                previousPosts,
            }
        },
        onError: (_, __, context) => {
            if (context?.previousPosts) {
                queryClient.setQueryData(stalePostsQuery.queryKey, context.previousPosts)
            }

            toast.error("Failed to vote")
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: stalePostsQuery.queryKey })
        }
    })

    return (
        <div className="border rounded-lg p-4">
            <h1 className="text-lg font-bold pb-4">Stale Posts</h1>
            <div className="vertical gap-4">
                {data?.map((post) => (
                    <div key={`${post.boardSlug}-${post.slug}`} className='w-full grid grid-cols-[auto_1fr] gap-4 text-sm horizontal center-v'>
                        <VoteButton votes={post.votes} votedByMe={post.votedByMe} vote={() => vote(post.id)} isPending={isPending} />
                        <Link to='/admin/feedback/$boardSlug/$feedbackSlug' params={{ boardSlug: post.boardSlug, feedbackSlug: post.slug }} className="vertical center-v gap-1 group cursor-pointer">
                            <p className='font-medium group-hover:text-[var(--color-primary)] transition-colors duration-200'>{post.title}</p>
                            <span className="horizontal center-v gap-2">
                                <StatusBadge status={post.status} variant="text" />
                                <p className="horizontal center-v gap-1 text-xs font-medium uppercase text-red-500 [&>svg]:stroke-red-500">
                                    <Icons.Clock className="size-3" />
                                    {DateTime.now().diff(DateTime.fromJSDate(new Date(post.lastActivityAt)), 'weeks').weeks.toFixed()} weeks
                                </p>
                            </span>
                        </Link>
                    </div>
                ))}
                {data?.length === 0 && (
                    <p className="text-center text-sm text-gray-500">You have no stale posts 🎉</p>
                )}
            </div>
        </div>
    );
}