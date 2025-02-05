import { FeedbackStatus } from "@repo/database"
import { cn } from "../lib/utils"

type DotProps = {
    status: FeedbackStatus
}

export const Dot = ({ status }: DotProps) => {
    return (
        <div className={cn('size-2 rounded-full shrink-0', {
            "bg-gray-500": status === "OPEN",
            "bg-orange-500": status === "UNDER_REVIEW",
            "bg-blue-500": status === "PLANNED",
            "bg-violet-500": status === "IN_PROGRESS",
            "bg-green-500": status === "RESOLVED",
            "bg-red-500": status === "CLOSED",
        })} />
    )
}
