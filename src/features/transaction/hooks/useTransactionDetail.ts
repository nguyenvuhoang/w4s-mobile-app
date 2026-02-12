import StorageKey from '@/constants/StorageKey';
import { transactionRepository } from '@/services/repositories/transaction.repository';
import StorageService from '@/services/StorageService';
import { useCallback, useEffect, useState } from 'react';

export interface WalletCategory {
    category_name: string;
    icon: string;
    color: string;
    category_code: string;
    category_group: string;
    category_type: string;
}

export interface WalletProfile {
    wallet_name: string;
    wallet_type: string;
    default_currency: string;
    icon: string;
    color: string;
    user_code: string;
}

export interface TransactionDetailData {
    accountnumber: string;
    accounttype: string;
    amount: number;
    amountbase: number;
    apprsts: string | null;
    ccyid: string;
    deleted: string | null;
    desterrorcode: string | null;
    destid: string;
    desttranref: string | null;
    errorcode: string;
    errordesc: string;
    id: number;
    listuserapp: string | null;
    nextuserapp: string | null;
    offlsts: string;
    sourceid: string;
    sourcetranref: string;
    status: string;
    trandesc: string;
    transactioncode: string;
    transactiondate: string;
    transactionenddate: string | null;
    transactionid: string;
    transactionname: string;
    transactionworkdate: string;
    usercurapp: string | null;
    userid: string;
    walletid: string;
    walletcategory?: WalletCategory;
    walletprofile?: WalletProfile;
    fee?: number;
}

export const useTransactionDetail = (transactionId: string) => {
    const [transaction, setTransaction] = useState<TransactionDetailData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransaction = useCallback(async () => {
        if (!transactionId) return;
        
        setLoading(true);
        setError(null);
        try {
            const userCode = await StorageService.getAsyncItem(StorageKey.userCode);
        if (!userCode) {
            throw new Error("Missing user code");
        }
            const response = await transactionRepository.getTransactionsByTransactionId(transactionId, userCode);
            if (response && response.success && response.data) {
                setTransaction(response.data);
            } else {
                setError(response?.message || 'Failed to fetch transaction details');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [transactionId]);

    useEffect(() => {
        fetchTransaction();
    }, [fetchTransaction]);

    return { transaction, loading, error, refetch: fetchTransaction };
};
