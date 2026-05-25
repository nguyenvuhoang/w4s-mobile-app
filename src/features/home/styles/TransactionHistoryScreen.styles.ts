import { Fonts } from "@/core/theme/font";
import { normalize, wp } from "@/utils/layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: normalize(100),
    },
    emptyText: {
        marginTop: normalize(12),
        fontSize: normalize(16),
    },
    listContent: {
        paddingBottom: normalize(20),
    },
    sectionHeader: {
        paddingHorizontal: wp(5),
        paddingVertical: normalize(12),
        marginTop: normalize(4),
    },
    sectionTitle: {
        fontSize: normalize(15),
        fontWeight: "600",
        opacity: 0.7,
    },
    itemWrapper: {
        paddingHorizontal: wp(5),
        marginBottom: normalize(8),
    },
    footerLoader: {
        paddingVertical: normalize(20),
        alignItems: "center",
        justifyContent: "center",
    },
    footerText: {
        marginTop: normalize(8),
        fontSize: normalize(14),
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(5),
        paddingVertical: normalize(10),
        gap: normalize(12),
    },
    walletSelector: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: normalize(12),
        paddingVertical: normalize(8),
        borderRadius: normalize(24),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    walletIconContainer: {
        width: normalize(28),
        height: normalize(28),
        borderRadius: normalize(14),
        alignItems: "center",
        justifyContent: "center",
        marginRight: normalize(8),
    },
    walletName: {
        flex: 1,
        fontSize: normalize(14),
        fontFamily: Fonts.medium,
    },
    searchButton: {
        width: normalize(44),
        height: normalize(44),
        borderRadius: normalize(22),
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchContainer: {
        paddingHorizontal: wp(5),
        paddingBottom: normalize(10),
    },
    searchInput: {
        borderRadius: normalize(12),
        paddingHorizontal: normalize(15),
        paddingVertical: normalize(10),
        fontSize: normalize(14),
        borderWidth: 1,
    },
});
