import { Button, Icons, LoadingSpinner, NotFoundPage } from '@/components'
import { ChangelogContent } from '@/components/admin/changelog/changelog-renderer'
import { Controls } from '@/components/admin/changelog/controls'
import { ChangelogEditor } from '@/components/admin/changelog/editor'
import { useUnpublishChangelogMutation, useUpdateChangelogMutation } from '@/lib/mutation'
import { changelogLabelsQuery, ChangelogPage, changelogQuery, changelogsInfiniteQuery } from '@/lib/query'
import { FeedbackStatusConfig } from '@/lib/utils'
import { ChangelogDetailed } from '@repo/database'
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, notFound, Outlet, useParams, useRouter } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useState } from 'react'


export const Route = createFileRoute('/admin/changelog/$changelogSlug/edit')({
  component: RouteComponent,
  notFoundComponent: () => <NotFoundPage title='Changelog not found' description='The changelog you are looking for does not exist.' redirect='/admin/changelog' />,
  context: () => {
    const queryClient = new QueryClient()
    return {
      queryClient,
    }
  },
  loader: async ({ context, params }) => {
    const changelog = await context.queryClient.fetchQuery(changelogQuery(params.changelogSlug))
    if (!changelog) {
      throw notFound()
    }
  },
})

function RouteComponent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { changelogSlug } = useParams({ from: Route.fullPath });
  const { data: changelog } = useQuery(changelogQuery(changelogSlug));
  const { data: labels } = useQuery(changelogLabelsQuery);

  const [changelogData, setChangelogData] = useState<{
    title: string
    description: string
    tags: ('NEW' | 'IMPROVED' | 'FIXED')[]
    labels: {
      id: string
      name: string
    }[]
    linkedFeedbacks: {
      id: string
      title: string
      status: keyof typeof FeedbackStatusConfig
      board: { slug: string }
      votes: number
    }[]
  }>(changelog ?? {
    title: '',
    description: '',
    tags: [],
    labels: [],
    linkedFeedbacks: [],
  });

  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const showSaved = useCallback(() => {
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 3000);
  }, []);

  const { mutate: updateChangelog, isPending } = useUpdateChangelogMutation({
    onMutate: (variables) => {
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
          ...variables,
        }
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
            changelogs: page.changelogs?.map(changelog => changelog.slug === changelogSlug ? {
              ...changelog,
              ...variables,
              labels: variables.labelIds?.map(id => ({
                id,
                name: labels?.find(label => label.id === id)?.name ?? ''
              }))
            } : changelog),
          })),
        }
      });

      showSaved();
      return { previousChangelog, previousChangelogs };
    },
    onError: (error, __, context) => {
      queryClient.setQueryData(changelogQuery(changelogSlug).queryKey, context?.previousChangelog);
      queryClient.setQueryData(changelogsInfiniteQuery({}).queryKey, context?.previousChangelogs);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: changelogQuery(changelogSlug).queryKey });
      queryClient.invalidateQueries({ queryKey: changelogsInfiniteQuery({}).queryKey });
    },
  });

  const { mutate: revertToDraft, isPending: isRevertingToDraft } = useUnpublishChangelogMutation({
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
          status: 'DRAFT' as const,
          publishedAt: null,
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
            changelogs: page.changelogs?.map(changelog => changelog.slug === changelogSlug ? { ...changelog, status: 'DRAFT' as const, publishedAt: null } : changelog),
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

  const titleChanged = useMemo(() => {
    return changelog?.title !== changelogData.title;
  }, [changelog, changelogData.title]);

  const descriptionChanged = useMemo(() => {
    return changelog?.description !== changelogData.description;
  }, [changelog, changelogData.description]);

  const tagsChanged = useMemo(() => {
    return changelog?.tags?.length !== changelogData.tags.length || changelog?.tags?.some(tag => !changelogData.tags.includes(tag));
  }, [changelog, changelogData.tags]);

  const labelsChanged = useMemo(() => {
    return changelog?.labels?.length !== changelogData.labels.length || changelog?.labels?.some(label => !changelogData.labels.includes(label));
  }, [changelog, changelogData.labels]);

  const feedbacksChanged = useMemo(() => {
    return changelog?.linkedFeedbacks?.length !== changelogData.linkedFeedbacks.length || changelog?.linkedFeedbacks?.some(feedback => !changelogData.linkedFeedbacks.includes(feedback));
  }, [changelog, changelogData.linkedFeedbacks]);

  useEffect(() => {
    if (changelog?.status === 'PUBLISHED') return;

    const timer = setTimeout(() => {
      updateChangelog({
        title: changelogData.title,
        description: changelogData.description,
        tags: changelogData.tags,
        labelIds: changelogData.labels.map(label => label.id),
        feedbackIds: changelogData.linkedFeedbacks.map(feedback => feedback.id),
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [changelogData, updateChangelog]);

  useEffect(() => {
    if (changelog && changelogData.title === '') {
      setChangelogData(changelog);
    }
  }, [changelog]);

  return (
    <div className="pt-18 grid grid-cols-[minmax(200px,250px)_1fr_1fr] w-full h-full max-h-full">
      <div className="col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0">
        <div className="vertical">
          <Controls
            types={changelogData.tags}
            onTypeChange={(value) => setChangelogData({ ...changelogData, tags: value })}
            labels={changelogData.labels}
            onLabelChange={(value) => setChangelogData({ ...changelogData, labels: value })}
            feedbacks={changelogData.linkedFeedbacks}
            onFeedbackChange={(value) => setChangelogData({ ...changelogData, linkedFeedbacks: value })}
          />
        </div>
      </div>
      <div className='vertical border-l min-w-[400px] p-8 gap-4 overflow-y-auto bg-white dark:bg-zinc-900 z-10' style={{ transform: 'translate3d(0, 0, 0)' }}>
        {changelog && <ChangelogContent changelog={changelogData} status={changelog.status} publishedAt={changelog.publishedAt} />}
      </div>
      <div className='vertical border-l min-w-[400px]'>
        <ChangelogEditor
          title={changelogData.title}
          onChangeTitle={(value) => setChangelogData({ ...changelogData, title: value })}
          content={changelogData.description}
          onChangeContent={(value) => setChangelogData({ ...changelogData, description: value })}
        />
        <div className='horizontal center-v gap-0 p-4 border-t'>
          {isPending && (
            <span className='horizontal center-v gap-2 text-sm text-gray-500 dark:text-zinc-500'>
              <LoadingSpinner className='stroke-zinc-500 dark:stroke-zinc-400' />
              Saving draft...
            </span>
          )}
          {!isPending && showSavedMessage && (
            <span className='horizontal gap-2 center-v text-sm text-gray-500 dark:text-zinc-500'>
              Saved just now
            </span>
          )}
          {changelog?.status === 'DRAFT' && <Button
            disabled={isPending}
            className='ml-auto rounded-r-none border-r'
            onClick={() => router.navigate({ to: '/admin/changelog/$changelogSlug/edit/publish', params: { changelogSlug: changelog.slug } })}
          >
            Publish
          </Button>}
          {changelog?.status === 'DRAFT' && <Button
            disabled
            className='rounded-l-none'
          >
            <Icons.CalendarClock />
          </Button>
          }
          {changelog?.status === 'PUBLISHED' && changelog?.publishedAt && (
            (titleChanged || descriptionChanged || tagsChanged || labelsChanged || feedbacksChanged) ? (
              <Button
                disabled={isPending}
                className='ml-auto'
                onClick={() => updateChangelog({
                  title: changelogData.title,
                  description: changelogData.description,
                  tags: changelogData.tags,
                  labelIds: changelogData.labels.map(label => label.id),
                  feedbackIds: changelogData.linkedFeedbacks.map(feedback => feedback.id),
                })}
              >
                Publish edits
              </Button>
            ) : (
              <div className='horizontal center-v gap-2 ml-auto'>
                <span className='text-sm text-gray-500 dark:text-zinc-500'>
                  Published: {DateTime.fromJSDate(new Date(changelog.publishedAt)).toFormat('HH:mma on MMM d, yyyy')}
                </span>
                <Button
                  color='secondary'
                  variant='link'
                  size='sm'
                  isLoading={isRevertingToDraft}
                  onClick={() => revertToDraft()}
                >
                  Revert to draft
                </Button>
              </div>)
          )}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
