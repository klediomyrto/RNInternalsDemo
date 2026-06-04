import React, {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card, Segmented, Stat } from '../components/ui';
import FpsMeter from '../components/FpsMeter';
import { expensiveFormat } from '../components/work';

/**
 * CONCURRENT RENDERING DEMO (React 18/19 in RN)
 * ---------------------------------------------
 * A text box filters 8,000 items. Filtering + rendering the result is made
 * deliberately expensive. Two modes:
 *
 *   blocking : the filtered list is derived directly from the input value. Every
 *              keystroke synchronously re-filters and re-renders, so typing
 *              janks — the TextInput itself lags.
 *   deferred : we feed the filter through useDeferredValue (and mark the heavy
 *              update with useTransition). React keeps the input update urgent
 *              and renders the big list at lower priority, interrupting/restarting
 *              it as you keep typing. The input stays responsive; isPending shows
 *              the list catching up.
 *
 * Type fast in each mode and watch the input + JS FPS. This is what
 * startTransition / useDeferredValue actually buy you: priority, not speed.
 */

const ITEMS = Array.from(
  { length: 8000 },
  (_, i) => `Item ${i} ${expensiveFormat(i)}`,
);

const ResultList = ({ query }: { query: string }) => {
  // Intentionally heavy derive so the difference is visible.
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const out: string[] = [];
    for (let i = 0; i < ITEMS.length; i++) {
      // extra busywork per item to amplify the cost
      const tag = expensiveFormat(i + query.length);
      if (ITEMS[i].toLowerCase().includes(q) || tag === '00000') {
        out.push(ITEMS[i]);
      }
    }
    return out;
  }, [query]);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item, i) => `${i}-${item}`}
      initialNumToRender={15}
      renderItem={({ item }) => <Text style={styles.row}>{item}</Text>}
      ListHeaderComponent={
        <Text style={styles.count}>{filtered.length} matches</Text>
      }
    />
  );
};

const ConcurrentScreen = () => {
  const [mode, setMode] = useState<'blocking' | 'deferred'>('blocking');
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();

  // deferred copy of the query; lags behind `text` under load
  const deferred = useDeferredValue(text);
  const queryForList = mode === 'deferred' ? deferred : text;
  const stale = mode === 'deferred' && deferred !== text;

  const onChange = (v: string) => {
    if (mode === 'deferred') {
      // input update is urgent; let React schedule the rest as a transition
      setText(v);
      startTransition(() => {
        // no-op state bump just to demonstrate transition pending flag
        // (the heavy work is driven by the deferred value below)
      });
    } else {
      setText(v);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.controls}
        contentContainerStyle={{ padding: 16 }}
      >
        <Card>
          <Text style={styles.p}>
            Type quickly. In blocking mode the TextInput stutters because each
            keystroke re-filters 8,000 items synchronously. In deferred mode the
            input stays smooth and the list lags behind, rendered at lower
            priority.
          </Text>
        </Card>
        <Segmented
          value={mode}
          onChange={v => setMode(v)}
          options={[
            { label: 'Blocking', value: 'blocking' },
            { label: 'Deferred', value: 'deferred' },
          ]}
        />
        <TextInput
          value={text}
          onChangeText={onChange}
          placeholder="Filter… (try typing fast)"
          placeholderTextColor="#777"
          style={styles.input}
        />
        <View style={styles.statsRow}>
          <Stat label="mode" value={mode} />
          <Stat
            label="list state"
            value={stale || isPending ? 'updating…' : 'current'}
          />
        </View>
        <FpsMeter />
      </ScrollView>
      <View style={[styles.listArea, (stale || isPending) && styles.dim]}>
        <ResultList query={queryForList} />
      </View>
    </View>
  );
};

export default ConcurrentScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  controls: { flexGrow: 0 },
  listArea: { flex: 1, backgroundColor: '#0d0d0d' },
  dim: { opacity: 0.55 },
  p: { color: '#ddd', fontSize: 13, lineHeight: 20 },
  input: {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  statsRow: { flexDirection: 'row', marginBottom: 10 },
  row: {
    color: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
  },
  count: { color: '#9ccc65', padding: 12, fontSize: 12 },
});
