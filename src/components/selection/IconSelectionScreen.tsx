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
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INITIAL_LOAD = 50;
const LOAD_MORE_BATCH = 30;

// ================= SCREEN =================
const SelectWalletIconScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const categoryParam = params.category as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState((params.icon as string) || 'wallet');
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);

  const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    return baseIcons.filter(icon =>
      icon.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, baseIcons]);

  // Reset display count when search changes
  useEffect(() => {
    // When searching, show all results immediately (or at least more)
    if (searchQuery.trim()) {
      // Show all search results or limit to reasonable number
      setDisplayCount(filteredIcons.length);
    } else {
      // When not searching, start with initial load
      setDisplayCount(INITIAL_LOAD);
    }
  }, [searchQuery, filteredIcons.length]);

  // Icons to display (limited by displayCount)
  const displayedIcons = useMemo(() => {
    const icons = filteredIcons.slice(0, displayCount);
    // Ensure unique icons (remove duplicates if any)
    return Array.from(new Set(icons));
  }, [filteredIcons, displayCount]);

  const hasMore = displayCount < filteredIcons.length;

  // Handle scroll to load more
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasMore || isLoading) return;

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 200;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

      if (isCloseToBottom) {
        setIsLoading(true);
        setDisplayCount(prev => {
          const newCount = Math.min(prev + LOAD_MORE_BATCH, filteredIcons.length);
          setTimeout(() => setIsLoading(false), 100); // Debounce
          return newCount;
        });
      }
    },
    [hasMore, filteredIcons.length, isLoading]
  );

  // Alternative handler for when scroll ends at bottom
  const handleScrollEnd = useCallback(() => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    setDisplayCount(prev => {
      const newCount = Math.min(prev + LOAD_MORE_BATCH, filteredIcons.length);
      setTimeout(() => setIsLoading(false), 100); // Debounce
      return newCount;
    });
  }, [hasMore, filteredIcons.length, isLoading]);

  const handleContinue = async () => {
    await StorageService.setItem('temp_selected_icon', selectedIcon);
    router.back();
  };

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
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <AppIcon name="xmark" size={normalize(16)} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* ===== ICON COUNT ===== */}
        <View style={styles.iconCountContainer}>
          <CustomText style={[styles.iconCountText, { color: colors.icon }]}>
            {t('selection.showing')} {displayedIcons.length} / {filteredIcons.length} icons
          </CustomText>
        </View>

        {/* ===== ICON GRID WITH PROGRESSIVE LOADING ===== */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.iconGridContainer}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={400}
        >
          <View style={styles.iconGrid}>
            {displayedIcons.map(icon => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconItem,
                  {
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                  },
                  selectedIcon === icon && {
                    borderColor: colors.tint,
                    backgroundColor: colors.tint + '10',
                  },
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <AppIcon
                  name={icon as any}
                  size={normalize(28)}
                  color={selectedIcon === icon ? colors.tint : colors.text}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Loading more indicator */}
          {hasMore && (
            <View style={styles.loadingMore}>
              <CustomText style={[styles.loadingMoreText, { color: colors.icon }]}>
                {t('selection.scroll_for_more')}
              </CustomText>
            </View>
          )}
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
  loadingMore: {
    paddingVertical: normalize(20),
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: normalize(13),
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