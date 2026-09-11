/**
 * Large print, as the onsite playbook requires ("large-print cards for accessibility") and as
 * anyone reading a phone in sunlight needs.
 *
 * It scales the whole shell rather than restyling text, because every size in globals.css is in
 * px: there is no root font-size to turn up, and a `rem` conversion of a 1300-line stylesheet is a
 * different change than this one. `zoom` on the shell scales type, spacing and hit targets
 * together, which is what large print actually means.
 *
 * THE FACTOR IS SMALLER ON PHONES, and the reason is worth stating because it looks like timidity.
 * Media queries do not follow `zoom`: at 1.25 on a 390px phone the layout is laid out in 312 CSS
 * pixels while every breakpoint still reports 390, so the stylesheet applies rules written for a
 * width the content no longer has. Measured, that overflows the welcome grid by 46px and gives the
 * page a horizontal scrollbar. 1.10 is the largest factor that is clean at both 360 and 390;
 * 1.25 is clean from 768 up. `npm run gate:largeprint` is what keeps those two numbers true.
 */
export const LARGE_PRINT_CLASS = "large-print";
const STORAGE_KEY = "tdfb-large-print";

/**
 * A tiny external store rather than component state, so React can read it with
 * useSyncExternalStore.
 *
 * The first version read localStorage in an effect and called setState with the result, which
 * lint rejected and was right to: that is a cascading render, and the value is not React state in
 * the first place — it lives in the browser and outlives the component. The server snapshot is
 * always false because the server has no localStorage, and React re-renders once on the client if
 * the stored value disagrees, which is the supported way to avoid a hydration mismatch.
 */
let enabled = false;
let started = false;
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    // Private windows and locked-down browsers throw on access rather than returning null. The
    // toggle still works for the session; it just will not be remembered.
    return false;
  }
}

function apply(): void {
  document.documentElement.classList.toggle(LARGE_PRINT_CLASS, enabled);
}

export function subscribeLargePrint(listener: () => void): () => void {
  if (!started) {
    started = true;
    enabled = read();
    apply();
  }
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getLargePrint(): boolean {
  return enabled;
}

/** Always false: there is no localStorage on the server, and guessing would mismatch the markup. */
export function getLargePrintOnServer(): boolean {
  return false;
}

export function setLargePrint(next: boolean): void {
  enabled = next;
  apply();
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Remembering it is a convenience, not the feature.
  }
  for (const listener of listeners) listener();
}
