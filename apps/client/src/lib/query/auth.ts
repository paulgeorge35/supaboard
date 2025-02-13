import { ApplicationSummary, BoardSummary, UserSummary, Workspace } from "@repo/database";
import { queryOptions } from "@tanstack/react-query";
import { fetchClient } from "../client";

export type MeQueryData = {
    user: UserSummary;
    application: ApplicationSummary & {
        boards: BoardSummary[];
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
    refetchIntervalInBackground: false,
});
