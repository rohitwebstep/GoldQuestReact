import React, { useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;

  // Memoize the navigate function
  const memoizedNavigate = useCallback(navigate, [navigate]);

  useEffect(() => {
    const checkAuthentication = async () => {
      const branchData = localStorage.getItem("branch");
      const storedToken = localStorage.getItem("branch_token");

      // If no branch or token data in localStorage, redirect to login
      if (!branchData || !storedToken) {
        redirectToLogin();
        return;
      }

      setIsBranchApiLoading(true);

      let adminData;
      try {
        adminData = JSON.parse(branchData);
      } catch (error) {
        console.error('Error parsing JSON from localStorage:', error);
        redirectToLogin();
        return;
      }

      const payLoad = {
        branch_id: adminData.branch_id,
        _token: storedToken,
        ...(adminData?.type === "sub_user" && { sub_user_id: adminData.id }),
      };

      try {
        const response = await axios.post(`${API_URL}/branch/verify-branch-login`, payLoad);

        if (response.data.status) {
          // Check if there's a new token and update localStorage if it exists
          const newToken = response.data._token || response.data.token;
          if (newToken) {
            localStorage.setItem("branch_token", newToken); // Update the token in localStorage
          }

          setLoading(false); // If session is valid, stop loading
        } else {
          // Session expired or invalid token, handle accordingly
          handleSessionExpired(response.data.message);
        }
      } catch (error) {
        console.error('Error validating login:', error);
        handleLoginError();
      } finally {
        setIsBranchApiLoading(false);
      }
    };

    const redirectToLogin = () => {
      memoizedNavigate(`/customer-login?email=${encodeURIComponent(branchEmail)}`);
    };

    const handleSessionExpired = (message) => {
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
        handleLoginError();
      }
    };

    const handleLoginError = () => {
      localStorage.removeItem("branch");
      localStorage.removeItem("branch_token");
      setIsBranchApiLoading(false);
      redirectToLogin();
    };

    checkAuthentication();
  }, [API_URL, branchEmail, setLoading, setIsBranchApiLoading, memoizedNavigate]);

  if (loading) {
    return <Loader />;
  }

  return children;
};

export default Customer;
