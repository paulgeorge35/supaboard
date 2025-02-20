import { ModalComponent } from '@/components/modal-component';
import { usePublishChangelogMutation } from '@/lib/mutation';
import { ChangelogPage, changelogQuery, changelogsInfiniteQuery } from '@/lib/query';
import { ChangelogDetailed } from '@repo/database';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { Button } from 'react-aria-components';

export const Route = createFileRoute(
  '/admin/changelog/$changelogSlug/edit/publish',
)({
  component: RouteComponent,
})

function RouteComponent() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { changelogSlug } = useParams({ from: Route.fullPath })
    const { mutate: publishChangelog, isPending: isPublishingChangelog } = usePublishChangelogMutation({
        onMutate: () => {
            queryClient.cancelQueries({ queryKey: changelogQuery(changelogSlug).queryKey });
            queryClient.cancelQueries({ queryKey: changelogsInfiniteQuery({}).queryKey });

            const previousChangelog = queryClient.getQueryData<ChangelogDetailed>(changelogQuery(changelogSlug).queryKey);
            const previousChangelogs = queryClient.getQueryData<{
                params: (string | undefined)[],
                pages: ChangelogPage[]
            }>(changelogsInfiniteQuery({}).queryKey);

            queryClient.setQueryData(changelogQuery(changelogSlug).queryKey, (old: ChangelogDetailed | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    status: 'PUBLISHED' as const,
                    publishedAt: new Date(),
                };
            });

            queryClient.setQueryData(changelogsInfiniteQuery({}).queryKey, (old: {
                params: (string | undefined)[],
                pages: ChangelogPage[]
            } | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    pages: old.pages?.map(page => ({
                        ...page,
                        changelogs: page.changelogs?.map(changelog => changelog.slug === changelogSlug ? { ...changelog, status: 'PUBLISHED' as const, publishedAt: new Date() } : changelog),
                    })),
                };
            });
            return { previousChangelog, previousChangelogs };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(changelogQuery(changelogSlug).queryKey, context?.previousChangelog);
            queryClient.setQueryData(changelogsInfiniteQuery({}).queryKey, context?.previousChangelogs);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: changelogQuery(changelogSlug).queryKey });
            queryClient.invalidateQueries({ queryKey: changelogsInfiniteQuery({}).queryKey });
        },
    });

    const onClose = () => {
        router.navigate({ to: '/admin/changelog/$changelogSlug/edit', params: { changelogSlug } });
    }

    return (
        <ModalComponent
            isOpen={true}
            onClose={onClose}
            aria-label="Rename Roadmap"
        >
            <h1 className='text-2xl font-bold'>Publish Changelog</h1>
            <p className='text-gray-500'>Are you sure you want to publish this changelog?</p>
            <div className='horizontal gap-4 center-v mt-4 w-full justify-end'>
                <Button
                    onPress={onClose}
                    className='border text-sm rounded-md px-2 py-1 font-light text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-100'
                >
                    Cancel
                </Button>
                <Button
                    onPress={() => publishChangelog()}
                    isDisabled={isPublishingChangelog}
                    className='rounded-md text-sm px-2 py-1 bg-[var(--color-primary)] text-zinc-100 hover:bg-[var(--color-primary)]/80 transition-colors duration-100 font-light disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    Publish
                </Button>
            </div>
        </ModalComponent>
    )
}