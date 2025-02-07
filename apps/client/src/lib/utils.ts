import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
]

export const buildQueryString = (search: Record<string, any>): string => {
  const params = new URLSearchParams();

  Object.entries(search).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.append(key, value.toString());
    }
  });

  return params.toString();
}

export const FeedbackStatusConfig = {
  OPEN: {
    label: 'Open',
    color: 'gray-500',
    text: 'text-gray-500',
    background: 'bg-gray-500/20',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'orange-500',
    text: 'text-orange-500',
    background: 'bg-orange-500/20',
  },
  PLANNED: {
    label: 'Planned',
    color: 'blue-500',
    text: 'text-blue-500',
    background: 'bg-blue-500/20',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'violet-500',
    text: 'text-violet-500',
    background: 'bg-violet-500/20',
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'green-500',
    text: 'text-green-500',
    background: 'bg-green-500/20',
  },
  CLOSED: {
    label: 'Closed',
    color: 'red-500',
    text: 'text-red-500',
    background: 'bg-red-500/20',
  },
}