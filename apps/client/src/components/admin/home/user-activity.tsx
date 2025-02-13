import { Avatar } from "@/components/avatar";
import { DateRangeSelector } from "@/components/date-range-selector";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { fetchClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";

type UserActivityQueryData = {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    votes: number;
    comments: number;
    feedbacks: number;
}

const columnHelper = createColumnHelper<UserActivityQueryData>();

const columns = [
    columnHelper.accessor('name', {
        header: 'Admins',
        cell: (info) => {
            const row = info.row.original;
            return (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={row.avatar ?? undefined}
                        name={row.name}
                        isAdmin
                    />
                    <div className="flex flex-col">
                        <span className="font-medium">{row.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{row.email}</span>
                    </div>
                </div>
            );
        },
    }),
    columnHelper.accessor('votes', {
        header: 'Votes',
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('feedbacks', {
        header: 'Posts',
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('comments', {
        header: 'Comments',
        cell: (info) => info.getValue(),
    }),
];

const userActivityQuery = (range: { start?: string, end?: string }) => queryOptions<UserActivityQueryData[]>({
    queryKey: ['admin', 'user-activity', range],
    queryFn: () => fetchClient('/admin/user-activity', {
        queryParams: {
            start: range.start,
            end: range.end,
        },
    }),
});

function TableSkeleton() {
    return (
        <div className="rounded-md border">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead>
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                            Admins
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                            Votes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                            Posts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                            Comments
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                    <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24 rounded" />
                                    <Skeleton className="h-3 w-32 rounded" />
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-8 rounded" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-8 rounded" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-8 rounded" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export function UserActivity() {
    const [range, setRange] = useState<{ start?: Date, end?: Date }>({
        start: DateTime.now().startOf('week').toJSDate(),
        end: DateTime.now().endOf('week').toJSDate(),
    });

    const [sorting, setSorting] = useState<SortingState>([]);

    const { data, isLoading } = useQuery(userActivityQuery({
        start: range.start ? DateTime.fromJSDate(range.start).toFormat('yyyy-MM-dd') : undefined,
        end: range.end ? DateTime.fromJSDate(range.end).toFormat('yyyy-MM-dd') : undefined,
    }));

    const tableOptions = useMemo(
        () => ({
            data: data ?? [],
            columns,
            state: {
                sorting,
            },
            onSortingChange: setSorting,
            getCoreRowModel: getCoreRowModel(),
            getSortedRowModel: getSortedRowModel(),
        }),
        [data, sorting]
    );

    const table = useReactTable(tableOptions);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="horizontal center-v justify-end gap-4">
                    <p className="text-sm font-light text-gray-500 dark:text-gray-400">Show activity for</p>
                    <DateRangeSelector
                        range={range}
                        onChange={(range) => setRange(range)}
                        triggerClassName="w-full hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200 cursor-pointer"
                        className="w-fit"
                        align="end"
                    />
                </div>
                <TableSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="horizontal center-v justify-end gap-4">
                <p className="text-sm font-light text-gray-500 dark:text-gray-400">Show activity for</p>
                <DateRangeSelector
                    range={range}
                    onChange={(range) => setRange(range)}
                    triggerClassName="w-full hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200 cursor-pointer"
                    className="w-fit"
                    align="end"
                />
            </div>

            <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                    <thead className="">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className={cn(
                                            "flex items-center gap-2",
                                            header.column.id === 'name' ? "justify-start" : ""
                                        )}>
                                            {header.column.id !== 'name' && (
                                                <span className="text-xs">
                                                    {header.column.getIsSorted() ? (
                                                        header.column.getIsSorted() === 'desc' ? (
                                                            <Icons.ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <Icons.ChevronUp className="h-4 w-4" />
                                                        )
                                                    ) : (
                                                        <Icons.ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    )}
                                                </span>
                                            )}
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {header.column.id === 'name' && (
                                                <span className="text-xs">
                                                    {header.column.getIsSorted() ? (
                                                        header.column.getIsSorted() === 'desc' ? (
                                                            <Icons.ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <Icons.ChevronUp className="h-4 w-4" />
                                                        )
                                                    ) : (
                                                        <Icons.ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map(cell => (
                                    <td
                                        key={cell.id}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
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
