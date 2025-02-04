import type { User } from "@repo/database"

type AuthButtonsProps = {
    user?: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
}

export function AuthButtons({ user }: AuthButtonsProps) {

    if (!user) {
        return (
            <span className="horizontal gap-2 center-v">
                <button type="button" className="text-sm font-light px-3 py-1 rounded-lg border hover:bg-gray-100 transition-colors duration-200">
                    Log In
                </button>
                <button type="button" className="text-sm font-light px-3 py-1 rounded-lg border border-blue-500 bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200">
                    Sign Up
                </button>
            </span>
        )
    }

    const initial = user.name.slice(0, 1).toUpperCase()

    return (
        <button type="button" className="horizontal gap-2 center-v size-8 rounded-full bg-blue-500/20 text-blue-500">
            {user.avatar ? <img src={user.avatar} alt={user.name} className="size-8 rounded-full" /> : initial}
        </button>
    )
}