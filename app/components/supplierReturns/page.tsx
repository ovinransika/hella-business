'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';;

const SupplierReturns = ({ params }: { params: { supplierId: string } }) => {

    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(true);
    const [returns, setReturns] = useState<any[]>([]); // Update the type of returns to any[]
    const [totalReturns, setTotalReturns] = useState(0);

    const [searchDateOne, setSearchDateOne] = useState('');
    const [searchDateTwo, setSearchDateTwo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const transactionsFilteredByDate = returns.filter((returnsData) => {
        if (searchDateOne === '' || searchDateTwo === '') {
            return returnsData;
        } else if (returnsData.date != '') {
            return returnsData.date >= searchDateOne && returnsData.date <= searchDateTwo
        } 
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(returns.length / itemsPerPage);

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return transactionsFilteredByDate.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: React.SetStateAction<number>) => {
        setCurrentPage(page);
    }

    const fetchReturnRecords = async () => {

        //Get totalReturns of the supplier
        const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
        const supplierSnap = await getDoc(supplierRef);
        const supplierData = supplierSnap.data();
        setTotalReturns(supplierData?.totalReturns);

        // Get all return records for the supplier
        const returnRef = collection(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}/Returns`);
        const returnQuery = query(returnRef, orderBy('date', 'asc'));

        const damageSnapshot = await getDocs(returnQuery);
        let allReturnsArray: any[] = [];

        //get all return records without for loop
        allReturnsArray = damageSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setReturns(allReturnsArray);
        console.log(allReturnsArray);

    }


    useEffect(() => {
        fetchReturnRecords();
    }, []);

  return (
    <div>
        <div style={{ borderRadius: '10px' }} className="mt-10 p-10 bg-neutral-700">
            <h1 className="text-2xl font-bold text-white">All Return Records for Supplier</h1>
            {returns.length === 0 ? (
                <p className="text-white font-semibold">No return records found!</p>
            ) :
                <>
                <div className="mt-5">
                    <h1 className="text-xl font-bold text-red-500 mb-5">Total Returns: Rs.{totalReturns}</h1>
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
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">Recorded Date</th>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">Return for Invoice No.</th>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">Return No.</th>
                                <th className="px-4 py-2 border-2 border-black bg-blue-600 hidden sm:table-cell">Return Total</th>
                            </tr>
                        </thead>
                        <tbody>
                                {getCurrentPageData().map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 border-2 border-black">{item.date}</td>
                                        <td className="px-4 py-2 border-2 border-black">{item.invoiceNo}</td>
                                        <td className="px-4 py-2 border-2 border-black">{item.returnNo}</td>
                                        <td className="px-4 py-2 border-2 border-black">Rs.{item.returnTotal}</td>
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
            }
        </div>
    </div>
  )
}

export default SupplierReturns;
