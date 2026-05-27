import { StyleSheet } from "react-native";
import { normalize, wp, hp } from "@/utils/layout";

export const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingBottom: normalize(10),
    },
    headerTitle: {
        fontSize: normalize(18),
        textAlign: 'center',
        lineHeight: normalize(24),
    },
    listContent: {
        paddingHorizontal: wp(5),
    },
    summaryCard: {
        borderRadius: normalize(20),
        padding: normalize(20),
        marginBottom: normalize(20),
        marginTop: normalize(10),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: normalize(6),
    },
    summaryLabel: {
        fontSize: normalize(15),
    },
    summaryValue: {
        fontSize: normalize(15),
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: normalize(10),
    },
    transactionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: normalize(16),
        borderRadius: normalize(20),
        marginBottom: normalize(12),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    iconContainer: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(14),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: normalize(12),
    },
    transactionInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    transactionTitle: {
        fontSize: normalize(16),
        marginBottom: normalize(2),
    },
    transactionCategory: {
        fontSize: normalize(13),
        marginBottom: normalize(2),
    },
    transactionNote: {
        fontSize: normalize(12),
        opacity: 0.7,
    },
    cardRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    amountText: {
        fontSize: normalize(16),
        marginBottom: normalize(4),
    },
    dateText: {
        fontSize: normalize(12),
    },
    timeText: {
        fontSize: normalize(12),
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: hp(10),
    },
});
