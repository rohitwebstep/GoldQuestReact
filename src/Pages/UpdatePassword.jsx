import React from 'react'
import UpdatePasswordForm from './UpdatePasswordForm'

const UpdatePassword = () => {
  return (
    <>
      <div className="p-4 my-10">
      <h2 className='md:text-4xl text-center py-6 text-2xl font-bold'>Update Password</h2>
        <div className='md:w-6/12 bg-white p-8 shadow-md rounded-md m-auto '>
          <div className="text-center">
            
          <UpdatePasswordForm/>
          </div>
        </div>
      </div>
     
    </>
  )
}

export default UpdatePassword