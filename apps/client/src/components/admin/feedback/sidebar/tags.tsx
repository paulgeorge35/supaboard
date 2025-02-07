import { Checkbox, Icons } from "@/components";
import { cn } from "@/lib/utils";
import { tagsQuery } from "@/routes/__root";
import { Route } from "@/routes/admin/feedback";
import { Route as AddminFeedbackSlugRoute } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug";
import { useDebounce, useFocus } from "@paulgeorge35/hooks";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";


export function Tags() {
    const [search, setSearch] = useState<string | undefined>(undefined);
    const { value: debouncedSearch } = useDebounce(search);
    const [ref, isFocused] = useFocus();

    const searchParams = useSearch({ from: Route.fullPath });
    const router = useRouter();

    const { data: tags } = useQuery(tagsQuery(debouncedSearch));

    const tagsToShow = useMemo(() => {
        if (!tags) return [];
        return tags.map((tag) => tag.name).filter((tag) => !searchParams.tags?.includes(tag));
    }, [tags, searchParams.tags]);

    const handleTagClick = (tag: string) => {
        setSearch('');
        const tags = searchParams.tags?.includes(tag) ? searchParams.tags?.filter((t) => t !== tag) : [...(searchParams.tags || []), tag];
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: { ...searchParams, tags, untagged: undefined }
        });
    }

    const handleUntaggedChange = (checked: boolean) => {
        console.log(checked);
        setSearch('');
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: { ...searchParams, untagged: checked === false ? undefined : true, tags: undefined }
        });
    }
    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Tags</h1>
            <Link to="/admin" className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                <Icons.Settings className="size-4 stroke-gray-500 dark:stroke-zinc-300 hover:stroke-gray-700 dark:hover:stroke-zinc-200" />
            </Link>
            <Checkbox
                checked={searchParams.untagged === true}
                label="Posts without tags" wrapperClassName="col-span-full"
                onChange={(e) => handleUntaggedChange(e.target.checked)}
            />
            <span className="relative col-span-full">
                <input type="text" ref={ref} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full focus:outline-none border rounded-md p-2 text-base md:text-sm" />

                {isFocused &&
                    <div className="z-10 absolute top-[calc(100%+4px)] border left-0 w-full bg-white dark:bg-zinc-900 shadow-sm rounded-md p-2 text-base md:text-sm vertical gap-1 max-h-[200px] overflow-y-auto">
                        {tagsToShow.length === 0 && search?.trim() !== '' && <p className="text-gray-500 dark:text-zinc-300 text-sm font-light">No matching tags</p>}
                        {tagsToShow.map((tag) => (
                            <button
                                key={tag}
                                onMouseDown={() => handleTagClick(tag)}
                                className="text-gray-500 dark:text-zinc-300 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-zinc-200 w-full dark:hover:bg-zinc-800/20 text-sm font-light horizontal center-v gap-1 px-2 py-1 rounded-md"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>}
            </span>
            {searchParams.tags &&
                <div className="flex flex-wrap gap-2">
                    {searchParams.tags?.map((tag) => (
                        <button
                            key={tag}
                            className={cn("text-gray-500 border px-2 py-1 rounded-md dark:text-zinc-300 text-sm font-light horizontal center-v gap-1 group relative cursor-pointer border-[var(--color-primary)]")}
                            onClick={() => handleTagClick(tag)}
                        >
                            <span
                                className="group-hover:opacity-0 text-[var(--color-primary)]"
                            >
                                {tag}
                            </span>
                            <Icons.X className="size-4 hidden group-hover:block absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 stroke-[var(--color-primary)]" />
                        </button>
                    ))}
                </div>
            }
        </div>
    )
}