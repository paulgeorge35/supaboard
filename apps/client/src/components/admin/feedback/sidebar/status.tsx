import { Checkbox, Icons } from "@/components";
import { statusesQuery } from "@/lib/query";
import { Route } from "@/routes/admin/feedback";
import { Route as AddminFeedbackSlugRoute } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

export function Status() {
    const { data } = useQuery(statusesQuery)
    const search = useSearch({ from: Route.fullPath });
    const router = useRouter();

    const DEFAULT_STATUSES = useMemo(() => data?.filter(status => ['DEFAULT', 'ACTIVE'].includes(status.type)).map(status => status.slug) ?? [], [data]);

    const isAllDefaultStatusesIncluded = useCallback((newStatuses: string[]) => {
        if (DEFAULT_STATUSES.length !== newStatuses.length) {
            return false;
        }
        
        return DEFAULT_STATUSES.every(status => newStatuses.includes(status)) && 
               newStatuses.every(status => DEFAULT_STATUSES.includes(status));
    }, [DEFAULT_STATUSES]);

    const statuses = useMemo(() => {
        return search.status ?? DEFAULT_STATUSES;
    }, [search, DEFAULT_STATUSES]);

    const handleChange = (status: string) => {
        const newStatuses = statuses.includes(status) ? statuses.filter(s => s !== status) : [...statuses, status];
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: { ...search, status: newStatuses.length > 0 && !isAllDefaultStatusesIncluded(newStatuses) ? newStatuses : undefined }
        })
    }

    const handleReset = () => {
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: { ...search, status: undefined }
        })
    }

    const handleClick = (status: string) => {
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: { ...search, status: [status] }
        })
    }

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Status</h1>
            <button
                onClick={handleReset}
                className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                Reset
            </button>

            {data?.map((status) => (
                <div key={status.slug} className="grid grid-cols-[auto_1fr_auto] gap-2 group col-span-full">
                    <Checkbox
                        wrapperClassName="col-span-2"
                        label={status.name}
                        checked={statuses.includes(status.slug)}
                        onChange={() => handleChange(status.slug)}
                    />
                    <button
                        onClick={() => handleClick(status.slug)}
                        className="cursor-pointer size-4 border rounded-sm text-xs font-light horizontal hidden center group-hover:flex text-gray-500 dark:text-zinc-300"
                    >
                        <Icons.Check size={10} />
                    </button>
                </div>
            ))}
        </div>
    )
}