/**
 * Load a native module without taking the app down when it isn't in the binary.
 *
 * A top-level `import` of a native module is evaluated when the file is first
 * required, and if the native side is missing the module throws an
 * Invariant Violation *at import time*. That is not a failed feature — it is a
 * crash that propagates up to whatever imported it, which in practice means the
 * root layout and the entire app.
 *
 * It happens for real in two situations that both matter:
 *   - **Expo Go**, which cannot contain arbitrary native modules
 *   - a **development build made before the dependency was added**, which is
 *     every teammate's build until they rebuild
 *
 * Neither should be a white screen. `requireOptional` turns "the native module
 * isn't here" into a null the caller can branch on, so the feature disappears
 * and everything else keeps working.
 */
import { logger } from "./logger";

const cache = new Map<string, unknown>();

export function requireOptional<T = any>(
  name: string,
  load: () => T
): T | null {
  if (cache.has(name)) return cache.get(name) as T | null;

  let mod: T | null = null;
  try {
    mod = load();
    // Some modules resolve but throw on first property access, when the JS
    // shim is present and the native side is not. Touching it here surfaces
    // that now, where it is handled, rather than mid sign-in.
    void Object.keys(mod as object);
  } catch (e) {
    logger.info(
      `native module "${name}" is not available in this build; ` +
        `the feature that uses it will be hidden`
    );
    mod = null;
  }

  cache.set(name, mod);
  return mod;
}
