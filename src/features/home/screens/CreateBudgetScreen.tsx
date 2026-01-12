// src/features/home/screens/CreateBudgetScreen.tsx
import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CreateBudgetScreenProps {
  navigation?: any;
}

const CreateBudgetScreen: React.FC<CreateBudgetScreenProps> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | 'inout'>('expense');
  const [sourceAccount, setSourceAccount] = useState('Tiền mặt');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [timeRange, setTimeRange] = useState('Tháng này (1/12 - 31/12)');
  const [note, setNote] = useState('');
  const [includeInReport, setIncludeInReport] = useState(true);
  const [autoRepeat, setAutoRepeat] = useState(true);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleSelectAccount = () => {
    console.log('Select account');
  };

  const handleSelectCategory = () => {
    console.log('Select category');
  };

  const handleSelectTimeRange = () => {
    console.log('Select time range');
  };

  const handleCreate = () => {
    console.log('Create budget', {
      type: selectedType,
      sourceAccount,
      category,
      amount,
      timeRange,
      note,
      includeInReport,
      autoRepeat,
    });
    handleBack();
  };

  const handleCancel = () => {
    handleBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header - Using AppHeader component */}
        <AppHeader 
          title="Tạo ngân sách"
          onBack={handleBack}
        />

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
                      fontFamily: selectedType === 'income' ? Fonts.semiBold : Fonts.regular,
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
                      fontFamily: selectedType === 'expense' ? Fonts.semiBold : Fonts.regular,
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
                      fontFamily: selectedType === 'inout' ? Fonts.semiBold : Fonts.regular,
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
                <View style={[styles.categoryIcon, { backgroundColor: '#FF6B35' + '20' }]}>
                  <FontAwesome6 name="shopping-bag" size={normalize(16)} color="#FF6B35" />
                </View>
                <CustomText 
                  style={[
                    styles.selectFieldText, 
                    { color: category ? colors.text : colors.icon }
                  ]}
                >
                  {category || 'Shoppe'}
                </CustomText>
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

          {/* Time Range */}
          <View style={styles.section}>
            <CustomText style={[styles.label, { color: colors.text }]}>
              Khoảng thời gian
            </CustomText>
            <TouchableOpacity
              style={[styles.selectField, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSelectTimeRange}
            >
              <CustomText style={[styles.selectFieldText, { color: colors.text }]}>
                {timeRange}
              </CustomText>
              <FontAwesome6 name="chevron-down" size={normalize(14)} color={colors.icon} />
            </TouchableOpacity>
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
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Toggle Options */}
          <View style={[styles.toggleSection, { backgroundColor: colors.card }]}>
            <View style={styles.toggleRow}>
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

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.toggleRow}>
              <CustomText style={[styles.toggleLabel, { color: colors.text }]}>
                Tự động lặp lại
              </CustomText>
              <Switch
                value={autoRepeat}
                onValueChange={setAutoRepeat}
                trackColor={{ false: colors.border, true: colors.tint }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Spacing for bottom buttons */}
          <View style={{ height: hp(12) }} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.tint }]}
            onPress={handleCancel}
          >
            <CustomText style={[styles.cancelButtonText, { color: colors.tint }]}>
              Cancel
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.tint }]}
            onPress={handleCreate}
          >
            <CustomText style={styles.createButtonText}>Create</CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    fontFamily: Fonts.medium,
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
    fontFamily: Fonts.regular,
  },
  categoryIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: Fonts.semiBold,
  },
  amountInput: {
    flex: 1,
    fontSize: normalize(18),
    fontFamily: Fonts.regular,
    padding: 0,
  },
  noteContainer: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
    minHeight: hp(12),
  },
  noteInput: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
    padding: 0,
    minHeight: hp(10),
  },
  toggleSection: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: normalize(16),
  },
  toggleLabel: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },
  divider: {
    height: 1,
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
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
    fontFamily: Fonts.semiBold,
  },
  createButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
    color: '#fff',
  },
});

export default CreateBudgetScreen;