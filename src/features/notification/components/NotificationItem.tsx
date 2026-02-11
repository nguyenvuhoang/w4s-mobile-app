import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NotificationItemModel } from '../types/notification.type';

const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'SYSTEM':
      return { icon: 'settings-outline' as const, color: '#007AFF', bgColor: '#E3F2FD' };
    case 'PROMOTION':
      return { icon: 'gift-outline' as const, color: '#FF9800', bgColor: '#FFF3E0' };
    case 'BALANCE':
      return { icon: 'wallet-outline' as const, color: '#4CAF50', bgColor: '#E8F5E9' };
    default:
      return { icon: 'notifications-outline' as const, color: '#9E9E9E', bgColor: '#F5F5F5' };
  }
};

const formatTimeAgo = (datetime: string): string => {
  const now = new Date();
  const date = new Date(datetime);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const NotificationItem = ({
  item,
  onPress,
}: {
  item: NotificationItemModel;
  onPress?: () => void;
}) => {
  const categoryStyle = getCategoryStyle(item.category);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !item.isRead && styles.unreadContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Unread dot indicator */}
      {!item.isRead && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View style={[styles.iconWrapper, { backgroundColor: categoryStyle.bgColor }]}>
        <Ionicons name={categoryStyle.icon} size={22} color={categoryStyle.color} />
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.title, !item.isRead && styles.unreadTitle]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.time}>{formatTimeAgo(item.datetime)}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
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
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  unreadContainer: {
    backgroundColor: '#F0F7FF',
  },
  unreadDot: {
    position: 'absolute',
    left: 6,
    top: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
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
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#111',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  message: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
