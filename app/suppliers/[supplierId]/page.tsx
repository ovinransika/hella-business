'use client';
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/app/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import SupplierReturns from "@/app/components/supplierReturns/page";

export default function SupplierDetails({ params }: { params: { supplierId: string } }) {
    const [user] = useAuthState(auth);
    const [supplierDetails, setSupplierDetails] = useState<any | null>(null);

    //supplier orders
    const ordersData = [
        { date: '2023-01-01', orderBillNo: 1, orderTotal: 100, orderSummary: {itemName: 'Broom', itemQty: '2', itemRate: '10', itemTotal: '20'} },
        { date: '2023-02-15', orderBillNo: 2, orderTotal: 150,},
        { date: '2023-03-20', orderBillNo: 3, orderTotal: 200,},
    ];

    //Supplier Transactions
    const transactionsData = [
        { trasactionDate: '2023-01-01', transactionNo: 1, transactionAmount: 100, transactionType: 'Credit' },
        { trasactionDate: '2023-02-15', transactionNo: 2, transactionAmount: 150, transactionType: 'Debit' },
        { trasactionDate: '2023-03-20', transactionNo: 3, transactionAmount: 200, transactionType: 'Credit' },
    ];

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
                <table className="table-auto border-collapse border border-black">
                    <caption>
                        <tr>
                            <p>Supplier Details</p>
                        </tr>
                    </caption>
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
                            <td className="px-4 py-2 border border-black font-semibold text-blue-600">LKR {supplierDetails.totalDue}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div>
                <SupplierReturns params={{
                    supplierId: params.supplierId
                }} />
            </div>
            
            <div style={{
                borderRadius: '10px',
            }} className="mt-10 bg-blue-700 p-10">
            <table className="w-full">
                <caption>Supplier Orders</caption>
                <thead>
                    <tr>
                        <th className="px-4 py-2 border border-black">Order Date</th>
                        <th className="px-4 py-2 border border-black">Order Bill No.</th>
                        <th className="px-4 py-2 border border-black">Order Total</th>
                        <th className="px-4 py-2 border border-black">Order Summary</th>
                    </tr>
                </thead>
                <tbody>
                    {ordersData.map((item, index) => (
                        <tr key={index} className="border border-black">
                            <td className="px-4 py-2 border border-black">{item.date}</td>
                            <td className="px-4 py-2 border border-black">{item.orderBillNo}</td>
                            <td className="px-4 py-2 border border-black">{item.orderTotal}</td>
                            <td className="px-4 py-2 border border-black">View</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
            <div style={{
                borderRadius: '10px',
            }} className="mt-10 bg-green-700 p-10">
            <table className="w-full">
                <caption>Supplier Transactions</caption>
                <thead>
                    <tr>
                        <th className="px-4 py-2 border border-black">Date</th>
                        <th className="px-4 py-2 border border-black">Transaction No.</th>
                        <th className="px-4 py-2 border border-black">Amount</th>
                        <th className="px-4 py-2 border border-black">Type</th>
                    </tr>
                </thead>
                <tbody>
                    {transactionsData.map((item, index) => (
                        <tr key={index} className="border border-black">
                            <td className="px-4 py-2 border border-black">{item.trasactionDate}</td>
                            <td className="px-4 py-2 border border-black">{item.transactionNo}</td>
                            <td className="px-4 py-2 border border-black">{item.transactionAmount}</td>
                            <td className="px-4 py-2 border border-black">{item.transactionType}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
            
        </>
    );
}
