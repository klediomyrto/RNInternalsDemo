import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';

export const Card = ({
  title,
  children,
  tone = 'neutral',
}: {
  title?: string;
  children: React.ReactNode;
  tone?: 'neutral' | 'bad' | 'good';
}) => {
  const border =
    tone === 'bad' ? '#c62828' : tone === 'good' ? '#2e7d32' : '#333';
  return (
    <View style={[styles.card, { borderColor: border }]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
};

export const Segmented = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) => {
  return (
    <View style={styles.segmented}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text
              style={[styles.segmentText, active && styles.segmentTextActive]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const Stat = ({label, value}: {label: string; value: string | number}) => {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export const Btn = ({
  label,
  onPress,
  tone = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'danger' | 'muted';
  style?: ViewStyle;
}) => {
  const bg =
    tone === 'danger' ? '#c62828' : tone === 'muted' ? '#37474f' : '#3949ab';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#1a1a1a',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 4,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 7,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: '#3949ab' },
  segmentText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: { color: '#999', fontSize: 11, marginTop: 2, textAlign: 'center' },
  mono: {
    color: '#9ccc65',
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 18,
  },
});
