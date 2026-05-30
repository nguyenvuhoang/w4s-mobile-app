import AppHeader from '@/components/base/AppHeader';
import AppIcon from '@/components/base/AppIcon';
import CustomText from '@/components/base/CustomText';
import { WALLET_ICONS as VECTOR_WALLET_ICONS } from '@/constants/IconNameList';
import { useAppTheme } from '@/core/theme/ThemeContext';
import StorageService from '@/services/StorageService';
import * as LocalIcons from '@/utils/Icons';
import { hp, normalize, wp } from '@/utils/layout';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ================= ICON ITEM =================
interface IconItemProps {
  icon: string;
  isSelected: boolean;
  size: number;
  tintColor: string;
  textColor: string;
  onPress: (icon: string) => void;
}

const IconItem = React.memo<IconItemProps>(
  ({ icon, isSelected, size, tintColor, textColor, onPress }) => {
    return (
      <TouchableOpacity
        style={[
          styles.iconItem,
          {
            width: size,
            height: size,
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          isSelected && {
            borderColor: tintColor,
            backgroundColor: tintColor + '10',
          },
        ]}
        onPress={() => onPress(icon)}
      >
        <AppIcon
          name={icon as any}
          size={normalize(28)}
          color={isSelected ? tintColor : textColor}
        />
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.icon === nextProps.icon &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.size === nextProps.size &&
      prevProps.tintColor === nextProps.tintColor &&
      prevProps.textColor === nextProps.textColor
    );
  }
);

// ================= SCREEN =================
const SelectWalletIconScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const categoryParam = params.category as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState((params.icon as string) || 'wallet');

  const { width: SCREEN_WIDTH } = Dimensions.get('window');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const baseIcons = useMemo(() => {
    if (categoryParam === 'WALLET') {
      return Object.keys(LocalIcons.WALLET_ICONS || {});
    }

    const allLocalIconKeys = Object.keys(LocalIcons.LOCAL_ICONS);
    const walletKeys = new Set(Object.keys(LocalIcons.WALLET_ICONS || {}));

    const nonWalletLocalIcons = allLocalIconKeys.filter(key => !walletKeys.has(key));

    return [...VECTOR_WALLET_ICONS, ...nonWalletLocalIcons];
  }, [categoryParam]);

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

  // ===== Filter icons =====
  const filteredIcons = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return baseIcons;
    }
    const query = debouncedSearchQuery.toLowerCase();
    return baseIcons.filter(icon =>
      icon.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, baseIcons]);

  const handleSelectIcon = useCallback((iconName: string) => {
    setSelectedIcon(iconName);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  }, []);

  const handleContinue = async () => {
    await StorageService.setItem('temp_selected_icon', selectedIcon);
    router.back();
  };

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <AppIcon name="magnifying-glass" size={normalize(48)} color={colors.icon} />
      <CustomText style={[styles.emptyText, { color: colors.icon }]}>
        {t('selection.no_results')}
      </CustomText>
    </View>
  ), [colors.icon, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('selection.select_icon')} showBackButton />

      <View style={styles.content}>
        {/* ===== SEARCH ===== */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <AppIcon name="magnifying-glass" size={normalize(16)} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('selection.search_icon_placeholder')}
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <AppIcon name="xmark" size={normalize(16)} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* ===== ICON COUNT ===== */}
        <View style={styles.iconCountContainer}>
          <CustomText style={[styles.iconCountText, { color: colors.icon }]}>
            {t('selection.showing')} {filteredIcons.length} / {baseIcons.length} icons
          </CustomText>
        </View>

        {/* ===== ICON GRID ===== */}
        <FlatList
          key={numColumns}
          data={filteredIcons}
          numColumns={numColumns}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <IconItem
              icon={item}
              isSelected={selectedIcon === item}
              size={ITEM_SIZE}
              tintColor={colors.tint}
              textColor={colors.text}
              onPress={handleSelectIcon}
            />
          )}
          columnWrapperStyle={styles.columnWrapper}
          ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
          contentContainerStyle={styles.iconGridContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={48}
          maxToRenderPerBatch={24}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={renderEmptyComponent}
        />
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
    marginBottom: hp(1),
    gap: normalize(12),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(15),
    padding: 0,
  },
  iconCountContainer: {
    paddingVertical: normalize(8),
    marginBottom: hp(1),
  },
  iconCountText: {
    fontSize: normalize(13),
    textAlign: 'center',
  },
  iconGridContainer: {
    paddingBottom: hp(2),
  },
  columnWrapper: {
    gap: normalize(8),
  },
  rowSeparator: {
    height: normalize(8),
  },
  iconItem: {
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: normalize(16),
    marginTop: normalize(16),
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
});

export default SelectWalletIconScreen;