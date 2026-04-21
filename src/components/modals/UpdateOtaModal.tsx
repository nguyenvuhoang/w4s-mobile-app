import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlobalContext } from '../../contexts/GlobalContext';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { normalize } from '../../utils/layout';
import CustomButton from '../base/CustomButton';
import CustomText from '../base/CustomText';

const HIDE_DURATION = 3 * 60 * 1000; // 3 minutes
const HIDE_TIMESTAMP_KEY = 'updateBannerHideTimestampv2';

const UpdateOtaModal = () => {
    const {
        isOtaUpdateAvailable,
        isOtaDownloading,
        isOtaUpdateReady,
        startOtaUpdate,
        reloadOtaApp
    } = useContext(GlobalContext);

    const [isVisible, setIsVisible] = useState(false);
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const checkVisibility = async () => {
            if (isOtaUpdateAvailable) {
                const hideTimestamp = await AsyncStorage.getItem(HIDE_TIMESTAMP_KEY);
                if (hideTimestamp) {
                    const hiddenUntil = parseInt(hideTimestamp, 10);
                    if (Date.now() < hiddenUntil) {
                        const timeout = hiddenUntil - Date.now();
                        setTimeout(() => setIsVisible(true), timeout);
                    } else {
                        setIsVisible(true);
                    }
                } else {
                    setIsVisible(true);
                }
            } else {
                setIsVisible(false);
            }
        };

        checkVisibility();
    }, [isOtaUpdateAvailable]);

    const handleHideBanner = async () => {
        const hiddenUntil = Date.now() + HIDE_DURATION;
        await AsyncStorage.setItem(HIDE_TIMESTAMP_KEY, hiddenUntil.toString());
        setIsVisible(false);
        setTimeout(() => setIsVisible(true), HIDE_DURATION);
    };

    const renderContent = () => {
        if (isOtaUpdateReady) {
            return (
                <>
                    <View style={[styles.iconContainer, { backgroundColor: colors.tint + '1A' }]}>
                        <MaterialCommunityIcons name="check-decagram-outline" size={normalize(44)} color={colors.tint} />
                    </View>
                    <CustomText style={styles.titleText}>
                        {t("updateBanner.updateDownloaded")}
                    </CustomText>
                    <CustomText style={[styles.subtitleText, { color: colors.icon }]}>
                        {t("updateBanner.updateReadySubtitle")}
                    </CustomText>
                    <CustomButton
                        title={t("updateBanner.restartNow")}
                        onPress={reloadOtaApp}
                        style={[styles.updateButton, { backgroundColor: colors.tint }]}
                        textStyle={[styles.buttonText, { color: '#fff' }]}
                    />
                </>
            );
        }

        if (isOtaDownloading) {
            return (
                <>
                    <View style={[styles.iconContainer, { backgroundColor: colors.tint + '1A' }]}>
                        <MaterialCommunityIcons name="cloud-download-outline" size={normalize(44)} color={colors.tint} />
                    </View>
                    <CustomText style={styles.titleText}>
                        {t("updateBanner.downloadingTitle")}
                    </CustomText>
                    <CustomText style={[styles.subtitleText, { color: colors.icon }]}>
                        {t("updateBanner.downloadingSubtitle")}
                    </CustomText>
                    <ActivityIndicator color={colors.tint} size="large" style={{ marginVertical: normalize(10) }} />
                </>
            );
        }

        return (
            <>
                <View style={[styles.iconContainer, { backgroundColor: colors.tint + '1A' }]}>
                    <MaterialCommunityIcons name="rocket-launch-outline" size={normalize(44)} color={colors.tint} />
                </View>
                <CustomText style={styles.titleText}>
                    {t("updateBanner.newUpdateAvailable")}
                </CustomText>
                <CustomText style={[styles.subtitleText, { color: colors.icon }]}>
                    {t("updateBanner.updateSubtitle")}
                </CustomText>
                <CustomButton
                    title={t("updateBanner.updateNow")}
                    onPress={startOtaUpdate}
                    style={[styles.updateButton, { backgroundColor: colors.tint }]}
                    textStyle={[styles.buttonText, { color: '#fff' }]}
                />
            </>
        );
    };

    if (!isVisible) {
        return null;
    }
    // return null;
    return (
        <View style={styles.overlay}>
            <View style={[styles.bannerContainer, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={handleHideBanner} style={[styles.closeButton, { backgroundColor: colors.background }]}>
                    <AntDesign name="close" size={normalize(20)} color={colors.icon} />
                </TouchableOpacity>
                <View style={styles.contentWrapper}>
                    {renderContent()}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    bannerContainer: {
        width: '85%',
        borderRadius: normalize(24),
        padding: normalize(24),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    contentWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: normalize(5),
    },
    iconContainer: {
        width: normalize(76),
        height: normalize(76),
        borderRadius: normalize(38),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(20),
    },
    titleText: {
        fontSize: normalize(18),
        textAlign: 'center',
        fontWeight: '800',
        marginBottom: normalize(10),
    },
    subtitleText: {
        fontSize: normalize(14),
        textAlign: 'center',
        marginBottom: normalize(24),
        lineHeight: normalize(20),
        paddingHorizontal: normalize(10),
    },
    bannerText: {
        fontSize: normalize(16),
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: normalize(20),
    },
    updateButton: {
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(12),
        height: 'auto', // Override CustomButton's fixed height
        backgroundColor: '#56605c',
        borderRadius: normalize(30),
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    buttonText: {
        fontSize: normalize(15),
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        top: normalize(14),
        right: normalize(14),
        padding: normalize(8),
        zIndex: 1,
        borderRadius: normalize(20),
    }
});

export default UpdateOtaModal;
