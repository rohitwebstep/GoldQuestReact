import React from 'react'
import CustomEditor from './CustomEditor'

const EmailTemplate = () => {
  return (
    <>
    <div className="md:py-16 py-5">
    <h2 className='md:text-4xl text-2xl font-bold pb-8 md:pb-4 text-center'>Email Templates</h2>
    <div className="bg-white shadow-md rounded-md md:w-6/12 m-auto my-5 p-6">
    <form action="">
    <div className="mb-5">
     <label htmlFor="" className='block'> Module Name</label>
    <select name="" id="" className="w-full border p-3 outline-none rounded-md  mt-2">
      <option value="1">Modile 1</option>
      <option value="2">Modile 2</option>
      <option value="3">Modile 3</option>

    </select>
    </div>
    <div className="mb-5">
    <CustomEditor/>
    </div>
    </form>    
    </div>
    </div>
    </>
  )
}

export default EmailTemplate
