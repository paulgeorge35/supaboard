import type { User } from "@repo/database"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { fetchClient } from "../lib/client"
import { Avatar } from "./avatar"

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
                <a href={`${apiURL}/auth/google/sign-in`} type="button" className="text-sm font-light px-3 py-1 rounded-lg border hover:bg-gray-100 transition-colors duration-200">
                    Log In
                </a>
                <button type="button" className="text-sm font-light px-3 py-1 rounded-lg border border-blue-500 bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200">
                    Sign Up
                </button>
            </span>
        )
    }

    return (
        <div className="relative">
            <button
                type="button"
                className="horizontal gap-2 center size-8 rounded-full"
                data-popover-trigger
                aria-expanded="false"
                aria-haspopup="true"
            >
                <Avatar src={user.avatar ?? undefined} name={user.name} className='size-8' />
            </button>

            <div
                className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white shadow-sm border ring-opacity-5 hidden"
                data-popover
                role="menu"
            >
                <div className="py-1" role="none">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-gray-500 text-xs truncate">{user.email}</div>
                    </div>
                    {isAdmin && <button type="button" className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                        Settings
                    </button>}
                    <button
                        type="button"
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => signOut()}
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    )
}