import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface RadioOption {
  /** The value of the radio option */
  value: string;
  /** The label text to display */
  label: string;
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
    disabled = false,
    direction = 'vertical'
  }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
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
            direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
          )}
        >
          {options.map((option) => {
            const id = `${name}-${option.value}`;
            const isDisabled = disabled || option.disabled;

            return (
              <div key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={id}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  disabled={isDisabled}
                  className={cn(
                    'h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-500'
                  )}
                />
                <label
                  htmlFor={id}
                  className={cn(
                    'text-sm font-light',
                    'cursor-pointer',
                    isDisabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {option.label}
                </label>
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