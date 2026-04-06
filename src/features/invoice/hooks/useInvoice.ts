import { useState, useCallback } from "react";
import { invoiceRepository } from "@/services/repositories/invoice.repository";
import { CreateInvoicePayload } from "@/types/Invoice";

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

  return {
    createInvoice,
    loading,
    error,
  };
};
