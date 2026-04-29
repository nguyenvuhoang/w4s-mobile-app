import { AppConfig } from '@/config/AppConfig';
import { Category } from '@/services/repositories/category.repository';

interface WalletCacheEntry {
  categoryIds: number[];
  timestamp: number;
}

// Per-wallet: biết ví này có những category ID nào
const walletCacheMap = new Map<number, WalletCacheEntry>();

// Global lookup theo numeric ID
const globalCategoryMap = new Map<number, Category>();

// Lookup theo composite key "walletId:category_code" — tránh trùng code giữa các ví
const walletCodeMap = new Map<string, Category>();

const makeCodeKey = (walletId: number, code: string) => `${walletId}:${code}`;

const isExpired = (timestamp: number): boolean =>
  Date.now() - timestamp > AppConfig.CACHE.CATEGORY_TIMEOUT;

export const categoryCache = {
  getByWallet: (walletId: number): Category[] | null => {
    const entry = walletCacheMap.get(walletId);
    if (!entry || isExpired(entry.timestamp)) return null;
    return entry.categoryIds.map(id => globalCategoryMap.get(id)!).filter(Boolean);
  },

  set: (walletId: number, categories: Category[]): void => {
    categories.forEach(cat => {
      const key = cat.id !== undefined && cat.id !== null ? cat.id : (cat.category_code as any);
      globalCategoryMap.set(key, cat);
      if (cat.category_code) {
        walletCodeMap.set(makeCodeKey(walletId, cat.category_code), cat);
      }
    });
    walletCacheMap.set(walletId, {
      categoryIds: categories.map(c => (c.id !== undefined && c.id !== null ? c.id : (c.category_code as any))),
      timestamp: Date.now(),
    });
  },

  getById: (id: any): Category | undefined => globalCategoryMap.get(id),

  /** Tra cứu theo walletId + category_code — tránh nhầm code trùng giữa các ví */
  getByCode: (walletId: number, code: string): Category | undefined =>
    walletCodeMap.get(makeCodeKey(walletId, code)),

  invalidateWallet: (walletId: number): void => {
    const entry = walletCacheMap.get(walletId);
    if (entry) {
      entry.categoryIds.forEach(id => {
        const cat = globalCategoryMap.get(id);
        if (cat?.category_code) walletCodeMap.delete(makeCodeKey(walletId, cat.category_code));
        globalCategoryMap.delete(id);
      });
      walletCacheMap.delete(walletId);
    }
  },

  invalidateAll: (): void => {
    walletCacheMap.clear();
    globalCategoryMap.clear();
    walletCodeMap.clear();
  },

  hasWallet: (walletId: number): boolean => {
    const entry = walletCacheMap.get(walletId);
    return !!entry && !isExpired(entry.timestamp);
  },
};
