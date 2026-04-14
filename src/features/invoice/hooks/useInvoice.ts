import { useState, useCallback } from "react";
import { invoiceRepository } from "@/services/repositories/invoice.repository";
import { CreateInvoicePayload, UpdateInvoicePayload } from "@/types/Invoice";

export const useInvoice = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvoice = useCallback(async (payload: CreateInvoicePayload) => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceRepository.createInvoice(payload);
      if (!response.isSuccess()) {
        throw new Error(response.message || "Tạo hóa đơn thất bại");
      }
      return true;
    } catch (err) {
      console.error("[useInvoice] Create invoice failed:", err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tạo hóa đơn");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInvoice = useCallback(async (payload: UpdateInvoicePayload) => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceRepository.updateInvoice(payload);
      if (!response.isSuccess()) {
        throw new Error(response.message || "Cập nhật hóa đơn thất bại");
      }
      return true;
    } catch (err) {
      console.error("[useInvoice] Update invoice failed:", err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi cập nhật hóa đơn");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteInvoice = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceRepository.deleteInvoice(id);
      if (!response.isSuccess()) {
        throw new Error(response.message || "Xóa hóa đơn thất bại");
      }
      return true;
    } catch (err) {
      console.error("[useInvoice] Delete invoice failed:", err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa hóa đơn");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createInvoice,
    updateInvoice,
    deleteInvoice,
    loading,
    error,
  };
};
