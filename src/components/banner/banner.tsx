import { useAppTheme } from "@/core/theme/ThemeContext";
import { BackgroundOption, useThemeService } from "@/services/ThemeService";
import { normalize, width as SCREEN_WIDTH } from "@/utils/layout";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
    Image,
    LayoutAnimation,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";
import StorageKey from "../../constants/StorageKey";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HomeBannersProps {
    storageKey?: string;
}

const HomeBanners: React.FC<HomeBannersProps> = ({ storageKey = StorageKey.HomeBanners }) => {
    const { colors } = useAppTheme();
    const { getBackgroundOptions } = useThemeService();

    const [homeBanners, setHomeBanners] = useState<BackgroundOption[]>([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [imageHeights, setImageHeights] = useState<Record<string, number>>({});

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const fetchBanners = async () => {
                const banners = await getBackgroundOptions(storageKey);
                if (isMounted) {
                    setHomeBanners(banners);
                }
            };
            fetchBanners();
            return () => {
                isMounted = false;
            };
        }, [getBackgroundOptions, storageKey])
    );

    useEffect(() => {
        homeBanners.forEach((banner) => {
            if (banner.imageUrl && !imageHeights[banner.id]) {
                Image.getSize(
                    banner.imageUrl,
                    (width, height) => {
                        const aspect = width / height;
                        const containerWidth = SCREEN_WIDTH - normalize(40);
                        const calculatedHeight = containerWidth / aspect;
                        setImageHeights((prev) => ({
                            ...prev,
                            [banner.id]: calculatedHeight,
                        }));
                    },
                    (error) => {
                        console.warn("Failed to get image size for:", banner.imageUrl, error);
                    }
                );
            }
        });
    }, [homeBanners]);

    const activeBanner = homeBanners[currentBannerIndex];
    const defaultHeight = normalize(165);
    const containerHeight = activeBanner ? ((imageHeights[activeBanner.id] ? imageHeights[activeBanner.id] + normalize(20) : defaultHeight)) : defaultHeight;

    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [containerHeight]);

    if (homeBanners.length === 0) return null;

    return (
        <View style={[styles.bannerContainer, { height: containerHeight }]}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_WIDTH}
                snapToAlignment="center"
                decelerationRate="fast"
                bounces={true}
                style={styles.bannerScrollView}
                contentContainerStyle={styles.bannerContent}
                onScroll={(event) => {
                    const offsetX = event.nativeEvent.contentOffset.x;
                    const index = Math.round(offsetX / SCREEN_WIDTH);
                    setCurrentBannerIndex(index);
                }}
                scrollEventThrottle={16}
            >
                {homeBanners.map((banner) => (
                    <View key={banner.id} style={styles.bannerWrapper}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={[
                                styles.bannerShadow,
                                { backgroundColor: colors.background },
                            ]}
                            onPress={() => banner?.linkUrl && Linking.openURL(banner.linkUrl)}
                        >
                            <View style={styles.bannerItem}>
                                <Image
                                    source={{ uri: banner.imageUrl }}
                                    style={styles.bannerImage}
                                    resizeMode="cover"
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
            {homeBanners.length > 1 && (
                <View style={styles.indicatorContainer}>
                    {homeBanners.map((_, index) => {
                        const isActive = currentBannerIndex === index;
                        if (isActive) {
                            return (
                                <LinearGradient
                                    key={index}
                                    colors={colors.gradianBase}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.indicatorDot,
                                        { width: normalize(20), opacity: 1 },
                                    ]}
                                />
                            );
                        }
                        return (
                            <View
                                key={index}
                                style={[
                                    styles.indicatorDot,
                                    {
                                        backgroundColor: colors.tint,
                                        width: normalize(8),
                                        opacity: 0.3,
                                    },
                                ]}
                            />
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        marginTop: normalize(5),
        marginBottom: normalize(10),
        height: normalize(165),
    },
    bannerScrollView: {
        width: SCREEN_WIDTH,
        overflow: "visible",
    },
    bannerContent: {
        paddingVertical: normalize(8),
    },
    bannerWrapper: {
        width: SCREEN_WIDTH,
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(2),
    },
    bannerShadow: {
        width: "100%",
        height: "100%",
        borderRadius: normalize(15),
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    bannerItem: {
        width: "100%",
        height: "100%",
        borderRadius: normalize(15),
        overflow: "hidden",
    },
    bannerImage: {
        width: "100%",
        height: "100%",
    },
    indicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: normalize(10),
    },
    indicatorDot: {
        height: normalize(8),
        borderRadius: normalize(10),
        marginHorizontal: normalize(4),
        overflow: "hidden",
    },
});

export default HomeBanners;
