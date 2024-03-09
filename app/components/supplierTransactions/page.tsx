'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, query, orderBy, Query, DocumentData } from 'firebase/firestore';

const SupplierTransactions = ({ params }: { params: { supplierId: string } }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [user] = useAuthState(auth);
    const [transactionsData, setTransactionsData] = useState<any[]>([]);
    const [totalDue, setTotalDue] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState({
        transactionNo: '',
        date: '',
        invoiceNo: '',
        total: '' || '0',
        returnNo: '',
        returnTotal: '' || '0',
        damageTotal: '' || '0',
        balance: '',        
        cashChqDate: '',
        chqNo: '',
        chqIssuedBank: '',
        cashChqAmount: '' || '0',
        chqRealizeDate: '',
        outstandingBalance: '',
    });

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let newTransactionDetails = {
            ...transactionDetails,
            [name]: value,
        };

        // Calculate balance
        const { total, returnTotal, damageTotal, cashChqAmount } = newTransactionDetails;
        if (total && returnTotal && damageTotal) {
            const deductBalance = parseFloat(damageTotal) + parseFloat(returnTotal);
            const balance = parseFloat(total) - deductBalance;
            const remainingTotalDue = Number(totalDue) + Number(balance);
            const remainingBalance = remainingTotalDue - parseFloat(cashChqAmount);
                newTransactionDetails = {
                    ...newTransactionDetails,
                    balance: remainingTotalDue.toString(),
                    outstandingBalance: remainingBalance.toString(),
                };
        }

        setTransactionDetails(newTransactionDetails);
    };

    const getTotalDue = async () => {
        //Get Supplier's Total Due and subtract the returns amount from it
        const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
        const supplierDoc = await getDoc(supplierRef);
        if (supplierDoc.exists()) {
            const supplierData = supplierDoc.data();
            const supplierTotalDue = supplierData.totalDue;
            setTotalDue(supplierTotalDue);
        }
    }

    const addTransaction = async () => {
        if (!user) {
            console.log('User not logged in');
            return;
        }
    
        try {
            const timestamp = new Date(); // Get the current timestamp
    
            if(transactionDetails.transactionNo === '' || transactionDetails.date === '' || transactionDetails.invoiceNo === '' || transactionDetails.total === '' || transactionDetails.returnNo === '' || transactionDetails.returnTotal === '' || transactionDetails.damageTotal === '' || transactionDetails.balance === '' || transactionDetails.cashChqDate === '' || transactionDetails.chqNo === '' || transactionDetails.chqIssuedBank === '' || transactionDetails.cashChqAmount === '' || transactionDetails.chqRealizeDate === '' || transactionDetails.outstandingBalance === '' ) {
                alert('Please fill in all required fields');
                return;
            }else {
                const transactionsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions`);
            await addDoc(transactionsRef, {
                ...transactionDetails,
                timestamp: timestamp, // Add timestamp to the transaction
            });
    
            //Get Supplier's Total Due and subtract the returns amount from it
            const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
            const supplierDoc = await getDoc(supplierRef);
            if (supplierDoc.exists()) {
                await setDoc(supplierRef, { totalDue: transactionDetails.outstandingBalance }, { merge: true });
            }

            if (transactionDetails.chqNo !== 'cash') {
                const chqRef = collection(firestore, `users/${user.uid}/Cheques`);
                const supplierData = supplierDoc.data();
                await addDoc(chqRef, {
                    chqNo: transactionDetails.chqNo,
                    chqIssuedBank: transactionDetails.chqIssuedBank,
                    chqAmount: transactionDetails.cashChqAmount,
                    chqIssueDate: transactionDetails.cashChqDate,
                    chqRealizeDate: transactionDetails.chqRealizeDate,
                    chqSupplierId: params.supplierId,
                    chqSupplierName: supplierData?.name ?? '',
                    timestamp: timestamp, // Add timestamp to the transaction
                });
            }

            console.log('Transaction added successfully');
    
            // Clear form fields after successful submission
            setTransactionDetails({
                transactionNo: '',
                date: '',
                invoiceNo: '',
                total: '',
                returnNo: '',
                returnTotal: '',
                damageTotal: '',
                balance: '',
                cashChqDate: '',
                chqNo: '',
                chqIssuedBank: '',
                cashChqAmount: '',
                chqRealizeDate: '',
                outstandingBalance: '',
            });
            // Reload the data
            getTransactions();
    
            // Reload whole window to update the total due in the supplier list
            window.location.reload();
        }
    
            // Close the modal
            setModalOpen(false);
        } catch (error) {
            console.error('Error adding transaction:', error);
        }
    };
    

    const getTransactions = async () => {
        if (!user) {
            console.log('User not logged in');
            return;
        }
    
        try {
            const transactionsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions`);
            
            // Create a query to order transactions by timestamp in descending order
            const transactionsQuery = query(transactionsRef, orderBy('timestamp', 'asc'));
            
            const querySnapshot = await getDocs(transactionsQuery);

            let transactions: any[] = [];
            querySnapshot.forEach((doc) => {
                transactions.push({ ...doc.data(), id: doc.id });
            });

            setTransactionsData(transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const itemsPerPage = 10;
    const totalPages = Math.ceil(transactionsData.length / itemsPerPage);

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return transactionsData.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: React.SetStateAction<number>) => {
        setCurrentPage(page);
    };
    

    useEffect(() => {
        if (user) {
            getTransactions();
            getTotalDue();
        }
    }, [user]);

    return (
        <div style={{ borderRadius: '10px' }} className="mt-10 p-10 bg-neutral-700">
            <div className="flex justify-between mb-5">
                <h1 className="text-2xl font-semibold mb-5">Supplier Transactions</h1>
                <button className="bg-black hover:bg-white hover:text-red-800 text-white font-bold py-2 px-4 rounded" onClick={() => setModalOpen(true)}>
                    Record Transaction
                </button>
            </div>
            <table className="w-full">
                <thead>
                    <tr>
                        <th className="px-4 py-2 border-2 border-black bg-blue-600">Transaction No.</th>
                        <th className="px-4 py-2 border-2 border-black bg-blue-600">Date</th>
                        <th className="px-4 py-2 border-2 border-black bg-blue-600">Invoice No.</th>
                        <th className="px-4 py-2 border-2 border-black bg-blue-600">Total</th>
                        <th className="px-4 py-2 border-2 border-black bg-blue-600">Return No.</th>
                        <th className="px-4 py-2 border-2 border-black bg-blue-600">Return Total</th>
                        <th className="px-4 py-2 border-2 border-black bg-blue-600">Damage Total</th>
                        <th className="px-4 py-2 border-2 border-black bg-blue-600">Balance</th>
                        <th className="px-4 py-2 border-2 border-black bg-lime-600">Cash/CHQ Date</th>
                        <th className="px-4 py-2 border-2 border-black bg-lime-600">CHQ No.</th>
                        <th className="px-4 py-2 border-2 border-black bg-lime-600">CHQ issued Bank</th>
                        <th className="px-4 py-2 border-2 border-black bg-lime-600">Cash/CHQ Amount</th>
                        <th className="px-4 py-2 border-2 border-black bg-orange-600">CHQ Realize Date</th>
                        <th className="px-4 py-2 border-2 border-black bg-red-800">Outstanding Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {getCurrentPageData().map((item, index) => (
                        <tr key={index} className="border border-black">
                            <td className="px-4 py-2 border border-black">{item.transactionNo}</td>
                            <td className="px-4 py-2 border border-black">{item.date}</td>
                            <td className="px-4 py-2 border border-black">{item.invoiceNo}</td>
                            <td className="px-4 py-2 border border-black">{item.total}</td>
                            <td className="px-4 py-2 border border-black">{item.returnNo}</td>
                            <td className="px-4 py-2 border border-black">{item.returnTotal}</td>
                            <td className="px-4 py-2 border border-black">{item.damageTotal}</td>
                            <td className="px-4 py-2 border border-black">{item.balance}</td>
                            <td className="px-4 py-2 border border-black">{item.cashChqDate}</td>
                            <td className="px-4 py-2 border border-black">{item.chqNo}</td>
                            <td className="px-4 py-2 border border-black">{item.chqIssuedBank}</td>
                            <td className="px-4 py-2 border border-black">{item.cashChqAmount}</td>
                            <td className="px-4 py-2 border border-black">{item.chqRealizeDate}</td>
                            <td className="px-4 py-2 border border-black">{item.outstandingBalance}</td>
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

            {/* Modal for Recording Transaction */}
            {modalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-black opacity-50"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-headline"
                        >
                            <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <div className="flex items-center justify-between p-2">
                                        <h2 className="text-xl font-semibold mb-4">RECORD TRANSACTION</h2>
                                        <button className="btn btn-square bg-red-500 text-white" onClick={() => setModalOpen(false)}>X</button>
                                    </div>
                                        <div className="mt-2">
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                                    <label htmlFor="transactionNo" className="block text-sm font-medium text-white">
                                                        Transaction No.
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="transactionNo"
                                                        id="transactionNo"
                                                        value={transactionDetails.transactionNo}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2 sm:pl-2 mb-4">
                                                    <label htmlFor="date" className="block text-sm font-medium text-white">
                                                        Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        id="date"
                                                        value={transactionDetails.date}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                                    <label htmlFor="invoiceNo" className="block text-sm font-medium text-white">
                                                        Invoice No.
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="invoiceNo"
                                                        id="invoiceNo"
                                                        value={transactionDetails.invoiceNo}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2 sm:pl-2 mb-4">
                                                    <label htmlFor="total" className="block text-sm font-medium text-white">
                                                        Total
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="total"
                                                        id="total"
                                                        value={transactionDetails.total}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                                    <label htmlFor="returnNo" className="block text-sm font-medium text-white">
                                                        Return No.
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="returnNo"
                                                        id="returnNo"
                                                        value={transactionDetails.returnNo}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2 sm:pl-2 mb-4">
                                                    <label htmlFor="returnTotal" className="block text-sm font-medium text-white">
                                                        Return Total
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="returnTotal"
                                                        id="returnTotal"
                                                        value={transactionDetails.returnTotal}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                                    <label htmlFor="damageTotal" className="block text-sm font-medium text-white">
                                                        Damage Total
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="damageTotal"
                                                        id="damageTotal"
                                                        value={transactionDetails.damageTotal}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className='w-full sm:w-1/2 sm:pr-2 mb-4'>
                                                    <p className="text-lg font-semibold mb-4">Total Due: {totalDue}</p>
                                                </div>
                                                <div className='w-full sm:w-1/2 sm:pr-2 mb-4'>
                                                    <p className="text-lg font-semibold mb-4">Balance : {transactionDetails.balance}</p>
                                                </div>
                                            </div>
                                            <div className='mt-5'>
                                                <hr />
                                                <h3 className="text-lg font-semibold mb-4">Payment</h3>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                                    <label htmlFor="cashChqDate" className="block text-sm font-medium text-white">
                                                        Cash/CHQ Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="cashChqDate"
                                                        id="cashChqDate"
                                                        value={transactionDetails.cashChqDate}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2 sm:pl-2 mb-4">
                                                    <label htmlFor="chqNo" className="block text-sm font-medium text-white">
                                                        CHQ No.
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="chqNo"
                                                        id="chqNo"
                                                        value={transactionDetails.chqNo}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                                    <label htmlFor="chqIssuedBank" className="block text-sm font-medium text-white">
                                                        CHQ issued Bank
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="chqIssuedBank"
                                                        id="chqIssuedBank"
                                                        value={transactionDetails.chqIssuedBank}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2 sm:pl-2 mb-4">
                                                    <label htmlFor="cashChqAmount" className="block text-sm font-medium text-white">
                                                        Cash/CHQ Amount
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="cashChqAmount"
                                                        id="cashChqAmount"
                                                        value={transactionDetails.cashChqAmount}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                                    <label htmlFor="chqRealizeDate" className="block text-sm font-medium text-white">
                                                        CHQ Realize Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="chqRealizeDate"
                                                        id="chqRealizeDate"
                                                        value={transactionDetails.chqRealizeDate}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2 sm:pl-2 mb-4">
                                                    <label htmlFor="outstandingBalance" className="block text-sm font-medium text-white">
                                                        Outstanding Balance
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="outstandingBalance"
                                                        id="outstandingBalance"
                                                        value={transactionDetails.outstandingBalance}
                                                        onChange={handleInputChange}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={addTransaction}
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md shadow-sm px-4 py-2 bg-red-500 text-base font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierTransactions;
