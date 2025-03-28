import React from 'react';
import BulkUploadForm from './BulkUploadForm';

const BulkUpload = () => {
  return (
    <>
      <h2 className='text-center md:text-4xl text-2xl font-bold pb-8 pt-14 md:pb-4'>
        Bulk Upload
      </h2>

      <div className="md:grid grid-cols-2 md:mx-14 md:py-14 gap-8 m-4 md:m-0">
        <div className="bg-white shadow-md rounded-md p-6 mb-4">
          <BulkUploadForm />
        </div>
        <div className="bg-white shadow-md rounded-md overflow-hidden">
        </div>
      </div>
    </>
  );
};

export default BulkUpload;
