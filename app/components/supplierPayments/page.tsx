'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import { set } from 'firebase/database';

const SupplierPayments = ({ params }: { params: { supplierId: string } }) => {

    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<any[]>([]); // Update the type of payments to any[]

    const [searchDateOne, setSearchDateOne] = useState('');
    const [searchDateTwo, setSearchDateTwo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const transactionsFilteredByDate = payments.filter((payment) => {
        if (searchDateOne === '' || searchDateTwo === '') {
            return payment;
        } else if (payment.cashPaymentDate != '' && payment.cashPaymentDate != '' || payment.chqPaymentDate != '' && payment.chqPaymentDate != '') {
            return payment.cashPaymentDate >= searchDateOne && payment.cashPaymentDate <= searchDateTwo || payment.chqPaymentDate >= searchDateOne && payment.chqPaymentDate <= searchDateTwo;
        } 
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(payments.length / itemsPerPage);

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return transactionsFilteredByDate.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: React.SetStateAction<number>) => {
        setCurrentPage(page);
    }

    const fetchPayments = async () => {
        const transactionsRef = collection(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}/Transactions`);
        const querySnapshot = await getDocs(transactionsRef);

        let allPaymentsArray: any[] = [];

        for (const transactionDoc of querySnapshot.docs) {
                const transactionId = transactionDoc.id;
                const paymentsRef = collection(doc(transactionsRef, transactionId), 'Payments');
                const paymentsSnapshot = await getDocs(paymentsRef);

            const payments = paymentsSnapshot.docs.map(paymentDoc => ({
                id: paymentDoc.id,
                ...paymentDoc.data(),
                transactionId: transactionId
            }));

            allPaymentsArray = [...allPaymentsArray, ...payments];
        }

        //Order payments by date from oldest to newset
        allPaymentsArray.sort((a, b) => {
            return new Date(a.cashPaymentDate || a.chqPaymentDate).getTime() - new Date(b.cashPaymentDate || b.chqPaymentDate).getTime();
        });

        setPayments(allPaymentsArray);
        console.log(allPaymentsArray);
    }


    useEffect(() => {
        fetchPayments();
    }, []);

  return (
    <div>
        <div style={{ borderRadius: '10px' }} className="mt-10 p-10 bg-neutral-700">
            <h1 className="text-2xl font-bold text-white">All Payments for Supplier</h1>
            {payments.length === 0 ? (
                <p className="text-white font-semibold">No payments found for this supplier!</p>
            ) : (
                <>
                <div className="mt-5">
                <div className="flex gap-4 mb-5">
                            <div className="flex flex-col">
                                <label htmlFor="searchDateOne" className="block text-sm font-medium text-white">
                                    Filter from date
                                </label>
                                <input
                                    type="date"
                                    name="searchDateOne"
                                    id="searchDateOne"
                                    onChange={(e) => setSearchDateOne(e.target.value)}
                                    value={searchDateOne}
                                    className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="searchDateTwo" className="block text-sm font-medium text-white">
                                    Filter to date
                                </label>
                                <input
                                    type="date"
                                    name="searchDateTwo"
                                    id="searchDateTwo"
                                    onChange={(e) => setSearchDateTwo(e.target.value)}
                                    value={searchDateTwo}
                                    className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                />
                            </div>
                        </div>
                    <table className="w-full table-auto bg-neutral-800 text-white">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">Payment Date</th>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">Payment Mode</th>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">CHQ No</th>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">CHQ Issued Bank</th>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">Cash/Chq Amount</th>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">CHQ Realize Date</th>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">Payment Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                                {getCurrentPageData().map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 border-2 border-black">{item.cashPaymentDate || item.chqPaymentDate}</td>
                                        <td className="px-4 py-2 border-2 border-black">{item.paymentMethod}</td>
                                        <td className="px-4 py-2 border-2 border-black">{item.chqNo}</td>
                                        <td className="px-4 py-2 border-2 border-black">{item.chqIssuedBank}</td>
                                        <td className="px-4 py-2 border-2 border-black">Rs.{item.cashPaymentAmount || item.chequePaymentAmount}</td>
                                        <td className="px-4 py-2 border-2 border-black">{item.chqRealizeDate}</td>
                                        <td className="px-4 py-2 border-2 border-black">{item.paymentRemark}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
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
                </>
            )
            }
        </div>
    </div>
  )
}

export default SupplierPayments
