
import { RadioGroup } from "@/components";
import { Route } from "@/routes/admin/feedback";
import { Route as AddminFeedbackSlugRoute } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter, useSearch } from "@tanstack/react-router";


export function Owner() {
    const { user } = useAuthStore();

    const search = useSearch({ from: Route.fullPath });
    const router = useRouter();

    const value = search.owner ? 'me' : search.unassigned ? 'no-owner' : 'all';

    const handleChange = (value: string) => {
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: { ...search,
                owner: value === 'me' ? user?.id : value === 'no-owner' ? undefined : undefined,
                unassigned: value === 'no-owner' ? true : undefined
            }
        })
    }

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Owner</h1>
            <button className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                Search
            </button>
            <RadioGroup
                value={value}
                onChange={handleChange}
                name="owner"
                options={[
                    { label: 'All', value: 'all' },
                    { label: 'No owner', value: 'no-owner' },
                    { label: 'Me', value: 'me' },
                ]}
            />
        </div>
    )
}