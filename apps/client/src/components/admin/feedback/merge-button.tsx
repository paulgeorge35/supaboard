import { Button as Button2 } from '@/components/button';
import { Icons } from '@/components/icons';
import { ModalComponent } from '@/components/modal-component';
import { StatusBadge } from '@/components/status-badge';
import { fetchClient } from '@/lib/client';
import { FeedbackPage, FeedbackQueryData, feedbacksInfiniteQuery, feedbacksMergeQuery } from '@/lib/query';
import { cn } from '@/lib/utils';
import { InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { Button, Input, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { toast } from 'sonner';

type MergeButtonProps = {
    feedback?: FeedbackQueryData;
    boardSlug: string;
    className?: string;
}

export const MergeButton = ({ feedback, boardSlug, className }: MergeButtonProps) => {
    const queryClient = useQueryClient();
    const searchParams = useSearch({ from: '/admin/feedback/$boardSlug/$feedbackSlug' });
    const [search, setSearch] = useState('');
    const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
    const router = useRouter();
    const { data: mergeableFeedbacks } = useQuery(feedbacksMergeQuery(boardSlug, feedback?.slug));

    const { mutate: mergeFeedback, isPending } = useMutation({
        mutationFn: () => fetchClient(`admin/feedback/${selectedFeedback}/merge`, {
            method: 'POST',
            body: JSON.stringify({
                feedbackIds: [feedback?.id]
            })
        }),
        onMutate: async () => {
            const queryKey = feedbacksInfiniteQuery(searchParams).queryKey;
            await queryClient.cancelQueries({ queryKey });
            const previousFeedbacks = queryClient.getQueryData<InfiniteData<FeedbackPage>>(queryKey);

            if (!previousFeedbacks?.pages || !feedback?.id) {
                console.log('No previous data or feedback id');
                return { previousFeedbacks: undefined };
            }

            try {
                queryClient.setQueryData(
                    queryKey,
                    (old: InfiniteData<FeedbackPage> | undefined) => {
                        if (!old?.pages) return previousFeedbacks;

                        const updated = {
                            ...old,
                            pages: old.pages.map(page => ({
                                ...page,
                                feedbacks: page.feedbacks.filter(f => f.id !== feedback?.id)
                            }))
                        };

                        console.log('Updated data:', updated);
                        return updated;
                    }
                );

                const afterUpdate = queryClient.getQueryData(queryKey);

                return { previousFeedbacks };
            } catch (error) {
                return { previousFeedbacks };
            }
        },
        onError: (_, __, context) => {
            if (context?.previousFeedbacks) {
                const queryKey = feedbacksInfiniteQuery(searchParams).queryKey;
                queryClient.setQueryData(queryKey, context.previousFeedbacks);
            }
            toast.error('Failed to merge feedback');
        },
        onSettled: () => {
            const queryKey = feedbacksInfiniteQuery(searchParams).queryKey;
            queryClient.invalidateQueries({ queryKey });
        },
        onSuccess: () => {
            toast.success('Feedback merged successfully');
            setSelectedFeedback(null);
            const newFeedback = mergeableFeedbacks?.find((feedback) => feedback.id === selectedFeedback);
            if (newFeedback) {
                router.navigate({ to: '/admin/feedback/$boardSlug/$feedbackSlug', params: { boardSlug, feedbackSlug: newFeedback.slug }, search: searchParams, replace: true })
            }
        },
    })

    if (!feedback || feedback.merged.length > 0) return null;
    return (
        <>
            <ModalComponent isOpen={!!selectedFeedback} onClose={() => setSelectedFeedback(null)}>
                <div className='vertical gap-2'>
                    <h1 className='text-lg font-medium'>Merge feedback</h1>
                    <p className='text-sm text-gray-500 dark:text-zinc-400'>
                        Are you sure you want to merge this into another feedback? All votes and comments will be transferred over.
                    </p>
                    <div className='horizontal justify-end gap-2'>
                        <Button2 disabled={isPending} variant='outline' color='secondary' size='sm' onClick={() => setSelectedFeedback(null)}>Cancel</Button2>
                        <Button2 isLoading={isPending} color='primary' size='sm' onClick={() => mergeFeedback()}>Merge</Button2>
                    </div>
                </div>
            </ModalComponent>
            <MenuTrigger>
                <Button
                    aria-label="Menu"
                    className={cn('horizontal center cursor-pointer size-9 rounded-md hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors', className)}
                >
                    <Icons.Merge className='size-5' />
                </Button>
                <Popover
                    className='w-80 rounded-md bg-white dark:bg-zinc-900 p-1 border shadow-2xl text-sm'
                >
                    <Input
                        placeholder='Search feedback to merge into...'
                        className='px-3 py-1 w-full h-9'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    <Menu className='vertical gap-2 border-t py-1 overflow-y-auto max-h-[300px]'>
                        {mergeableFeedbacks?.filter((feedback) => feedback.title.toLowerCase().includes(search.toLowerCase())).map((feedback) => (
                            <MenuItem
                                key={feedback.id}
                                onAction={() => setSelectedFeedback(feedback.id)}
                                className='px-3 py-2 cursor-pointer vertical gap-1 hover:bg-[var(--color-primary)]/10 dark:hover:bg-[var(--color-primary)]/10 transition-colors rounded-md'
                            >
                                <h1 className='text-sm font-medium'>{feedback.title}</h1>
                                <StatusBadge status={feedback.status} variant='text' />
                                <span className='horizontal gap-2 center-v mt-2'>
                                    <Icons.ClipboardList className='size-3 stroke-1 stroke-gray-500 dark:stroke-zinc-400' />
                                    <p className='text-xs text-gray-500 dark:text-zinc-400'>{feedback.board.name}</p>
                                    <Icons.Triangle className='ml-auto size-3 stroke-gray-500 dark:stroke-zinc-400' />
                                    <p className='text-xs text-gray-500 dark:text-zinc-400'>{feedback.votes}</p>
                                    <span className='text-xs text-gray-500 dark:text-zinc-400'>&bull;</span>
                                    <Icons.MessageSquare className='size-3 stroke-gray-500 dark:stroke-zinc-400' />
                                    <p className='text-xs text-gray-500 dark:text-zinc-400'>{feedback.activities}</p>
                                </span>
                            </MenuItem>
                        ))}
                    </Menu>
                </Popover>
            </MenuTrigger>
        </>
    )
};
