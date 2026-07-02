import CustomButton from "@/components/base/CustomButton";
import CustomText from "@/components/base/CustomText";
import { apiClient } from "@/core/api";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { useCategory } from "@/hooks/useCategory";
import { normalize } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Image,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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
    useCameraFormat,
    useCameraPermission,
} from "react-native-vision-camera";
import {
    createStyles,
    scanLineStyles,
    FRAME_WIDTH,
    FRAME_HEIGHT,
} from "../styles/ScanInvoiceScreen.styles";

// State machine
type ScanState = "idle" | "scanning" | "success" | "error";

// Scan line component

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

// Main screen
const ScanInvoiceScreen = () => {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const { categories } = useCategory();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice("back");
    const format = useCameraFormat(device, [
        { photoResolution: "max" },
        { videoResolution: "max" },
    ]);
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

    // Process captured or picked invoice image
    const processInvoiceImage = useCallback(async (uri: string) => {
        try {
            // Show preview + scan animation
            setCapturedUri(uri);
            setScanState("scanning");
            setIsCameraActive(false);

            // Call API & process result
            console.log("[ScanInvoice] Starting API call to scanInvoice...", uri);
            const result = await apiClient.scanInvoice(uri);
            console.log("[ScanInvoice] API Result:", result);

            if (result && result.success && result.data) {
                const invoiceData = result.data;

                const serverCategoryId = invoiceData.category?.category_id;
                const matchedCategory = categories.find(c => c.id === serverCategoryId);

                const autofillData = {
                    walletId: invoiceData.wallet_id !== 0 ? invoiceData.wallet_id : undefined,
                    category: matchedCategory ? {
                        id: matchedCategory.id,
                        category_id: String(matchedCategory.id),
                        category_name: matchedCategory.category_name,
                        category_type: matchedCategory.category_type,
                        category_group: matchedCategory.category_group,
                        icon: matchedCategory.icon,
                        color: matchedCategory.color
                    } : null,
                    amount: invoiceData.amount,
                    date: invoiceData.date,
                    note: invoiceData.note || "",
                };

                setScanState("idle");
                setIsCameraActive(true);

                router.push({
                    pathname: "/(protected)/invoice/create-invoice",
                    params: {
                        autofillData: JSON.stringify(autofillData)
                    }
                });
            } else {
                throw new Error(result?.error_message || t("invoice.scan_failed_desc"));
            }
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
    }, [t, categories]);

    // Capture photo
    const handleCapture = useCallback(async () => {
        if (!camera.current || scanState !== "idle") return;

        try {
            // 1. Take photo
            const photo = await camera.current.takePhoto({
                flash: flashOn ? "on" : "off",
                enableShutterSound: false,
            });
            const uri = `file://${photo.path}`;
            console.log("[ScanInvoice] Photo Captured Details:", {
                uri,
                width: photo.width,
                height: photo.height,
                path: photo.path
            });

            await processInvoiceImage(uri);
        } catch (err: any) {
            console.error("[ScanInvoice] Capture Error:", err);
        }
    }, [scanState, flashOn, processInvoiceImage]);

    // Pick image from library
    const handlePickImage = useCallback(async () => {
        if (scanState !== "idle") return;

        try {
            // Permission check for iOS/Android
            if (Platform.OS !== "android") {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert(
                        t("invoice.photo_permission_title"),
                        t("invoice.photo_permission_desc"),
                        [{ text: t("common.close"), style: "cancel" }]
                    );
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.length) return;

            const uri = result.assets[0].uri;
            await processInvoiceImage(uri);
        } catch (err: any) {
            console.error("[ScanInvoice] Pick Image Error:", err);
        }
    }, [scanState, t, processInvoiceImage]);

    // Retry
    const handleRetry = useCallback(() => {
        setCapturedUri(null);
        setScanResult(null);
        setScanState("idle");
        setIsCameraActive(true);
    }, []);

    // No permission
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

    // No device
    if (!device) {
        return (
            <SafeAreaView style={[styles.container, styles.center]} edges={["top", "bottom"]}>
                <CustomText style={styles.permissionDesc}>
                    {t("invoice.starting_camera")}
                </CustomText>
            </SafeAreaView>
        );
    }

    // Success result has been bypassed directly to CreateInvoiceScreen

    // Camera + Preview
    return (
        <View style={styles.container}>
            {/* Live camera (hidden when scanning) */}
            <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                format={format}
                photoQualityBalance="quality"
                photoHdr={format?.supportsPhotoHdr}
                isActive={isCameraActive}
                photo={true}
                enableZoomGesture
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
                        <View style={styles.bottomControlsRow}>
                            <TouchableOpacity
                                style={styles.galleryBtn}
                                onPress={handlePickImage}
                                activeOpacity={0.7}
                            >
                                <FontAwesome6 name="image" size={normalize(22)} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.captureBtn}
                                onPress={handleCapture}
                                activeOpacity={0.8}
                            >
                                <View style={styles.captureBtnInner} />
                            </TouchableOpacity>

                            <View style={styles.spacerBtn} />
                        </View>
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

export default ScanInvoiceScreen;
