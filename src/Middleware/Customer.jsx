import React, { useEffect } from 'react';

import { useApiCall } from '../ApiCallContext.jsx';

const Customer = ({ children }) => {
  const { isBranchApiLoading, checkBranchAuthentication } = useApiCall();


  // Memoize the navigate function

  useEffect(() => {

    if (!isBranchApiLoading) {
      checkBranchAuthentication();
    }

  }, []);



  return children;
};

export default Customer;
