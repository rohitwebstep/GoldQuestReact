import React from 'react';
import { RiLoginCircleFill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { useApi } from '../ApiContext';
import Swal from 'sweetalert2';
const Logout = () => {

  const API_URL = useApi();
  const navigate = useNavigate();
  const handleLogout = async () => {
    const storedAdminData = localStorage.getItem("admin");
    const storedToken = localStorage.getItem("_token");
  
    if (!storedAdminData || !storedToken) {
      Swal.fire({
        title: "Error",
        text: "No active session found. Redirecting to login.",
        icon: "warning",
        confirmButtonText: "Ok",
      }).then(() => {
        navigate("/admin-login");
      });
      return;
    }
  
    Swal.fire({
      title: "Processing...",
      text: "Please wait while we log you out.",
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
    });
  
    try {
      const response = await fetch(
        `${API_URL}/admin/logout?admin_id=${JSON.parse(storedAdminData)?.id}&_token=${storedToken}`,
        {
          method: "GET",
        }
      );
  
      const responseData = await response.json(); // Parse response as JSON
  
      if (responseData.message && responseData.message.toLowerCase().includes("invalid") && responseData.message.toLowerCase().includes("token")) {
        Swal.fire({
          title: "Session Expired",
          text: "Your session has expired. Please log in again.",
          icon: "warning",
          confirmButtonText: "Ok",
        }).then(() => {
          // Redirect to admin login page
          window.location.href = "/admin-login"; // Replace with your login route
        });
        return;
      }
  
      if (!response.ok) {
        throw new Error(responseData.message || "Logout failed");
      }
  
      // Clear local storage on successful logout
      localStorage.removeItem("admin");
      localStorage.removeItem("_token");
  
      Swal.fire({
        title: "Success",
        text: "You have been logged out successfully.",
        icon: "success",
        confirmButtonText: "Ok",
      }).then(() => {
        navigate("/admin-login");
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
  };
  


  return (
    <button onClick={handleLogout} className='flex gap-1 items-center text-white ms-2 mt-3 md:mt-0'>
      <RiLoginCircleFill className="h-6 w-6 mr-1 text-white-600" />
      Logout
    </button>
  );
};

export default Logout;
