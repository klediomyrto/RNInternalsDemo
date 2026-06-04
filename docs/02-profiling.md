# 02 — Profiling: reading the output, not just running it

The skill is interpretation. For each tool: what it measures, how to capture, and
what the output means.

## A note on Flipper (deprecated)

Flipper was removed from the default RN template in 0.74. Its roles are now
covered by:

- **React Native DevTools** — the built-in debugger (press `j` in Metro, or Dev
  Menu → "Open DevTools"). Chrome-DevTools based: JS Performance profiler, Memory
  tab for heap snapshots, console, React component/profiler panels.
- **Hermes sampling profiler** — JS CPU.
- **Perfetto / systrace** — system-wide cross-thread timelines.
- **Xcode Instruments** and **Android Studio Profiler** — native CPU/memory.

## React Native DevTools — JS CPU & memory

Capture: DevTools → Performance → record → exercise the screen → stop.

Reading:
- The flame chart is the JS thread call tree over time. Width = time spent.
- A single wide frame = one function hogging the thread. Look for wide frames
  during scroll (the List screen's naive mode shows HeavyRowImpl/expensiveFormat
  recomputing too often per frame).
- Repeated wide frames during fast typing (Concurrent screen in blocking mode)
  are the filter/render cycle blocking every keystroke.

Memory tab: take a heap snapshot, do N mount/unmount cycles, snapshot again,
diff. Sort by retained size; the growth is your leak (see `docs/01`).

## Hermes sampling profiler — JS CPU

Capture: Dev Menu → "Enable Sampling Profiler", exercise, Dev Menu → "Disable
Sampling Profiler". Writes a `.cpuprofile` to the device; pull it (Android:
`adb pull`) and open in Chrome DevTools (Performance → load profile).

Reading: same flame-chart skills. Because Hermes runs bytecode with no JIT, the
stacks map cleanly to your functions — no deopt noise. The widest self-time
frame is almost always the real culprit.

## Perfetto / systrace (Android)

Capture: `npx react-native profile-hermes` integrates, or capture from Android
Studio / `perfetto`. RN emits trace markers (Fabric commit, mount, etc).

Reading: the cross-thread view. JS thread, UI/main thread, render/commit/mount
markers, GC, vsync — all on one timeline. Line up a dropped vsync with whatever
thread was busy at that moment. This answers "is jank in JS, in layout/commit,
or on the UI thread?"

## Xcode Instruments (iOS)

- **Time Profiler** — native + JS CPU across threads. Pick the thread, read the
  heaviest stacks.
- **Allocations** — live allocations over time; the generations feature is the
  iOS equivalent of snapshot-diffing. Mark generation A, do N cycles, mark B;
  "Growth" between marks = objects that leaked.
- **Leaks** — flags objects with no reference path from roots and shows the
  retain cycle.

Workflow for the Memory Leaks screen: Allocations → mark generation → "Stress:
cycle 25×" in leaky mode → mark generation. Growth shows ~25× the
buffers/timers. Repeat in fixed mode → near-zero growth.

## Android Studio Profiler

- **CPU** — record a method or sampled trace; same flame-chart reading.
- **Memory** — live Java/Kotlin heap graph, "Capture heap dump" for snapshots,
  "Record allocations". Diff two dumps to find growth; use reference chain to
  find the retainer.

Note: the JS heap (Hermes) and the Java heap are separate. A JS-side leak shows
in DevTools/Hermes memory; a native bitmap leak shows in the Java heap. Know
which one you're chasing.

## Putting it together

1. Glance at the in-app JS FPS meter → which thread?
2. JS thread guilty → Hermes profiler / DevTools Performance → find the wide frame.
3. UI thread / pixels lag → Perfetto / Instruments across threads; look at Fabric
   commit/mount.
4. Memory climbing per cycle → snapshot-diff in the matching heap tool.

Practical before/after recipe in `docs/04-profiling-walkthrough.md`.
