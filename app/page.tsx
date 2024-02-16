'use client';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import Link from 'next/link';
import { auth, firestore } from '@/app/firebase/config';
import { getDoc, doc } from 'firebase/firestore';

export default function Home() {
    const [user, loading, error] = useAuthState(auth);
    const [username, setUsername] = useState('');

    useEffect(() => {
        if (user) {
            const getUserProfile = async () => {
                try {
                    // Fetch user profile from Firestore
                    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                    if (userDoc.exists()) {
                        // If user profile exists, set the username state
                        setUsername(userDoc.data().username);
                    } else {
                        // If user profile does not exist, set the username state to a default value or handle accordingly
                        setUsername('Guest');
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            };

            getUserProfile();
        }
    }, [user]);

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            console.log('User signed out successfully.');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error.message}</p>;
    }

    if (user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
                        Welcome to Hella Business
                    </h1>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">
                        A simple, easy-to-use business management tool.
                    </p>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">
                        Welcome, {username}!
                    </p>
                    <button
                        onClick={handleSignOut}
                        className="mt-8 px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-gray-200">
                    Welcome to Hella Business
                </h1>
                <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
                    A simple, easy-to-use business management tool.
                </p>
                <div className="flex items-center justify-center mt-8 gap-5 font-semibold">
                    <Link href="/signin"
                        className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                    >
                        Sign In
                    </Link>
                    <Link href="/signup"
                        className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600"
                    >
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}
