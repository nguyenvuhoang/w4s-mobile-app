import AppHeader from "@/components/base/AppHeader";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useCurrency } from "@/hooks/useCurrency";
import { Currency } from "@/services/repositories/currency.repository";
import StorageService from '@/services/StorageService';
import { hp, normalize, wp } from "@/utils/layout";
import { getFlagEmoji } from "@/utils/Utils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CurrencySelectScreenProps {
  selectedCurrencyId?: string;
  onSelect?: (currency: Currency) => void;
}

const CurrencySelectScreen: React.FC<CurrencySelectScreenProps> = ({
  selectedCurrencyId,
  onSelect,
}) => {
  const { colors } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    currencies,
    totalCount,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    parseCurrencyName,
  } = useCurrency({
    autoFetch: true,
    searchText: debouncedSearch,
    pageSize: 40,
  });

  const handleSelectCurrency = async (currency: Currency) => {
    const displayName = parseCurrencyName(currency);

    // Tạo object currency data
    const currencyData = {
      currencyId: currency.currency_id,
      symbol: currency.symbol || currency.currency_id,
      name: displayName,
    };

    // Convert object => string => lưu storage

    await StorageService.setItem('temp_selected_currency', JSON.stringify(currencyData));

    // Callback nếu có
    onSelect?.(currency);

    // Quay lại màn hình trước
    router.back();
  };

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading) {

      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  const renderCurrencyItem = useCallback(
    ({ item }: { item: Currency }) => {
      const isSelected = item.currency_id === selectedCurrencyId;
      const displayName = parseCurrencyName(item);

      return (
        <TouchableOpacity
          style={[
            styles.currencyItem,
            { backgroundColor: colors.card },
            isSelected && {
              borderColor: colors.tint,
              borderWidth: 2,
            },
          ]}
          onPress={() => handleSelectCurrency(item)}
          activeOpacity={0.7}
        >
          <View style={styles.currencyLeft}>
            <View
              style={[
                styles.currencyIconWrapper,
              ]}
            >
              {item.country_code ? (
                <CustomText style={{ fontSize: normalize(24) }}>
                  {getFlagEmoji(item.country_code)}
                </CustomText>
              ) : (
                <CustomText
                  style={[
                    styles.currencySymbol,
                    {
                      color: isSelected ? colors.tint : colors.tint,
                    },
                  ]}
                  type="bold"
                >
                  {item.symbol || item.currency_id}
                </CustomText>
              )}
            </View>

            <View style={styles.currencyInfo}>
              <CustomText
                style={[styles.currencyCode, { color: colors.text }]}
                type="semiBold"
              >
                {item.currency_id}
              </CustomText>
              <CustomText
                style={[styles.currencyName, { color: colors.icon }]}
                type="regular"
                numberOfLines={1}
              >
                {displayName}{item.country_name ? ` • ${item.country_name}` : ""}
              </CustomText>
            </View>
          </View>

          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={normalize(24)}
              color={colors.tint}
            />
          )}
        </TouchableOpacity>
      );
    },
    [colors, selectedCurrencyId, parseCurrencyName]
  );

  const renderEmpty = () => {
    if (loading && currencies.length === 0) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="search-outline"
          size={normalize(64)}
          color={colors.icon}
          style={{ opacity: 0.3 }}
        />
        <CustomText
          style={[styles.emptyText, { color: colors.icon }]}
          type="medium"
        >
          {searchQuery
            ? "Không tìm thấy tiền tệ phù hợp"
            : "Không có tiền tệ nào"}
        </CustomText>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || currencies.length === 0) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
        <CustomText
          style={[styles.footerText, { color: colors.icon }]}
          type="regular"
        >
          Đang tải thêm...
        </CustomText>
      </View>
    );
  };

  const renderHeader = () => {
    if (loading && currencies.length === 0) return null;
    if (currencies.length === 0) return null;

    return (
      <View style={styles.resultHeader}>
        <CustomText
          style={[styles.resultText, { color: colors.icon }]}
          type="regular"
        >
          Hiển thị {currencies.length} / {totalCount} tiền tệ
        </CustomText>
      </View>
    );
  };

  if (error && !loading && currencies.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppHeader title="Chọn tiền tệ" showBackButton />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={normalize(64)}
            color="#FF3B30"
            style={{ opacity: 0.5 }}
          />
          <CustomText
            style={[styles.errorText, { color: colors.text }]}
            type="medium"
          >
            {error}
          </CustomText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={refetch}
          >
            <CustomText style={styles.retryButtonText} type="semiBold">
              Thử lại
            </CustomText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Chọn tiền tệ" showBackButton />

      {/* Search Bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: colors.background }]}
      >
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Ionicons
            name="search"
            size={normalize(20)}
            color={colors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm tiền tệ..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={normalize(20)}
                color={colors.icon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Currency List */}
      <FlatList
        data={currencies}
        keyExtractor={(item, index) => `${item.currency_id}-${index}`}
        renderItem={renderCurrencyItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderHeader}
        initialNumToRender={40}
        maxToRenderPerBatch={40}
        windowSize={21}
        removeClippedSubviews={false}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: normalize(76), // item height
          offset: normalize(76) * index,
          index,
        })}
      />

      {/* Loading Overlay */}
      {loading && currencies.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.tint} />
          <CustomText
            style={[styles.loadingText, { color: colors.text }]}
            type="regular"
          >
            Đang tải...
          </CustomText>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    height: normalize(48),
  },
  searchIcon: {
    marginRight: normalize(12),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(15),
    fontFamily: "Quicksand-Regular",
  },
  clearButton: {
    padding: normalize(4),
  },
  resultHeader: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
  },
  resultText: {
    fontSize: normalize(13),
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  currencyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: normalize(16),
    borderRadius: normalize(16),
    marginBottom: normalize(12),
  },
  currencyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  currencyIcon: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(12),
  },
  currencySymbol: {
    fontSize: normalize(18),
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: normalize(16),
    marginBottom: normalize(2),
  },
  currencyName: {
    fontSize: normalize(13),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: hp(10),
  },
  emptyText: {
    fontSize: normalize(15),
    marginTop: normalize(16),
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: normalize(16),
    gap: normalize(8),
  },
  footerText: {
    fontSize: normalize(13),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: normalize(12),
    fontSize: normalize(15),
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(10),
  },
  errorText: {
    fontSize: normalize(15),
    textAlign: "center",
    marginTop: normalize(16),
    marginBottom: normalize(24),
  },
  retryButton: {
    paddingHorizontal: normalize(32),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
  },
  retryButtonText: {
    fontSize: normalize(15),
    color: "#fff",
  },
  currencyIconWrapper: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(12),
  },
});

export default CurrencySelectScreen;