import { NotificationList } from '@/features/notification/components/NotificationList';
import { useNotificationService } from '@/features/notification/hooks/useNotificationService';
import { NotificationCategory } from '@/features/notification/types/notification.type';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/components/base/CustomButton';
import LoadingIndicator from '@/components/loading/LoadingIndicator';
import { GlobalContext } from '@/contexts/GlobalContext';

export default function NotificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appInfo } = useContext(GlobalContext);

  const userCode = appInfo?.user_code || '';
  const {
    activeTab,
    setActiveTab,
    items,
    loading,
    loadingMore,
    refreshing,
    refresh,
    loadMore,
    markReadAll,
    unreadSystemCount,
    unreadPromotionCount,
    unreadBalanceCount,
  } = useNotificationService(userCode);

  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoBox, setShowInfoBox] = useState(true);

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.message?.toLowerCase().includes(query)
    );
  });

  const tabList = [
    {
      key: 'SYSTEM' as NotificationCategory,
      label: t('notification.notification'),
      badge: unreadSystemCount,
    },
    {
      key: 'PROMOTION' as NotificationCategory,
      label: t('notification.promotion'),
      badge: unreadPromotionCount,
    },
    {
      key: 'BALANCE' as NotificationCategory,
      label: t('notification.balanceAlert'),
      badge: unreadBalanceCount,
    },
  ];

  const renderContent = () => {
    // Balance tab - require login
    if (activeTab === 'BALANCE' && !appInfo?.is_login) {
      return (
        <View style={styles.container}>
          <View style={styles.balanceContainer}>
            <FontAwesome6 name="lock-closed-outline" size={48} color="#999" />
            <Text style={styles.balanceTitle}>
              {t('notification.viewbalancechange')}
            </Text>
            <Text style={styles.balanceDescription}>
              {t('notification.toensuresafety')}
            </Text>
          </View>
          <CustomButton
            title={t('login.login')}
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginButton}
          />
        </View>
      );
    }

    // Empty state
    if (filteredItems.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Image
            source={require('@assets/images/empty-list.png')}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>
            {searchQuery
              ? t('notification.noSearchResults')
              : t('notification.noNotifications')}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <NotificationList
          data={filteredItems}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          paddingTop: Platform.OS === 'ios' ? insets.top : 0,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome6 name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notification.title')}</Text>
        <TouchableOpacity onPress={markReadAll}>
          <FontAwesome6 name="checkmark-done" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabList.map(({ key, label, badge }) => {
            const isActive = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveTab(key)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {label}
                </Text>
                {badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search */}
      {activeTab !== 'BALANCE' && (
        <View style={styles.searchContainer}>
          <FontAwesome6 name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('notification.search')}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Info Box */}
      {activeTab !== 'BALANCE' && showInfoBox && (
        <View style={styles.infoBox}>
          <FontAwesome6 name="information-circle-outline" size={24} color="green" />
          <Text style={styles.infoText}>{t('notification.info')}</Text>
          <TouchableOpacity onPress={() => setShowInfoBox(false)}>
            <FontAwesome6 name="close" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {loading && !refreshing ? <LoadingIndicator /> : renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#000',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#2e7d32',
  },
  content: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  balanceDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});