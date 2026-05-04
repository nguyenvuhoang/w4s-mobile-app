import { AppConfig } from "@/config/AppConfig";
import StorageKey from "@/constants/StorageKey";
import { GlobalContext } from "@/contexts/GlobalContext";
import { BaseResponseModel } from "@/core/api/models/ClientModel";
import {
  AdvancedSearchBudgetParams,
  budgetRepository,
  BudgetSearchParams,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "@/services/repositories/budget.repository";
import StorageService from "@/services/StorageService";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 9999;

interface UseBudgetOptions {
  autoFetch?: boolean;
  forceRefresh?: boolean;
}

export interface Budget {
  id?: number;
  budget_id?: number;
  budget_code?: string;
  amount: number;
  used_amount?: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  end_date: string;
  period_type: string;
  source_budget?: string;
  source_gudget?: string;
  source_tracker: number;
  start_date: string;
  wallet_id: number;
  wallet_contract_id?: number;
  wallet_name?: string;
  note?: string;
  include_in_report?: boolean;
  is_auto_repeat?: boolean;
  status?: "ACTIVE" | "COMPLETED" | "INACTIVE";
  spent?: number;
  currency_code?: string;
}

export interface BudgetSummary {
  currency_code?: string;
  currency: string;
  total_budget: number;
  total_spent: number;
  remaining: number;
  days_left: number;
}

// Session cache - chỉ tồn tại trong runtime, mất khi tắt app
let sessionCache: {
  budgets: Budget[];
  timestamp: number;
} | null = null;

export const useBudget = (options: UseBudgetOptions = {}) => {
  const { autoFetch = true, forceRefresh = false } = options;
  const { appInfo } = useContext(GlobalContext);

  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch ALL budgets from API once
   */
  const fetchAllBudgets = useCallback(async (skipCache = false) => {
    // Kiểm tra cache nếu không skipCache
    if (!skipCache && sessionCache) {
      const isExpired =
        Date.now() - sessionCache.timestamp > AppConfig.CACHE.CATEGORY_TIMEOUT;

      if (!isExpired) {
        console.log("[useBudget] Using cached data");
        setAllBudgets(sessionCache.budgets);
        return;
      } else {
        console.log("[useBudget] Cache expired, fetching new data");
      }
    }

    try {
      setLoading(true);
      setError(null);
      const userCode = await StorageService.getItem(StorageKey.userCode);
      if (!userCode) {
        throw new Error("Missing user code");
      }

      const params: BudgetSearchParams = {
        userCode: userCode,
        status: "",
        budget_type: "",
        wallet_id: undefined,
        from_date: "",
        to_date: "",
        search_text: "",
        page_index: 1,
        page_size: PAGE_SIZE,
      };

      console.log("[useBudget] Fetching ALL budgets");

      const response = await budgetRepository.getBudgets(params);

      if (response.isSuccess() && response.data) {
        const items: Budget[] = response.data.items || [];

        console.log("[useBudget] Fetched all budgets:", {
          total: items.length,
          active: items.filter((b) => b.status === "ACTIVE").length,
          completed: items.filter((b) => b.status === "COMPLETED").length,
        });

        // Cache data
        sessionCache = {
          budgets: items,
          timestamp: Date.now(),
        };

        setAllBudgets(items);
        console.log("[useBudget] Data fetched and cached");
      } else {
        throw new Error(
          response.message || "Không thể tải danh sách ngân sách"
        );
      }
    } catch (err) {
      console.error("[useBudget] Fetch budgets failed:", err);
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách ngân sách"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new budget
   */
  const createBudget = useCallback(
    async (payload: CreateBudgetPayload): Promise<BaseResponseModel> => {
      try {
        setError(null);
        setCreating(true);
        console.log("[useBudget] Creating budget payload:", payload);

        const response = await budgetRepository.createBudget(payload);

        if (response.isSuccess()) {
          // Clear cache và refresh lại sau khi tạo
          console.log("[useBudget] Budget created, clearing cache and refreshing");
          sessionCache = null;
          await fetchAllBudgets(true);
        } else {
          setError(response.getError() || "Tạo ngân sách thất bại");
        }

        return response;
      } catch (err) {
        console.error("[useBudget] Create budget network/unexpected error:", err);
        const errorMessage = err instanceof Error ? err.message : "Không thể tạo ngân sách";
        setError(errorMessage);
        return new BaseResponseModel({
          success: false,
          message: errorMessage,
          code: "ERROR",
          data: null,
          execution_id: "",
          timestamp: new Date().toISOString(),
          errors: [],
          metadata: {}
        });
      } finally {
        setCreating(false);
      }
    },
    [fetchAllBudgets]
  );

  /**
   * Update an existing budget
   */
  const updateBudget = useCallback(
    async (payload: UpdateBudgetPayload): Promise<BaseResponseModel> => {
      try {
        setError(null);
        setCreating(true);
        console.log("[useBudget] Updating budget payload:", payload);

        const response = await budgetRepository.updateBudget(payload);

        if (response.isSuccess()) {
          // Clear cache và refresh lại sau khi update
          console.log("[useBudget] Budget updated, clearing cache and refreshing");
          sessionCache = null;
          await fetchAllBudgets(true);
        } else {
          setError(response.getError() || "Cập nhật ngân sách thất bại");
        }

        return response;
      } catch (err) {
        console.error("[useBudget] Update budget network/unexpected error:", err);
        const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật ngân sách";
        setError(errorMessage);
        return new BaseResponseModel({
          success: false,
          message: errorMessage,
          code: "ERROR",
          data: null,
          execution_id: "",
          timestamp: new Date().toISOString(),
          errors: [],
          metadata: {}
        });
      } finally {
        setCreating(false);
      }
    },
    [fetchAllBudgets]
  );

  /**
   * Delete a budget
   */
  const deleteBudget = useCallback(
    async (budgetId: number): Promise<BaseResponseModel> => {
      try {
        setError(null);
        setDeleting(true);
        console.log("[useBudget] Deleting budget ID:", budgetId);

        const response = await budgetRepository.deleteBudget(budgetId);

        if (response.isSuccess()) {
          console.log("[useBudget] Budget deleted, clearing cache and refreshing");
          sessionCache = null;
          await fetchAllBudgets(true);
        } else {
          setError(response.getError() || "Xóa ngân sách thất bại");
        }

        return response;
      } catch (err) {
        console.error("[useBudget] Delete budget network/unexpected error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Không thể xóa ngân sách";
        setError(errorMessage);
        return new BaseResponseModel({
          success: false,
          message: errorMessage,
          code: "ERROR",
          data: null,
          execution_id: "",
          timestamp: new Date().toISOString(),
          errors: [],
          metadata: {},
        });
      } finally {
        setDeleting(false);
      }
    },
    [fetchAllBudgets]
  );

  /**
   * Fetch budget summary
   */
  const fetchBudgetSummary = useCallback(
    async (walletId: number | null, periodType: string) => {
      try {
        setSummaryLoading(true);
        setError(null);

        // Map period string (e.g. 'this_year') to API format ('YEAR')
        // const apiPeriodType = periodType.replace('this_', '').toUpperCase();

        const params = {
          wallet_id: walletId || 0,
          contract_number: appInfo?.contract_number || "",
          period_type: periodType,
        };

        console.log("[useBudget] Fetching budget summary:", params);
        const response = await budgetRepository.getBudgetSummary(params);

        if (response.isSuccess() && response.data) {
          let summaryData;
          const items = response.data.items;
          if (Array.isArray(items) && items.length > 0) {
            summaryData = items.reduce((acc: any, curr: any) => ({
              total_budget: (acc.total_budget || 0) + (Number(curr.total_budget) || 0),
              total_spent: (acc.total_spent || 0) + (Number(curr.total_spent) || 0),
              remaining: (acc.remaining || 0) + (Number(curr.remaining) || 0),
              days_left: Math.max(acc.days_left || 0, Number(curr.days_left) || 0),
              currency: acc.currency || curr.currency || curr.currency_code || 'VND',
              currency_code: acc.currency_code || curr.currency_code || curr.currency || 'VND',
            }), { total_budget: 0, total_spent: 0, remaining: 0, days_left: 0 });
          } else {
            summaryData = response.data.summary || response.data;
          }
          setBudgetSummary(summaryData);
          return summaryData;
        } else {
          throw new Error(response.message || "Không thể tải tóm tắt ngân sách");
        }
      } catch (err) {
        console.error("[useBudget] Fetch summary failed:", err);
        return null;
      } finally {
        setSummaryLoading(false);
      }
    },
    [appInfo?.contract_number]
  );

  /**
   * Advanced search budgets
   */
  const advancedSearchBudgets = useCallback(
    async (params: AdvancedSearchBudgetParams) => {
      try {
        setLoading(true);
        setError(null);
        console.log("[useBudget] Advanced search budgets:", params);

        const response = await budgetRepository.advancedSearchBudget(params);

        if (response.isSuccess() && response.data) {
          return response.data.items || [];
        } else {
          throw new Error(response.message || "Lỗi tìm kiếm nâng cao ngân sách");
        }
      } catch (err) {
        console.error("[useBudget] Advanced search failed:", err);
        setError(
          err instanceof Error ? err.message : "Lỗi tìm kiếm nâng cao ngân sách"
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Force refresh - bỏ qua cache
   */
  const refetch = useCallback(() => {
    console.log("[useBudget] Force refresh");
    fetchAllBudgets(true);
  }, [fetchAllBudgets]);

  /**
   * Clear cache manually
   */
  const clearCache = useCallback(() => {
    console.log("[useBudget] Cache cleared");
    sessionCache = null;
  }, []);

  /**
   * Filter budgets by status (client-side)
   */
  const getBudgetsByStatus = useCallback(
    (status: "ACTIVE" | "COMPLETED" | "INACTIVE") => {
      return allBudgets.filter((budget) => budget.status === status);
    },
    [allBudgets]
  );

  /**
   * Active budgets
   */
  const activeBudgets = useMemo(() => {
    return allBudgets.filter((budget) => budget.status === "ACTIVE");
  }, [allBudgets]);

  /**
   * Completed budgets
   */
  const completedBudgets = useMemo(() => {
    return allBudgets.filter((budget) => budget.status === "COMPLETED");
  }, [allBudgets]);

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAllBudgets(forceRefresh);
    } else {
      console.log(
        "[useBudget] NOT calling fetchAllBudgets. autoFetch:",
        autoFetch
      );
    }
  }, [autoFetch, forceRefresh, fetchAllBudgets]);

  return {
    allBudgets,
    activeBudgets,
    completedBudgets,
    budgetSummary,
    loading,
    summaryLoading,
    creating,
    deleting,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    fetchAllBudgets, // Deprecated - dùng refetch thay thế
    fetchBudgetSummary,
    advancedSearchBudgets,
    refetch,
    clearCache,
    getBudgetsByStatus,
  };
};
