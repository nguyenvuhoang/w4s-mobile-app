import CustomButton from "@/components/base/CustomButton";
import CustomText from "@/components/base/CustomText";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from "react-native-vision-camera";

// ─── State machine ────────────────────────────────────────────────────────────
type ScanState = "idle" | "scanning" | "success" | "error";

// ─── Scan line component ──────────────────────────────────────────────────────
const FRAME_WIDTH = wp(90);
const FRAME_HEIGHT = hp(65);

const ScanLine = ({ frameHeight }: { frameHeight: number }) => {
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(
            withTiming(frameHeight - 3, {
                duration: 1800,
                easing: Easing.inOut(Easing.quad),
            }),
            -1,   // infinite
            true  // reverse direction each time
        );
        return () => cancelAnimation(translateY);
    }, [frameHeight]);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[scanLineStyles.container, animStyle]}>
            {/* Glow line */}
            <View style={scanLineStyles.line} />
            {/* Soft gradient glow above/below */}
            <View style={scanLineStyles.glowTop} />
            <View style={scanLineStyles.glowBottom} />
        </Animated.View>
    );
};

const scanLineStyles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 3,
    },
    line: {
        height: 3,
        backgroundColor: "#22D3EE",
        shadowColor: "#22D3EE",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 8,
    },
    glowTop: {
        height: 12,
        marginTop: -12,
        backgroundColor: "rgba(34,211,238,0.15)",
    },
    glowBottom: {
        height: 12,
        backgroundColor: "rgba(34,211,238,0.15)",
    },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
const ScanInvoiceScreen = () => {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice("back");
    const camera = useRef<Camera>(null);

    const [isCameraActive, setIsCameraActive] = useState(true);
    const [scanState, setScanState] = useState<ScanState>("idle");
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<any>(null);
    const [flashOn, setFlashOn] = useState(false);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission]);

    // ── Capture photo ──────────────────────────────────────────────────────────
    const handleCapture = useCallback(async () => {
        if (!camera.current || scanState !== "idle") return;

        try {
            // 1. Take photo while camera is still active
            const photo = await camera.current.takePhoto({
                flash: flashOn ? "on" : "off",
            });
            const uri = `file://${photo.path}`;
            console.log("[ScanInvoice] Photo captured:", uri);

            // 2. Show preview + scan animation
            setCapturedUri(uri);
            setScanState("scanning");
            setIsCameraActive(false);

            // 3. Mock API delay & navigate
            setTimeout(() => {
                // const result = await apiClient.scanInvoice(uri);
                // setScanResult(result);

                setScanState("idle");
                setIsCameraActive(true);

                router.push({
                    pathname: "/(protected)/invoice/create-invoice",
                    params: {
                        autofillData: JSON.stringify({
                            walletId: 86,
                            category: {
                                category_id: "cat_001",
                                category_name: JSON.stringify({ vi: "Tiền điện", en: "Electricity" }),
                                category_type: "EXPENSE",
                                icon: "bolt",
                                color: "#FFB800"
                            },
                            amount: 150000,
                            date: "2026-02-15",
                            note: "Tiền điện tháng 2",
                            recurring: {
                                type: "monthly",
                                count: 12,
                                isForever: false,
                                selectedDays: [1]
                            }
                        })
                    }
                });
            }, 2000); // Fake 2 seconds processing
        } catch (err: any) {
            console.error("[ScanInvoice] Error:", err);
            setScanState("error");
            setIsCameraActive(true);
            Alert.alert(
                t("invoice.scan_error"),
                err?.message || t("invoice.scan_failed_desc"),
                [
                    {
                        text: t("common.retry"),
                        onPress: () => {
                            setCapturedUri(null);
                            setScanState("idle");
                            setIsCameraActive(true);
                        },
                    },
                    { text: t("common.close"), style: "cancel", onPress: () => router.back() },
                ]
            );
        }
    }, [scanState, flashOn, t]);

    // ── Retry ──────────────────────────────────────────────────────────────────
    const handleRetry = useCallback(() => {
        setCapturedUri(null);
        setScanResult(null);
        setScanState("idle");
        setIsCameraActive(true);
    }, []);

    // ─── No permission ─────────────────────────────────────────────────────────
    if (!hasPermission) {
        return (
            <SafeAreaView style={[styles.container, styles.center]} edges={["top", "bottom"]}>
                <FontAwesome6
                    name="camera-slash"
                    size={normalize(48)}
                    color={colors.icon}
                    solid
                />
                <CustomText style={styles.permissionTitle}>
                    {t("invoice.camera_permission_title")}
                </CustomText>
                <CustomText style={styles.permissionDesc}>
                    {t("invoice.camera_permission_desc")}
                </CustomText>
                <CustomButton
                    title={t("invoice.grant_permission")}
                    onPress={requestPermission}
                    useGradient
                    style={styles.actionBtn}
                />
            </SafeAreaView>
        );
    }

    // ─── No device ─────────────────────────────────────────────────────────────
    if (!device) {
        return (
            <SafeAreaView style={[styles.container, styles.center]} edges={["top", "bottom"]}>
                <CustomText style={styles.permissionDesc}>
                    {t("invoice.starting_camera")}
                </CustomText>
            </SafeAreaView>
        );
    }

    // ─── Success result has been bypassed directly to CreateInvoiceScreen ───

    // ─── Camera + Preview ──────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            {/* Live camera (hidden when scanning) */}
            <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isCameraActive}
                photo
            />

            {/* Photo preview overlay (shown when scanning) */}
            {scanState === "scanning" && capturedUri && (
                <View style={StyleSheet.absoluteFillObject}>
                    <Image
                        source={{ uri: capturedUri }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                    {/* Dark tinted overlay for contrast */}
                    <View style={styles.previewOverlay} />
                </View>
            )}

            {/* UI Overlay */}
            <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.headerBtn}
                    >
                        <FontAwesome6 name="xmark" size={normalize(22)} color="#fff" />
                    </TouchableOpacity>
                    <CustomText style={[styles.headerTitle, { color: "#fff" }]}>
                        {scanState === "scanning" ? t("invoice.analyzing") : t("invoice.scan_title")}
                    </CustomText>
                    {scanState === "idle" ? (
                        <TouchableOpacity
                            onPress={() => setFlashOn((v) => !v)}
                            style={styles.headerBtn}
                        >
                            <FontAwesome6
                                name={flashOn ? "bolt" : "bolt-lightning"}
                                size={normalize(20)}
                                color={flashOn ? "#FBBF24" : "#fff"}
                                solid
                            />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerBtn} />
                    )}
                </View>

                {/* Scan frame area */}
                <View style={styles.frameWrapper}>
                    <View style={styles.scanFrame}>
                        {/* Corner decorations */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />

                        {/* Animated scan line — shown only when scanning */}
                        {scanState === "scanning" && (
                            <ScanLine frameHeight={FRAME_HEIGHT} />
                        )}
                    </View>

                    <CustomText style={styles.frameHint}>
                        {scanState === "scanning"
                            ? t("invoice.ai_reading")
                            : t("invoice.frame_hint")}
                    </CustomText>
                </View>

                {/* Bottom controls */}
                <View style={styles.bottomControls}>
                    {scanState === "idle" && (
                        <TouchableOpacity
                            style={styles.captureBtn}
                            onPress={handleCapture}
                            activeOpacity={0.8}
                        >
                            <View style={styles.captureBtnInner} />
                        </TouchableOpacity>
                    )}
                    {scanState === "scanning" && (
                        <View style={styles.scanningBadge}>
                            <View style={styles.pulsingDot} />
                            <CustomText style={styles.scanningText}>
                                {t("invoice.processing_wait")}
                            </CustomText>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

// ─── ResultRow component ──────────────────────────────────────────────────────
const ResultRow = ({
    icon,
    label,
    value,
    colors,
}: {
    icon: string;
    label: string;
    value: string;
    colors: any;
}) => (
    <View style={rrStyles.row}>
        <View style={[rrStyles.iconWrap, { backgroundColor: colors.tint + "20" }]}>
            <FontAwesome6
                name={icon as any}
                size={normalize(14)}
                color={colors.tint}
                solid
            />
        </View>
        <View style={rrStyles.textWrap}>
            <CustomText style={[rrStyles.label, { color: colors.icon }]}>
                {label}
            </CustomText>
            <CustomText style={[rrStyles.value, { color: colors.text }]}>
                {value}
            </CustomText>
        </View>
    </View>
);

const rrStyles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: wp(3),
        paddingVertical: hp(0.8),
    },
    iconWrap: {
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(10),
        alignItems: "center",
        justifyContent: "center",
    },
    textWrap: { flex: 1 },
    label: {
        fontSize: normalize(12),
        fontFamily: Fonts.regular,
    },
    value: {
        fontSize: normalize(15),
        fontFamily: Fonts.semiBold,
        marginTop: 2,
    },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const CORNER_SIZE = normalize(24);
const CORNER_THICKNESS = 3;
const CORNER_COLOR = "#fff";

const createStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#000",
        },
        center: {
            alignItems: "center",
            justifyContent: "center",
            gap: hp(2),
            backgroundColor: colors.background,
            paddingHorizontal: wp(8),
        },
        overlay: {
            flex: 1,
        },
        previewOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.35)",
        },

        // ── Header ──
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: wp(4),
            paddingVertical: hp(1.5),
        },
        headerBtn: {
            width: normalize(40),
            height: normalize(40),
            alignItems: "center",
            justifyContent: "center",
        },
        headerTitle: {
            fontSize: normalize(18),
            fontFamily: Fonts.semiBold,
        },

        // ── Frame ──
        frameWrapper: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: hp(2),
        },
        scanFrame: {
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            position: "relative",
            overflow: "hidden",
        },
        corner: {
            position: "absolute",
            width: CORNER_SIZE,
            height: CORNER_SIZE,
            borderColor: CORNER_COLOR,
        },
        cornerTL: {
            top: 0,
            left: 0,
            borderTopWidth: CORNER_THICKNESS,
            borderLeftWidth: CORNER_THICKNESS,
            borderTopLeftRadius: normalize(4),
        },
        cornerTR: {
            top: 0,
            right: 0,
            borderTopWidth: CORNER_THICKNESS,
            borderRightWidth: CORNER_THICKNESS,
            borderTopRightRadius: normalize(4),
        },
        cornerBL: {
            bottom: 0,
            left: 0,
            borderBottomWidth: CORNER_THICKNESS,
            borderLeftWidth: CORNER_THICKNESS,
            borderBottomLeftRadius: normalize(4),
        },
        cornerBR: {
            bottom: 0,
            right: 0,
            borderBottomWidth: CORNER_THICKNESS,
            borderRightWidth: CORNER_THICKNESS,
            borderBottomRightRadius: normalize(4),
        },
        frameHint: {
            fontSize: normalize(14),
            fontFamily: Fonts.regular,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
        },

        // ── Bottom controls ──
        bottomControls: {
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: hp(5),
            minHeight: hp(16),
        },
        captureBtn: {
            width: normalize(72),
            height: normalize(72),
            borderRadius: normalize(36),
            backgroundColor: "rgba(255,255,255,0.25)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 3,
            borderColor: "#fff",
        },
        captureBtnInner: {
            width: normalize(56),
            height: normalize(56),
            borderRadius: normalize(28),
            backgroundColor: "#fff",
        },
        scanningBadge: {
            flexDirection: "row",
            alignItems: "center",
            gap: wp(2.5),
            backgroundColor: "rgba(0,0,0,0.55)",
            paddingHorizontal: wp(5),
            paddingVertical: hp(1.2),
            borderRadius: normalize(24),
        },
        pulsingDot: {
            width: normalize(10),
            height: normalize(10),
            borderRadius: normalize(5),
            backgroundColor: "#22D3EE",
        },
        scanningText: {
            color: "#fff",
            fontSize: normalize(14),
            fontFamily: Fonts.medium,
        },

        // ── Permission ──
        permissionTitle: {
            fontSize: normalize(18),
            fontFamily: Fonts.semiBold,
            color: colors.text,
            textAlign: "center",
        },
        permissionDesc: {
            fontSize: normalize(14),
            fontFamily: Fonts.regular,
            color: colors.icon,
            textAlign: "center",
            lineHeight: normalize(22),
        },

        // ── Success result ──
        thumbnailWrap: {
            alignSelf: "center",
            marginTop: hp(1),
            marginBottom: hp(1.5),
        },
        thumbnail: {
            width: wp(55),
            height: wp(40),
            borderRadius: normalize(12),
        },
        successBadge: {
            position: "absolute",
            bottom: -normalize(10),
            right: -normalize(10),
            width: normalize(28),
            height: normalize(28),
            borderRadius: normalize(14),
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#fff",
        },
        successTitle: {
            fontSize: normalize(18),
            fontFamily: Fonts.semiBold,
            textAlign: "center",
            marginBottom: hp(1.5),
        },
        resultCard: {
            marginHorizontal: wp(5),
            borderRadius: normalize(16),
            padding: normalize(16),
            borderWidth: 1,
            gap: hp(0.2),
        },
        resultActions: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: wp(5),
            paddingBottom: hp(4),
            gap: hp(1.2),
        },

        // ── Action button ──
        actionBtn: {
            paddingVertical: hp(1.8),
            borderRadius: normalize(12),
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: wp(2),
        },
        actionBtnText: {
            fontSize: normalize(16),
            fontFamily: Fonts.semiBold,
            color: "#fff",
        },
    });

export default ScanInvoiceScreen;
