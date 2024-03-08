'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/app/firebase/config';
import { getDocs, collection } from 'firebase/firestore';
import Link from 'next/link';


const Employees = () => {
  const [user] = useAuthState(auth);
    const [employees, setEmployees] = useState<any[]>([]); // Define type as any[] for simplicity

    useEffect(() => {
        if (user) {
            getEmployees();
        }
    }, [user]);

    const getEmployees = async () => {
      if (!user) return; // Ensure user is not null

      // Fetch all Employees from Firestore
      const employeeCollection = collection(firestore, `users/${user.uid}/Employees`);
      const employeeSnapshot = await getDocs(employeeCollection);
      const employeeList = employeeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));
      setEmployees(employeeList);
  };

  return (
    <div className="container mx-auto mt-8">
            <div className='flex mb-2'>
                <h1 className="text-3xl font-bold mb-4">Employees</h1>
                <div className='ml-auto'>
                    <Link href="/employees/addEmployees">
                        <button className="ml-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add Employee</button>
                    </Link>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee Contact No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee Basic Salary
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Salary Balance
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-black">
                        {employees.map(employee => (
                            <tr key={employee.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                <Link href="/suppliers/[id]" as={`/employees/${employee.id}`}>
                                    <div className="text-blue-500 hover:underline">{employee.employeeName}</div>
                                </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{employee.employeeContactNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{employee.employeeAddress}</td>
                                <td className="px-6 py-4 whitespace-nowrap">LKR {employee.employeeBasicSalary}</td>
                                <td className="px-6 py-4 whitespace-nowrap">LKR {employee.employeeSalaryBalance}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
  )
}

export default Employees;
