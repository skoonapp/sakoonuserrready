import { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import type { RechargeHistoryItem, UsageHistoryItem } from '../types';
import { CALL_PLANS, CHAT_PLANS } from '../constants';

export const useRechargeHistory = (userId?: string) => {
    const [history, setHistory] = useState<RechargeHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const unsubscribe = db.collection('users').doc(userId)
            .collection('rechargeHistory')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .onSnapshot(snapshot => {
                const historyData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let planForBuyAgain: RechargeHistoryItem['plan'] | undefined;
                    
                    if (data.planType === 'MT') {
                        planForBuyAgain = { tokens: parseInt(data.planDetails.split(' ')[0]), price: data.amount };
                    } else if (data.planType === 'DT') {
                        const allPlans = [...CALL_PLANS, ...CHAT_PLANS];
                        planForBuyAgain = allPlans.find(p => p.price === data.amount && p.name === data.planDetails);
                    }

                    return {
                        id: doc.id,
                        timestamp: data.timestamp,
                        amount: data.amount,
                        planType: data.planType,
                        planDetails: data.planDetails,
                        status: data.status,
                        paymentId: data.paymentId,
                        plan: planForBuyAgain,
                    } as RechargeHistoryItem;
                });
                setHistory(historyData);
                setLoading(false);
            }, err => {
                console.error("Error fetching recharge history:", err);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [userId]);
    
    return { history, loading };
};

export const useUsageHistory = (userId?: string) => {
    const [history, setHistory] = useState<UsageHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const unsubscribe = db.collection('users').doc(userId)
            .collection('usageHistory')
            .orderBy('timestamp', 'desc')
            .limit(25)
            .onSnapshot(snapshot => {
                const historyData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as UsageHistoryItem));
                setHistory(historyData);
                setLoading(false);
            }, err => {
                console.error("Error fetching usage history:", err);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [userId]);

    return { history, loading };
};
