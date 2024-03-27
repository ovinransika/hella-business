'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, getDocs, query, where, Timestamp, doc } from 'firebase/firestore';

const Dashboard = () => {
    const [user] = useAuthState(auth);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [totalDue, setTotalDue] = useState<number>(0);
    const [totalReturns, setTotalReturns] = useState<number>(0);
    const [totalDamage, setTotalDamage] = useState<number>(0);
    const [totalPurchases, setTotalPurchases] = useState<number>(0);

    useEffect(() => {
        if (user) {
            getSuppliers();
            calculateTotalPurchases(user.uid);
        }
    }, [user]);

    const getSuppliers = async () => {
        if (!user) return;

        const supplierSnapshot = await getDocs(collection(firestore, `users/${user.uid}/Suppliers`));
        const supplierList = supplierSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as { id: string; totalDue: number; totalDamage: number; totalReturns: number }[];
        setSuppliers(supplierList);

        let totalDue = 0;
        let totalReturn = 0;
        let totalDamage = 0;
        supplierList.forEach(supplier => {
            totalDue += parseFloat(String(supplier.totalDue));
            totalDamage += parseFloat(String(supplier.totalDamage));
            totalReturn += parseFloat(String(supplier.totalReturns));
        });
        setTotalDue(totalDue);
        setTotalDamage(totalDamage);
        setTotalReturns(totalReturn);
    };

    const calculateTotalPurchases = async (userId: string) => {
        let totalPurchases = 0;
    
        try {
            // Reference to the collection of suppliers for the user
            const suppliersRef = collection(firestore, `users/${userId}/Suppliers`);
    
            // Get all suppliers
            const suppliersSnapshot = await getDocs(suppliersRef);
    
            // Iterate through each supplier
            for (const supplierDoc of suppliersSnapshot.docs) {
                const supplierId = supplierDoc.id;
                const transactionsRef = collection(
                    firestore,
                    `users/${userId}/Suppliers/${supplierId}/Transactions`
                );
    
                // Get all transactions for this supplier
                const transactionsSnapshot = await getDocs(transactionsRef);
    
                // Iterate through each transaction
                transactionsSnapshot.forEach((doc) => {
                    const transactionData = doc.data();
                    // Assuming the balance field exists and is a number
                    const balance = transactionData.balance || 0;
                    totalPurchases += balance;
                });
            }
            setTotalPurchases(parseInt(String(totalPurchases), 10));
        } catch (error) {
            console.error('Error calculating total purchases:', error);
            return null;
        }
    };

    return (
        <div id='dashboard'>
            <div className='flex mb-2'>
                <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            </div>
            <div className='flex gap-10'>
                <div className='bg-gray-700 text-center p-10' style={{ width: '100%', height: '50%', borderRadius: '5px' }}>
                    <h1 className="text-md mb-4">Total Due for all Suppliers</h1>
                    <span className='text-red-500 text-3xl font-semibold'>LKR {totalDue}/=</span>
                </div>
                <div className='bg-gray-700 text-center p-10' style={{ width: '100%', height: '50%', borderRadius: '5px' }}>
                    <h1 className="text-md mb-4">Total Suppliers Joined</h1>
                    <span className='text-red-500 text-3xl font-semibold'>{suppliers.length}</span>
                </div>
                <div className='bg-gray-700 text-center p-10' style={{ width: '100%', height: '50%', borderRadius: '5px' }}>
                    <h1 className="text-md mb-4">Total Purchases</h1>
                    <span className='text-red-500 text-3xl font-semibold'>LKR {totalPurchases}/=</span>
                </div>
                <div className='bg-gray-700 text-center p-10' style={{ width: '100%', height: '50%', borderRadius: '5px' }}>
                    <h1 className="text-md mb-4">Total Due for all Suppliers</h1>
                    <span className='text-red-500 text-3xl font-semibold'>LKR {Number(totalDamage) + Number(totalReturns)}/=</span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
