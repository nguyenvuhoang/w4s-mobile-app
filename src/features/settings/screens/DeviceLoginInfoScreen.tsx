import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Tokens } from '@/core/theme/theme';
import { useSettingService } from '@/features/settings/hooks/useSettingService';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles/DeviceLoginInfoScreen.styles';

const DeviceCard = ({
    device,
    index,
    colors,
    t,
    formatDateTime,
    onRemove,
}: {
    device: any;
    index: number;
    colors: any;
    t: any;
    formatDateTime: (s: string | undefined) => string;
    onRemove: (device: any) => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 380,
                delay: index * 80,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                delay: index * 80,
                friction: 8,
                tension: 60,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const onPressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true }).start();
    const onPressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    const isIOS = device.devicetype === 'IOS' || device.devicetype === 'iOS';
    const isActive = device.status === 'A';

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                marginBottom: normalize(14),
            }}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
            >
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.card,
                            borderColor: isActive
                                ? Tokens.colors.foundation.primary['primary-1'] + '40'
                                : colors.border,
                        },
                    ]}
                >
                    {isActive && (
                        <View
                            style={[
                                styles.activeStripe,
                                { backgroundColor: Tokens.colors.foundation.primary['primary-1'] },
                            ]}
                        />
                    )}

                    <View style={styles.cardHeader}>
                        <View
                            style={[
                                styles.iconCircle,
                                {
                                    backgroundColor: isIOS
                                        ? colors.text + '12'
                                        : '#00C45320',
                                },
                            ]}
                        >
                            <Ionicons
                                name={isIOS ? 'logo-apple' : 'logo-android'}
                                size={normalize(22)}
                                color={isIOS ? colors.text : '#00C453'}
                            />
                        </View>

                        <View style={{ flex: 1, marginLeft: wp(3) }}>
                            <CustomText
                                style={[styles.deviceName, { color: colors.text }]}
                                numberOfLines={1}
                            >
                                {(device.brand || t('settings.device_default')) + ' ' + (device.deviceid || '')}
                            </CustomText>
                            <CustomText style={[styles.deviceSub, { color: colors.icon }]}>
                                {device.devicetype || '—'} {device.osversion ? `· ${device.osversion}` : ''}
                            </CustomText>
                        </View>

                        {isActive && (
                            <View style={styles.activePill}>
                                <View style={styles.activeDot} />
                                <CustomText style={styles.activeLabel}>
                                    {t('common.used')}
                                </CustomText>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => onRemove(device)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={normalize(20)} color={colors.icon} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.infoGrid}>
                        <InfoTile
                            icon="phone-portrait-outline"
                            label={t('settings.device_type')}
                            value={device.devicetype || '—'}
                            colors={colors}
                        />
                        <InfoTile
                            icon="layers-outline"
                            label={t('settings.os_version')}
                            value={device.osversion || '—'}
                            colors={colors}
                        />
                        <InfoTile
                            icon="time-outline"
                            label={t('settings.last_seen')}
                            value={formatDateTime(device.lastseenupdate)}
                            colors={colors}
                            fullWidth
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const InfoTile = ({
    icon,
    label,
    value,
    colors,
    fullWidth = false,
}: {
    icon: any;
    label: string;
    value: string;
    colors: any;
    fullWidth?: boolean;
}) => (
    <View style={[styles.tile, fullWidth && styles.tileFull, { backgroundColor: colors.background + 'CC' }]}>
        <Ionicons name={icon} size={normalize(14)} color={colors.icon} style={{ marginBottom: 4 }} />
        <CustomText style={[styles.tileLabel, { color: colors.icon }]}>{label}</CustomText>
        <CustomText style={[styles.tileValue, { color: colors.text }]} numberOfLines={1}>
            {value}
        </CustomText>
    </View>
);

const DeviceLoginInfoScreen = () => {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { deviceInformation, loginDeviceInformation } = useSettingService();
    const { showNotification } = useNotification();

    useEffect(() => {
        loginDeviceInformation();
    }, []);

    const handleRemoveDevice = (device: any) => {
        showNotification(
            t('settings.confirm_remove_device', { defaultValue: 'Bạn có chắc chắn muốn gỡ thiết bị này?' }),
            'warning',
            undefined,
            undefined,
            async () => {
                // TODO: Implement actual removal API call if available
                console.log('Removing device:', device.deviceid);
                showNotification(t('settings.remove_device_success', { defaultValue: 'Đã gỡ thiết bị thành công' }), 'success');
            }
        );
    };

    const formatDateTime = (dateTimeString: string | undefined) => {
        if (!dateTimeString) return '—';
        return dayjs(dateTimeString).format('DD/MM/YYYY · HH:mm');
    };

    const activeCount = deviceInformation?.filter((d) => d.status === 'A').length ?? 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom", "left", "right"]}>
            <AppHeader title={t('settings.login_info')} />

            {(deviceInformation?.length ?? 0) > 0 && (
                <View style={[styles.summaryBar, { backgroundColor: colors.background }]}>
                    <CustomText style={[styles.summaryText, { color: colors.icon }]}>
                        {t('settings.device_count', { count: deviceInformation!.length })}
                        {activeCount > 0 ? t('settings.active_device_count', { count: activeCount }) : ''}
                    </CustomText>
                </View>
            )}

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + hp(4) },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {!deviceInformation || deviceInformation.length === 0 ? (
                    <EmptyState colors={colors} t={t} />
                ) : (
                    deviceInformation.map((device, index) => (
                        <DeviceCard
                            key={index}
                            device={device}
                            index={index}
                            colors={colors}
                            t={t}
                            formatDateTime={formatDateTime}
                            onRemove={handleRemoveDevice}
                        />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const EmptyState = ({ colors, t }: { colors: any; t: any }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);
    return (
        <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="hardware-chip-outline" size={normalize(36)} color={colors.icon} />
            </View>
            <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
                {t('settings.no_device_info')}
            </CustomText>
            <CustomText style={[styles.emptyDesc, { color: colors.icon }]}>
                {t('settings.no_device_desc')}
            </CustomText>
        </Animated.View>
    );
};

export default DeviceLoginInfoScreen;