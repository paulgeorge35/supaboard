import { DateRangeSelector } from "@/components/date-range-selector";
import { Route } from "@/routes/admin/users";
import { Route as UserRoute } from "@/routes/admin/users/$userSlug";
import { useParams, useRouter, useSearch } from "@tanstack/react-router";
import { DateTime } from "luxon";

export function DateRange() {
    const { userSlug } = useParams({ strict: false })
    const search = useSearch({ from: Route.fullPath })
    const router = useRouter();

    const handleChange = (range: { start?: Date, end?: Date }) => {
        router.navigate({
            from: userSlug ? UserRoute.fullPath : Route.fullPath,
            params: { userSlug },
            search: {
                ...search,
                start: range.start ? DateTime.fromJSDate(range.start).isValid ? DateTime.fromJSDate(range.start).toFormat('yyyy-MM-dd') : undefined : undefined,
                end: range.end ? DateTime.fromJSDate(range.end).isValid ? DateTime.fromJSDate(range.end).toFormat('yyyy-MM-dd') : undefined : undefined
            }
        })
    }

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-full">Date Range</h1>
            <span className="col-span-full">
                <DateRangeSelector
                    onChange={handleChange}
                    triggerClassName="w-full hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200 cursor-pointer"
                    range={
                        {
                            start: search.start ? DateTime.fromFormat(search.start, 'yyyy-MM-dd').set({hour: 0, minute: 0, second: 0, millisecond: 0}).toJSDate() : undefined,
                            end: search.end ? DateTime.fromFormat(search.end, 'yyyy-MM-dd').set({hour: 23, minute: 59, second: 59, millisecond: 999}).toJSDate() : undefined
                        }
                    }
                />
            </span>

        </div>
    )
}