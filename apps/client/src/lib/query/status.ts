import { queryOptions } from "@tanstack/react-query";
import { fetchClient } from "../client";


export type Status = {
    id: string;
    name: string;
    slug: string;
    color: string;
    type: 'DEFAULT' | 'ACTIVE' | 'COMPLETE' | 'CLOSED'
    order: number;
    includeInRoadmap: boolean;
    applicationId: string;
    createdAt: Date;
    updatedAt: Date;
}

export type StatusType = Status['type']

export const statusesQuery = queryOptions<Status[]>({
    queryKey: ['statuses'],
    queryFn: () => fetchClient('/status'),
    retry: false,
})

export const statusBySlugQuery = (slug?: string) => queryOptions<Status>({
    queryKey: ['status', slug],
    queryFn: () => fetchClient(`/status/${slug}`),
    retry: false,
    enabled: !!slug,
})