import { VoteButton } from "@/components";
import { fetchClient } from "@/lib/client";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

type NewPostsQueryData = {
    id: string;
    title: string;
    votes: number;
    slug: string;
    boardSlug: string;
    votedByMe: boolean;
}

const newPostsQuery = queryOptions<NewPostsQueryData[]>({
    queryKey: ['admin', 'new-posts'],
    queryFn: () => fetchClient('/admin/new-posts'),
});

export function NewPosts() {
    const queryClient = useQueryClient();
    const { data } = useQuery(newPostsQuery);

    const { mutate: vote, isPending } = useMutation({
        mutationFn: (id: string) => fetchClient(`feedback/${id}/vote`, { method: "POST" }),
        onMutate: async (id: string) => {
            queryClient.cancelQueries({ queryKey: newPostsQuery.queryKey });

            const previousPosts = queryClient.getQueryData(newPostsQuery.queryKey)

            queryClient.setQueryData(newPostsQuery.queryKey, (old: NewPostsQueryData[] | undefined) => {
                if (!old) return undefined;

                return old.map(post => post.id === id ? { ...post, votedByMe: !post.votedByMe, votes: post.votes + (post.votedByMe ? -1 : 1) } : post)
            })

            return {
                previousPosts,
            }
        },
        onError: (_, __, context) => {
            if (context?.previousPosts) {
                queryClient.setQueryData(newPostsQuery.queryKey, context.previousPosts)
            }

            toast.error("Failed to vote")
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: newPostsQuery.queryKey })
        }
    })

    return (
        <div className="border rounded-lg p-4">
            <h1 className="text-lg font-bold pb-4">New Posts</h1>
            <div className="vertical gap-4">
                {data?.map((post) => (
                    <div key={`${post.boardSlug}-${post.slug}`} className='w-full grid grid-cols-[auto_1fr] gap-4 text-sm horizontal center-v'>
                        <VoteButton votes={post.votes} votedByMe={post.votedByMe} vote={() => vote(post.id)} isPending={isPending} />
                        <Link to='/admin/feedback/$boardSlug/$feedbackSlug' params={{ boardSlug: post.boardSlug, feedbackSlug: post.slug }} className="horizontal center-v gap-1 group cursor-pointer">
                            <p className='font-medium group-hover:text-[var(--color-primary)] transition-colors duration-200'>{post.title}</p>
                        </Link>
                    </div>
                ))}
                {data?.length === 0 && (
                    <p className="text-center text-sm text-gray-500">You have no new posts</p>
                )}
            </div>
        </div>
    )
}