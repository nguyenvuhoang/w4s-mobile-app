import { NotificationCategory, NotificationItemModel } from '@/features/notification/types/notification.type';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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

// ──────────────────────────── Mock Data ────────────────────────────
const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

const MOCK_NOTIFICATIONS: NotificationItemModel[] = [
  // ── SYSTEM ──
  {
    id: 'sys-1',
    title: 'Cập nhật ứng dụng v2.5.0',
    message: 'Phiên bản mới đã sẵn sàng với nhiều tính năng hấp dẫn. Cập nhật ngay để trải nghiệm!',
    datetime: minutesAgo(5),
    isRead: false,
    category: 'SYSTEM',
  },
  {
    id: 'sys-2',
    title: 'Bảo mật tài khoản',
    message: 'Bạn đã đăng nhập thành công trên thiết bị mới. Nếu không phải bạn, vui lòng đổi mật khẩu ngay.',
    datetime: minutesAgo(30),
    isRead: false,
    category: 'SYSTEM',
  },
  {
    id: 'sys-3',
    title: 'Xác minh danh tính',
    message: 'Tài khoản của bạn đã được xác minh thành công. Giờ bạn có thể sử dụng đầy đủ tính năng.',
    datetime: hoursAgo(2),
    isRead: true,
    category: 'SYSTEM',
  },
  {
    id: 'sys-4',
    title: 'Bảo trì hệ thống',
    message: 'Hệ thống sẽ bảo trì từ 00:00 - 04:00 ngày 12/02. Xin lỗi vì sự bất tiện.',
    datetime: hoursAgo(6),
    isRead: true,
    category: 'SYSTEM',
  },
  {
    id: 'sys-5',
    title: 'Liên kết tài khoản ngân hàng',
    message: 'Bạn đã liên kết thành công tài khoản VCB ****1234.',
    datetime: daysAgo(1),
    isRead: true,
    category: 'SYSTEM',
  },
  {
    id: 'sys-6',
    title: 'Thay đổi mật khẩu',
    message: 'Mật khẩu của bạn đã được thay đổi thành công vào lúc 14:30.',
    datetime: daysAgo(3),
    isRead: true,
    category: 'SYSTEM',
  },

  // ── PROMOTION ──
  {
    id: 'promo-1',
    title: '🎉 Giảm 50% phí chuyển tiền',
    message: 'Ưu đãi đặc biệt dành riêng cho bạn! Giảm 50% phí chuyển tiền đến hết 28/02.',
    datetime: minutesAgo(15),
    isRead: false,
    category: 'PROMOTION',
  },
  {
    id: 'promo-2',
    title: '🎁 Cashback 100K cho giao dịch đầu tiên',
    message: 'Thực hiện giao dịch đầu tiên trong tháng và nhận ngay 100.000đ vào ví.',
    datetime: hoursAgo(3),
    isRead: false,
    category: 'PROMOTION',
  },
  {
    id: 'promo-3',
    title: '💰 Tích điểm x2 cuối tuần',
    message: 'Tất cả giao dịch cuối tuần sẽ được nhân đôi điểm thưởng. Áp dụng đến hết tháng 2.',
    datetime: hoursAgo(12),
    isRead: true,
    category: 'PROMOTION',
  },
  {
    id: 'promo-4',
    title: '🏷️ Mã giảm giá SAVE20',
    message: 'Nhập mã SAVE20 để giảm 20% phí dịch vụ cho 5 giao dịch tiếp theo.',
    datetime: daysAgo(2),
    isRead: true,
    category: 'PROMOTION',
  },
  {
    id: 'promo-5',
    title: '🌟 Giới thiệu bạn bè - Nhận thưởng',
    message: 'Giới thiệu bạn bè sử dụng ứng dụng và nhận 50.000đ cho mỗi lượt đăng ký thành công.',
    datetime: daysAgo(5),
    isRead: true,
    category: 'PROMOTION',
  },

  // ── BALANCE ──
  {
    id: 'bal-1',
    title: 'Nhận tiền thành công',
    message: 'Bạn vừa nhận được 5.000.000đ từ NGUYEN VAN A - VCB.',
    datetime: minutesAgo(10),
    isRead: false,
    category: 'BALANCE',
  },
  {
    id: 'bal-2',
    title: 'Thanh toán hóa đơn điện',
    message: 'Thanh toán 850.000đ cho hóa đơn điện tháng 01/2026 - EVN HCM.',
    datetime: hoursAgo(1),
    isRead: false,
    category: 'BALANCE',
  },
  {
    id: 'bal-3',
    title: 'Chuyển tiền thành công',
    message: 'Bạn đã chuyển 2.000.000đ đến TRAN THI B - MB Bank.',
    datetime: hoursAgo(4),
    isRead: true,
    category: 'BALANCE',
  },
  {
    id: 'bal-4',
    title: 'Nạp tiền ví',
    message: 'Nạp thành công 1.000.000đ vào ví từ tài khoản VCB ****1234.',
    datetime: daysAgo(1),
    isRead: true,
    category: 'BALANCE',
  },
  {
    id: 'bal-5',
    title: 'Thanh toán QR thành công',
    message: 'Thanh toán 125.000đ tại Circle K - 123 Nguyễn Huệ, Q1.',
    datetime: daysAgo(2),
    isRead: true,
    category: 'BALANCE',
  },
  {
    id: 'bal-6',
    title: 'Rút tiền ATM',
    message: 'Rút 3.000.000đ tại ATM VCB - Chi nhánh Bến Thành.',
    datetime: daysAgo(4),
    isRead: true,
    category: 'BALANCE',
  },
];

// ──────────────────────────── Component ────────────────────────────
export default function NotificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<NotificationCategory>('SYSTEM');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  // Filter by tab + search
  const filteredItems = useMemo(() => {
    return notifications.filter((item) => {
      if (item.category !== activeTab) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.title?.toLowerCase().includes(query) ||
        item.message?.toLowerCase().includes(query)
      );
    });
  }, [notifications, activeTab, searchQuery]);

  // Unread counts
  const unreadCounts = useMemo(() => {
    const counts = { SYSTEM: 0, PROMOTION: 0, BALANCE: 0 };
    notifications.forEach((item) => {
      if (!item.isRead) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return counts;
  }, [notifications]);

  const totalUnread = unreadCounts.SYSTEM + unreadCounts.PROMOTION + unreadCounts.BALANCE;

  // Tab definitions
  const tabList = [
    { key: 'SYSTEM' as NotificationCategory, label: 'Thông báo', icon: 'settings-outline' as const },
    { key: 'PROMOTION' as NotificationCategory, label: 'Khuyến mãi', icon: 'gift-outline' as const },
    { key: 'BALANCE' as NotificationCategory, label: 'Biến động số dư', icon: 'wallet-outline' as const },
  ];

  // Mark item as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  }, []);

  // Mark all as read for current tab
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.category === activeTab ? { ...item, isRead: true } : item
      )
    );
  }, [activeTab]);

  // Pull to refresh (simulate)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // ── Render Empty State ──
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="notifications-off-outline" size={56} color="#C5CAE9" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có thông báo'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `Không có thông báo nào khớp với "${searchQuery}"`
          : 'Các thông báo mới sẽ xuất hiện tại đây'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { paddingTop: insets.top },
      ]}
    >
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thông báo</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={markAllAsRead}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="checkmark-done" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* ── Total unread badge ── */}
      {totalUnread > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="mail-unread-outline" size={18} color="#007AFF" />
          <Text style={styles.unreadBannerText}>
            Bạn có {totalUnread} thông báo chưa đọc
          </Text>
        </View>
      )}

      {/* ── Tabs ── */}
      <View style={styles.tabContainer}>
        {tabList.map(({ key, label, icon }) => {
          const isActive = activeTab === key;
          const badgeCount = unreadCounts[key];
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={[styles.tab, isActive && styles.tabActive]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icon}
                size={16}
                color={isActive ? '#fff' : '#666'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm thông báo..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
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
            onPress={() => markAsRead(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
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
    backgroundColor: '#FAFBFE',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },

  // ── Unread Banner ──
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EBF4FF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#D0E3FF',
  },
  unreadBannerText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },

  // ── Tabs ──
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
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
    backgroundColor: '#F5F6FA',
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
    color: '#666',
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
    marginLeft: 5,
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#fff',
  },

  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },

  // ── Empty State ──
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});