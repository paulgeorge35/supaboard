import { Icons } from "@/components/icons";
import { fetchClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import { feedbackQuery, FeedbackQueryData, tagsQuery } from "@/routes/__root";
import { Route } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug";
import { useBoolean, useDebounce, useFocus } from "@paulgeorge35/hooks";
import { Tag } from "@repo/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

type TagsProps = {
    feedbackId: string;
    tags: Pick<Tag, 'name' | 'color'>[];
}

export function Tags({ feedbackId, tags: initialTags }: TagsProps) {
    const queryClient = useQueryClient();
    const input = useBoolean(false);
    const { boardSlug, feedbackSlug } = useParams({ from: Route.fullPath });

    const [search, setSearch] = useState<string | undefined>(undefined);
    const { value: debouncedSearch } = useDebounce(search);

    const [ref, isFocused] = useFocus({
        onFocus: () => {
            setSearch('');
            input.setTrue();
        },
        onBlur: () => {
            setSearch('');
        }
    });

    const { data } = useQuery(tagsQuery(debouncedSearch));

    const { mutate: create, isPending: isCreating } = useMutation({
        mutationFn: (name: string) => fetchClient(`admin/tags`, {
            method: 'POST',
            body: JSON.stringify({ name, feedbackId })
        }),
        onMutate: (name) => {
            setSearch(undefined);

            queryClient.cancelQueries({ queryKey: tagsQuery().queryKey });
            queryClient.cancelQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });

            const previousTags = queryClient.getQueryData(tagsQuery().queryKey);
            const previousFeedback = queryClient.getQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey);

            queryClient.setQueryData(tagsQuery().queryKey, (old: Pick<Tag, 'name' | 'color'>[] | undefined) => {
                if (!old) return undefined;
                return [...old, { name, color: '#a684ff' }];
            });

            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, (old: FeedbackQueryData | undefined) => {
                if (!old) return undefined;
                return { ...old, tags: [...(old.tags ?? []), { name, color: '#a684ff' }] };
            });

            return { previousTags, previousFeedback };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(tagsQuery().queryKey, context?.previousTags);
            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, context?.previousFeedback);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: tagsQuery().queryKey });
            queryClient.invalidateQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });
        },
    })

    const { mutate: update, isPending: isUpdating } = useMutation({
        mutationFn: (tags: string[]) => fetchClient(`admin/feedback/${boardSlug}/${feedbackSlug}`, {
            method: 'PUT',
            body: JSON.stringify({ tags })
        }),
        onMutate: (tags) => {
            queryClient.cancelQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });

            const previousFeedback = queryClient.getQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey);

            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, (old: FeedbackQueryData | undefined) => {
                if (!old) return undefined;
                return { ...old, tags: tags.map((tag) => ({ name: tag, color: '#a684ff' })) };
            });

            return { previousFeedback };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, context?.previousFeedback);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });
        },
    })

    const tags = useMemo(() => {
        return data?.filter((tag) => !initialTags.some((t) => t.name === tag.name)) ?? [];
    }, [data, initialTags]);

    const addTag = (tag: string) => {
        const newTags = [...initialTags.map((t) => t.name), tag];
        update(newTags);
        input.setFalse();
    }

    const removeTag = (tag: string) => {
        const newTags = initialTags.filter((t) => t.name !== tag).map((t) => t.name);
        update(newTags);
    }

    const handleCreate = (name: string) => {
        create(name);
        input.setFalse();
    }

    useEffect(() => {
        if (input.value) {
            setSearch('');
            return;
        }
        setSearch(undefined);
    }, [input.value]);

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Tags</h1>
            <button onClick={() => input.toggle()} className="cursor-pointer text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                {input.value ? 'Clear' : 'Add tags'}
            </button>
            <span className="relative col-span-full">
                {search !== undefined &&
                    <input
                        autoFocus
                        ref={ref}
                        disabled={isCreating}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && tags.length === 0 && search && search.trim() !== '' && !initialTags.some((t) => t.name === search)) {
                                handleCreate(search);
                            }
                        }}
                        type="text"
                        placeholder="Add tag"
                        className="w-full col-span-full focus:outline-none border rounded-md p-2 text-base md:text-sm"
                    />}
                {input.value && search &&
                    <div className="z-10 absolute top-[calc(100%+4px)] border left-0 w-full bg-white dark:bg-zinc-900 shadow-sm rounded-md p-2 text-base md:text-sm vertical gap-1 max-h-[200px] overflow-y-auto">
                        {tags.length === 0 && search?.trim() === '' && <p className="text-gray-500 dark:text-zinc-300 text-sm font-light">No matching tags</p>}
                        {search && initialTags.some((t) => t.name === search) && (
                            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light">Tag already exists</p>
                        )}
                        {tags.length === 0 && search && search.trim() !== '' && !initialTags.some((t) => t.name === search) && (
                            <button disabled={isCreating} onMouseDown={() => handleCreate(search)} className="text-gray-500 dark:text-zinc-300 [&>svg]:stroke-gray-500 dark:[&>svg]:stroke-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200 text-sm font-light horizontal center-v gap-1">
                                <Icons.Plus className="size-4" /> Create new tag
                            </button>
                        )}
                        {tags.map((tag) => (
                            <button
                                key={tag.name}
                                disabled={isUpdating}
                                onMouseDown={() => addTag(tag.name)}
                                className="text-gray-500 dark:text-zinc-300 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-zinc-200 w-full dark:hover:bg-zinc-800/20 text-sm font-light horizontal center-v gap-1 px-2 py-1 rounded-md"
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>}
            </span>
            <div className="flex flex-wrap gap-2">
                {initialTags.map((tag) => (
                    <button
                        key={tag.name}
                        className={cn("text-gray-500 border px-2 py-1 rounded-md dark:text-zinc-300 text-sm font-light horizontal center-v gap-1 group relative cursor-pointer border-[var(--color-primary)]")}
                        onClick={() => removeTag(tag.name)}
                    >
                        <span
                            className="group-hover:opacity-0 text-[var(--color-primary)]"
                        >
                            {tag.name}
                        </span>
                        <Icons.X className="size-4 hidden group-hover:block absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 stroke-[var(--color-primary)]" />
                    </button>
                ))}
            </div>
        </div>
    )
}