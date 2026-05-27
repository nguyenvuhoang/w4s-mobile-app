import { hp, normalize, wp } from '@/utils/layout';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: hp(5),
    },
    // Summary Card
    summaryCard: {
        marginHorizontal: wp(5),
        marginTop: hp(1),
        padding: normalize(20),
        borderRadius: normalize(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    categoryInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(12),
        marginBottom: normalize(16),
    },
    categoryIcon: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: normalize(17),
        fontWeight: '700',
        marginBottom: normalize(3),
    },
    categoryMeta: {
        fontSize: normalize(13),
        lineHeight: normalize(18),
    },
    categoryMetaBold: {
        fontWeight: '700',
        fontSize: normalize(13),
    },
    totalAmount: {
        fontSize: normalize(28),
        fontWeight: '700',
        marginBottom: normalize(12),
    },
    progressBarContainer: {
        height: normalize(8),
        borderRadius: normalize(4),
        overflow: 'hidden',
        marginBottom: normalize(8),
    },
    progressBar: {
        height: '100%',
        borderRadius: normalize(4),
    },
    budgetText: {
        fontSize: normalize(13),
        textAlign: 'center',
    },
    // Transaction Section
    transactionSection: {
        marginTop: hp(3),
        paddingHorizontal: wp(5),
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        marginBottom: normalize(16),
    },
    transactionList: {
        gap: normalize(12),
    },
    transactionItem: {
        borderRadius: normalize(16),
        padding: normalize(16),
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    transactionIcon: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionInfo: {
        flex: 1,
    },
    transactionName: {
        fontSize: normalize(16),
        fontWeight: '600',
    },
    transactionTime: {
        fontSize: normalize(12),
        marginTop: normalize(3),
    },
    transactionAmount: {
        fontSize: normalize(16),
        fontWeight: '600',
        color: '#FF3B30',
    },
});
