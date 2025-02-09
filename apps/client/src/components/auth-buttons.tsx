import type { User } from "@repo/database"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { fetchClient } from "../lib/client"
import { Avatar } from "./avatar"
import { Popover } from "./popover"

type AuthButtonsProps = {
    user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
    isAdmin: boolean
}

export function AuthButtons({ user, isAdmin }: AuthButtonsProps) {
    const apiURL = window.location.hostname.endsWith('supaboard.io') ? 'https://api.supaboard.io' : `https://${window.location.hostname}/api`
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

    if (!user) {
        return (
            <span className="horizontal gap-2 center-v">
                <a href={`${apiURL}/auth/google/sign-in`} type="button" className="button button-secondary">
                    Log In
                </a>
                <button type="button" className="button button-primary">
                    Sign Up
                </button>
            </span>
        )
    }

    const popoverContent = (
        <div className="py-1 w-48" role="none">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <div className="font-medium">{user.name}</div>
                <div className="text-gray-500 text-xs truncate">{user.email}</div>
            </div>
            {isAdmin && (
                <button 
                    type="button" 
                    className="text-left block w-full px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20" 
                    role="menuitem"
                >
                    Settings
                </button>
            )}
            <button
                type="button"
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-zinc-800/20"
                role="menuitem"
                onClick={() => signOut()}
            >
                Sign out
            </button>
        </div>
    )

    return (
        <Popover
            id="auth-buttons"
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