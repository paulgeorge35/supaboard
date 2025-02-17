import { Skeleton } from '@/components/skeleton';
import { useAddNewRoadmapItemMutation, useUpdateRoadmapItemMutation } from '@/lib/mutation/roadmap';
import { applicationBoardsQuery } from '@/lib/query';
import type { RoadmapDetailResponse } from '@/lib/query/roadmap';
import { cn } from '@/lib/utils';
import { Route } from '@/routes/admin/roadmap/$roadmapSlug';
import { useFocus, useNumber } from '@paulgeorge35/hooks';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useRouter } from '@tanstack/react-router';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  Table,
  useReactTable
} from '@tanstack/react-table';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { Avatar } from './avatar';
import { Checkbox } from './checkbox';
import { Icons } from './icons';
import { Input } from './input';
import { SelectComponent } from './select';
import { StatusBadge } from './status-badge';

type RoadmapItem = RoadmapDetailResponse['items'][0];

const columnHelper = createColumnHelper<RoadmapItem>();

const formatNumber = (number: number) => {
  if (number > 1000) {
    return `${(number / 1000).toFixed(number > 10000 ? 0 : 1)}k`;
  }
  return number;
}

const weights = {
  impact: 1,
  votes: 1,
  effort: 1
};

const getTotalScore = (table: Table<RoadmapItem>) => {
  const allItems = table.getRowModel().rows.map(row => row.original);
  const maxVotes = Math.max(...allItems.map(item => item.votes));

  const scores = allItems.map(item => {
    const voteScore = maxVotes ? (item.votes / maxVotes) * 100 : 0;
    return Math.round(
      1000 * (
        (Math.pow(item.impact, 2) * weights.impact) +
        (voteScore * weights.votes)
      ) / (item.effort * weights.effort)
    );
  });
  return scores.reduce((a, b) => a + b, 0);
}

type ColumnProps = {
  checkedItems: string[];
  setCheckedItems: (items: string[]) => void;
}

const columns = ({ checkedItems, setCheckedItems }: ColumnProps) => [
  columnHelper.accessor('title', {
    header: (info) => <div className='horizontal gap-4 center-v'>
      <Checkbox
        checked={checkedItems.length === info.table.getRowModel().rows.length}
        onChange={(value) => setCheckedItems(value.target.checked ? info.table.getRowModel().rows.map(row => row.original.id) : [])}
      />
      <p className='text-gray-500 dark:text-zinc-400'>Posts ({info.table.getRowModel().rows.length})</p>
    </div>,
    cell: (info) => {
      const isChecked = checkedItems.includes(info.row.original.id);
      const router = useRouter();
      const { roadmapSlug } = useParams({ from: Route.fullPath });
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
                  [...checkedItems, info.row.original.id] :
                  checkedItems.filter(item => item !== info.row.original.id)
              )
            }}
          />
          <p className='text-gray-500 dark:text-zinc-400'>{info.row.index + 1}</p>
          <Link
            to='/admin/feedback/$boardSlug/$feedbackSlug'
            params={{ boardSlug: info.row.original.board.slug, feedbackSlug: info.row.original.slug }}
            className='w-full text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors hover:underline underline-offset-2'
          >
            {info.getValue()}
          </Link>
          <button
            type='button'
            className='ml-auto opacity-0 group-hover/title:opacity-100 transition-opacity size-6 horizontal center cursor-pointer shrink-0'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.navigate({ to: '/admin/roadmap/$roadmapSlug/$boardSlug/$feedbackSlug/$feedbackId/remove', params: { roadmapSlug, boardSlug: info.row.original.board.slug, feedbackSlug: info.row.original.slug, feedbackId: info.row.original.id } });
            }}
          >
            <Icons.X className='size-4' />
          </button>
        </div >
      )
    },
    enablePinning: true,
    enableResizing: true,
    minSize: 250,
    maxSize: 600,
    size: 400,
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
    minSize: 130,
    maxSize: 600,
    size: 150,
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
    minSize: 100,
    maxSize: 600,
    size: 100,
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => info.getValue()?.name ?? '-',
    enableResizing: true,
    minSize: 130,
    maxSize: 600,
    size: 130,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} variant='text' />,
    enableResizing: true,
    minSize: 130,
    maxSize: 600,
    size: 250,
  }),
  columnHelper.accessor('tags', {
    header: 'Tags',
    cell: (info) => info.getValue().join(', ') || '-',
    enableResizing: true,
    minSize: 130,
    maxSize: 600,
    size: 250,
  }),
  columnHelper.accessor('board', {
    header: 'Board',
    cell: (info) => info.getValue().name,
    enableResizing: true,
    minSize: 130,
    maxSize: 600,
    size: 250,
  }),
  columnHelper.accessor('impact', {
    header: 'Impact',
    cell: (info) => {
      const impact = useNumber(info.getValue(), { min: 0, max: 10, step: 1 });
      const [inputRef, isFocused] = useFocus<HTMLInputElement>({
        onBlur: () => {
          if (impact.value !== info.getValue()) {
            updateRoadmapItem({ feedbackId: info.row.original.id, impact: impact.value });
          }
        },
        onFocus: () => {
          inputRef.current?.select();
        }
      });
      const { roadmapSlug } = useParams({ from: Route.fullPath });
      const { mutate: updateRoadmapItem } = useUpdateRoadmapItemMutation(roadmapSlug);
      return (
        <div className='relative'>
          <Input
            readOnly={!isFocused}
            ref={inputRef}
            value={impact.value}
            type='number'
            className='w-fit border-none'
            onChange={(e) => impact.setValue(parseFloat(e.target.value === '' ? '0' : e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateRoadmapItem({ feedbackId: info.row.original.id, impact: impact.value });
              }
            }}
          />
        </div>
      )
    },
    enableResizing: true,
    minSize: 130,
    maxSize: 600,
    size: 150,
    meta: {
      alwaysShowLeftBorder: true,
    }
  }),
  columnHelper.accessor('votes', {
    header: 'Votes',
    cell: (info) => info.getValue(),
    enableResizing: true,
    minSize: 130,
    maxSize: 600,
    size: 150,
  }),
  columnHelper.accessor('effort', {
    header: 'Effort',
    cell: (info) => {
      const effort = useNumber(info.getValue(), { min: 0, max: 100, step: 1 });
      const [inputRef, isFocused] = useFocus<HTMLInputElement>({
        onBlur: () => {
          if (effort.value !== info.getValue()) {
            updateRoadmapItem({ feedbackId: info.row.original.id, effort: effort.value });
          }
        },
        onFocus: () => {
          inputRef.current?.select();
        }
      });
      const { roadmapSlug } = useParams({ from: Route.fullPath });
      const { mutate: updateRoadmapItem } = useUpdateRoadmapItemMutation(roadmapSlug);
      return (
        <div className='relative'>
          <Input
            readOnly={!isFocused}
            ref={inputRef}
            value={effort.value}
            type='number'
            className='w-fit border-none'
            onChange={(e) => effort.setValue(parseFloat(e.target.value === '' ? '0' : e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateRoadmapItem({ feedbackId: info.row.original.id, effort: effort.value });
              }
            }}
          />
        </div>
      )
    },
    enableResizing: true,
    minSize: 130,
    maxSize: 600,
    size: 150,
    meta: {
      alwaysShowLeftBorder: true,
    }
  }),
  columnHelper.accessor((row) => {
    return {
      votes: row.votes,
      impact: row.impact,
      effort: row.effort
    }
  }, {
    id: 'score',
    header: 'Score',
    cell: (info) => {
      const votes = info.getValue()?.votes ?? 0;
      const impact = info.getValue()?.impact ?? 0;
      const effort = info.getValue()?.effort ?? 0;
      const allItems = info.table.getRowModel().rows.map(row => row.original);
      const maxVotes = Math.max(...allItems.map(item => item.votes));

      const voteScore = maxVotes ? (votes / maxVotes) * 100 : 0;

      const score = Math.round(
        1000 * (
          (Math.pow(impact, 2) * weights.impact) +
          (voteScore * weights.votes)
        ) / (effort * weights.effort)
      );

      return (
        <span className='text-[var(--color-primary)] text-xs font-bold bg-[var(--color-primary)]/10 rounded-full size-9 horizontal center'>
          {formatNumber(score)}
        </span>
      )
    },
    enablePinning: true,
    enableResizing: true,
    minSize: 130,
    maxSize: 600,
    size: 150,
  }),
];

interface RoadmapTableProps {
  items?: RoadmapItem[];
}

function RoadmapTableSkeleton() {
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
}

function EmptyPlaceholder() {
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
}

export function RoadmapTable({ items }: RoadmapTableProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const { roadmapSlug } = useParams({ from: Route.fullPath });
  const [inputRef, isFocused] = useFocus<HTMLInputElement>({
    onBlur: () => {
      if (newRoadmapItemTitle === '') {
        setNewRoadmapItemTitle(undefined);
      }
    }
  });
  const [newRoadmapItemTitle, setNewRoadmapItemTitle] = useState<string | undefined>(undefined);
  const [newRoadmapItemBoard, setNewRoadmapItemBoard] = useState<string | undefined>(undefined);
  const { data: boards } = useQuery(applicationBoardsQuery);
  const { mutate: addNewRoadmapItem } = useAddNewRoadmapItemMutation(roadmapSlug);
  const [sorting, setSorting] = useState<SortingState>([{
    id: 'score',
    desc: true,
  }]);

  useEffect(() => {
    if (boards && boards[0]) {
      setNewRoadmapItemBoard(boards[0].slug);
    }
  }, [boards]);

  const table = useReactTable({
    data: items ?? [],
    columns: columns({ checkedItems, setCheckedItems }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    enableSorting: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    defaultColumn: {
      minSize: 80,
      maxSize: 1000,
    },
    columnResizeDirection: 'ltr',
    initialState: {
      columnPinning: {
        left: ['title'],
        right: ['score'],
      },
    }
  });

  if (!items) {
    return <RoadmapTableSkeleton />;
  }

  if (items.length === 0) {
    return <EmptyPlaceholder />;
  }

  return (
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
                  const isPinned = header.column.getIsPinned();
                  const alwaysShowLeftBorder = header.column.columnDef.meta && 'alwaysShowLeftBorder' in header.column.columnDef.meta ? true : false;
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
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
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
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b last:border-b-0 text-sm transition-colors group"
              >
                {row.getVisibleCells().map((cell) => {
                  const isPinned = cell.column.getIsPinned();
                  const isResizing = cell.column.getIsResizing();
                  const alwaysShowLeftBorder = cell.column.columnDef.meta && 'alwaysShowLeftBorder' in cell.column.columnDef.meta ? true : false;
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
            ))}
            <tr className='text-sm'>
              <td className={cn('px-4 py-0 relative group cursor-pointer',
                'z-20 left-0 bg-white dark:bg-zinc-900 sticky',
                'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-gray-200 dark:after:bg-zinc-800'
              )}
                role='button'
                onClick={() => newRoadmapItemTitle === undefined ? setNewRoadmapItemTitle('') : undefined}
              >
                <div className='horizontal center-v gap-2 text-gray-400 dark:text-zinc-500 [&>svg]:stroke-gray-400 dark:[&>svg]:stroke-zinc-500'>
                  {(isFocused || newRoadmapItemTitle !== undefined) ?
                    <>
                      <button type='button' className='horizontal center-v gap-2 text-gray-400 dark:text-zinc-500 [&>svg]:stroke-gray-400 dark:[&>svg]:stroke-zinc-500' onClick={() => setNewRoadmapItemTitle(undefined)}>
                        <Icons.X className='size-4 shrink-0' />
                      </button>
                      <Input
                        ref={inputRef}
                        placeholder='Add a title...'
                        className='w-full border-none px-2'
                        value={newRoadmapItemTitle ?? ''}
                        onChange={(e) => setNewRoadmapItemTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newRoadmapItemTitle && newRoadmapItemBoard) {
                            addNewRoadmapItem({ title: newRoadmapItemTitle, board: { name: boards?.find(board => board.slug === newRoadmapItemBoard)?.name ?? '', slug: newRoadmapItemBoard } });
                            setNewRoadmapItemTitle(undefined);
                          }
                        }}
                        autoFocus
                      />
                      in
                      <SelectComponent
                        options={boards?.map(board => ({
                          label: board.name,
                          value: board.slug
                        })) ?? []}
                        value={newRoadmapItemBoard}
                        onChange={(value) => setNewRoadmapItemBoard(value)}
                        className='h-9 hover:bg-transparent'
                        triggerClassName='border-none hover:bg-transparent dark:hover:bg-transparent'
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
              <td colSpan={6}>
                <div className='horizontal gap-4'>

                </div>
              </td>
              <td className='relative'>
                <div className='absolute inset-y-0 left-[-1px] w-[1px] bg-gray-200 dark:bg-zinc-800' />
                <div className='horizontal gap-4'>
                </div>
              </td>
              <td className='relative'>
                <div className='horizontal gap-4'>
                </div>
              </td>
              <td className='px-4 py-2 relative text-zinc-800 dark:text-zinc-200 font-light'>
                <div className='absolute inset-y-0 left-[-1px] w-[1px] bg-gray-200 dark:bg-zinc-800' />
                <div className='horizontal gap-4'>
                  {table.getRowModel().rows.reduce((acc, row) => {
                    return acc + row.original.effort;
                  }, 0)}
                </div>
              </td>
              <td className={cn('px-4 py-2 relative',
                'z-20 right-0 bg-white dark:bg-zinc-900 sticky',
                'after:absolute after:left-0 after:top-0 after:h-full after:w-[3px] after:bg-gray-200 dark:after:bg-zinc-800'
              )}>
                <div className='horizontal gap-4'>
                  <span className='text-[var(--color-primary)] text-xs font-bold bg-[var(--color-primary)]/10 rounded-full size-9 horizontal center'>
                    {formatNumber(
                      getTotalScore(table)
                    )}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
} 