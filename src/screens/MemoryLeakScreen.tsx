import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Btn, Card, Segmented, Stat } from '../components/ui';

/**
 * MEMORY LEAK DEMO
 * ----------------
 * A "leaky" widget and a "fixed" widget. Both subscribe to a ticking source and
 * allocate a chunk of retained data on mount. The leaky one never tears any of
 * that down on unmount; the fixed one returns cleanup from useEffect.
 *
 * To make the leak tangible WITHOUT a profiler we keep two module-level
 * registries: one counting still-running intervals, one holding leaked byte
 * buffers. Mount/unmount the widget repeatedly and watch them climb in the
 * leaky case and stay flat in the fixed case.
 *
 * docs/03-memory-leaks.md and docs/04-profiling.md.
 */

// --- module-level registries so the leak is observable in-app -------------
const activeIntervals = new Set<ReturnType<typeof setInterval>>();
const leakedBuffers: Uint8Array[] = []; // simulates retained large data
let listeners: Array<() => void> = []; // simulates an event subscription list

const snapshot = () => {
  const bytes = leakedBuffers.reduce((s, b) => s + b.byteLength, 0);
  return {
    intervals: activeIntervals.size,
    listeners: listeners.length,
    mb: (bytes / (1024 * 1024)).toFixed(1),
  };
};

// --- the two widget variants ----------------------------------------------
function LeakyWidget() {
  const [n, setN] = useState(0);

  useEffect(() => {
    // 1) interval never cleared
    const id = setInterval(() => setN(x => x + 1), 250);
    activeIntervals.add(id);

    // 2) subscription never removed -> the closure below keeps `bigData` alive forever
    const bigData = new Uint8Array(2 * 1024 * 1024); // 2 MB
    leakedBuffers.push(bigData);
    const handler = () => {
      // stale closure capturing bigData + setN; never unsubscribed
      if (bigData[0] === 255) {
        setN(x => x);
      }
    };
    listeners.push(handler);

    // NO cleanup returned -> classic leak
  }, []);

  return <Text style={styles.widgetText}>Leaky widget alive — ticks {n}</Text>;
}

function FixedWidget() {
  const [n, setN] = useState(0);
  const bufRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const id = setInterval(() => setN(x => x + 1), 250);
    activeIntervals.add(id);

    const bigData = new Uint8Array(2 * 1024 * 1024);
    bufRef.current = bigData;
    leakedBuffers.push(bigData);
    const handler = () => {
      if (bigData[0] === 255) {
        setN(x => x);
      }
    };
    listeners.push(handler);

    // CLEANUP: stop the timer, remove the subscription, release the buffer.
    return () => {
      clearInterval(id);
      activeIntervals.delete(id);
      listeners = listeners.filter(l => l !== handler);
      const idx = leakedBuffers.indexOf(bigData);
      if (idx >= 0) {
        leakedBuffers.splice(idx, 1);
      }
      bufRef.current = null; // drop our reference so GC can reclaim it
    };
  }, []);

  return <Text style={styles.widgetText}>Fixed widget alive — ticks {n}</Text>;
}

const MemoryLeakScreen = () => {
  const [mode, setMode] = useState<'leaky' | 'fixed'>('leaky');
  const [mounted, setMounted] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 300);
    return () => clearInterval(id);
  }, []);

  const s = snapshot();

  const cycle = () => {
    // simulation of navigating away and back many times quickly
    setMounted(false);
    setTimeout(() => setMounted(true), 30);
  };

  return (
    <ScrollView>
      <Card>
        <Text style={styles.p}>
          Mount/unmount the widget repeatedly. In leaky mode the live-interval
          count, listener count and retained memory keep climbing. In fixed mode
          they return to baseline because useEffect cleanup runs on unmount.
        </Text>
      </Card>

      <Segmented
        value={mode}
        onChange={(v: 'leaky' | 'fixed') => setMode(v)}
        options={[
          { label: 'Leaky', value: 'leaky' },
          { label: 'Fixed', value: 'fixed' },
        ]}
      />

      <Card tone={mode === 'leaky' ? 'bad' : 'good'}>
        <View style={styles.statsRow}>
          <Stat label="Live intervals" value={s.intervals} />
          <Stat label="subscriptions" value={s.listeners} />
          <Stat label="retained MB" value={s.mb} />
        </View>
      </Card>

      <Card title="The widget under test">
        {mounted ? (
          mode === 'leaky' ? (
            <LeakyWidget />
          ) : (
            <FixedWidget />
          )
        ) : (
          <Text style={styles.widgetText}>(unmounted)</Text>
        )}
      </Card>

      <Btn label="Mount / Unmount once" onPress={cycle} />
      <Btn
        label="Stress: cycle 25×"
        tone="danger"
        onPress={() => {
          let i = 0;
          const run = () => {
            cycle();
            if (++i < 25) {
              setTimeout(run, 70);
            }
          };
          run();
        }}
      />

      <Card title="What to look for in the profiler">
        <Text style={styles.p}>
          Allocations / Java heap: leaky mode shows monotonic growth in Timer
          objects, the listener array, and 2&nbsp;MB Uint8Array buffers that GC
          never reclaims (something still references them). Fixed mode returns
          to baseline after a GC. Full steps in docs/04-profiling.md.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  p: { color: '#ddd', fontSize: 13, lineHeight: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  widgetText: { color: '#fff', fontSize: 14 },
});

export default MemoryLeakScreen;
