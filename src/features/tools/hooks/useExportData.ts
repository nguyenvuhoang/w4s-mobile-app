import { useState } from 'react';
import { apiService } from '@/core/api';

export interface ExportDataPayload {
  wallet_id: number | null;
  is_all_wallet: boolean;
  category_id: number;
  budget_id: number | null;
  email: string;
  from_transaction_date: string;
  to_transaction_date: string;
  file_type: "excel" | "pdf";
  mail_config_id?: string;
  mail_template_id?: string;
}

export const useExportData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async (payload: ExportDataPayload) => {
    try {
      setLoading(true);
      setError(null);

      const requestPayload = {
        wallet_id: payload.wallet_id,
        is_all_wallet: payload.is_all_wallet,
        category_id: payload.category_id,
        budget_id: payload.budget_id,
        email: payload.email,
        mail_config_id: payload.mail_config_id || "main_mail",
        mail_template_id: payload.mail_template_id || "MB_MAIL_EXPORT_TRANSACTION",
        from_transaction_date: payload.from_transaction_date,
        to_transaction_date: payload.to_transaction_date,
        file_type: payload.file_type
      };

      const response = await apiService.executeWorkflow(
        "WF_MB_EXPORT_WALLET_TRANSACTION",
        requestPayload,
        false
      );

      if (response.isSuccess()) {
        return { success: true, message: response.message || "Export thành công" };
      } else {
        throw new Error(response.message || "Export failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi khi xuất dữ liệu";
      setError(errorMessage);
      console.error("[useExportData]", err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    exportData,
    loading,
    error,
  };
};
