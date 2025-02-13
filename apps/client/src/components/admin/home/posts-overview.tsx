import { DateRangeSelector } from "@/components/date-range-selector";
import { Icons } from "@/components/icons";
import { SelectComponent } from "@/components/select";
import { Skeleton } from "@/components/skeleton";
import { fetchClient } from "@/lib/client";
import { applicationBoardsQuery } from "@/lib/query";
import { useAuthStore } from "@/stores/auth-store";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { Label, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import colors from "tailwindcss/colors";

type PostsOverviewData = Record<string, number>;

const postsOverviewQuery = (applicationId?: string, boardSlug?: string, groupBy?: 'tag' | 'category', start?: string, end?: string) => queryOptions<PostsOverviewData[]>({
    queryKey: ['posts-overview', applicationId, boardSlug, groupBy, start, end],
    queryFn: () => fetchClient('/admin/posts-overview', {
        queryParams: {
            applicationId,
            boardSlug,
            groupBy,
            start,
            end,
        },
    }),
    enabled: !!applicationId && (!!groupBy || !boardSlug)
});

const TAILWIND_COLORS = [
    colors.blue[400],
    colors.red[400],
    colors.green[400],
    colors.yellow[400],
    colors.purple[400],
    colors.pink[400],
    colors.indigo[400],
    colors.orange[400],
    colors.teal[400],
    colors.cyan[400],
] as const;

type CustomTooltipProps = {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        payload: {
            name: string;
            total: number;
            color: string;
        };
    }>;
    total?: number;
};

export const PostsOverview = () => {
    const { application } = useAuthStore();

    const [range, setRange] = useState<{ start?: Date, end?: Date }>({
        start: DateTime.now().startOf('week').toJSDate(),
        end: DateTime.now().endOf('week').toJSDate(),
    })
    const [boardSlug, setBoardSlug] = useState<string>('all');
    const [groupBy, setGroupBy] = useState<'tag' | 'category'>('tag');

    const { data: boards } = useQuery(applicationBoardsQuery);

    const { data, isLoading } = useQuery(postsOverviewQuery(application?.id, boardSlug, groupBy,
        range.start ? DateTime.fromJSDate(range.start).toFormat('yyyy-MM-dd') : undefined,
        range.end ? DateTime.fromJSDate(range.end).toFormat('yyyy-MM-dd') : undefined,
    ));

    const numberFormatted = useCallback((total: number) => {
        if (total > 1000) {
            return `${(total / 1000).toFixed(1)}k`;
        }
        return total;
    }, []);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof localStorage !== 'undefined' && localStorage.adminCurrentTheme) {
            return localStorage.adminCurrentTheme as 'light' | 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const updateTheme = () => {
            const savedTheme = localStorage.getItem('adminCurrentTheme');
            if (savedTheme) {
                setTheme(savedTheme as 'light' | 'dark');
            } else {
                setTheme(
                    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                );
            }
        };

        // Listen for theme changes
        window.addEventListener('storage', updateTheme);

        // Listen for class changes on document.documentElement
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isDark = document.documentElement.classList.contains('dark');
                    setTheme(isDark ? 'dark' : 'light');
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => {
            window.removeEventListener('storage', updateTheme);
            observer.disconnect();
        };
    }, []);

    const colorizedData = data?.map((item, index) => {
        const color = TAILWIND_COLORS[index % TAILWIND_COLORS.length];
        return {
            name: item.name,
            total: item.total,
            fill: color,
            color: color,
        };
    });

    const total = data?.reduce((acc, curr) => acc + curr.total, 0) ?? 0;

    useEffect(() => {
        if (boardSlug === 'all') {
            setGroupBy('tag');
        }
    }, [boardSlug]);

    const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            const { name, value, payload: originalPayload } = payload[0];
            const percent = ((value / total) * 100).toFixed(1);

            return (
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-lg">
                    <span className="horizontal gap-2 center-v px-3 py-1 border-b">
                        <div
                            className="size-3 rounded-full"
                            style={{ backgroundColor: originalPayload.color }}
                        />
                        <p className="font-medium mb-1 text-sm">{name}</p>
                    </span>
                    <span className="vertical gap-2 px-3 py-1">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            <span className="text-zinc-900 dark:text-zinc-50 bg-zinc-200 dark:bg-zinc-800 px-1 rounded-md">{numberFormatted(value)}</span> out of <span className="text-zinc-900 dark:text-zinc-50 bg-zinc-200 dark:bg-zinc-800 px-1 rounded-md">{numberFormatted(total)}</span>
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            <span className="text-zinc-900 dark:text-zinc-50 bg-zinc-200 dark:bg-zinc-800 px-1 rounded-md">{percent}%</span> of total
                        </p>
                    </span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="border rounded-lg p-4">
            <span className="horizontal center-v space-between">
                <h1 className="text-lg font-bold pb-4">Posts Overview</h1>
                <span className="horizontal gap-2">
                    <SelectComponent
                        className="h-9 w-40"
                        value={boardSlug}
                        options={[{
                            label: 'All boards',
                            value: 'all',
                        }, ...(boards?.map((board) => ({
                            label: board.name,
                            value: board.slug,
                        })) ?? [])]}
                        onChange={(value) => setBoardSlug(value)}
                    />
                    <SelectComponent
                        className="h-9 w-40"
                        value={groupBy}
                        options={[{
                            label: 'Tag',
                            value: 'tag',
                            icon: <Icons.Tag className="size-4" />,
                        }, {
                            label: 'Category',
                            value: 'category',
                            icon: <Icons.LayoutGrid className="size-4" />,
                        }]}
                        onChange={(value) => setGroupBy(value as 'tag' | 'category')}
                        disabled={boardSlug === 'all'}
                    />
                    <DateRangeSelector
                        range={range}
                        onChange={(range) => setRange(range)}
                        triggerClassName="w-full hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200 cursor-pointer h-9"
                        className="w-fit"
                        align="end"
                    />
                </span>
            </span>
            {isLoading ? (
                <div className="h-[400px] w-full">
                    <div className="h-full w-full horizontal justify-center pt-10">
                        <Skeleton className="size-70 rounded-full" />
                    </div>
                </div>
            ) : data && data.length === 0 ? (
                <div className="text-zinc-900 dark:text-zinc-50 text-sm horizontal center h-[400px]">
                    No data found
                </div>
            ) : data && data.length > 0 && (
                <ResponsiveContainer width="100%" height={400} minHeight={400}>
                    <PieChart>
                        <Tooltip
                            content={<CustomTooltip total={total} />}
                            wrapperStyle={{ outline: 'none' }}
                        />
                        <Pie
                            data={colorizedData}
                            dataKey="total"
                            nameKey="name"
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            strokeWidth={10}
                            stroke={theme === 'dark' ? '#18181b' : '#ffffff'}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-zinc-900 dark:fill-zinc-50 text-3xl font-bold"
                                                >
                                                    {numberFormatted(data?.reduce((acc, curr) => acc + curr.total, 0) ?? 0)}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-zinc-900 dark:fill-zinc-50 text-xs"
                                                >
                                                    Posts
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                        <LabelList dataKey="total" position="outside" />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            layout="horizontal"
                            formatter={(value: string) => (
                                <span className="text-zinc-900 dark:text-zinc-50 text-sm">
                                    {value}
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    )
};
