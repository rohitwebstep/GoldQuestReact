import React from 'react'
import InternalLoginList from './InternalLoginList';
import InternalLoginForm from './InternalLoginForm';
const InternalLogin = () => {
  return (
    <>
      <div className=" py-8 md:py-16">
        <h2 className='md:text-4xl text-2xl font-bold pb-4 md:pb-4 text-center'>Internal Login</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 md:p-4 gap-5 md:m-7  m-3">
          <div className=" md:col-span-3 bg-white shadow-md rounded-md p-3 md:p-10 " >
          <InternalLoginForm/>
          </div>
          <div className="md:col-span-3 bg-white shadow-md rounded-md  p-3 ">
       
            <InternalLoginList/>
      
          </div>
        </div>
      </div>
    </>
  )
}

export default InternalLogin