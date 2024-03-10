'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

const Dashboard = () => {
    const [user] = useAuthState(auth);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [totalDue, setTotalDue] = useState<number>(0);
    const [totalPurchases, setTotalPurchases] = useState<number>(0);
    const [last30Days, setLast30Days] = useState<number>(0);

    useEffect(() => {
        if (user) {
            getSuppliers();
            calculateLast30DaysTotal();
        }
    }, [user]);

    const getSuppliers = async () => {
        if (!user) return;

        const supplierSnapshot = await getDocs(collection(firestore, `users/${user.uid}/Suppliers`));
        const supplierList = supplierSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as { id: string; totalDue: number }[];
        setSuppliers(supplierList);

        let totalDue = 0;
        supplierList.forEach(supplier => {
            return totalDue += parseFloat(String(supplier.totalDue));
        });
        setTotalDue(totalDue);
    };

    const calculateLast30DaysTotal = async () => {
        if (!user) return;

        let totalPurchasesIn30Days = 0;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // 30 days ago

        for (const supplier of suppliers) {
            const supplierTransactions = await getSupplierTransactions(user.uid, supplier.id);
            for (const transaction of supplierTransactions) {
                const transactionDate = new Date(transaction.date);
                if (transactionDate >= startDate && transactionDate <= endDate) {
                    const total = parseFloat(transaction.total);
                    const damageTotal = parseFloat(transaction.damageTotal);
                    const returnTotal = parseFloat(transaction.returnTotal);
                    const balance = total - damageTotal - returnTotal;
                    totalPurchasesIn30Days += balance;
                }
            }
        }

        setTotalPurchases(totalPurchasesIn30Days);
    };

    const getSupplierTransactions = async (userId: string, supplierId: string) => {
        const querySnapshot = await getDocs(query(
            collection(firestore, `users/${userId}/Suppliers/${supplierId}/Transactions`),
            where('date', '>=', thirtyDaysAgoTimestamp())
        ));
        return querySnapshot.docs.map(doc => doc.data());
    };

    const thirtyDaysAgoTimestamp = () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return Timestamp.fromDate(thirtyDaysAgo);
    };

    return (
        <div id='dashboard'>
            <div className='flex mb-2'>
                <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            </div>
            <div className='bg-gray-700 p-10' style={{ width: '100%', height: '50%', borderRadius: '5px' }}>
                <h1 className="text-3xl font-semibold mb-4">Total Due for all Suppliers:<span className='text-red-500'>LKR {totalDue}/=</span></h1>
                <h1 className="text-3xl font-semibold mb-4">Total Purchases in the last 30 Days: {totalPurchases}</h1>
            </div>
        </div>
    );
};

export default Dashboard;
