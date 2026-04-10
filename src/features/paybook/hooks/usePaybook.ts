import { useState, useCallback } from "react";
import { paybookRepository } from "@/services/repositories/paybook.repository";
import type { LoanDetail } from "@/features/paybook/types";

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
    getLoanDetail,
    createLoan,
    updateLoan,
  };
};
