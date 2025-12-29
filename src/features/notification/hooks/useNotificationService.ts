import { notificationRepository } from '@/services/repositories/notification.repository';
import { useCallback, useEffect, useState } from 'react';
import {
  NotificationCategory,
  NotificationItemModel,
} from '../types/notification.type';

const PAGE_SIZE = 20;

export const useNotificationService = (userCode: string) => {
  const [activeTab, setActiveTab] = useState<NotificationCategory>('SYSTEM');
  const [systemItems, setSystemItems] = useState<NotificationItemModel[]>([]);
  const [promotionItems, setPromotionItems] = useState<NotificationItemModel[]>([]);
  const [balanceItems, setBalanceItems] = useState<NotificationItemModel[]>([]);
  
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [unreadSystemCount, setUnreadSystemCount] = useState(0);
  const [unreadPromotionCount, setUnreadPromotionCount] = useState(0);
  const [unreadBalanceCount, setUnreadBalanceCount] = useState(0);

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'SYSTEM':
        return systemItems;
      case 'PROMOTION':
        return promotionItems;
      case 'BALANCE':
        return balanceItems;
      default:
        return [];
    }
  };

  const setCurrentItems = (items: NotificationItemModel[], append = false) => {
    const newItems = append ? [...getCurrentItems(), ...items] : items;
    
    switch (activeTab) {
      case 'SYSTEM':
        setSystemItems(newItems);
        break;
      case 'PROMOTION':
        setPromotionItems(newItems);
        break;
      case 'BALANCE':
        setBalanceItems(newItems);
        break;
    }
  };

  const fetchData = useCallback(
    async (pageIndex: number, loadMore = false) => {
      if (loading || loadingMore) return;

      if (loadMore) {
        setLoadingMore(true);
      } else if (pageIndex === 0) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await notificationRepository.getNotifications(
          userCode,
          pageIndex,
          PAGE_SIZE
        );

        if (res.isSuccess()) {
          const apiItems = res.getValue<any[]>('items') ?? [];

          const mapped: NotificationItemModel[] = apiItems.map((i: any) => ({
            id: String(i.NotificationID || i.id),
            title: i.Description || i.title,
            message: i.Body || i.message,
            datetime: i.DateTime || i.datetime,
            isRead: i.IsRead === 1 || i.isread === true,
            category: activeTab,
            templateid: i.templateid,
            data: i.data,
          }));

          setCurrentItems(mapped, loadMore);
          setHasMore(mapped.length === PAGE_SIZE);
          setPage(pageIndex);

          // Update unread counts
          const unreadCount = mapped.filter((item) => !item.isRead).length;
          switch (activeTab) {
            case 'SYSTEM':
              setUnreadSystemCount(unreadCount);
              break;
            case 'PROMOTION':
              setUnreadPromotionCount(unreadCount);
              break;
            case 'BALANCE':
              setUnreadBalanceCount(unreadCount);
              break;
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [activeTab, userCode, loading, loadingMore]
  );

  useEffect(() => {
    fetchData(0);
  }, [activeTab]);

  const refresh = () => fetchData(0);
  const loadMore = () => hasMore && !loadingMore && fetchData(page + 1, true);

  const markReadAll = async () => {
    try {
      await notificationRepository.updateReadNotificationByCategory(userCode, activeTab);
      refresh();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    activeTab,
    setActiveTab,
    items: getCurrentItems(),
    loading,
    loadingMore,
    refreshing,
    refresh,
    loadMore,
    markReadAll,
    unreadSystemCount,
    unreadPromotionCount,
    unreadBalanceCount,
  };
};