import { notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { buildQueryString } from "./utils";

type FetchClientOptions = RequestInit & {
    queryParams?: Record<string, string | string[] | undefined | boolean | number>;
}

export const fetchClient = async (path: string | URL | globalThis.Request, options?: FetchClientOptions) => {
    const apiURL = window.location.hostname.endsWith('supaboard.io') ? 'https://api.supaboard.io' : `https://${window.location.hostname}/api`
    const searchParams = options?.queryParams ? buildQueryString(options.queryParams) : undefined;
    try {
        const res = await fetch(`${apiURL}/${path}${searchParams ? `?${searchParams}` : ''}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        
        if (!res.ok) {
            if (res.status === 404) {
                throw notFound();
            }
            const error = await res.json();
            if (error?.code === 'NOT_FOUND') {
                throw notFound();
            }
            throw new Error(error.error || 'Something went wrong');
        }

        return res.json();
    } catch (err: any) {
        if ('isNotFound' in err) {
            throw notFound();
        }
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
        throw err;
    }
}