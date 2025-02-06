import type { FeedbackStatus } from '@repo/database';
import { cn, FeedbackStatusConfig } from '../lib/utils';


type StatusBadgeProps = {
    status: FeedbackStatus
    className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    return (
        <div
            className={cn('px-1 rounded-sm text-xs font-light w-fit', `bg-${FeedbackStatusConfig[status].color}/20`, `text-${FeedbackStatusConfig[status].color}`, className)}>
            {FeedbackStatusConfig[status].label}
        </div>
    )
}