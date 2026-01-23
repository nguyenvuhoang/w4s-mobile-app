# 📘 Guide: Sử dụng Currency Converter cho các màn hình khác

## 🎯 Tổng quan

Hệ thống currency converter tự động:
1. ✅ Convert VND (từ server) → Currency user chọn
2. ✅ Format đúng locale (vi-VN, en-US, etc)
3. ✅ Auto update khi user đổi currency
4. ✅ Hỗ trợ 40+ currencies

---

## 📦 Setup (Đã hoàn thành)

### Files đã có:
```
src/
├── services/
│   ├── CurrencyEventEmitter.ts          ← Event system
│   └── DefaultCurrencyService.ts        ← Storage service
├── hooks/
│   ├── useDefaultCurrency.ts            ← Currency state + events
│   └── useCurrencyConverter.ts          ← Conversion + formatting
└── utils/
    └── currencyLocaleDetector.ts        ← Smart locale detection
```

---

## 🚀 Cách sử dụng cho màn hình mới

### **Step 1: Import hook**

```typescript
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
```

### **Step 2: Sử dụng trong component**

```typescript
const YourScreen = () => {
  // Get converter functions
  const { 
    convertAndFormat,    // Convert VND -> default currency và format
    formatAmount,        // Chỉ format (không convert)
    formatPercent,       // Format phần trăm
    isReady,            // Check nếu ready
    defaultCurrency,    // Current currency info
    loading,            // Loading state
  } = useCurrencyConverter();

  // Fetch data từ API (luôn là VND)
  const { data } = useYourAPI();

  return (
    <View>
      {/* Hiển thị số tiền đã convert */}
      <Text>
        {isReady ? convertAndFormat(data.amountInVND) : 'Loading...'}
      </Text>
    </View>
  );
};
```

---

## 📚 Các Functions chính

### **1. convertAndFormat(amountInVND)**

**Mục đích:** Convert VND → default currency và format.

**Input:** Số tiền VND từ server  
**Output:** String đã format

```typescript
// User chọn VND:
convertAndFormat(15648600)  // → "15.648.600 ₫"

// User chọn USD:
convertAndFormat(15648600)  // → "$625.94"

// User chọn EUR:
convertAndFormat(15648600)  // → "579,58 €"
```

**Khi nào dùng:** 
- ✅ Hiển thị số tiền từ API (luôn là VND)
- ✅ Balance, income, expense, transaction amount
- ✅ Category totals, reports

### **2. formatAmount(amount)**

**Mục đích:** Chỉ format, không convert.

**Input:** Số tiền đã đúng currency  
**Output:** String đã format

```typescript
// Số tiền đã đúng currency
const amountInUSD = 625.94;
formatAmount(amountInUSD)  // → "$625.94"

const amountInVND = 15648600;
formatAmount(amountInVND)  // → "15.648.600 ₫"
```

**Khi nào dùng:**
- ✅ Khi đã convert rồi, chỉ cần format
- ✅ Input fields (user nhập số)
- ✅ Display calculated values

### **3. formatPercent(percent)**

**Mục đích:** Format phần trăm với dấu +/-

```typescript
formatPercent(25.5)   // → "+25.5%"
formatPercent(-10.2)  // → "-10.2%"
formatPercent(0)      // → "+0.0%"
```

**Khi nào dùng:**
- ✅ Change percentage
- ✅ Growth rate
- ✅ Statistics

### **4. getExchangeRate()**

**Mục đích:** Lấy tỷ giá VND → default currency

```typescript
const rate = getExchangeRate();
// VND: 1
// USD: 25000 (1 USD = 25,000 VND)
// EUR: 27000
```

**Khi nào dùng:**
- ✅ Hiển thị exchange rate
- ✅ Manual conversion
- ✅ Debugging

### **5. convertBetween(amount, fromCurrency, toCurrency?)**

**Mục đích:** Convert giữa 2 currencies bất kỳ

```typescript
// Convert 100 USD sang EUR
convertBetween(100, 'USD', 'EUR')  // → 92.5

// Convert 100 USD sang default currency
convertBetween(100, 'USD')  // → Depends on default
```

**Khi nào dùng:**
- ✅ Multi-currency transactions
- ✅ Currency calculator
- ✅ Advanced features

---

## 💡 Examples thực tế

### **Example 1: Transaction List Screen**

```typescript
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useTransactions } from '@/hooks/useTransactions';

const TransactionListScreen = () => {
  const { convertAndFormat, formatPercent, isReady } = useCurrencyConverter();
  const { transactions, loading } = useTransactions();

  if (loading || !isReady) {
    return <LoadingSpinner />;
  }

  return (
    <FlatList
      data={transactions}
      renderItem={({ item }) => (
        <TransactionItem
          title={item.description}
          // Server trả về VND, convert sang default currency
          amount={convertAndFormat(item.amount)}  // ← Dùng convertAndFormat
          date={formatDate(item.date)}
          type={item.type}
        />
      )}
    />
  );
};
```

### **Example 2: Budget Screen**

```typescript
const BudgetScreen = () => {
  const { convertAndFormat, formatPercent, isReady } = useCurrencyConverter();
  const { budget, spent } = useBudget();

  const remaining = budget - spent;
  const percentSpent = (spent / budget) * 100;

  return (
    <View>
      <Text>Budget: {isReady ? convertAndFormat(budget) : '...'}</Text>
      <Text>Spent: {isReady ? convertAndFormat(spent) : '...'}</Text>
      <Text>Remaining: {isReady ? convertAndFormat(remaining) : '...'}</Text>
      <Text>Progress: {formatPercent(percentSpent)}</Text>
      
      <ProgressBar 
        progress={percentSpent / 100}
        color={percentSpent > 80 ? 'red' : 'green'}
      />
    </View>
  );
};
```

### **Example 3: Statistics Screen**

```typescript
const StatisticsScreen = () => {
  const { convertAndFormat, formatPercent, isReady } = useCurrencyConverter();
  const { stats } = useStatistics();

  return (
    <ScrollView>
      {/* Total Summary */}
      <Card>
        <Text>Total Income</Text>
        <Text style={styles.amount}>
          {isReady ? convertAndFormat(stats.totalIncome) : '...'}
        </Text>
        <Text style={styles.change}>
          {formatPercent(stats.incomeChangePercent)}
        </Text>
      </Card>

      <Card>
        <Text>Total Expense</Text>
        <Text style={styles.amount}>
          {isReady ? convertAndFormat(stats.totalExpense) : '...'}
        </Text>
        <Text style={styles.change}>
          {formatPercent(stats.expenseChangePercent)}
        </Text>
      </Card>

      {/* Category Breakdown */}
      <Text style={styles.sectionTitle}>By Category</Text>
      {stats.categories.map((cat) => (
        <CategoryRow
          key={cat.id}
          name={cat.name}
          amount={isReady ? convertAndFormat(cat.total) : '...'}
          percentage={formatPercent(cat.percentage)}
        />
      ))}
    </ScrollView>
  );
};
```

### **Example 4: Report Screen với Chart**

```typescript
const ReportScreen = () => {
  const { convertAndFormat, isReady, defaultCurrency } = useCurrencyConverter();
  const { reportData } = useReport();

  // Prepare data cho chart
  const chartData = reportData.map(item => ({
    label: item.month,
    value: item.amount,  // Keep in VND for chart calculation
  }));

  return (
    <View>
      {/* Chart (dùng VND để consistent) */}
      <LineChart
        data={chartData}
        // Chart tooltips - convert khi hiển thị
        formatYLabel={(value) => 
          isReady ? convertAndFormat(value) : value.toString()
        }
      />

      {/* Summary cards */}
      <View style={styles.summary}>
        <SummaryCard
          title="Average"
          value={isReady ? convertAndFormat(reportData.average) : '...'}
        />
        <SummaryCard
          title="Highest"
          value={isReady ? convertAndFormat(reportData.max) : '...'}
        />
        <SummaryCard
          title="Lowest"
          value={isReady ? convertAndFormat(reportData.min) : '...'}
        />
      </View>

      {/* Hiển thị currency đang dùng */}
      <Text style={styles.note}>
        All amounts in {defaultCurrency.name} ({defaultCurrency.symbol})
      </Text>
    </View>
  );
};
```

### **Example 5: Input Form (Create Transaction)**

```typescript
const CreateTransactionScreen = () => {
  const { 
    convertAndFormat, 
    defaultCurrency,
    isReady,
  } = useCurrencyConverter();
  
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);

  // Wallet có thể dùng currency khác
  const needsConversion = selectedWallet?.currency !== defaultCurrency.currencyId;

  return (
    <View>
      {/* Amount Input */}
      <View>
        <Text>Amount</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.symbol}>{defaultCurrency.symbol}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>
      </View>

      {/* Conversion Preview */}
      {needsConversion && amount && (
        <View style={styles.conversionHint}>
          <Text>
            Will be saved as: {selectedWallet.currency} {amount}
          </Text>
        </View>
      )}

      {/* Submit */}
      <Button
        title="Create Transaction"
        onPress={() => {
          // Submit với amount trong default currency
          createTransaction({
            amount: parseFloat(amount),
            currency: defaultCurrency.currencyId,
            // ... other fields
          });
        }}
      />
    </View>
  );
};
```

---

## ⚡ Best Practices

### **1. Always check `isReady` before display**

```typescript
// ✅ GOOD
{isReady ? convertAndFormat(amount) : 'Loading...'}

// ❌ BAD - có thể show wrong value khi currency chưa load
{convertAndFormat(amount)}
```

### **2. Use loading states properly**

```typescript
const isLoading = dataLoading || !isReady;

if (isLoading) {
  return <LoadingSpinner />;
}

// Render content với data đã ready
```

### **3. Simplify inline rendering**

```typescript
// ✅ GOOD - clean and readable
<Text>{isReady ? convertAndFormat(amount) : '...'}</Text>

// ❌ BAD - quá dài, khó đọc
<Text>
  {isReady ? (
    convertAndFormat(amount)
  ) : (
    <ActivityIndicator />
  )}
</Text>
```

### **4. Use memo cho expensive lists**

```typescript
const TransactionItem = React.memo(({ transaction }) => {
  const { convertAndFormat } = useCurrencyConverter();
  
  return (
    <View>
      <Text>{convertAndFormat(transaction.amount)}</Text>
    </View>
  );
});

// Prevents re-render của tất cả items khi 1 item change
```

### **5. Show currency hint khi cần**

```typescript
<View>
  <Text style={styles.amount}>
    {convertAndFormat(amount)}
  </Text>
  <Text style={styles.currencyHint}>
    ({defaultCurrency.currencyId})
  </Text>
</View>
```

---

## 🎨 UI Patterns

### **Pattern 1: Balance Card**

```typescript
<Card>
  <Text style={styles.label}>Total Balance</Text>
  <Text style={styles.amount}>
    {isReady ? convertAndFormat(balance) : <Skeleton />}
  </Text>
  <Text style={styles.currency}>{defaultCurrency.name}</Text>
</Card>
```

### **Pattern 2: Income/Expense Summary**

```typescript
<View style={styles.summary}>
  <View style={styles.incomeBox}>
    <Icon name="arrow-up" color="green" />
    <Text style={styles.label}>Income</Text>
    <Text style={styles.amount}>
      +{isReady ? convertAndFormat(income) : '...'}
    </Text>
    {incomeChange !== 0 && (
      <Text style={styles.change}>
        {formatPercent(incomeChange)}
      </Text>
    )}
  </View>
  
  <View style={styles.expenseBox}>
    <Icon name="arrow-down" color="red" />
    <Text style={styles.label}>Expense</Text>
    <Text style={styles.amount}>
      -{isReady ? convertAndFormat(expense) : '...'}
    </Text>
    {expenseChange !== 0 && (
      <Text style={styles.change}>
        {formatPercent(expenseChange)}
      </Text>
    )}
  </View>
</View>
```

### **Pattern 3: Transaction List Item**

```typescript
<TouchableOpacity style={styles.transactionItem}>
  <View style={styles.iconContainer}>
    <Icon name={category.icon} color={category.color} />
  </View>
  
  <View style={styles.info}>
    <Text style={styles.title}>{description}</Text>
    <Text style={styles.date}>{formatDate(date)}</Text>
  </View>
  
  <Text style={[
    styles.amount,
    type === 'income' ? styles.positive : styles.negative
  ]}>
    {type === 'income' ? '+' : '-'}
    {isReady ? convertAndFormat(amount) : '...'}
  </Text>
</TouchableOpacity>
```

---

## 🔄 Auto-Update Flow

Khi user đổi currency ở Settings:

```
1. User chọn USD ở CurrencySettings
   ↓
2. updateDefaultCurrency({ currencyId: 'USD', ... })
   ↓
3. CurrencyEventEmitter.emitCurrencyChanged('USD')
   ↓
4. useDefaultCurrency receives event
   ↓
5. Reload từ storage
   ↓
6. Update state → defaultCurrency = USD
   ↓
7. useCurrencyConverter detects change
   ↓
8. Fetch USD currency data nếu chưa có
   ↓
9. Update formatter, functions
   ↓
10. ALL screens using useCurrencyConverter re-render
   ↓
11. UI updates: "15.648.600 ₫" → "$625.94" ✅
```

**Bạn KHÔNG cần làm gì thêm!** Tất cả screens tự động update.

---

## 🧪 Testing

### **Test currency conversion:**

```typescript
describe('Currency Converter', () => {
  it('should convert VND to USD', () => {
    const { convertAndFormat } = useCurrencyConverter();
    
    // Mock: User chọn USD, rate = 25000
    const result = convertAndFormat(25000000);
    
    expect(result).toBe('$1,000.00');
  });

  it('should not convert VND to VND', () => {
    const { convertAndFormat } = useCurrencyConverter();
    
    // Mock: User chọn VND
    const result = convertAndFormat(25000000);
    
    expect(result).toBe('25.000.000 ₫');
  });
});
```

---

## 📝 Checklist cho màn hình mới

Khi implement màn hình mới có hiển thị số tiền:

- [ ] Import `useCurrencyConverter`
- [ ] Get `convertAndFormat`, `isReady` từ hook
- [ ] Check `isReady` trước khi render
- [ ] Dùng `convertAndFormat` cho amounts từ API (VND)
- [ ] Dùng `formatPercent` cho change percentages
- [ ] Add loading state khi `!isReady`
- [ ] Test với different currencies (VND, USD, EUR)
- [ ] Check auto-update khi đổi currency

---

## 🎓 Summary

### **Core Concept:**
- Server luôn trả về **VND**
- Hook tự động **convert** sang currency user chọn
- Hook tự động **format** đúng locale
- Hook tự động **update** khi user đổi currency

### **Main Hook:**
```typescript
const {
  convertAndFormat,  // VND → default currency + format
  formatAmount,      // Format only
  formatPercent,     // Format %
  isReady,          // Ready state
  defaultCurrency,  // Current currency info
} = useCurrencyConverter();
```

### **Usage:**
```typescript
{isReady ? convertAndFormat(amountFromAPI) : 'Loading...'}
```

### **That's it!** 🎉

---

**Questions?** Check logs với pattern `[useCurrencyConverter]` để debug.

**Version:** 1.0.0  
**Last Updated:** January 2026
