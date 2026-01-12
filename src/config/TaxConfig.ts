/**
 * TAX CONFIGURATION - Thuế Thu Nhập Cá Nhân (TNCN)
 * 
 * File này chứa các thông số thuế TNCN theo từng năm
 * Cập nhật file này khi có thay đổi chính sách thuế
 * 
 * Nguồn tham khảo:
 * - Luật thuế TNCN số 04/2007/QH12 và các văn bản sửa đổi
 * - Nghị định 65/2013/NĐ-CP
 */

// ============================================
// CẤU HÌNH THUẾ NĂM 2024
// ============================================

export const TaxConfig = {
  // Năm áp dụng
  YEAR: 2024,
  
  // ==========================================
  // 1. BẢO HIỂM BẮT BUỘC
  // ==========================================
  INSURANCE: {
    // Tổng tỷ lệ bảo hiểm bắt buộc (%)
    TOTAL_RATE: 0.105, // 10.5%
    
    // Chi tiết từng loại bảo hiểm
    BREAKDOWN: {
      SOCIAL: {
        name: "Bảo hiểm xã hội (BHXH)",
        rate: 0.08,      // 8%
      },
      HEALTH: {
        name: "Bảo hiểm y tế (BHYT)",
        rate: 0.015,     // 1.5%
      },
      UNEMPLOYMENT: {
        name: "Bảo hiểm thất nghiệp (BHTN)",
        rate: 0.01,      // 1%
      },
    },
    
    // Trần đóng bảo hiểm (VND)
    MAX_SALARY_BASE: 36_000_000, // 36 triệu/tháng
  },
  
  // ==========================================
  // 2. GIẢM TRỪ GIA CẢNH
  // ==========================================
  DEDUCTIONS: {
    // Giảm trừ bản thân (VND/tháng)
    PERSONAL: 11_000_000,    // 11 triệu đồng
    
    // Giảm trừ người phụ thuộc (VND/tháng/người)
    DEPENDENT: 4_400_000,    // 4.4 triệu đồng
    
    // Điều kiện người phụ thuộc
    DEPENDENT_CRITERIA: {
      maxAge: 18,              // Con dưới 18 tuổi
      studentMaxAge: 25,       // Sinh viên dưới 25 tuổi
      disabledNoAgeLimit: true, // Người khuyết tật không giới hạn tuổi
    },
  },
  
  // ==========================================
  // 3. BẬC THUẾ LŨY TIẾN TỪNG PHẦN
  // ==========================================
  BRACKETS: [
    {
      level: 1,
      from: 0,
      to: 5_000_000,
      limit: 5_000_000,
      rate: 0.05,              // 5%
      description: "Đến 5 triệu",
    },
    {
      level: 2,
      from: 5_000_000,
      to: 10_000_000,
      limit: 10_000_000,
      rate: 0.1,               // 10%
      description: "Trên 5 triệu đến 10 triệu",
    },
    {
      level: 3,
      from: 10_000_000,
      to: 18_000_000,
      limit: 18_000_000,
      rate: 0.15,              // 15%
      description: "Trên 10 triệu đến 18 triệu",
    },
    {
      level: 4,
      from: 18_000_000,
      to: 32_000_000,
      limit: 32_000_000,
      rate: 0.2,               // 20%
      description: "Trên 18 triệu đến 32 triệu",
    },
    {
      level: 5,
      from: 32_000_000,
      to: 52_000_000,
      limit: 52_000_000,
      rate: 0.25,              // 25%
      description: "Trên 32 triệu đến 52 triệu",
    },
    {
      level: 6,
      from: 52_000_000,
      to: 80_000_000,
      limit: 80_000_000,
      rate: 0.3,               // 30%
      description: "Trên 52 triệu đến 80 triệu",
    },
    {
      level: 7,
      from: 80_000_000,
      to: Infinity,
      limit: Infinity,
      rate: 0.35,              // 35%
      description: "Trên 80 triệu",
    },
  ],
  
  // ==========================================
  // 4. FORMAT HIỂN THỊ CHO UI
  // ==========================================
  DISPLAY: {
    // Bậc thuế format ngắn gọn cho UI
    BRACKETS_FORMATTED: [
      { label: "0-5 triệu", rate: "5%" },
      { label: "5-10 triệu", rate: "10%" },
      { label: "10-18 triệu", rate: "15%" },
      { label: "18-32 triệu", rate: "20%" },
      { label: "32-52 triệu", rate: "25%" },
      { label: "52-80 triệu", rate: "30%" },
      { label: "Trên 80 triệu", rate: "35%" },
    ],
    
    // Tên đầy đủ cho tooltip/help
    INSURANCE_FULL_NAME: "Bảo hiểm bắt buộc (BHXH + BHYT + BHTN)",
    PERSONAL_DEDUCTION_NAME: "Giảm trừ bản thân",
    DEPENDENT_DEDUCTION_NAME: "Giảm trừ người phụ thuộc",
  },
  
  // ==========================================
  // 5. GHI CHÚ & CẢNH BÁO
  // ==========================================
  NOTES: {
    WARNING: "Kết quả tính toán mang tính tham khảo. Vui lòng tham khảo cơ quan thuế để có kết quả chính xác.",
    UPDATE_INFO: "Cấu hình thuế được cập nhật theo quy định năm 2024",
    SOURCE: "Nguồn: Tổng cục Thuế - Bộ Tài chính",
  },
};

// ============================================
// EXPORT CÁC HẰNG SỐ THƯỜNG DÙNG
// ============================================

export const TAX_YEAR = TaxConfig.YEAR;

// Bảo hiểm
export const INSURANCE_RATE = TaxConfig.INSURANCE.TOTAL_RATE;
export const INSURANCE_MAX_BASE = TaxConfig.INSURANCE.MAX_SALARY_BASE;

// Giảm trừ
export const PERSONAL_DEDUCTION = TaxConfig.DEDUCTIONS.PERSONAL;
export const DEPENDENT_DEDUCTION = TaxConfig.DEDUCTIONS.DEPENDENT;

// Bậc thuế
export const TAX_BRACKETS = TaxConfig.BRACKETS;
export const TAX_BRACKETS_DISPLAY = TaxConfig.DISPLAY.BRACKETS_FORMATTED;

// Display names
export const TAX_DISPLAY = TaxConfig.DISPLAY;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Tính thuế TNCN theo thu nhập chịu thuế
 * @param taxableIncome Thu nhập chịu thuế (sau khi trừ giảm trừ)
 * @returns Số tiền thuế phải đóng
 */
export const calculateProgressiveTax = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;
  
  let tax = 0;
  let remaining = taxableIncome;
  
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const bracket = TAX_BRACKETS[i];
    const previousLimit = i > 0 ? TAX_BRACKETS[i - 1].limit : 0;
    const bracketRange = bracket.limit - previousLimit;
    
    if (remaining > 0) {
      const taxableInBracket = Math.min(remaining, bracketRange);
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    } else {
      break;
    }
  }
  
  return tax;
};

/**
 * Tính tổng giảm trừ gia cảnh
 * @param dependentCount Số người phụ thuộc
 * @param otherDeductions Các khoản giảm trừ khác (optional)
 * @returns Tổng giảm trừ
 */
export const calculateTotalDeductions = (
  dependentCount: number,
  otherDeductions: number = 0
): number => {
  return (
    PERSONAL_DEDUCTION +
    dependentCount * DEPENDENT_DEDUCTION +
    otherDeductions
  );
};

/**
 * Tính bảo hiểm bắt buộc
 * @param grossIncome Thu nhập Gross
 * @returns Số tiền bảo hiểm phải đóng
 */
export const calculateInsurance = (grossIncome: number): number => {
  const baseForInsurance = Math.min(grossIncome, INSURANCE_MAX_BASE);
  return baseForInsurance * INSURANCE_RATE;
};

/**
 * Format số tiền VND
 * @param amount Số tiền
 * @returns String đã format
 */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + " đ";
};

/**
 * Format phần trăm
 * @param rate Tỷ lệ (0-1)
 * @returns String đã format
 */
export const formatPercent = (rate: number): string => {
  return (rate * 100).toFixed(1) + "%";
};

// ============================================
// TYPE DEFINITIONS (Optional - cho TypeScript)
// ============================================

export interface TaxBracket {
  level: number;
  from: number;
  to: number;
  limit: number;
  rate: number;
  description: string;
}

export interface TaxCalculationResult {
  grossIncome: number;
  insurance: number;
  taxableIncome: number;
  totalDeductions: number;
  taxableAmount: number;
  tax: number;
  netIncome: number;
  effectiveTaxRate: number;
}