import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
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
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const DeviceCard = ({
    device,
    index,
    colors,
    t,
    formatDateTime,
}: {
    device: any;
    index: number;
    colors: any;
    t: any;
    formatDateTime: (s: string | undefined) => string;
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
                    {/* Active indicator stripe */}
                    {isActive && (
                        <View
                            style={[
                                styles.activeStripe,
                                { backgroundColor: Tokens.colors.foundation.primary['primary-1'] },
                            ]}
                        />
                    )}

                    {/* Card Header */}
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

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Info Grid */}
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

    useEffect(() => {
        loginDeviceInformation();
    }, []);

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

const styles = StyleSheet.create({
    container: { flex: 1 },

    summaryBar: {
        paddingHorizontal: wp(4.5),
        paddingVertical: hp(1),
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.2)',
    },
    summaryText: {
        fontSize: normalize(13),
        fontFamily: Fonts.medium,
    },

    scrollContent: {
        paddingHorizontal: wp(4.5),
        paddingTop: hp(1.5),
    },

    card: {
        borderRadius: normalize(18),
        borderWidth: 1,
        overflow: 'hidden',
    },
    activeStripe: {
        height: 3,
        width: '100%',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: normalize(16),
        paddingBottom: normalize(12),
    },
    iconCircle: {
        width: normalize(46),
        height: normalize(46),
        borderRadius: normalize(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    deviceName: {
        fontSize: normalize(15),
        fontFamily: Fonts.bold,
        letterSpacing: 0.1,
    },
    deviceSub: {
        fontSize: normalize(12),
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    activePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00C45318',
        paddingHorizontal: normalize(10),
        paddingVertical: normalize(5),
        borderRadius: normalize(20),
        gap: 5,
    },
    activeDot: {
        width: normalize(6),
        height: normalize(6),
        borderRadius: normalize(3),
        backgroundColor: '#00C453',
    },
    activeLabel: {
        fontSize: normalize(11),
        fontFamily: Fonts.semiBold,
        color: '#00C453',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: normalize(16),
    },

    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: normalize(8),
        padding: normalize(12),
    },
    tile: {
        flex: 1,
        minWidth: '44%',
        padding: normalize(10),
        borderRadius: normalize(12),
    },
    tileFull: {
        minWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(8),
    },
    tileLabel: {
        fontSize: normalize(11),
        fontFamily: Fonts.regular,
        marginBottom: 2,
    },
    tileValue: {
        fontSize: normalize(13),
        fontFamily: Fonts.semiBold,
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: hp(12),
        paddingHorizontal: wp(10),
    },
    emptyIconWrap: {
        width: normalize(80),
        height: normalize(80),
        borderRadius: normalize(24),
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: hp(2),
    },
    emptyTitle: {
        fontSize: normalize(16),
        fontFamily: Fonts.semiBold,
        marginBottom: normalize(6),
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: normalize(20),
    },
});

export default DeviceLoginInfoScreen;