import { AppConfig } from '@/config/AppConfig';
import { Category } from '@/services/repositories/category.repository';

interface WalletCacheEntry {
  categoryIds: number[];
  timestamp: number;
}

// Per-wallet: biết ví này có những category ID nào
const walletCacheMap = new Map<number, WalletCacheEntry>();

// Global lookup: tra cứu nhanh theo ID, không quan tâm ví
const globalCategoryMap = new Map<number, Category>();

const isExpired = (timestamp: number): boolean =>
  Date.now() - timestamp > AppConfig.CACHE.CATEGORY_TIMEOUT;

export const categoryCache = {
  // Lấy categories của 1 ví, trả về null nếu chưa có hoặc đã expired
  getByWallet: (walletId: number): Category[] | null => {
    const entry = walletCacheMap.get(walletId);
    if (!entry || isExpired(entry.timestamp)) return null;
    return entry.categoryIds.map(id => globalCategoryMap.get(id)!).filter(Boolean);
  },

  // Lưu categories của 1 ví vào cả 2 tầng cache
  set: (walletId: number, categories: Category[]): void => {
    categories.forEach(cat => globalCategoryMap.set(cat.id, cat));
    walletCacheMap.set(walletId, {
      categoryIds: categories.map(c => c.id),
      timestamp: Date.now(),
    });
  },

  // Global lookup theo ID — O(1), không cần biết wallet
  getById: (id: number): Category | undefined => globalCategoryMap.get(id),

  // Xóa cache của 1 ví cụ thể (khi tạo/xóa category)
  invalidateWallet: (walletId: number): void => {
    const entry = walletCacheMap.get(walletId);
    if (entry) {
      // Xóa các category của ví này khỏi global map
      entry.categoryIds.forEach(id => globalCategoryMap.delete(id));
      walletCacheMap.delete(walletId);
    }
  },

  // Xóa toàn bộ cache
  invalidateAll: (): void => {
    walletCacheMap.clear();
    globalCategoryMap.clear();
  },

  // Kiểm tra ví đã có cache chưa
  hasWallet: (walletId: number): boolean => {
    const entry = walletCacheMap.get(walletId);
    return !!entry && !isExpired(entry.timestamp);
  },
};
