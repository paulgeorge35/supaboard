import { Checkbox, Icons } from "@/components";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/admin/feedback";
import { Route as AddminFeedbackSlugRoute } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug";
import { categoriesQuery } from "@/routes/admin/settings/boards.$boardSlug.categories";
import { useDebounce, useFocus } from "@paulgeorge35/hooks";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useRouter, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export function Categories() {
    const [search, setSearch] = useState<string>('');
    const { boardSlug } = useParams({ strict: false });
    const { value: debouncedSearch } = useDebounce(search);
    const [ref, isFocused] = useFocus();


    const searchParams = useSearch({ from: Route.fullPath });
    const router = useRouter();

    const { data: categories } = useQuery(categoriesQuery(boardSlug!, debouncedSearch, true))

    const filteredBoards = useMemo(() => {
        if (searchParams.boards) {
            return Array.isArray(searchParams.boards) ? searchParams.boards : [searchParams.boards];
        }
        return [];
    }, [searchParams.boards]);

    const categoriesToShow = useMemo(() => {
        if (!categories) return [];
        return categories.filter((category) =>
            !searchParams.categories?.includes(category.slug)
            && category.slug !== 'uncategorized'
            && (filteredBoards.length === 0 || filteredBoards.includes(category.board.slug))
        );
    }, [categories, searchParams.categories, filteredBoards]);

    const handleUncategorizedChange = (checked: boolean) => {
        setSearch('');
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: { ...searchParams, uncategorized: checked === false ? undefined : true, categories: undefined }
        });
    }

    const handleCategoryClick = (categorySlug: string) => {
        setSearch('');
        const categories = searchParams.categories?.includes(categorySlug) ? searchParams.categories?.filter((c) => c !== categorySlug) : [...(searchParams.categories || []), categorySlug];
        router.navigate({
            from: AddminFeedbackSlugRoute.fullPath,
            search: { ...searchParams, uncategorized: undefined, categories }
        });
    }

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Categories</h1>
            <Link to="/admin/settings/boards/$boardSlug/categories" params={{ boardSlug: boardSlug ?? '' }} className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                <Icons.Settings className="size-4 stroke-gray-500 dark:stroke-zinc-300 hover:stroke-gray-700 dark:hover:stroke-zinc-200" />
            </Link>
            <Checkbox
                checked={searchParams.uncategorized === true}
                label="Uncategorized only" wrapperClassName="col-span-full"
                onChange={(e) => handleUncategorizedChange(e.target.checked)}
            />
            <span className="relative col-span-full">
                <input type="text" ref={ref} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full focus:outline-none border rounded-md p-2 text-base md:text-sm" />

                {isFocused &&
                    <div className="z-10 absolute top-[calc(100%+4px)] border left-0 w-full bg-white dark:bg-zinc-900 shadow-sm rounded-md p-2 text-base md:text-sm vertical gap-1 max-h-[200px] overflow-y-auto">
                        {categoriesToShow.length === 0 && search?.trim() !== '' && <p className="text-gray-500 dark:text-zinc-300 text-sm font-light">No matching categories</p>}
                        {categoriesToShow.map((category) => (
                            <button
                                key={category.slug}
                                onMouseDown={() => handleCategoryClick(category.slug)}
                                className="text-gray-500 dark:text-zinc-300 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-zinc-200 w-full dark:hover:bg-zinc-800/20 text-sm font-light horizontal center-v gap-1 px-2 py-1 rounded-md"
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>}
            </span>
            {searchParams.categories &&
                <div className="flex flex-wrap gap-2">
                    {searchParams.categories?.map((categorySlug) => categories?.find((category) => category.slug === categorySlug))
                        .filter((category) => category !== undefined)
                        .map((category) => (
                            <button
                                key={category.slug}
                                className={cn("text-gray-500 border px-2 py-1 rounded-md dark:text-zinc-300 text-sm font-light horizontal center-v gap-1 group relative cursor-pointer border-[var(--color-primary)]")}
                                onClick={() => handleCategoryClick(category.slug)}
                            >
                                <span
                                    className="group-hover:opacity-0 text-[var(--color-primary)]"
                                >
                                    {category.name}
                                </span>
                                <Icons.X className="size-4 hidden group-hover:block absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 stroke-[var(--color-primary)]" />
                            </button>
                        ))}
                </div>
            }
        </div>
    )
}