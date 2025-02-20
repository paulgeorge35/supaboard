import { Icons, Input, RadioGroup } from "@/components";

import { Checkbox } from "@/components";
import { changelogLabelsQuery } from "@/lib/query";
import { ChangelogStatusConfig } from "@/lib/utils";
import { Route } from "@/routes/admin/changelog/index";
import { useDebounce } from "@paulgeorge35/hooks";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

export function Filters() {
    return (
        <div className='vertical gap-8 p-4'>
            <Search />
            <Status />
            <Type />
            <Labels />
        </div>
    )
}

type ChangelogStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

const DEFAULT_STATUSES = ['DRAFT', 'PUBLISHED', 'SCHEDULED'] as const;

const Status = () => {
    const search = useSearch({ from: '/admin/changelog/' });
    const router = useRouter();

    const isAllDefaultStatusesIncluded = useCallback((newStatuses: ChangelogStatus[]) => {
        return DEFAULT_STATUSES.every(status => newStatuses.includes(status)) && newStatuses.length === DEFAULT_STATUSES.length;
    }, []);

    const statuses = useMemo(() => {
        return search.status ?? DEFAULT_STATUSES;
    }, [search]);

    const handleChange = (status: ChangelogStatus) => {
        const newStatuses = statuses.includes(status) ? statuses.filter(s => s !== status) : [...statuses, status];
        router.navigate({
            from: Route.fullPath,
            search: { ...search, status: newStatuses.length > 0 && !isAllDefaultStatusesIncluded(newStatuses) ? newStatuses : undefined }
        })
    }

    const handleClick = (status: ChangelogStatus) => {
        router.navigate({
            from: Route.fullPath,
            search: { ...search, status: [status] }
        })
    }

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-3">Status</h1>

            {Object.entries(ChangelogStatusConfig).map(([status, config]) => (
                <div key={status} className="grid grid-cols-[auto_1fr_auto] gap-2 group col-span-full">
                    <Checkbox
                        wrapperClassName="col-span-2"
                        label={config.label}
                        checked={statuses.includes(status as ChangelogStatus)}
                        onChange={() => handleChange(status as ChangelogStatus)}
                    />
                    <button
                        onClick={() => handleClick(status as ChangelogStatus)}
                        className="cursor-pointer size-4 border rounded-sm text-xs font-light horizontal hidden center group-hover:flex text-gray-500 dark:text-zinc-300"
                    >
                        <Icons.Check size={10} />
                    </button>
                </div>
            ))}
        </div>
    )
}

type ChangelogTypes = 'ALL' | 'NEW' | 'IMPROVED' | 'FIXED';

const Type = () => {
    const search = useSearch({ from: '/admin/changelog/' });
    const router = useRouter();

    const handleChange = (value: string) => {
        router.navigate({
            from: Route.fullPath,
            search: {
                ...search,
                type: value === 'ALL' ? undefined : value as ChangelogTypes
            }
        })
    }

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-3">Type</h1>
            <RadioGroup
                value={search.type ?? 'ALL'}
                onChange={handleChange}
                name="type"
                options={[
                    { label: 'All', value: 'ALL' },
                    { label: 'New', value: 'NEW' },
                    { label: 'Improved', value: 'IMPROVED' },
                    { label: 'Fixed', value: 'FIXED' },
                ]}
            />
        </div>
    )
}

const Search = () => {
    const router = useRouter();
    const search = useSearch({ from: '/admin/changelog/' });
    const [searchQuery, setSearchQuery] = useState(search.search ?? '');
    const debouncedSearch = useDebounce(searchQuery, {
        delay: 500,
    });

    useEffect(() => {
        router.navigate({
            from: Route.fullPath,
            search: { ...search, search: debouncedSearch.value === '' ? undefined : debouncedSearch.value }
        })
    }, [debouncedSearch]);

    return (
        <Input
            placeholder="Search entries..."
            className="w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            addornmentLeft={<Icons.Search className="size-4 mr-2 stroke-gray-500 dark:stroke-zinc-400" />}
        />
    )
}

const Labels = () => {
    const search = useSearch({ from: '/admin/changelog/' });
    const router = useRouter();
    const { data: labels } = useQuery(changelogLabelsQuery);

    const handleChange = (label: string) => {
        router.navigate({
            from: Route.fullPath,
            search: { ...search, labels: search.labels?.includes(label) ? search.labels?.filter(v => v !== label) : [...(search.labels ?? []), label] },
            replace: true
        })
    }

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Labels</h1>
            <Link to="/admin/settings/changelog/labels" className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                <Icons.Settings className="size-4 stroke-gray-500 dark:stroke-zinc-300 hover:stroke-gray-700 dark:hover:stroke-zinc-200" />
            </Link>
            {labels?.map((label) => (
                <Checkbox
                    key={label.id}
                    wrapperClassName="col-span-full"
                    label={label.name}
                    checked={search.labels?.includes(label.id)}
                    onChange={() => handleChange(label.id)}
                />
            ))}
        </div>
    )
}