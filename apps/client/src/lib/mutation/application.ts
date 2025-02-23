import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchClient } from "../client";

export const useDeleteApplicationMutation = () => {
    return useMutation({
        mutationFn: () => fetchClient(`/application`, { method: 'DELETE' }),
        onSuccess: () => {
            toast.success('Application deleted');
            window.location.href = 'https://supaboard.io';

        },
        onError: () => {
            toast.error('Failed to delete application');
        },
    })
}

