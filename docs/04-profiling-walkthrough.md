# 04 — Practical deliverable: a measurable before/after

The goal is to take a real screen, profile it, and produce a before/after with a
measurable improvement. Here are ways to do that with this app.

## A. List rendering: memory + first paint (List screen)

**Before:** ScrollView mode (mounts all 5,000 rows).
**After:** Optimized FlatList mode.

Measure:
1. **First paint** — read the in-app "first paint (ms)" stat when switching modes.
   ScrollView is dramatically higher because it builds 5,000 rows up front.
2. **Memory** — Android Studio Memory Profiler or Instruments Allocations. Capture
   a heap dump in ScrollView mode, note retained size; switch to Optimized,
   scroll, capture again. ScrollView retains ~5,000 native view nodes + fibers;
   FlatList retains only a window.
3. **Scroll FPS** — watch the in-app JS FPS meter while flinging. Naive/ScrollView
   dip; Optimized stays near 60.

Example report: "First paint 850ms → 60ms; retained list memory 180MB → 22MB;
scroll FPS 38 → 59." (Numbers depend on device.)

## B. Memory leak: prove it's gone (Memory Leaks screen)

**Before:** leaky mode.
1. Instruments Allocations → mark generation (or Android Studio heap dump).
2. Tap "Stress: cycle 25×".
3. Mark generation again. Growth ≈ 25 × (timer + listener + 2MB buffer) that
   never frees.

**After:** fixed mode, same steps. Growth ≈ 0 after GC; the in-app counters
(live intervals, subscriptions, retained MB) return to baseline.

Example report: "25 mount/unmount cycles: +50MB retained, +25 live timers
(leaky) → +0MB, 0 leftover timers (fixed)."

## C. Concurrent rendering responsiveness (Concurrent screen)

Harder to put one number on, but: in Blocking mode, record DevTools Performance
while typing a 10-char query fast and note the longest input-to-paint gap. Switch
to Deferred and repeat. The input-handling frames stay short because the heavy
list render is now preemptible.

You can also compare the FPS meter readings: blocking mode drops to single digits
during rapid typing while deferred mode stays above 30.

## Presenting it

For each: state the screen, the metric, the tool, the before, the after, and
why — tie it back to virtualization, cleanup, or scheduling from the relevant
doc. That structure demonstrates you understand what's happening, not just that
you clicked buttons.
