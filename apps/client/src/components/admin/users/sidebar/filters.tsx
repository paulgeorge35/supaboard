import { Checkbox } from "@/components/checkbox";
import { Route } from "@/routes/admin/users";
import { Route as UserRoute } from "@/routes/admin/users/$userSlug";
import { useParams, useRouter, useSearch } from "@tanstack/react-router";


type ActivityFilter = 'posts' | 'votes' | 'comments';

const activityFilters: { label: string, value: ActivityFilter }[] = [
    { label: 'Posts', value: 'posts' },
    { label: 'Votes', value: 'votes' },
    { label: 'Comments', value: 'comments' },
];

const DEFAULT_FILTERS: ActivityFilter[] = ['posts', 'votes', 'comments'];

export function Filters() {
    const { userSlug } = useParams({ strict: false })
    const search = useSearch({ from: Route.fullPath });
    const router = useRouter();

    const filters = search.filter ?? DEFAULT_FILTERS;

    const handleChange = (value: ActivityFilter) => {
        const newFilters = filters.includes(value) ? filters.filter((f) => f !== value) : [...filters, value];
        const isAllDefaultFilters = newFilters.length === DEFAULT_FILTERS.length && newFilters.every((f) => DEFAULT_FILTERS.includes(f));
        router.navigate({
            from: userSlug ? UserRoute.fullPath : Route.fullPath,
            params: { userSlug },
            search: { ...search, filter: isAllDefaultFilters || newFilters.length === 0 ? undefined : [...newFilters] }
        })
    }

    return (
        <div className="grid grid-cols-[auto_1fr] gap-2">
            <h1 className="text-sm font-medium col-span-full">Activity</h1>
            {activityFilters.map(({ label, value }) => (
                <Checkbox
                    key={value}
                    label={label}
                    checked={filters.includes(value)}
                    onChange={() => handleChange(value)}
                    wrapperClassName="col-span-full"
                />
            ))}
        </div>
    )
}