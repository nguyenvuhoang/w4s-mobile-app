import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlobalContext } from '../../contexts/GlobalContext';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { normalize } from '../../utils/layout';
import CustomButton from '../base/CustomButton';
import CustomText from '../base/CustomText';

const UpdateOtaModal = () => {
    const {
        isOtaUpdateAvailable,
        isOtaDownloading,
        isOtaUpdateReady,
        reloadOtaApp,
        otaPriority
    } = useContext(GlobalContext);

    const [isVisible, setIsVisible] = useState(false);
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (isOtaUpdateAvailable && otaPriority === 'force') {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [isOtaUpdateAvailable, otaPriority]);

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

        return null;
    };

    if (!isVisible) {
        return null;
    }

    return (
        <View style={styles.overlay}>
            <View style={[styles.bannerContainer, { backgroundColor: colors.card }]}>
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
    updateButton: {
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(12),
        height: 'auto',
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
    }
});

export default UpdateOtaModal;
