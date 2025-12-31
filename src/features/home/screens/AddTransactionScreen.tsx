// src/features/home/screens/AddTransactionScreen.tsx
import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/theme';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddTransactionScreenProps {
  navigation: any;
}

type TransactionType = 'income' | 'expense' | 'inout';
type DateSelection = 'today' | 'yesterday';

const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [sourceAccount, setSourceAccount] = useState('Tiền mặt');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dateSelection, setDateSelection] = useState<DateSelection>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminder, setReminder] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [includeInReport, setIncludeInReport] = useState(true);
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

  const categories = selectedType === 'expense' ? expenseCategories : incomeCategories;

  const handleSelectAccount = () => {
    console.log('Select account');
  };

  const handleSelectCategory = () => {
    setShowCategoryModal(true);
  };

  const handlePreviousDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleSetReminder = () => {
    console.log('Set reminder');
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Cần quyền truy cập thư viện ảnh!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleCreate = () => {
    console.log('Create transaction', {
      type: selectedType,
      sourceAccount,
      category: selectedCategory,
      amount,
      note,
      dateSelection,
      selectedDate,
      reminder,
      imageUri,
      includeInReport,
    });
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString('vi-VN', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <AppHeader title="Thêm giao dịch"/>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <View style={styles.section}>
            <View style={styles.typeSelectorContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { 
                    backgroundColor: selectedType === 'income' ? colors.tint : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedType('income')}
              >
                <CustomText
                  style={[
                    styles.typeButtonText,
                    {
                      color: selectedType === 'income' ? '#fff' : colors.text,
                      fontFamily: selectedType === 'income' ? Fonts.family.semiBold : Fonts.family.regular,
                    },
                  ]}
                >
                  Khoản thu
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { 
                    backgroundColor: selectedType === 'expense' ? colors.tint : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedType('expense')}
              >
                <CustomText
                  style={[
                    styles.typeButtonText,
                    {
                      color: selectedType === 'expense' ? '#fff' : colors.text,
                      fontFamily: selectedType === 'expense' ? Fonts.family.semiBold : Fonts.family.regular,
                    },
                  ]}
                >
                  Khoản chi
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { 
                    backgroundColor: selectedType === 'inout' ? colors.tint : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedType('inout')}
              >
                <CustomText
                  style={[
                    styles.typeButtonText,
                    {
                      color: selectedType === 'inout' ? '#fff' : colors.text,
                      fontFamily: selectedType === 'inout' ? Fonts.family.semiBold : Fonts.family.regular,
                    },
                  ]}
                >
                  Vay/Nợ
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Source Account */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Nguồn tiền
            </CustomText>
            <TouchableOpacity
              style={[styles.selectField, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSelectAccount}
            >
              <View style={styles.selectFieldLeft}>
                <FontAwesome6 name="money-bill-wave" size={normalize(18)} color="#4CAF50" solid />
                <CustomText style={[styles.selectFieldText, { color: colors.text }]}>
                  {sourceAccount}
                </CustomText>
              </View>
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Nhóm
            </CustomText>
            <TouchableOpacity
              style={[styles.selectField, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSelectCategory}
            >
              <View style={styles.selectFieldLeft}>
                {selectedCategoryData ? (
                  <>
                    <View style={[styles.categoryIcon, { backgroundColor: selectedCategoryData.color + '20' }]}>
                      <CustomText style={styles.categoryEmoji}>{selectedCategoryData.icon}</CustomText>
                    </View>
                    <CustomText style={[styles.selectFieldText, { color: colors.text }]}>
                      {selectedCategoryData.name}
                    </CustomText>
                  </>
                ) : (
                  <>
                    <View style={[styles.categoryIcon, { backgroundColor: '#FF6B35' + '20' }]}>
                      <FontAwesome6 name="shopping-bag" size={normalize(16)} color="#FF6B35" />
                    </View>
                    <CustomText style={[styles.selectFieldText, { color: colors.icon }]}>
                      Shoppe
                    </CustomText>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Số tiền
            </CustomText>
            <View style={[styles.amountContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <CustomText style={[styles.currencySymbol, { color: colors.tint }]}>
                đ
              </CustomText>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Ghi chú
            </CustomText>
            <View style={[styles.noteContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.noteInput, { color: colors.text }]}
                placeholder="Thêm ghi chú (tùy chọn)"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Ngày
            </CustomText>
            <View style={styles.dateSelectionContainer}>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: dateSelection === 'today' ? colors.tint : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setDateSelection('today')}
              >
                <CustomText
                  style={[
                    styles.dateButtonText,
                    {
                      color: dateSelection === 'today' ? '#fff' : colors.text,
                      fontFamily: dateSelection === 'today' ? Fonts.family.semiBold : Fonts.family.regular,
                    },
                  ]}
                >
                  Hôm nay
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: dateSelection === 'yesterday' ? colors.tint : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setDateSelection('yesterday')}
              >
                <CustomText
                  style={[
                    styles.dateButtonText,
                    {
                      color: dateSelection === 'yesterday' ? '#fff' : colors.text,
                      fontFamily: dateSelection === 'yesterday' ? Fonts.family.semiBold : Fonts.family.regular,
                    },
                  ]}
                >
                  Hôm qua
                </CustomText>
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={handlePreviousDate} style={styles.dateArrow}>
                <FontAwesome6 name="chevron-left" size={normalize(16)} color={colors.text} />
              </TouchableOpacity>
              
              <CustomText style={[styles.dateText, { color: colors.text }]}>
                {formatDate(selectedDate)}
              </CustomText>
              
              <TouchableOpacity onPress={handleNextDate} style={styles.dateArrow}>
                <FontAwesome6 name="chevron-right" size={normalize(16)} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reminder */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Nhắc nhở
            </CustomText>
            <TouchableOpacity
              style={[styles.reminderButton, { backgroundColor: colors.card, borderColor: colors.tint }]}
              onPress={handleSetReminder}
            >
              <FontAwesome6 name="bell" size={normalize(16)} color={colors.tint} />
              <CustomText style={[styles.reminderText, { color: colors.tint }]}>
                {reminder || 'Đặt nhắc nhở'}
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* Image Upload */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Label
            </CustomText>
            {imageUri ? (
              <View style={[styles.imagePreviewContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={[styles.removeImageButton, { backgroundColor: colors.background }]}
                  onPress={handleRemoveImage}
                >
                  <FontAwesome6 name="xmark" size={normalize(12)} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.imageUploadButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handlePickImage}
              >
                <FontAwesome6 name="image" size={normalize(32)} color={colors.icon} />
                <CustomText style={[styles.imageUploadText, { color: colors.icon }]}>
                  Tải lên
                </CustomText>
              </TouchableOpacity>
            )}
          </View>

          {/* Include in Report Toggle */}
          <View style={[styles.toggleContainer, { backgroundColor: colors.card }]}>
            <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
              Tính vào báo cáo
            </CustomText>
            <Switch
              value={includeInReport}
              onValueChange={setIncludeInReport}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>

          {/* Spacing for bottom buttons */}
          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtons, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.tint }]}
            onPress={handleCancel}
          >
            <CustomText style={[styles.cancelButtonText, { color: colors.tint }]}>
              Hủy
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.tint }]}
            onPress={handleCreate}
          >
            <CustomText style={styles.createButtonText}>Tạo</CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <CustomText style={[styles.modalTitle, { color: colors.text }]}>
                Chọn danh mục
              </CustomText>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <FontAwesome6 name="xmark" size={normalize(24)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryGrid}>
              <View style={styles.categoryRow}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      selectedCategory === category.id && { borderColor: colors.tint, backgroundColor: colors.tint + '15' },
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
                    <CustomText style={[styles.categoryCardName, { color: colors.text }]}>
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
  },
  label: {
    fontSize: normalize(14),
    fontFamily: Fonts.family.medium,
    marginBottom: normalize(8),
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    gap: normalize(8),
  },
  typeButton: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(20),
    alignItems: 'center',
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: normalize(13),
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  selectFieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    flex: 1,
  },
  selectFieldText: {
    fontSize: normalize(15),
    fontFamily: Fonts.family.regular,
  },
  categoryIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: normalize(20),
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    borderWidth: 1,
    gap: normalize(12),
  },
  currencySymbol: {
    fontSize: normalize(20),
    fontFamily: Fonts.family.semiBold,
  },
  amountInput: {
    flex: 1,
    fontSize: normalize(18),
    fontFamily: Fonts.family.regular,
    padding: 0,
  },
  noteContainer: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
    minHeight: hp(10),
  },
  noteInput: {
    fontSize: normalize(14),
    fontFamily: Fonts.family.regular,
    padding: 0,
    minHeight: hp(8),
  },
  dateSelectionContainer: {
    flexDirection: 'row',
    gap: normalize(8),
    marginBottom: normalize(12),
  },
  dateButton: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(12),
    alignItems: 'center',
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: normalize(14),
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
  },
  dateArrow: {
    padding: normalize(8),
  },
  dateText: {
    fontSize: normalize(15),
    fontFamily: Fonts.family.medium,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
  },
  reminderText: {
    fontSize: normalize(14),
    fontFamily: Fonts.family.medium,
  },
  imageUploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(40),
    borderRadius: normalize(12),
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  imageUploadText: {
    fontSize: normalize(14),
    fontFamily: Fonts.family.regular,
    marginTop: normalize(8),
  },
  imagePreviewContainer: {
    borderRadius: normalize(12),
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: normalize(150),
    borderRadius: normalize(12),
  },
  removeImageButton: {
    position: 'absolute',
    top: normalize(8),
    right: normalize(8),
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: normalize(16),
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderRadius: normalize(12),
  },
  toggleLabel: {
    fontSize: normalize(15),
    fontFamily: Fonts.family.regular,
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: normalize(12),
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: normalize(16),
    fontFamily: Fonts.family.semiBold,
  },
  createButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: normalize(16),
    fontFamily: Fonts.family.semiBold,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    paddingTop: hp(2.5),
    maxHeight: hp(80),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginBottom: hp(2.5),
  },
  modalTitle: {
    fontSize: normalize(20),
    fontFamily: Fonts.family.semiBold,
  },
  categoryGrid: {
    paddingHorizontal: wp(5),
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(12),
    paddingBottom: hp(3),
  },
  categoryCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
    padding: normalize(12),
    borderWidth: 2,
  },
  categoryIconLarge: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(8),
  },
  categoryEmojiLarge: {
    fontSize: normalize(24),
  },
  categoryCardName: {
    fontSize: normalize(12),
    textAlign: 'center',
  },
});

export default AddTransactionScreen;