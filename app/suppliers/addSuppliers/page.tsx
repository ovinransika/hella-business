'use client'
import React, { useState } from 'react';
import { auth, firestore } from '@/app/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const AddSuppliers = () => {
    const [user] = useAuthState(auth);

    // Supplier States
    const [supplierName, setSupplierName] = useState('');
    const [supplierCompanyName, setSupplierCompanyName] = useState('');
    const [supplierContactNo, setSupplierContactNo] = useState('');
    const [supplierEmail, setSupplierEmail] = useState('');
    const [supplierTotalDue, setSupplierTotalDue] = useState('');
    const [cmbSupplier, setCmbSupplier] = useState(false);

    // Error States
    const [nameError, setNameError] = useState('');
    const [companyNameError, setCompanyNameError] = useState('');
    const [contactNoError, setContactNoError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [totalDueError, setTotalDueError] = useState('');

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Reset previous errors
        setNameError('');
        setCompanyNameError('');
        setContactNoError('');
        setEmailError('');
        setTotalDueError('');

        let hasError = false;

        // Validation
        if (supplierName.trim() === '') {
            setNameError('*Supplier name is required');
            hasError = true;
        }

        if (supplierCompanyName.trim() === '') {
            setCompanyNameError('*Company name is required');
            hasError = true;
        }

        if (supplierContactNo.trim() === '') {
            setContactNoError('*Contact number is required');
            hasError = true;
        }

        if (supplierEmail.trim() === '') {
            setEmailError('*Email is required');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        try {
            // Add supplier information to Firestore
            const docRef = await addDoc(collection(firestore, `users/${user?.uid}/Suppliers`), {
                name: supplierName,
                companyName: supplierCompanyName,
                contactNo: supplierContactNo,
                email: supplierEmail,
                totalDue: '0',
                totalReturns: '0',
                totalDamage: '0',
                cmbSupplier: cmbSupplier,
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
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div>
            <h1 className='text-3xl font-bold text-center'>Add Supplier</h1>
            <form className='mt-4' onSubmit={handleSubmit}>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Name</span>
                    </div>
                    <input
                        type='text'
                        className="input input-bordered input-primary w-full max-w-xs"
                        id='name'
                        name='name'
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                    />
                    {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Company Name</span>
                    </div>
                    <input
                        type='text'
                        className="input input-bordered input-primary w-full max-w-xs"
                        id='companyName'
                        name='companyName'
                        value={supplierCompanyName}
                        onChange={(e) => setSupplierCompanyName(e.target.value)}
                    />
                    {companyNameError && <p className="text-red-500 text-xs">{companyNameError}</p>}
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Contact No.</span>
                    </div>
                    <input
                        type='text'
                        className="input input-bordered input-primary w-full max-w-xs"
                        id='contactNo'
                        name='contactNo'
                        value={supplierContactNo}
                        onChange={(e) => setSupplierContactNo(e.target.value)}
                    />
                    {contactNoError && <p className="text-red-500 text-xs">{contactNoError}</p>}
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Email</span>
                    </div>
                    <input
                        type='text'
                        className="input input-bordered input-primary w-full max-w-xs"
                        id='email'
                        name='email'
                        value={supplierEmail}
                        onChange={(e) => setSupplierEmail(e.target.value)}
                    />
                    {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
                </div>
                <div className='mb-4'>
                    <div className='flex gap-5'>
                        <input type="radio" id="type1" name="type" value="type1" onClick={() => setCmbSupplier(false)} />
                        <label htmlFor="type1">Friday Supplier</label>

                        <input type="radio" id="type2" name="type" value="type2" onClick={() => setCmbSupplier(true)}/>
                        <label htmlFor="type2">Colombo Supplier</label>
                    </div>
                    {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
                </div>
                <button
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5'
                    type='submit'
                >
                    Add Supplier
                </button>
            </form>
        </div>
    );
};

export default AddSuppliers;
