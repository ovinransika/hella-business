'use client';
import React, { useState } from 'react';

const AddSuppliers = () => {
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [contactNo, setContactNo] = useState('');
    const [email, setEmail] = useState('');
    const [payables, setPayables] = useState('0');

    return (
        <div>
            <h1 className='text-3xl font-bold text-center'>Add Supplier</h1>
            <form className='mt-4'>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Name</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='name' name='name' value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Company Name</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='companyName' name='companyName' value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Contact No.</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='contactNo' name='contactNo' value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier Email</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className='mb-4'>
                    <div className="label">
                        <span className="label-text">Supplier's Current Payables</span>
                    </div>
                    <input type='text' className="input input-bordered input-primary w-full max-w-xs" id='payables' name='payables' value={payables} onChange={(e) => setPayables(e.target.value)} />
                </div>
                <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5' type='submit'>Add Supplier</button>
            </form>
        </div>
    );
};

export default AddSuppliers;
