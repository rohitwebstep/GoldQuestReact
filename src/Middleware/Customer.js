import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { LoaderContext } from '../LoaderContext';
import Loader from '../Loader';
import { useApi } from '../ApiContext';
import { useApiCall } from '../ApiCallContext';
import Swal from 'sweetalert2';

const Customer = ({ children }) => {
  const { loading, setLoading } = useContext(LoaderContext);
  const { setIsBranchApiLoading } = useApiCall();
  
  const API_URL = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;

  useEffect(() => {
    const checkAuthentication = async () => {
      const storedAdminData = localStorage.getItem("branch");
      const storedToken = localStorage.getItem("branch_token");

      // If no branch or token data in localStorage, redirect to login
      if (!storedAdminData || !storedToken) {
        redirectToLogin();
        return;
      }

      setIsBranchApiLoading(true);

      let adminData;
      try {
        adminData = JSON.parse(storedAdminData);
      } catch (error) {
        console.error('Error parsing JSON from localStorage:', error);
        redirectToLogin();
        return;
      }

      try {
        // Send verification request to the server
        const response = await axios.post(`${API_URL}/branch/verify-branch-login`, {
          branch_id: adminData.id,
          _token: storedToken,
        });

        if (response.data.status) {
          setLoading(false);  // If session is valid, stop loading
        } else {
          // Session expired or invalid token, handle accordingly
          handleSessionExpired(response.data.message);
        }
      } catch (error) {
        console.error('Error validating login:', error);
        handleLoginError();
      }finally{
        setIsBranchApiLoading(false);
      }
    };

    const redirectToLogin = () => {
      navigate(`/customer-login?email=${encodeURIComponent(branchEmail)}`);
    };

    const handleSessionExpired = (message) => {
      // Check if the message contains an invalid token
      if (message && message.toLowerCase().includes("invalid") && message.toLowerCase().includes("token")) {
        Swal.fire({
          title: "Session Expired",
          text: "Your session has expired. Please log in again.",
          icon: "warning",
          confirmButtonText: "Ok",
        }).then(() => {
          redirectToLogin();
        });
      } else {
        handleLoginError();  // Handle any other errors
      }
    };

    const handleLoginError = () => {
      // Remove session data from localStorage and redirect to login
      localStorage.removeItem("branch");
      localStorage.removeItem("branch_token");
      setIsBranchApiLoading(false);
      redirectToLogin();
    };

    checkAuthentication();
  }, [navigate, setLoading, setIsBranchApiLoading, API_URL, branchEmail]);

  // If the component is loading, show a loader
  if (loading) {
    return <Loader />;
  }

  // Otherwise, render the children (actual component content)
  return children;
};

export default Customer;
