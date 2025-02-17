import { Button, Icons, Input } from '@/components';
import { RoadmapMenu } from '@/components/admin/roadmap/roadmap-menu';
import { SelectComponent } from '@/components/select';
import { useCreateRoadmapMutation, useDuplicateRoadmapMutation } from '@/lib/mutation';
import { roadmapsQuery } from '@/lib/query';
import { useDebounce } from '@paulgeorge35/hooks';
import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, Link, Outlet, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

const numberFilterSchema = z.object({
  operator: z.enum(['gt', 'lt', 'equals', 'not_equals']).optional(),
  value: z.coerce.number().optional(),
})

const filterRoadmapItemsSchema = z.object({
  groupBy: z.enum(['board', 'category', 'owner', 'status']).optional(),
  boards: z.union([z.array(z.string()), z.string()]).optional(),
  categories: z.union([z.array(z.string()), z.string()]).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  impact: numberFilterSchema.optional(),
  effort: numberFilterSchema.optional(),
  votes: numberFilterSchema.optional(),
  statuses: z.union([z.array(z.enum(['OPEN', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])), z.enum(['OPEN', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])]).optional(),
  eta_start: z.string().optional(),
  eta_end: z.string().optional(),
  search: z.string().optional()
})

export const Route = createFileRoute('/admin/roadmap')({
  validateSearch: zodValidator(filterRoadmapItemsSchema),
  context: () => {
    const queryClient = new QueryClient();
    return {
      queryClient,
    }
  },
  loader: async ({ context }) => {
    const queryClient = context.queryClient;
    const roadmaps = await queryClient.fetchQuery(roadmapsQuery);
    return roadmaps;
  },
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter();
  const search = useSearch({ from: Route.fullPath });
  const [searchQuery, setSearchQuery] = useState(search.search);
  const debouncedSearch = useDebounce(searchQuery, {
    delay: 200,
  });

  const roadmaps = getRouteApi(Route.fullPath).useLoaderData();
  const { roadmapSlug } = useParams({ strict: false });
  const { mutate: createRoadmap, isPending: isCreatingRoadmap } = useCreateRoadmapMutation();
  const { mutate: duplicateRoadmap, isPending: isDuplicatingRoadmap } = useDuplicateRoadmapMutation(roadmapSlug);

  const groupBy = useMemo(() => {
    if (search.groupBy) {
      return search.groupBy;
    }
    return undefined;
  }, [search]);

  useEffect(() => {
    if (roadmaps.length > 0) {
      if (roadmapSlug) {
        if (roadmaps.find(roadmap => roadmap.slug === roadmapSlug)) {
          return;
        }
      }
      router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug: roadmaps[0].slug }, search });
    }
  }, [roadmaps, router, roadmapSlug]);

  useEffect(() => {
    if (debouncedSearch.value !== undefined) {
      if (roadmapSlug && search.search !== debouncedSearch.value) {
        router.navigate({
          to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug }, search: {
            ...search, search: debouncedSearch.value.length > 0 ? debouncedSearch.value : undefined,
          }
        });
        if (debouncedSearch.value.length === 0) {
          setSearchQuery(undefined);
        }
      }
    }
  }, [debouncedSearch, router, search]);

  if (roadmaps.length === 0) {
    return (
      <div className='pt-18 w-full h-full horizontal center'>
        <div className='vertical gap-2 center'>
          <h1 className='text-2xl font-bold'>No roadmaps found</h1>
          <p className='text-gray-500'>Create a new roadmap to get started</p>
          <Button isLoading={isCreatingRoadmap} onClick={() => createRoadmap('New Roadmap')}>Create Roadmap</Button>
        </div>
      </div>
    )
  }

  return (
    <div className='pt-18 w-full h-full vertical'>
      <div className='horizontal center-v gap-2 p-4 border-b'>
        <SelectComponent
          className='w-50 h-9'
          checkMarks
          value={roadmapSlug}
          options={roadmaps?.map((roadmap) => ({ label: roadmap.name, value: roadmap.slug })) ?? []}
          onChange={(value) => {
            if (value)
              router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug: value }, search });
          }}
          disabled={isDuplicatingRoadmap || isCreatingRoadmap}
        />
        <RoadmapMenu
          disabled={isDuplicatingRoadmap || isCreatingRoadmap}
          onRename={() => {
            if (roadmapSlug)
              router.navigate({ to: '/admin/roadmap/$roadmapSlug/rename', params: { roadmapSlug }, search });
          }}
          onDuplicate={() => {
            if (roadmapSlug)
              duplicateRoadmap();
          }}
          onDelete={roadmaps.length > 1 ? () => {
            if (roadmapSlug)
              router.navigate({ to: '/admin/roadmap/$roadmapSlug/delete', params: { roadmapSlug }, search });
          } : undefined}
        />
        <div className='h-5 border-l hidden md:block' />
        <Input
          className='w-70 h-9 hidden md:flex'
          placeholder='Search...'
          value={searchQuery ?? ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={!roadmapSlug}
          addornmentLeft={<Icons.Search className='size-4 shrink-0 mr-2' />}
        />
        {roadmapSlug && <Link to="/admin/roadmap/$roadmapSlug/filter" params={{ roadmapSlug }} search={search} className='ml-auto'>
          <Button role='button' id='filter-button' className='h-9 px-4 gap-4 hidden md:flex' variant='outline' size='sm' color='secondary'>
            <Icons.Filter />
            Filters
          </Button>
        </Link>}
        {roadmapSlug && <SelectComponent
          className='w-50 h-9 hidden md:flex'
          placeholder='Group by'
          value={groupBy ?? ''}
          options={['board', 'category', 'owner', 'status'].map((group) => ({ label: group.charAt(0).toUpperCase() + group.slice(1), value: group }))}
          onChange={(value) => {
            router.navigate({
              to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug }, search: {
                ...search, groupBy: value as 'board' | 'category' | 'owner' | 'status',
              }
            });
          }}
        />}
        {roadmapSlug && search.groupBy && (
          <Icons.X role='button' className='size-4 shrink-0 cursor-pointer'
            onClick={() => {
              router.navigate({
                to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug },
                search: {
                  ...search, groupBy: undefined,
                }
              });
            }}
          />
        )}
        <div className='h-5 border-l hidden md:block' />
        {roadmapSlug && <Link to="/admin/roadmap/$roadmapSlug/new" params={{ roadmapSlug }} search={search}>
          <Button className='h-8 hidden md:flex' size='sm'>
            <Icons.Plus />
            Create Feedback
          </Button>
        </Link>}
      </div>
      <div className='relative grow'>
        <Outlet />
      </div>
    </div>
  )
}
