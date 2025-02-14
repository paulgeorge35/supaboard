import { RadioGroup } from "@/components";
import { Route } from "@/routes/admin/users";
import { Route as UserRoute } from "@/routes/admin/users/$userSlug";
import { useParams, useRouter, useSearch } from "@tanstack/react-router";

const sortOptions = [
    { label: 'Last Activity', value: 'last-activity' },
    { label: 'Top Posters', value: 'top-posters' },
    { label: 'Top Voters', value: 'top-voters' },
]

export function Sort() {
    const { userSlug } = useParams({ strict: false })
    const search = useSearch({ from: Route.fullPath });
    const router = useRouter();

    const value = search.order ?? 'last-activity';

    const handleChange = (value: string) => {
        router.navigate({
            from: userSlug ? UserRoute.fullPath : Route.fullPath,
            params: { userSlug },
            search: { ...search, order: value === 'last-activity' ? undefined : value as 'last-activity' | 'top-posters' | 'top-voters' }
        })
    }
    return (
        <div className="grid grid-cols-[auto_1fr] gap-2">
            <h1 className="text-sm font-medium col-span-full">Sort</h1>
            <RadioGroup
                value={value}
                onChange={handleChange}
                name="sort"
                options={sortOptions}
                className="col-span-full"
                groupClassName="gap-3"
            />
        </div>
    )
}