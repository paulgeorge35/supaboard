import type { FeedbackStatus } from '@repo/database';
import { cn, FeedbackStatusConfig } from '../lib/utils';


type StatusBadgeProps = {
    status: FeedbackStatus
    className?: string
    variant?: 'default' | 'text'
}

export function StatusBadge({ status, className, variant = 'default' }: StatusBadgeProps) {
    return (
        <div
            className={cn('px-1 rounded-sm text-xs font-light w-fit', `bg-${FeedbackStatusConfig[status].color}/20`, `text-${FeedbackStatusConfig[status].color}`, className, {
                "bg-transparent uppercase font-bold p-0": variant === 'text'
            })}>
            {FeedbackStatusConfig[status].label}
        </div>
    )
}