'use client';
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/app/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import SupplierReturns from "@/app/components/supplierReturns/page";
import SupplierTransactions from "@/app/components/supplierTransactions/page";
import SupplierTransactions2 from "@/app/components/supplierTransactions2/page";

export default function SupplierDetails({ params }: { params: { supplierId: string } }) {
    const [user] = useAuthState(auth);
    const [supplierDetails, setSupplierDetails] = useState<any | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editedSupplier, setEditedSupplier] = useState<any>({
        name: "",
        companyName: "",
        contactNo: "",
        email: "",
        bankAccountName: "",
        banckAccountNo: "",
        bankName: "",
        bankBranch: "",
        totalDue: 0,
    });

    useEffect(() => {
        if (user) {
            getSupplier();
        }
    }, [user]);

    const getSupplier = async () => {
        if (!user) return;

        // Fetch specific supplier from Firestore based on supplierId
        const supplierRef = doc(firestore, `users/${user.uid}/Suppliers/${params.supplierId}`);
        const supplierDoc = await getDoc(supplierRef);

        if (supplierDoc.exists()) {
            setSupplierDetails(supplierDoc.data());
        } else {
            console.log("Supplier not found");
        }
    };

    const handleEditModalOpen = () => {
        setEditedSupplier(supplierDetails); // Set initial values for editing
        setEditModalOpen(true);
    };

    const handleEditModalClose = () => {
        setEditModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedSupplier((prev: any) => ({
            ...prev,
            [name]: value,
        }));
    };

    const saveEditedSupplier = async () => {
        try {
            if (!user || !supplierDetails) return;

            const supplierRef = doc(firestore, `users/${user.uid}/Suppliers/${params.supplierId}`);
            await setDoc(supplierRef, editedSupplier, { merge: true });

            // Close the modal and refresh supplier details
            setEditModalOpen(false);
            getSupplier();
        } catch (error) {
            console.error("Error updating supplier:", error);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    if (!supplierDetails) {
        return <div>No supplier details found.</div>;
    }

    return (
        <>
            <h1 className="font-semibold text-2xl text-center">Supplier Stats Of {supplierDetails.name}</h1>
            <div className="mt-9">
                <div className="flex gap-5 mb-2">
                    <h1 className="font-semibold text-2xl">Supplier Details</h1>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                        onClick={handleEditModalOpen}
                    >
                        Edit Supplier
                    </button>
                </div>
                <table className="table-auto border-collapse border border-black">
                    <tbody>
                        <tr className="border border-black">
                            <td className="px-4 py-2 border border-black">Name</td>
                            <td className="px-4 py-2 border border-black font-semibold text-blue-600">{supplierDetails.name}</td>
                        </tr>
                        <tr className="border border-black">
                            <td className="px-4 py-2 border border-black">Company Name</td>
                            <td className="px-4 py-2 border border-black font-semibold text-blue-600">{supplierDetails.companyName}</td>
                        </tr>
                        <tr className="border border-black">
                            <td className="px-4 py-2 border border-black">Contact No</td>
                            <td className="px-4 py-2 border border-black font-semibold text-blue-600">{supplierDetails.contactNo}</td>
                        </tr>
                        <tr className="border border-black">
                            <td className="px-4 py-2 border border-black">Email</td>
                            <td className="px-4 py-2 border border-black font-semibold text-blue-600">{supplierDetails.email}</td>
                        </tr>
                        <tr className="border border-black">
                            <td className="px-4 py-2 border border-black">Total Due</td>
                            <td className="px-4 py-2 border border-black font-bold text-red-600">LKR {supplierDetails.totalDue}</td>
                        </tr>
                        <tr className="border border-black">
                            <td className="px-4 py-2 border border-black">Bank Account Name</td>
                            <td className="px-4 py-2 border border-black font-semibold text-blue-600">{supplierDetails?.bankAccountName}</td>
                        </tr>
                        <tr className="border border-black">
                            <td className="px-4 py-2 border border-black">Bank Account No</td>
                            <td className="px-4 py-2 border border-black font-semibold text-blue-600">{supplierDetails?.bankAccountNo}</td>
                        </tr>
                        <tr className="border border-black">
                            <td className="px-4 py-2 border border-black">Bank Name</td>
                            <td className="px-4 py-2 border border-black font-semibold text-blue-600">{supplierDetails?.bankName}</td>
                        </tr>
                        <tr className="border border-black">
                            <td className="px-4 py-2 border border-black">Bank Branch</td>
                            <td className="px-4 py-2 border border-black font-semibold text-blue-600">{supplierDetails?.bankBranch}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div>
                <SupplierTransactions2 params={{ supplierId: params.supplierId }} />
            </div>

            {editModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center">      
                    <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                    <div style={{width: '35%'}} className="z-50 bg-gray-800 p-8 rounded">
                        <div className="flex items-center justify-between p-2">
                            <h2 className="text-xl font-semibold mb-4">Edit Supplier</h2>
                            <button className="btn btn-square bg-red-500 text-white" onClick={() => setEditModalOpen(false)}>X</button>
                        </div>
                        <div className="flex gap-14">
                        <div>
                            <div className="mb-4">
                                <label htmlFor="name" className="block font-medium">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={editedSupplier.name}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="companyName" className="block font-medium">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    id="companyName"
                                    name="companyName"
                                    value={editedSupplier.companyName}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="contactNo" className="block font-medium">
                                    Contact No
                                </label>
                                <input
                                    type="text"
                                    id="contactNo"
                                    name="contactNo"
                                    value={editedSupplier.contactNo}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="email" className="block font-medium">
                                    Email
                                </label>
                                <input
                                    type="text"
                                    id="email"
                                    name="email"
                                    value={editedSupplier.email}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="totalDue" className="block font-medium">
                                    Total Due
                                </label>
                                <input
                                    type="number"
                                    id="totalDue"
                                    name="totalDue"
                                    value={editedSupplier.totalDue}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="mb-4">
                                <label htmlFor="bankAccountName" className="block font-medium">
                                    Bank Account Name
                                </label>
                                <input
                                    type="text"
                                    id="bankAccountName"
                                    name="bankAccountName"
                                    value={editedSupplier.bankAccountName}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="bankAccountNo" className="block font-medium">
                                    Bank Account No
                                </label>
                                <input
                                    type="text"
                                    id="bankAccountNo"
                                    name="bankAccountNo"
                                    value={editedSupplier.bankAccountNo}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="bankName" className="block font-medium">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    id="bankName"
                                    name="bankName"
                                    value={editedSupplier.bankName}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="bankBranch" className="block font-medium">
                                    Bank Branch
                                </label>
                                <input
                                    type="text"
                                    id="bankBranch"
                                    name="bankBranch"
                                    value={editedSupplier.bankBranch}
                                    onChange={handleInputChange}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleEditModalClose}
                                className="px-4 py-2 bg-red-500 text-white rounded-md mr-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEditedSupplier}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
