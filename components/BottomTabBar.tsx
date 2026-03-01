import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, Compass, Plus, Map } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <View style={styles.container}>
      <TabButton label="Home" icon={Home} active={pathname === '/dashboard'} onPress={() => router.replace('/dashboard')} />
      <TabButton label="Explore" icon={Compass} active={pathname === '/explore'} onPress={() => router.replace('/explore')} />
      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-trip')} activeOpacity={0.85}>
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
      <TabButton label="My Trips" icon={Map} active={pathname === '/my-trips'} onPress={() => router.replace('/my-trips')} />
      <View style={styles.spacer} />
    </View>
  );
}

function TabButton({ label, icon: Icon, active, onPress }: { label: string; icon: any; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.7}>
      <Icon size={22} color={active ? Colors.orange : Colors.textMuted} strokeWidth={active ? 2.5 : 1.8} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const },
  tabLabelActive: { color: Colors.orange, fontWeight: '700' as const },
  createBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  spacer: { flex: 1 },
});
