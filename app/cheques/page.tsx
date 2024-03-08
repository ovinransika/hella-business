'use client'
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const Cheques = () => {
    const [user] = useAuthState(auth);
    const [cheques, setCheques] = useState<any[]>([]); // Define type as any[] for simplicity
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) {
            getCheques();
        }
    }, [user]);

    const getCheques = async () => {
        if (!user) return; // Ensure user is not null

        // Fetch all cheques from Firestore
        const chequeCollection = collection(firestore, `users/${user.uid}/Cheques`);
        const chequeSnapshot = await getDocs(chequeCollection);
        const chequeList = chequeSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setCheques(chequeList);
    }

    // Filter cheques based on search term
    const filteredCheques = cheques.filter(cheque =>
        cheque.chqSupplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="container mx-auto mt-8">
                <div className='flex mb-2'>
                    <h1 className="text-3xl font-bold mb-4">All Cheques</h1>
                    <input
                        type="text"
                        placeholder="Search by Supplier Name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ml-auto px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cheque No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cheque Issue date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cheque Issued Bank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cheque Issued To
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cheque Realize Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cheque Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-200 font-semibold">
                            {filteredCheques.map(cheque => (
                                <tr key={cheque.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-blue-500">
                                        {cheque.chqNo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {cheque.chqIssueDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {cheque.chqIssuedBank}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {cheque.chqSupplierName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-red-500">
                                        {cheque.chqRealizeDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-lime-500">
                                        {cheque.chqAmount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Cheques;
