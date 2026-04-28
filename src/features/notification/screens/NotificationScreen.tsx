import AppHeader from '@/components/base/AppHeader';
import AppIcon from '@/components/base/AppIcon';
import { GlobalContext } from '@/contexts/GlobalContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { NotificationCategory } from '@/features/notification/types/notification.type';
import { normalize } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationItem } from '../components/NotificationItem';
import { useNotificationService } from '../hooks/useNotificationService';

// ──────────────────────────── Component ────────────────────────────
export default function NotificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { appInfo } = useContext(GlobalContext);
  const { colors: themeColors, isDark } = useAppTheme();
  const colorScheme = isDark ? 'dark' : 'light';

  const {
    activeTab,
    setActiveTab,
    items,
    loading,
    refreshing,
    refresh,
    loadMore,
    markReadAll,
    unreadSystemCount,
    unreadPromotionCount,
    unreadBalanceCount,
  } = useNotificationService(appInfo?.user_code || '');

  const [searchQuery, setSearchQuery] = useState('');

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      item.title?.toLowerCase().includes(query) ||
      item.message?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const unreadCounts = {
    SYSTEM: unreadSystemCount,
    PROMOTION: unreadPromotionCount,
    BALANCE: unreadBalanceCount,
  };

  const totalUnread = unreadSystemCount + unreadPromotionCount + unreadBalanceCount;

  // Tab definitions
  const tabList = [
    { key: 'SYSTEM' as NotificationCategory, label: t('notification.tabs.all'), icon: 'settings-outline' as const },
    { key: 'PROMOTION' as NotificationCategory, label: t('notification.tabs.promotion'), icon: 'gift-outline' as const },
    { key: 'BALANCE' as NotificationCategory, label: t('notification.tabs.balance'), icon: 'wallet-outline' as const },
  ];

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);


  // ── Render Empty State ──
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrapper, { backgroundColor: colorScheme === 'dark' ? '#1A2337' : '#F0F2FF' }]}>
        <Ionicons name="notifications-off-outline" size={56} color={colorScheme === 'dark' ? '#5D6470' : '#C5CAE9'} />
      </View>
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        {searchQuery ? t('notification.no_results') : t('notification.empty_title')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.brandTextSecondary }]}>
        {searchQuery
          ? t('notification.no_match_query', { query: searchQuery })
          : t('notification.empty_subtitle')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { paddingTop: insets.top, backgroundColor: themeColors.background },
      ]}
    >
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <AppHeader
        title={t('notification.title')}
        rightComponent={
          <TouchableOpacity
            onPress={markReadAll}
            style={[styles.headerButton, { backgroundColor: colorScheme === 'dark' ? '#2A3347' : '#F5F6FA' }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon name="check-double" size={22} color={themeColors.tint} />
          </TouchableOpacity>
        }
      />

      {/* ── Total unread badge ── */}
      {totalUnread > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: colorScheme === 'dark' ? '#1A2337' : '#EBF4FF', borderBottomColor: colorScheme === 'dark' ? '#2A3347' : '#D0E3FF' }]}>
          <Ionicons name="mail-unread-outline" size={18} color={themeColors.tint} />
          <Text style={[styles.unreadBannerText, { color: themeColors.tint }]}>
            {t('notification.unread_count', { count: totalUnread })}
          </Text>
        </View>
      )}

      {/* ── Tabs ── */}
      <View style={[styles.tabContainer, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
        {tabList.map(({ key, label, icon }) => {
          const isActive = activeTab === key;
          const badgeCount = unreadCounts[key];
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={[
                styles.tab,
                { backgroundColor: colorScheme === 'dark' ? '#2A3347' : '#F5F6FA' },
                isActive && styles.tabActive
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icon}
                size={16}
                color={isActive ? '#fff' : themeColors.brandTextSecondary}
                style={{ marginRight: 5 }}
              />
              <Text style={[
                styles.tabText,
                { color: themeColors.brandTextSecondary },
                isActive && styles.tabTextActive
              ]}>
                {label}
              </Text>
              {badgeCount > 0 && (
                <View style={[styles.badge, isActive && styles.badgeActive]}>
                  <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                    {badgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Search ── */}
      <View style={[styles.searchContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Ionicons name="search" size={18} color={themeColors.brandTextSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder={t('notification.search_placeholder')}
          placeholderTextColor={themeColors.brandTextSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={themeColors.brandTextSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Notification List ── */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            item={item}
            onPress={() => {
              // Individual mark as read not yet implemented in repo
              // But we can navigate if needed
            }}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.tint}
          />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredItems.length === 0 ? { flex: 1 } : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ──────────────────────────── Styles ────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  headerButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Unread Banner ──
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  unreadBannerText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },

  // ── Tabs ──
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: '#fff',
  },

  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    fontWeight: '500',
  },

  // ── Empty State ──
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});

