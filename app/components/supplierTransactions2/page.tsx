'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SupplierTransactions2 = ({ params }: { params: { supplierId: string } }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [user] = useAuthState(auth);
    const [supplierName, setSupplierName] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [monthToExportPdf, setMonthToExportPdf] = useState('');
    const [error, setError] = useState('');

    const [transactionsData, setTransactionsData] = useState<any[]>([]);
    const [paymentsData, setPaymentsData] = useState<any[]>([]);
    const [totalDue, setTotalDue] = useState(0);
    const [totalDueToPay, setTotalDueToPay] = useState('');
    const [payTotalDue, setPayTotalDue] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [updateTransactionModal, setUpdateTransactionModal] = useState(false);
    const [viewPaymentsModal, setViewPaymentsModal] = useState(false);
    const [viewCashPayments, setViewCashPayments] = useState(false);
    const [viewExportPdfModal, setViewExportPdfModal] = useState(false);
    const [paymentModeCash, setPaymentModeCash] = useState(false);
    const [UpdateDamage, setUpdateDamage] = useState(false);
    const [outstandingBalanceZeroAlert, setOutstandingBalanceZeroAlert] = useState(false);
    const [outstandingBalanceExceedsAlert, setOutstandingBalanceExceedsAlert] = useState(false);
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
        paymentRemark: '',
    });

    const [chequePaymentDetails, setChequePaymentDetails] = useState({
        paymentMethod: 'cheque',
        chqNo: '',
        chqIssuedBank: '',
        chqPaymentDate: '',
        chqRealizeDate: '',
        chequePaymentAmount: '',
        paymentRemark: '',
    });

    const [damageDetails, setDamageDetails] = useState({
        date: '',
        invoiceNo: '',
        damageTotal: '',
    });

    const [returnDetails, setReturnDetails] = useState({
        date: '',
        invoiceNo: '',
        returnNo: '',
        returnTotal: '',
    });

    const [searchDateOne, setSearchDateOne] = useState('');
    const [searchDateTwo, setSearchDateTwo] = useState('');

    const transactionsFilteredByDate = transactionsData.filter((transaction) => {
        if (searchDateOne === '' || searchDateTwo === '') {
            return transaction;
        } else if (transaction.date != '' && transaction.date != '') {
            return transaction.date >= searchDateOne && transaction.date <= searchDateTwo;
        } 
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(transactionsData.length / itemsPerPage);

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return transactionsFilteredByDate.slice(startIndex, endIndex);
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

        //get supplier totalDamage and totalReturns
        const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
        const supplierDoc = await getDoc(supplierRef);
        const supplierData = supplierDoc.data();
        const totalDamage = supplierData?.totalDamage;
        const totalReturns = supplierData?.totalReturns;

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

                if(Number(transactionDetails.returnTotal) > 0){
                    const returnsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Returns`);
                    await addDoc(returnsRef, {
                        date: transactionDetails.date,
                        invoiceNo: transactionDetails.invoiceNo,
                        returnNo: transactionDetails.returnNo,
                        returnTotal: transactionDetails.returnTotal,
                        timestamp: timestamp,
                    });

                    //Add the returnTotal to the supplier's totalReturns
                    const newTotalReturns = Number(totalReturns) + Number(transactionDetails.returnTotal);
                    await setDoc(supplierRef, { totalReturns: newTotalReturns }, { merge: true });
                }

                if(Number(transactionDetails.damageTotal) > 0){
                    const damagesRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Damages`);
                    await addDoc(damagesRef, {
                        date: transactionDetails.date,
                        invoiceNo: transactionDetails.invoiceNo,
                        damageTotal: transactionDetails.damageTotal,
                        timestamp: timestamp,
                    });

                    //Add the damageTotal to the supplier's totalDamage
                    const newTotalDamage = Number(totalDamage) + Number(transactionDetails.damageTotal);
                    await setDoc(supplierRef, { totalDamage: newTotalDamage }, { merge: true });
                }
            }

            window.location.reload();
        }catch (error){
            console.log('Error adding transaction');
        }
    }

    const recordPayment = async () => {
        setPaymentModalOpen(false);
        if (!user) {
            alert('Please login to continue');
            console.log('User not logged in');
            return;
        }
        if(totalDueToPay == '0'){
            setOutstandingBalanceZeroAlert(true);
            return;
        }else{
            if (payTotalDue) {
                // Get all supplier transactions and process payment deduction
                try {
                    const transactionsRef = query(collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions`), orderBy('date', 'asc'));
                    const transactionsSnapshot = await getDocs(transactionsRef);
                    let remainingPayment = Number(cashPaymentDetails.cashPaymentAmount || chequePaymentDetails.chequePaymentAmount);
        
                    for (const transactionDoc of transactionsSnapshot.docs) {
                        const transactionData = transactionDoc.data();
                        const outstandingBalance = Number(transactionData.outstandingBalance);
        
                        if (outstandingBalance <= 0) {
                            continue; // Skip transactions with zero or negative balances
                        }
        
                        if (remainingPayment <= 0) {
                            break; // No remaining payment to apply
                        }
        
                        let paymentToApply = Math.min(outstandingBalance, remainingPayment);

                        console.log('paid:', paymentToApply);

        
                        const transactionRef = doc(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions/${transactionDoc.id}`);
                        await updateDoc(transactionRef, {
                            outstandingBalance: outstandingBalance - paymentToApply,
                        });
        
                        // Add a payment document to the transaction
                        const paymentRef = collection(transactionRef, 'Payments');
                        if (paymentModeCash) {
                            if (cashPaymentDetails.cashPaymentAmount === '' || cashPaymentDetails.cashPaymentDate === '') {
                                alert('Please fill all required fields');
                                return;
                            } else {
                                await addDoc(paymentRef, {
                                    paymentMethod: cashPaymentDetails.paymentMethod,
                                    cashPaymentDate: cashPaymentDetails.cashPaymentDate,
                                    cashPaymentAmount: paymentToApply, 
                                    paymentRemark: cashPaymentDetails.paymentRemark,
                                    timestamp: new Date(),
                                });
                                
                            window.location.reload();
                            }
                        } else {
                            if (chequePaymentDetails.chqPaymentDate === '' || chequePaymentDetails.chqNo === '' || chequePaymentDetails.chqIssuedBank === '' || chequePaymentDetails.chequePaymentAmount === '') {
                                alert('Please fill all required fields');
                                return;
                            } else {
                                await addDoc(paymentRef, {
                                    paymentMethod: chequePaymentDetails.paymentMethod,
                                    chqNo: chequePaymentDetails.chqNo,
                                    chqIssuedBank: chequePaymentDetails.chqIssuedBank,
                                    chqPaymentDate: chequePaymentDetails.chqPaymentDate,
                                    chqRealizeDate: chequePaymentDetails.chqRealizeDate,
                                    chequePaymentAmount: paymentToApply,
                                    paymentRemark: chequePaymentDetails.paymentRemark,
                                    timestamp: new Date(),
                                });
                                const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
                                    const supplierDoc = await getDoc(supplierRef);
                                    const chqRef = collection(firestore, `users/${user.uid}/Cheques`);
                                    const supplierData = supplierDoc.data();
                                    await addDoc(chqRef, {
                                        chqNo: chequePaymentDetails.chqNo,
                                        chqIssuedBank: chequePaymentDetails.chqIssuedBank,
                                        chqAmount: paymentToApply,
                                        chqIssueDate: chequePaymentDetails.chqPaymentDate,
                                        chqRealizeDate: chequePaymentDetails.chqRealizeDate,
                                        chqSupplierId: params.supplierId,
                                        chqSupplierName: supplierData?.name ?? '',
                                        timestamp: new Date(), // Add timestamp to the transaction
                                    });
                            }
                        }
                        
                        window.location.reload();
                        remainingPayment -= paymentToApply;
                    }
        
                    // Update Supplier's Total Due after applying payment
                    const supplierRef = doc(firestore, `users/${user.uid}/Suppliers/${params.supplierId}`);
                    const supplierDoc = await getDoc(supplierRef);
        
                    if (supplierDoc.exists()) {
                        const newTotalDue = Math.max(Number(supplierDoc.data().totalDue) - Number(cashPaymentDetails.cashPaymentAmount || chequePaymentDetails.chequePaymentAmount), 0);
                        await setDoc(supplierRef, { totalDue: newTotalDue }, { merge: true });
                    }
        
                    window.location.reload();
                } catch (error) {
                    console.log('Error processing payment:', error);
                }
            } else {
                // Handle individual transaction payment
                try {
                    const transactionRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}/Transactions/${transactionId}`);
                    const transactionDoc = await getDoc(transactionRef);
        
                    if (transactionDoc.exists()) {
                        let paymentAmount = Number(cashPaymentDetails.cashPaymentAmount || chequePaymentDetails.chequePaymentAmount);
                        let outstandingBalanceAmount = Number(transactionDoc.data().outstandingBalance);
        
                        if (outstandingBalanceAmount <= 0) {
                            setOutstandingBalanceZeroAlert(true);
                            setPaymentModalOpen(false);
                        } else if (outstandingBalanceAmount < paymentAmount) {
                            console.log('Outstanding Balance:', outstandingBalanceAmount);
                            console.log('Cash Payment Amount:', paymentAmount);
                            setOutstandingBalanceExceedsAlert(true);
                            setPaymentModalOpen(false);
                        } else {
                            const timestamp = new Date();
                            const paymentRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions/${transactionId}/Payments`);
        
                            if (paymentModeCash) {
                                if (cashPaymentDetails.cashPaymentAmount === '' || cashPaymentDetails.cashPaymentDate === '') {
                                    alert('Please fill all required fields');
                                    return;
                                } else {
                                    await addDoc(paymentRef, {
                                        ...cashPaymentDetails, 
                                        timestamp: new Date(),
                                    });
                                }
                            } else {
                                if (chequePaymentDetails.chqPaymentDate === '' || chequePaymentDetails.chqNo === '' || chequePaymentDetails.chqIssuedBank === '' || chequePaymentDetails.chequePaymentAmount === '') {
                                    alert('Please fill all required fields');
                                    return;
                                } else {
                                    await addDoc(paymentRef, {
                                        ...chequePaymentDetails, 
                                        timestamp: new Date(),
                                    });
                                    const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
                                    const supplierDoc = await getDoc(supplierRef);
                                    const chqRef = collection(firestore, `users/${user.uid}/Cheques`);
                                    const supplierData = supplierDoc.data();
                                    await addDoc(chqRef, {
                                        chqNo: chequePaymentDetails.chqNo,
                                        chqIssuedBank: chequePaymentDetails.chqIssuedBank,
                                        chqAmount: chequePaymentDetails.chequePaymentAmount,
                                        chqIssueDate: chequePaymentDetails.chqPaymentDate,
                                        chqRealizeDate: chequePaymentDetails.chqRealizeDate,
                                        chqSupplierId: params.supplierId,
                                        chqSupplierName: supplierData?.name ?? '',
                                        timestamp: timestamp, // Add timestamp to the transaction
                                    });
                                }
                            }
                            const newOutstandingBalance = Number(transactionDoc.data().outstandingBalance) - paymentAmount;
                            await setDoc(transactionRef, { outstandingBalance: newOutstandingBalance }, { merge: true });
        
                            // Update Supplier's Total Due after applying payment
                            const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
                            const supplierDoc = await getDoc(supplierRef);
        
                            if (supplierDoc.exists()) {
                                const newTotalDue = Math.max(Number(supplierDoc.data().totalDue) - paymentAmount, 0);
                                await setDoc(supplierRef, { totalDue: newTotalDue }, { merge: true });
                            }
        
                            //window.location.reload();
                        }
                    }
                } catch (error) {
                    console.log('Error adding payment:', error);
                }
            }
        }
    };

    const recordDmgRtn = async () => {
        setUpdateTransactionModal(false);
        if (!user) {
            alert('Please login to continue');
            console.log('User not logged in');
            return;
        }

        try {
            const timestamp = new Date();

            if (UpdateDamage) {
                if (!damageDetails.date || !damageDetails.invoiceNo || !damageDetails.damageTotal) {
                    alert('Please fill all required fields');
                    return;
                } else {
                    const damagesRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Damages`);
                    await addDoc(damagesRef, {
                        ...damageDetails,
                        timestamp: timestamp,
                    });

                    //Add the damageTotal to the supplier's totalDamage
                    const supplierRef = doc(firestore, `users/${user.uid}/Suppliers/${params.supplierId}`);
                    const supplierDoc = await getDoc(supplierRef);
                    if (supplierDoc.exists()) {
                        const newTotalDamage = Number(supplierDoc.data().totalDamage) + Number(damageDetails.damageTotal);
                        await setDoc(supplierRef, { totalDamage: newTotalDamage }, { merge: true });
                    }

                    //Deduct the damageTotal from the supplier's totalDue
                    const newTotalDue = Number(supplierDoc.data()?.totalDue) - Number(damageDetails.damageTotal);
                    await setDoc(supplierRef, { totalDue: newTotalDue }, { merge: true });
                }
            } else {
                if (!returnDetails.date || !returnDetails.invoiceNo || !returnDetails.returnNo || !returnDetails.returnTotal) {
                    alert('Please fill all required fields');
                    return;
                } else {
                    const returnsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Returns`);
                    await addDoc(returnsRef, {
                        ...returnDetails,
                        timestamp: timestamp,
                    });

                    //Add the returnTotal to the supplier's totalReturns
                    const supplierRef = doc(firestore, `users/${user.uid}/Suppliers/${params.supplierId}`);
                    const supplierDoc = await getDoc(supplierRef);
                    if (supplierDoc.exists()) {
                        const newTotalReturns = Number(supplierDoc.data().totalReturns) + Number(returnDetails.returnTotal);
                        await setDoc(supplierRef, { totalReturns: newTotalReturns }, { merge: true });
                    }

                    //Deduct the returnTotal from the supplier's totalDue
                    const newTotalDue = Number(supplierDoc.data()?.totalDue) - Number(returnDetails.returnTotal);
                    await setDoc(supplierRef, { totalDue: newTotalDue }, { merge: true });
                }
            }
            window.location.reload();
        } catch (error) {
            console.log('Error adding damage/return:', error);
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
            const transactionsQuery = query(transactionsRef, orderBy('date', 'asc'));
    
            const querySnapshot = await getDocs(transactionsQuery);
    
            let transactions: any[] = [];
    
            // Use Promise.all to wait for all payments fetching to complete
            await Promise.all(querySnapshot.docs.map(async (doc) => {
                const transactionData = doc.data();
                const transactionId = doc.id;
    
                // Fetch Payments for this transaction
                const paymentsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions/${transactionId}/Payments`);
                const paymentsSnapshot = await getDocs(paymentsRef);
                const payments = paymentsSnapshot.docs.map(payment => ({ ...payment.data(), id: payment.id }));
    
                transactions.push({ ...transactionData, id: transactionId, payments });
            }));
    
            setTransactionsData(transactions);
            setPaymentsData(transactions.map(transaction => transaction.payments).flat());
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const handlePayClick = (id: string) => {
        setPaymentModalOpen(true);
        setTransactionId(id);

    }

    const handleTotalDuePayClick = () => {
        setPaymentModalOpen(true);
        setPayTotalDue(true);
    }

    const handleDmgRtnClose = () => {
        setUpdateTransactionModal(false);
        setDamageDetails({
            date: '',
            invoiceNo: '',
            damageTotal: '',
        });

        setReturnDetails({
            date: '',
            invoiceNo: '',
            returnNo: '',
            returnTotal: '',
        });
    }

    const getPaymentData = async (id: string) => {

        setViewPaymentsModal(true);
        setTransactionId(id);
        if (!user) {
            console.log('User not logged in');
            return;
        }
    
        try {
            const paymentsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions/${id}/Payments`);
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
                    balance: balance.toString(),
                    outstandingBalance: remainingTotalDue.toString(),
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

    const handleDmgRtnInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(UpdateDamage){
            const { name, value } = e.target;
            let newDamageDetails = {
                ...damageDetails,
                [name]: value,
            };
            setDamageDetails(newDamageDetails);
            
        } else {
            const { name, value } = e.target;
            let newReturnDetails = {
                ...returnDetails,
                [name]: value,
            };

            setReturnDetails(newReturnDetails);
        }
    };

    function getSupplierDetails() {
        if (!user) {
            console.log('User not logged in');
            return;
        }
        //Get name of the supplier
        const supplierRef = doc(firestore, `users/${user.uid}/Suppliers/${params.supplierId}`);
        getDoc(supplierRef).then((doc) => {
            if (doc.exists()) {
                const name = doc.data()?.name;
                const totalDue = doc.data()?.totalDue;
                console.log(doc.data()?.totalDue);
                setTotalDueToPay(totalDue);
                setSupplierName(name);
            } else {
                // doc.data() will be undefined in this case
                console.log('No such document!');
            }
        }).catch((error) => {
            console.log('Error getting document:', error);
        });
    }

    const generatePDF = (month: string) => {

        if(!month){
            setError('Please select a month to export the PDF');
            return;
        }
        
        // Get today's date
        const today = new Date();
        const monthNumber = parseInt(month.split('-')[1].replace(/^0+/, ''));

        //Get month name from month number
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthName = months[monthNumber - 1];
        console.log('Current Month:', currentMonthName);

        // Filter transactions for the current month
        const filteredTransactions = transactionsData.filter(item => {
            const transactionMonth = (new Date(item.date)).getMonth() + 1;
            return transactionMonth === monthNumber;
        });
    
        // If there are no transactions for the current month, return
        if (filteredTransactions.length === 0) {
            setError(`No transactions found for ${currentMonthName} ${today.getFullYear()}`);
            return;
        }
        
        //if the transaction's outstanding balance for the month is not settled, alert the user
        const outstandingBalance = filteredTransactions.some(transaction => transaction.outstandingBalance > 0);
        if (outstandingBalance) {
            setError('Outstanding balance for the month is not settled');
            return;
        }

        //Delete transactions and payments of the selected month
        const deleteTransactions = async () => {
            if (!user) {
                console.log('User not logged in');
                return;
            }
            try {
                const transactionsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions`);
                const transactionsQuery = query(transactionsRef, orderBy('timestamp', 'desc'));
                const querySnapshot = await getDocs(transactionsQuery);
                let transactions: any[] = [];
                await Promise.all(querySnapshot.docs.map(async (doc) => {
                    const transactionData = doc.data();
                    const transactionId = doc.id;
                    const transactionMonth = (new Date(transactionData.date)).getMonth() + 1;
                    if (transactionMonth === monthNumber) {
                        console.log('Deleting transaction:', transactionData);
                        console.log('transactioMonth:', transactionMonth);
                        await deleteDoc(doc.ref);
                    }
                }));

                //also delete the payments inside the transactions
                const paymentsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Transactions/${transactionId}/Payments`);
                const paymentsQuery = query(paymentsRef, orderBy('timestamp', 'asc'));
                const paymentsQuerySnapshot = await getDocs(paymentsQuery);
                let payments: any[] = [];
                await Promise.all(paymentsQuerySnapshot.docs.map(async (doc) => {
                    const paymentData = doc.data();
                    const paymentId = doc.id;
                    const paymentMonth = (new Date(paymentData.cashPaymentDate || paymentData.chqPaymentDate)).getMonth() + 1;
                    if (paymentMonth === monthNumber) {
                        await deleteDoc(doc.ref);
                    }
                }));
            } catch (error) {
                console.error('Error deleting transactions:', error);
            }
        }


        // Create a new PDF document
        const doc = new jsPDF({ orientation: 'landscape' });
    
        // Set title
        doc.text(`Transactions of ${supplierName} in ${currentMonthName} ${today.getFullYear()}`, 10, 10);
    
        // Define columns for the table
        const columns = [
            'Date',
            'Invoice No.',
            'Total',
            'Return No.',
            'Return Total',
            'Damage Total',
            'Balance',
            'Cash/CHQ Date',
            'CHQ No.',
            'CHQ Issued Bank',
            'Cash/CHQ Amount',
            'CHQ Realize Date',
            'Outstanding Balance',
        ];
    
        // Initialize rows array
        let rows: any[][] = [];
    
        // Map the filtered transactions to rows
        filteredTransactions.forEach(transaction => {
            // Transaction row
            const transactionRow = [
                formatDate(transaction.date),
                transaction.invoiceNo,
                'Rs.'+transaction.total,
                transaction.returnNo,
                transaction.returnTotal,
                transaction.damageTotal,
                'Rs.'+transaction.balance,
                '', // Empty cell for Payment Date
                '', // Empty cell for CHQ No.
                '', // Empty cell for CHQ Issued Bank
                '', // Empty cell for CHQ Amount
                '', // Empty cell for CHQ Realize Date
                transaction.outstandingBalance,
            ];
            transactionRow[7] = transaction.payments[0]?.cashPaymentDate || transaction.payments[0]?.chqPaymentDate;
            transactionRow[8] = transaction.payments[0]?.chqNo || 'N/A';
            transactionRow[9] = transaction.payments[0]?.chqIssuedBank || 'N/A';
            transactionRow[10] = transaction.payments[0]?.cashPaymentAmount || transaction.payments[0]?.chequePaymentAmount;
            transactionRow[11] = transaction.payments[0]?.chqRealizeDate || 'N/A';
            rows.push(transactionRow);

            //Payment rows - start the payments from index 1
            for (let i = 1; i < transaction.payments.length; i++) {
                const payment = transaction.payments[i];
                const paymentRow = [
                    '', // Empty cell for Date
                    '', // Empty cell for Invoice No.
                    '', // Empty cell for Total
                    '', // Empty cell for Return No.
                    '', // Empty cell for Return Total
                    '', // Empty cell for Damage Total
                    '', // Empty cell for Balance
                    payment.cashPaymentDate || payment.chqPaymentDate,
                    payment.chqNo || 'N/A', // Empty cell for CHQ No.
                    payment.chqIssuedBank || 'N/A', // Empty cell for CHQ Issued Bank
                    payment.cashPaymentAmount || payment.chequePaymentAmount, // Empty cell for CHQ Amount
                    payment.chqRealizeDate || 'N/A', // Empty cell for CHQ Realize Date
                    '', // Empty cell for Outstanding Balance
                ];
                rows.push(paymentRow);
            }
            // Add a red-colored row after each transaction
            const redRow = [
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
                { content: '', styles: { fillColor: [255, 99, 71] } },
            ];
            rows.push(redRow);
        });
    
        // Add the table to the PDF
        (doc as any).autoTable({
            head: [columns],
            body: rows,
            theme: 'grid',
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.5,
            },
        });
    
        // Save the PDF with a name
        const pdfName = `${supplierName} ${currentMonthName} ${today.getFullYear()} Transactions.pdf`;
        doc.save(pdfName);
        deleteTransactions();
    };
    
    // Helper function to format date if needed
    function formatDate(date: string | number | Date) {
        const d = new Date(date);
        const year = d.getFullYear();
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
    
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
    
        return [year, month, day].join('-');
    }
    
    
    useEffect(() => {
        if (user) {
            getTransactions();
            getSupplierDetails();
        }
    }, [user]);

    return (
        <>
        {outstandingBalanceZeroAlert || outstandingBalanceExceedsAlert ? ( 
        <div role="alert" className="alert alert-error mt-5 flex justify-between items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {outstandingBalanceZeroAlert ? (
                <div className='flex-grow'>
                    <p className="font-bold">Outstanding Balance is Zero</p>
                    <p className="text-sm">The outstanding balance for this transaction is already zero!</p>
                </div>
            ) : (
                <div className='flex-grow'>
                    <p className="font-bold">Outstanding Balance Exceeds</p>
                    <p className="text-sm">The payment amount exceeds the outstanding balance for this transaction.</p>
                </div>
            )}
            <button
                className={`btn btn-square ${outstandingBalanceZeroAlert ? 'bg-black hover:bg-gray-800' : 'bg-red-500'} text-white`}
                onClick={outstandingBalanceZeroAlert ? () => setOutstandingBalanceZeroAlert(false) : () => setOutstandingBalanceExceedsAlert(false)}
            >
                X
            </button>
        </div>
        ) : null}
        <div style={{ borderRadius: '10px' }} className="mt-10 p-10 bg-neutral-700">
            <div className="flex mb-5">
                <h1 className="text-2xl font-semibold mb-5">Supplier Transactions</h1>
                <div className='flex-col ml-auto'>
                    <div className='flex gap-2 mb-2'>
                        <button className="bg-black hover:bg-white hover:text-red-800 text-white font-bold py-2 px-4 rounded ml-auto" onClick={() => setModalOpen(true)}>
                            Record Transaction
                        </button>
                        {transactionsData.length != 0 ? (
                            <button className="bg-orange-500 hover:bg-orange-800 text-white font-bold py-2 px-4 rounded ml-auto" onClick={() => setUpdateTransactionModal(true)}>
                                Record Damage & Return
                            </button>
                        ) : null} 
                    </div>
                    <div className='ml-auto'> 
                    {transactionsData.length != 0 ? (
                        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-24 rounded ml-4" onClick={() => setViewExportPdfModal(true)}>
                            Export to PDF & Clear Database
                        </button>
                    ) : null}
                    </div>
                </div>
            </div>
        
            <div>
            </div>
            {transactionsData.length != 0 ? (
                <div className="overflow-x-auto">
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
                    <div className='flex w-1/3 mb-5 items-center'>
                        <p className="text-xl font-bold text-red-500">Total Due: Rs.{totalDueToPay}</p>
                        <button className="bg-lime-500 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={() => handleTotalDuePayClick()}>
                            Pay Total Due
                        </button>
                    </div>
                <table className="w-full">
                    <thead>
                        <tr>
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
                            <th className="px-4 py-2 border-2 border-black bg-red-800 hidden lg:table-cell">Outstanding Balance</th>
                            <th className="px-4 py-2 border-2 border-black bg-red-800 hidden lg:table-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {getCurrentPageData().map((item, index) => {
                        return (
                            <tr key={index} className="border border-black">
                                <td className="px-4 py-2 border border-black hidden sm:table-cell">{item.date}</td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.invoiceNo}</td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">Rs.{item.total}</td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">{item.returnNo}</td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">Rs.{item.returnTotal}</td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">Rs.{item.damageTotal}</td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">Rs.{item.balance}</td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">
                                    {item.payments.length > 0 ? item.payments[0].cashPaymentDate || item.payments[0].chqPaymentDate : 'N/A'}
                                </td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">
                                    {item.payments && item.payments.length > 0 && item.payments[0].chqNo ? item.payments[0].chqNo : "N/A"}
                                </td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">
                                    {item.payments && item.payments.length > 0 && item.payments[0].chqIssuedBank ? item.payments[0].chqIssuedBank : "N/A"}
                                </td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">
                                    Rs.{item.payments && item.payments.length > 0 ? item.payments[0].cashPaymentAmount || item.payments[0].chequePaymentAmount : "N/A"}
                                </td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">
                                    {item.payments && item.payments.length > 0 && item.payments[0].chqRealizeDate ? item.payments[0].chqRealizeDate : "N/A"}
                                </td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">
                                Rs.{item.outstandingBalance}
                                </td>
                                <td className="px-4 py-2 border border-black hidden lg:table-cell">
                                    <div className='flex gap-3'>
                                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => getPaymentData(item.id)}>View</button>
                                        <button className="bg-lime-500 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded" onClick={() => handlePayClick(item.id)}>Pay</button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>

                </table>
            </div>
            ):(
                <p className="text-center font-semibold text-white">No transactions recorded yet!</p>
            )}
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
                                <div>
                                    <div className="mt-3 text-center sm:text-left">
                                    <div className="flex p-2">
                                        <h2 className="text-xl font-semibold mb-4">RECORD PAYMENT</h2>
                                        <button className="btn btn-square bg-red-500 text-white ml-auto" onClick={() => setPaymentModalOpen(false)}>X</button>
                                    </div>
                                        <div className="mt-2">
                                            <div className="flex flex-col sm:flex-row">
                                            <div className="w-full sm:pr-2 mb-4">
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
                                                <div className="w-full sm:pr-2 mb-4">
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
                                                <div className="w-full sm:pr-2 mb-4">
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
                                            </div>
                                            <div className="w-full mb-4">
                                                        <label htmlFor="paymentRemark" className="block text-sm font-medium text-white">
                                                            Cash Payment Remark
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="paymentRemark"
                                                            id="paymentRemark"
                                                            onChange={handlePaymentInputChange}
                                                            value={cashPaymentDetails.paymentRemark}
                                                            className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                        />
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
                                                    <div className="w-full mb-4">
                                                        <label htmlFor="paymentRemark" className="block text-sm font-medium text-white">
                                                            CHQ Payment Remark
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="paymentRemark"
                                                            id="paymentRemark"
                                                            onChange={handlePaymentInputChange}
                                                            value={chequePaymentDetails.paymentRemark}
                                                            className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                        />
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

            {/* Modal for Updating Damage and Returns */}
            {updateTransactionModal && (
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
                                <div>
                                    <div className="mt-3 text-center sm:text-left">
                                    <div className="flex p-2">
                                        <h2 className="text-xl font-semibold mb-4">Update Transaction</h2>
                                        <button className="btn btn-square bg-red-500 text-white ml-auto" onClick={() => handleDmgRtnClose()}>X</button>
                                    </div>
                                        <div className="mt-2">
                                            <div className="flex flex-col sm:flex-row">
                                            <div className="w-full sm:pr-2 mb-4">
                                                <label htmlFor="recordPick" className="block text-sm font-medium text-white">
                                                    Pick what to record
                                                </label>
                                                <select
                                                    name="recordPick"
                                                    id="recordPick"
                                                    onChange={(e) => setUpdateDamage(e.target.value === "damage")}
                                                    value={UpdateDamage ? "damage" : "returns"}
                                                    className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                >
                                                    <option value="damage">Record Damage</option>
                                                    <option value="returns">Record Returns</option>
                                                </select>
                                            </div>
                                            </div>
                                            {UpdateDamage ? (
                                                <>
                                            <div className="w-full sm:pr-2 mb-4">
                                                <label htmlFor="date" className="block text-sm font-medium text-white">
                                                    Damage Date
                                                </label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    id="date"
                                                    className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    onChange={handleDmgRtnInputChange}
                                                    value={damageDetails.date}
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:pr-2 mb-4">
                                                <label htmlFor="invoiceNo" className="block text-sm font-medium text-white">
                                                    Invoice No related to the damage
                                                </label>
                                                <input
                                                    type="text"
                                                    name="invoiceNo"
                                                    id="invoiceNo"
                                                    className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    onChange={handleDmgRtnInputChange}
                                                    value={damageDetails.invoiceNo}
                                                />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:pr-2 mb-4">
                                                <label htmlFor="damageTotal" className="block text-sm font-medium text-white">
                                                        Damage Amount to update
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="damageTotal"
                                                        id="damageTotal"
                                                        onChange={handleDmgRtnInputChange}
                                                        value={damageDetails.damageTotal}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                                </>

                                            ) : (
                                                <>
                                                <div className="w-full sm:pr-2 mb-4">
                                                <label htmlFor="date" className="block text-sm font-medium text-white">
                                                    Returns Date
                                                </label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    id="date"
                                                    className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    onChange={handleDmgRtnInputChange}
                                                    value={returnDetails.date}
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:pr-2 mb-4">
                                                <label htmlFor="invoiceNo" className="block text-sm font-medium text-white">
                                                    Invoice No related to the returns
                                                </label>
                                                <input
                                                    type="text"
                                                    name="invoiceNo"
                                                    id="invoiceNo"
                                                    className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    onChange={handleDmgRtnInputChange}
                                                    value={returnDetails.invoiceNo}
                                                />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:pr-2 mb-4">
                                                <label htmlFor="returnNo" className="block text-sm font-medium text-white">
                                                    Returns No.
                                                </label>
                                                <input
                                                    type="text"
                                                    name="returnNo"
                                                    id="returnNo"
                                                    className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    onChange={handleDmgRtnInputChange}
                                                    value={returnDetails.returnNo}
                                                />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row">
                                                <div className="w-full sm:pr-2 mb-4">
                                                <label htmlFor="returnTotal" className="block text-sm font-medium text-white">
                                                        Returns Amount to update
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="returnTotal"
                                                        id="returnTotal"
                                                        onChange={handleDmgRtnInputChange}
                                                        value={returnDetails.returnTotal}
                                                        className="mt-1 p-2 w-full border border-blue-500 rounded-md"
                                                    />
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
                                    onClick={recordDmgRtn}
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => handleDmgRtnClose()}
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
            
            {/* Modal for Viewing Payments */}
            {viewPaymentsModal && (
            <div className="fixed inset-0 z-50">
                <div className="flex items-center justify-center min-h-screen px-4">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-black opacity-50"></div>

                {/* Modal content */}
                <div className="w-full bg-gray-800 rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-2xl sm:w-full sm:m-10">
                    {/* Close button */}
                    <button
                    className="absolute top-0 right-0 mt-4 mr-4 bg-gray-200 rounded-full p-2 hover:bg-gray-300"
                    onClick={() => setViewPaymentsModal(false)}
                    >
                    <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    </button>
                    {paymentsData.length > 0 ? (
                    <div>
                        {/* Modal header */}
                        <div className="bg-gray-800 py-4 px-6">
                            <div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Payments of Invoice No: {transactionsData.map(
                                        (item) => (
                                            item.id === transactionId ? item.invoiceNo : ''
                                        )
                                    )}</h2>
                                </div>
                                {/* dropdown to select cheque or cash */}
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        className={`btn btn-square w-20 ${viewCashPayments ? 'bg-blue-500' : 'bg-gray-500'} text-white`}
                                        onClick={() => setViewCashPayments(true)}
                                    >
                                        Cash
                                    </button>
                                    <button
                                        className={`btn btn-square w-20 ${viewCashPayments ? 'bg-gray-500' : 'bg-blue-500'} text-white`}
                                        onClick={() => setViewCashPayments(false)}
                                    >
                                        Cheque
                                    </button>
                                </div> 
                            </div>
                        </div>
                        {/* Modal body */}
                        <div className="px-6 py-4">
                        <div className="overflow-x-auto">
                            {viewCashPayments ? (
                            <table className="w-full table-auto">
                                <thead>
                                    <tr>
                                    <th className="px-4 py-2 border border-black bg-blue-600">Payment Date</th>
                                    <th className="px-4 py-2 border border-black bg-blue-600">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentsData.filter(item => item.paymentMethod === "cash").map((item, index) => (
                                    <tr key={index} className="border border-black">
                                        <td className="px-4 py-2 border border-black">{item.cashPaymentDate}</td>
                                        <td className="px-4 py-2 border border-black">Rs.{item.cashPaymentAmount}</td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                            ) : (
                            <table className="w-full table-auto">
                            <thead>
                                <tr>
                                <th className="px-4 py-2 border border-black bg-blue-600">Payment Date</th>
                                <th className="px-4 py-2 border border-black bg-blue-600">Amount</th>
                                <th className="px-4 py-2 border border-black bg-blue-600">CHQ No.</th>
                                <th className="px-4 py-2 border border-black bg-blue-600">CHQ Issued Bank</th>
                                <th className="px-4 py-2 border border-black bg-blue-600">CHQ Realize Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentsData.filter(item => item.paymentMethod === "cheque").map((item, index) => (
                                <tr key={index} className="border border-black">
                                    <td className="px-4 py-2 border border-black">{item.chqPaymentDate}</td>
                                    <td className="px-4 py-2 border border-black">Rs.{item.chequePaymentAmount}</td>
                                    <td className="px-4 py-2 border border-black">{item.chqNo}</td>
                                    <td className="px-4 py-2 border border-black">{item.chqIssuedBank}</td>
                                    <td className="px-4 py-2 border border-black">{item.chqRealizeDate}</td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                            )}
                        </div>
                        </div>
                    </div>
                    ) : (
                    <div className="p-10">
                        <p className='font-semibold'>No payments have been recorded for this transaction!</p>
                    </div>
                    )}
                </div>
                </div>
            </div>
            )}

            {/* Modal for Exporting PDF */}
            {viewExportPdfModal && (
            <div className="fixed inset-0 z-50">
                <div className="flex items-center justify-center min-h-screen px-4">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-black opacity-50"></div>

                {/* Modal content */}
                <div className="w-full bg-gray-800 rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-2xl sm:w-full sm:m-10">
                    {/* Close button */}
                    <button
                    className="absolute top-0 right-0 mt-4 mr-4 bg-gray-200 rounded-full p-2 hover:bg-gray-300"
                    onClick={() => setViewExportPdfModal(false)}
                    >
                    <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    </button>
                    <div>
                        <div className="bg-gray-800 py-4 px-6">
                            <div>
                                <div className='p-16'>
                                    {error && 
                                        <span className="text-red-500 mb-5 flex" onClick={() => setError('')}>
                                            <p>{error}</p>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="7" stroke='red' d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </span>
                                    }
                                    <label htmlFor="month" className="block text-sm font-medium text-white">
                                        Select Month to Export PDF
                                    </label>
                                    <input
                                        type="month"
                                        name="month"
                                        id="month"
                                        onChange={(e) => setMonthToExportPdf(e.target.value)}
                                        value={monthToExportPdf}
                                        className="mt-1 mb-5 p-2 w-full border border-blue-500 rounded-md"
                                    />
                                    <button
                                        className="w-full btn btn-square bg-blue-500 text-white"
                                        onClick={() => generatePDF(monthToExportPdf)}
                                    >
                                        Export to PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            )}

        </div>
        </>

    );
};

export default SupplierTransactions2;
