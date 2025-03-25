import React from 'react'
import { FaEnvelope } from 'react-icons/fa'
import { Link, Outlet } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa6'

const PasswordReset = () => {
    return (
        <>
            <div className=" bg-white md:w-5/12 m-auto shadow-md rounded-sm p-5 translate-y-2/4 ">
                <div className="text-center">
                    <FaEnvelope className='text-8xl text-center w-full' />
                    <h2 className='text-3xl font-bold py-4'>Password Reset</h2>
                    <p className='text-lg'>We Sent a Code to yourgmail@gmail.com</p>
                    <ul className='flex gap-6 justify-center py-6'>
                        <li className='h-14 w-14 rounded-lg border border-green-400'></li>
                        <li className='h-14 w-14  rounded-lg border border-green-400'></li>
                        <li className='h-14 w-14  rounded-lg border border-green-400'></li>
                        <li className='h-14 w-14  rounded-lg border border-green-400'></li>
                    </ul>
                </div>
               <Link to='/newpassword'> <button type="button " className='w-full bg-[#3e76a5] rounded-md p-3 hover:bg-[#3e76a5] text-white'>Continue</button></Link>
                <p className='text-center py-4'>Didn,t Recieve the email? <span className='text-blue-400'>Click to resend</span></p>
                <span className='flex justify-center items-center gap-4 text-blue-400'>
                <FaArrowLeft />
                <Link to='/customerlogin'>Back to Login</Link>
              </span>                
            </div>
            <Outlet/>
        </>
    )
}

export default PasswordReset
