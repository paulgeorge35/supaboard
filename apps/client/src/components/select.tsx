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
    label?: string
    options: SelectOption[]
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function SelectComponent({
    label,
    options,
    value,
    onChange,
    placeholder,
    className,
    disabled
}: SelectProps) {
    const { ref, dimensions } = useResizeObserver<HTMLDivElement>({
        immediate: true,
    })
    return (
        <Select
            ref={ref}
            className={cn('horizontal center relative', className)}
            selectedKey={value}
            onSelectionChange={(key) => {
                console.log(key);
                onChange?.(key as string)
            }}
            isDisabled={disabled}
        >
            {label && <Label>{label}</Label>}
            <Button className={cn('w-full horizontal center-v space-between px-2 border rounded-md h-full text-sm hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors duration-100', {
                'opacity-50 pointer-events-none': disabled
            })}>
                <SelectValue className={cn({
                    'text-gray-500 dark:text-zinc-500': !value,
                })}>
                    {({ selectedText }) => (
                        <span className='horizontal center-v gap-2'>
                            {options.find((option) => option.value === value)?.icon}
                            {selectedText || placeholder}
                        </span>
                    )}
                </SelectValue>
                <Icons.ChevronDown className='size-4' />
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
                            className='text-sm horizontal gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 transition-colors duration-100 w-full disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {item.icon}
                            {item.label}
                        </ListBoxItem>
                    )}
                </ListBox>
            </Popover>
        </Select>
    )
}