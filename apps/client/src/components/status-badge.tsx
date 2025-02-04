import type { FeedbackStatus } from '@repo/database';
import { cn } from '../lib/utils';

enum FeedbackStatusColor {
    OPEN = 'bg-gray-500/20 text-gray-500',
    UNDER_REVIEW = 'bg-orange-500/20 text-orange-500',
    PLANNED = 'bg-blue-500/20 text-blue-500',
    IN_PROGRESS = 'bg-violet-500/20 text-violet-500',
    RESOLVED = 'bg-green-500/20 text-green-500',
    CLOSED = 'bg-red-500/20 text-red-500',
}

enum FeedbackStatusText {
    OPEN = 'Open',
    UNDER_REVIEW = 'Under Review',
    PLANNED = 'Planned',
    IN_PROGRESS = 'In Progress',
    RESOLVED = 'Resolved',
    CLOSED = 'Closed',
}

export function StatusBadge({ status }: { status: FeedbackStatus }) {
    return (
        <div
            style={{}}
            className={cn('px-1 rounded-sm text-xs font-light', FeedbackStatusColor[status])}>
            {FeedbackStatusText[status]}
        </div>
    )
}