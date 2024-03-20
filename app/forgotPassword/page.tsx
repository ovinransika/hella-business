'use client';
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '@/app/firebase/config';

const ForgotPassword = () => {

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault(); // Prevent default form submission behavior

        try {
            // Send a password reset email
            await sendPasswordResetEmail(auth, email);

            // Redirect user to another page or update UI as needed
            console.log('Password reset email sent to: ' + email);
            window.location.href = '/signin'; // Redirect to sign-in page
        } catch (error) {
            console.error('Error:', error);
            setError('Password reset failed. Please check your email address.'); // Set error message
        }
    };

  return (
    <div>
      <h1 className='mt-6 text-center text-3xl font-bold text-white mb-5'>Reset Password</h1>
      <div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <h2>Enter your email address to reset your password</h2>
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
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword;
