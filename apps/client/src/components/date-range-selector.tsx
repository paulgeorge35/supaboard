import { cn } from "@/lib/utils";
import { closePopover } from "@/utils/popover";
import { useBoolean } from "@paulgeorge35/hooks";
import { DateTime } from "luxon";
import { useMemo, useRef, useState } from "react";
import { Checkbox } from "./checkbox";
import { Icons } from "./icons";
import { Popover } from "./popover";

const relativeDates = (now: DateTime): {
    label: string
    value: string
    range: {
        start?: Date
        end?: Date
    }
}[] => [
        {
            label: 'This week',
            value: 'this_week',
            range: {
                start: now.startOf('week').set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.endOf('week').set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            }
        },
        {
            label: 'Last week',
            value: 'last_week',
            range: {
                start: now.startOf('week').minus({ week: 1 }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.endOf('week').minus({ week: 1 }).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            }
        },
        {
            label: 'This month',
            value: 'this_month',
            range: {
                start: now.startOf('month').set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.endOf('month').set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            }
        },
        {
            label: 'Last month',
            value: 'last_month',
            range: {
                start: now.startOf('month').minus({ month: 1 }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.endOf('month').minus({ month: 1 }).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            }
        },
        {
            label: 'This quarter',
            value: 'this_quarter',
            range: {
                start: now.startOf('quarter').set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.endOf('quarter').set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            }
        },
        {
            label: 'Last quarter',
            value: 'last_quarter',
            range: {
                start: now.startOf('quarter').minus({ quarter: 1 }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.endOf('quarter').minus({ quarter: 1 }).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            }
        },
        {
            label: 'This half',
            value: 'this_half_year',
            range: now.month <= 6 ? {
                start: now.set({ year: now.year, month: 1, day: 1 }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.set({ year: now.year, month: 6, day: 30 }).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            } : {
                start: now.set({ year: now.year, month: 7, day: 1 }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.set({ year: now.year, month: 12, day: 31 }).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            }
        },
        {
            label: 'Last half',
            value: 'last_half_year',
            range: now.month <= 6 ? {
                start: now.set({ year: now.year - 1, month: 7, day: 1 }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.set({ year: now.year, month: 12, day: 31 }).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            } : {
                start: now.set({ year: now.year, month: 1, day: 1 }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                end: now.set({ year: now.year, month: 6, day: 30 }).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
            }
        },
        {
            label: 'All time',
            value: 'all_time',
            range: {}
        }
    ]

type DateRangePreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_half_year' | 'last_half_year' | 'all_time'

type DateRangeSelectorProps = {
    range: {
        start?: Date
        end?: Date
    }
    onChange: (range: { start?: Date, end?: Date }) => void
    align?: 'start' | 'end' | 'center'
    className?: string
    triggerClassName?: string
}

export function DateRangeSelector({ range, onChange, className, triggerClassName, align = 'start' }: DateRangeSelectorProps) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const custom = useBoolean(false);
    const now = DateTime.now().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    const [selectedRange, setSelectedRange] = useState<{ start?: Date, end?: Date }>(range)
    const [customRange, setCustomRange] = useState<{ start?: string, end?: string }>({
        start: range.start && DateTime.fromJSDate(range.start).isValid ? DateTime.fromJSDate(range.start).toFormat('dd/MM/yyyy') : '',
        end: range.end && DateTime.fromJSDate(range.end).isValid ? DateTime.fromJSDate(range.end).toFormat('dd/MM/yyyy') : ''
    })

    const presets = useMemo(() => relativeDates(now), [now])

    const selectedPreset = useMemo(() => {
        if (selectedRange.start === undefined || selectedRange.end === undefined) {
            return 'all_time'
        }
        return presets.find(preset => preset.range.start && preset.range.end && DateTime.fromJSDate(preset.range.start).equals(DateTime.fromJSDate(selectedRange.start!)) && DateTime.fromJSDate(preset.range.end).equals(DateTime.fromJSDate(selectedRange.end!)))?.value
    }, [presets, selectedRange])

    const currentPreset = useMemo(() => {
        if (range.start === undefined || range.end === undefined) {
            return 'all_time'
        }
        return presets.find(preset => preset.range.start && preset.range.end && DateTime.fromJSDate(preset.range.start).equals(DateTime.fromJSDate(range.start!)) && DateTime.fromJSDate(preset.range.end).equals(DateTime.fromJSDate(range.end!)))?.value
    }, [presets, range])

    const handleApply = (event: React.MouseEvent) => {
        event.stopPropagation();
        onChange(selectedRange);
        if (popoverRef.current) {
            closePopover(popoverRef.current);
        }
    }

    const handlePreset = (preset: DateRangePreset) => {
        const presetRange = presets.find(date => date.value === preset)?.range
        if (presetRange) {
            setSelectedRange(presetRange)
            custom.setFalse()
            setCustomRange({
                start: presetRange.start && DateTime.fromJSDate(presetRange.start).isValid ? DateTime.fromJSDate(presetRange.start).toFormat('dd/MM/yyyy') : '',
                end: presetRange.end && DateTime.fromJSDate(presetRange.end).isValid ? DateTime.fromJSDate(presetRange.end).toFormat('dd/MM/yyyy') : ''
            })
        }
    }

    const isValidRange = useMemo(() => {
        if (custom.value) {
            return customRange.start && customRange.end && DateTime.fromFormat(customRange.start, 'dd/MM/yyyy').isValid && DateTime.fromFormat(customRange.end, 'dd/MM/yyyy').isValid
        }
        if (selectedRange.start === undefined || selectedRange.end === undefined) return true;
        return selectedRange.start && selectedRange.end && DateTime.fromJSDate(selectedRange.start).isValid && DateTime.fromJSDate(selectedRange.end).isValid
    }, [selectedRange, custom.value, customRange])

    const trigger = useMemo(() => {
        if (currentPreset) {
            return presets.find(preset => preset.value === currentPreset)?.label
        }
        if (range.start && range.end) {
            return `${DateTime.fromJSDate(range.start).toFormat('dd/MM/yyyy')} - ${DateTime.fromJSDate(range.end).toFormat('dd/MM/yyyy')}`
        } else if (range.start) {
            return `From ${DateTime.fromJSDate(range.start).toFormat('dd/MM/yyyy')}`
        } else if (range.end) {
            return `To ${DateTime.fromJSDate(range.end).toFormat('dd/MM/yyyy')}`
        }
    }, [range])

    return (
        <Popover
            id="date-range-selector"
            className={cn("w-full", className)}
            ref={popoverRef}
            trigger={
                <span className="horizontal gap-2 center-v w-full">
                    <Icons.Calendar1 className="size-4" />
                    {trigger}
                    <Icons.ChevronDown className="ml-auto size-4" />
                </span>
            }
            triggerClassName={cn("px-2 py-1 rounded-md border text-sm", triggerClassName)}
            align={align}
            content={
                <div className="p-4 vertical grid grid-cols-[1fr_auto_1fr] gap-4" role="none">
                    <p className="text-sm font-medium col-span-full">Relative dates</p>
                    <span className='grid grid-cols-subgrid col-span-full gap-2'>
                        {presets.map((date, index) => (
                            <button
                                type="button"
                                key={date.value}
                                className={cn("text-left block w-full text-sm text-gray-400 dark:text-zinc-300 cursor-pointer", {
                                    "col-start-1": index % 2 === 0,
                                    "col-start-3": index % 2 === 1,
                                    "text-[var(--color-primary)] dark:text-[var(--color-primary)]": selectedPreset === date.value
                                })}
                                role="menuitem"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handlePreset(date.value as DateRangePreset)
                                }}
                            >
                                {date.label}
                            </button>
                        ))}
                    </span>
                    <Checkbox
                        checked={custom.value}
                        onChange={() => custom.toggle()}
                        label="Custom dates"
                        wrapperClassName="col-span-full"
                        labelClassName="text-sm font-medium"
                    />
                    <span className="grid grid-cols-subgrid col-span-full gap-2">
                        <input
                            name="start"
                            disabled={!custom.value}
                            className="input focus:outline-none border rounded-md p-2 md:text-sm font-light text-gray-700 dark:text-zinc-300 disabled:opacity-50 w-30"
                            placeholder="dd/mm/yyyy"
                            value={custom.value ? customRange.start : selectedRange.start && DateTime.fromJSDate(selectedRange.start).isValid ? DateTime.fromJSDate(selectedRange.start).toFormat('dd/MM/yyyy') : ''}
                            onChange={(e) => {
                                setCustomRange({ ...customRange, start: e.target.value.replace(/[^\d/]/g, '').replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3') })
                            }}
                            onBlur={() => {
                                if (customRange.start && DateTime.fromFormat(customRange.start, 'dd/MM/yyyy').isValid && (!customRange.end || DateTime.fromFormat(customRange.end, 'dd/MM/yyyy').isValid && DateTime.fromFormat(customRange.start, 'dd/MM/yyyy').diffNow().toMillis() <= DateTime.fromFormat(customRange.end, 'dd/MM/yyyy').diffNow().toMillis())) {
                                    setSelectedRange({
                                        start: DateTime.fromFormat(customRange.start, 'dd/MM/yyyy').set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate()
                                    })
                                } else {
                                    setCustomRange({ ...customRange, start: '' })
                                }
                            }}
                        />
                        <span className="text-sm text-gray-700 dark:text-zinc-300 horizontal center">-</span>
                        <input
                            name="end"
                            disabled={!custom.value}
                            className="input focus:outline-none border rounded-md p-2 md:text-sm font-light text-gray-700 dark:text-zinc-300 disabled:opacity-50 w-30"
                            placeholder="dd/mm/yyyy"
                            value={custom.value ? customRange.end : selectedRange.end && DateTime.fromJSDate(selectedRange.end).isValid ? DateTime.fromJSDate(selectedRange.end).toFormat('dd/MM/yyyy') : ''}
                            onChange={(e) => {
                                setCustomRange({ ...customRange, end: e.target.value.replace(/[^\d/]/g, '').replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3') })
                            }}
                            onBlur={() => {
                                if (customRange.end && DateTime.fromFormat(customRange.end, 'dd/MM/yyyy').isValid && (!customRange.start || DateTime.fromFormat(customRange.start, 'dd/MM/yyyy').isValid && DateTime.fromFormat(customRange.end, 'dd/MM/yyyy').diffNow().toMillis() >= DateTime.fromFormat(customRange.start, 'dd/MM/yyyy').diffNow().toMillis())) {
                                    setSelectedRange({
                                        ...selectedRange,
                                        end: DateTime.fromFormat(customRange.end, 'dd/MM/yyyy').set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toJSDate()
                                    })
                                } else {
                                    setCustomRange({ ...customRange, end: '' })
                                }
                            }}
                        />
                    </span>
                    <button
                        type="button"
                        className="button button-primary col-span-full"
                        onClick={handleApply}
                        disabled={!isValidRange}
                    >
                        Apply
                    </button>
                </div>
            }
        />
    )
}