# Fix Plan — Offline-First Stability

> Generated: 2026-04-21  
> Covers: bugs identified in code review of working-changes branch  
> Requirements traceability: `requirement.md` §2, §3, §4, §6

---

## Overview

Four groups of bugs must be fixed in priority order. Bugs 1+2 share a single root cause and must be fixed together. Each step includes the exact file, the mechanism, and an acceptance criterion.

```
Priority  Bug    Root Cause                             Files Affected
───────────────────────────────────────────────────────────────────────
CRITICAL  1+2    isOffline in refreshMasterDataForForm  input-panen.tsx
                 deps causes sync effect to re-run on   hooks.ts
                 every connectivity change, and the
                 reconnect debounce gets cancelled by
                 the same re-run.

MEDIUM    3      forceOffline:true bypasses the          hooks.ts
                 in-memory cache even when fresh data
                 exists there, always forcing SQLite.

MEDIUM    4      queryWithTimeout never clears its        hooks.ts
                 setTimeout when query resolves first —
                 accumulates dangling timers.

LOW       5      clearCache() not called after bg sync    input-panen.tsx
                 in input-panen; stale in-memory cache
                 can be served within the 5-min TTL
                 window after syncMasterData runs.
```

---

## Phase 1 — `lib/offline/hooks.ts`

### Step 1.1 — Fix timer leak in `queryWithTimeout`  *(Bug 4)*

**File:** `lib/offline/hooks.ts` — lines 39–45  
**Mechanism:** Capture the `setTimeout` id and clear it in a `.finally()` on the race.

```ts
// BEFORE
const queryWithTimeout = async (promise: Promise<any>, timeout: number): Promise<any> => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeout);
  });
  return Promise.race([promise, timeoutPromise]);
};

// AFTER
const queryWithTimeout = async (promise: Promise<any>, timeout: number): Promise<any> => {
  let timerId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error('Query timeout')), timeout);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timerId!));
};
```

**Acceptance:** Under repeated calls (e.g. 8 parallel queries in loadDivisiData), no dangling timers accumulate. Verified by React Native performance profiler showing timer count stable.

---

### Step 1.2 — Fix `forceOffline` bypassing valid in-memory cache  *(Bug 3)*

**File:** `lib/offline/hooks.ts` — lines 56–70  
**Mechanism:** Separate the cache-check guard from the online/offline routing. Cache is always checked first; `forceOffline` only affects whether to attempt Neon DB queries.

```ts
// BEFORE
if (cacheKey && !forceOffline) {          // <-- cache skipped when forceOffline
  const cachedData = isCacheValid(cacheKey);
  if (cachedData) return { rows: cachedData };
}
const netInfo = await NetInfo.fetch();
if (forceOffline || !netInfo.isConnected) {
  throw new Error('Offline mode or no connection');
}

// AFTER
// Cache check is unconditional — forceOffline does NOT bypass valid cache
if (cacheKey) {
  const cachedData = isCacheValid(cacheKey);
  if (cachedData) {
    console.log(`Using cached data for ${cacheKey}`);
    return { rows: cachedData };
  }
}
// Only then decide whether to try Neon DB
const netInfo = await NetInfo.fetch();
if (forceOffline || !netInfo.isConnected) {
  console.log('Skipping online queries, using offline data only');
  throw new Error('Offline mode or no connection');
}
```

**Why this is correct:** The in-memory cache is populated from Neon DB. If the device recently loaded fresh data, that cache is at most as stale as the Neon DB itself. SQLite contains the same data (synced from Neon). Bypassing in-memory cache to hit SQLite achieves nothing except slower reads and wasted I/O.  

**Acceptance:** When app is online and cache is valid, `forceOffline:true` still returns cached data (no unnecessary SQLite reads). When cache is expired or empty and offline, SQLite is used.

---

## Phase 2 — `app/input-panen.tsx`

### Step 2.1 — Break the `isOffline` → `refreshMasterDataForForm` → sync effect re-run chain  *(Bugs 1 & 2)*

**File:** `app/input-panen.tsx`  
**Root cause:** `isOffline` is in `refreshMasterDataForForm`'s `useCallback` dependency array. Every connectivity change recreates `refreshMasterDataForForm`, which makes `useEffect([refreshMasterDataForForm])` re-run, which:
- Re-invokes `performInitialSync()` (Bug 1)
- Runs cleanup that cancels the reconnect debounce timer (Bug 2)

**Mechanism:** Track `isOffline` in a ref so `refreshMasterDataForForm` can always read the latest value without needing to re-create itself.

**Add after the `isOffline` state declaration (line ~48):**
```ts
const isOfflineRef = useRef(isOffline);
useEffect(() => {
  isOfflineRef.current = isOffline;
}, [isOffline]);
```

**Update `refreshMasterDataForForm` — remove `isOffline` from deps, use ref inside:**
```ts
const refreshMasterDataForForm: () => Promise<void> = useCallback(async () => {
  clearMasterDataCache();
  await loadDivisiList({ forceOffline: isOfflineRef.current });
  const targetDivisiId = activeDivisiRef.current || profile?.divisi_id;
  if (targetDivisiId) {
    await loadDivisiData(targetDivisiId, { forceRefresh: true, forceOffline: isOfflineRef.current });
  }
}, [loadDivisiData, loadDivisiList, profile?.divisi_id]);
//   ↑ isOffline removed — no longer a dep
```

**Result of this change:**
- `refreshMasterDataForForm` is only recreated when `loadDivisiData`, `loadDivisiList`, or `profile?.divisi_id` changes — not on every network toggle.
- `useEffect([refreshMasterDataForForm])` no longer re-runs on connectivity changes.
- `performInitialSync` runs exactly once on mount (Bug 1 fixed).
- The reconnect debounce timer is never cancelled by an effect cleanup (Bug 2 fixed).

**Acceptance:**
- Toggle airplane mode on/off 3×; confirm `performInitialSync` fires only once (check console logs for "Loading data for divisi").
- Toggle offline → online; the 2-second reconnect debounce fires and "Connection restored, triggering sync..." appears exactly once per reconnect event.

---

### Step 2.2 — Clear in-memory cache after background sync and on reconnect  *(Bug 5 + requirement §3)*

**Requirement:** "Setelah sync master sukses, data dropdown di UI harus di-refresh dari sumber terbaru." and "Cache dropdown wajib memiliki invalidasi berbasis perubahan SQLite (database change listener)."

The `SQLite.addDatabaseChangeListener` already triggers `refreshMasterDataForForm`. The gap is that the module-level Neon DB cache in `hooks.ts` is **not** cleared, so `refreshMasterDataForForm` may serve stale Neon cache for up to 5 minutes after sync. Fix: call `clearCache()` before refresh in every post-sync path.

**2.2a — In `performInitialSync` (initial background sync):**
```ts
// Background sync after UI is populated
try {
  await syncMasterData();
  clearCache();              // ← ADD: invalidate Neon DB cache after sync
} catch (err) {
  console.error('Initial sync master failed:', err);
}
```

**2.2b — In the reconnect debounce handler:**
```ts
reconnectDebounceTimer = setTimeout(async () => {
  console.log('Connection restored, triggering sync...');
  try {
    await syncMasterData();
    clearCache();            // ← ADD: clear stale cache before refresh
    await refreshMasterDataForForm();
  } catch (err) {
    console.error('Auto-sync master after reconnect failed:', err);
  }
  try {
    await syncHarvestQueue();
  } catch (err) {
    console.error('Auto-sync queue after reconnect failed:', err);
  }
}, 2000);
```

**2.2c — In the `SQLite.addDatabaseChangeListener` handler:**
```ts
masterCacheRefreshTimerRef.current = setTimeout(() => {
  clearCache();              // ← ADD: ensure no stale Neon cache mixed with fresh SQLite read
  refreshMasterDataForForm().catch((error) => {
    console.error('Error refreshing master cache after db change:', error);
  });
}, 250);
```

**Acceptance:** After a forced sync (sync-master screen), switch app to offline. Data in dropdowns matches what was just synced. No stale Neon-cached data appears.

---

## Phase 3 — Verification Checklist

Run through these scenarios manually after all fixes are applied:

| # | Scenario | Expected Result |
|---|----------|-----------------|
| V1 | App cold-start, online | Data loads once from Neon, cached, background sync runs, UI refreshes via db listener |
| V2 | App cold-start, offline (airplane mode) | Data loads from SQLite immediately, no network error shown |
| V3 | Go offline mid-session, change divisi | Dropdown still populates from in-memory cache (if <5 min) or SQLite |
| V4 | Toggle airplane off → on | Exactly one "Connection restored" sync fires; dropdowns refresh |
| V5 | Toggle airplane 3× rapidly | No duplicate syncs, no crash, no empty dropdowns |
| V6 | Open sync-master, tap sync | After sync completes, dropdowns show fresh data (clearCache called) |
| V7 | Input panen form, select divisi while online | Gang/Blok/Pemanen/TPH load from in-memory cache if available, Neon if not |
| V8 | Input panen form, select divisi while offline | Data loads from SQLite |
| V9 | Submit offline record, go online, open sync-manager | Record synced, status updated to 'synced' |

---

## Phase 4 — Documentation updates (per `requirement.md` §Aturan Perubahan)

After code fixes are complete:

1. **`CHANGELOG.md`** — add entry for this fix set describing:
   - Sync effect no longer re-fires on connectivity changes
   - In-memory cache not bypassed when forceOffline=true and cache is valid
   - clearCache() called in all post-sync paths
   - queryWithTimeout timer leak fixed

2. **`requirement.md`** — no behavioral requirements changed; no update needed.

---

## Implementation Order

```
1. lib/offline/hooks.ts       Step 1.1  (timer leak — isolated, no side-effects)
2. lib/offline/hooks.ts       Step 1.2  (forceOffline cache logic — isolated)
3. app/input-panen.tsx        Step 2.1  (isOfflineRef — core lifecycle fix)
4. app/input-panen.tsx        Step 2.2a (clearCache in performInitialSync)
5. app/input-panen.tsx        Step 2.2b (clearCache in reconnect handler)
6. app/input-panen.tsx        Step 2.2c (clearCache in db change listener)
7. Manual verification         Phase 3  (all 9 scenarios)
8. CHANGELOG.md               Phase 4  (documentation)
```

Steps 1.1 and 1.2 can be done in a single edit to `hooks.ts`.  
Steps 2.2a–c can be done in a single edit to `input-panen.tsx` after Step 2.1.
