import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NotificationItemModel } from '../types/notification.type';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { useTranslation } from 'react-i18next';

const getCategoryStyle = (category: string, isDark: boolean) => {
  switch (category) {
    case 'SYSTEM':
      return { 
        icon: 'settings-outline' as const, 
        color: '#007AFF', 
        bgColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E3F2FD' 
      };
    case 'PROMOTION':
      return { 
        icon: 'gift-outline' as const, 
        color: '#FF9800', 
        bgColor: isDark ? 'rgba(255, 152, 0, 0.15)' : '#FFF3E0' 
      };
    case 'BALANCE':
      return { 
        icon: 'wallet-outline' as const, 
        color: '#4CAF50', 
        bgColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' 
      };
    default:
      return { 
        icon: 'notifications-outline' as const, 
        color: '#9E9E9E', 
        bgColor: isDark ? 'rgba(158, 158, 158, 0.15)' : '#F5F5F5' 
      };
  }
};

export const NotificationItem = ({
  item,
  onPress,
}: {
  item: NotificationItemModel;
  onPress?: () => void;
}) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useAppTheme();
  const categoryStyle = getCategoryStyle(item.category, isDark);

  const formatTimeAgo = (datetime: string): string => {
    const now = new Date();
    const date = new Date(datetime);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return t('notification.time.just_now');
    if (diffMinutes < 60) return t('notification.time.minutes_ago', { count: diffMinutes });
    if (diffHours < 24) return t('notification.time.hours_ago', { count: diffHours });
    if (diffDays < 7) return t('notification.time.days_ago', { count: diffDays });

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: themeColors.card, borderBottomColor: themeColors.border },
        !item.isRead && { backgroundColor: isDark ? '#1E293B' : '#F0F7FF' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Unread dot indicator */}
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: themeColors.tint }]} />}

      {/* Icon */}
      <View style={[styles.iconWrapper, { backgroundColor: categoryStyle.bgColor }]}>
        <Ionicons name={categoryStyle.icon} size={22} color={categoryStyle.color} />
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title, 
              { color: isDark ? '#E2E8F0' : '#333' },
              !item.isRead && { fontWeight: '700', color: themeColors.text }
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.time, { color: themeColors.brandTextSecondary }]}>{formatTimeAgo(item.datetime)}</Text>
        </View>
        <Text style={[styles.message, { color: themeColors.brandTextSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    left: 6,
    top: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});

