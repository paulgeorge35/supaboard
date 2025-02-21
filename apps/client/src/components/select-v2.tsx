import { useResizeObserver } from "@paulgeorge35/hooks";
import { useRef } from "react";
import { usePress } from 'react-aria';
import {
    Button,
    Key,
    ListBox,
    ListBoxItem,
    Popover,
    Select,
    SelectValue,
    Text
} from "react-aria-components";
import { cn } from "../lib/utils";
import { Icons } from "./icons";

export interface SelectComponentOption {
    label: string
    value: string
    icon?: React.ReactNode
    content?: React.ReactNode
}

interface SelectComponentProps {
    name?: string
    required?: boolean
    label?: string
    options: SelectComponentOption[]
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    triggerClassName?: string
    className?: string
    disabled?: boolean
    checkMarks?: boolean // if true, show a checkmark for each selected option
    clearable?: boolean // if true and value is set, show a clear button that clears the value
    size?: 'sm' | 'md'
}

export function SelectComponent({
    name,
    required,
    label,
    options,
    value,
    onChange,
    clearable = false,
    checkMarks = false,
    disabled = false,
    placeholder = 'Select...',
    className,
    triggerClassName,
    size = 'md'
}: SelectComponentProps) {
    const { ref, dimensions } = useResizeObserver<HTMLDivElement>();
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const handleSelectionChange = (value: Key) => {
        onChange?.(value as string);
    };

    const { pressProps } = usePress({
        onPress: (e) => {
            onChange?.('');
        }
    });

    const selectedOption = options.find(opt => opt.value === value)

    return (
        <Select
            ref={ref}
            name={name}
            isRequired={required}
            selectedKey={value}
            onSelectionChange={handleSelectionChange}
            isDisabled={disabled}
            className={cn("relative", className)}
        >
            {label && (
                <Text slot="label" className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </Text>
            )}
            <Button
                ref={triggerButtonRef}
                className={cn(
                    "w-full horizontal center-v space-between gap-2 rounded-md border px-3 pr-2 py-2 data-[pressed]:border-[var(--color-primary)] group",
                    "bg-white dark:bg-zinc-900 text-left text-sm text-gray-900",
                    "hover:bg-gray-100/10 dark:hover:bg-zinc-800/10",
                    disabled && "bg-gray-50 text-gray-500 cursor-not-allowed",
                    {
                        'h-9 pr-1': size === 'sm',
                    },
                    triggerClassName
                )}
            >
                <SelectValue className="flex items-center gap-2 w-full truncate">
                    {({ selectedText }) => (
                        <>
                            {selectedOption?.icon}
                            <span className={cn("truncate", {
                                "text-gray-500 dark:text-zinc-400": !selectedText
                            })}>
                                {selectedText || placeholder}
                            </span>
                        </>
                    )}
                </SelectValue>
                <div className="flex items-center gap-1">
                    {clearable && selectedOption && (
                        <>
                            <div
                                {...pressProps}
                                className="p-1 cursor-pointer horizontal center shrink-0 aspect-square h-full hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors rounded-md"
                            >
                                <Icons.X className="size-4" />
                            </div>
                            <div className="border-l h-4" />
                        </>
                    )}
                    <span
                        className="p-1 cursor-pointer horizontal center shrink-0 aspect-square h-full hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors rounded-md group-data-[pressed]:[&>svg]:-rotate-180"
                    >
                        <Icons.ChevronDown className="size-4 transition-transform duration-100" />
                    </span>
                </div>
            </Button>
            <Popover style={{ minWidth: dimensions?.width }}>
                <ListBox
                    className={cn(
                        "max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-zinc-900 py-1 border shadow-lg text-sm"
                    )}
                >
                    {options.map((option) => (
                        <ListBoxItem
                            key={option.value}
                            id={option.value}
                            textValue={option.label}
                            className={({ isFocused, isSelected }) =>
                                cn(
                                    "relative flex items-center gap-2 select-none py-2 px-3",
                                    "cursor-pointer",
                                    isFocused && "bg-gray-100/50 dark:bg-zinc-800/50",
                                    isSelected && !checkMarks && "bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/10"
                                )
                            }
                        >
                            {({ isSelected }) => (
                                <>
                                    {option.icon}
                                    {option.content || option.label}
                                    {(checkMarks) && (
                                        <Icons.Check className={cn("size-4 ml-auto opacity-0 stroke-[var(--color-primary)] transition-opacity duration-100", {
                                            "opacity-100": isSelected
                                        })} />
                                    )}
                                </>
                            )}
                        </ListBoxItem>
                    ))}
                </ListBox>
            </Popover>
        </Select>
    )
}