import React, { useEffect } from 'react';
import { RiLoginCircleFill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { useApi } from '../ApiContext';
import Swal from 'sweetalert2';

const Logout = () => {
  const API_URL = useApi();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const storedAdminData = localStorage.getItem("admin");
    const storedCustomerData = localStorage.getItem("customer");
    const storedToken = localStorage.getItem("_token");

    // Determine if the user is logged in as admin or customer
    let logoutApiUrl = '';
    let storedData = null;
    let redirectUrl = '/admin-login';  // Default redirect to admin login

    if (storedAdminData && storedToken) {
      // User is an admin
      logoutApiUrl = `${API_URL}/admin/logout?admin_id=${JSON.parse(storedAdminData)?.id}&_token=${storedToken}`;
      storedData = storedAdminData;
      redirectUrl = '/admin-login';
    } 

    // If no active session found
    if (!storedData || !storedToken) {
      Swal.fire({
        title: "Error",
        text: "No active session found. Redirecting to login.",
        icon: "warning",
        confirmButtonText: "Ok",
      }).then(() => {
        navigate(redirectUrl);  // Redirect to login based on user type
      });
      return;
    }

    // Confirmation dialog before proceeding with logout
    const confirmation = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to log out. Do you want to continue?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, log me out",
      cancelButtonText: "No, cancel",
    });

    // If the user confirmed, proceed with the logout process
    if (confirmation.isConfirmed) {
      Swal.fire({
        title: "Processing...",
        text: "Please wait while we log you out.",
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
      });

      try {
        const response = await fetch(logoutApiUrl, { method: "GET" });

        const responseData = await response.json(); // Parse response as JSON

        // Check if session is expired (invalid token)
        if (responseData.message && responseData.message.toLowerCase().includes("invalid") && responseData.message.toLowerCase().includes("token")) {
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            window.location.href = redirectUrl;  // Redirect to login page
          });
          return;
        }

        if (!response.ok) {
          throw new Error(responseData.message || "Logout failed");
        }

        // Clear local storage on successful logout
        localStorage.removeItem("admin");
        localStorage.removeItem("customer");
        localStorage.removeItem("_token");

        Swal.fire({
          title: "Success",
          text: "You have been logged out successfully.",
          icon: "success",
          confirmButtonText: "Ok",
        }).then(() => {
          navigate(redirectUrl);  // Redirect to login page based on user type
        });
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: error.message || "An error occurred during logout. Please try again.",
          icon: "error",
          confirmButtonText: "Ok",
        });
        console.error("Error during logout:", error);
      }
    } else {
      // If the user cancels, do nothing
    }
  };

  return (
    <button onClick={handleLogout} className='flex gap-1 z-50 items-center text-white ms-2 md:mt-0'>
      <RiLoginCircleFill className="h-6 w-6 mr-1 text-white-600" />
      Logout
    </button>
  );
};

export default Logout;
