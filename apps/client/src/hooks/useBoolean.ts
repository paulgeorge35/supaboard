import { useCallback, useMemo, useState } from "react";

export type UseBoolean = UseBooleanActions & {
  /** The current boolean value */
  value: boolean;
};

export type UseBooleanActions = {
  /** Function to set the boolean value directly */
  setValue: React.Dispatch<React.SetStateAction<boolean>>;
  /** Function to toggle the boolean value */
  toggle: () => void;
  /** Function to set the boolean value to true */
  setTrue: () => void;
  /** Function to set the boolean value to false */
  setFalse: () => void;
};

/**
 * A hook that manages boolean state with convenient toggle and set functions
 *
 * @param initialValue - The initial boolean value (defaults to false)
 * @returns An object containing the boolean value and functions to manipulate it
 *
 * @example
 * ```tsx
 * const { value, setValue, toggle, setTrue, setFalse } = useBoolean(false);
 *
 * return (
 *   <div>
 *     <p>Current value: {value ? 'True' : 'False'}</p>
 *     <button onClick={toggle}>Toggle</button>
 *     <button onClick={setTrue}>Set True</button>
 *     <button onClick={setFalse}>Set False</button>
 *     <button onClick={() => setValue(true)}>Set True</button>
 *     <button onClick={() => setValue(false)}>Set False</button>
 *   </div>
 * );
 * ```
 */
export const useBoolean = (initialValue = false): UseBoolean => {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => setValue((v: boolean) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  const actions = useMemo(
    () => ({ setValue, toggle, setTrue, setFalse }),
    [toggle, setTrue, setFalse]
  );

  return useMemo(() => ({ value, ...actions }) as UseBoolean, [actions, value]);
};
