// Paybook Types

export type PaybookType = "receivable" | "payable"; // Phải thu | Phải trả

export type PaybookStatus = "pending" | "paid" | "overdue"; // Chưa trả | Đã trả | Quá hạn

export interface Paybook {
  id: string;
  name: string; // Tên người / đối tượng
  note?: string; // Ghi chú ngắn
  originalAmount: number; // Số tiền nợ ban đầu
  paidAmount: number; // Số tiền đã trả
  type: PaybookType;
  status: PaybookStatus;
  dueDate?: string; // Ngày đáo hạn
  createdAt: string;
}

export interface PaybookSummary {
  totalReceivable: number; // Tổng phải thu
  totalPayable: number; // Tổng phải trả
}

export type PaybookFilterType = "all" | "receivable" | "payable";
