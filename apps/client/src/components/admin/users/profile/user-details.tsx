import { Skeleton } from "@/components/skeleton"
import { memberQuery } from "@/lib/query/application"
import { useQuery } from "@tanstack/react-query"
import { DateTime } from "luxon"

type UserDetailsProps = {
    userId: string
}

type DetailItemProps = {
    label: string
    value?: string | null
    isLoading?: boolean
}

function DetailItem({ label, value, isLoading }: DetailItemProps) {
    return (
        <div className="vertical gap-1">
            <span className="text-sm font-light text-gray-500 dark:text-zinc-500">{label}</span>
            {isLoading ? (
                <Skeleton className="h-6 w-32" />
            ) : (
                <span className="text-sm font-light text-gray-800 dark:text-zinc-200">{value ?? "Unknown"}</span>
            )}
        </div>
    )
}

export function UserDetails({ userId }: UserDetailsProps) {
    const { data, isLoading } = useQuery(memberQuery(userId))

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-sm font-medium">User Details</h1>
            
            <div className="grid grid-cols-1 gap-4">
                <DetailItem 
                    label="Name"
                    value={data?.user.name}
                    isLoading={isLoading}
                />
                <DetailItem 
                    label="Email"
                    value={data?.user.email}
                    isLoading={isLoading}
                />
                <DetailItem 
                    label="Account Created"
                    value={data?.createdAt ? DateTime.fromJSDate(new Date(data.createdAt)).toRelative() : null}
                    isLoading={isLoading}
                />
                <DetailItem 
                    label="Last Activity"
                    value={data?.lastActivity ? DateTime.fromJSDate(new Date(data.lastActivity)).toRelative() : null}
                    isLoading={isLoading}
                />
                <DetailItem 
                    label="Browser"
                    value={data?.user.browser}
                    isLoading={isLoading}
                />
                <DetailItem 
                    label="Operating System"
                    value={data?.user.os}
                    isLoading={isLoading}
                />
                <DetailItem 
                    label="Device"
                    value={data?.user.device}
                    isLoading={isLoading}
                />
            </div>
        </div>
    )
}