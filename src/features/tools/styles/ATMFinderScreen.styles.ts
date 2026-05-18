import { StyleSheet, Platform } from "react-native";
import { Fonts } from "@/core/theme/font";
import { hp, normalize, wp } from "@/utils/layout";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: normalize(16),
    },
    loadingText: {
        fontSize: normalize(14),
        fontFamily: Fonts.regular,
    },

    // Error
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: wp(10),
        gap: normalize(12),
    },
    errorTitle: {
        fontSize: normalize(18),
        fontFamily: Fonts.bold,
        textAlign: "center",
    },
    errorDesc: {
        fontSize: normalize(14),
        fontFamily: Fonts.regular,
        textAlign: "center",
        lineHeight: normalize(20),
    },
    retryButton: {
        paddingHorizontal: normalize(32),
        paddingVertical: normalize(12),
        borderRadius: normalize(12),
        marginTop: normalize(8),
    },
    retryButtonText: {
        fontSize: normalize(15),
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
    },

    // Map
    mapContainer: {
        height: hp(30),
    },
    map: {
        flex: 1,
    },
    floatingButton: {
        position: "absolute",
        bottom: normalize(16),
        width: normalize(44),
        height: normalize(44),
        borderRadius: normalize(22),
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    floatingButtonRight: {
        right: normalize(16),
    },
    floatingButtonLeft: {
        right: normalize(68),
    },

    // Bottom Sheet
    bottomSheet: {
        flex: 1,
        borderTopLeftRadius: normalize(20),
        borderTopRightRadius: normalize(20),
        marginTop: normalize(-12),
        overflow: "hidden",
    },

    // Search
    searchSection: {
        paddingHorizontal: wp(5),
        paddingTop: normalize(16),
        paddingBottom: normalize(8),
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: normalize(12),
        paddingHorizontal: normalize(14),
        paddingVertical: normalize(10),
        gap: normalize(10),
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: normalize(14),
        fontFamily: Fonts.regular,
        padding: 0,
    },

    // Filters
    filtersRow: {
        paddingHorizontal: wp(5),
        paddingBottom: normalize(6),
    },
    typeFilterSection: {
        flexDirection: "row",
        gap: normalize(8),
    },
    typeFilterButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: normalize(5),
        paddingVertical: normalize(9),
        borderRadius: normalize(10),
        borderWidth: 1,
    },
    typeFilterText: {
        fontSize: normalize(12),
        fontFamily: Fonts.medium,
    },

    // Radius
    radiusSection: {
        paddingBottom: normalize(6),
    },
    radiusContent: {
        paddingHorizontal: wp(5),
        gap: normalize(8),
        alignItems: "center",
    },
    radiusLabel: {
        fontSize: normalize(12),
        fontFamily: Fonts.medium,
        marginRight: normalize(2),
    },
    radiusChip: {
        paddingHorizontal: normalize(12),
        paddingVertical: normalize(6),
        borderRadius: normalize(16),
        borderWidth: 1,
    },
    radiusChipText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },

    // Results Count
    resultsCountSection: {
        paddingHorizontal: wp(5),
        paddingVertical: normalize(4),
    },
    resultsCountText: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
    },
    resultsCountHighlight: {
        fontFamily: Fonts.bold,
    },

    // Searching
    searchingContainer: {
        paddingTop: normalize(32),
        alignItems: "center",
    },

    // List
    listContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(3),
        gap: normalize(10),
    },

    // Location Card
    locationCard: {
        borderRadius: normalize(14),
        padding: normalize(14),
        gap: normalize(12),
    },
    locationCardTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: normalize(12),
    },
    typeIcon: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(12),
        alignItems: "center",
        justifyContent: "center",
    },
    locationCardInfo: {
        flex: 1,
        gap: normalize(4),
    },
    locationName: {
        fontSize: normalize(14),
        fontFamily: Fonts.bold,
        lineHeight: normalize(20),
    },
    locationAddress: {
        fontSize: normalize(12),
        fontFamily: Fonts.regular,
        lineHeight: normalize(18),
    },
    locationCardBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    tagsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(6),
        flexShrink: 1,
        flexWrap: "wrap",
    },
    typeBadge: {
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(4),
        borderRadius: normalize(6),
    },
    typeBadgeText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },
    openBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(4),
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(4),
        borderRadius: normalize(6),
    },
    openDot: {
        width: normalize(6),
        height: normalize(6),
        borderRadius: normalize(3),
    },
    openBadgeText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },
    ratingWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(3),
    },
    ratingText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },
    distanceWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(4),
    },
    distanceText: {
        fontSize: normalize(13),
        fontFamily: Fonts.bold,
    },

    // Empty
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: hp(6),
        gap: normalize(10),
    },
    emptyTitle: {
        fontSize: normalize(16),
        fontFamily: Fonts.bold,
    },
    emptyDesc: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
        textAlign: "center",
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: normalize(24),
        borderTopRightRadius: normalize(24),
        padding: normalize(20),
        paddingBottom: normalize(32),
        maxHeight: "80%",
    },
    handleBar: {
        width: normalize(40),
        height: normalize(4),
        borderRadius: normalize(2),
        alignSelf: "center",
        marginBottom: normalize(16),
    },

    // Detail Header
    detailHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: normalize(14),
        marginBottom: normalize(20),
    },
    detailTypeIcon: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(14),
        alignItems: "center",
        justifyContent: "center",
    },
    detailHeaderInfo: {
        flex: 1,
        gap: normalize(6),
    },
    detailName: {
        fontSize: normalize(17),
        fontFamily: Fonts.bold,
        lineHeight: normalize(24),
    },
    detailBankRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(6),
        flexWrap: "wrap",
    },
    detailTypeBadge: {
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(3),
        borderRadius: normalize(6),
    },
    detailTypeBadgeText: {
        fontSize: normalize(11),
        fontFamily: Fonts.medium,
    },
    detailRating: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(3),
    },
    detailRatingText: {
        fontSize: normalize(13),
        fontFamily: Fonts.bold,
    },
    detailRatingCount: {
        fontSize: normalize(11),
        fontFamily: Fonts.regular,
    },

    // Detail Scroll
    detailScrollView: {
        maxHeight: hp(35),
    },

    // Detail Info
    detailInfoSection: {
        gap: normalize(14),
        paddingBottom: normalize(16),
        borderBottomWidth: 1,
        marginBottom: normalize(16),
    },
    detailInfoItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: normalize(12),
    },
    detailInfoIcon: {
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(10),
        alignItems: "center",
        justifyContent: "center",
    },
    detailInfoContent: {
        flex: 1,
        gap: normalize(2),
    },
    detailInfoLabel: {
        fontSize: normalize(11),
        fontFamily: Fonts.regular,
    },
    detailInfoValue: {
        fontSize: normalize(14),
        fontFamily: Fonts.medium,
        lineHeight: normalize(20),
    },
    detailInfoValueSmall: {
        fontSize: normalize(12),
        fontFamily: Fonts.regular,
        lineHeight: normalize(18),
    },
    detailLoadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(10),
        paddingVertical: normalize(8),
    },
    detailLoadingText: {
        fontSize: normalize(13),
        fontFamily: Fonts.regular,
    },

    // Actions
    detailActions: {
        flexDirection: "row",
        gap: normalize(12),
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: normalize(8),
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
    },
    callButton: {
        backgroundColor: "#00A651",
    },
    mapButton: {
        backgroundColor: "#3B82F6",
    },
    actionButtonText: {
        fontSize: normalize(15),
        fontFamily: Fonts.bold,
        color: "#FFFFFF",
    },
});
