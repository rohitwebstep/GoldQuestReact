import React from 'react'
import InvoiceTable from './InvoiceTable'
import Notification from './Notification'
import active_client from '../Images/Icon_Order.png'
const Main2 = () => {
    return (
        <>
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex gap-3 w-10/12 md:w-full m-auto items-center justify-between bg-white px-2 py-6 rounded-md shadow-md">
                        <div className='w-4/12'><img src={active_client} alt="Active Clients" /></div>
                        <div className='w-8/12'>
                            <h1 className='text-5xl font-bold text-black'>375</h1>
                            <p className='text-base font-medium py-1'>Active Clients</p>
                            <span className='text-sm'>4% (30 days)</span>
                        </div>
                    </div>
                    <div className="flex gap-5 w-10/12 md:w-full m-auto items-center justify-between bg-white px-2 py-6 rounded-md shadow-md">
                        <div className='w-4/12'><img src={active_client} alt="Final Reports" /></div>
                        <div className='w-8/12'>
                            <h1 className='text-5xl font-bold text-black'>75</h1>
                            <p className='text-base font-medium py-1'>Today Final Reports</p>
                            <span className='text-sm'>4% (30 days)</span>
                        </div>
                    </div>

                    <div className="flex gap-5 w-10/12 md:w-full m-auto items-center justify-between bg-white px-2 py-6 rounded-md shadow-md">
                        <div className='w-4/12'><img src={active_client} alt="QC Pending" /></div>
                        <div className='w-8/12'>
                            <h1 className='text-5xl font-bold text-black'>115</h1>
                            <p className='text-base font-medium py-1'>Today QC Pending</p>
                            <span className='text-sm'>4% (30 days)</span>
                        </div>
                    </div>
                    <div className="flex gap-5 w-10/12 md:w-full m-auto items-center justify-between bg-white px-2 py-6 rounded-md shadow-md ">
                        <div className='w-4/12'><img src={active_client} alt="TAT Delay" /></div>
                        <div className='w-8/12'>
                            <h1 className='text-5xl font-bold text-black'>35</h1>
                            <p className='text-base font-medium py-1'>TAT Delay</p>
                            <span className='text-sm'>4% (30 days)</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4">
                <div className="md:col-span-3 bg-white rounded-md shadow-md p-2">
                    <InvoiceTable />
                </div>
                <div className="md:col-span-3 bg-white rounded-md shadow-md p-2">
                    <Notification />
                </div>
            </div>
            <div className="p-4">
                <div className="bg-white rounded-md shadow-md p-2">
                </div>
            </div>
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-white rounded-md shadow-md p-2">
                    </div>
                    <div className="md:col-span-1 bg-white  rounded-md shadow-md p-2">
                    </div>
                </div>
            </div>
        </>)
}

export default Main2