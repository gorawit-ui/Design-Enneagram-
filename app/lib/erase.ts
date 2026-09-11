/**
 * The delete half of the playbook's "delete/export route" (ONSITE_ACTIVITY_50_MIN.md, minutes
 * 47-50), which the app promised and did not have.
 *
 * It was called vacuous while nothing was stored, and that stopped being true twice over: the app
 * now keeps a display preference in localStorage and a service worker keeps a megabyte of the app
 * in a cache. Neither is personal, and saying "we hold nothing" while holding both is the kind of
 * small untruth that makes the large ones unbelievable. So the page names what is there and this
 * removes it.
 *
 * It becomes a PDPA obligation rather than a courtesy the moment the January calibration write
 * exists (docs/HR_ITEMS_OWED.md item 0). Building it now means the obligation is met on the day
 * collection starts rather than after someone asks.
 */
export type EraseReport = {
  storageKeys: number;
  caches: number;
  workers: number;
  failures: readonly string[];
};

/** Everything this app has put in the browser. Answers are not here: they live in React state. */
export async function eraseLocalData(): Promise<EraseReport> {
  const failures: string[] = [];
  let storageKeys = 0;
  let cacheCount = 0;
  let workers = 0;

  try {
    // Only this app's keys, by prefix. Clearing the whole origin would take anything else served
    // from the same host with it.
    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith("tdfb-"));
    for (const key of keys) window.localStorage.removeItem(key);
    storageKeys = keys.length;
  } catch {
    failures.push("localStorage");
  }

  try {
    if ("caches" in window) {
      const names = (await caches.keys()).filter((name) => name.startsWith("tdfb-pq-"));
      await Promise.all(names.map((name) => caches.delete(name)));
      cacheCount = names.length;
    }
  } catch {
    failures.push("cache");
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      workers = registrations.length;
    }
  } catch {
    failures.push("service worker");
  }

  return { storageKeys, caches: cacheCount, workers, failures };
}
