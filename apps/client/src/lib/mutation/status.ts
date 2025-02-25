import { Status } from "@repo/database";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from 'uuid';
import { fetchClient } from "../client";
import { statusesQuery, StatusType } from "../query";

type CreateStatusValues = {
    id: string;
    name: string;
    type: StatusType;
}

type UseCreateStatusMutationProps = {
    onSuccess?: () => void;
}

export const useCreateStatusMutation = ({ onSuccess }: UseCreateStatusMutationProps) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (status: CreateStatusValues) => fetchClient('/status', {
            method: 'POST',
            body: JSON.stringify(status),
        }),
        onMutate: (status) => {
            queryClient.cancelQueries({ queryKey: statusesQuery.queryKey });

            const previousStatuses = queryClient.getQueryData<Status[]>(statusesQuery.queryKey);

            queryClient.setQueryData(statusesQuery.queryKey, (old: Status[] | undefined) => {
                if (!old) return undefined;

                const newStatus: Status = {
                    ...status,
                    color: 'blue-500',
                    slug: uuidv4(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    order: old ? old.length : 0,
                    includeInRoadmap: false,
                    applicationId: old ? old[0].applicationId : '',
                }

                return [...old, newStatus];
            });

            return { previousStatuses };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(statusesQuery.queryKey, context?.previousStatuses);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: statusesQuery.queryKey });
        },
        onSuccess: () => {
            onSuccess?.();
        },
    })
}

type UpdateStatusValues = {
    id: string;
    name?: string;
    color?: string;
    type?: StatusType;
    order?: number;
    includeInRoadmap?: boolean;
}

export const useUpdateStatusMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (status: UpdateStatusValues) => fetchClient(`/status/${status.id}`, {
            method: 'PUT',
            body: JSON.stringify(status),
        }),
        onMutate: (status) => {
            queryClient.cancelQueries({ queryKey: statusesQuery.queryKey });

            const previousStatuses = queryClient.getQueryData<Status[]>(statusesQuery.queryKey);

            queryClient.setQueryData(statusesQuery.queryKey, (old: Status[] | undefined) => {
                if (!old) return undefined;

                const statusToUpdate = old.find(s => s.id === status.id);
                if (!statusToUpdate) return old;

                const typeChanged = status.type && status.type !== statusToUpdate.type;

                const newStatuses = old.map(s => {
                    if (s.id === status.id) {
                        return {
                            ...s,
                            ...status,
                        }
                    }

                    if (typeChanged) {
                        // Order the statuses from the new Type
                        if (s.type === status.type) {
                            return {
                                ...s,
                                order: status.order && s.order >= status.order ? s.order + 1 : s.order,
                            }
                        }
                        // Order the statuses from the old Type
                        if (s.type === statusToUpdate.type) {
                            return {
                                ...s,
                                order: statusToUpdate.order < s.order ? s.order - 1 : s.order,
                            }
                        }
                    }

                    if (status.order && status.order <= s.order && s.type === statusToUpdate.type) {
                        const orderChange = status.order > statusToUpdate.order ? -1 : +1;
                        return {
                            ...s,
                            order: s.order > status.order ? s.order + 1 : s.order + orderChange,
                        }
                    }

                    return s;
                });

                return newStatuses;
            });

            return { previousStatuses };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(statusesQuery.queryKey, context?.previousStatuses);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: statusesQuery.queryKey });
        }
    })
}

export const useDeleteStatusMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => fetchClient(`/status/${id}`, {
            method: 'DELETE',
        }),
        onMutate: (id) => {
            queryClient.cancelQueries({ queryKey: statusesQuery.queryKey });

            const previousStatuses = queryClient.getQueryData<Status[]>(statusesQuery.queryKey);

            queryClient.setQueryData(statusesQuery.queryKey, (old: Status[] | undefined) => {
                if (!old) return undefined;

                const statusToDelete = old.find(s => s.id === id);
                if (!statusToDelete) return old;

                return old.filter(s => s.id !== id).map((s, index) => {
                    if (s.type === statusToDelete.type && s.order > statusToDelete.order) {
                        return {
                            ...s,
                            order: s.order - 1,
                        }
                    }

                    return s;
                });
            });

            return { previousStatuses };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(statusesQuery.queryKey, context?.previousStatuses);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: statusesQuery.queryKey });
        },
    })
}