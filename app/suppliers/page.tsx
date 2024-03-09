'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { getDocs, collection } from 'firebase/firestore';
import Link from 'next/link';

const Suppliers = () => {
    const [user] = useAuthState(auth);
    const [suppliers, setSuppliers] = useState<any[]>([]); // Define type as any[] for simplicity

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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Suppliers;
