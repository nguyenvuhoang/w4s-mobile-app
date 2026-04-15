import { GlobalContext } from "@/contexts/GlobalContext";
import { transactionRepository } from "@/services/repositories/transaction.repository";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { AccountType } from "@/types/wallet";
import { useCallback, useContext, useState } from "react";

export interface CreateTransactionData {
  walletId: number;
  type: "income" | "expense" | "inout";
  amount: number;
  currency: string;
  categoryId: number;
  eventId?: number | null;
  loanId?: number | null;
  description?: string;
  location?: string;
  recordedAt: Date;
  reminderAt?: Date | null;
  isCalculateReport?: boolean;
  images?: string[];
  participants?: ParticipantData[];
  isLoanForFund: boolean;
  categoryGroup?: "INCOME" | "EXPENSE" | "LOAN";
}

export interface UpdateTransactionData {
  transactionId: string;
  amount: number;
  currency: string;
  categoryId: number;
  eventId?: string | null;
  description?: string;
  location?: string;
  transactionDate: string; // ISO string e.g. "2026-03-20T06:37:02"
  reminderAt?: string | null;
  isCalculateReport?: boolean;
  images?: string[];
}

export interface ParticipantData {
  id?: number;
  display_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  counterparty_type?: number;
  is_favorite?: boolean;
}

export const useTransaction = () => {
  const { appInfo, wallets } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = useCallback(async (data: CreateTransactionData) => {
    if (!appInfo?.user_code || !appInfo?.contract_number) {
      throw new Error("User not authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      const wallet = wallets?.find((w) => w.walletId === data.walletId);
      if (!wallet) throw new Error("Wallet not found");

      const typeToAccountType: Record<CreateTransactionData["type"], AccountType> = {
        income: "01",
        expense: "02",
        inout: "03",
      };

      let accountType: AccountType;
      if (data.categoryGroup) {
        const groupToAccountType: Record<string, AccountType> = {
          INCOME: "01",
          EXPENSE: "02",
          LOAN: "03",
        };
        accountType = groupToAccountType[data.categoryGroup];
      } else {
        accountType = typeToAccountType[data.type];
      }

      const account = wallet.accounts.find((acc) => acc.accountType === accountType);
      if (!account) {
        throw new Error(`Account type ${accountType} not found in wallet ${wallet.name}`);
      }

      const formattedParticipants =
        data.participants?.map((p) => {
          const baseData = {
            DisplayName: p.display_name,
            Phone: p.phone || "",
            AvatarUrl: p.avatar_url || "",
            CounterpartyType: p.counterparty_type || 1,
            IsFavorite: p.is_favorite || false,
          };
          return p.id ? { id: p.id, ...baseData } : baseData;
        }) || [];

      const payload = {
        userCode: appInfo.user_code,
        username: appInfo.login_name,
        contract_number: appInfo.contract_number,
        account_number: account.accountNumber,
        wallet_id: data.walletId,
        type: accountType,
        amount: data.amount,
        currency: data.currency,
        category_id: data.categoryId,
        event_id: data.eventId || null,
        loan_id: data.loanId || null,
        transaction_description: data.description || "",
        location: data.location || "",
        recorded_at: data.recordedAt.toISOString(),
        reminder_at: data.reminderAt ? data.reminderAt.toISOString() : null,
        is_calculate_report: data.isCalculateReport !== undefined ? data.isCalculateReport : true,
        is_loan_for_fund: data.isLoanForFund,
        is_funding: false,
        images: data.images || [],
        with_users: formattedParticipants,
      };

      const response = await transactionRepository.createTransaction(payload);

      if (response.isSuccess()) {
        TransactionEventEmitter.emitTransactionChanged();
        return response;
      } else {
        throw new Error(response.getError() || "Không thể tạo giao dịch");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      console.error("[useTransaction] Error:", err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appInfo, wallets]);

  const updateTransaction = useCallback(async (data: UpdateTransactionData) => {
    if (!appInfo?.user_code) {
      throw new Error("User not authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      // Tạo reference_id từ timestamp hiện tại
      const now = new Date();
      const pad = (n: number, l = 2) => String(n).padStart(l, "0");
      const reference_id = [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate()),
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds()),
        "01000001",
      ].join("");

      const response = await transactionRepository.updateTransaction({
        transaction_id: data.transactionId,
        transaction_description: data.description || "",
        description: data.description || "",
        amount: data.amount,
        currency: data.currency,
        category_id: data.categoryId,
        event_id: data.eventId || null,
        location: data.location || "",
        transaction_date: data.transactionDate,
        reminder_at: data.reminderAt || null,
        is_calculate_report: data.isCalculateReport ?? true,
        images: data.images || [],
        with_users: [],
        user_code: appInfo.user_code,
        current_user_code: appInfo.user_code,
        channel_id: "MB",
        reference_id,
      });

      if (response.isSuccess()) {
        TransactionEventEmitter.emitTransactionChanged();
        return response;
      } else {
        throw new Error(response.getError() || "Không thể cập nhật giao dịch");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      console.error("[useTransaction] Error updating:", err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appInfo]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!appInfo?.user_code) {
      throw new Error("User not authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await transactionRepository.deleteTransaction(transactionId);

      if (response.isSuccess()) {
        TransactionEventEmitter.emitTransactionChanged();
        return response;
      } else {
        throw new Error(response.getError() || "Không thể xóa giao dịch");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      console.error("[useTransaction] Error:", err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appInfo]);

  const advancedSearchTransactions = useCallback(async (params: {
    transaction_id?: string;
    wallet_id?: number;
    category_id?: number;
    event_id?: number;
    wallet_budget_id?: number;
    from_transaction_date?: string;
    to_transaction_date?: string;
    page_index: number;
    page_size: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await transactionRepository.advancedSearchTransactions(params);

      if (response.isSuccess()) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to search transactions");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      console.error("[useTransaction] Error advanced search:", err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refundTransaction = useCallback(async (transactionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await transactionRepository.refundTransaction({
        transaction_id: transactionId,
      });

      if (response.isSuccess()) {
        TransactionEventEmitter.emitTransactionChanged();
        return response;
      } else {
        throw new Error(response.message || "Failed to refund transaction");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      console.error("[useTransaction] Error refunding transaction:", err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refundTransaction,
    advancedSearchTransactions,
  };
};
