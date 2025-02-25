import { Button, Icons, StatusBadge } from "@/components"
import { Checkbox } from "@/components/checkbox"
import { SelectComponent } from "@/components/select"
import { LoadingSpinner } from "@/components/spinner"
import { changelogFeedbacksQuery, changelogLabelsQuery, Status } from "@/lib/query"
import { useBoolean } from "@paulgeorge35/hooks"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "@tanstack/react-router"
import { useMemo } from "react"

type ControlsProps = {
    types: TypeValues[]
    onTypeChange: (value: TypeValues[]) => void
    labels: { id: string, name: string }[]
    onLabelChange: (value: { id: string, name: string }[]) => void
    feedbacks?: { id: string, title: string, status: Status, board: { slug: string }, votes: number }[]
    onFeedbackChange?: (value: { id: string, title: string, status: Status, board: { slug: string }, votes: number }[]) => void
}


export const Controls = ({ types, onTypeChange, labels, onLabelChange, feedbacks, onFeedbackChange }: ControlsProps) => {
    return (
        <div className='vertical gap-8 p-4'>
            {feedbacks && onFeedbackChange && <Feedback linkedFeedbacks={feedbacks} onChange={onFeedbackChange} />}
            <Type value={types} onChange={onTypeChange} />
            <Labels value={labels} onChange={onLabelChange} />
            <Delete />
        </div>
    )
}

type FeedbackProps = {
    linkedFeedbacks: { id: string, title: string, status: Status, board: { slug: string }, votes: number }[]
    onChange: (value: { id: string, title: string, status: Status, board: { slug: string }, votes: number }[]) => void
}

const Feedback = ({ linkedFeedbacks, onChange }: FeedbackProps) => {
    const expanded = useBoolean(false);

    const { data: feedbacks } = useQuery(changelogFeedbacksQuery)

    const handleSelect = (value: string | string[]) => {
        if (Array.isArray(value)) return;
        const feedback = feedbacks?.find((f) => f.id === value);
        if (!feedback) return;
        onChange([...linkedFeedbacks, feedback]);
    }

    const options = useMemo(() => {
        return feedbacks?.filter((feedback) => !linkedFeedbacks?.some((v) => v.id === feedback.id))?.map((feedback) => ({
            label: feedback.title,
            value: feedback.id,
            content: (
                <span className="vertical gap-1 w-full">
                    <span className="text-sm truncate">{feedback.title}</span>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 uppercase font-bold">
                        {feedback.board.slug}
                    </span>
                    <span className="horizontal gap-1 center-v">
                        <span className="horizontal gap-1 center-v text-xs text-gray-500 dark:text-zinc-300">
                            <Icons.Triangle className="size-3 stroke-0 fill-gray-500 dark:fill-zinc-300" />
                            {feedback.votes}
                        </span>
                        <StatusBadge status={feedback.status.slug} variant='text' className="ml-auto" />
                    </span>
                </span>
            )
        })) ?? [];
    }, [feedbacks, linkedFeedbacks]);

    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Linked feedbacks</h1>
            <button
                onClick={expanded.toggle}
                className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
                Search
            </button>
            {expanded.value && <SelectComponent
                placeholder="Search by title..."
                options={options}
                className="col-span-full"
                onChange={handleSelect}
            />}
            {linkedFeedbacks?.map((feedback) => (
                <div key={feedback.id} className="col-span-full grid grid-cols-subgrid vertical gap-1 w-full">
                    <span className="vertical gap-1 col-span-2">
                        <span className="text-sm truncate font-light text-gray-500 dark:text-zinc-400">{feedback.title}</span>
                        <span className="horizontal gap-4 center-v">
                            <span className="horizontal gap-1 center-v text-xs text-gray-500 dark:text-zinc-300">
                                <Icons.Triangle className="size-3 stroke-0 fill-gray-500 dark:fill-zinc-300" />
                                {feedback.votes}
                            </span>
                            <StatusBadge status={feedback.status.slug} variant='text' />
                        </span>
                    </span>
                    <Button variant="ghost" size="icon" className="ml-auto" onClick={() => onChange(linkedFeedbacks.filter((f) => f.id !== feedback.id))}>
                        <Icons.X className="size-4 stroke-gray-500 dark:stroke-zinc-300 hover:stroke-gray-700 dark:hover:stroke-zinc-200" />
                    </Button>
                </div>
            ))}
        </div>
    )
}

const Delete = () => {
    const { changelogSlug } = useParams({ strict: false });
    if (!changelogSlug) return null;
    return (
        <Link to="/admin/changelog/$changelogSlug/edit/delete" params={{ changelogSlug }} className="text-sm font-light underline text-gray-500 dark:text-zinc-300 hover:text-gray-700 dark:hover:text-zinc-200">
            Delete entry
        </Link>
    )
}

type TypeValues = 'NEW' | 'IMPROVED' | 'FIXED'

const TypeOptions = [
    {
        label: 'New',
        value: 'NEW'
    },
    {
        label: 'Improved',
        value: 'IMPROVED'
    },
    {
        label: 'Fixed',
        value: 'FIXED'
    }
]

type TypeProps = {
    value: TypeValues[]
    onChange: (value: TypeValues[]) => void
}

const Type = ({ value, onChange }: TypeProps) => {
    return (
        <div className="vertical gap-2">
            <h1 className="text-sm font-medium">Types</h1>
            {TypeOptions.map((option) => (
                <div key={option.value} className="vertical gap-2">
                    <Checkbox
                        label={option.label}
                        checked={value.includes(option.value as TypeValues)}
                        onChange={() =>
                            onChange(
                                value.includes(option.value as TypeValues) ?
                                    value.filter(v => v !== option.value as TypeValues) :
                                    [...value, option.value as TypeValues]
                            )
                        }
                    />
                </div>
            ))}
        </div>
    )
}

type LabelsProps = {
    value: { id: string, name: string }[]
    onChange: (value: { id: string, name: string }[]) => void
}

const Labels = ({ value, onChange }: LabelsProps) => {
    const { data: labels, isLoading } = useQuery(changelogLabelsQuery);

    if (isLoading) return (
        <div className="vertical gap-2">
            <h1 className="text-sm font-medium">Labels</h1>
            <LoadingSpinner />
        </div>
    )

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
                    checked={value.some(v => v.id === label.id)}
                    onChange={() => onChange(value.some(v => v.id === label.id) ? value.filter(v => v.id !== label.id) : [...value, label])}
                />
            ))}
        </div>
    )
}