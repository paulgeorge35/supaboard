import { cn } from '@/lib/utils'
import { useResizeObserver } from '@paulgeorge35/hooks'
import { Button, Label, ListBox, ListBoxItem, Popover, Select, SelectValue } from 'react-aria-components'
import { Icons } from './icons'

export interface SelectOption {
    label: string
    value: string
    icon?: React.ReactNode
}

interface SelectProps {
    required?: boolean
    label?: string
    options: SelectOption[]
    value?: string
    onChange?: (value?: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    checkMarks?: boolean
    triggerClassName?: string
    clearable?: boolean
}

export function SelectComponent({
    required = false,
    label,
    options,
    value,
    onChange,
    placeholder,
    className,
    disabled,
    checkMarks = false,
    clearable = false,
    triggerClassName
}: SelectProps) {
    const { ref, dimensions } = useResizeObserver<HTMLDivElement>({
        immediate: true,
    })
    return (
        <Select
            ref={ref}
            className={cn('vertical items-start gap-2 relative', className)}
            selectedKey={value}
            onSelectionChange={(key) => onChange?.(key as string)}
            isDisabled={disabled}
        >
            {label && <Label className='horizontal center-v gap-1 text-xs uppercase font-medium text-gray-500 dark:text-zinc-500'>{label}
                {required && <span className='text-red-500'>*</span>}
            </Label>}
            <Button className={cn('w-full horizontal center-v space-between px-2 border rounded-md h-full text-sm hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors duration-100', {
                'opacity-50 pointer-events-none': disabled
            }, triggerClassName)}>
                <SelectValue className={cn('truncate', {
                    '[&>*]:!text-gray-500 dark:[&>*]:!text-zinc-500 w-full': !value,
                })}>
                    {({ selectedText }) => (
                        <span className='horizontal center-v gap-2 w-full'>
                            {selectedText || placeholder}
                        </span>
                    )}
                </SelectValue>
                {clearable && value &&
                    <>
                        <Icons.X role='button' className='size-4 shrink-0 ml-auto cursor-pointer'
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange?.(undefined);
                            }} />
                        <div className='h-1/2 border-l mx-1.5' />
                    </>
                }
                <Icons.ChevronDown className='size-4 shrink-0' />
            </Button>
            <Popover className='bg-white border text-zinc-900 rounded-md shadow-md dark:bg-zinc-900 dark:text-white' style={{ width: dimensions?.width }}>
                <ListBox
                    items={options}
                    selectionMode='single'
                    className='vertical'
                >
                    {(item) => (
                        <ListBoxItem
                            id={item.value}
                            textValue={item.label}
                            isDisabled={value === item.value}
                            className={cn('truncate text-sm horizontal center-v gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 transition-colors duration-100 w-full disabled:opacity-50 disabled:cursor-not-allowed', {
                                'bg-zinc-100 dark:bg-zinc-800 hover:pointer-events-none': value === item.value
                            })}
                        >
                            {item.icon}
                            <span className='truncate'>{item.label}</span>
                            {checkMarks && <Icons.Check className={cn('ml-auto size-4 shrink-0 opacity-0 stroke-[var(--color-primary)]', {
                                'opacity-100': value === item.value
                            })} />}
                        </ListBoxItem>
                    )}
                </ListBox>
            </Popover>
        </Select>
    )
}