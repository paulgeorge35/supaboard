import { Skeleton } from '@/components/skeleton';
import { useAddNewRoadmapItemMutation, useUpdateRoadmapItemMutation } from '@/lib/mutation/roadmap';
import { applicationBoardsQuery } from '@/lib/query';
import type { RoadmapDetailResponse } from '@/lib/query/roadmap';
import { cn } from '@/lib/utils';
import { Route } from '@/routes/admin/roadmap/$roadmapSlug';
import { RoadmapField, useRoadmapStore } from '@/stores/roadmap-store';
import { useFocus, useMediaQuery, useNumber } from '@paulgeorge35/hooks';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useRouter, useSearch } from '@tanstack/react-router';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  Table,
  useReactTable
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useState } from 'react';
import { Avatar } from './avatar';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Icons } from './icons';
import { Input } from './input';
import { SelectComponent } from './select-v2';
import { StatusBadge } from './status-badge';
import { Tooltip } from './tooltip-content';

type RoadmapItem = RoadmapDetailResponse['items'][0];

const columnHelper = createColumnHelper<RoadmapItem>();

const formatNumber = (number: number) => {
  if (number >= 1000) {
    return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k`;
  }
  return number;
}

const weights = {
  impact: 1,
  votes: 1,
  effort: 1
};

// Define regular filter functions instead of using hooks at the module level
const numberFilter = (value: number, operator?: string, filterValue?: number) => {
  if (!operator || !filterValue) return true;
  if (operator === 'gt') return value > filterValue;
  if (operator === 'lt') return value < filterValue;
  if (operator === 'equals') return value === filterValue;
  if (operator === 'not_equals') return value !== filterValue;
  return true;
};

const statusFilter = (value: string, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  return filterValue.includes(value);
};

const boardFilter = (value: string, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  return filterValue.includes(value);
};

const categoryFilter = (value: string, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  return filterValue.includes(value);
};

const ownerFilter = (value: string, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  return filterValue.includes(value);
};

const tagFilter = (value: string[], filterValue: string[]) => {
  if (!filterValue?.length) return true;
  return filterValue.some(tag => value.includes(tag));
};

const dateFilter = (value: Date | null, filterValue: string, operator?: 'gte' | 'lte') => {
  if (!filterValue) return true;
  if (!value) return false;
  if (operator === 'gte') return new Date(value) >= new Date(filterValue);
  if (operator === 'lte') return new Date(value) <= new Date(filterValue);
  return false;
};

const getTotalScore = (table: Table<RoadmapItem>) => {
  const allItems = table.getRowModel().rows.map(row => row.original);
  const maxVotes = Math.max(...allItems.map(item => item.votes));

  const scores = allItems.map(item => {
    const voteScore = maxVotes ? (item.votes / maxVotes) * 100 : 0;
    return item.effort > 0 ? Math.round(
      1000 * (
        (Math.pow(item.impact, 2) * weights.impact) +
        (voteScore * weights.votes)
      ) / (item.effort * weights.effort)
    ) : 0;
  });
  return scores.reduce((a, b) => a + b, 0);
}

type ColumnProps = {
  checkedItems: string[];
  setCheckedItems: (items: string[]) => void;
  isMobile: boolean;
  maxVotes: number;
  roadmapSlug: string;
}

// Create separate components for cells that use hooks
const ImpactCell = React.memo(({ value, feedbackId, roadmapSlug }: { value: number; feedbackId: string; roadmapSlug: string }) => {
  const impact = useNumber(value, { min: 0, max: 10, step: 1 });
  const [inputRef, isFocused] = useFocus<HTMLInputElement>({
    onBlur: () => {
      if (impact.value !== value) {
        updateRoadmapItem({ feedbackId, impact: impact.value });
      }
    },
    onFocus: () => {
      inputRef.current?.select();
    }
  });
  const { mutate: updateRoadmapItem } = useUpdateRoadmapItemMutation(roadmapSlug);
  
  return (
    <div className='relative'>
      <Input
        readOnly={!isFocused}
        ref={inputRef}
        value={impact.value}
        type='number'
        className='w-fit border-none px-0'
        onChange={(e) => impact.setValue(parseFloat(e.target.value === '' ? '0' : e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateRoadmapItem({ feedbackId, impact: impact.value });
          }
        }}
      />
    </div>
  );
});

ImpactCell.displayName = 'ImpactCell';

const EffortCell = React.memo(({ value, feedbackId, roadmapSlug }: { value: number; feedbackId: string; roadmapSlug: string }) => {
  const effort = useNumber(value, { min: 1, max: 100, step: 1 });
  const [inputRef, isFocused] = useFocus<HTMLInputElement>({
    onBlur: () => {
      if (effort.value !== value) {
        updateRoadmapItem({ feedbackId, effort: effort.value });
      }
    },
    onFocus: () => {
      inputRef.current?.select();
    }
  });
  const { mutate: updateRoadmapItem } = useUpdateRoadmapItemMutation(roadmapSlug);
  
  return (
    <div className='relative'>
      <Input
        readOnly={!isFocused}
        ref={inputRef}
        value={effort.value}
        type='number'
        className='w-fit border-none px-0'
        onChange={(e) => effort.setValue(parseFloat(e.target.value === '' ? '0' : e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateRoadmapItem({ feedbackId, effort: effort.value });
          }
        }}
      />
    </div>
  );
});

EffortCell.displayName = 'EffortCell';

const TitleCell = React.memo(({ 
  item, 
  isChecked, 
  index, 
  checkedItems, 
  setCheckedItems, 
  roadmapSlug 
}: { 
  item: RoadmapItem; 
  isChecked: boolean; 
  index: number; 
  checkedItems: string[]; 
  setCheckedItems: (items: string[]) => void; 
  roadmapSlug: string;
}) => {
  const router = useRouter();
  
  return (
    <div className='horizontal gap-4 center-v group'>
      <Checkbox
        wrapperClassName={cn('opacity-0 group-hover/title:opacity-100 transition-opacity', isChecked && 'opacity-100')}
        checked={isChecked}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onChange={(value) => {
          setCheckedItems(
            value.target.checked ?
              [...checkedItems, item.id] :
              checkedItems.filter(id => id !== item.id)
          )
        }}
      />
      <p className='text-gray-500 dark:text-zinc-400'>{index + 1}</p>
      <Link
        to='/admin/feedback/$boardSlug/$feedbackSlug'
        params={{ boardSlug: item.board.slug, feedbackSlug: item.slug }}
        className='w-full text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors hover:underline underline-offset-2'
      >
        {item.title}
      </Link>
      <button
        type='button'
        className='ml-auto opacity-0 group-hover/title:opacity-100 transition-opacity size-6 horizontal center cursor-pointer shrink-0'
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.navigate({ 
            to: '/admin/roadmap/$roadmapSlug/$boardSlug/$feedbackSlug/$feedbackId/remove', 
            params: { 
              roadmapSlug, 
              boardSlug: item.board.slug, 
              feedbackSlug: item.slug, 
              feedbackId: item.id 
            } 
          });
        }}
      >
        <Icons.X className='size-4' />
      </button>
    </div>
  );
});

TitleCell.displayName = 'TitleCell';

// Update the createColumns function to use the extracted components
const createColumns = ({ checkedItems, setCheckedItems, isMobile, maxVotes, roadmapSlug }: ColumnProps) => [
  columnHelper.accessor('title', {
    header: (info) => <div className='horizontal gap-4 center-v'>
      <Checkbox
        disabled={info.table.getRowModel().rows.length === 0}
        checked={checkedItems.length >= info.table.getRowModel().rows.length && info.table.getRowModel().rows.length > 0}
        indeterminate={checkedItems.length > 0 && checkedItems.length < info.table.getRowModel().rows.length}
        onChange={(value) => setCheckedItems(value.target.checked ? info.table.getRowModel().rows.map(row => row.original.id) : [])}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      <p className='text-gray-500 dark:text-zinc-400'>Posts ({info.table.getRowModel().rows.length})</p>
    </div>,
    cell: (info) => (
      <TitleCell
        item={info.row.original}
        isChecked={checkedItems.includes(info.row.original.id)}
        index={info.row.index}
        checkedItems={checkedItems}
        setCheckedItems={setCheckedItems}
        roadmapSlug={roadmapSlug}
      />
    ),
    enablePinning: true,
    enableResizing: true,
    enableHiding: false,
    minSize: isMobile ? 250 : 250,
    maxSize: isMobile ? 400 : 600,
    size: isMobile ? 350 : 600,
  }),
  columnHelper.accessor('estimatedDelivery', {
    header: 'ETA',
    cell: (info) => {
      const value = info.getValue();
      if (!value) return '-';
      const date = new Date(value);
      return DateTime.fromJSDate(date).toFormat('MMM yyyy')
    },
    enableResizing: true,
    minSize: isMobile ? 100 : 130,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 100 : 130,
  }),
  columnHelper.accessor('owner', {
    header: 'Owner',
    cell: (info) => {
      const owner = info.getValue();
      return owner ? (
        <Avatar
          src={owner.avatar ?? undefined}
          name={owner.name}
        />
      ) : null;
    },
    enableResizing: true,
    minSize: isMobile ? 100 : 130,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 100 : 130,
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => info.getValue()?.name ?? '-',
    enableResizing: true,
    minSize: isMobile ? 100 : 130,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 100 : 130,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue().slug} variant='text' />,
    enableResizing: true,
    minSize: isMobile ? 100 : 130,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 100 : 130,
  }),
  columnHelper.accessor('tags', {
    header: 'Tags',
    cell: (info) => info.getValue().join(', ') || '-',
    enableResizing: true,
    minSize: isMobile ? 100 : 130,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 100 : 130,
  }),
  columnHelper.accessor('board', {
    header: 'Board',
    cell: (info) => info.getValue().name,
    enableResizing: true,
    minSize: isMobile ? 100 : 130,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 100 : 130,
  }),
  columnHelper.accessor('impact', {
    header: 'Impact',
    cell: (info) => (
      <ImpactCell 
        value={info.getValue()} 
        feedbackId={info.row.original.id} 
        roadmapSlug={roadmapSlug} 
      />
    ),
    enableResizing: true,
    minSize: isMobile ? 100 : 130,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 100 : 130,
    meta: {
      alwaysShowLeftBorder: true,
    }
  }),
  columnHelper.accessor('votes', {
    header: 'Votes',
    cell: (info) => info.getValue(),
    enableResizing: true,
    minSize: isMobile ? 100 : 130,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 100 : 130,
  }),
  columnHelper.accessor('effort', {
    header: 'Effort',
    cell: (info) => (
      <EffortCell 
        value={info.getValue()} 
        feedbackId={info.row.original.id} 
        roadmapSlug={roadmapSlug} 
      />
    ),
    enableResizing: true,
    minSize: isMobile ? 100 : 130,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 100 : 130,
    meta: {
      alwaysShowLeftBorder: true,
    }
  }),
  columnHelper.accessor((row) => {
    return row.effort > 0 ? Math.round(
      1000 * (
        (Math.pow(row.impact, 2) * weights.impact) +
        (maxVotes ? (row.votes / maxVotes) * 100 : 0 * weights.votes)
      ) / (row.effort * weights.effort)
    ) : 0;
  }, {
    id: 'score',
    header: 'Score',
    cell: (info) => {
      return (
        <span className='text-[var(--color-primary)] text-xs font-bold bg-[var(--color-primary)]/10 rounded-full size-10 horizontal center'>
          {formatNumber(info.getValue())}
        </span>
      )
    },
    enablePinning: true,
    enableHiding: false,
    enableResizing: true,
    minSize: isMobile ? 130 : 150,
    maxSize: isMobile ? 150 : 600,
    size: isMobile ? 130 : 150,
  }),
];

interface RoadmapTableProps {
  items?: RoadmapItem[];
}

const RoadmapTableSkeleton = React.memo(function RoadmapTableSkeleton() {
  return (
    <div className="w-full border border-t-0">
      <div className="relative w-full overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              {Array.from({ length: 11 }).map((_, i) => (
                <th
                  key={i}
                  className={cn(
                    'text-xs px-4 py-4 text-left bg-white dark:bg-zinc-900 relative',
                    i === 0 && 'sticky left-0 z-20 border-r border-r-gray-200 dark:border-r-zinc-800',
                    i === 10 && 'sticky right-0 z-20 border-l border-l-gray-200 dark:border-l-zinc-800',
                  )}
                  style={{
                    width: i === 0 ? 400 : i === 10 ? 150 : 200,
                    position: (i === 0 || i === 10) ? 'sticky' : undefined,
                  }}
                >
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-b-0">
                {Array.from({ length: 11 }).map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      'px-4 py-2 bg-white dark:bg-zinc-900',
                      colIndex === 0 && 'sticky left-0 z-20 border-r border-r-gray-200 dark:border-r-zinc-800',
                      colIndex === 10 && 'sticky right-0 z-20 border-l border-l-gray-200 dark:border-l-zinc-800',
                    )}
                    style={{
                      width: colIndex === 0 ? 400 : colIndex === 10 ? 150 : 200,
                      position: (colIndex === 0 || colIndex === 10) ? 'sticky' : undefined,
                    }}
                  >
                    {colIndex === 0 ? (
                      <div className="horizontal gap-4">
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ) : colIndex === 2 ? (
                      <Skeleton className="h-8 w-8 rounded-full" />
                    ) : colIndex === 10 ? (
                      <Skeleton className="h-9 w-9 rounded-full mx-auto" />
                    ) : (
                      <Skeleton className="h-4 w-16" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const EmptyPlaceholder = React.memo(function EmptyPlaceholder() {
  return (
    <div className="w-full grow border border-t-0 vertical center">
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <Icons.PackageOpen className="size-12 text-gray-400 dark:text-zinc-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-1">
          No items yet
        </h3>
        <p className="text-gray-500 dark:text-zinc-400 max-w-sm">
          Items added to this roadmap will appear here.
        </p>
      </div>
    </div>
  );
});

type GroupedItems = Record<string, { expanded: boolean, items: RoadmapItem[] }>;

interface SelectionDockProps {
  selectedCount: number;
  onClear: () => void;
  selectedItems: RoadmapItem[];
}

const SelectionDock = React.memo(({ selectedCount, onClear, selectedItems }: SelectionDockProps) => {
  // Check if selected posts are from multiple boards
  const uniqueBoards = new Set(selectedItems.map(item => item.board.slug));
  const isMultipleBoards = uniqueBoards.size > 1;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-zinc-900 shadow-lg rounded-lg border border-gray-200 dark:border-zinc-800 px-4 py-2"
    >
      <div className="horizontal center gap-4">
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {selectedCount} {selectedCount === 1 ? 'post' : 'posts'} selected
        </p>
        <div className="h-4 w-[1px] bg-gray-200 dark:bg-zinc-800" />
        <div className="horizontal center gap-2">
          <Tooltip content={selectedCount === 1 ? "You must select at least two posts to merge." : "Merge selected posts"}>
            <span>
              <Button variant="outline" size="icon" disabled={selectedCount === 1}>
                <Icons.Merge className='size-4' />
              </Button>
            </span>
          </Tooltip>
          <Tooltip content="Add to roadmap">
            <Button variant="outline" size="icon">
              <Icons.Map className='size-4' />
            </Button>
          </Tooltip>
          <Tooltip content="Move to board">
            <Button variant="outline" size="icon">
              <Icons.ClipboardPaste className='size-4' />
            </Button>
          </Tooltip>
          <Tooltip content="Change owner">
            <Button variant="outline" size="icon">
              <Icons.User className='size-4' />
            </Button>
          </Tooltip>
          <Tooltip content={isMultipleBoards ? "You can only perform this action with posts from one board selected." : "Change category"}>
            <span>
              <Button variant="outline" size="icon" disabled={isMultipleBoards}>
                <Icons.LayoutGrid className='size-4' />
              </Button>
            </span>
          </Tooltip>
          <Tooltip content={isMultipleBoards ? "You can only perform this action with posts from one board selected." : "Add tags"}>
            <span>
              <Button variant="outline" size="icon" disabled={isMultipleBoards}>
                <Icons.Tag className='size-4' />
              </Button>
            </span>
          </Tooltip>
          <Tooltip content="Export">
            <Button variant="outline" size="icon">
              <Icons.Download className='size-4' />
            </Button>
          </Tooltip>
        </div>
        <div className="h-4 w-[1px] bg-gray-200 dark:bg-zinc-800" />
        <Button variant="ghost" size="icon" onClick={onClear}>
          <Icons.X className='size-4' />
        </Button>
      </div>
    </motion.div>
  );
});

SelectionDock.displayName = 'SelectionDock';

export function RoadmapTable({ items }: RoadmapTableProps) {
  const visibleFields = useRoadmapStore((state) => state.visibleFields);
  const { search, groupBy, impact, votes, effort, ...searchParams } = useSearch({ from: Route.fullPath });
  const [groupedItems, setGroupedItems] = useState<GroupedItems>({});
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const isMobile = useMediaQuery('(max-width: 768px)').matches;
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const [inputRef, isFocused] = useFocus<HTMLInputElement>();
  const [newRoadmapItemTitle, setNewRoadmapItemTitle] = useState<string | undefined>(undefined);
  const [newRoadmapItemBoard, setNewRoadmapItemBoard] = useState<string | undefined>(undefined);
  const { data: boards } = useQuery(applicationBoardsQuery);
  const { mutate: addNewRoadmapItem } = useAddNewRoadmapItemMutation(roadmapSlug);
  const [sorting, setSorting] = useState<SortingState>([{
    id: 'score',
    desc: true,
  }]);
  
  // Add state for column sizing to ensure responsive resizing
  const [columnSizing, setColumnSizing] = useState({});

  // Get visible fields with null check
  const visibleFieldsArray = visibleFields || [];
  
  // Calculate filtered fields once
  const filteredFields = visibleFieldsArray.filter((item: RoadmapField) => 
    !['title', 'score', 'impact', 'effort', 'votes'].includes(item)
  );
  const hasFilteredFields = filteredFields.length > 0;

  // Memoize the toggle group handler
  const toggleGroup = React.useCallback((group: string) => {
    setGroupedItems(prev => ({ ...prev, [group]: { ...prev[group], expanded: !prev[group].expanded } }));
  }, []);

  // Memoize the handler for adding a new roadmap item
  const handleAddNewRoadmapItem = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newRoadmapItemTitle && newRoadmapItemBoard && boards) {
      addNewRoadmapItem({ 
        title: newRoadmapItemTitle, 
        board: { 
          name: boards.find(board => board.slug === newRoadmapItemBoard)?.name ?? '', 
          slug: newRoadmapItemBoard 
        } 
      });
      setNewRoadmapItemTitle(undefined);
    }
  }, [newRoadmapItemTitle, newRoadmapItemBoard, boards, addNewRoadmapItem]);

  // Memoize the handler for clearing checked items
  const handleClearCheckedItems = React.useCallback(() => {
    setCheckedItems([]);
  }, []);

  useEffect(() => {
    if (boards && boards[0]) {
      setNewRoadmapItemBoard(boards[0].slug);
    }
  }, [boards]);

  // Memoize the grouping logic
  useEffect(() => {
    if (groupBy && items) {
      const newGroupedItems: GroupedItems = {};
      for (let item of items) {
        let group = 'Unknown';
        if (groupBy === 'board') {
          group = item.board.name;
        } else if (groupBy === 'category') {
          group = item.category?.name ?? 'Unknown';
        } else if (groupBy === 'owner') {
          group = item.owner?.name ?? 'Unknown';
        } else if (groupBy === 'status') {
          group = item.status.name;
        }
        newGroupedItems[group] = { 
          expanded: groupedItems[group]?.expanded ?? true, 
          items: [...(newGroupedItems[group]?.items ?? []), item] 
        };
      }
      setGroupedItems(newGroupedItems);
    }
    else {
      setGroupedItems({});
    }
  }, [items, groupBy]);

  const { status, board, category, owner, tags, eta_start, eta_end } = searchParams;

  // Memoize filtered items to avoid recalculation on every render
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => item.title.toLowerCase().includes(search?.toLowerCase() ?? '') &&
      numberFilter(item.impact, impact?.operator, impact?.value) &&
      numberFilter(item.votes, votes?.operator, votes?.value) &&
      numberFilter(item.effort, effort?.operator, effort?.value) &&
      statusFilter(item.status.slug, status as string[]) &&
      boardFilter(item.board.slug, board as string[]) &&
      categoryFilter(item.category?.slug ?? '', category as string[]) &&
      ownerFilter(item.owner?.id ?? '', owner as string[]) &&
      tagFilter(item.tags, tags as string[]) &&
      dateFilter(item.estimatedDelivery, eta_start as string, 'gte') &&
      dateFilter(item.estimatedDelivery, eta_end as string, 'lte')
    )
  }, [
    items, search, 
    impact, votes, effort, 
    status, board, category, owner, tags, 
    eta_start, eta_end
  ]);

  // Memoize the maximum votes value
  const maxVotes = useMemo(() => {
    return items?.reduce((max, item) => Math.max(max, item.votes), 0) ?? 0;
  }, [items]);

  // Memoize the columns configuration
  const columns = useMemo(() => {
    return createColumns({ 
      checkedItems, 
      setCheckedItems, 
      isMobile, 
      maxVotes,
      roadmapSlug
    });
  }, [checkedItems, setCheckedItems, isMobile, maxVotes, roadmapSlug]);

  // Create table instance at the top level (not inside useMemo)
  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    enableSorting: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    defaultColumn: {
      minSize: 80,
      maxSize: 1000,
    },
    enableHiding: true,
    columnResizeDirection: 'ltr',
    initialState: {
      columnPinning: {
        left: ['title'],
        right: ['score'],
      },
    }
  });

  // Memoize the selected items for the selection dock
  const selectedItems = useMemo(() => {
    return items?.filter(item => checkedItems.includes(item.id)) ?? [];
  }, [items, checkedItems]);

  // Memoize the total score calculation
  const totalScore = useMemo(() => {
    return getTotalScore(table);
  }, [table]);

  if (!items) {
    return <RoadmapTableSkeleton />;
  }

  if (items.length === 0) {
    return <EmptyPlaceholder />;
  }

  return (
    <>
      <div className="w-full border border-t-0">
        <div className="relative w-full overflow-auto">
          <table
            className="w-full border-collapse"
            style={{
              minWidth: table.getTotalSize(),
            }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => {
                    const isPinned = isMobile ? false : header.column.getIsPinned();
                    const alwaysShowLeftBorder = header.column.columnDef.meta && 'alwaysShowLeftBorder' in header.column.columnDef.meta ? true : false;
                    const isVisible = visibleFieldsArray.includes(header.column.id as RoadmapField);

                    if (!isVisible) {
                      return null;
                    }

                    return (
                      <th
                        key={header.id}
                        style={{
                          width: header.getSize(),
                          position: isPinned ? 'sticky' : undefined,
                        }}
                        className={cn(
                          '[&>*]:text-xs [&>*]:text-gray-500 [&>*]:dark:text-zinc-400 [&>*]:uppercase [&>*]:font-medium px-4 py-4 text-left bg-white dark:bg-zinc-900 relative',
                          'group',
                          isPinned && 'z-20',
                          isPinned === 'left' && [
                            'left-0',
                            'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-gray-200 dark:after:bg-zinc-800',
                            'bg-white dark:bg-zinc-900'
                          ],
                          isPinned === 'right' && [
                            'right-0',
                            'after:absolute after:left-0 after:top-0 after:h-full after:w-[3px] after:bg-gray-200 dark:after:bg-zinc-800',
                            'bg-white dark:bg-zinc-900'
                          ],
                        )}
                      >
                        <div
                          className='horizontal center-v gap-2 cursor-pointer'
                          onClick={() => header.column.toggleSorting()}
                        >
                          {header.column.id === 'title' ? (
                            <div className='horizontal gap-4 center-v' onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                disabled={table.getRowModel().rows.length === 0}
                                checked={checkedItems.length > 0 && checkedItems.length >= table.getRowModel().rows.length}
                                indeterminate={checkedItems.length > 0 && checkedItems.length < table.getRowModel().rows.length}
                                onChange={(value) => setCheckedItems(value.target.checked ? table.getRowModel().rows.map(row => row.original.id) : [])}
                              />
                              <p className='text-gray-500 dark:text-zinc-400'>Posts ({table.getRowModel().rows.length})</p>
                            </div>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}
                          {header.column.getCanSort() && header.column.id !== 'title' && (
                            header.column.getIsSorted() ? (
                              header.column.getIsSorted() === 'asc' ? (
                                <Icons.ArrowUp className='size-4 shrink-0 stroke-gray-500 dark:stroke-zinc-400' />
                              ) : (
                                <Icons.ArrowDown className='size-4 shrink-0 stroke-gray-500 dark:stroke-zinc-400' />
                              )
                            ) : (
                              <Icons.ArrowUpDown className='size-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity stroke-gray-500 dark:stroke-zinc-400' />
                            )
                          )}
                        </div>
                        <div className={cn("absolute inset-y-0 left-[-1px] w-[1px] bg-transparent group-hover:bg-gray-200 dark:group-hover:bg-zinc-800", alwaysShowLeftBorder && 'bg-gray-200 dark:bg-zinc-800')} />
                        <div className="absolute inset-y-0 right-0 w-[1px] bg-transparent group-hover:bg-gray-200 dark:group-hover:bg-zinc-800" />
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className={cn(
                              'absolute -right-px top-0 h-full w-2 cursor-col-resize select-none touch-none group-hover:bg-blue-500/10',
                              header.column.getIsResizing() && 'bg-blue-500/50 w-1'
                            )}
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {Object.entries(groupedItems).length === 0 ? table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-b-0 text-sm transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => {
                    const isPinned = isMobile ? false : cell.column.getIsPinned();
                    const isResizing = cell.column.getIsResizing();
                    const alwaysShowLeftBorder = cell.column.columnDef.meta && 'alwaysShowLeftBorder' in cell.column.columnDef.meta ? true : false;
                    const isVisible = visibleFieldsArray.includes(cell.column.id as RoadmapField);

                    if (!isVisible) {
                      return null;
                    }

                    return (
                      <td
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          position: isPinned ? 'sticky' : undefined,
                        }}
                        className={cn(
                          'px-4 py-2 text-zinc-800 dark:text-zinc-200 font-light relative',
                          'transition-colors',
                          cell.column.id === 'title' && 'cursor-pointer py-0 group/title',
                          !isPinned && 'group-hover:bg-[var(--color-primary)]/5',
                          isPinned && 'z-20',
                          isPinned === 'left' && [
                            'left-0',
                            'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-gray-200 dark:after:bg-zinc-800',
                            'bg-white dark:bg-zinc-900'
                          ],
                          isPinned === 'right' && [
                            'right-0',
                            'after:absolute after:left-0 after:top-0 after:h-full after:w-[3px] after:bg-gray-200 dark:after:bg-zinc-800',
                            'bg-white dark:bg-zinc-900'
                          ],
                          isResizing && 'cursor-col-resize'
                        )}
                      >
                        <div className={cn("absolute inset-y-0 left-[-1px] w-[1px]", alwaysShowLeftBorder && 'bg-gray-200 dark:bg-zinc-800')} />
                        {isPinned && <div className='absolute inset-0 pointer-events-none group-hover:bg-[var(--color-primary)]/5 transition-colors' />}
                        <span className={cn({
                          'relative': isPinned
                        })}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))
                :
                Object.entries(groupedItems).map(([group, { expanded, items }]) => {
                  const rows = table.getRowModel().rows.filter(row => items.some(item => item.id === row.original.id));

                  if (rows.length === 0) {
                    return null;
                  }

                  return (
                    <React.Fragment key={group}>
                      <tr key={group} className='border-b'>
                        <td
                          role='button'
                          onClick={() => toggleGroup(group)}
                          style={{
                            position: 'sticky',
                          }}
                          className='cursor-pointer left-0 z-20 gap-2 p-4 bg-gray-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-light border-b'
                        >
                          <div className='horizontal center-v gap-2 text-xs font-bold'>
                            <Icons.ChevronDown className={cn('size-4 shrink-0 transition-transform', !expanded && '-rotate-180')} />
                            {group}
                            <span className='text-gray-400 dark:text-zinc-500 border rounded-sm px-1'>
                              {items.length}
                            </span>
                          </div>
                          <div className='absolute inset-0 pointer-events-none bg-gray-50/20 dark:bg-zinc-800/20 transition-colors' />
                        </td>
                        <td role='button'
                          onClick={() => toggleGroup(group)}
                          colSpan={table.getAllColumns().length - 1}
                          className='cursor-pointer bg-gray-50 dark:bg-zinc-800/20'
                        />
                      </tr>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td colSpan={table.getAllColumns().length}>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <table className="w-full">
                                  <tbody>
                                    {rows.map((row, index) => (
                                      <motion.tr
                                        key={row.id}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{
                                          duration: 0.2,
                                          delay: index * 0.05,
                                          ease: 'easeOut'
                                        }}
                                        className="border-b last:border-b-0 text-sm transition-colors group"
                                      >
                                        {row.getVisibleCells().map((cell) => {
                                          const isPinned = isMobile ? false : cell.column.getIsPinned();
                                          const isResizing = cell.column.getIsResizing();
                                          const alwaysShowLeftBorder = cell.column.columnDef.meta && 'alwaysShowLeftBorder' in cell.column.columnDef.meta ? true : false;
                                          const isVisible = visibleFieldsArray.includes(cell.column.id as RoadmapField);

                                          if (!isVisible) {
                                            return null;
                                          }

                                          return (
                                            <td
                                              key={cell.id}
                                              style={{
                                                width: cell.column.getSize(),
                                                position: isPinned ? 'sticky' : undefined,
                                              }}
                                              className={cn(
                                                'px-4 py-2 text-zinc-800 border-b dark:text-zinc-200 font-light relative',
                                                'transition-colors',
                                                cell.column.id === 'title' && 'cursor-pointer py-0 group/title',
                                                !isPinned && 'group-hover:bg-[var(--color-primary)]/5',
                                                isPinned && 'z-20',
                                                isPinned === 'left' && [
                                                  'left-0',
                                                  'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-gray-200 dark:after:bg-zinc-800',
                                                  'bg-white dark:bg-zinc-900'
                                                ],
                                                isPinned === 'right' && [
                                                  'right-0',
                                                  'after:absolute after:left-0 after:top-0 after:h-full after:w-[3px] after:bg-gray-200 dark:after:bg-zinc-800',
                                                  'bg-white dark:bg-zinc-900'
                                                ],
                                                isResizing && 'cursor-col-resize'
                                              )}
                                            >
                                              <div className={cn("absolute inset-y-0 left-[-1px] w-[1px]", alwaysShowLeftBorder && 'bg-gray-200 dark:bg-zinc-800')} />
                                              {isPinned && <div className='absolute inset-0 pointer-events-none group-hover:bg-[var(--color-primary)]/5 transition-colors' />}
                                              <span className={cn({
                                                'relative': isPinned
                                              })}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                              </span>
                                            </td>
                                          );
                                        })}
                                      </motion.tr>
                                    ))}
                                  </tbody>
                                </table>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  )
                })
              }
              <tr className='text-sm'>
                <td className={cn('px-4 py-0 relative group cursor-pointer',
                  !isMobile && 'z-20 left-0 bg-white dark:bg-zinc-900 sticky',
                  !isMobile && 'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-gray-200 dark:after:bg-zinc-800'
                )}
                  role='button'
                  onClick={() => {
                    if (!newRoadmapItemTitle)
                      setNewRoadmapItemTitle('');
                  }}
                >
                  <div className='horizontal center-v gap-2 text-gray-400 dark:text-zinc-500 [&>svg]:stroke-gray-400 dark:[&>svg]:stroke-zinc-500'>
                    {(isFocused || newRoadmapItemTitle !== undefined) ?
                      <>
                        <button type='button' className='horizontal center-v gap-2 [&>svg]:stroke-gray-400 dark:[&>svg]:stroke-zinc-500 hover:[&>svg]:stroke-gray-500 dark:hover:[&>svg]:stroke-zinc-400 cursor-pointer'
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewRoadmapItemTitle(undefined);
                          }}>
                          <Icons.X className='size-4 shrink-0' />
                        </button>
                        <Input
                          ref={inputRef}
                          placeholder='Add a title...'
                          className='w-full border-none px-2'
                          value={newRoadmapItemTitle ?? ''}
                          onChange={(e) => setNewRoadmapItemTitle(e.target.value)}
                          onKeyDown={handleAddNewRoadmapItem}
                          autoFocus
                        />
                        in
                        <SelectComponent
                          options={boards?.map(board => ({
                            label: board.name,
                            value: board.slug
                          })) ?? []}
                          value={newRoadmapItemBoard}
                          onChange={(value) => setNewRoadmapItemBoard(value as string)}
                          triggerClassName='border-none hover:bg-transparent dark:hover:bg-transparent'
                          size='sm'
                          checkMarks
                        />
                      </>
                      :
                      <>
                        <Icons.Plus className='size-4 shrink-0 mr-2' />
                        Add new
                        <div className='absolute inset-0 pointer-events-none group-hover:bg-[var(--color-primary)]/5 transition-colors' />
                      </>
                    }
                  </div>
                </td>
                {hasFilteredFields && <td colSpan={filteredFields.length}>
                  <div className='horizontal gap-4' />
                </td>}
                {visibleFieldsArray.includes('impact') && <td className='relative'>
                  <div className='absolute inset-y-0 left-[-1px] w-[1px] bg-gray-200 dark:bg-zinc-800' />
                  <div className='horizontal gap-4'>
                  </div>
                </td>}
                {visibleFieldsArray.includes('votes') && <td className='relative'>
                  <div className='horizontal gap-4'>
                  </div>
                </td>}
                {visibleFieldsArray.includes('effort') && <td className='px-4 py-2 relative text-zinc-800 dark:text-zinc-200 font-light'>
                  <div className='absolute inset-y-0 left-[-1px] w-[1px] bg-gray-200 dark:bg-zinc-800' />
                  <div className='horizontal gap-4'>
                    {table.getRowModel().rows.reduce((acc, row) => {
                      return acc + row.original.effort;
                    }, 0)}
                  </div>
                </td>}
                <td className={cn('px-4 py-2 relative',
                  !isMobile && 'z-20 right-0 bg-white dark:bg-zinc-900 sticky',
                  !isMobile && 'after:absolute after:left-0 after:top-0 after:h-full after:w-[3px] after:bg-gray-200 dark:after:bg-zinc-800'
                )}>
                  <div className='horizontal gap-4'>
                    <span className='text-[var(--color-primary)] text-xs font-bold bg-[var(--color-primary)]/10 rounded-full size-10 horizontal center'>
                      {formatNumber(
                        totalScore
                      )}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {checkedItems.length > 0 && (
          <SelectionDock
            selectedCount={checkedItems.length}
            onClear={handleClearCheckedItems}
            selectedItems={selectedItems}
          />
        )}
      </AnimatePresence>
    </>
  );
} 