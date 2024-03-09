import React from 'react';

const Dashboard = () => {
    return (
        <div id='dashboard'>
            <div className='flex mb-2'>
                <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            </div>
            <div className='bg-gray-700 p-10' style={{width: '100%', height: '50%', borderRadius: '5px'}}>
                <h1 className="text-3xl font-semibold mb-4">Total Due for all Suppliers:</h1>
                <h1 className="text-3xl font-semibold mb-4">Total Purchases in the last 30 Days:</h1>
            </div>
        </div>
    );
};

export default Dashboard;