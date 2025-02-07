import React from 'react'
import ExelTrackerForm from './ExelTrackerForm'

const ExelTracker = () => {

  return (
    <>
      <div className="m-4 py-3 md:py-16">
        <div className="text-center">
          <h2 className='md:text-4xl text-2xl font-bold pb-8 md:pb-4'>Download Excel Tracker</h2>
        </div>
        <div className="bg-white shadow-md p-6 md:w-7/12 m-auto rounded-md">
        <ExelTrackerForm/>
        </div>
      </div>
    </>
  )
}

export default ExelTracker