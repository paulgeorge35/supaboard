import { DateRangeSelector } from "@/components/date-range-selector";
import { Icons } from "@/components/icons";
import { fetchClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import colors from "tailwindcss/colors";

type ActivityHistoryDetailed = {
    date: string;
    count: number;
}

type ActivityHistory = {
    data: ActivityHistoryDetailed[];
    total: number;
    trend?: 'increase' | 'decrease' | 'no change';
    percentageIncrease?: number;
}

type ActivityOverviewData = {
    comments: ActivityHistory;
    votes: ActivityHistory;
    statusChanges: ActivityHistory;
    feedbacks: ActivityHistory;
}


const activityOverviewQuery = (range: { start?: string, end?: string }) => queryOptions<ActivityOverviewData>({
    queryKey: ['admin', 'activity-overview', range],
    queryFn: () => fetchClient('/admin/activity-overview', {
        queryParams: {
            start: range.start,
            end: range.end,
        },
    }),
})

export function ActivityOverview() {
    const [range, setRange] = useState<{ start?: Date, end?: Date }>({
        start: DateTime.now().startOf('week').toJSDate(),
        end: DateTime.now().endOf('week').toJSDate(),
    });

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof localStorage !== 'undefined' && localStorage.adminCurrentTheme) {
            return localStorage.adminCurrentTheme as 'light' | 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const { data } = useQuery(activityOverviewQuery({
        start: range.start ? DateTime.fromJSDate(range.start).toFormat('yyyy-MM-dd') : undefined,
        end: range.end ? DateTime.fromJSDate(range.end).toFormat('yyyy-MM-dd') : undefined,
    }));

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

        window.addEventListener('storage', updateTheme);

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

    const chartConfigs = [
        { data: data?.feedbacks?.data ?? [], title: "Feedbacks", total: data?.feedbacks.total, color: colors.blue[400], trend: data?.feedbacks.trend, percentageIncrease: data?.feedbacks.percentageIncrease },
        { data: data?.votes?.data ?? [], title: "Votes", total: data?.votes.total, color: colors.green[400], trend: data?.votes.trend, percentageIncrease: data?.votes.percentageIncrease },
        { data: data?.comments?.data ?? [], title: "Comments", total: data?.comments.total, color: colors.purple[400], trend: data?.comments.trend, percentageIncrease: data?.comments.percentageIncrease },
        { data: data?.statusChanges?.data ?? [], title: "Status Changes", total: data?.statusChanges.total, color: colors.orange[400], trend: data?.statusChanges.trend, percentageIncrease: data?.statusChanges.percentageIncrease },
    ];

    return (
        <div className="border rounded-lg p-4">
            <span className="horizontal space-between center-v w-full mb-8">
                <h1 className="text-lg font-bold">Activity Overview</h1>
                <DateRangeSelector
                    range={range}
                    onChange={(range) => setRange(range)}
                    triggerClassName="w-full hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200 cursor-pointer h-9"
                    className="w-fit"
                    align="end"
                />
            </span>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {chartConfigs.map((config) => (
                    <div key={config.title} className="vertical items-start">
                        <h2 className="font-light text-sm">
                            {config.title}
                        </h2>
                        <div className="text-2xl font-bold mb-4 horizontal center-v gap-1">
                            {config.total ?? '-'}
                            <Trend trend={config.trend} percentageIncrease={config.percentageIncrease} />
                        </div>
                        <div className="h-[100px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={config.data}>
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke={config.color}
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const Trend = ({ trend, percentageIncrease }: { trend?: 'increase' | 'decrease' | 'no change', percentageIncrease?: number }) => {
    if (!trend || !percentageIncrease) return null;

    return (
        <div className={cn("text-xs horizontal center-v gap-1 [&>svg]:rounded-full [&>svg]:size-4 [&>svg]:p-[1px]", {
            'text-green-500 [&>svg]:stroke-green-500 [&>svg]:rotate-45 [&>svg]:bg-green-500/20 ': trend === 'increase',
            'text-red-500 [&>svg]:stroke-red-500 [&>svg]:rotate-135 [&>svg]:bg-red-500/20': trend === 'decrease',
            'text-gray-500 [&>svg]:stroke-gray-500 [&>svg]:bg-gray-500/20': trend === 'no change',
        })}>
            {trend === 'increase' && <Icons.ArrowUp />}
            {trend === 'decrease' && <Icons.ArrowUp />}
            {trend === 'no change' && <Icons.Minus />}
            {percentageIncrease.toFixed()}%
        </div>
    )
}