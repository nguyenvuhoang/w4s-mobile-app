// services/repositories/wallet.repository.ts
import { WORKFLOWCODE } from "@/constants/WorkflowCode";
import { apiService } from "@/core/api";
import { WalletRaw, WalletSummary } from "@/types/wallet";
import { mapWalletToSummary } from "./mapper/wallet.mapper";

export const walletRepository = {
  async getWalletOverview(userCode: string): Promise<WalletSummary[]> {
    try {
      const res = await apiService.executeWorkflow(
        WORKFLOWCODE.WF_MB_GET_LIST_WALLET,
        { usercode: userCode },
        false,
        true
      );

      if (!res?.isSuccess?.() || !res.data?.data) {
        throw new Error(res?.message || "Get wallet overview failed");
      }

      const rawWallets: WalletRaw[] = res.data.data;

      return rawWallets.map(mapWalletToSummary);
    } catch (error) {
      console.error("[walletRepository] getWalletOverview error", error);
      throw error;
    }
  },
};
