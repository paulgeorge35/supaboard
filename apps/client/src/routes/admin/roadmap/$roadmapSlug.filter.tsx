import { Button, Icons, Input } from '@/components';
import { ComboSelect } from '@/components/combo-select';
import { DateRangeSelector } from '@/components/date-range-selector';
import { SelectComponent } from '@/components/select';
import { Switch } from '@/components/switch';
import { applicationBoardsQuery, ApplicationBoardsQueryData, membersQuery } from '@/lib/query';
import { cn, FeedbackStatusConfig } from '@/lib/utils';
import { RoadmapField, useRoadmapStore } from '@/stores/roadmap-store';
import { useBoolean } from '@paulgeorge35/hooks';
import { MemberSummary } from '@repo/database';
import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { categoriesQuery, CategorySummary } from '../settings/boards.$boardSlug.categories';
import { tagsQuery, TagSummary } from '../settings/boards.$boardSlug.tags';

export const Route = createFileRoute('/admin/roadmap/$roadmapSlug/filter')({
  context: () => {
    const queryClient = new QueryClient();
    return {
      queryClient,
    }
  },
  loader: async ({ context }) => {
    const queryClient = context.queryClient;
    const boards = await queryClient.fetchQuery(applicationBoardsQuery);
    const categories = await queryClient.fetchQuery(categoriesQuery(boards[0].slug, undefined, true));
    const tags = await queryClient.fetchQuery(tagsQuery(boards[0].slug, undefined, true));
    const members = await queryClient.fetchQuery(membersQuery);
    return { boards, categories, tags, members };
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { boards, categories, tags, members } = getRouteApi(Route.fullPath).useLoaderData();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const search = useSearch({ from: Route.fullPath });
  const filterButton = document.getElementById('filter-button');

  const handleClickOutside = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node) && !filterButton?.contains(e.target as Node)) {
      router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug }, search, replace: true });
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    }
  }, [handleClickOutside]);

  return (
    <div ref={ref} className='z-10 h-full w-86 bg-white dark:bg-zinc-900 border-l shadow-lg overflow-y-auto'>
      <div className='p-4 border-b sticky top-0 bg-white dark:bg-zinc-900 z-10'>
        <h1 className='font-light'>Filters</h1>
      </div>
      <FilterGroup label='Default fields'>
        <BoardField boards={boards} />
        <DateField />
        <OwnerField members={members} />
        <StatusField />
        <CategoryField categories={categories} />
        <TagField tags={tags} />
      </FilterGroup>
      <FilterGroup label='Performance fields'>
        <NumberField label='Impact' value='impact' Icon={Icons.Sigma} />
        <NumberField label='Votes' value='votes' Icon={Icons.Sigma} />
        <NumberField label='Effort' value='effort' Icon={Icons.Sigma} />
      </FilterGroup>
    </div>
  )
}

type FilterGroupProps = {
  label: string;
  children?: React.ReactNode;
}

const FilterGroup = ({ label, children }: FilterGroupProps) => {
  const expanded = useBoolean(true);

  return (
    <div className={cn('px-4 vertical gap-2', {
      'pb-4': expanded.value
    })}>
      <span className='horizontal space-between center-v py-2 pr-1'>
        <h1 className='text-xs uppercase font-bold text-zinc-800 dark:text-zinc-400'>{label}</h1>
        <Button size='icon' variant='ghost' className='size-6' onClick={expanded.toggle}>
          <Icons.ChevronUp className={cn('size-4 shrink-0 transition-transform duration-100', {
            'rotate-180': expanded.value
          })} />
        </Button>
      </span>
      {expanded.value && children}
    </div>
  )
}

type FieldVisibility = {
  label: string;
  value: 'board' | 'category' | 'status' | 'tags' | 'owner' | 'estimatedDelivery' | 'impact' | 'votes' | 'effort';
  Icon?: React.ElementType;
}

const resetFilter = (value: FieldVisibility['value'], roadmapSlug: string, search: ReturnType<typeof useSearch>, router: ReturnType<typeof useRouter>) => {
  if (value === 'estimatedDelivery') {
    router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, eta_start: undefined, eta_end: undefined }, replace: true });
    return;
  }
  router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, [value]: undefined }, replace: true });
}

const FieldVisibility = ({ label, value, Icon }: FieldVisibility) => {
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const search = useSearch({ from: Route.fullPath });
  const { visibleFields, setVisibleFields, isField } = useRoadmapStore((state) => state);

  if (!isField(value)) return null;
  const isVisible = useMemo(() => visibleFields.includes(value as RoadmapField), [visibleFields, value]);

  const handleChange = useCallback(() => {
    if (isVisible) {
      setVisibleFields(visibleFields.filter((field) => field !== value));
    } else {
      setVisibleFields([...visibleFields, value as RoadmapField]);
    }
    resetFilter(value, roadmapSlug, search, router);
  }, [isVisible, visibleFields, setVisibleFields, value, roadmapSlug, search, router]);

  return (
    <div className='horizontal space-between center-v py-2'>
      <h1 className='text-sm font-light text-zinc-800 dark:text-zinc-200 horizontal gap-2 center-v'>
        {label}
        {Icon && <Icon className='size-5.5 stroke-gray-500 dark:stroke-zinc-500 bg-gray-100 dark:bg-zinc-800 rounded-full p-1 shrink-0' />}
      </h1>
      <Switch name={`${value}-visible`} checked={isVisible} onChange={handleChange} size='small' />
    </div>
  )
}

type NumberFieldProps = FieldVisibility & {
  value: 'impact' | 'votes' | 'effort';
}

const NumberField = ({ label, value, Icon }: NumberFieldProps) => {
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const search = useSearch({ from: Route.fullPath });
  const options = [
    { label: 'Greater than', value: 'gt' },
    { label: 'Less than', value: 'lt' },
    { label: 'Equals', value: 'equals' },
    { label: 'Not equals', value: 'not_equals' },
  ]

  const operator = useMemo(() => search[value]?.operator, [search, value]);
  const onChangeOperator = useCallback((filterOperator: string) => {
    router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, [value]: { operator: filterOperator, value: search[value]?.value } }, replace: true });
  }, [router, search, value]);

  const onChangeValue = useCallback((filterValue: string) => {
    router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, [value]: { operator: operator, value: filterValue } }, replace: true });
  }, [router, search, value, operator]);
  const { visibleFields, isField } = useRoadmapStore((state) => state);

  if (!isField(value)) return null;
  const isVisible = useMemo(() => visibleFields.includes(value as RoadmapField), [visibleFields, value]);

  return (
    <div className='vertical gap-2'>
      <FieldVisibility label={label} value={value} Icon={Icon} />
      {isVisible && <SelectComponent
        name={`${value}-operator`}
        placeholder='All'
        options={options}
        className='h-9'
        value={operator}
        onChange={(value) => onChangeOperator(value as string)}
      />}
      {operator &&
        <Input
          name={`${value}-value`}
          type='number'
          placeholder='Value'
          className='h-9'
          value={search[value]?.value ?? 0}
          onChange={(e) => onChangeValue(e.target.value)}
        />}
      {operator &&
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            resetFilter(value, roadmapSlug, search, router);
          }}
          className='text-xs font-light ml-auto text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors duration-100'
        >
          Clear
        </button>
      }
    </div>
  )
}

type BoardFieldProps = {
  boards: ApplicationBoardsQueryData;
}

const BoardField = ({ boards }: BoardFieldProps) => {
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const visibleFields = useRoadmapStore((state) => state.visibleFields);
  const search = useSearch({ from: Route.fullPath });

  const isVisible = useMemo(() => visibleFields.includes('board' as RoadmapField), [visibleFields]);

  const options = useMemo(() => boards.map((board) => ({ label: board.name, value: board.slug })), [boards]);
  const selectedBoards = useMemo(() => search.board ? (Array.isArray(search.board) ? search.board : [search.board]) : [], [search]);
  return (
    <div className='vertical gap-2'>
      <FieldVisibility label='Board' value='board' />
      {isVisible && <ComboSelect
        name='board'
        placeholder='All boards'
        selectionMode='multiple'
        options={options}
        className='min-h-9'
        value={selectedBoards}
        onChange={(value) => {
          router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, board: value.length > 0 ? value : undefined }, replace: true });
        }}
      />}
    </div>
  )
}

type CategoryFieldProps = {
  categories: CategorySummary[];
}

const CategoryField = ({ categories }: CategoryFieldProps) => {
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const visibleFields = useRoadmapStore((state) => state.visibleFields);
  const search = useSearch({ from: Route.fullPath });

  const isVisible = useMemo(() => visibleFields.includes('category' as RoadmapField), [visibleFields]);
  const options = useMemo(() => categories.map((category) => ({ label: category.name, value: category.slug })), [categories]);
  const selectedCategories = useMemo(() => search.category ? (Array.isArray(search.category) ? search.category : [search.category]) : [], [search]);

  return (
    <div className='vertical gap-2'>
      <FieldVisibility label='Category' value='category' />
      {isVisible && <ComboSelect
        name='category'
        placeholder='All categories'
        selectionMode='multiple'
        options={options}
        className='min-h-9'
        value={selectedCategories}
        onChange={(value) => {
          router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, category: value.length > 0 ? value : undefined }, replace: true });
        }}
      />}
    </div>
  )
}

type StatusType = keyof typeof FeedbackStatusConfig;

const StatusField = () => {
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const visibleFields = useRoadmapStore((state) => state.visibleFields);
  const search = useSearch({ from: Route.fullPath });

  const isVisible = useMemo(() => visibleFields.includes('status' as RoadmapField), [visibleFields]);
  const options = Object.keys(FeedbackStatusConfig).map((status) => ({ label: FeedbackStatusConfig[status as StatusType].label, value: status }));
  const selectedStatuses = useMemo(() => search.status ? (Array.isArray(search.status) ? search.status : [search.status]) : [], [search]);

  return (
    <div className='vertical gap-2'>
      <FieldVisibility label='Status' value='status' />
      {isVisible && <ComboSelect
        name='status'
        placeholder='All statuses'
        selectionMode='multiple'
        options={options}
        className='min-h-9'
        value={selectedStatuses}
        onChange={(value) => {
          router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, status: value.length > 0 ? value as StatusType[] : undefined }, replace: true });
        }}
      />}
    </div>
  )
}

type TagFieldProps = {
  tags: TagSummary[];
}

const TagField = ({ tags }: TagFieldProps) => {
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const visibleFields = useRoadmapStore((state) => state.visibleFields);
  const search = useSearch({ from: Route.fullPath });

  const isVisible = useMemo(() => visibleFields.includes('tags' as RoadmapField), [visibleFields]);
  const options = useMemo(() => tags.map((tag) => ({ label: tag.name, value: tag.name })), [tags]);
  const selectedTags = useMemo(() => search.tags ? (Array.isArray(search.tags) ? search.tags : [search.tags]) : [], [search]);

  return (
    <div className='vertical gap-2'>
      <FieldVisibility label='Tags' value='tags' />
      {isVisible && <ComboSelect
        name='tags'
        placeholder='All tags'
        selectionMode='multiple'
        options={options}
        className='min-h-9'
        value={selectedTags}
        onChange={(value) => {
          router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, tags: value.length > 0 ? value : undefined }, replace: true });
        }}
      />}
    </div>
  )
}

type OwnerFieldProps = {
  members: MemberSummary[];
}

const OwnerField = ({ members }: OwnerFieldProps) => {
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const visibleFields = useRoadmapStore((state) => state.visibleFields);
  const search = useSearch({ from: Route.fullPath });

  const isVisible = useMemo(() => visibleFields.includes('owner' as RoadmapField), [visibleFields]);
  const options = useMemo(() => members.map((member) => ({ label: member.user.name, value: member.user.id })), [members]);
  const selectedOwners = useMemo(() => search.owner ? (Array.isArray(search.owner) ? search.owner : [search.owner]) : [], [search]);

  return (
    <div className='vertical gap-2'>
      <FieldVisibility label='Owner' value='owner' />
      {isVisible && <ComboSelect
        name='owner'
        placeholder='All owners'
        selectionMode='multiple'
        options={options}
        className='min-h-9'
        value={selectedOwners}
        onChange={(value) => {
          router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, owner: value.length > 0 ? value : undefined }, replace: true });
        }}
      />}
    </div>
  )
}

const DateField = () => {
  const router = useRouter();
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const visibleFields = useRoadmapStore((state) => state.visibleFields);
  const search = useSearch({ from: Route.fullPath });

  const isVisible = useMemo(() => visibleFields.includes('estimatedDelivery' as RoadmapField), [visibleFields]);

  const handleChange = (range: { start?: Date, end?: Date }) => {
    router.navigate({ to: '/admin/roadmap/$roadmapSlug/filter', params: { roadmapSlug }, search: { ...search, eta_start: range.start ? DateTime.fromJSDate(range.start).toFormat('yyyy-MM-dd') : undefined, eta_end: range.end ? DateTime.fromJSDate(range.end).toFormat('yyyy-MM-dd') : undefined }, replace: true });
  }

  return (
    <div className='vertical gap-2'>
      <FieldVisibility label='ETA' value='estimatedDelivery' />
      {isVisible && <DateRangeSelector
        onChange={handleChange}
        triggerClassName="w-full h-9 hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200 cursor-pointer"
        range={
          {
            start: search.eta_start ? DateTime.fromFormat(search.eta_start, 'yyyy-MM-dd').set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate() : undefined,
            end: search.eta_end ? DateTime.fromFormat(search.eta_end, 'yyyy-MM-dd').set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate() : undefined
          }
        }
      />}
    </div>
  )
}