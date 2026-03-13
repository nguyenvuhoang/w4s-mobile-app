import { GlobalContext } from "@/contexts/GlobalContext";
import { transactionRepository } from "@/services/repositories/transaction.repository";
import TransactionEventEmitter from "@/services/TransactionEventEmitter";
import { AccountType } from "@/types/wallet";
import { useContext, useState } from "react";

export interface CreateTransactionData {
  walletId: number;
  type: "income" | "expense" | "inout";
  amount: number;
  currency: string;
  categoryId: number;
  eventId?: number | null;
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

  const createTransaction = async (data: CreateTransactionData) => {
    if (!appInfo?.user_code || !appInfo?.contract_number) {
      throw new Error("User not authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      // Tìm wallet
      const wallet = wallets?.find((w) => w.walletId === data.walletId);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Map type to account type
      const typeToAccountType: Record<
        CreateTransactionData["type"],
        AccountType
      > = {
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

      // Lấy account tương ứng với type
      const account = wallet.accounts.find(
        (acc) => acc.accountType === accountType,
      );

      if (!account) {
        throw new Error(
          `Account type ${accountType} not found in wallet ${wallet.name}`,
        );
      }

      // Format participants cho server
      const formattedParticipants =
        data.participants?.map((p) => {
          const baseData = {
            DisplayName: p.display_name,
            Phone: p.phone || "",
            AvatarUrl: p.avatar_url || "",
            CounterpartyType: p.counterparty_type || 1,
            IsFavorite: p.is_favorite || false,
          };

          if (p.id) {
            return {
              id: p.id,
              ...baseData,
            };
          }

          return baseData;
        }) || [];

      const payload = {
        userCode: appInfo.user_code,
        username: appInfo.login_name,
        account_number: account.accountNumber,
        wallet_id: data.walletId,
        type: accountType,
        amount: data.amount,
        currency: data.currency,
        category_id: data.categoryId,
        event_id: data.eventId || null,
        transaction_description: data.description || "",
        location: data.location || "",
        recorded_at: data.recordedAt.toISOString(),
        reminder_at: data.reminderAt ? data.reminderAt.toISOString() : null,
        is_calculate_report:
          data.isCalculateReport !== undefined ? data.isCalculateReport : true,
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
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!appInfo?.user_code) {
      throw new Error("User not authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      const response = await transactionRepository.deleteTransaction(
        transactionId,
      );

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
  };

  const advancedSearchTransactions = async (params: {
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
  };

  const refundTransaction = async (transactionId: string) => {
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
  };

  return {
    loading,
    error,
    createTransaction,
    deleteTransaction,
    refundTransaction,
    advancedSearchTransactions,
  };
};
