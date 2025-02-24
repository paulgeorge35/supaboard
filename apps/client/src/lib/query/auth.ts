import { ApplicationInvite, ApplicationSummary, BoardSummary, Role, UserSummary, Workspace } from "@repo/database";
import { queryOptions } from "@tanstack/react-query";
import { fetchClient } from "../client";

export type MeQueryData = {
    user: UserSummary;
    application: ApplicationSummary & {
        boards: BoardSummary[];
        hasChangelog: boolean;
        role: Role | null;
    };
    workspaces: Workspace[];
}

export const meQuery = queryOptions<MeQueryData>({
    queryKey: ['me'],
    queryFn: () => fetchClient('/auth/me'),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    retry: false,
});

export type InvitationQueryData = Pick<ApplicationInvite, 'id' | 'email' | 'role'> & {
    invitedBy: Pick<UserSummary, 'name' | 'avatar'>;
}

export const invitationQuery = queryOptions<InvitationQueryData | null>({
    queryKey: ['invitation'],
    queryFn: () => fetchClient('/auth/invitation'),
});