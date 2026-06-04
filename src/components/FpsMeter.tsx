import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * FpsMeter measures the JS thread frame rate.
 *
 * It schedules a requestAnimationFrame callback every frame. rAF callbacks are
 * driven from the JS thread, so when the JS thread is blocked (a long
 * synchronous task, a big synchronous render) the callback stops firing and the
 * measured FPS collapses toward 0. That is exactly the signal we want: this
 * number is a live readout of how healthy the JS thread is.
 *
 * Note: this is the *JS* frame rate, not the native UI thread frame rate. With
 * the New Architecture + Reanimated, the UI thread can keep rendering at 60fps
 * even while this meter reads 0 (see UiThreadHeartbeat).
 */
const FpsMeter = ({ label = 'JS thread FPS' }: { label?: string }) => {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(Date.now());
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      frames.current += 1;
      const now = Date.now();
      const elapsed = now - last.current;
      if (elapsed >= 500) {
        setFps(Math.round((frames.current * 1000) / elapsed));
        frames.current = 0;
        last.current = now;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current != null) {
        cancelAnimationFrame(raf.current);
      }
    };
  }, []);

  const color = fps >= 50 ? '#2e7d32' : fps >= 30 ? '#f9a825' : '#c62828';

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{fps}</Text>
    </View>
  );
};

export default FpsMeter;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  label: { color: '#bbb', fontSize: 13 },
  value: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
