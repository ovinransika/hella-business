'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, query, orderBy, Query, DocumentData } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SupplierTransactions2 = ({ params }: { params: { supplierId: string } }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [user] = useAuthState(auth);
    const [transactionsData, setTransactionsData] = useState<any[]>([]);
    const [paymentsData, setPaymentsData] = useState<any[]>([]);
    const [totalDue, setTotalDue] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentModeCash, setPaymentModeCash] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [transactionDetails, setTransactionDetails] = useState({
        id: '',
        date: '',
        invoiceNo: '',
        total: '' || '0',
        returnNo: '' || 'N/A',
        returnTotal: '' || '0',
        damageTotal: '' || '0',
        balance: '',        
        outstandingBalance: '',
    });
    const [cashPaymentDetails, setCashPaymentDetails] = useState({
        paymentMethod: 'cash',
        cashPaymentDate: '',
        cashPaymentAmount: '',
    });

    const [chequePaymentDetails, setChequePaymentDetails] = useState({
        paymentMethod: 'cheque',
        chqNo: '',
        chqIssuedBank: '',
        chqPaymentDate: '',
        chqRealizeDate: '',
        chequePaymentAmount: ''
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(transactionsData.length / itemsPerPage);

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return transactionsData.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: React.SetStateAction<number>) => {
        setCurrentPage(page);
    }

    const addTransaction = async () => {
        if(!user){
            alert('Please login to continue');
            console.log('User not logged in');
            return;
        }

        try{
            const timestamp = new Date();

            if (!transactionDetails.date || !transactionDetails.invoiceNo || !transactionDetails.total) {
                alert('Please fill all required fields');
                return;
            }else{
                const transactionRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions`);
                await addDoc(transactionRef, {
                    ...transactionDetails,
                    timestamp: timestamp,
                });

                //Get Supplier's Total Due and subtract the returns amount from it
                const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
                const supplierDoc = await getDoc(supplierRef);
                if (supplierDoc.exists()) {
                    const newTotalDue = Number(supplierDoc.data().totalDue) + Number(transactionDetails.balance);
                    await setDoc(supplierRef, { totalDue: newTotalDue }, { merge: true });
                }
            }

            window.location.reload();
        }catch (error){
            console.log('Error adding transaction');
        }
    }

    const recordPayment = async () => {
        if(!user){
            alert('Please login to continue');
            console.log('User not logged in');
            return;
        }

        try{
            const timestamp = new Date();
            const paymentRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions/${transactionId}/Payments`);
            if(paymentModeCash === true){
                await addDoc(paymentRef, {
                    ...cashPaymentDetails,
                    timestamp: timestamp,
                });
            } else {
                await addDoc(paymentRef, {
                    ...chequePaymentDetails,
                    timestamp: timestamp,
                });
            }

            const transactionRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}/Transactions/${transactionId}`);
            const transactionDoc = await getDoc(transactionRef);
            if (transactionDoc.exists()) {
                if (transactionDoc.data().balance <= 0) {
                    alert('The balance of this transaction has already been cleared!')
                } else {
                    const newOutstandingBalance = Number(transactionDoc.data().balance) - Number(cashPaymentDetails.cashPaymentAmount || chequePaymentDetails.chequePaymentAmount);
                    await setDoc(transactionRef, { balance: newOutstandingBalance }, { merge: true });

                    //Get Supplier's Total Due and deduct the payment amount from it
                    const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
                    const supplierDoc = await getDoc(supplierRef);
                    if (supplierDoc.exists()) {
                        const newTotalDue = Number(supplierDoc.data().totalDue) - Number(cashPaymentDetails.cashPaymentAmount || chequePaymentDetails.chequePaymentAmount);
                        await setDoc(supplierRef, { totalDue: newTotalDue }, { merge: true });
                    }

                    window.location.reload();
                    
                }
            }
        }catch (error){
            console.log('Error adding payment');
        }
    }

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

    const getPaymentData = async (transactionId: string) => {
        if (!user) {
            console.log('User not logged in');
            return;
        }
    
        try {
            const paymentsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions/${transactionId}/Payments`);
            const paymentsQuery = query(paymentsRef, orderBy('timestamp', 'asc'));
            const querySnapshot = await getDocs(paymentsQuery);

            let payments: any[] = [];
            querySnapshot.forEach((doc) => {
                payments.push({ ...doc.data(), id: doc.id });
            });

            setPaymentsData(payments);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    }

    const handlePayClick = (id: string) => {
        setPaymentModalOpen(true);
        setTransactionId(id);
        getPaymentData(id);

    }
        

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let newTransactionDetails = {
            ...transactionDetails,
            [name]: value,
        };

        // Calculate balance
        const { total, returnTotal, damageTotal } = newTransactionDetails;
        if (total && returnTotal && damageTotal) {
            const deductBalance = parseFloat(damageTotal) + parseFloat(returnTotal);
            const balance = parseFloat(total) - deductBalance;
            const remainingTotalDue = Number(totalDue) + Number(balance);
                newTransactionDetails = {
                    ...newTransactionDetails,
                    balance: remainingTotalDue.toString(),
                };
        }

        setTransactionDetails(newTransactionDetails);
    };

    const handlePaymentInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(paymentModeCash){
            const { name, value } = e.target;
            let newCashPaymentDetails = {
                ...cashPaymentDetails,
                [name]: value,
            };
            setCashPaymentDetails(newCashPaymentDetails);
            
        } else {
            const { name, value } = e.target;
            let newChequePaymentDetails = {
                ...chequePaymentDetails,
                [name]: value,
            };

            setChequePaymentDetails(newChequePaymentDetails);
        }
    };
    
    
    useEffect(() => {
        if (user) {
            getTransactions();
        }
    }, [user]);

    return (
        <div style={{ borderRadius: '10px' }} className="mt-10 p-10 bg-neutral-700">
    <div className="flex justify-between mb-5">
        <h1 className="text-2xl font-semibold mb-5">Supplier Transactions 2</h1>
        <button className="bg-black hover:bg-white hover:text-red-800 text-white font-bold py-2 px-4 rounded" onClick={() => setModalOpen(true)}>
            Record Transaction
        </button>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-4">
            Export to PDF
        </button>
    </div>
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead>
                <tr>
                    <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">ID</th>
                    <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">Date</th>
                    <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden lg:table-cell">Invoice No.</th>
                    <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden lg:table-cell">Total</th>
                    <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden lg:table-cell">Return No.</th>
                    <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden lg:table-cell">Return Total</th>
                    <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden lg:table-cell">Damage Total</th>
                    <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden lg:table-cell">Balance</th>
                    <th className="px-4 py-2 border-2 border-black bg-lime-600 hidden lg:table-cell">Cash/CHQ Date</th>
                    <th className="px-4 py-2 border-2 border-black bg-lime-600 hidden lg:table-cell">CHQ No.</th>
                    <th className="px-4 py-2 border-2 border-black bg-lime-600 hidden lg:table-cell">CHQ issued Bank</th>
                    <th className="px-4 py-2 border-2 border-black bg-lime-600 hidden lg:table-cell">Cash/CHQ Amount</th>
                    <th className="px-4 py-2 border-2 border-black bg-orange-600 hidden lg:table-cell">CHQ Realize Date</th>
                    <th className="px-4 py-2 border-2 border-black bg-red-800 hidden lg:table-cell">Outstanding Balance on Recorded Day</th>
                    <th className="px-4 py-2 border-2 border-black bg-red-800 hidden lg:table-cell">Actions</th>
                </tr>
            </thead>
            <tbody>
                {getCurrentPageData().map((item, index) => (
                    <tr key={index} className="border border-black">
                        <td className="px-4 py-2 border border-black hidden sm:table-cell">{item.id}</td>
                        <td className="px-4 py-2 border border-black hidden sm:table-cell">{item.date}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.invoiceNo}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.total}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.returnNo}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.returnTotal}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.damageTotal}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.balance}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.paymentDate}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.chqNo}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.chqIssuedBank}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.cashChqAmount}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.chqRealizeDate}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.outstandingBalance}</td>
                        <td className="px-4 py-2 border border-black hidden lg:table-cell">
                            <button className="bg-lime-500 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded" onClick={() => handlePayClick(item.id)}>Pay</button>
                        </td>
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
                                            <label htmlFor="date" className="block text-sm font-medium text-white">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                name="date"
                                                id="date"
                                                onChange={handleInputChange}
                                                value={transactionDetails.date}
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

    {/* Modal for Recording Payment */}
    {paymentModalOpen && (
       <>
        {/* Give option to select payment mode */}
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
                                <h2 className="text-xl font-semibold mb-4">RECORD PAYMENT</h2>
                                <button className="btn btn-square bg-red-500 text-white" onClick={() => setPaymentModalOpen(false)}>X</button>
                            </div>
                                <div className="mt-2">
                                    <div className="flex flex-col sm:flex-row">
                                    <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                        <label htmlFor="paymentDate" className="block text-sm font-medium text-white">
                                            Cash/CHQ
                                        </label>
                                        <select
                                            name="paymentDate"
                                            id="paymentDate"
                                            onChange={(e) => setPaymentModeCash(e.target.value === "cash")}
                                            value={paymentModeCash ? "cash" : "chq"}
                                            className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="chq">Cheque</option>
                                        </select>
                                    </div>
                                    </div>
                                    {paymentModeCash ? (
                                        <>
                                        <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                    <label htmlFor="cashPaymentDate" className="block text-sm font-medium text-white">
                                                Payment Date
                                            </label>
                                            <input
                                                type="date"
                                                name="cashPaymentDate"
                                                id="cashPaymentDate"
                                                onChange={handlePaymentInputChange}
                                                value={cashPaymentDetails.cashPaymentDate}
                                                className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                            />
                                    </div>
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                        <label htmlFor="cashPaymentAmount" className="block text-sm font-medium text-white">
                                                Cash Amount
                                            </label>
                                            <input
                                                type="number"
                                                name="cashPaymentAmount"
                                                id="cashPaymentAmount"
                                                onChange={handlePaymentInputChange}
                                                value={cashPaymentDetails.cashPaymentAmount}
                                                className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                            />
                                        </div>
                                        <div className="w-full sm:w-1/2 sm:pl-2 mb-4">
                                            <label htmlFor="cashChqAmount" className="block text-sm font-medium text-white">
                                                Outstanding Balance
                                            </label>
                                            <input
                                                type="number"
                                                name="cashAmount"
                                                id="cashAmount"
                                                value={transactionDetails.outstandingBalance}
                                                className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                            />
                                            
                                        </div>
                                    </div>
                                        </>

                                    ) : (
                                        <>
                                        <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                    <label htmlFor="chqPaymentDate" className="block text-sm font-medium text-white">
                                                Payment Date
                                            </label>
                                            <input
                                                type="date"
                                                name="chqPaymentDate"
                                                id="chqPaymentDate"
                                                onChange={handlePaymentInputChange}
                                                value={chequePaymentDetails.chqPaymentDate}
                                                className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                            />
                                    </div>
                                            <div className='flex flex-col sm:flex-row'>
                                                <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                                    <label htmlFor="chqNo" className="block text-sm font-medium text-white">
                                                        CHQ No.
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="chqNo"
                                                        id="chqNo"
                                                        onChange={handlePaymentInputChange}
                                                        value={chequePaymentDetails.chqNo}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2 sm:pl-2 mb-4">
                                                    <label htmlFor="chqIssuedBank" className="block text-sm font-medium text-white">
                                                        CHQ Issued Bank
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="chqIssuedBank"
                                                        id="chqIssuedBank"
                                                        onChange={handlePaymentInputChange}
                                                        value={chequePaymentDetails.chqIssuedBank}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:w-1/2 sm:pr-2 mb-4">
                                                    <label htmlFor="chequePaymentAmount" className="block text-sm font-medium text-white">
                                                        CHQ Amount
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="chequePaymentAmount"
                                                        id="chequePaymentAmount"
                                                        onChange={handlePaymentInputChange}
                                                        value={chequePaymentDetails.chequePaymentAmount}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2 sm:pl-2 mb-4">
                                                    <label htmlFor="chqRealizeDate" className="block text-sm font-medium text-white">
                                                        CHQ Realize Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="chqRealizeDate"
                                                        id="chqRealizeDate"
                                                        onChange={handlePaymentInputChange}
                                                        value={chequePaymentDetails.chqRealizeDate}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className='w-full sm:w-1/2 sm:pr-2 mb-4'>
                                                    <p className="text-lg font-semibold mb-4">Outstanding Balance: {transactionDetails.outstandingBalance}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            onClick={recordPayment}
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setPaymentModalOpen(false)}
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md shadow-sm px-4 py-2 bg-red-500 text-base font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
       </> 
    )

    }
</div>

    );
};

export default SupplierTransactions2;
