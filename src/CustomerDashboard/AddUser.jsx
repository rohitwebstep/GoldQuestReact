import React from 'react';
import AddUserForm from './AddUserForm';

const AddUser = () => {
  return (
    <div className="pt-10">
      <h2 className="text-center md:text-4xl text-2xl font-bold pb-8 pt-7 md:pb-4">
        Create Subuser
      </h2>
      <div className="md:grid grid-cols-2 gap-8 m-12">
        <div className="bg-white shadow-md rounded-md p-6">
          <AddUserForm />
        </div>
        <div className="bg-white shadow-md rounded-md p-3">
        </div>
      </div>
    </div>
  );
};

export default AddUser;
