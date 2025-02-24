import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface RadioOption {
  /** The value of the radio option */
  value: string;
  /** The label text to display */
  label?: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** The name attribute for the radio group */
  name: string;
  /** Array of radio options */
  options: RadioOption[];
  /** Currently selected value */
  value?: string;
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Label for the entire group */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Additional className for the wrapper */
  className?: string;
  /** Additional className for the group */
  groupClassName?: string;
  /** Whether the entire group is disabled */
  disabled?: boolean;
  /** Layout direction - vertical or horizontal */
  direction?: 'vertical' | 'horizontal';
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({
    name,
    options,
    value,
    onChange,
    label,
    error,
    className,
    groupClassName,
    disabled = false,
    direction = 'vertical'
  }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    const handleClick = (optionValue: string, isDisabled: boolean) => {
      if (isDisabled) return;

      const input = document.getElementById(`${name}-${optionValue}`) as HTMLInputElement;
      if (input) {
        input.click();
      }
    };

    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-1', className)}
        role="radiogroup"
        aria-labelledby={label ? `${name}-label` : undefined}
      >
        {label && (
          <span
            id={`${name}-label`}
            className="text-sm font-medium mb-2"
          >
            {label}
          </span>
        )}
        <div
          className={cn(
            'flex gap-2',
            direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
            groupClassName
          )}
        >
          {options.map((option) => {
            const id = `${name}-${option.value}`;
            const isDisabled = disabled || option.disabled;
            const isChecked = value === option.value;

            return (
              <div key={option.value} className="flex items-center gap-2 group">
                <div className="relative inline-flex h-5 w-5">
                  <input
                    type="radio"
                    id={id}
                    name={name}
                    value={option.value}
                    checked={isChecked}
                    onChange={handleChange}
                    disabled={isDisabled}
                    className="peer sr-only"
                  />
                  <span
                    onClick={() => handleClick(option.value, isDisabled ?? false)}
                    className={cn(
                      'absolute inset-0 flex items-center justify-center rounded-full border-2 group',
                      'border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-800 transition-colors duration-200 ease-in-out peer-checked:border-[var(--color-primary)]',
                      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                      error && 'border-red-500'
                    )}
                  >
                    <span
                      className={cn(
                        'size-2 rounded-full opacity-0 transition-opacity',
                        'bg-[var(--color-primary)]',
                        'peer-checked:opacity-100',
                        !isChecked && 'group-hover:opacity-20',
                        isChecked && 'opacity-100'
                      )}
                    />
                  </span>
                </div>
                {option.label && <label
                  htmlFor={id}
                  className={cn(
                    'text-sm font-light dark:text-zinc-300',
                    'cursor-pointer select-none',
                    isDisabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {option.label}
                </label>}
              </div>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup'; 