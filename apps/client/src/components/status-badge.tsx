import type { FeedbackStatus } from '@repo/database';
import { cn, FeedbackStatusConfig } from '../lib/utils';


export function StatusBadge({ status }: { status: FeedbackStatus }) {
    return (
        <div
            className={cn('px-1 rounded-sm text-xs font-light w-fit', `bg-${FeedbackStatusConfig[status].color}/20`, `text-${FeedbackStatusConfig[status].color}`)}>
            {FeedbackStatusConfig[status].label}
        </div>
    )
}