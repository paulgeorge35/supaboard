import { Board, Feedback, FeedbackCategory, RoadmapSummary, User } from "@repo/database";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRouter, useSearch } from "@tanstack/react-router";
import { v4 as uuidv4 } from 'uuid';
import { fetchClient } from "../client";
import { applicationBoardsQuery, ApplicationBoardsQueryData, applicationQuery, ApplicationQueryData, feedbackQuery, FeedbackQueryData, statusesQuery } from "../query";
import { archivedRoadmapsQuery, RoadmapDetailResponse, roadmapQuery, roadmapsQuery } from "../query/roadmap";

export const useCreateRoadmapMutation = () => {
    const queryClient = useQueryClient();
    const search = useSearch({ from: '/admin/roadmap' });
    const router = useRouter();

    return useMutation({
        mutationFn: (name: string) => fetchClient(`/roadmap/`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        }),
        onMutate: (name) => {
            queryClient.cancelQueries({ queryKey: roadmapsQuery.queryKey });

            const previousRoadmaps = queryClient.getQueryData<RoadmapSummary[]>(roadmapsQuery.queryKey);

            queryClient.setQueryData(roadmapsQuery.queryKey, (old: RoadmapSummary[] | undefined) => [...(old ?? []), { id: uuidv4(), name, slug: 'new', _count: { items: 0 } }]);

            return { previousRoadmaps };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(roadmapsQuery.queryKey, context?.previousRoadmaps);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: roadmapsQuery.queryKey });
        },
        onSuccess: (data) => {
            router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug: data.slug }, search });
        },
    })
}

export const useRenameRoadmapMutation = (roadmapSlug: string, remoteQueryClient?: QueryClient) => {
    const queryClient = useQueryClient();
    const search = useSearch({ from: '/admin/roadmap' });
    const router = useRouter();
    return useMutation({
        mutationFn: (name: string) => fetchClient(`/roadmap/${roadmapSlug}/rename`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        }),
        onMutate: (name) => {
            remoteQueryClient?.cancelQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
            queryClient.cancelQueries({ queryKey: roadmapsQuery.queryKey });
            queryClient.cancelQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });

            const previousRoadmaps = queryClient.getQueryData<RoadmapSummary[]>(roadmapsQuery.queryKey);
            const previousRoadmap = queryClient.getQueryData<RoadmapDetailResponse>(roadmapQuery(roadmapSlug).queryKey);

            remoteQueryClient?.setQueryData(roadmapQuery(roadmapSlug).queryKey, (old: RoadmapDetailResponse | undefined) => old ? { ...old, name } : undefined);
            queryClient.setQueryData(roadmapsQuery.queryKey, (old: RoadmapSummary[] | undefined) => old?.map(roadmap => roadmap.slug === roadmapSlug ? { ...roadmap, name } : roadmap));
            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, (old: RoadmapDetailResponse | undefined) => old ? { ...old, name } : undefined);


            return { previousRoadmaps, previousRoadmap };
        },
        onError: (error, __, context) => {
            remoteQueryClient?.setQueryData(roadmapQuery(roadmapSlug).queryKey, context?.previousRoadmap);

            queryClient.setQueryData(roadmapsQuery.queryKey, context?.previousRoadmaps);
            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, context?.previousRoadmap);
        },
        onSettled: () => {
            remoteQueryClient?.invalidateQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });

            queryClient.invalidateQueries({ queryKey: roadmapsQuery.queryKey });
            queryClient.invalidateQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
        },
        onSuccess: () => {
            router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug: roadmapSlug }, replace: true, search });
        },
    })
}

export const useDuplicateRoadmapMutation = (roadmapSlug?: string) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const search = useSearch({ from: '/admin/roadmap' });

    return useMutation({
        mutationFn: () => fetchClient(`/roadmap/${roadmapSlug}/duplicate`, { method: 'POST' }),
        onMutate: () => {
            queryClient.cancelQueries({ queryKey: roadmapsQuery.queryKey });

            const previousRoadmaps = queryClient.getQueryData<RoadmapSummary[]>(roadmapsQuery.queryKey);

            const roadmap = previousRoadmaps?.find(roadmap => roadmap.slug === roadmapSlug);

            if (!roadmap) return;

            queryClient.setQueryData(roadmapsQuery.queryKey, (old: RoadmapSummary[] | undefined) => [...(old ?? []), { ...roadmap, id: uuidv4(), name: `${roadmap.name} (Copy)`, slug: `${roadmap.slug}-copy` }]);

            return { previousRoadmaps };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(roadmapsQuery.queryKey, context?.previousRoadmaps);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: roadmapsQuery.queryKey });
        },
        onSuccess: (data) => {
            router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug: data.slug }, search });
        },
    })
}

type FeedbackPlaceholder = (Pick<Feedback, 'id' | 'title' | 'slug' | 'estimatedDelivery'> & {
    votes: number;
    tags: string[];
    owner: Pick<User, 'id' | 'name' | 'avatar'> | null;
    category: Pick<FeedbackCategory, 'name' | 'slug'> | null;
    board: Pick<Board, 'name' | 'slug'>;
})

export const useAddToRoadmapMutation = (roadmapSlug: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ feedbackId, feedback: _ }: { feedbackId: string, feedback: FeedbackPlaceholder }) => fetchClient(`/roadmap/${roadmapSlug}/${feedbackId}/add`, {
            method: 'POST',
        }),
        onMutate: async ({ feedback }) => {
            queryClient.cancelQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
            queryClient.cancelQueries({ queryKey: feedbackQuery(feedback.board.slug, feedback.slug).queryKey });

            const previousRoadmap = queryClient.getQueryData<RoadmapDetailResponse>(roadmapQuery(roadmapSlug).queryKey);
            const previousFeedback = queryClient.getQueryData<FeedbackQueryData>(feedbackQuery(feedback.board.slug, feedback.slug).queryKey);

            const defaultStatus = await queryClient.fetchQuery(statusesQuery).then(statuses => statuses.find(status => status.type === 'DEFAULT'));

            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, (old: RoadmapDetailResponse | undefined) => {
                if (!old) return undefined;

                return {
                    ...old,
                    items: [...old.items, { ...feedback, status: defaultStatus!, impact: 0, effort: 1 }],
                };
            });

            queryClient.setQueryData(feedbackQuery(feedback.board.slug, feedback.slug).queryKey, (old: FeedbackQueryData | undefined) => {
                if (!old) return undefined;

                if (previousRoadmap) {
                    return { ...old, roadmaps: [...old.roadmaps, { ...previousRoadmap, items: [...previousRoadmap.items, { ...feedback, impact: 0, effort: 1 }], _count: { items: 0 } }] };
                }

                return old;
            });

            return { previousRoadmap, previousFeedback };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, context?.previousRoadmap);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
        },
    })
}

export const useRemoveFromRoadmapMutation = (roadmapSlug: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ feedbackId, feedbackSlug: _, boardSlug: __ }: { feedbackId: string, feedbackSlug: string, boardSlug: string }) => fetchClient(`/roadmap/${roadmapSlug}/${feedbackId}/remove`, {
            method: 'POST',
        }),
        onMutate: ({ feedbackId, feedbackSlug, boardSlug }) => {
            queryClient.cancelQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
            queryClient.cancelQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });

            const previousRoadmap = queryClient.getQueryData<RoadmapDetailResponse>(roadmapQuery(roadmapSlug).queryKey);
            const previousFeedback = queryClient.getQueryData<FeedbackQueryData>(feedbackQuery(boardSlug, feedbackSlug).queryKey);

            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, (old: RoadmapDetailResponse | undefined) => {
                if (!old) return undefined;

                return { ...old, items: old.items.filter(item => item.id !== feedbackId) };
            });

            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, (old: FeedbackQueryData | undefined) => {
                if (!old) return undefined;

                return { ...old, roadmaps: old.roadmaps.filter(roadmap => roadmap.slug !== roadmapSlug) };
            });

            return { previousRoadmap, previousFeedback };
        },
        onError: (_, { feedbackSlug, boardSlug }, context) => {
            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, context?.previousRoadmap);
            queryClient.setQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey, context?.previousFeedback);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
        },
    })
}

export const useAddNewRoadmapItemMutation = (roadmapSlug: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ title, board }: { title: string, board: Pick<Board, 'name' | 'slug'> }) => fetchClient(`/feedback/${roadmapSlug}/add`, {
            method: 'POST',
            body: JSON.stringify({ title, boardSlug: board.slug }),
        }),
        onMutate: async ({ title, board }) => {
            queryClient.cancelQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });

            const previousRoadmap = queryClient.getQueryData<RoadmapDetailResponse>(roadmapQuery(roadmapSlug).queryKey);

            const defaultStatus = await queryClient.fetchQuery(statusesQuery).then(statuses => statuses.find(status => status.type === 'DEFAULT'));

            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, (old: RoadmapDetailResponse | undefined) => {
                if (!old) return undefined;

                return {
                    ...old,
                    items: [
                        ...old.items,
                        {
                            id: uuidv4(),
                            title,
                            slug: 'new',
                            status: defaultStatus!,
                            estimatedDelivery: null,
                            votes: 0,
                            tags: [],
                            owner: null,
                            category: null,
                            board: { id: uuidv4(), name: board.name, slug: board.slug },
                            impact: 0,
                            effort: 1
                        }
                    ],
                };
            });

            return { previousRoadmap };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, context?.previousRoadmap);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
        },
    })
}

export const useUpdateRoadmapItemMutation = (roadmapSlug: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ feedbackId, impact, effort }: { feedbackId: string, impact?: number, effort?: number }) => fetchClient(`/roadmap/${roadmapSlug}/${feedbackId}/update`, {
            method: 'PUT',
            body: JSON.stringify({ impact, effort }),
        }),
        onMutate: ({ feedbackId, impact, effort }) => {
            queryClient.cancelQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });

            const previousRoadmap = queryClient.getQueryData<RoadmapDetailResponse>(roadmapQuery(roadmapSlug).queryKey);

            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, (old: RoadmapDetailResponse | undefined) => {
                if (!old) return undefined;

                return {
                    ...old,
                    items: old.items.map(item => item.id === feedbackId ? { ...item, impact: impact ?? item.impact, effort: effort ?? item.effort } : item),
                };
            });

            return { previousRoadmap };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, context?.previousRoadmap);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
        },
    })
}

type CreateFeedbackValues = {
    title: string;
    description?: string;
    board: string;
    categoryId?: string;
}

export const useCreateFeedbackMutation = (roadmapSlug: string) => {
    const queryClient = useQueryClient();
    const search = useSearch({ from: '/admin/roadmap' });
    const router = useRouter();

    return useMutation({
        mutationFn: (values: CreateFeedbackValues) => fetchClient(`/feedback/${values.board}/create`, {
            method: 'POST',
            body: JSON.stringify({ ...values, roadmapSlug }),
        }),
        onMutate: async (values) => {
            queryClient.cancelQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });

            const previousRoadmap = queryClient.getQueryData<RoadmapDetailResponse>(roadmapQuery(roadmapSlug).queryKey);

            const defaultStatus = await queryClient.fetchQuery(statusesQuery).then(statuses => statuses.find(status => status.type === 'DEFAULT'));

            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, (old: RoadmapDetailResponse | undefined) => {
                if (!old) return undefined;

                return {
                    ...old,
                    items: [...old.items, { ...values, id: uuidv4(), board: { name: "", slug: values.board }, slug: 'new', status: defaultStatus!, estimatedDelivery: null, votes: 0, tags: [], owner: null, category: null, impact: 0, effort: 1 }],
                };
            });

            return { previousRoadmap };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, context?.previousRoadmap);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
        },
        onSuccess: () => {
            router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug: roadmapSlug }, search });
        },
    })
}

type UpdateRoadmapSettingsValues = {
    isPublic?: boolean;
    includeInRoadmap?: string[];
}

type UseUpdateRoadmapSettingsMutationProps = {
    onSuccess?: () => void;
}

export const useUpdateRoadmapSettingsMutation = ({ onSuccess }: UseUpdateRoadmapSettingsMutationProps) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (settings: UpdateRoadmapSettingsValues) => fetchClient(`/roadmap/settings`, {
            method: 'PUT',
            body: JSON.stringify(settings),
        }),
        onMutate: (settings) => {
            queryClient.cancelQueries({ queryKey: applicationQuery.queryKey });
            queryClient.cancelQueries({ queryKey: applicationBoardsQuery.queryKey });

            const previousApplication = queryClient.getQueryData<ApplicationQueryData>(applicationQuery.queryKey);
            const previousBoards = queryClient.getQueryData<ApplicationBoardsQueryData>(applicationBoardsQuery.queryKey);

            queryClient.setQueryData(applicationQuery.queryKey, (old: ApplicationQueryData | undefined) => old ? { ...old, isRoadmapPublic: settings.isPublic ?? old.isRoadmapPublic } : undefined);
            queryClient.setQueryData(applicationBoardsQuery.queryKey, (old: ApplicationBoardsQueryData | undefined) => {
                if (!old) return undefined;

                return old.map(board => ({ ...board, includeInRoadmap: settings.includeInRoadmap ? settings.includeInRoadmap.includes(board.slug) : board.includeInRoadmap }));
            });

            return { previousApplication, previousBoards };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(applicationQuery.queryKey, context?.previousApplication);
            queryClient.setQueryData(applicationBoardsQuery.queryKey, context?.previousBoards);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: applicationQuery.queryKey });
            queryClient.invalidateQueries({ queryKey: applicationBoardsQuery.queryKey });
        },
        onSuccess: () => {
            onSuccess?.();
        }
    })
}

export const useArchiveRoadmapMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roadmapSlug: string) => fetchClient(`/roadmap/${roadmapSlug}/archive`, { method: 'POST' }),
        onMutate: (roadmapSlug) => {
            queryClient.cancelQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
            queryClient.cancelQueries({ queryKey: roadmapsQuery.queryKey });
            queryClient.cancelQueries({ queryKey: archivedRoadmapsQuery.queryKey });

            const previousRoadmap = queryClient.getQueryData<RoadmapDetailResponse>(roadmapQuery(roadmapSlug).queryKey);
            const previousRoadmaps = queryClient.getQueryData<RoadmapSummary[]>(roadmapsQuery.queryKey);
            const previousArchivedRoadmaps = queryClient.getQueryData<RoadmapSummary[]>(archivedRoadmapsQuery.queryKey);

            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, (old: RoadmapDetailResponse | undefined) => old ? { ...old, isArchived: true } : undefined);
            queryClient.setQueryData(roadmapsQuery.queryKey, (old: RoadmapSummary[] | undefined) => old?.filter(roadmap => roadmap.slug !== roadmapSlug));
            queryClient.setQueryData(archivedRoadmapsQuery.queryKey, (old: RoadmapSummary[] | undefined) => [...(old ?? []), { ...previousRoadmaps?.find(roadmap => roadmap.slug === roadmapSlug)!, _count: { items: 0 } }]);

            return { previousRoadmap, previousRoadmaps, previousArchivedRoadmaps };
        },
        onError: (_, roadmapSlug, context) => {
            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, context?.previousRoadmap);
            queryClient.setQueryData(roadmapsQuery.queryKey, context?.previousRoadmaps);
            queryClient.setQueryData(archivedRoadmapsQuery.queryKey, context?.previousArchivedRoadmaps);
        },
        onSettled: (_, __, roadmapSlug) => {
            queryClient.invalidateQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
            queryClient.invalidateQueries({ queryKey: roadmapsQuery.queryKey });
            queryClient.invalidateQueries({ queryKey: archivedRoadmapsQuery.queryKey });
        },
    })
}

export const useRestoreRoadmapMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roadmapSlug: string) => fetchClient(`/roadmap/${roadmapSlug}/restore`, { method: 'POST' }),
        onMutate: (roadmapSlug) => {
            queryClient.cancelQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
            queryClient.cancelQueries({ queryKey: roadmapsQuery.queryKey });
            queryClient.cancelQueries({ queryKey: archivedRoadmapsQuery.queryKey });

            const previousRoadmap = queryClient.getQueryData<RoadmapDetailResponse>(roadmapQuery(roadmapSlug).queryKey);
            const previousRoadmaps = queryClient.getQueryData<RoadmapSummary[]>(roadmapsQuery.queryKey);
            const previousArchivedRoadmaps = queryClient.getQueryData<RoadmapSummary[]>(archivedRoadmapsQuery.queryKey);

            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, (old: RoadmapDetailResponse | undefined) => old ? { ...old, isArchived: false } : undefined);
            queryClient.setQueryData(roadmapsQuery.queryKey, (old: RoadmapSummary[] | undefined) => [...(old ?? []), { ...previousArchivedRoadmaps?.find(roadmap => roadmap.slug === roadmapSlug)!, _count: { items: 0 } }]);
            queryClient.setQueryData(archivedRoadmapsQuery.queryKey, (old: RoadmapSummary[] | undefined) => old?.filter(roadmap => roadmap.slug !== roadmapSlug));

            return { previousRoadmap, previousRoadmaps, previousArchivedRoadmaps };
        },
        onError: (_, roadmapSlug, context) => {
            queryClient.setQueryData(roadmapQuery(roadmapSlug).queryKey, context?.previousRoadmap);
            queryClient.setQueryData(roadmapsQuery.queryKey, context?.previousRoadmaps);
            queryClient.setQueryData(archivedRoadmapsQuery.queryKey, context?.previousArchivedRoadmaps);
        },
        onSettled: (_, __, roadmapSlug) => {
            queryClient.invalidateQueries({ queryKey: roadmapQuery(roadmapSlug).queryKey });
            queryClient.invalidateQueries({ queryKey: roadmapsQuery.queryKey });
            queryClient.invalidateQueries({ queryKey: archivedRoadmapsQuery.queryKey });
        },
    })
}

type UseDeleteRoadmapMutationProps = {
    onSuccess?: () => void;
}

export const useDeleteRoadmapMutation = ({ onSuccess }: UseDeleteRoadmapMutationProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const location = useLocation();
    const search = useSearch({ strict: false });

    return useMutation({
        mutationFn: (roadmapSlug: string) => fetchClient(`/roadmap/${roadmapSlug}/delete`, { method: 'POST' }),
        onMutate: (roadmapSlug) => {
            queryClient.cancelQueries({ queryKey: roadmapsQuery.queryKey });
            queryClient.cancelQueries({ queryKey: archivedRoadmapsQuery.queryKey });

            const previousRoadmaps = queryClient.getQueryData<RoadmapSummary[]>(roadmapsQuery.queryKey);
            const previousArchivedRoadmaps = queryClient.getQueryData<RoadmapSummary[]>(archivedRoadmapsQuery.queryKey);

            queryClient.setQueryData(roadmapsQuery.queryKey, (old: RoadmapSummary[] | undefined) => old?.filter(roadmap => roadmap.slug !== roadmapSlug));
            queryClient.setQueryData(archivedRoadmapsQuery.queryKey, (old: RoadmapSummary[] | undefined) => old?.filter(roadmap => roadmap.slug !== roadmapSlug));

            return { previousRoadmaps, previousArchivedRoadmaps };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(roadmapsQuery.queryKey, context?.previousRoadmaps);
            queryClient.setQueryData(archivedRoadmapsQuery.queryKey, context?.previousArchivedRoadmaps);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: roadmapsQuery.queryKey });
            queryClient.invalidateQueries({ queryKey: archivedRoadmapsQuery.queryKey });
        },
        onSuccess: () => {
            if (location.pathname === '/admin/roadmap') {
                router.navigate({ to: '/admin/roadmap', replace: true, search });
            }

            onSuccess?.();
        },
    })
}