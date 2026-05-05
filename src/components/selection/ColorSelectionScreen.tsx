import AppHeader from '@/components/base/AppHeader';
import AppIcon from '@/components/base/AppIcon';
import CustomText from '@/components/base/CustomText';
import WalletPreviewCard from '@/components/wallet/WalletPreviewCard';
import { useAppTheme } from '@/core/theme/ThemeContext';
import StorageService from '@/services/StorageService';
import { hp, normalize, wp } from '@/utils/layout';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import ColorPicker, { HueSlider, Panel1 } from 'reanimated-color-picker';

const PRESET_COLORS = [
  '#3B82F6',
  '#06B6D4',
  '#22C55E',
  '#D97706',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#10B981',
];

const SelectWalletColorScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const icon = params.icon as string;
  const type = (params.type as string) || 'WALLET';

  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  const pickerSize = useMemo(() => {
    return Math.min(SCREEN_WIDTH - wp(10), normalize(260));
  }, [SCREEN_WIDTH]);

  const updateColor = useCallback((hex: string) => {
    setSelectedColor(hex);
  }, []);

  const handleContinue = async () => {
    await StorageService.setItem('temp_selected_color', selectedColor);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('selection.select_color')} showBackButton />

      {/* ===== MAIN CONTENT (NO SCROLL) ===== */}
      <View style={styles.content}>
        <View>
          {/* Preview */}
          {type === 'WALLET' ? (
            <WalletPreviewCard
              icon={icon}
              color={selectedColor}
              walletType="Ví theo dõi"
              walletName="Tên ví"
            />
          ) : (
            <View style={styles.categoryPreviewContainer}>
              <View style={[styles.categoryIconPreview, { backgroundColor: selectedColor }]}>
                <AppIcon
                  name={icon as any}
                  size={normalize(33)}
                  color="#fff"
                />
              </View>
            </View>
          )}

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
              <Panel1
                style={[
                  styles.panel,
                  { width: pickerSize, height: pickerSize },
                ]}
              />
              <HueSlider
                style={[
                  styles.hueSlider,
                  { width: pickerSize, marginTop: normalize(14) },
                ]}
              />
            </ColorPicker>
          </View>
        </View>

        {/* Preset colors */}
        <View style={styles.presetContainer}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            {t('selection.preset_colors')}
          </CustomText>

          <View style={styles.presetColors}>
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.presetColorItem,
                  { backgroundColor: color },
                  selectedColor.toUpperCase() === color.toUpperCase() && {
                    borderColor: colors.text,
                  },
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>
      </View>

      {/* ===== BOTTOM BUTTONS ===== */}
      <View
        style={[
          styles.bottomButtons,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <CustomText style={[styles.cancelButtonText, { color: colors.tint }]}>
            {t('selection.cancel')}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={colors.gradientPrimary || colors.gradianBase}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <CustomText style={styles.confirmButtonText}>{t('selection.confirm')}</CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1 },

  content: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(2),
    gap: hp(2),
  },

  previewContainer: {
    alignItems: 'center',
  },

  previewCircle: {
    width: normalize(90),
    height: normalize(90),
    borderRadius: normalize(45),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(10),
    elevation: 6,
  },

  colorText: {
    fontSize: normalize(15),
    fontWeight: '600',
    letterSpacing: 1,
  },

  pickerContainer: {
    alignItems: 'center',
  },

  colorPicker: {
    alignItems: 'center',
  },

  panel: {
    borderRadius: normalize(16),
    elevation: 3,
  },

  hueSlider: {
    height: normalize(36),
    borderRadius: normalize(18),
    elevation: 2,
  },

  presetContainer: {
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: normalize(15),
    fontWeight: '600',
    marginBottom: normalize(12),
  },

  presetColors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(10),
    justifyContent: 'center',
  },

  presetColorItem: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    borderWidth: 3,
    borderColor: 'transparent',
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
    borderRadius: normalize(25),
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
    borderRadius: normalize(25),
    alignItems: 'center',
    overflow: 'hidden',
  },

  confirmButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },

  // Category Preview Styles (from CategoryDetailScreen)
  summaryCard: {
    marginHorizontal: wp(2),
    marginTop: hp(1),
    padding: normalize(20),
    borderRadius: normalize(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: hp(2),
  },
  categoryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    marginBottom: normalize(16),
  },
  categoryIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: normalize(17),
    fontWeight: '700',
    marginBottom: normalize(3),
  },
  categoryMeta: {
    fontSize: normalize(13),
    lineHeight: normalize(18),
  },
  totalAmount: {
    fontSize: normalize(28),
    fontWeight: '700',
  },
  categoryPreviewContainer: {
    alignItems: 'center',
    paddingVertical: hp(3),
  },
  categoryIconPreview: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default SelectWalletColorScreen;
