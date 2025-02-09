import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface SwitchProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type'> {
  /** Label text to display next to switch */
  label?: string;
  /** Additional className for the wrapper element */
  wrapperClassName?: string;
  /** Error message to display */
  error?: string;
  /** Position of the label relative to the switch: 'left' | 'right' */
  labelPosition?: 'left' | 'right';
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ 
    label, 
    className, 
    wrapperClassName, 
    error, 
    id, 
    labelPosition = 'right',
    checked,
    disabled,
    onChange,
    ...props 
  }, ref) => {
    // Generate a unique ID if none provided
    const switchId = id || `switch-${Math.random().toString(36).slice(2)}`;

    const handleClick = () => {
      if (disabled) return;
      
      // Trigger the change event on the hidden input
      const input = document.getElementById(switchId) as HTMLInputElement;
      if (input) {
        input.click();
      }
    };

    const labelElement = label && (
      <label
        htmlFor={switchId}
        className={cn(
          'text-sm font-light',
          'cursor-pointer select-none',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {label}
      </label>
    );

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        <div 
          className={cn(
            'flex items-center gap-2',
            labelPosition === 'left' && 'flex-row-reverse justify-end'
          )}
        >
          <div className="relative inline-flex h-6 w-11">
            <input
              type="checkbox"
              id={switchId}
              ref={ref}
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="peer sr-only"
              {...props}
            />
            <span
              onClick={handleClick}
              className={cn(
                'absolute inset-0 cursor-pointer rounded-full',
                'bg-gray-200 dark:bg-zinc-800 transition-colors duration-200 ease-in-out',
                'peer-checked:bg-primary-600',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                'after:absolute after:left-[2px] after:top-[2px]',
                'after:h-5 after:w-5 after:rounded-full after:bg-white dark:after:bg-zinc-900',
                'after:transition-transform after:duration-200 after:ease-in-out',
                'peer-checked:after:translate-x-full',
                checked && 'peer-checked:bg-[var(--color-primary)]',
                error && 'border-2 border-red-500',
                className
              )}
            />
          </div>
          {labelElement}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
