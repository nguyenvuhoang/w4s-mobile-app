import { StyleSheet } from "react-native";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";

export const FRAME_WIDTH = wp(90);
export const FRAME_HEIGHT = hp(65);

const CORNER_SIZE = normalize(24);
const CORNER_THICKNESS = 3;
const CORNER_COLOR = "#fff";

export const scanLineStyles = StyleSheet.create({
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

export const rrStyles = StyleSheet.create({
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

export const createStyles = (colors: any) =>
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
        bottomControlsRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingHorizontal: wp(12),
        },
        galleryBtn: {
            width: normalize(52),
            height: normalize(52),
            borderRadius: normalize(26),
            backgroundColor: "rgba(255,255,255,0.18)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
        },
        spacerBtn: {
            width: normalize(52),
            height: normalize(52),
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
