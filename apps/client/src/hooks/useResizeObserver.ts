import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type DOMRectReadOnly = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
};

export type ResizeObserverSize = {
  readonly inlineSize: number;
  readonly blockSize: number;
};

export type ResizeDimensions = {
  /** The width of the observed element */
  width: number;
  /** The height of the observed element */
  height: number;
  /** The border box size of the observed element */
  borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  /** The content box size of the observed element */
  contentBoxSize: ReadonlyArray<ResizeObserverSize>;
  /** The device pixel content box size of the observed element */
  devicePixelContentBoxSize: ReadonlyArray<ResizeObserverSize>;
};

export type UseResizeObserverOptions = {
  /** Whether to observe the element immediately */
  immediate?: boolean;
  /** Whether to use border box instead of content box for dimensions */
  useBorderBox?: boolean;
  /** Callback when dimensions change */
  onResize?: (dimensions: ResizeDimensions) => void;
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
};

export type UseResizeObserver<T extends HTMLElement = HTMLElement> = {
  /** Ref to attach to the element to observe */
  ref: React.RefObject<T | null>;
  /** Current dimensions of the observed element */
  dimensions: ResizeDimensions;
  /** Whether the observer is currently observing */
  isObserving: boolean;
  /** Start observing if not already */
  startObserving: () => void;
  /** Stop observing if currently observing */
  stopObserving: () => void;
};

/**
 * A hook that observes an element's size changes using ResizeObserver with
 * enhanced features and performance optimizations.
 *
 * @template T - The type of HTML element to observe
 * @param options - Configuration options
 * @returns An object containing the ref, dimensions, and control functions
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { ref, dimensions } = useResizeObserver<HTMLDivElement>();
 *
 * return (
 *   <div ref={ref} style={{ resize: 'both', overflow: 'auto' }}>
 *     Width: {dimensions.width}px
 *     Height: {dimensions.height}px
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with all features
 * const { ref, dimensions, isObserving, stopObserving } = useResizeObserver({
 *   immediate: true,
 *   useBorderBox: true,
 *   debounceDelay: 250,
 *   onResize: (dims) => {
 *     console.log('Element resized:', dims);
 *     updateLayout(dims);
 *   }
 * });
 *
 * useEffect(() => {
 *   // Stop observing when dimensions exceed threshold
 *   if (dimensions.width > 1000) {
 *     stopObserving();
 *   }
 * }, [dimensions.width, stopObserving]);
 * ```
 */
export const useResizeObserver = <T extends HTMLElement = HTMLElement>({
  immediate = true,
  useBorderBox = false,
  onResize,
  debounceDelay = 0,
}: UseResizeObserverOptions = {}): UseResizeObserver<T> => {
  const ref = useRef<T>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [isObserving, setIsObserving] = useState(immediate);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize dimensions with empty arrays for box sizes
  const [dimensions, setDimensions] = useState<ResizeDimensions>({
    width: 0,
    height: 0,
    borderBoxSize: [],
    contentBoxSize: [],
    devicePixelContentBoxSize: [],
  });

  // Create a stable callback for handling resize entries
  const handleResize = useCallback(
    (entries: readonly ResizeObserverEntry[]) => {
      if (!entries.length) return;

      const entry = entries[0];
      const newDimensions: ResizeDimensions = {
        width: useBorderBox
          ? entry.borderBoxSize[0]?.inlineSize || entry.contentRect.width
          : entry.contentRect.width,
        height: useBorderBox
          ? entry.borderBoxSize[0]?.blockSize || entry.contentRect.height
          : entry.contentRect.height,
        borderBoxSize: entry.borderBoxSize || [],
        contentBoxSize: entry.contentBoxSize || [],
        devicePixelContentBoxSize: entry.devicePixelContentBoxSize || [],
      };

      setDimensions(newDimensions);
      onResize?.(newDimensions);
    },
    [useBorderBox, onResize]
  );

  // Debounced resize handler
  const debouncedHandleResize = useCallback(
    (entries: readonly ResizeObserverEntry[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (debounceDelay > 0) {
        timeoutRef.current = setTimeout(() => {
          handleResize(entries);
        }, debounceDelay);
      } else {
        handleResize(entries);
      }
    },
    [handleResize, debounceDelay]
  );

  // Start observing function
  const startObserving = useCallback(() => {
    if (!ref.current || observerRef.current) return;

    try {
      observerRef.current = new ResizeObserver(debouncedHandleResize);
      observerRef.current.observe(ref.current);
      setIsObserving(true);
    } catch (error) {
      console.warn("Failed to initialize ResizeObserver:", error);
    }
  }, [debouncedHandleResize]);

  // Stop observing function
  const stopObserving = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
      setIsObserving(false);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Set up and clean up the observer
  useEffect(() => {
    if (immediate) {
      startObserving();
    }

    return () => {
      stopObserving();
    };
  }, [immediate, startObserving, stopObserving]);

  return useMemo(
    () => ({
      ref,
      dimensions,
      isObserving,
      startObserving,
      stopObserving,
    }),
    [dimensions, isObserving, startObserving, stopObserving]
  );
};
