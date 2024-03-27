'use client'
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const Cheques = () => {
    const [user] = useAuthState(auth);
    const [cheques, setCheques] = useState<any[]>([]); // Define type as any[] for simplicity
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    // Filter cheques based on search term
    const filteredCheques = cheques.filter(cheque =>
        cheque.chqSupplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCheques.length / itemsPerPage);

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredCheques.slice(startIndex, endIndex);
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }


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
                        {getCurrentPageData().map((item, index) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-blue-500">
                                    {item.chqNo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {item.chqIssueDate}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {item.chqIssuedBank}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {item.chqSupplierName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-red-500">
                                    {item.chqRealizeDate}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-lime-500">
                                    {item.chqAmount}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {/* Pagination */}
                    <div className="mt-5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`px-3 py-1 mx-1 rounded ${
                                    currentPage === page ? 'bg-white text-black' : 'bg-gray-800 text-white'
                                }`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Cheques;
