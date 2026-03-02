import CustomText from "@/components/base/CustomText";
import { apiClient } from "@/core/api/ApiClient";
import { useAppTheme } from "@/core/theme/ThemeContext";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    ScrollView,
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
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────
type ScreenState = "idle" | "listening" | "processing" | "done" | "error";

// ─── Pulse ring component (microphone animation) ──────────────────────────────
const PulseRing = ({ active, color }: { active: boolean; color: string }) => {
    const scale1 = useSharedValue(1);
    const scale2 = useSharedValue(1);
    const opacity1 = useSharedValue(0);
    const opacity2 = useSharedValue(0);

    useEffect(() => {
        if (active) {
            scale1.value = withRepeat(
                withSequence(
                    withTiming(1.6, { duration: 900, easing: Easing.out(Easing.ease) }),
                    withTiming(1, { duration: 0 })
                ),
                -1,
                false
            );
            opacity1.value = withRepeat(
                withSequence(
                    withTiming(0.5, { duration: 300 }),
                    withTiming(0, { duration: 600 })
                ),
                -1,
                false
            );
            scale2.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 450 }),
                    withTiming(1.9, { duration: 900, easing: Easing.out(Easing.ease) }),
                    withTiming(1, { duration: 0 })
                ),
                -1,
                false
            );
            opacity2.value = withRepeat(
                withSequence(
                    withTiming(0, { duration: 450 }),
                    withTiming(0.3, { duration: 300 }),
                    withTiming(0, { duration: 600 })
                ),
                -1,
                false
            );
        } else {
            cancelAnimation(scale1);
            cancelAnimation(scale2);
            cancelAnimation(opacity1);
            cancelAnimation(opacity2);
            scale1.value = withTiming(1);
            scale2.value = withTiming(1);
            opacity1.value = withTiming(0);
            opacity2.value = withTiming(0);
        }
    }, [active]);

    const ring1Style = useAnimatedStyle(() => ({
        transform: [{ scale: scale1.value }],
        opacity: opacity1.value,
    }));
    const ring2Style = useAnimatedStyle(() => ({
        transform: [{ scale: scale2.value }],
        opacity: opacity2.value,
    }));

    const SIZE = normalize(96);

    return (
        <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        borderRadius: SIZE / 2,
                        backgroundColor: color,
                    },
                    ring2Style,
                ]}
            />
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        borderRadius: SIZE / 2,
                        backgroundColor: color,
                    },
                    ring1Style,
                ]}
            />
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const VoiceTransactionScreen = () => {
    const { colors } = useAppTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const [screenState, setScreenState] = useState<ScreenState>("idle");
    const [transcript, setTranscript] = useState("");
    const [interimText, setInterimText] = useState("");
    const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Speech recognition events ──────────────────────────────────────────────
    useSpeechRecognitionEvent("start", () => {
        setScreenState("listening");
        setInterimText("");
    });

    useSpeechRecognitionEvent("end", () => {
        if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
        // If we have a final transcript, process it
        setTranscript((prev) => {
            if (prev.trim()) {
                handleSendToServer(prev);
            } else {
                setScreenState("idle");
            }
            return prev;
        });
    });

    useSpeechRecognitionEvent("result", (event) => {
        const result = event.results[0];
        if (event.isFinal) {
            const text = result?.transcript ?? "";
            setTranscript(text);
            setInterimText("");
            // Reset auto-stop timer on new speech
            if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
        } else {
            setInterimText(result?.transcript ?? "");
        }
    });

    useSpeechRecognitionEvent("error", (event) => {
        console.warn("[Voice] STT error:", event.error, event.message);
        if (event.error === "no-speech") {
            // Silence - just stop quietly
            setScreenState("idle");
        } else {
            setScreenState("error");
            Alert.alert(
                "Lỗi nhận dạng giọng nói",
                event.message || "Không thể nhận dạng giọng nói. Vui lòng thử lại.",
                [{ text: "OK", onPress: () => setScreenState("idle") }]
            );
        }
    });

    // ── Start listening ────────────────────────────────────────────────────────
    const handleStartListening = useCallback(async () => {
        setTranscript("");
        setInterimText("");

        const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perm.granted) {
            Alert.alert(
                "Cần quyền microphone",
                "Vui lòng cấp quyền microphone để dùng tính năng này.",
                [{ text: "OK" }]
            );
            return;
        }

        ExpoSpeechRecognitionModule.start({
            lang: "vi-VN",
            interimResults: true,
            continuous: false,
        });
    }, []);

    // ── Stop listening ─────────────────────────────────────────────────────────
    const handleStopListening = useCallback(() => {
        ExpoSpeechRecognitionModule.stop();
    }, []);

    // ── Send transcript to server ───────────────────────────────────────────────
    const handleSendToServer = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setScreenState("processing");
        try {
            const result = await apiClient.voiceTranscribe(text);
            console.log("[Voice] Server result:", result);
            setScreenState("done");

            // Navigate to add transaction with autofill if server returns data
            if (result?.data) {
                router.replace({
                    pathname: "/(protected)/transaction/add-transaction",
                    params: { voiceData: JSON.stringify(result.data) },
                });
            } else {
                // Mock: just navigate back with the raw text
                setScreenState("idle");
                Alert.alert("Đã gửi", `Giọng nói đã được nhận dạng:\n"${text}"`, [
                    { text: "OK", onPress: () => router.back() },
                ]);
            }
        } catch (err: any) {
            console.error("[Voice] Send error:", err);
            setScreenState("error");
            Alert.alert("Lỗi", err?.message || "Không thể xử lý giọng nói.", [
                { text: "Thử lại", onPress: () => setScreenState("idle") },
                { text: "Đóng", style: "cancel", onPress: () => router.back() },
            ]);
        }
    }, []);

    // ── Retry ──────────────────────────────────────────────────────────────────
    const handleRetry = useCallback(() => {
        setTranscript("");
        setInterimText("");
        setScreenState("idle");
    }, []);

    const isListening = screenState === "listening";
    const isProcessing = screenState === "processing";
    const displayText = transcript || interimText;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <FontAwesome6 name="xmark" size={normalize(22)} color={colors.text} />
                </TouchableOpacity>
                <CustomText style={styles.headerTitle}>Tạo giao dịch bằng giọng nói</CustomText>
                <View style={styles.headerBtn} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Hint text */}
                <CustomText style={styles.hint}>
                    {isListening
                        ? "Đang lắng nghe... Nói câu lệnh của bạn"
                        : isProcessing
                            ? "Đang phân tích..."
                            : screenState === "done"
                                ? "Hoàn tất!"
                                : "Nhấn giữ nút mic để bắt đầu nói"}
                </CustomText>

                {/* Examples */}
                {screenState === "idle" && (
                    <View style={styles.examples}>
                        {[
                            "\"Chi 50 nghìn tiền cà phê sáng nay\"",
                            "\"Thu nhập 5 triệu tiền lương\"",
                            "\"Ăn trưa 120 nghìn hôm qua\"",
                        ].map((ex, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.exampleChip, { borderColor: colors.border, backgroundColor: colors.card }]}
                                onPress={() => {
                                    const clean = ex.replace(/"/g, "");
                                    setTranscript(clean);
                                    handleSendToServer(clean);
                                }}
                            >
                                <FontAwesome6 name="lightbulb" size={normalize(12)} color={colors.tint} solid />
                                <CustomText style={[styles.exampleText, { color: colors.text }]}>{ex}</CustomText>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Transcript display */}
                {displayText.length > 0 && (
                    <ScrollView
                        style={[styles.transcriptBox, { backgroundColor: colors.card, borderColor: colors.border }]}
                        showsVerticalScrollIndicator={false}
                    >
                        <CustomText
                            style={[
                                styles.transcriptText,
                                { color: transcript ? colors.text : colors.icon },
                            ]}
                        >
                            {displayText}
                        </CustomText>
                    </ScrollView>
                )}

                {/* Mic button */}
                <View style={styles.micWrapper}>
                    <PulseRing active={isListening} color={colors.tint} />

                    <TouchableOpacity
                        style={[
                            styles.micBtn,
                            {
                                backgroundColor: isListening
                                    ? "#EF4444"
                                    : isProcessing
                                        ? colors.border
                                        : colors.tint,
                            },
                        ]}
                        onPress={isListening ? handleStopListening : handleStartListening}
                        disabled={isProcessing}
                        activeOpacity={0.8}
                    >
                        <FontAwesome6
                            name={isListening ? "stop" : isProcessing ? "spinner" : "microphone"}
                            size={normalize(28)}
                            color="#fff"
                            solid
                        />
                    </TouchableOpacity>
                </View>

                {/* State label */}
                <CustomText style={[styles.stateLabel, { color: colors.icon }]}>
                    {isListening
                        ? "Nhấn ■ để dừng"
                        : isProcessing
                            ? "Đang xử lý..."
                            : "Nhấn 🎙 để nói"}
                </CustomText>

                {/* Retry / re-send actions */}
                {transcript.length > 0 && !isListening && !isProcessing && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                            onPress={handleRetry}
                        >
                            <FontAwesome6 name="rotate-left" size={normalize(14)} color={colors.text} solid />
                            <CustomText style={[styles.actionBtnText, { color: colors.text }]}>Nói lại</CustomText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.tint }]}
                            onPress={() => handleSendToServer(transcript)}
                        >
                            <FontAwesome6 name="paper-plane" size={normalize(14)} color="#fff" solid />
                            <CustomText style={[styles.actionBtnText, { color: "#fff" }]}>Gửi</CustomText>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: wp(4),
            paddingVertical: hp(1.5),
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerBtn: {
            width: normalize(40),
            height: normalize(40),
            alignItems: "center",
            justifyContent: "center",
        },
        headerTitle: {
            fontSize: normalize(16),
            fontFamily: Fonts.semiBold,
            color: colors.text,
            textAlign: "center",
            flex: 1,
        },
        content: {
            flex: 1,
            alignItems: "center",
            paddingHorizontal: wp(5),
            paddingTop: hp(3),
        },
        hint: {
            fontSize: normalize(15),
            fontFamily: Fonts.medium,
            color: colors.text,
            textAlign: "center",
            marginBottom: hp(2),
        },

        // ── Examples ──
        examples: {
            width: "100%",
            gap: hp(1),
            marginBottom: hp(3),
        },
        exampleChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: wp(2),
            paddingVertical: hp(1.2),
            paddingHorizontal: wp(3.5),
            borderRadius: normalize(12),
            borderWidth: 1,
        },
        exampleText: {
            fontSize: normalize(13),
            fontFamily: Fonts.regular,
            flex: 1,
        },

        // ── Transcript ──
        transcriptBox: {
            width: "100%",
            maxHeight: hp(18),
            borderRadius: normalize(16),
            padding: normalize(16),
            borderWidth: 1,
            marginBottom: hp(2),
        },
        transcriptText: {
            fontSize: normalize(17),
            fontFamily: Fonts.medium,
            lineHeight: normalize(26),
        },

        // ── Mic button ──
        micWrapper: {
            alignItems: "center",
            justifyContent: "center",
            marginVertical: hp(3),
        },
        micBtn: {
            position: "absolute",
            width: normalize(72),
            height: normalize(72),
            borderRadius: normalize(36),
            alignItems: "center",
            justifyContent: "center",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
        },
        stateLabel: {
            fontSize: normalize(13),
            fontFamily: Fonts.regular,
            marginTop: hp(1),
        },

        // ── Actions ──
        actions: {
            flexDirection: "row",
            gap: wp(3),
            marginTop: hp(3),
            width: "100%",
        },
        actionBtn: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: wp(2),
            paddingVertical: hp(1.8),
            borderRadius: normalize(12),
            borderWidth: 1,
            borderColor: "transparent",
        },
        actionBtnText: {
            fontSize: normalize(15),
            fontFamily: Fonts.semiBold,
        },
    });

export default VoiceTransactionScreen;
