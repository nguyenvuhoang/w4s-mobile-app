import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { Tokens } from '@/core/theme/theme';
import { Images } from '@/utils/images';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
    <View style={[styles.tile, fullWidth && styles.tileFull, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name={icon} size={normalize(18)} color={Tokens.colors.foundation.primary['primary-1']} style={{ marginBottom: 6 }} />
        <CustomText style={[styles.tileLabel, { color: colors.icon }]}>{label}</CustomText>
        <CustomText style={[styles.tileValue, { color: colors.text }]} numberOfLines={1}>
            {value}
        </CustomText>
    </View>
);

const ActionItem = ({
    icon,
    title,
    subtitle,
    colors,
    onPress,
}: {
    icon: any;
    title: string;
    subtitle?: string;
    colors: any;
    onPress: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    const onPressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={onPress}
                style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <View style={[styles.actionIconWrap, { backgroundColor: Tokens.colors.foundation.primary['primary-1'] + '15' }]}>
                    <Ionicons name={icon} size={normalize(20)} color={Tokens.colors.foundation.primary['primary-1']} />
                </View>
                <View style={{ flex: 1, paddingLeft: normalize(12) }}>
                    <CustomText style={[styles.actionTitle, { color: colors.text }]}>{title}</CustomText>
                    {subtitle && <CustomText style={[styles.actionSub, { color: colors.icon }]}>{subtitle}</CustomText>}
                </View>
                <Ionicons name="chevron-forward" size={normalize(20)} color={colors.icon} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const AppInfoScreen = () => {
    const { colors, isDark } = useAppTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    // Animations
    const logoAnim = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(20)).current;

    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const buildNumber = Platform.OS === 'ios' ? (Constants.expoConfig?.ios?.buildNumber || '1') : (Constants.expoConfig?.android?.versionCode?.toString() || '1');
    const sdkVersion = Constants.expoConfig?.sdkVersion || '50.0.0';

    useEffect(() => {
        Animated.sequence([
            Animated.timing(logoAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(contentAnim, {
                toValue: 0,
                friction: 8,
                tension: 50,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const openWebsite = () => {
        Linking.openURL('https://wealth4s.vn/');
    };

    const openSupport = () => {
        Linking.openURL('mailto:support@wealth4s.vn');
    };

    const logoScale = logoAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.8, 1.05, 1]
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom", "left", "right"]}>
            <AppHeader title={t('settings.app_info')} />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + hp(4) },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo & Branding */}
                <Animated.View style={[styles.brandContainer, { opacity: logoAnim, transform: [{ scale: logoScale }] }]}>
                    <View style={[styles.logoWrapper, { backgroundColor: colors.card, shadowColor: Tokens.colors.foundation.primary['primary-1'] }]}>
                        <Image
                            source={isDark ? Images.appLogoLight : Images.appLogoDark}
                            style={{ width: normalize(60), height: normalize(60) }}
                            resizeMode="contain"
                        />
                    </View>
                    <CustomText style={[styles.appName, { color: colors.text }]}>
                        W4S Mobile
                    </CustomText>
                    <View style={[styles.badge, { backgroundColor: Tokens.colors.foundation.primary['primary-1'] + '20' }]}>
                        <CustomText style={[styles.badgeText, { color: Tokens.colors.foundation.primary['primary-1'] }]}>
                            {t('settings.version')} {appVersion}
                        </CustomText>
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: logoAnim, transform: [{ translateY: contentAnim }] }}>
                    {/* Technical Info Grid */}
                    <View style={styles.section}>
                        <CustomText style={[styles.sectionTitle, { color: colors.icon }]}>{t('settings.system_info')}</CustomText>
                        <View style={styles.infoGrid}>
                            <InfoTile
                                icon="code-working-outline"
                                label={t('settings.build_number')}
                                value={buildNumber}
                                colors={colors}
                            />
                            <InfoTile
                                icon="logo-react"
                                label={t('settings.sdk_version')}
                                value={sdkVersion}
                                colors={colors}
                            />
                            <InfoTile
                                icon="phone-portrait-outline"
                                label={t('settings.platform')}
                                value={Platform.OS === 'ios' ? 'Apple iOS' : 'Google Android'}
                                colors={colors}
                                fullWidth
                            />
                        </View>
                    </View>

                    {/* Links & Actions */}
                    <View style={styles.section}>
                        <CustomText style={[styles.sectionTitle, { color: colors.icon }]}>{t('settings.developer')}</CustomText>
                        <View style={styles.actionsContainer}>
                            <ActionItem
                                icon="globe-outline"
                                title={t('settings.website')}
                                subtitle="https://wealth4s.vn/"
                                colors={colors}
                                onPress={openWebsite}
                            />
                            <ActionItem
                                icon="mail-outline"
                                title={t('settings.support')}
                                subtitle="support@w4s.vn"
                                colors={colors}
                                onPress={openSupport}
                            />
                            <ActionItem
                                icon="star-outline"
                                title={t('settings.rate_app')}
                                subtitle={t('settings.rate_app_desc')}
                                colors={colors}
                                onPress={() => { }}
                            />
                        </View>
                    </View>

                    <View style={styles.footerInfo}>
                        <Ionicons name="shield-checkmark-outline" size={normalize(24)} color={colors.icon} style={{ marginBottom: 10 }} />
                        <CustomText style={[styles.copyright, { color: colors.icon }]}>
                            © {new Date().getFullYear()} W4S. All rights reserved.
                        </CustomText>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Scroll
    scrollContent: {
        paddingHorizontal: wp(4.5),
        paddingTop: hp(2),
    },

    // Branding
    brandContainer: {
        alignItems: 'center',
        marginVertical: hp(3),
    },
    logoWrapper: {
        width: normalize(90),
        height: normalize(90),
        borderRadius: normalize(28),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: normalize(16),
        elevation: 8,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(150,150,150,0.1)',
    },
    appName: {
        fontSize: normalize(22),
        fontFamily: Fonts.bold,
        marginBottom: normalize(8),
        letterSpacing: 0.5,
    },
    badge: {
        paddingHorizontal: normalize(12),
        paddingVertical: normalize(4),
        borderRadius: normalize(16),
    },
    badgeText: {
        fontSize: normalize(12),
        fontFamily: Fonts.semiBold,
    },

    // Sections
    section: {
        marginTop: hp(2),
        marginBottom: hp(1),
    },
    sectionTitle: {
        fontSize: normalize(13),
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: normalize(12),
        marginLeft: normalize(4),
    },

    // Info tiles
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: normalize(10),
    },
    tile: {
        flex: 1,
        minWidth: '46%',
        padding: normalize(14),
        borderRadius: normalize(16),
        borderWidth: 1,
    },
    tileFull: {
        minWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(12),
    },
    tileLabel: {
        fontSize: normalize(11),
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    tileValue: {
        fontSize: normalize(14),
        fontFamily: Fonts.bold,
        marginTop: 4,
    },

    // Actions
    actionsContainer: {
        gap: normalize(8),
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: normalize(12),
        borderRadius: normalize(16),
        borderWidth: 1,
    },
    actionIconWrap: {
        width: normalize(42),
        height: normalize(42),
        borderRadius: normalize(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTitle: {
        fontSize: normalize(15),
        fontFamily: Fonts.semiBold,
    },
    actionSub: {
        fontSize: normalize(12),
        fontFamily: Fonts.regular,
        marginTop: 2,
    },

    // Footer
    footerInfo: {
        alignItems: 'center',
        marginTop: hp(5),
        paddingBottom: hp(2),
    },
    copyright: {
        fontSize: normalize(12),
        fontFamily: Fonts.medium,
        textAlign: 'center',
    }
});

export default AppInfoScreen;
