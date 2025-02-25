import { Button, Icons, Input } from '@/components'
import { Switch } from '@/components/switch'
import { useCreateStatusMutation, useDeleteStatusMutation, useUpdateStatusMutation } from '@/lib/mutation'
import { statusesQuery, StatusType } from '@/lib/query'
import { cn } from '@/lib/utils'
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Status } from '@repo/database'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import colors from 'tailwindcss/colors'
import { v4 as uuidv4 } from 'uuid'

const COLORS = {
    'red-500': colors.red[500],
    'orange-500': colors.orange[500],
    'amber-500': colors.amber[500],
    'yellow-500': colors.yellow[500],
    'lime-500': colors.lime[500],
    'green-500': colors.green[500],
    'emerald-500': colors.emerald[500],
    'teal-500': colors.teal[500],
    'cyan-500': colors.cyan[500],
    'sky-500': colors.sky[500],
    'blue-500': colors.blue[500],
    'indigo-500': colors.indigo[500],
    'violet-500': colors.violet[500],
    'purple-500': colors.purple[500],
    'fuchsia-500': colors.fuchsia[500],
    'pink-500': colors.pink[500],
    'rose-500': colors.rose[500],
    'slate-500': colors.slate[500],
};

export const Route = createFileRoute('/admin/settings/roadmap/statuses')({
    component: RouteComponent,
})

function RouteComponent() {
    const { data: statuses } = useQuery(statusesQuery)
    const ROADMAP_COLUMNS_COUNT = statuses?.filter(status => status.includeInRoadmap).length ?? 0

    return (
        <div className='vertical gap-2 w-full'>
            <div className='grid grid-cols-[minmax(200px,1fr)_auto_auto_200px_auto_auto] gap-8'>
                <StatusCard type='DEFAULT' statuses={statuses?.filter(status => status.type === 'DEFAULT') ?? []} />
                <div className='col-span-full'>
                    <span className='vertical items-end gap-1 -mb-4 pr-10'>
                        <span className='text-sm'>Roadmap columns</span>
                        <span className='text-xs font-light text-gray-500 dark:text-zinc-400'>Select 3</span>
                    </span>
                </div>
                <StatusCard
                    type='ACTIVE'
                    statuses={statuses?.filter(status => status.type === 'ACTIVE') ?? []}
                    count={ROADMAP_COLUMNS_COUNT}
                />
                <StatusCard
                    type='COMPLETE'
                    statuses={statuses?.filter(status => status.type === 'COMPLETE') ?? []}
                    count={ROADMAP_COLUMNS_COUNT}
                />
                <StatusCard
                    type='CLOSED'
                    statuses={statuses?.filter(status => status.type === 'CLOSED') ?? []}
                    count={ROADMAP_COLUMNS_COUNT}
                />
            </div>
        </div>
    )
}

const DESCRIPTIONS: Record<StatusType, {
    title: string;
    description: string;
}> = {
    ['DEFAULT']: {
        title: 'Default statuses',
        description: 'New posts are given the default status.\nThis cannot be changed.',
    },
    ['ACTIVE']: {
        title: 'Active statuses',
        description: 'Showing the progress of the post.',
    },
    ['COMPLETE']: {
        title: 'Complete statuses',
        description: 'To be used as a final status for a post.',
    },
    ['CLOSED']: {
        title: 'Closed statuses',
        description: 'For posts that will not be completed.',
    },
}

type StatusCardProps = {
    type: StatusType;
    statuses: Status[];
    count?: number;
}

function StatusCard({ type, statuses, count }: StatusCardProps) {
    const [statusName, setStatusName] = useState('');
    const [items, setItems] = useState(statuses);

    useEffect(() => {
        const hasLengthChanged = statuses.length !== items.length;
        const queryInclude = statuses.filter(status => status.includeInRoadmap).map(status => status.id)
        const stateInclude = items.filter(status => status.includeInRoadmap).map(status => status.id)
        const hasIncludeInRoadmapChanged = queryInclude.length !== stateInclude.length || queryInclude.some(id => !stateInclude.includes(id))
        const hasColorChanged = statuses.some(status => {
            const existingStatus = items.find(item => item.id === status.id);
            return existingStatus && existingStatus.color !== status.color;
        });

        if (hasLengthChanged || hasIncludeInRoadmapChanged || hasColorChanged) {
            setItems(statuses);
        }
    }, [statuses]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const { mutate: createStatus, isPending } = useCreateStatusMutation({
        onSuccess: () => {
            setStatusName('');
        },
    });

    const { mutate: updateStatus } = useUpdateStatusMutation();

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        setItems(newItems);
        updateStatus({ id: active.id as string, order: newIndex });
    };

    const isValid = statusName.length > 3;

    return (
        <div className='col-span-full grid grid-cols-subgrid gap-8'>
            <span className='vertical gap-2'>
                <div className='text-sm font-medium'>{DESCRIPTIONS[type].title}</div>
                <div className='text-sm font-light text-gray-500 dark:text-zinc-400 whitespace-pre-wrap'>{DESCRIPTIONS[type].description}</div>
            </span>
            <div className={cn('col-span-5 grid grid-cols-subgrid gap-0', {
                "border-b": type !== 'DEFAULT',
            })}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map(status => status.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {items.map((status, index) => (
                            <StatusCardItem
                                key={status.id}
                                status={status}
                                className={index === items.length - 1 ? 'border-b' : ''}
                                disabled={count !== undefined && count >= 3}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
                {type !== 'DEFAULT' && (
                    <Input
                        className='col-start-3 border-none col-span-full px-1'
                        inputClassName='h-10'
                        disabled={isPending}
                        value={statusName}
                        onChange={(e) => setStatusName(e.target.value.slice(0, 20))}
                        placeholder='Add new status'
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && isValid) {
                                createStatus({ id: uuidv4(), name: statusName, type });
                            }
                        }}
                        addornmentRight={isValid && (
                            <Button size='sm' variant='ghost' color='secondary' isLoading={isPending} onClick={() => createStatus({ id: uuidv4(), name: statusName, type })}>
                                Create
                            </Button>
                        )}
                    />
                )}
            </div>
        </div>
    )
}

type StatusCardItemProps = {
    status: Status;
    className?: string;
    disabled?: boolean;
}

function StatusCardItem({ status, className, disabled }: StatusCardItemProps) {
    const { mutate: updateStatus, isPending } = useUpdateStatusMutation();
    const { mutate: deleteStatus, isPending: isDeleting } = useDeleteStatusMutation();
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: status.id,
        disabled: status.type === 'DEFAULT'
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
        opacity: isDragging ? 0.5 : undefined,
    };

    return (
        <span
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn('col-span-full h-14 grid grid-cols-subgrid gap-2 px-2 py-4 border-t relative', className)}
        >
            <Icons.GripVertical
                {...listeners}
                className={cn('size-4 shrink-0 cursor-grab my-auto touch-none', {
                    "hidden": status.type === 'DEFAULT',
                })}
            />
            <div
                className={cn('size-4 rounded-full shrink-0 my-auto cursor-pointer', {
                    "hidden": status.type === 'DEFAULT',
                })}
                style={{ backgroundColor: COLORS[status.color as keyof typeof COLORS] }}
                onClick={() => setIsColorPickerOpen(true)}
            />
            {isColorPickerOpen && (
                <>
                    <div
                        className="fixed inset-0"
                        onClick={() => setIsColorPickerOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border z-50 grid grid-cols-6 gap-2">
                        {Object.entries(COLORS).map(([color, colorClass]) => (
                            <div
                                key={color}
                                className={cn('size-4 rounded-full cursor-pointer hover:scale-110 transition-transform', {
                                    'border-2 border-white': status.color === color,
                                })}
                                style={{ backgroundColor: colorClass }}
                                onClick={() => {
                                    console.log(color)
                                    updateStatus({ id: status.id, color });
                                    setIsColorPickerOpen(false);
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
            <span
                className={cn('col-start-3 h-4 horizontal center-v gap-1 text-sm font-medium uppercase my-auto text-gray-500 dark:text-zinc-400')}
                style={{ color: status.type === 'DEFAULT' ? undefined : COLORS[status.color as keyof typeof COLORS] }}
            >
                {status.name}
                {status.type === 'DEFAULT' && <Icons.Lock className='size-3 shrink-0 my-auto stroke-gray-500 dark:stroke-zinc-400' />}
            </span>
            {status.type !== 'DEFAULT' && (
                <Switch
                    checked={status.includeInRoadmap}
                    size='small'
                    className='col-start-4 shrink-0 my-auto'
                    disabled={(disabled && !status.includeInRoadmap) || isPending || isDeleting}
                    onChange={(e) => updateStatus({ id: status.id, includeInRoadmap: e.target.checked })}
                />
            )}
            {status.type !== 'DEFAULT' && (
                <div className='col-start-5 shrink-0 my-auto'>
                    <Button size='icon' className='shrink-0 rounded-full !p-0.5 size-6' variant='ghost' color='secondary' isLoading={isDeleting} onClick={() => deleteStatus(status.id)}>
                        <Icons.X className='size-5' />
                    </Button>
                </div>
            )}
        </span>
    )
}