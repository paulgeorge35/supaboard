import { Button } from "@/components/button";
import { Icons } from "@/components/icons";
import { fetchClient } from "@/lib/client";
import { feedbackQuery, FeedbackQueryData, roadmapsQuery } from "@/lib/query";
import { Route } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug";
import { useBoolean, useFocus } from "@paulgeorge35/hooks";
import { RoadmapSummary } from "@repo/database";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { RoadmapsSkeleton } from './skeletons';

type RoadmapsProps = {
    feedbackId: string;
    roadmaps: RoadmapSummary[];
    isLoading: boolean;
}

export const Roadmaps = ({ feedbackId, roadmaps: initialRoadmaps, isLoading }: RoadmapsProps) => {
    const queryClient = useQueryClient();
    const input = useBoolean(false);
    const { boardSlug, feedbackSlug } = useParams({ from: Route.fullPath });

    const { data, isLoading: isRoadmapsLoading } = useQuery(roadmapsQuery);

    const [search, setSearch] = useState<string | undefined>(undefined);

    const [ref, isFocused] = useFocus({
        onFocus: () => {
            setSearch('');
            input.setTrue();
        },
        onBlur: () => {
            setSearch('');
        }
    });

    const { mutate: addToRoadmap } = useMutation({
        mutationFn: ({ feedbackId, roadmapSlug }: { feedbackId: string, roadmapSlug: string }) => fetchClient(`/roadmap/${roadmapSlug}/${feedbackId}/add`, {
            method: 'POST',
        }),
        onMutate: ({ roadmapSlug }) => {
            queryClient.cancelQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });

            const previousFeedback = queryClient.getQueryData<FeedbackQueryData>(feedbackQuery(boardSlug, feedbackSlug).queryKey);

            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, (old: FeedbackQueryData | undefined) => {
                if (!old) return undefined;

                return {
                    ...old,
                    roadmaps: [...old.roadmaps, { id: uuidv4(), name: data?.find((roadmap) => roadmap.slug === roadmapSlug)?.name ?? '', slug: roadmapSlug }]
                };
            });

            return { previousFeedback };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, context?.previousFeedback);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });
        }
    })

    const { mutate: removeFromRoadmap } = useMutation({
        mutationFn: ({ feedbackId, roadmapSlug }: { feedbackId: string, roadmapSlug: string }) => fetchClient(`/roadmap/${roadmapSlug}/${feedbackId}/remove`, {
            method: 'POST',
        }),
        onMutate: ({ roadmapSlug }) => {
            queryClient.cancelQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });

            const previousFeedback = queryClient.getQueryData<FeedbackQueryData>(feedbackQuery(boardSlug, feedbackSlug).queryKey);

            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, (old: FeedbackQueryData | undefined) => {
                if (!old) return undefined;

                return {
                    ...old,
                    roadmaps: old.roadmaps.filter((roadmap) => roadmap.slug !== roadmapSlug),
                };
            });

            return { previousFeedback };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, context?.previousFeedback);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });
        }
    })

    const roadmaps = useMemo(() => {
        return data?.filter((roadmap) => !initialRoadmaps.some((t) => t.id === roadmap.id) && roadmap.name.toLowerCase().includes(search?.toLowerCase() ?? '')) ?? [];
    }, [data, initialRoadmaps]);

    useEffect(() => {
        if (input.value) {
            setSearch('');
            return;
        }
        setSearch(undefined);
    }, [input.value]);

    if (isLoading || isRoadmapsLoading) {
        return <RoadmapsSkeleton />
    }

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Roadmaps</h1>
            <button onClick={() => input.toggle()} className="cursor-pointer text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                Add to roadmap
            </button>
            <span className="relative col-span-full">
                {search !== undefined &&
                    <input
                        ref={ref}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        type="text"
                        placeholder="Add roadmap"
                        className="w-full col-span-full focus:outline-none border rounded-md p-2 text-base md:text-sm"
                    />}
                {input.value && isFocused &&
                    <div className="z-10 absolute top-[calc(100%+4px)] border left-0 w-full bg-white dark:bg-zinc-900 shadow-sm rounded-md p-2 text-base md:text-sm vertical gap-1 max-h-[200px] overflow-y-auto">
                        {roadmaps.length === 0 && <p className="text-gray-500 dark:text-zinc-300 text-sm font-light">No matching roadmaps</p>}
                        {roadmaps.map((roadmap) => (
                            <button
                                key={roadmap.id}
                                onMouseDown={() => addToRoadmap({ feedbackId, roadmapSlug: roadmap.slug })}
                                className="text-gray-500 dark:text-zinc-300 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-zinc-200 w-full dark:hover:bg-zinc-800/20 text-sm font-light horizontal center-v gap-1 px-2 py-1 rounded-md"
                            >
                                {roadmap.name}
                            </button>
                        ))}
                    </div>}
            </span>
            {initialRoadmaps.length > 0 &&
                <div className="flex flex-wrap gap-2 col-span-full w-full">
                    {initialRoadmaps.map((roadmap) => (
                        <div key={roadmap.id} className="horizontal gap-2 items-center w-full">
                            <Link
                                to={'/admin/roadmap/$roadmapSlug'}
                                params={{ roadmapSlug: roadmap.slug }}
                                className="text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200 w-full text-sm font-light horizontal center-v gap-1"
                            >
                                {roadmap.name}
                            </Link>
                            <Button variant="ghost" size="icon" className="shrink-0 aspect-square" onClick={() => removeFromRoadmap({ feedbackId, roadmapSlug: roadmap.slug })}>
                                <Icons.X className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            }
        </div>
    )
}