import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import StorageService from '@/services/StorageService';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import ColorPicker, { HueSlider, Panel1 } from 'reanimated-color-picker';

// Preset colors
const PRESET_COLORS = [
  '#3B82F6',
  '#06B6D4',
  '#22C55E',
  '#D97706',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#6366F1',
];

const SelectWalletColorScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();

  const icon = params.icon as string;

  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  // ❗ JS function – chỉ chạy trên RN thread
  const updateColor = useCallback((hex: string) => {
    setSelectedColor(hex);
  }, []);

  const handleContinue = async () => {
    await StorageService.setItem('temp_wallet_color', selectedColor);
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Chọn màu" showBackButton />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Preview */}
        <View style={styles.previewContainer}>
          <View
            style={[
              styles.previewCircle,
              { backgroundColor: selectedColor },
            ]}
          >
            <FontAwesome6
              name={icon as any}
              size={normalize(48)}
              color="#fff"
            />
          </View>

          <CustomText
            style={[styles.colorText, { color: colors.text }]}
          >
            {selectedColor.toUpperCase()}
          </CustomText>
        </View>

        {/* Color Picker */}
        <View style={styles.pickerContainer}>
          <ColorPicker
            value={selectedColor}
            style={styles.colorPicker}
            onComplete={(color) => {
              'worklet';
              scheduleOnRN(updateColor, color.hex);
            }}
          >
            <Panel1 style={styles.panel} />
            <HueSlider style={styles.hueSlider} />
          </ColorPicker>
        </View>

        {/* Preset colors */}
        <View style={styles.section}>
          <CustomText
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Màu sẵn có
          </CustomText>

          <View style={styles.presetColors}>
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.presetColorItem,
                  { backgroundColor: color },
                  selectedColor.toUpperCase() ===
                    color.toUpperCase() && [
                    styles.presetColorSelected,
                    { borderColor: colors.text },
                  ],
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: hp(4) }} />
      </ScrollView>

      {/* Bottom buttons */}
      <View
        style={[
          styles.bottomButtons,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <CustomText
            style={[styles.cancelButtonText, { color: colors.text }]}
          >
            Hủy bỏ
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: colors.tint },
          ]}
          onPress={handleContinue}
        >
          <CustomText style={styles.confirmButtonText}>
            Xác nhận
          </CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    alignItems: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: hp(3),
  },
  previewCircle: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    marginBottom: normalize(12),
  },
  colorText: {
    fontSize: normalize(16),
    fontWeight: '600',
    letterSpacing: 1,
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  colorPicker: {
    width: '100%',
    gap: normalize(16),
  },
  panel: {
    width: normalize(280),
    height: normalize(280),
    borderRadius: normalize(16),
    elevation: 4,
  },
  hueSlider: {
    width: normalize(280),
    height: normalize(40),
    borderRadius: normalize(20),
    elevation: 2,
  },
  section: {
    width: '100%',
    marginTop: hp(1),
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: normalize(12),
    textAlign: 'center',
  },
  presetColors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(12),
    justifyContent: 'center',
  },
  presetColorItem: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    borderWidth: 3,
    borderColor: 'transparent',
  },
  presetColorSelected: {
    borderWidth: 4,
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
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
});

export default SelectWalletColorScreen;
