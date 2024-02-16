import React from 'react'
import Link from 'next/link';

const Suppliers = () => {


    const suppliers = [
        { id: 1, name: 'John Doe', companyName: '', contactNo: '+94123456789', email: 'john@example.com', payables: '0'},
        { id: 2, name: 'Jane Smith', companyName: '', contactNo: '+94123456789', email: 'jane@example.com', payables: '0' },
        { id: 3, name: 'Alice Johnson', companyName: '', contactNo: '+94123456789', email: 'alice@example.com', payables: '0' },
        // Add more suppliers as needed
    ];

  return (
    <div className="container mx-auto mt-8">
        <div className='flex mb-2'>
            <h1 className="text-3xl font-bold mb-4">Suppliers</h1>
            <div className='ml-auto'>
                <Link href="/suppliers/addSuppliers">
                    <button className="ml-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add Supplier</button>
                </Link>
                <Link href="/suppliers/newOrder">
                    <button className="ml-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">New Order</button>
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
                            Payables
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-black">
                    {suppliers.map(supplier => (
                        <tr key={supplier.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap"></td>
                            <td className="px-6 py-4 whitespace-nowrap">{supplier.contactNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{supplier.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{supplier.payables}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default Suppliers;
