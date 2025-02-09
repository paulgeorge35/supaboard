import { Checkbox, Icons } from "@/components";
import { FeedbackStatusConfig } from "@/lib/utils";
import { Route } from "@/routes/admin/feedback";
import { Route as AddminFeedbackSlugRoute } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug";
import { useRouter, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

type FeedbackStatus = keyof typeof FeedbackStatusConfig;

const DEFAULT_STATUSES = ['OPEN', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS'] as FeedbackStatus[];

export function Status() {
    const search = useSearch({ from: Route.fullPath });
    const router = useRouter();

    const isAllDefaultStatusesIncluded = useCallback((newStatuses: FeedbackStatus[]) => {
        return DEFAULT_STATUSES.every(status => newStatuses.includes(status)) && newStatuses.length === DEFAULT_STATUSES.length;
    }, []);

    const statuses = useMemo(() => {
        return search.status ?? DEFAULT_STATUSES;
    }, [search]);

    const handleChange = (status: FeedbackStatus) => {
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

    const handleClick = (status: FeedbackStatus) => {
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

            {Object.entries(FeedbackStatusConfig).map(([status, config]) => (
                <div key={status} className="grid grid-cols-[auto_1fr_auto] gap-2 group col-span-full">
                    <Checkbox
                        wrapperClassName="col-span-2"
                        label={config.label}
                        checked={statuses.includes(status as FeedbackStatus)}
                        onChange={() => handleChange(status as FeedbackStatus)}
                    />
                    <button
                        onClick={() => handleClick(status as FeedbackStatus)}
                        className="cursor-pointer size-4 border rounded-sm text-xs font-light horizontal hidden center group-hover:flex text-gray-500 dark:text-zinc-300"
                    >
                        <Icons.Check size={10} />
                    </button>
                </div>
            ))}
        </div>
    )
}