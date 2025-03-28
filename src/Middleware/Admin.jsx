import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useApi } from '../ApiContext';
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';
const Admin = ({ children }) => {

  const { isApiLoading, setIsApiLoading } = useApiCall();
  const [loading,setLoading] = useState(false)
  const API_URL = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const checkAuthentication = async () => {
    const storedAdminData = localStorage.getItem("admin");
    const storedToken = localStorage.getItem("_token");
  
    // If no admin or token data in localStorage, clear session and redirect to login
    if (!storedAdminData || !storedToken) {
      redirectToLogin("No active session found. Please log in again.");
      return;
    }
  
    setIsApiLoading(true);
  
    let adminData;
    try {
      adminData = JSON.parse(storedAdminData);
    } catch (error) {
      console.error("Error parsing JSON from localStorage:", error);
      Swal.fire({
        title: "Authentication Error",
        text: "Error parsing admin data from localStorage.",
        icon: "error",
        confirmButtonText: "Ok",
      }).then(() => redirectToLogin());
      return;
    }
  
    try {
      // Send the verification request to the server
      const response = await axios.post(`${API_URL}/admin/verify-admin-login`, {
        admin_id: adminData.id,
        _token: storedToken,
      });
  
      const responseData = response.data;
  
      if (responseData.status) {
        // Check if a new token is returned and update localStorage
        const newToken = responseData._token || responseData.token;
        if (newToken) {
          localStorage.setItem("_token", newToken); // Store the new token in localStorage
        }
        
        setLoading(false);
      } else {
        const errorMessage = responseData.message || "An unknown error occurred";
  
        if (
          errorMessage.toLowerCase().includes("invalid") &&
          errorMessage.toLowerCase().includes("token")
        ) {
          // Custom session expired message and redirection to login
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            redirectToLogin("Your session has expired. Please log in again.");
          });
          return;
        }
  
        // Handle other login verification errors
        Swal.fire({
          title: "Login Verification Failed",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "Ok",
        }).then(() => redirectToLogin(errorMessage));
      }
    } catch (error) {
      console.error("Error validating login:", error.response?.data?.message || error.message);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Error validating login.",
        icon: "error",
        confirmButtonText: "Ok",
      }).then(() => redirectToLogin(error.response?.data?.message || "Error validating login."));
    } finally {
      setIsApiLoading(false); // Make sure to reset the loading state
    }
  };
  

  // Redirect to login page and clear session data
  const redirectToLogin = (errorMessage = "Please log in again.") => {
    localStorage.removeItem("admin");
    localStorage.removeItem("_token");
    navigate("/admin-login", { state: { from: location, errorMessage }, replace: true });
  };

  useEffect(() => {
    setIsApiLoading(true); // Ensure the loading state is set before the checkAuthentication is called
    checkAuthentication(); // Ensure it runs only once on mount
  }, []); // Empty dependency array to ensure it only runs once after the component mounts





  if (loading) {
    return (
      <>
        <Loader />
      </>
    );
  }

  return children;
};

export default Admin;
