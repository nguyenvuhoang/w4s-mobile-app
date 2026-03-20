/**
 * TAX CONFIGURATION - Thuế Thu Nhập Cá Nhân (TNCN)
 *
 * File này chứa các thông số thuế TNCN theo từng năm
 * Cập nhật file này khi có thay đổi chính sách thuế
 *
 * Nguồn tham khảo:
 * - Luật Thuế TNCN số 109/2025/QH15 (Quốc hội thông qua 10/12/2025)
 * - Nghị quyết 110/2025/UBTVQH15 về mức giảm trừ gia cảnh
 * - Áp dụng từ kỳ tính thuế năm 2026 (01/01/2026)
 */

// ============================================
// CẤU HÌNH THUẾ NĂM 2026
// (Luật số 109/2025/QH15 - áp dụng từ 01/01/2026)
// ============================================

export const TaxConfig = {
  // Năm áp dụng
  YEAR: 2026,

  // ==========================================
  // 1. BẢO HIỂM BẮT BUỘC
  // ==========================================
  INSURANCE: {
    // Tổng tỷ lệ bảo hiểm bắt buộc phía người lao động (%)
    TOTAL_RATE: 0.105, // 10.5%

    // Chi tiết từng loại bảo hiểm
    BREAKDOWN: {
      SOCIAL: {
        name: "Bảo hiểm xã hội (BHXH)",
        rate: 0.08, // 8%
      },
      HEALTH: {
        name: "Bảo hiểm y tế (BHYT)",
        rate: 0.015, // 1.5%
      },
      UNEMPLOYMENT: {
        name: "Bảo hiểm thất nghiệp (BHTN)",
        rate: 0.01, // 1%
      },
    },

    // Trần lương đóng bảo hiểm (VND/tháng)
    // BHXH, BHTN: tối đa 20 lần lương cơ sở (lương cơ sở 2.34tr × 20 = 46.8tr)
    // BHYT: không giới hạn trần theo quy định mới
    MAX_SALARY_BASE: 46_800_000, // ~46.8 triệu/tháng (cập nhật theo lương cơ sở 2026)
  },

  // ==========================================
  // 2. GIẢM TRỪ GIA CẢNH
  // (Nghị quyết 110/2025/UBTVQH15)
  // ==========================================
  DEDUCTIONS: {
    // Giảm trừ bản thân (VND/tháng) - tăng từ 11tr → 15.5tr
    PERSONAL: 15_500_000,

    // Giảm trừ người phụ thuộc (VND/tháng/người) - tăng từ 4.4tr → 6.2tr
    DEPENDENT: 6_200_000,

    // Điều kiện người phụ thuộc (giữ nguyên)
    DEPENDENT_CRITERIA: {
      maxAge: 18,               // Con dưới 18 tuổi
      studentMaxAge: 25,        // Sinh viên dưới 25 tuổi
      disabledNoAgeLimit: true, // Người khuyết tật không giới hạn tuổi
    },
  },

  // ==========================================
  // 3. BIỂU THUẾ LŨY TIẾN TỪNG PHẦN - 5 BẬC
  // (Điều 9 Luật Thuế TNCN 2025 - giảm từ 7 bậc xuống 5 bậc)
  // ==========================================
  BRACKETS: [
    {
      level: 1,
      from: 0,
      to: 10_000_000,
      limit: 10_000_000,
      rate: 0.05, // 5%
      description: "Đến 10 triệu",
    },
    {
      level: 2,
      from: 10_000_000,
      to: 30_000_000,
      limit: 30_000_000,
      rate: 0.10, // 10% (giảm từ 15%)
      description: "Trên 10 triệu đến 30 triệu",
    },
    {
      level: 3,
      from: 30_000_000,
      to: 60_000_000,
      limit: 60_000_000,
      rate: 0.20, // 20% (giảm từ 25%)
      description: "Trên 30 triệu đến 60 triệu",
    },
    {
      level: 4,
      from: 60_000_000,
      to: 100_000_000,
      limit: 100_000_000,
      rate: 0.30, // 30%
      description: "Trên 60 triệu đến 100 triệu",
    },
    {
      level: 5,
      from: 100_000_000,
      to: Infinity,
      limit: Infinity,
      rate: 0.35, // 35%
      description: "Trên 100 triệu",
    },
  ],

  // ==========================================
  // 4. FORMAT HIỂN THỊ CHO UI
  // ==========================================
  DISPLAY: {
    // Bậc thuế format ngắn gọn cho UI (5 bậc mới)
    BRACKETS_FORMATTED: [
      { label: "0 - 10 triệu",      rate: "5%"  },
      { label: "10 - 30 triệu",     rate: "10%" },
      { label: "30 - 60 triệu",     rate: "20%" },
      { label: "60 - 100 triệu",    rate: "30%" },
      { label: "Trên 100 triệu",    rate: "35%" },
    ],

    // Tên đầy đủ cho tooltip/help
    INSURANCE_FULL_NAME: "Bảo hiểm bắt buộc (BHXH 8% + BHYT 1.5% + BHTN 1%)",
    PERSONAL_DEDUCTION_NAME: "Giảm trừ bản thân",
    DEPENDENT_DEDUCTION_NAME: "Giảm trừ người phụ thuộc",
  },

  // ==========================================
  // 5. GHI CHÚ & CẢNH BÁO
  // ==========================================
  NOTES: {
    WARNING:
      "Kết quả tính toán mang tính tham khảo. Vui lòng tham khảo cơ quan thuế để có kết quả chính xác.",
    UPDATE_INFO:
      "Cấu hình thuế được cập nhật theo Luật Thuế TNCN số 109/2025/QH15, áp dụng từ kỳ tính thuế 2026 (01/01/2026)",
    SOURCE: "Nguồn: Tổng cục Thuế - Bộ Tài chính / Luật số 109/2025/QH15",
  },
};

// ============================================
// EXPORT CÁC HẰNG SỐ THƯỜNG DÙNG
// ============================================

export const TAX_YEAR = TaxConfig.YEAR;

// Bảo hiểm
export const INSURANCE_RATE = TaxConfig.INSURANCE.TOTAL_RATE;         // 10.5%
export const INSURANCE_MAX_BASE = TaxConfig.INSURANCE.MAX_SALARY_BASE; // ~46.8tr

// Giảm trừ
export const PERSONAL_DEDUCTION = TaxConfig.DEDUCTIONS.PERSONAL;   // 15.5tr
export const DEPENDENT_DEDUCTION = TaxConfig.DEDUCTIONS.DEPENDENT; // 6.2tr

// Bậc thuế
export const TAX_BRACKETS = TaxConfig.BRACKETS;
export const TAX_BRACKETS_DISPLAY = TaxConfig.DISPLAY.BRACKETS_FORMATTED;

// Display names
export const TAX_DISPLAY = TaxConfig.DISPLAY;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Tính thuế TNCN theo thu nhập chịu thuế (biểu thuế 5 bậc 2026)
 * @param taxableAmount Thu nhập chịu thuế (sau khi trừ tất cả giảm trừ)
 * @returns Số tiền thuế phải đóng
 */
export const calculateProgressiveTax = (taxableAmount: number): number => {
  if (taxableAmount <= 0) return 0;

  let tax = 0;
  let remaining = taxableAmount;
  let prevLimit = 0;

  for (const bracket of TAX_BRACKETS) {
    const bracketSize =
      bracket.limit === Infinity ? remaining : bracket.limit - prevLimit;
    const taxableInBracket = Math.min(remaining, bracketSize);

    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    prevLimit = bracket.limit === Infinity ? prevLimit : bracket.limit;

    if (remaining <= 0) break;
  }

  return tax;
};

/**
 * Tính bảo hiểm bắt buộc (có tính trần lương)
 * @param grossIncome Thu nhập Gross
 * @returns Số tiền bảo hiểm phải đóng
 */
export const calculateInsurance = (grossIncome: number): number => {
  const baseForInsurance = Math.min(grossIncome, INSURANCE_MAX_BASE);
  return baseForInsurance * INSURANCE_RATE;
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
 * Tính toán đầy đủ thuế TNCN từ Gross
 * @param grossIncome Thu nhập Gross
 * @param dependentCount Số người phụ thuộc
 * @param otherDeductions Khoản giảm trừ khác
 * @param insuranceOverride Ghi đè bảo hiểm thủ công (optional)
 * @returns Kết quả tính thuế đầy đủ
 */
export const calculateFromGross = (
  grossIncome: number,
  dependentCount: number,
  otherDeductions: number = 0,
  insuranceOverride?: number
): TaxCalculationResult => {
  const insurance =
    insuranceOverride !== undefined
      ? insuranceOverride
      : calculateInsurance(grossIncome);

  const taxableIncome = grossIncome - insurance;
  const totalDeductions = calculateTotalDeductions(dependentCount, otherDeductions);
  const taxableAmount = Math.max(0, taxableIncome - totalDeductions);
  const tax = calculateProgressiveTax(taxableAmount);
  const netIncome = grossIncome - insurance - tax;
  const effectiveTaxRate = grossIncome > 0 ? (tax / grossIncome) * 100 : 0;

  return {
    grossIncome,
    insurance,
    taxableIncome,
    totalDeductions,
    taxableAmount,
    tax,
    netIncome,
    effectiveTaxRate,
  };
};

/**
 * Tính ngược Gross từ Net (dùng binary search)
 * @param netIncome Thu nhập Net mong muốn
 * @param dependentCount Số người phụ thuộc
 * @param otherDeductions Khoản giảm trừ khác
 * @returns Kết quả tính thuế đầy đủ
 */
export const calculateFromNet = (
  netIncome: number,
  dependentCount: number,
  otherDeductions: number = 0
): TaxCalculationResult => {
  if (netIncome <= 0) {
    return {
      grossIncome: 0,
      insurance: 0,
      taxableIncome: 0,
      totalDeductions: 0,
      taxableAmount: 0,
      tax: 0,
      netIncome: 0,
      effectiveTaxRate: 0,
    };
  }

  // Binary search để tìm Gross
  let lo = netIncome;
  let hi = netIncome * 3; // Gross tối đa ước lượng

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const result = calculateFromGross(mid, dependentCount, otherDeductions);
    if (Math.abs(result.netIncome - netIncome) < 1) {
      return result;
    }
    if (result.netIncome < netIncome) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return calculateFromGross((lo + hi) / 2, dependentCount, otherDeductions);
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