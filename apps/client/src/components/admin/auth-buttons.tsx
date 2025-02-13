import { cn } from "@/lib/utils"
import type { User, Workspace } from "@repo/database"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { fetchClient } from "../../lib/client"
import { Avatar } from "../avatar"
import { Icons } from "../icons"
import { Popover } from "../popover"

type AuthButtonsProps = {
    user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
    workspaces?: Workspace[]
    currentWorkspace?: string
}

export function AdminAuthButtons({ user, workspaces, currentWorkspace }: AuthButtonsProps) {
    const queryClient = useQueryClient();

    const { mutate: signOut } = useMutation<{ message: string }, Error, void>({
        mutationFn: () => fetchClient("auth/logout", { method: 'POST' }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            toast.success(data?.message ?? 'Signed out successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to sign out');
        }
    });

    if (!user) return null;

    const popoverContent = (
        <div className="py-1 w-48" role="none">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <div className="font-medium">{user.name}</div>
                <div className="text-gray-500 text-xs truncate">{user.email}</div>
            </div>
            <h1 className="text-xs font-bold px-4 py-1 text-gray-700 dark:text-zinc-300 bg-gray-200 dark:bg-zinc-800">Workspaces</h1>
            {workspaces?.map(workspace => {
                return (
                    <button
                        key={workspace.id}
                        type="button"
                        className="text-left w-full px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 horizontal center-v gap-2 disabled:opacity-50 disabled:pointer-events-none"
                        role="menuitem"
                        onClick={() => window.location.href = `${workspace.url}/admin`}
                        disabled={workspace.id === currentWorkspace}
                        data-popover-close
                    >
                        <Icons.Check className={cn("size-4 shrink-0 opacity-0", {
                            "opacity-100": workspace.id === currentWorkspace
                        })} />
                        <p className="truncate">{workspace.name}</p>
                    </button>
                )
            })}
            <button
                type="button"
                className="text-left w-full px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 horizontal center-v gap-2 disabled:opacity-50 disabled:pointer-events-none"
                role="menuitem"
                onClick={() => window.location.href = `${import.meta.env.VITE_APP_URL}/register`}
                data-popover-close
            >
                <Icons.Plus className="size-4 shrink-0" />
                <p className="truncate">Add Workspace</p>
            </button>
            <hr />
            <Link
                to="/admin/settings"
                className="text-left block w-full px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20"
                role="menuitem"
                data-popover-close
            >
                Settings
            </Link>
            <button
                type="button"
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-zinc-800/20"
                role="menuitem"
                onClick={() => signOut()}
                data-popover-close
            >
                Sign out
            </button>
        </div >
    )

    return (
        <Popover
            id="auth-buttons"
            align="end"
            className="horizontal center"
            trigger={
                <span className="horizontal gap-2 center size-8 rounded-full">
                    <Avatar src={user.avatar ?? undefined} name={user.name} className='size-8' />
                </span>
            }
            content={popoverContent}
        />
    )
}