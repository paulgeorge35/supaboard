import { statusBySlugQuery } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import colors from 'tailwindcss/colors';
import { cn } from '../lib/utils';

type StatusBadgeProps = {
    status?: string;
    className?: string
    variant?: 'default' | 'text'
}

export function StatusBadge({ status, className, variant = 'default' }: StatusBadgeProps) {
    const { data } = useQuery(statusBySlugQuery(status));

    if (!data) return null;

    const color = data.color.split('-')[0] as Exclude<keyof typeof colors, 'white' | 'black' | 'transparent' | 'inherit' | 'current'>;
    const shade = data.color.split('-')[1] as keyof typeof colors[typeof color];
    return (
        <div
            className={cn('px-1 rounded-sm text-xs font-light w-fit', className, {
                "!bg-transparent uppercase font-bold p-0": variant === 'text'
            })}
            style={{
                backgroundColor: variant === 'default' ? `oklch(${colors[color][shade].match(/\((.*?)\)/)?.[1] ?? '0 0 0'} / 0.1)` : 'transparent',
                color: colors[color][shade],
            }}
        >
            {data.name}
        </div>
    )
}