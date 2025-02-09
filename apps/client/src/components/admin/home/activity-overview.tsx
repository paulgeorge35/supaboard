import { DateRangeSelector } from "@/components/date-range-selector";
import { fetchClient } from "@/lib/client";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { useState } from "react";

const activityOverviewQuery = (range: { start?: string, end?: string }) => ({
    queryKey: ['admin', 'activity-overview', range],
    queryFn: () => fetchClient('/admin/activity-overview', {
        queryParams: {
            start: range.start,
            end: range.end,
        },
    })
})

export function ActivityOverview() {
    const [range, setRange] = useState<{ start?: Date, end?: Date }>({
        start: DateTime.now().startOf('week').toJSDate(),
        end: DateTime.now().endOf('week').toJSDate(),
    })

    const { data } = useQuery(activityOverviewQuery({
        start: range.start ? DateTime.fromJSDate(range.start).toFormat('yyyy-MM-dd') : undefined,
        end: range.end ? DateTime.fromJSDate(range.end).toFormat('yyyy-MM-dd') : undefined,
    }))

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border rounded-lg p-4">
            <span className="col-span-full horizontal space-between center-v w-full">
                <h1 className="text-lg font-bold">Activity Overview</h1>
                <DateRangeSelector
                    range={range}
                    onChange={(range) => setRange(range)}
                    triggerClassName="w-full hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200 cursor-pointer"
                    className="w-fit"
                    align="end"
                />
            </span>
            <span>
                <h1 className="font-light">Feedbacks</h1>
                <p className="text-2xl font-bold">{data?.feedbacks ?? '-'}</p>
            </span>
            <span>
                <h1 className="font-light">Votes</h1>
                <p className="text-2xl font-bold">{data?.votes ?? '-'}</p>
            </span>
            <span>
                <h1 className="font-light">Comments</h1>
                <p className="text-2xl font-bold">{data?.comments ?? '-'}</p>
            </span>
            <span>
                <h1 className="font-light">Status Changes</h1>
                <p className="text-2xl font-bold">{data?.statusChanges ?? '-'}</p>
            </span>
        </div>
    )
}