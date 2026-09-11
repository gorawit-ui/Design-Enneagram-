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

export function readLargePrint(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    // Private windows and locked-down browsers throw on access rather than returning null. The
    // toggle still works for the session; it just will not be remembered.
    return false;
  }
}

export function writeLargePrint(enabled: boolean): void {
  document.documentElement.classList.toggle(LARGE_PRINT_CLASS, enabled);
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Remembering it is a convenience, not the feature.
  }
}
