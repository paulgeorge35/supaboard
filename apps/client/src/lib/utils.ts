import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
]

export const ROLE_OPTIONS = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Contributor', value: 'COLLABORATOR' },
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

export const numberFormatter = (number: number) => {
  if (number >= 1000) {
    return `${(number / 1000).toFixed((number >= 10000 || number % 1000 < 100 ? 0 : 1))}k`;
  }
  return number;
}

export const ChangelogStatusConfig = {
  DRAFT: {
    label: 'Draft',
  },
  PUBLISHED: {
    label: 'Published',
  },
  SCHEDULED: {
    label: 'Scheduled',
  },
}