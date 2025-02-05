import { toast } from "sonner";

export const fetchClient = async (path: string | URL | globalThis.Request, options?: RequestInit) => {
    const apiURL = window.location.hostname.endsWith('supaboard.io') ? 'https://api.supaboard.io' : `https://${window.location.hostname}/api`
    try {
        const res = await fetch(`${apiURL}/${path}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Something went wrong');
        }

        return res.json();
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
        throw err;
    }
}