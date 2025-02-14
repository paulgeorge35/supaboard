import { Avatar } from "@/components/avatar";
import { MembersDetail } from "@/lib/query/user";
import { useAuthStore } from "@/stores/auth-store";

type UserHeaderProps = {
    user: MembersDetail
}

export function UserHeader({ user }: UserHeaderProps) {
    const { application } = useAuthStore()

    return (
        <div className="p-4 horizontal center-v gap-4 border-b sticky top-0 bg-white dark:bg-zinc-900">
            <Avatar src={user.avatar ?? undefined} name={user.name} className='size-14' isAdmin={application?.ownerId === user.id} />
            <span className='vertical gap-1'>
                <h1 className="text-sm font-medium">{user.name}</h1>
                <span className="horizontal items-baseline gap-2">
                    <Stat label="votes" value={user.votes} />
                    <span className="text-gray-400 dark:text-zinc-500">&bull;</span>
                    <Stat label="posts" value={user.posts} />
                    <span className="text-gray-400 dark:text-zinc-500">&bull;</span>
                    <Stat label="comments" value={user.comments} />
                </span>
            </span>
        </div>
    )
}

const Stat = ({ label, value }: { label: string, value: number }) => {
    return (
        <div className="horizontal gap-1">
            <p className="text-xs font-light text-zint-900 dark:text-zinc-200">{value}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{label}</p>
        </div>
    )
}