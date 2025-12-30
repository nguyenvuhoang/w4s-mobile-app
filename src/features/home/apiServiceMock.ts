// Mock API Service for development
import type {
  Budget,
  Category,
  DashboardData,
  Settings,
  StatisticsData,
  Transaction,
} from './types';

// Import BaseResponseModel structure
interface BaseResponse {
  code: string;
  success: boolean;
  message: string;
  data: any;
  execution_id: string;
  timestamp: string;
  errors: any[];
  metadata: any;
}

// Mock Categories
const mockCategories: Category[] = [
  { id: '1', name: 'Mua sắm', icon: '🛒', color: '#FF6B35', type: 'expense' },
  { id: '2', name: 'Thực phẩm', icon: '🍴', color: '#4CAF50', type: 'expense' },
  { id: '3', name: 'Giao thông', icon: '🚗', color: '#2196F3', type: 'expense' },
  { id: '4', name: 'Giải trí', icon: '🎬', color: '#9C27B0', type: 'expense' },
  { id: '5', name: 'Hóa đơn', icon: '💡', color: '#FF9800', type: 'expense' },
  { id: '6', name: 'Y tế', icon: '⚕️', color: '#E91E63', type: 'expense' },
  { id: '7', name: 'Lương', icon: '💰', color: '#4CAF50', type: 'income' },
  { id: '8', name: 'Thưởng', icon: '🎁', color: '#FF9800', type: 'income' },
];

// Mock Transactions
const mockTransactions: Transaction[] = [
  {
    id: '1',
    categoryId: '1',
    category: mockCategories[0],
    amount: 89000,
    type: 'expense',
    note: 'Mua đồ nội thất',
    date: new Date(),
    createdAt: new Date(),
  },
  {
    id: '2',
    categoryId: '7',
    category: mockCategories[6],
    amount: 24200000,
    type: 'income',
    note: 'Lương tháng 12',
    date: new Date(Date.now() - 86400000),
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '3',
    categoryId: '1',
    category: mockCategories[0],
    amount: 6000,
    type: 'expense',
    note: 'Shopee',
    date: new Date(Date.now() - 86400000),
    createdAt: new Date(Date.now() - 86400000),
  },
];

// Mock Dashboard Data
export const mockDashboardData: DashboardData = {
  balance: {
    total: 24582500,
    income: 8420000,
    expense: 3285400,
    month: 'Tháng 12',
  },
  topCategories: [
    {
      categoryId: '1',
      category: mockCategories[0],
      amount: 1248000,
      transactionCount: 32,
      percentage: 38,
    },
    {
      categoryId: '2',
      category: mockCategories[1],
      amount: 842000,
      transactionCount: 28,
      percentage: 26,
    },
    {
      categoryId: '4',
      category: mockCategories[3],
      amount: 425000,
      transactionCount: 15,
      percentage: 13,
    },
  ],
  recentTransactions: mockTransactions,
};

// Mock Budgets
export const mockBudgets: Budget[] = [
  {
    id: '1',
    categoryId: '1',
    category: mockCategories[0],
    amount: 2000000,
    spent: 1248000,
    period: 'month',
    startDate: new Date(2025, 11, 1),
    endDate: new Date(2025, 11, 31),
  },
  {
    id: '2',
    categoryId: '2',
    category: mockCategories[1],
    amount: 1500000,
    spent: 842000,
    period: 'month',
    startDate: new Date(2025, 11, 1),
    endDate: new Date(2025, 11, 31),
  },
  {
    id: '3',
    categoryId: '3',
    category: mockCategories[2],
    amount: 800000,
    spent: 625000,
    period: 'month',
    startDate: new Date(2025, 11, 1),
    endDate: new Date(2025, 11, 31),
  },
  {
    id: '4',
    categoryId: '4',
    category: mockCategories[3],
    amount: 500000,
    spent: 425000,
    period: 'month',
    startDate: new Date(2025, 11, 1),
    endDate: new Date(2025, 11, 31),
  },
];

// Mock Statistics
export const mockStatisticsData: StatisticsData = {
  period: {
    period: 'month',
    startDate: new Date(2025, 11, 1),
    endDate: new Date(2025, 11, 31),
  },
  total: 3285400,
  change: 365400,
  changePercentage: 12.5,
  dailyStats: [
    { date: new Date(), amount: 425000, type: 'expense' },
    { date: new Date(), amount: 625000, type: 'expense' },
    { date: new Date(), amount: 842000, type: 'expense' },
    { date: new Date(), amount: 1248000, type: 'expense' },
    { date: new Date(), amount: 625000, type: 'expense' },
    { date: new Date(), amount: 1395000, type: 'expense' },
    { date: new Date(), amount: 1048000, type: 'expense' },
  ],
  categoryBreakdown: [
    {
      categoryId: '1',
      category: mockCategories[0],
      amount: 1248000,
      transactionCount: 32,
      percentage: 38,
    },
    {
      categoryId: '2',
      category: mockCategories[1],
      amount: 842000,
      transactionCount: 28,
      percentage: 26,
    },
    {
      categoryId: '3',
      category: mockCategories[2],
      amount: 625000,
      transactionCount: 18,
      percentage: 19,
    },
    {
      categoryId: '4',
      category: mockCategories[3],
      amount: 425000,
      transactionCount: 15,
      percentage: 13,
    },
    {
      categoryId: '5',
      category: mockCategories[4],
      amount: 145000,
      transactionCount: 8,
      percentage: 4,
    },
  ],
  monthlyComparison: [
    { month: 'T10', year: 2025, totalExpense: 2850000, totalIncome: 24200000, balance: 21350000 },
    { month: 'T11', year: 2025, totalExpense: 3120000, totalIncome: 24200000, balance: 21080000 },
    { month: 'T12', year: 2025, totalExpense: 3285400, totalIncome: 24200000, balance: 20914600 },
  ],
};

// Mock Settings
export const mockSettings: Settings = {
  notifications: {
    enabled: true,
    transactionAlerts: true,
    budgetAlerts: true,
    weeklyReport: false,
    monthlyReport: true,
  },
  security: {
    biometricEnabled: false,
    pinEnabled: false,
    autoLock: false,
    autoLockTimeout: 5,
  },
  appearance: {
    darkMode: false,
    colorScheme: 'auto',
  },
  currency: {
    code: 'VND',
    symbol: 'đ',
    name: 'Vietnamese Dong',
  },
  language: 'vi',
};

// Helper to create BaseResponse
const createResponse = (data: any, success = true): BaseResponse => ({
  code: success ? '200' : '500',
  success,
  message: success ? 'Success' : 'Error',
  data,
  execution_id: `exec_${Date.now()}`,
  timestamp: new Date().toISOString(),
  errors: [],
  metadata: null,
});

// Mock API Service matching your ApiService structure
export const apiServiceMock = {
  get: async <T>(url: string, config?: any): Promise<{ data: BaseResponse }> => {
    await delay(500);
    
    if (url === '/dashboard') {
      return { data: createResponse(mockDashboardData) };
    }
    if (url === '/transactions') {
      return { data: createResponse(mockTransactions) };
    }
    if (url === '/budgets') {
      return { data: createResponse(mockBudgets) };
    }
    if (url === '/statistics') {
      return { data: createResponse(mockStatisticsData) };
    }
    if (url === '/settings') {
      return { data: createResponse(mockSettings) };
    }
    
    return { data: createResponse(null, false) };
  },

  post: async <T>(url: string, body: any): Promise<{ data: BaseResponse }> => {
    await delay(500);
    
    if (url === '/transactions') {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        categoryId: body.categoryId,
        category: mockCategories.find(c => c.id === body.categoryId)!,
        amount: body.amount,
        type: body.type,
        note: body.note,
        date: body.date || new Date(),
        createdAt: new Date(),
      };
      return { data: createResponse(newTransaction) };
    }
    
    if (url === '/budgets') {
      const newBudget: Budget = {
        id: Date.now().toString(),
        categoryId: body.categoryId,
        category: mockCategories.find(c => c.id === body.categoryId)!,
        amount: body.amount,
        spent: 0,
        period: body.period,
        startDate: body.startDate,
        endDate: new Date(body.startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      };
      return { data: createResponse(newBudget) };
    }
    
    return { data: createResponse(null, false) };
  },

  put: async <T>(url: string, body: any): Promise<{ data: BaseResponse }> => {
    await delay(500);
    
    if (url === '/settings') {
      return { data: createResponse({ ...mockSettings, ...body }) };
    }
    
    if (url.startsWith('/transactions/')) {
      const id = url.split('/')[2];
      const transaction = mockTransactions.find(t => t.id === id);
      if (transaction) {
        return { data: createResponse({ ...transaction, ...body }) };
      }
    }
    
    if (url.startsWith('/budgets/')) {
      const id = url.split('/')[2];
      const budget = mockBudgets.find(b => b.id === id);
      if (budget) {
        return { data: createResponse({ ...budget, ...body }) };
      }
    }
    
    return { data: createResponse(null, false) };
  },

  delete: async <T>(url: string): Promise<{ data: BaseResponse }> => {
    await delay(500);
    return { data: createResponse({ deleted: true }) };
  },
};

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default apiServiceMock;