import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchClient } from "../client";
import { invitationQuery } from "../query";

export const useRespondInvitationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { inviteId: string, accept: boolean }) => fetchClient('/auth/invitation', { method: 'POST', body: JSON.stringify(data) }),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: invitationQuery.queryKey });

            const previousInvitation = queryClient.getQueryData(invitationQuery.queryKey);

            queryClient.setQueryData(invitationQuery.queryKey, () => {
                return null;
            });

            return { previousInvitation };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(invitationQuery.queryKey, context?.previousInvitation);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: invitationQuery.queryKey });
        },
        onSuccess: (_, data) => {
            if (data.accept) {
                toast.success('You have joined the team');
                window.location.reload();
            } else {
                toast.success('You have rejected the invitation');
            }
        }
    })
}

