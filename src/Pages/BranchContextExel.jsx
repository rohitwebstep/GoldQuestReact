import React, { createContext, useState } from 'react';

// Create the context
export const BranchContextExel = createContext();

// Create the provider component
export const BranchProviderExel = ({ children }) => {
  const [branch_id, setBranchId] = useState(null); // State to hold the branch_id
  const [service_id, setServiceId] = useState()
  const [application_id, setApplicationId] = useState(null)
  return (
    <BranchContextExel.Provider value={{ branch_id, setBranchId,setServiceId,service_id,application_id,setApplicationId}}>
      {children}
    </BranchContextExel.Provider>
  );
};
