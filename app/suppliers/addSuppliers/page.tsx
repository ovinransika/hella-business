'use client';
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '@/app/firebase/config';
import { collection, setDoc, doc, addDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const AddSuppliers = () => {
    const [user] = useAuthState(auth);

    //Supplier States
    const [supplierName, setSupplierName] = useState('');
    const [supplierCompanyName, setSupplierCompanyName] = useState('');
    const [supplierContactNo, setSupplierContactNo] = useState('');
    const [supplierEmail, setSupplierEmail] = useState('');
    const [supplierTotalDue, setSupplierTotalDue] = useState('');

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault(); // Prevent default form submission behavior

        try {
            if(supplierName === '' || supplierCompanyName === '' || supplierContactNo === '' || supplierEmail === '' || supplierTotalDue === ''){
                alert('Please fill all the fields');
                return;
            }else{
                // Add supplier information to Firestore
            const docRef = await addDoc(collection(firestore, `users/${user?.uid}/Suppliers`), {
                name: supplierName,
                companyName: supplierCompanyName,
                contactNo: supplierContactNo,
                email: supplierEmail,
                totalDue: supplierTotalDue
            });

            if (docRef) {
                console.log('Supplier added with ID:', docRef.id);
                // Reset form fields after successful signup
                setSupplierName('');
                setSupplierCompanyName('');
                setSupplierContactNo('');
                setSupplierEmail('');
                setSupplierTotalDue('');
                console.log('Supplier information added to Firestore.');
                // Go to suppliers page
                window.location.href = '/suppliers';
            } else {
                console.error('Error: Supplier creation response is undefined.');
            }
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
                        <span className="label-text">Supplier Name</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='name' name='name' value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Company Name</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='companyName' name='companyName' value={supplierCompanyName} onChange={(e) => setSupplierCompanyName(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Contact No.</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='contactNo' name='contactNo' value={supplierContactNo} onChange={(e) => setSupplierContactNo(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Email</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='email' name='email' value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier's Current Payables</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='payables' name='payables' value={supplierTotalDue} onChange={(e) => setSupplierTotalDue(e.target.value)} />
                </div>
                <button onClick={handleSubmit} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5' type='submit'>Add Supplier</button>
            </form>
        </div>
    );
};

export default AddSuppliers;
