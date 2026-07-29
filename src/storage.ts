/* ------------------------------------------------------------------ *
 * Local storage, namespaced — with a one-time migration.
 *
 * The app used to be called Stratfield, so everything it had ever saved
 * lived under `stratfield.*`. Renaming the keys without moving the values
 * would have silently wiped every reader's theme, course progress and
 * chat threads, which is a rude way to ship a rename. Reading a key
 * moves it across the first time it is asked for; after that the old one
 * is gone and nothing else in the app has to know this happened.
 * ------------------------------------------------------------------ */

const PREFIX = "octant.";
const LEGACY_PREFIX = "stratfield.";

/** Read a namespaced value, migrating it from the old namespace if needed. */
export function readStored(name: string): string | null {
  try {
    const current = localStorage.getItem(PREFIX + name);
    if (current !== null) return current;

    const legacy = localStorage.getItem(LEGACY_PREFIX + name);
    if (legacy === null) return null;
    localStorage.setItem(PREFIX + name, legacy);
    localStorage.removeItem(LEGACY_PREFIX + name);
    return legacy;
  } catch {
    return null; // private mode, or storage disabled
  }
}

/** Write a namespaced value. Failures are ignored — persistence is a nicety. */
export function writeStored(name: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + name, value);
  } catch {
    /* private mode — it just will not persist */
  }
}

/** Remove a namespaced value, and any stale copy under the old namespace. */
export function removeStored(name: string): void {
  try {
    localStorage.removeItem(PREFIX + name);
    localStorage.removeItem(LEGACY_PREFIX + name);
  } catch {
    /* nothing to do */
  }
}

/* ------------------------------------------------------------------ *
 * Session storage — scoped to the tab, gone when it closes. Used for
 * state that should start fresh each session rather than persist
 * indefinitely (e.g. the active chat thread).
 * ------------------------------------------------------------------ */

export function readSessionStored(name: string): string | null {
  try {
    return sessionStorage.getItem(PREFIX + name);
  } catch {
    return null;
  }
}

export function writeSessionStored(name: string, value: string): void {
  try {
    sessionStorage.setItem(PREFIX + name, value);
  } catch {
    /* private mode — it just will not persist */
  }
}

export function removeSessionStored(name: string): void {
  try {
    sessionStorage.removeItem(PREFIX + name);
  } catch {
    /* nothing to do */
  }
}
