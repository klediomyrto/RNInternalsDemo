/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Pressable,
  View,
  ScrollView,
  Text,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import MemoryLeakScreen from './src/screens/MemoryLeakScreen';
import FlatListScreen from './src/screens/FlatListScreen';
import ConcurrentScreen from './src/screens/ConcurrentScreen';

type RouteKey = 'home' | 'memory' | 'flatlist' | 'concurrent';

const ROUTES: {
  key: RouteKey;
  title: string;
  subtitle: string;
  Component?: React.ComponentType;
}[] = [
  {
    key: 'memory',
    title: 'Memory Leaks',
    subtitle: 'Stale closures, timers & subscriptions not cleaned up',
    Component: MemoryLeakScreen,
  },
  {
    key: 'flatlist',
    title: 'List Virtualization',
    subtitle: 'ScrollView vs naive vs optimized FlatList',
    Component: FlatListScreen,
  },
  {
    key: 'concurrent',
    title: 'Concurrent Rendering',
    subtitle: 'useDeferredValue / useTransition under load',
    Component: ConcurrentScreen,
  },
];

const Home = ({ onNavigate }: { onNavigate: (k: RouteKey) => void }) => {
  return (
    <ScrollView contentContainerStyle={styles.homeContent}>
      <Text style={styles.kicker}>React Native Platform Internals</Text>
      <Text style={styles.h1}>Profiling & Architecture Demos</Text>
      <Text style={styles.intro}>
        Hands-on demos for React Native's rendering pipeline, JS engine, and
        native module system. Explore how JSI, Fabric, TurboModules, and
        Reanimated worklets actually behave at runtime.
      </Text>
      {ROUTES.map(r => (
        <Pressable
          key={r.key}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          onPress={() => onNavigate(r.key)}
        >
          <Text style={styles.tileTitle}>{r.title}</Text>
          <Text style={styles.tileSub}>{r.subtitle}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

function App() {
  const [route, setRoute] = useState<RouteKey>('home');
  const active = ROUTES.find(r => r.key === route);
  const Screen = active?.Component;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        {route !== 'home' && (
          <View style={styles.header}>
            <Pressable onPress={() => setRoute('home')} hitSlop={12}>
              <Text style={styles.back}>‹ Back</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{active?.title}</Text>
            <View style={{ width: 48 }} />
          </View>
        )}
        <View style={styles.body}>
          {route === 'home' || !Screen ? (
            <Home onNavigate={setRoute} />
          ) : (
            <Screen />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  body: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  back: { color: '#7c9cff', fontSize: 16, width: 60 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  homeContent: { padding: 20, paddingBottom: 48 },
  kicker: {
    color: '#7c4dff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 },
  intro: { color: '#aaa', fontSize: 14, lineHeight: 21, marginVertical: 14 },
  tile: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  tilePressed: { backgroundColor: '#202020', borderColor: '#3949ab' },
  tileTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  tileSub: { color: '#999', fontSize: 13, marginTop: 4, lineHeight: 18 },
});

export default App;
