import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { hp, normalize, wp } from '@/utils/layout';
import { removeAccents } from '@/utils/translation';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import StorageService from '@/services/StorageService';

interface FeatureSearchModalProps {
  isVisible: boolean;
  onClose: () => void;
}

interface FeatureItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  iconType: 'Ionicons' | 'FontAwesome6';
  route: string;
  params?: any;
  category: string;
}

const FeatureSearchModal: React.FC<FeatureSearchModalProps> = ({ isVisible, onClose }) => {
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const features: FeatureItem[] = useMemo(() => [
    {
      id: 'add-transaction',
      title: t('transaction.add_transaction'),
      description: t('transaction.type_expense') + ' / ' + t('transaction.type_income'),
      icon: 'plus',
      iconType: 'FontAwesome6',
      route: '/(protected)/transaction/add-transaction',
      category: 'transaction'
    },
    {
      id: 'transaction-history',
      title: t('transaction_history.title'),
      icon: 'list-ul',
      iconType: 'FontAwesome6',
      route: '/(protected)/transaction-history',
      category: 'transaction'
    },
    {
      id: 'statistics',
      title: t('statistics.view_report'),
      icon: 'chart-pie',
      iconType: 'FontAwesome6',
      route: '/(protected)/report',
      category: 'finance'
    },
    {
      id: 'budget',
      title: t('budget.create_budget'),
      icon: 'wallet',
      iconType: 'FontAwesome6',
      route: '/(protected)/budget/create-budget',
      category: 'finance'
    },
    {
      id: 'paybook',
      title: t('settings.paybook'),
      icon: 'book',
      iconType: 'FontAwesome6',
      route: '/(protected)/paybook',
      category: 'finance'
    },
    {
      id: 'invoice',
      title: t('settings.invoice'),
      icon: 'file-invoice-dollar',
      iconType: 'FontAwesome6',
      route: '/(protected)/invoice',
      category: 'finance'
    },
    {
      id: 'event',
      title: t('settings.event'),
      icon: 'calendar-days',
      iconType: 'FontAwesome6',
      route: '/(protected)/event',
      category: 'finance'
    },
    {
      id: 'ai-chat',
      title: t('ai_chat.title'),
      icon: 'robot',
      iconType: 'FontAwesome6',
      route: '/(protected)/ai-chat',
      category: 'ai'
    },
    {
      id: 'wallet',
      title: t('wallet.manage_wallets'),
      icon: 'card-outline',
      iconType: 'Ionicons',
      route: '/(protected)/wallet/wallet-list',
      params: { mode: 'manage' },
      category: 'account'
    },
    {
      id: 'add-wallet',
      title: t('wallet.add_new_wallet'),
      icon: 'wallet-outline',
      iconType: 'Ionicons',
      route: '/(protected)/wallet/select-wallet-type',
      category: 'account'
    },
    {
      id: 'profile',
      title: t('profile.title'),
      icon: 'person-outline',
      iconType: 'Ionicons',
      route: '/(protected)/profile',
      category: 'account'
    },
    {
      id: 'atm-finder',
      title: t('tools.atm_finder'),
      icon: 'location-dot',
      iconType: 'FontAwesome6',
      route: '/(protected)/tools/atm-finder',
      category: 'tools'
    },
    {
      id: 'personal-income-tax',
      title: t('tools.personal_income_tax'),
      icon: 'calculator',
      iconType: 'FontAwesome6',
      route: '/(protected)/tools/personal-income-tax',
      category: 'tools'
    },
    {
      id: 'interest-calculator',
      title: t('tools.interest_calculator'),
      icon: 'percent',
      iconType: 'FontAwesome6',
      route: '/(protected)/tools/interest-calculator',
      category: 'tools'
    },
    {
      id: 'currency-converter',
      title: t('tools.currency_converter'),
      icon: 'money-bill-transfer',
      iconType: 'FontAwesome6',
      route: '/(protected)/tools/currency-converter',
      category: 'tools'
    }
  ], [t]);

  const filteredFeatures = useMemo(() => {
    if (!searchQuery.trim()) {
      // If no search, sort by recent usage
      const recentItems = recentIds
        .map(id => features.find(f => f.id === id))
        .filter(Boolean) as FeatureItem[];
      const otherItems = features.filter(f => !recentIds.includes(f.id));
      return [...recentItems, ...otherItems];
    }

    const query = removeAccents(searchQuery.toLowerCase());
    return features.filter(item =>
      removeAccents(item.title.toLowerCase()).includes(query) ||
      (item.description && removeAccents(item.description.toLowerCase()).includes(query)) ||
      removeAccents(item.category.toLowerCase()).includes(query)
    );
  }, [searchQuery, features, recentIds]);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const stored = await StorageService.getAsyncItem('recent_search_features');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setRecentIds(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load recent features:', error);
      }
    };

    if (isVisible) {
      loadRecent();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isVisible]);

  const handleSelectFeature = async (item: FeatureItem) => {
    // Update recent features
    const newRecent = [item.id, ...recentIds.filter(id => id !== item.id)].slice(0, 3);
    setRecentIds(newRecent);
    try {
      await StorageService.setAsyncItem('recent_search_features', JSON.stringify(newRecent));
    } catch (error) {
      console.error('Failed to save recent features:', error);
    }

    onClose();
    // Use a small timeout to ensure the modal is closed before navigating
    // especially on Android to avoid UI glitches
    setTimeout(() => {
      router.push({
        pathname: item.route as any,
        params: item.params
      });
    }, 100);
  };

  const renderItem = ({ item, index }: { item: FeatureItem, index: number }) => {
    const isRecent = !searchQuery.trim() && index < recentIds.length;

    return (
      <View>
        {isRecent && index === 0 && (
          <CustomText style={[styles.sectionLabel, { color: colors.icon }]}>
            {i18n.language === 'vi' ? 'Gần đây' : 'Recent'}
          </CustomText>
        )}
        {!isRecent && !searchQuery.trim() && index === recentIds.length && (
          <CustomText style={[styles.sectionLabel, { color: colors.icon, marginTop: normalize(10) }]}>
            {t('common.all') || t('home.see_more')}
          </CustomText>
        )}
        <TouchableOpacity
          style={[styles.item, { backgroundColor: colors.card }]}
          onPress={() => handleSelectFeature(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
            {item.iconType === 'Ionicons' ? (
              <Ionicons name={item.icon as any} size={normalize(20)} color={colors.tint} />
            ) : (
              <FontAwesome6 name={item.icon} size={normalize(18)} color={colors.tint} />
            )}
          </View>
          <View style={styles.itemInfo}>
            <CustomText style={[styles.itemTitle, { color: colors.text }]}>{item.title}</CustomText>
            {item.description && (
              <CustomText style={[styles.itemDesc, { color: colors.icon }]}>{item.description}</CustomText>
            )}
          </View>
          <Ionicons name="chevron-forward" size={normalize(16)} color={colors.icon} />
        </TouchableOpacity>
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.backdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          entering={SlideInUp.duration(300)}
          exiting={SlideOutUp.duration(200)}
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <View style={styles.header}>
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={normalize(20)} color={colors.icon} />
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text }]}
                placeholder={t('category.search_category_placeholder')}
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={normalize(20)} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <CustomText style={{ color: colors.tint, fontWeight: '600' }}>{t('common.cancel')}</CustomText>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredFeatures}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={normalize(48)} color={colors.icon} style={{ opacity: 0.5 }} />
                <CustomText style={[styles.emptyText, { color: colors.icon }]}>
                  {t('home.no_transactions')}
                </CustomText>
              </View>
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    paddingTop: Platform.OS === 'ios' ? normalize(60) : normalize(StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20),
    borderBottomLeftRadius: normalize(24),
    borderBottomRightRadius: normalize(24),
    maxHeight: hp(85),
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingBottom: normalize(15),
    gap: normalize(12),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(12),
    height: normalize(46),
    borderRadius: normalize(14),
    borderWidth: 1,
    gap: normalize(10),
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    paddingVertical: 0,
    height: '100%',
  },
  cancelButton: {
    paddingLeft: normalize(4),
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingBottom: normalize(40),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: normalize(14),
    borderRadius: normalize(16),
    marginBottom: normalize(10),
  },
  iconContainer: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(14),
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: normalize(13),
    marginTop: normalize(2),
    opacity: 0.8,
  },
  emptyContainer: {
    padding: normalize(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: normalize(16),
    fontSize: normalize(15),
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: normalize(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: normalize(8),
    marginLeft: normalize(4),
    letterSpacing: 0.5,
  }
});

export default FeatureSearchModal;
