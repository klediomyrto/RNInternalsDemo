import React, {useCallback, useMemo, useState} from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Card, Segmented, Stat} from '../components/ui';
import FpsMeter from '../components/FpsMeter';
import { expensiveFormat } from '../components/work';

/**
 * LIST VIRTUALIZATION DEMO
 * ------------------------
 * Three modes render the SAME 5,000 rows:
 *   - scrollview : ScrollView + .map  -> mounts ALL 5,000 rows up front.
 *   - naive      : FlatList but with the common anti-patterns (inline render
 *                  fn, no keyExtractor, no getItemLayout, no memo, heavy item).
 *   - optimized  : FlatList done right (memoized row, keyExtractor,
 *                  getItemLayout, windowSize / initialNumToRender tuned).
 *
 * Watch the JS FPS meter while scrolling, and the "mount ms" stat. ScrollView
 * mounts everything (slow first paint + high memory). Naive FlatList virtualizes
 * but re-renders too much and recomputes the heavy cell every frame. Optimized
 * stays smooth. Profile memory in Android Studio / Instruments to see the
 * ScrollView retain ~5,000 view nodes vs a couple dozen for FlatList.
 */

const DATA = Array.from({length: 5000}, (_, i) => ({
  id: String(i),
  title: `Item #${i}`,
}));

const ROW_HEIGHT = 64;

// A row whose render is intentionally non-trivial.
function HeavyRowImpl({title, index}: {title: string; index: number}) {
  const hash = expensiveFormat(index);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, {backgroundColor: `#${hash.slice(0, 6)}`}]} />
      <View>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>hash {hash}</Text>
      </View>
    </View>
  );
}
// Memoized version: only re-renders when its props change.
const HeavyRow = React.memo(HeavyRowImpl);

type Mode = 'scrollview' | 'naive' | 'optimized';

export default function FlatListScreen() {
  const [mode, setMode] = useState<Mode>('scrollview');
  const [mountMs, setMountMs] = useState(0);
  const [renderKey, setRenderKey] = useState(0);

  // Measure how long it takes to build the list element tree for this mode.
  const remount = useCallback((m: Mode) => {
    const t0 = Date.now();
    setMode(m);
    setRenderKey(k => k + 1);
    // measured after this tick paints
    requestAnimationFrame(() => setMountMs(Date.now() - t0));
  }, []);

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<{id: string; title: string}>) => (
      <HeavyRow title={item.title} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback((it: {id: string}) => it.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  const list = useMemo(() => {
    if (mode === 'scrollview') {
      // ANTI-PATTERN: every row is mounted immediately.
      return (
        <ScrollView removeClippedSubviews={false}>
          {DATA.map((item, index) => (
            <HeavyRowImpl key={item.id} title={item.title} index={index} />
          ))}
        </ScrollView>
      );
    }
    if (mode === 'naive') {
      // Virtualized, but with everything that defeats the optimizations:
      return (
        <FlatList
          key={`naive-${renderKey}`}
          data={DATA}
          // inline arrow render fn -> new identity every render
          renderItem={({item, index}) => (
            <HeavyRowImpl title={item.title} index={index} />
          )}
          // no keyExtractor (falls back to index, hurts reconciliation)
          // no getItemLayout (RN must measure every row)
        />
      );
    }
    // optimized
    return (
      <FlatList
        key={`opt-${renderKey}`}
        data={DATA}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    );
  }, [mode, renderKey, renderItem, keyExtractor, getItemLayout]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.controls}
        contentContainerStyle={{padding: 16}}>
        <Card>
          <Text style={styles.p}>
            All three render the same 5,000 heavy rows. Scroll fast and watch JS
            FPS; compare first-paint time. ScrollView mounts every
            row (slow + memory-heavy); naive virtualizes but
            re-renders too much; optimized is smooth.
          </Text>
        </Card>
        <Segmented
          value={mode}
          onChange={remount}
          options={[
            {label: 'ScrollView', value: 'scrollview'},
            {label: 'Naive', value: 'naive'},
            {label: 'Optimized', value: 'optimized'},
          ]}
        />
        <View style={styles.statsRow}>
          <Stat label="first paint (ms)" value={mountMs} />
          <Stat label="rows" value={DATA.length} />
        </View>
        <FpsMeter />
      </ScrollView>
      <View style={styles.listArea}>{list}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  controls: {flexGrow: 0},
  listArea: {flex: 1, backgroundColor: '#0d0d0d'},
  p: {color: '#ddd', fontSize: 13, lineHeight: 20},
  statsRow: {flexDirection: 'row', marginBottom: 10},
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  dot: {width: 28, height: 28, borderRadius: 14, marginRight: 14},
  rowTitle: {color: '#fff', fontSize: 15, fontWeight: '600'},
  rowSub: {color: '#888', fontSize: 12},
});
