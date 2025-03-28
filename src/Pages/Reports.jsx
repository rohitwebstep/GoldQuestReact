import React from "react";
import ReportsList from "./ReportsList";
const Reports = () => {

  return (
    <>
      <div className=" py-4 md:py-16">
        <h2 className='md:text-4xl text-2xl font-bold pb-8 md:pb-4 text-center'>Report Summary</h2>
        <div className="">
          <ReportsList />
        </div>
      </div>
    </>
  )
}

export default Reports