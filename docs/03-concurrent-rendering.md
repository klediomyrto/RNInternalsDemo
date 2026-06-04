# 03 — Concurrent rendering: what startTransition & useDeferredValue do

React 18+ (RN 0.85 ships React 19) brings the concurrent renderer. The core
idea: not all updates are equally urgent, and React can interrupt a low-priority
render to handle an urgent one first.

## Old model vs concurrent

Legacy React rendered synchronously and to completion. Once a render started, it
blocked the thread until it finished. A keystroke that triggered a big re-render
meant the input couldn't update until the whole tree was done — jank.

The concurrent renderer can yield. It renders in interruptible units and checks
whether something more urgent arrived. If so, it pauses, handles the urgent work,
then resumes or restarts the low-priority render. This is cooperative
scheduling / time-slicing, coordinated by React's Scheduler.

This works because Fabric's shadow tree is immutable: React can prepare an
alternate tree off to the side and commit it only when ready, or throw it away
without corrupting what's on screen.

## startTransition / useTransition

```ts
const [isPending, startTransition] = useTransition();

onChange(value) {
  setQuery(value);                 // URGENT: input must feel instant
  startTransition(() => {
    setResults(filter(value));     // NON-URGENT: may be interrupted/restarted
  });
}
```

- Updates inside `startTransition` are marked transition (low) priority.
- If an urgent update (the next keystroke) arrives mid-transition, React abandons
  the in-progress render and starts fresh with the latest input.
- `isPending` tells you a transition is in flight so you can show a subtle
  "updating…" indicator.

It doesn't make work faster — it changes its priority so it can be preempted.
Same total CPU, responsive experience.

## useDeferredValue

```ts
const deferred = useDeferredValue(query);
// render the expensive list from `deferred`, the input from `query`
```

Gives you a copy of a value that lags during urgent updates. React keeps the
urgent render (input showing latest `query`) and renders the expensive consumer
at lower priority. While `deferred !== query`, the displayed list is intentionally
stale — dim it to signal it's catching up.

`useDeferredValue` vs `startTransition`: same engine, different ergonomics.
`startTransition` wraps the update that sets the heavy state; `useDeferredValue`
wraps the value the heavy subtree reads.

## In the demo

The Concurrent screen filters 8,000 deliberately-expensive items:

- **Blocking**: the list reads `query` directly. Every keystroke synchronously
  re-filters and re-renders, so the TextInput stutters and JS FPS dips.
- **Deferred**: the list reads `useDeferredValue(query)` and the heavy update is
  a transition. Input stays at full speed; the list lags with an "updating…" /
  dimmed state, then catches up.

Type fast in both modes and watch the input caret + FPS meter. That difference —
responsiveness via priority, not raw speed — is the whole point.

## Caveats

- Don't wrap urgent updates (typing, toggles) in transitions.
- Transitions help when the render is the bottleneck. If a single synchronous
  function blocks the thread (a giant loop), concurrency can't preempt
  mid-function — you still need chunking or moving work off-thread.
