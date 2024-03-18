'use client'
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { getDocs, collection, deleteDoc, doc, query, where, getDocs as getSubCollectionDocs } from 'firebase/firestore';
import Link from 'next/link';

const Suppliers = () => {
    const [user] = useAuthState(auth);
    const [suppliers, setSuppliers] = useState<any[]>([]); // Define type as any[] for simplicity
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [supplierIdToDelete, setSupplierIdToDelete] = useState('');

    useEffect(() => {
        if (user) {
            getSuppliers();
        }
    }, [user]);

    const getSuppliers = async () => {
        if (!user) return; // Ensure user is not null

        // Fetch all suppliers from Firestore
        const supplierCollection = collection(firestore, `users/${user.uid}/Suppliers`);
        const supplierSnapshot = await getDocs(supplierCollection);
        const supplierList = supplierSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setSuppliers(supplierList);
    };

    //Delete Supplier
    const deleteSupplier = async (id: string) => {
        if (!user) return; // Ensure user is not null

        // Set the ID of the supplier to delete
        setSupplierIdToDelete(id);
        // Show the delete confirmation modal
        setShowDeleteModal(true);
    };

    const confirmDeleteSupplier = async () => {
        if (!user || !supplierIdToDelete) return;

        try {
            // Delete transactions for the supplier
            const transactionsQuery = query(collection(firestore, `users/${user.uid}/Suppliers/${supplierIdToDelete}/Transactions`));
            const transactionSnapshot = await getDocs(transactionsQuery);
            const deleteTransactionPromises = transactionSnapshot.docs.map(async (doc) => {
                await deleteDoc(doc.ref);
            });
            await Promise.all(deleteTransactionPromises);

            // Delete supplier from Firestore
            const supplierDoc = doc(firestore, `users/${user.uid}/Suppliers/${supplierIdToDelete}`);
            await deleteDoc(supplierDoc);

            getSuppliers();
        } catch (error) {
            console.error('Error deleting supplier and transactions: ', error);
        }

        // Reset modal state
        setShowDeleteModal(false);
        setSupplierIdToDelete('');
    };

    const cancelDelete = () => {
        // Reset modal state
        setShowDeleteModal(false);
        setSupplierIdToDelete('');
    };

    return (
        <div className="container mx-auto mt-8">
            <div className='flex mb-2'>
                <h1 className="text-3xl font-bold mb-4">Suppliers</h1>
                <div className='ml-auto'>
                    <Link href="/suppliers/addSuppliers">
                        <button className="ml-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add Supplier</button>
                    </Link>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Company Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Due
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-black">
                        {suppliers.map(supplier => (
                            <tr key={supplier.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href="/suppliers/[id]" as={`/suppliers/${supplier.id}`}>
                                        <div className="text-blue-500 hover:underline">{supplier.name}</div>
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.companyName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.contactNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">LKR {supplier.totalDue}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2" onClick={() => deleteSupplier(supplier.id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showDeleteModal && (
            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity">
                        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Confirmation</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">Are you sure you want to delete? This action will delete all transactions as well and cannot be undone!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse flex">
                        <button onClick={confirmDeleteSupplier} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                            Delete Supplier
                        </button>
                        <button onClick={cancelDelete} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
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

export default Suppliers;

