'use client';
import React, { useState } from 'react';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import Link from 'next/link';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [signInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault(); // Prevent default form submission behavior

        try {
            // Sign in with email and password
            const res = await signInWithEmailAndPassword(email, password);

            // Reset form fields after successful sign-in
            setEmail('');
            setPassword('');

            // If sign-in is successful
            if (res && res.user) {
                // Redirect user to another page or update UI as needed
                console.log('User:'+ res.user.uid +' signed in successfully.');
                window.location.href = '/';
            } else {
                // Handle unexpected case where res or res.user is null
                setError('Sign in failed. Please check your credentials.');
            }

        } catch (error) {
            console.error('Error:', error);
            setError('Sign in failed. Please check your credentials.'); // Set error message
        }
    };

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Sign In</h2>
                </div>
                {error && 
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                }
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="hidden" name="remember" value="true" />
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className='mb-5'>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-800"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-gray-800"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign In
                        </button>
                    </div>
                    <div>
                        <Link href="/forgotPassword">
                            <p className='text-center text-indigo-600 hover:text-indigo-500 cursor-pointer'>
                                Forgot your password?
                            </p>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignIn;
