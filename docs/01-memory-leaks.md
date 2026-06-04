# 01 — Memory leaks: patterns, why they retain, how to find them

A "leak" in RN is JS (or native) memory the GC can't reclaim because something
still references it. The fix is almost always: drop the reference when the owning
component goes away. The Memory Leaks screen shows live versions of all of this.

## The three classic JS-side patterns

### 1. Uncleared timers
```ts
useEffect(() => {
  const id = setInterval(tick, 250);
  // BUG: no cleanup. Interval keeps firing after unmount, callback keeps
  // the whole closure alive.
}, []);
```
Fix: return a cleanup.
```ts
useEffect(() => {
  const id = setInterval(tick, 250);
  return () => clearInterval(id);
}, []);
```

### 2. Uncleared subscriptions / listeners
Event emitters, AppState, Dimensions, navigation listeners, sockets, store
subscriptions. Every `addListener` must be matched by a `remove`.
```ts
useEffect(() => {
  const sub = emitter.addListener('data', onData);
  return () => sub.remove();   // the line people forget
}, []);
```
If you skip this, the emitter holds `onData`, which closes over your component
scope, and the component (plus its props, state, and any big data it captured)
can never be collected.

### 3. Stale closures holding references
A closure created inside the component captures variables by reference. If it
outlives the component (handed to a long-lived timer, listener, or global), it
pins everything it captured.

```ts
const bigData = new Uint8Array(2 * 1024 * 1024); // 2 MB
listeners.push(() => { if (bigData[0] === 255) doThing(); });
// closure captures bigData. As long as `listeners` holds it, the 2 MB lives.
```

## Other common sources

- **Non-virtualized large lists.** A ScrollView with thousands of `.map`'d
  children mounts and retains every row's view + fiber. Use FlatList so only a
  window of rows exists. (List screen demonstrates this.)
- **Caches without bounds.** Module-level objects/arrays that only grow.
- **Closures in useCallback/useMemo** capturing large values that stay alive
  across renders unintentionally.
- **Native side.** Retained images/bitmaps, native view leaks, retain cycles in
  ObjC blocks. Found with Instruments (iOS) / Android Studio (Java heap), not
  the JS heap.

## How retention works

A GC frees an object when it's unreachable from any root (globals, call stack,
live closures, active timers/listeners). A leak is a *reachable* object you no
longer want. "Force a GC" never fixes a real leak — you must sever the reference.

In the demo, the leaky widget keeps the interval, the listener, and the buffer
reachable forever. The fixed widget severs all three on unmount.

## Finding them

1. **Reproduce a cycle.** Navigate into a screen and back, or mount/unmount a
   component, many times. Leaks show as memory that climbs each cycle and never
   returns.
2. **Watch a live graph.** Android Studio Memory Profiler or Xcode Instruments
   Allocations: sawtooth that trends upward = leak; sawtooth around a flat
   baseline = healthy.
3. **Snapshot + diff.** Take a heap snapshot at baseline, do N cycles, force GC,
   snapshot again, diff. Objects whose count grew by ~N are suspects.
4. **Find the retaining path.** Instruments "Leaks" / heap reference tree /
   Android reference chain shows what's keeping it alive — follow the chain to
   the timer/listener/closure.

Tool steps are in `docs/02-profiling.md`. The in-app counters on the Memory Leaks
screen (live intervals, subscriptions, retained MB) let you see the leak before
you even open a profiler.
