import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import StorageService from '@/services/StorageService';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Preset colors
const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#22C55E', // Green
  '#D97706', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Purple
];

const SelectWalletColorScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();
  const walletType = params.walletType as string;
  const icon = params.icon as string;
  
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const handleContinue = async () => {
    await StorageService.setItem('temp_wallet_color', selectedColor);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Chọn màu" showBackButton />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Color Preview */}
        <View style={styles.previewContainer}>
          <View style={[styles.previewCircle, { backgroundColor: selectedColor }]}>
            <FontAwesome6 name={icon as any} size={normalize(48)} color="#fff" />
          </View>
        </View>

        {/* Color Gradient Circle (Visual representation) */}
        <View style={styles.gradientContainer}>
          <View style={[styles.gradientCircle, { 
            background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          }]}>
            <View style={styles.gradientInner}>
              <TouchableOpacity 
                style={[styles.colorSelector, { backgroundColor: selectedColor }]} 
              />
            </View>
          </View>
        </View>

        {/* Color Slider (Brightness/Saturation) */}
        <View style={styles.sliderContainer}>
          <View style={styles.slider}>
            <View 
              style={[
                styles.sliderTrack,
                { 
                  background: `linear-gradient(to right, #f0f0f0, ${selectedColor})` 
                }
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.sliderThumb, 
                  { 
                    backgroundColor: selectedColor,
                    borderColor: '#fff',
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Preset Colors */}
        <View style={styles.presetColors}>
          {PRESET_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.presetColorItem,
                { backgroundColor: color },
                selectedColor === color && [
                  styles.presetColorSelected,
                  { 
                    borderColor: '#fff',
                    shadowColor: color 
                  }
                ]
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        <View style={{ height: hp(4) }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <CustomText style={[styles.cancelButtonText, { color: colors.text }]}>
            Hủy bỏ
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.tint }]}
          onPress={handleContinue}
        >
          <CustomText style={styles.confirmButtonText}>Xác nhận</CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
    alignItems: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  previewCircle: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  gradientCircle: {
    width: normalize(280),
    height: normalize(280),
    borderRadius: normalize(140),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelector: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: wp(2),
    marginBottom: hp(3),
  },
  slider: {
    height: normalize(8),
    borderRadius: normalize(4),
  },
  sliderTrack: {
    flex: 1,
    borderRadius: normalize(4),
    position: 'relative',
  },
  sliderThumb: {
    position: 'absolute',
    left: '50%',
    top: -normalize(6),
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  presetColors: {
    flexDirection: 'row',
    gap: normalize(16),
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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