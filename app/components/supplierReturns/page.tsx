'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const SupplierReturns = ({ params }: { params: { supplierId: string } }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [user] = useAuthState(auth);
    const [returnsData, setReturnsData] = useState<any[]>([]);

    const [returnsDate, setReturnsDate] = useState('');
    const [returnsNo, setReturnsNo] = useState('');
    const [returnsAmount, setReturnsAmount] = useState('');
    const [returnsReason, setReturnsReason] = useState('');
    const [returnsConfirm, setReturnsConfirm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null); // Track edit ID

    useEffect(() => {
        if (user) {
            getSupplierReturns();
        }
    }, [user]);

    const addReturns = async () => {
        if (returnsAmount === '' || returnsDate === '' || returnsNo === '' || returnsReason === '' || !returnsConfirm) {
            console.log('Please fill all the fields');
            return;
        }

        try {
            const returnsRef = collection(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}/Returns`);
            await addDoc(returnsRef, {
                returnsDate: returnsDate,
                returnsNo: returnsNo,
                returnsAmount: returnsAmount,
                returnsReason: returnsReason
            });
            //Get Supplier's Total Due and subtract the returns amount from it
            const supplierRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}`);
            const supplierDoc = await getDoc(supplierRef);
            if (supplierDoc.exists()) {
                const supplierData = supplierDoc.data();
                const supplierTotalDue = supplierData.totalDue;
                const newTotalDue = supplierTotalDue - Number(returnsAmount);
                await setDoc(supplierRef, { totalDue: newTotalDue }, { merge: true });
            }
            console.log('Returns added successfully');

            // Clear form fields after successful submission
            setReturnsDate('');
            setReturnsNo('');
            setReturnsAmount('');
            setReturnsReason('');
            setEditId(null); // Reset edit ID to null

            // Reload the data
            getSupplierReturns();

            //close modal
            (document.getElementById('my_modal_4') as HTMLDialogElement)?.close();

            //Reload whole page
            window.location.reload();
        } catch (error) {
            console.error('Error adding returns:', error);
        }
    };

    const editReturns = (returnsId: string) => {
        const returnsToEdit = returnsData.find((item) => item.id === returnsId);
        if (returnsToEdit) {
            setReturnsDate(returnsToEdit.returnsDate);
            setReturnsNo(returnsToEdit.returnsNo);
            setReturnsAmount(returnsToEdit.returnsAmount);
            setReturnsReason(returnsToEdit.returnsReason);
            setEditId(returnsId); // Set the ID for editing
            (document.getElementById('my_modal_4') as HTMLDialogElement)?.showModal();
        }
    };

    const updateReturns = async () => {
        if (returnsAmount === '' || returnsDate === '' || returnsNo === '' || returnsReason === '' || !returnsConfirm || !editId) {
            console.log('Please fill all the fields');
            return;
        }

        try {
            const returnsRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}/Returns/${editId}`);
            await setDoc(returnsRef, {
                returnsDate: returnsDate,
                returnsNo: returnsNo,
                returnsAmount: returnsAmount,
                returnsReason: returnsReason
            }, { merge: true });

            console.log('Returns updated successfully');

            // Clear form fields after successful update
            setReturnsDate('');
            setReturnsNo('');
            setReturnsAmount('');
            setReturnsReason('');
            setEditId(null); // Reset edit ID to null

            // Reload the data
            getSupplierReturns();

            // Close the modal
            (document.getElementById('my_modal_4') as HTMLDialogElement)?.close();

            //Reload whole page
            window.location.reload();
        } catch (error) {
            console.error('Error updating returns:', error);
        }
    };

    const deleteReturns = async (returnsId: string) => {
        if (confirm('Are you sure you want to delete this returns?')) {
            try {
                // Construct the returns reference with the document ID
                const returnsRef = doc(firestore, `users/${user?.uid}/Suppliers/${params.supplierId}/Returns/${returnsId}`);
                
                // Delete the document
                await deleteDoc(returnsRef);
                
                console.log('Returns deleted successfully');
                
                // Reload the data
                getSupplierReturns();
            } catch (error) {
                console.error('Error deleting returns:', error);
            }
        }
    };

    const getSupplierReturns = async () => {
        if (!user) return;
        
        const returnsRef = collection(firestore, `users/${user.uid}/Suppliers/${params.supplierId}/Returns`);
        const querySnapshot = await getDocs(returnsRef);
        
        let supplierReturns: any[] = [];
        querySnapshot.forEach((doc) => {
            // Include the document ID in the data
            supplierReturns.push({ ...doc.data(), id: doc.id });
        });
        
        setReturnsData(supplierReturns);
    };

    const itemsPerPage = 10;
    const totalPages = Math.ceil(returnsData.length / itemsPerPage);

    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return returnsData.slice(startIndex, endIndex);
    };

    const handlePageChange = (page: React.SetStateAction<number>) => {
        setCurrentPage(page);
    };

    return (
        <div style={{ borderRadius: '10px' }} className="mt-10 bg-red-800 p-10">
            <div className="flex justify-between mb-5">
                <h1 className="text-2xl font-semibold mb-5">Supplier Returns</h1>
                <button className="bg-black hover:bg-white hover:text-red-800 text-white font-bold py-2 px-4 rounded" onClick={() => (document.getElementById('my_modal_4') as HTMLDialogElement)?.showModal()}>
                    Add Returns
                </button>
            </div>
            {/* Show Table only if supplier Returns are available... If not show "There are no returns for this supplier" */}
            {returnsData.length === 0 ? (
                <p className="text-center font-semibold text-l">THERE ARE NO RETURNS RELATED TO THIS SUPPLIER!!!</p>
            ) : (
            <>
            <table className="w-full">
                <thead>
                    <tr>
                        <th className="px-4 py-2 border border-black">Date</th>
                        <th className="px-4 py-2 border border-black">Returns No.</th>
                        <th className="px-4 py-2 border border-black">Amount</th>
                        <th className="px-4 py-2 border border-black">Reason</th>
                        <th className="px-4 py-2 border border-black">Update</th>
                    </tr>
                </thead>
                <tbody>
                    {getCurrentPageData().map((item, index) => (
                        <tr key={index} className="border border-black">
                            <td className="px-4 py-2 border border-black">{item.returnsDate}</td>
                            <td className="px-4 py-2 border border-black">{item.returnsNo}</td>
                            <td className="px-4 py-2 border border-black">{item.returnsAmount}</td>
                            <td className="px-4 py-2 border border-black">{item.returnsReason}</td>
                            <td className="px-4 py-2 border border-black">
                                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => editReturns(item.id)}>Edit</button>
                                <button
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2"
                                    onClick={() => deleteReturns(item.id)} // Use the document ID here
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </>
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
            <dialog id="my_modal_4" className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <div className="flex items-center justify-between p-2">
                        <h3 className="font-semibold text-xl">{editId ? 'Edit Returns' : 'Add Returns'}</h3>
                        <button className="btn btn-square bg-red-500 text-white" onClick={() => (document.getElementById('my_modal_4') as HTMLDialogElement)?.close()}>X</button>
                    </div>
                    <div>
                        <form method="dialog">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Date</span>
                                </label>
                                <input type="date" className="input input-bordered" value={returnsDate} onChange={(e) => setReturnsDate(e.target.value)} required />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Returns No.</span>
                                </label>
                                <input type="number" placeholder="No." className="input input-bordered" value={returnsNo} onChange={(e) => setReturnsNo(e.target.value)} required />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Amount</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="LKR."
                                    className="input input-bordered"
                                    value={returnsAmount}
                                    onChange={(e) => setReturnsAmount(e.target.value)}
                                    required
                                    disabled={!!editId} // Disable when editing
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Reason</span>
                                </label>
                                <input type="text" placeholder='example: "Damage Item"' className="input input-bordered" value={returnsReason} onChange={(e) => setReturnsReason(e.target.value)} required />
                            </div>
                            <div className='mt-5 mb-5'>
                                <input type="checkbox" id="confirm" name="confirm" value="confirm" required onChange={(e) => setReturnsConfirm(e.target.checked)}/>
                                <label htmlFor="confirm" className='text-sm ml-2'>I confirm that the above details are correct and I am responsible for the returns.</label>
                                <p className='text-sm font-semibold text-red-500'>
                                    Note: Once you submit the returns, the amount will be deducted from the supplier's total due and this action cannot be undone!
                                </p>
                            </div>
                            <div className="text-center">
                                {editId ? (
                                    <button type="button" onClick={updateReturns} className="btn mt-5 w-32 bg-blue-500 text-black hover:bg-blue-600 hover:text-white">Update</button>
                                ) : (
                                    <button type="button" onClick={addReturns} className="btn mt-5 w-32 bg-green-500 text-black hover:bg-blue-600 hover:text-white">Submit</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default SupplierReturns;
