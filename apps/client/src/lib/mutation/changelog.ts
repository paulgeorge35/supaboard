import { Changelog, ChangelogDetailed, ChangelogLabelSummary, ChangelogTag } from "@repo/database";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { v4 as uuidv4 } from 'uuid';
import { fetchClient } from "../client";
import { changelogLabelsQuery, changelogPublicBySlugQuery, changelogPublicQuery, changelogsInfiniteQuery } from "../query/changelog";

type CreateChangelogValues = {
    title: string;
    description?: string;
    tags?: ChangelogTag[];
    labelIds?: string[];
}

export const useCreateChangelogMutation = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: CreateChangelogValues) => fetchClient(`/changelog`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        onMutate: () => {
            queryClient.cancelQueries({ queryKey: changelogsInfiniteQuery({}).queryKey });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: changelogsInfiniteQuery({}).queryKey });
        },
        onSuccess: (data) => {
            router.navigate({ to: '/admin/changelog/$changelogSlug/edit', params: { changelogSlug: data.slug }, replace: true });
        },
    })
}

type UpdateChangelogValues = {
    title: string;
    description?: string;
    tags?: ChangelogTag[];
    labelIds?: string[];
    feedbackIds?: string[];
}

type UseUpdateChangelogMutation = {
    onSuccess?: () => void;
    onMutate?: (variables: UpdateChangelogValues) => void;
    onError?: (error: any, variables: any, context: any) => void;
    onSettled?: () => void;
}

export const useUpdateChangelogMutation = ({ onSuccess, onMutate, onError, onSettled }: UseUpdateChangelogMutation) => {
    const router = useRouter();
    const { changelogSlug } = useParams({ from: '/admin/changelog/$changelogSlug/edit' });

    return useMutation<ChangelogDetailed, any, UpdateChangelogValues>({
        mutationFn: (data) => fetchClient(`/changelog/${changelogSlug}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        onSuccess: (data) => {
            if (data.slug !== changelogSlug) {
                router.navigate({ to: '/admin/changelog/$changelogSlug/edit', params: { changelogSlug: data.slug }, replace: true });
            }

            onSuccess?.();
        },
        onMutate: (variables) => {
            onMutate?.(variables);
        },
        onError,
        onSettled,
    })
}

export const useDeleteChangelogMutation = () => {
    const router = useRouter();
    const { changelogSlug } = useParams({ from: '/admin/changelog/$changelogSlug/edit' });

    return useMutation<void, any, string>({
        mutationFn: () => fetchClient(`/changelog/${changelogSlug}`, { method: 'DELETE' }),
        onSuccess: () => {
            router.navigate({ to: '/admin/changelog', replace: true });
        },
    })
}

export const useLinkFeedbackMutation = () => {
    const { changelogSlug } = useParams({ from: '/admin/changelog/$changelogSlug/edit' });

    return useMutation<void, any, string>({
        mutationFn: (feedbackId) => fetchClient(`/changelog/${changelogSlug}/${feedbackId}/link`, { method: 'POST' }),
    })
}

export const useUnlinkFeedbackMutation = () => {
    const { changelogSlug } = useParams({ from: '/admin/changelog/$changelogSlug/edit' });

    return useMutation<void, any, string>({
        mutationFn: (feedbackId) => fetchClient(`/changelog/${changelogSlug}/${feedbackId}/unlink`, { method: 'POST' }),
    })
}

type UseCreateLabelMutation = {
    onSuccess?: () => void;
    onMutate?: (name: string) => void;
    onError?: (error: any, variables: any, context: any) => void;
    onSettled?: () => void;
}

export const useCreateLabelMutation = ({ onSuccess, onError, onMutate, onSettled }: UseCreateLabelMutation) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: string) => fetchClient(`/changelog/labels`, { method: 'POST', body: JSON.stringify({ name }) }),
        onMutate: async (name) => {
            onMutate?.(name);
            await queryClient.cancelQueries(changelogLabelsQuery);

            const previousLabels = queryClient.getQueryData<ChangelogLabelSummary[]>(changelogLabelsQuery.queryKey);

            queryClient.setQueryData(changelogLabelsQuery.queryKey, (old: ChangelogLabelSummary[] | undefined) => {
                if (!old) return undefined;
                return [...old, { id: uuidv4(), name, count: 0 }];
            });

            return { previousLabels };
        },
        onError: (error, variables, context) => {
            onError?.(error, variables, context);
            queryClient.setQueryData(changelogLabelsQuery.queryKey, context?.previousLabels);
        },
        onSettled: () => {
            onSettled?.();
            queryClient.invalidateQueries(changelogLabelsQuery);
        },
        onSuccess,
    })
}

export const useUpdateLabelMutation = (callback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, name }: { id: string, name: string }) => fetchClient(`/changelog/labels/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
        onMutate: async ({ id, name }) => {
            await queryClient.cancelQueries(changelogLabelsQuery);

            const previousLabels = queryClient.getQueryData<ChangelogLabelSummary[]>(changelogLabelsQuery.queryKey);

            queryClient.setQueryData(changelogLabelsQuery.queryKey, (old: ChangelogLabelSummary[] | undefined) => {
                if (!old) return undefined;
                return old.map(label => label.id === id ? { ...label, name } : label);
            });

            callback?.();

            return { previousLabels };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(changelogLabelsQuery.queryKey, context?.previousLabels);
        },
        onSettled: () => {
            queryClient.invalidateQueries(changelogLabelsQuery);
        },
    })
}

export const useDeleteLabelMutation = (callback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => fetchClient(`/changelog/labels/${id}`, { method: 'DELETE' }),
        onMutate: async (id) => {
            await queryClient.cancelQueries(changelogLabelsQuery);

            const previousLabels = queryClient.getQueryData<ChangelogLabelSummary[]>(changelogLabelsQuery.queryKey);

            queryClient.setQueryData(changelogLabelsQuery.queryKey, (old: ChangelogLabelSummary[] | undefined) => {
                if (!old) return undefined;
                return old.filter(label => label.id !== id);
            });

            callback?.();

            return { previousLabels };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(changelogLabelsQuery.queryKey, context?.previousLabels);
        },
        onSettled: () => {
            queryClient.invalidateQueries(changelogLabelsQuery);
        },
    })
}

type UsePublishChangelogMutation = {
    onSuccess?: () => void;
    onMutate?: () => void;
    onError?: (error: any, variables: any, context: any) => void;
    onSettled?: () => void;
}

export const usePublishChangelogMutation = ({ onSuccess, onMutate, onError, onSettled }: UsePublishChangelogMutation) => {
    const router = useRouter();
    const { changelogSlug } = useParams({ from: '/admin/changelog/$changelogSlug/edit' });

    return useMutation<void, any, void>({
        mutationFn: () => fetchClient(`/changelog/${changelogSlug}/publish`, { method: 'PUT' }),
        onSuccess: () => {
            onSuccess?.();
            router.navigate({ to: '/admin/changelog/$changelogSlug/edit', params: { changelogSlug }, replace: true });
        },
        onMutate,
        onError,
        onSettled,
    })
}

type UseUnpublishChangelogMutation = {
    onMutate?: () => void;
    onError?: (error: any, variables: any, context: any) => void;
    onSuccess?: () => void;
    onSettled?: () => void;
}

export const useUnpublishChangelogMutation = ({ onMutate, onError, onSuccess, onSettled }: UseUnpublishChangelogMutation) => {
    const { changelogSlug } = useParams({ from: '/admin/changelog/$changelogSlug/edit' });

    return useMutation<void, any, void>({
        mutationFn: () => fetchClient(`/changelog/${changelogSlug}/unpublish`, { method: 'PUT' }),
        onMutate,
        onError,
        onSuccess,
        onSettled,
    })
}

type UseScheduleChangelogMutation = {
    onSuccess?: () => void;
}

export const useScheduleChangelogMutation = ({ onSuccess }: UseScheduleChangelogMutation) => {
    const { changelogSlug } = useParams({ from: '/admin/changelog/$changelogSlug/edit' });

    return useMutation<void, any, Date>({
        mutationFn: (date) => fetchClient(`/changelog/${changelogSlug}/schedule`, { method: 'PUT', body: JSON.stringify({ date }) }),
        onSuccess,
    })
}

type UseUnscheduleChangelogMutation = {
    onSuccess?: () => void;
}

export const useUnscheduleChangelogMutation = ({ onSuccess }: UseUnscheduleChangelogMutation) => {
    const { changelogSlug } = useParams({ from: '/admin/changelog/$changelogSlug/edit' });

    return useMutation<void, any, void>({
        mutationFn: () => fetchClient(`/changelog/${changelogSlug}/unschedule`, { method: 'PUT' }),
        onSuccess,
    })
}

type LikeChangelogValues = {
    changelogSlug: string;
    likedByMe: boolean;
    likes: number;
}

export const useLikeChangelogMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ changelogSlug }: LikeChangelogValues) => fetchClient(`/changelog/public/${changelogSlug}/like`, { method: 'POST' }),
        onMutate: async ({ changelogSlug, likedByMe, likes }) => {
            await queryClient.cancelQueries(changelogPublicBySlugQuery(changelogSlug));
            await queryClient.cancelQueries(changelogPublicQuery);

            const previousChangelog = queryClient.getQueryData<Changelog & { likes: number, likedByMe: boolean }>(changelogPublicBySlugQuery(changelogSlug).queryKey);
            const previousChangelogs = queryClient.getQueryData<(Changelog & { likes: number, likedByMe: boolean })[]>(changelogPublicQuery.queryKey);

            queryClient.setQueryData(changelogPublicBySlugQuery(changelogSlug).queryKey, (old: Changelog & { likes: number, likedByMe: boolean } | undefined) => {
                if (!old) return undefined;
                return { ...old, likes: likedByMe ? likes - 1 : likes + 1, likedByMe: !likedByMe };
            });

            queryClient.setQueryData(changelogPublicQuery.queryKey, (old: (Changelog & { likes: number, likedByMe: boolean })[] | undefined) => {
                if (!old) return undefined;
                return old.map(changelog => changelog.slug === changelogSlug ? { ...changelog, likes: likedByMe ? likes - 1 : likes + 1, likedByMe: !likedByMe } : changelog);
            });

            return { previousChangelog, previousChangelogs };
        },
        onError: (_, { changelogSlug }, context) => {
            queryClient.setQueryData(changelogPublicBySlugQuery(changelogSlug).queryKey, context?.previousChangelog);
            queryClient.setQueryData(changelogPublicQuery.queryKey, context?.previousChangelogs);
        },
        onSettled: (_, __, { changelogSlug }) => {
            queryClient.invalidateQueries(changelogPublicBySlugQuery(changelogSlug));
            queryClient.invalidateQueries(changelogPublicQuery);
        },
    })
}