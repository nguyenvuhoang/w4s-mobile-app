import CustomButton from '@/components/base/CustomButton';
import CustomText from '@/components/base/CustomText';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddTransactionScreenProps {
  navigation: any;
}

const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ navigation }) => {
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const expenseCategories = [
    { id: '1', name: 'Mua sắm', icon: '🛒', color: '#FF6B35' },
    { id: '2', name: 'Thực phẩm', icon: '🍴', color: '#4CAF50' },
    { id: '3', name: 'Giao thông', icon: '🚗', color: '#2196F3' },
    { id: '4', name: 'Giải trí', icon: '🎬', color: '#9C27B0' },
    { id: '5', name: 'Hóa đơn', icon: '💡', color: '#FF9800' },
    { id: '6', name: 'Y tế', icon: '⚕️', color: '#E91E63' },
    { id: '7', name: 'Giáo dục', icon: '📚', color: '#3F51B5' },
    { id: '8', name: 'Khác', icon: '📌', color: '#9E9E9E' },
  ];

  const incomeCategories = [
    { id: '1', name: 'Lương', icon: '💰', color: '#4CAF50' },
    { id: '2', name: 'Thưởng', icon: '🎁', color: '#FF9800' },
    { id: '3', name: 'Đầu tư', icon: '📈', color: '#2196F3' },
    { id: '4', name: 'Khác', icon: '💵', color: '#9E9E9E' },
  ];

  const categories = transactionType === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = () => {
    // Handle transaction submission
    console.log({
      type: transactionType,
      amount,
      category: selectedCategory,
      note,
      date,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <CustomText style={styles.headerTitle}>Thêm giao dịch</CustomText>
          <View style={{ width: 28 }} />
        </View>

        {/* Transaction Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              transactionType === 'expense' && styles.typeButtonExpense,
            ]}
            onPress={() => setTransactionType('expense')}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={transactionType === 'expense' ? '#fff' : '#FF3B30'}
            />
            <CustomText
              style={[
                styles.typeText,
                transactionType === 'expense' && styles.typeTextActive,
              ]}
            >
              Chi tiêu
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              transactionType === 'income' && styles.typeButtonIncome,
            ]}
            onPress={() => setTransactionType('income')}
          >
            <Ionicons
              name="arrow-down"
              size={20}
              color={transactionType === 'income' ? '#fff' : '#34C759'}
            />
            <CustomText
              style={[
                styles.typeText,
                transactionType === 'income' && styles.typeTextActive,
              ]}
            >
              Thu nhập
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <CustomText style={styles.amountLabel}>Số tiền</CustomText>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#C7C7CC"
            />
            <CustomText style={styles.currency}>đ</CustomText>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <CustomText style={styles.sectionLabel}>Danh mục</CustomText>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            {selectedCategory ? (
              <View style={styles.selectedCategory}>
                <View
                  style={[
                    styles.categoryIconSmall,
                    {
                      backgroundColor:
                        categories.find((c) => c.id === selectedCategory)?.color + '20',
                    },
                  ]}
                >
                  <CustomText style={styles.categoryEmojiSmall}>
                    {categories.find((c) => c.id === selectedCategory)?.icon}
                  </CustomText>
                </View>
                <CustomText style={styles.categoryName}>
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </CustomText>
              </View>
            ) : (
              <CustomText style={styles.placeholderText}>Chọn danh mục</CustomText>
            )}
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <CustomText style={styles.sectionLabel}>Ngày</CustomText>
          <TouchableOpacity style={styles.dateSelector}>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <CustomText style={styles.dateText}>
              {date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </CustomText>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Note Input */}
        <View style={styles.section}>
          <CustomText style={styles.sectionLabel}>Ghi chú</CustomText>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Thêm ghi chú (tùy chọn)"
            placeholderTextColor="#C7C7CC"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <CustomButton
          title="Lưu giao dịch"
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <CustomText style={styles.modalTitle}>Chọn danh mục</CustomText>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryGrid}>
              <View style={styles.categoryRow}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      selectedCategory === category.id && styles.categoryCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(category.id);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View
                      style={[
                        styles.categoryIconLarge,
                        { backgroundColor: category.color + '20' },
                      ]}
                    >
                      <CustomText style={styles.categoryEmojiLarge}>
                        {category.icon}
                      </CustomText>
                    </View>
                    <CustomText style={styles.categoryCardName}>
                      {category.name}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  typeSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonExpense: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  typeButtonIncome: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  typeTextActive: {
    color: '#fff',
  },
  amountContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmojiSmall: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#C7C7CC',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  categoryGrid: {
    paddingHorizontal: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  categoryCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  categoryIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryEmojiLarge: {
    fontSize: 24,
  },
  categoryCardName: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },
});

export default AddTransactionScreen;