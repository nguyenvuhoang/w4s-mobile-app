import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import StorageService from '@/services/StorageService';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// FontAwesome 6 finance/money related icons
const WALLET_ICONS = [
  'wallet', 'piggy-bank', 'money-bill-1', 'money-bill-wave', 'coins',
  'credit-card', 'building-columns', 'hand-holding-dollar', 'sack-dollar', 'chart-line',
  'chart-pie', 'landmark', 'cash-register', 'money-check', 'money-check-dollar',
  'vault', 'donate', 'gift', 'handshake', 'circle-dollar-to-slot',
  'money-bill-transfer', 'money-bill-trend-up', 'arrow-trend-up', 'arrow-trend-down', 'scale-balanced',
  'receipt', 'file-invoice-dollar', 'shopping-cart', 'store', 'briefcase',
  'house', 'car', 'plane', 'ship', 'bicycle',
  'book', 'graduation-cap', 'heart', 'utensils', 'coffee',
  'film', 'gamepad', 'music', 'dumbbell', 'basketball',
  'football', 'baseball', 'trophy', 'medal', 'star',
  'fire', 'bolt', 'cloud', 'sun', 'moon',
  'leaf', 'tree', 'seedling', 'paw', 'cat',
  'dog', 'fish', 'horse', 'crown', 'gem',
  'ring', 'glasses', 'shirt', 'shoe-prints', 'umbrella',
  'key', 'lock', 'unlock', 'shield', 'user',
  'users', 'user-tie', 'user-doctor', 'user-graduate', 'baby',
  'child', 'person', 'location-dot', 'map-marker-alt', 'globe',
  'phone', 'mobile', 'laptop', 'desktop', 'tablet',
  'camera', 'image', 'video', 'headphones', 'microphone',
  'bell', 'envelope', 'comment', 'comments', 'thumbs-up',
  'heart-pulse', 'pills', 'syringe', 'stethoscope', 'bandage',
  'tooth', 'bone', 'brain', 'eye', 'hand',
];

// ================= SCREEN =================
const SelectWalletIconScreen: React.FC = () => {
  const { colors } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('wallet');

  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  // ===== Column calculation =====
  const numColumns = useMemo(() => {
    const iconSize = normalize(56);
    const gap = normalize(8);
    const horizontalPadding = wp(5) * 2;

    const availableWidth = SCREEN_WIDTH - horizontalPadding;
    const columns = Math.floor((availableWidth + gap) / (iconSize + gap));

    return Math.max(4, Math.min(8, columns));
  }, [SCREEN_WIDTH]);

  // ===== ITEM SIZE =====
  const GAP = normalize(8);
  const H_PADDING = wp(5) * 2;

  const ITEM_SIZE = useMemo(() => {
    const availableWidth = SCREEN_WIDTH - H_PADDING;
    return (availableWidth - GAP * (numColumns - 1)) / numColumns;
  }, [SCREEN_WIDTH, numColumns]);

  const filteredIcons = WALLET_ICONS.filter(icon =>
    icon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = async () => {
    await StorageService.setItem('temp_selected_icon', selectedIcon);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Chọn Icon" showBackButton />

      <View style={styles.content}>
        {/* ===== SEARCH ===== */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <FontAwesome6 name="magnifying-glass" size={normalize(16)} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm icon..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome6 name="xmark" size={normalize(16)} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* ===== ICON GRID ===== */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.iconGridContainer}
        >
          <View style={styles.iconGrid}>
            {filteredIcons.map(icon => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconItem,
                  {
                    width: ITEM_SIZE,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    height: ITEM_SIZE
                  },
                  selectedIcon === icon && {
                    borderColor: colors.tint,
                    backgroundColor: colors.tint + '10',
                  },
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <FontAwesome6
                  name={icon as any}
                  size={normalize(24)}
                  color={selectedIcon === icon ? colors.tint : colors.text}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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

// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    borderWidth: 1,
    marginTop: hp(2),
    marginBottom: hp(2),
    gap: normalize(12),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(15),
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  iconGridContainer: {
    paddingBottom: hp(2),
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  iconItem: {
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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

export default SelectWalletIconScreen;