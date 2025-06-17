import React, { useEffect } from 'react';
import { useApiCall } from '../ApiCallContext';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader

const Admin = ({ children }) => {

  const { isApiLoading, loading, checkAuthentication } = useApiCall();

  useEffect(() => {
    if (!isApiLoading) {
      checkAuthentication();
    }
  }, []);

  if (loading) {
    return (
      <>
        <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
      </>
    );
  }

  return children;
};

export default Admin;
