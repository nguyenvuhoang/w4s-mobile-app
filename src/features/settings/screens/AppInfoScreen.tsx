import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Images } from '@/utils/images';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Image,
    Linking,
    Platform,
    ScrollView,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles/AppInfoScreen.styles';

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
        <Ionicons name={icon} size={normalize(18)} color={colors.tint} style={{ marginBottom: 6 }} />
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
                <View style={[styles.actionIconWrap, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name={icon} size={normalize(20)} color={colors.tint} />
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

    const logoAnim = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(20)).current;

    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const buildNumber = Platform.OS === 'ios' ? (Constants.expoConfig?.ios?.buildNumber || '1') : (Constants.expoConfig?.android?.versionCode?.toString() || '1');
    const sdkVersion = Constants.expoConfig?.sdkVersion || '50.0.0';
    const updateId = Updates.updateId ? Updates.updateId.slice(0, 8) : 'dev';

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
                <Animated.View style={[styles.brandContainer, { opacity: logoAnim, transform: [{ scale: logoScale }] }]}>
                    <View style={[styles.logoWrapper, { backgroundColor: colors.card, shadowColor: colors.tint }]}>
                        <Image
                            source={isDark ? Images.appLogoLight : Images.appLogoDark}
                            style={{ width: normalize(60), height: normalize(60) }}
                            resizeMode="contain"
                        />
                    </View>
                    <CustomText style={[styles.appName, { color: colors.text }]}>
                        W4S Mobile
                    </CustomText>
                    <View style={[styles.badge, { backgroundColor: colors.tint + '15' }]}>
                        <CustomText style={[styles.badgeText, { color: colors.tint }]}>
                            {t('settings.version')} {appVersion} ({updateId})
                        </CustomText>
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: logoAnim, transform: [{ translateY: contentAnim }] }}>
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
                                subtitle="support@wealth4s.vn"
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

export default AppInfoScreen;
