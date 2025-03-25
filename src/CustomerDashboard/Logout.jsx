import React, { useEffect } from 'react';
import { RiLoginCircleFill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { useApi } from '../ApiContext';
import Swal from 'sweetalert2';

const Logout = () => {
    const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;
    const storedBranchData = JSON.parse(localStorage.getItem("branch"));
    const branch_id = JSON.parse(localStorage.getItem("branch"))?.branch_id;
    const sub_user_id = JSON.parse(localStorage.getItem("branch"))?.id;
    const API_URL = useApi();
    const navigate = useNavigate();
    const handleLogout = async () => {
        const storedToken = localStorage.getItem("branch_token");

        try {
            // If branch data and token exist, log the user out
            if (storedBranchData && storedToken) {
                // Show a confirmation dialog before proceeding with logout
                const confirmation = await Swal.fire({
                    title: "Are you sure?",
                    text: "You are about to log out. Do you want to continue?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, log me out",
                    cancelButtonText: "No, cancel",
                });

                const payLoad = {
                    branch_id:branch_id,
                    _token: storedToken,
                    ...(storedBranchData?.type === "sub_user" && { sub_user_id: sub_user_id }),
                  };
                  
                  // Zet het object om naar een query string
                  const queryString = new URLSearchParams(payLoad).toString();
                  
                if (confirmation.isConfirmed) {
                    // Send a request to your API to log out the user
                    const response = await fetch(`${API_URL}/branch/logout?${queryString}`, {
                        method: 'GET',
                    });

                    if (!response.ok) {
                        throw new Error('Logout failed');
                    }

                    // Clear localStorage after successful logout
                    localStorage.removeItem("branch");
                    localStorage.removeItem("branch_token");

                    // Redirect the user to the login page
                    navigate(`/customer-login?email=${encodeURIComponent(branchEmail)}`);
                }
            } else {
                // If no data found, directly navigate to the login page
                navigate(`/customer-login?email=${encodeURIComponent(branchEmail)}`);
            }
        } catch (error) {
            console.error('Error during logout:', error);
            Swal.fire({
                title: "Error",
                text: error.message || "An error occurred during logout. Please try again.",
                icon: "error",
                confirmButtonText: "Ok",
            });
        }
    };

    return (
        <button onClick={handleLogout} className='flex gap-2 text-white items-center ms-2'>
            <RiLoginCircleFill className="h-6 w-6 mr-1 " />
            Logout
        </button>
    );
};

export default Logout;
