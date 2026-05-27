/**
 * useDebouncedCallback — debounces a callback (REGISTRATION_LOGIN_API §2.7)
 * Use for username availability check (400–600ms)
 */

import { useCallback, useRef } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        fnRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}
