'use client';
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/app/firebase/config';
import { collection, setDoc, doc, addDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import router from 'next/router';

const AddEmployees = () => {
    const [user] = useAuthState(auth);
    
    //Employee States
    const [employeeName, setEmployeeName] = useState('');
    const [employeeContactNo, setEmployeeContactNo] = useState('');
    const [employeeAddress, setEmployeeAddress] = useState('');
    const [employeeBasicSalary, setEmployeeBasicSalary] = useState('');
    const [employeeSalaryBalance, setEmployeeSalaryBalance] = useState('');

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault(); // Prevent default form submission behavior

        try {
            // Add supplier information to Firestore
            const docRef = await addDoc(collection(firestore, `users/${user?.uid}/Employees`), {
                employeeName: employeeName,
                employeeContactNo: employeeContactNo,
                employeeAddress: employeeAddress,
                employeeBasicSalary: employeeBasicSalary,
                employeeSalaryBalance: employeeSalaryBalance
                
            });

            if (docRef) {
                console.log('Employee added with ID:', docRef.id);
                // Reset form fields after successful signup
                setEmployeeName('');
                setEmployeeContactNo('');
                setEmployeeAddress('');
                setEmployeeBasicSalary('');
                setEmployeeSalaryBalance('');
                console.log('Employee information added to Firestore.');
                // Redirect to suppliers page
                router.push('/employees');
            } else {
                console.error('Error: Supplier creation response is undefined.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

  return (
    <div>
            <h1 className='text-3xl font-bold text-center'>Add Supplier</h1>
            <form className='mt-4'>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Employee Name</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='name' name='name' value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Employee Contact No.</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='companyName' name='companyName' value={employeeContactNo} onChange={(e) => setEmployeeContactNo(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Employee Address</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='contactNo' name='contactNo' value={employeeAddress} onChange={(e) => setEmployeeAddress(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Employee Basic Salary</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='email' name='email' value={employeeBasicSalary} onChange={(e) => setEmployeeBasicSalary(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Employee Salary Balance</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='payables' name='payables' value={employeeSalaryBalance} onChange={(e) => setEmployeeSalaryBalance(e.target.value)} />
                </div>
                <button onClick={handleSubmit} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5' type='submit'>Add Supplier</button>
            </form>
        </div>
  )
}

export default AddEmployees;
