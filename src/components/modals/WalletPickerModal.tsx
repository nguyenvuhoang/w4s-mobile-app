/**
 * Props:
 *   visible
 *   wallets         - danh sách ví (WalletSummary[])
 *   selectedId      - walletId đang được chọn, hoặc 'all'
 *   onSelect        - callback khi chọn: (id: number | 'all') => void
 *   onClose         - callback
 *   showAllOption   - có hiển thị option "Tất cả các ví" không (default: true)
 *   title
 */

import AppIcon from '@/components/base/AppIcon';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { WalletSummary } from '@/types/wallet';
import { hp, normalize, wp } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { t } from 'i18next';
import React, { useMemo } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';


export type WalletPickerId = number | 'all';

interface WalletPickerItem {
    walletId: WalletPickerId;
    name: string;
    icon?: string;
    color?: string;
}

interface WalletPickerModalProps {
    visible: boolean;
    wallets: WalletSummary[];
    selectedId: WalletPickerId;
    onSelect: (id: WalletPickerId) => void;
    onClose: () => void;
    showAllOption?: boolean;
    title?: string;
}


const WalletPickerModal: React.FC<WalletPickerModalProps> = ({
    visible,
    wallets,
    selectedId,
    onSelect,
    onClose,
    showAllOption = true,
    title = 'Chọn ví',
}) => {
    const { colors } = useAppTheme();

    const data = useMemo<WalletPickerItem[]>(() => {
        const allOption: WalletPickerItem = {
            walletId: 'all',
            name: t("wallet.all_wallets"),
            icon: 'layer-group',
            color: colors.tint,
        };
        return showAllOption ? [allOption, ...wallets] : [...wallets];
    }, [wallets, showAllOption, colors.tint]);

    const styles = useMemo(() => createStyles(colors), [colors]);

    const renderItem = ({ item }: { item: WalletPickerItem }) => {
        const isSelected = item.walletId === selectedId;
        const iconColor = item.color || colors.tint;

        return (
            <TouchableOpacity
                style={[styles.item, isSelected && { backgroundColor: colors.tint + '18' }]}
                onPress={() => onSelect(item.walletId)}
                activeOpacity={0.7}
            >
                {/* Icon badge */}
                <View style={[styles.iconBadge, { backgroundColor: iconColor + '22' }]}>
                    <AppIcon
                        name={(item.icon as any) || 'wallet'}
                        size={normalize(18)}
                        color={iconColor}
                    />
                </View>

                {/* Name */}
                <CustomText style={[styles.itemText, { color: isSelected ? colors.tint : colors.text }]}>
                    {item.name}
                </CustomText>

                {/* Checkmark */}
                {isSelected && (
                    <AppIcon
                        name="circle-check"
                        size={normalize(18)}
                        color={colors.tint}
                    />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet}>
                    {/* Handle bar */}
                    <View style={[styles.handle, { backgroundColor: colors.border }]} />

                    {/* Title */}
                    <CustomText style={styles.title}>{title}</CustomText>

                    {/* List */}
                    <FlatList
                        data={data}
                        keyExtractor={(item) => String(item.walletId)}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => (
                            <View style={[styles.separator, { backgroundColor: colors.border }]} />
                        )}
                        showsVerticalScrollIndicator={false}
                    />

                    <View style={{ height: hp(3) }} />
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const createStyles = (colors: any) =>
    StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
        },
        sheet: {
            backgroundColor: colors.card,
            borderTopLeftRadius: normalize(24),
            borderTopRightRadius: normalize(24),
            paddingTop: normalize(12),
            paddingHorizontal: wp(5),
            maxHeight: '70%',
        },
        handle: {
            width: normalize(40),
            height: normalize(4),
            borderRadius: normalize(2),
            alignSelf: 'center',
            marginBottom: hp(1.5),
        },
        title: {
            fontSize: normalize(16),
            fontFamily: Fonts.semiBold,
            color: colors.text,
            textAlign: 'center',
            marginBottom: hp(1.5),
        },
        separator: {
            height: 1,
            marginHorizontal: normalize(8),
        },
        item: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: normalize(14),
            paddingVertical: normalize(14),
            paddingHorizontal: normalize(12),
            borderRadius: normalize(14),
        },
        iconBadge: {
            width: normalize(42),
            height: normalize(42),
            borderRadius: normalize(12),
            alignItems: 'center',
            justifyContent: 'center',
        },
        itemText: {
            flex: 1,
            fontSize: normalize(15),
            fontFamily: Fonts.medium,
        },
    });

export default WalletPickerModal;
