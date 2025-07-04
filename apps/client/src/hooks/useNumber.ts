import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type UseNumberActions = {
  /** Function to set the number value directly */
  setValue: (value: number | ((prev: number) => number)) => void;
  /** Function to increase the number by a specified amount or the default step */
  increase: (amount?: number) => void;
  /** Function to decrease the number by a specified amount or the default step */
  decrease: (amount?: number) => void;
  /** Function to reset the number to its initial value */
  reset: () => void;
  /** Function to validate and clamp a value to the allowed range */
  clamp: (value: number) => number;
};

export type UseNumberState = {
  /** The current number value */
  value: number;
  /** Whether the value is at its minimum */
  isAtMin: boolean;
  /** Whether the value is at its maximum */
  isAtMax: boolean;
  /** The amount the value has changed since initialization */
  delta: number;
  /** Whether the value is currently being changed */
  isChanging: boolean;
};

export type UseNumber = UseNumberActions & UseNumberState;

export type UseNumberProps = {
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step value for increase/decrease operations */
  step?: number;
  /** Whether to loop around when reaching min/max values */
  loop?: boolean;
  /** Whether to allow floating point numbers */
  float?: boolean;
  /** Number of decimal places to round to */
  precision?: number;
  /** Callback when the value changes */
  onChange?: (value: number, previous: number) => void;
  /** Callback when value reaches min/max */
  onLimit?: (at: "min" | "max") => void;
  /** Whether to enable keyboard arrow controls when focused */
  enableKeyboardControls?: boolean;
};

/**
 * A hook that manages a numeric value with comprehensive features for
 * increment, decrement, validation, and formatting.
 *
 * @param initialValue - The initial number value
 * @param props - Configuration options
 * @returns An object containing the number value and control functions
 *
 * @example
 * ```tsx
 * // Basic counter with validation
 * const counter = useNumber(0, {
 *   min: 0,
 *   max: 10,
 *   onChange: (value, prev) => console.log(`Changed from ${prev} to ${value}`)
 * });
 *
 * return (
 *   <div>
 *     <p>Count: {counter.value}</p>
 *     <button
 *       onClick={() => counter.increase()}
 *       disabled={counter.isAtMax}
 *     >
 *       Increase
 *     </button>
 *     <button
 *       onClick={() => counter.decrease()}
 *       disabled={counter.isAtMin}
 *     >
 *       Decrease
 *     </button>
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with all features
 * const volume = useNumber(50, {
 *   min: 0,
 *   max: 100,
 *   step: 5,
 *   loop: true,
 *   float: true,
 *   precision: 1,
 *   enableKeyboardControls: true,
 *   onChange: (value) => updateVolume(value),
 *   onLimit: (at) => showNotification(`Volume at ${at}`)
 * });
 *
 * return (
 *   <div>
 *     <label>
 *       Volume: {volume.value}%
 *       <input
 *         type="range"
 *         value={volume.value}
 *         onChange={(e) => volume.setValue(parseFloat(e.target.value))}
 *         min={0}
 *         max={100}
 *         step={5}
 *       />
 *     </label>
 *     <div>
 *       Delta: {volume.delta > 0 ? '+' : ''}{volume.delta}%
 *     </div>
 *   </div>
 * );
 * ```
 */
export const useNumber = (
  initialValue: number,
  {
    min,
    max,
    step = 1,
    loop = false,
    float = false,
    precision = 2,
    onChange,
    onLimit,
    enableKeyboardControls = false,
  }: UseNumberProps = {}
): UseNumber => {
  // Validate and normalize initial value
  const normalizedInitial = useMemo(() => {
    let value = initialValue;
    if (!float) value = Math.round(value);
    if (min !== undefined && value < min) value = min;
    if (max !== undefined && value > max) value = max;
    if (precision !== undefined && float) {
      value = Number(value.toFixed(precision));
    }
    return value;
  }, [initialValue, min, max, float, precision]);

  const [value, setInternalValue] = useState<number>(normalizedInitial);
  const [isChanging, setIsChanging] = useState(false);
  const previousValueRef = useRef(normalizedInitial);
  const changeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clamp value to min/max range
  const clamp = useCallback(
    (newValue: number): number => {
      let clampedValue = newValue;

      if (!float) {
        clampedValue = Math.round(clampedValue);
      } else if (precision !== undefined) {
        clampedValue = Number(clampedValue.toFixed(precision));
      }

      if (min !== undefined && max !== undefined && loop) {
        if (clampedValue > max) return min;
        if (clampedValue < min) return max;
      }

      if (min !== undefined) {
        if (clampedValue < min) {
          onLimit?.("min");
          return min;
        }
      }

      if (max !== undefined) {
        if (clampedValue > max) {
          onLimit?.("max");
          return max;
        }
      }

      return clampedValue;
    },
    [min, max, loop, float, precision, onLimit]
  );

  // Set value with validation
  const setValue = useCallback(
    (newValue: number | ((prev: number) => number)) => {
      setInternalValue((prev) => {
        const nextValue = clamp(
          typeof newValue === "function" ? newValue(prev) : newValue
        );
        if (nextValue !== prev) {
          onChange?.(nextValue, prev);
        }
        previousValueRef.current = nextValue;
        return nextValue;
      });

      setIsChanging(true);
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
      changeTimeoutRef.current = setTimeout(() => {
        setIsChanging(false);
      }, 150);
    },
    [clamp, onChange]
  );

  const increase = useCallback(
    (amount?: number) => {
      setValue((prev) => prev + (amount ?? step));
    },
    [setValue, step]
  );

  const decrease = useCallback(
    (amount?: number) => {
      setValue((prev) => prev - (amount ?? step));
    },
    [setValue, step]
  );

  const reset = useCallback(() => {
    setValue(normalizedInitial);
  }, [normalizedInitial, setValue]);

  // Keyboard controls
  useEffect(() => {
    if (!enableKeyboardControls) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        increase();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        decrease();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboardControls, increase, decrease]);

  // Cleanup
  useEffect(() => {
    const timeout = changeTimeoutRef.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  return {
    value,
    setValue,
    increase,
    decrease,
    reset,
    clamp,
    isAtMin: min !== undefined && value <= min,
    isAtMax: max !== undefined && value >= max,
    delta: value - normalizedInitial,
    isChanging,
  };
};
