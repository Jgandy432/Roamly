import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Zap, Sun, Mountain, Music, Utensils, Waves, TrendingUp } from 'lucide-react-native';
import { useTrips } from '@/context/TripContext';
import { Colors } from '@/constants/colors';
import { POPULAR_DESTINATIONS } from '@/constants/data';
import BottomTabBar from '@/components/BottomTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

const VIBE_CATEGORIES = [
  { id: 'all', label: 'All', icon: Zap },
  { id: 'beach', label: 'Beach', icon: Waves },
  { id: 'mountain', label: 'Mountains', icon: Mountain },
  { id: 'city', label: 'City', icon: TrendingUp },
  { id: 'food', label: 'Food & Drink', icon: Utensils },
  { id: 'music', label: 'Festivals', icon: Music },
  { id: 'sun', label: 'Tropical', icon: Sun },
];

const FEATURED_DESTINATIONS = [
  { id: '1', name: 'Tulum, Mexico', tagline: 'Jungle meets Caribbean sea', emoji: '🌴', tag: '🔥 Trending', tagColor: Colors.orange, budget: '$900–1,400', vibe: ['beach', 'city'], bgColor: '#2d6a4f' },
  { id: '2', name: 'Tokyo, Japan', tagline: 'Neon lights & hidden ramen bars', emoji: '🏯', tag: '⭐ Staff Pick', tagColor: Colors.amber, budget: '$1,200–2,000', vibe: ['city', 'food'], bgColor: '#6d28d9' },
  { id: '3', name: 'Santorini, Greece', tagline: 'Sunsets worth every penny', emoji: '🫐', tag: '💎 Premium', tagColor: Colors.emerald, budget: '$1,500–2,800', vibe: ['beach', 'sun'], bgColor: '#2563eb' },
  { id: '4', name: 'Nashville, TN', tagline: 'Live music & hot chicken nights', emoji: '🎸', tag: '🎉 Party Approved', tagColor: '#9333ea', budget: '$600–1,000', vibe: ['music', 'food', 'city'], bgColor: '#b45309' },
  { id: '5', name: 'Banff, Canada', tagline: 'Turquoise lakes & peak views', emoji: '🏔️', tag: '🌿 Nature Escape', tagColor: Colors.emerald, budget: '$800–1,400', vibe: ['mountain'], bgColor: '#0369a1' },
  { id: '6', name: 'Bali, Indonesia', tagline: 'Temple rice fields & rooftop pools', emoji: '🌺', tag: '✨ Vibe Check', tagColor: Colors.orange, budget: '$700–1,200', vibe: ['beach', 'sun'], bgColor: '#15803d' },
];

const TRENDING_SEARCHES = ['Girls trip 🌸', 'Bach party 🥂', 'Ski weekend ⛷️', 'Europe summer 🇪🇺', 'All-inclusive 🍹', 'Road trip 🚗'];

const QUICK_INSPIRE = [
  { emoji: '🎰', label: 'Vegas energy', dest: 'Las Vegas, USA' },
  { emoji: '🥐', label: 'Euro charm', dest: 'Paris, France' },
  { emoji: '🌊', label: 'Island escape', dest: 'Maldives' },
  { emoji: '🌮', label: 'Food & culture', dest: 'Mexico City, Mexico' },
  { emoji: '🍣', label: 'Asia adventure', dest: 'Seoul, South Korea' },
  { emoji: '🏜️', label: 'Desert vibes', dest: 'Dubai, UAE' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { currentUser } = useTrips();
  const [activeVibe, setActiveVibe] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');

  const filteredDestinations = FEATURED_DESTINATIONS.filter(d =>
    activeVibe === 'all' || d.vibe.includes(activeVibe)
  );

  const searchResults = searchText.length > 1
    ? POPULAR_DESTINATIONS.filter(d => d.toLowerCase().includes(searchText.toLowerCase())).slice(0, 6)
    : [];

  const handleDestinationPress = (destination: string) => {
    router.push({ pathname: '/create-trip', params: { destination } });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Explore</Text>
            <Text style={styles.headerSub}>Where's the group going?</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')}>
            <Text style={styles.avatarText}>{currentUser?.avatar ?? '?'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((dest) => (
              <TouchableOpacity key={dest} style={styles.searchResultItem} onPress={() => handleDestinationPress(dest)}>
                <Text style={styles.searchResultEmoji}>📍</Text>
                <Text style={styles.searchResultText}>{dest}</Text>
                <Text style={styles.searchResultArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vibeScroll}>
            {VIBE_CATEGORIES.map((vibe) => {
              const Icon = vibe.icon;
              const isActive = activeVibe === vibe.id;
              return (
                <TouchableOpacity key={vibe.id} style={[styles.vibeChip, isActive && styles.vibeChipActive]} onPress={() => setActiveVibe(vibe.id)} activeOpacity={0.7}>
                  <Icon size={13} color={isActive ? '#fff' : Colors.textMuted} />
                  <Text style={[styles.vibeLabel, isActive && styles.vibeLabelActive]}>{vibe.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>✈️  Featured Trips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll} decelerationRate="fast" snapToInterval={CARD_WIDTH + 14}>
            {filteredDestinations.map((dest) => (
              <TouchableOpacity key={dest.id} style={[styles.featuredCard, { width: CARD_WIDTH, backgroundColor: dest.bgColor }]} onPress={() => handleDestinationPress(dest.name)} activeOpacity={0.88}>
                <View style={styles.cardContent}>
                  <View style={[styles.cardTag, { borderColor: dest.tagColor + '60' }]}>
                    <Text style={[styles.cardTagText, { color: dest.tagColor }]}>{dest.tag}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardEmoji}>{dest.emoji}</Text>
                    <Text style={styles.cardName}>{dest.name}</Text>
                    <Text style={styles.cardTagline}>{dest.tagline}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardBudget}>~{dest.budget} / person</Text>
                      <View style={styles.cardCta}><Text style={styles.cardCtaText}>Plan it →</Text></View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>⚡  Quick Inspire</Text>
          <View style={styles.inspireGrid}>
            {QUICK_INSPIRE.map((item) => (
              <TouchableOpacity key={item.dest} style={styles.inspireCard} onPress={() => handleDestinationPress(item.dest)} activeOpacity={0.75}>
                <Text style={styles.inspireEmoji}>{item.emoji}</Text>
                <Text style={styles.inspireLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>🔍  Trending Searches</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
            {TRENDING_SEARCHES.map((term) => (
              <TouchableOpacity key={term} style={styles.trendingChip} onPress={() => setSearchText(term.split(' ')[0])} activeOpacity={0.7}>
                <Text style={styles.trendingText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>🌍  All Destinations</Text>
          <View style={styles.allDestGrid}>
            {POPULAR_DESTINATIONS.slice(0, 24).map((dest) => (
              <TouchableOpacity key={dest} style={styles.destPill} onPress={() => handleDestinationPress(dest)} activeOpacity={0.7}>
                <Text style={styles.destPillText}>{dest}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.orangeMuted, borderWidth: 2, borderColor: Colors.orange, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' as const, color: Colors.orange },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginTop: 14, marginBottom: 6, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  clearBtn: { fontSize: 13, color: Colors.textMuted, paddingHorizontal: 4 },
  searchResults: { marginHorizontal: 24, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 8, overflow: 'hidden' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  searchResultEmoji: { fontSize: 15 },
  searchResultText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: '500' as const },
  searchResultArrow: { fontSize: 14, color: Colors.orange },
  vibeScroll: { paddingHorizontal: 24, paddingVertical: 12, gap: 8 },
  vibeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  vibeChipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  vibeLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.textMuted },
  vibeLabelActive: { color: '#fff' },
  sectionTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  featuredScroll: { paddingHorizontal: 24, gap: 14, paddingBottom: 4 },
  featuredCard: { height: 240, borderRadius: 20, overflow: 'hidden' },
  cardContent: { flex: 1, padding: 18, justifyContent: 'space-between' },
  cardTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  cardEmoji: { fontSize: 32, marginBottom: 6 },
  cardName: { fontSize: 22, fontWeight: '800' as const, color: '#FFFFFF', letterSpacing: -0.3 },
  cardTagline: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBudget: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const },
  cardCta: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cardCtaText: { fontSize: 12, fontWeight: '700' as const, color: '#FFFFFF' },
  cardTagText: { fontSize: 11, fontWeight: '700' as const },
  inspireGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10, marginBottom: 8 },
  inspireCard: { width: (SCREEN_WIDTH - 48 - 20) / 3, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 6 },
  inspireEmoji: { fontSize: 26 },
  inspireLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary, textAlign: 'center' },
  trendingScroll: { paddingHorizontal: 24, gap: 8, paddingBottom: 4 },
  trendingChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50, backgroundColor: Colors.orangeMuted, borderWidth: 1, borderColor: Colors.borderOrange },
  trendingText: { fontSize: 13, fontWeight: '600' as const, color: Colors.orange },
  allDestGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 8 },
  destPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  destPillText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
});
