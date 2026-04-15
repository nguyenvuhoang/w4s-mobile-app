import { useState, useCallback } from "react";
import { paybookRepository } from "@/services/repositories/paybook.repository";
import type { Loan, LoanDetail } from "@/features/paybook/types";

export const usePaybookDetail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loanDetail, setLoanDetail] = useState<LoanDetail | null>(null);

  const getLoanDetail = useCallback(async (loanId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paybookRepository.getLoan(loanId);

      if (!response.isSuccess()) {
        throw new Error(response.getError?.() || "Failed to fetch loan detail");
      }

      const rawData =
        typeof response.getData === "function"
          ? response.getData()
          : response.data || {};

      let detailData = null;
      if (Array.isArray(rawData) && rawData.length > 0) {
        detailData = rawData[0];
      } else if (rawData.loan) {
        detailData = Array.isArray(rawData.loan)
          ? rawData.loan[0]
          : rawData.loan;
      } else {
        detailData = rawData;
      }

      const mappedData: LoanDetail = {
        ...detailData,
        loan_type: (detailData.loan_type || "LEND").toUpperCase(),
        status: (detailData.status || "ACTIVE").toUpperCase(),
        payment_type: (detailData.payment_type || "BULLET").toUpperCase(),
        total_installments: detailData.total_installments ?? detailData.total_installment ?? 0,
        // Adapt other fields if necessary
        principal_amount: detailData.principal_amount ?? 0,
        balance: detailData.balance ?? detailData.remaining_amount ?? 0,
      };

      setLoanDetail(mappedData);
      return mappedData;
    } catch (err: any) {
      const message = err.message || "Lỗi khi lấy chi tiết khoản vay";
      setError(message);
      console.error("[usePaybookDetail] getLoanDetail failed", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLoans = useCallback(async (): Promise<Loan[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await paybookRepository.getLoans();

      if (!response.isSuccess()) {
        throw new Error(response.getError?.() || "Failed to fetch loans");
      }

      const rawData =
        typeof response.getData === "function"
          ? response.getData()
          : response.data || [];

      // API có thể trả về array trực tiếp, hoặc object phân trang { items: [...] }
      const rawItems: any[] = Array.isArray(rawData)
        ? rawData
        : rawData.items ?? rawData.loans ?? rawData.data ?? [];

      // Normalize: API dùng `id` (number) và `balance`, Loan type dùng `loan_id` (string) và `remaining_amount`
      const list: Loan[] = rawItems.map((item: any) => ({
        ...item,
        loan_id: item.loan_id ?? String(item.id),
        remaining_amount: item.remaining_amount ?? item.balance ?? 0,
      }));

      return list;
    } catch (err: any) {
      const message = err.message || "Lỗi khi lấy danh sách khoản vay";
      setError(message);
      console.error("[usePaybookDetail] getLoans failed", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createLoan = useCallback(async (payload: Parameters<typeof paybookRepository.createLoan>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paybookRepository.createLoan(payload);

      if (!response.isSuccess()) {
        throw new Error(response.getError?.() || "Failed to create loan");
      }

      const rawData =
        typeof response.getData === "function"
          ? response.getData()
          : response.data || {};

      return rawData;
    } catch (err: any) {
      const message = err.message || "Lỗi khi tạo khoản vay";
      setError(message);
      console.error("[usePaybookDetail] createLoan failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLoan = useCallback(async (payload: Parameters<typeof paybookRepository.updateLoan>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paybookRepository.updateLoan(payload);

      if (!response.isSuccess()) {
        throw new Error(response.getError?.() || "Failed to update loan");
      }

      const rawData =
        typeof response.getData === "function"
          ? response.getData()
          : response.data || {};

      return rawData;
    } catch (err: any) {
      const message = err.message || "Lỗi khi cập nhật khoản vay";
      setError(message);
      console.error("[usePaybookDetail] updateLoan failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    loanDetail,
    getLoans,
    getLoanDetail,
    createLoan,
    updateLoan,
  };
};
