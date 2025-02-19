import React from 'react'
import Swal from 'sweetalert2';
const Callback = () => {
    const runCallback = () => {
        // Fetch branch data from localStorage and check if it's valid
        const branchData = localStorage.getItem("branch");
    
        // Check if branch data exists and can be parsed correctly
        if (!branchData) {
            Swal.fire({
                title: 'Error',
                text: 'Branch data is missing. Please log in again.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return;
        }
    
        // Parse branch data and handle errors
        let parsedBranchData;
        try {
            parsedBranchData = JSON.parse(branchData);
        } catch (e) {
            Swal.fire({
                title: 'Error',
                text: 'There was an issue with your session data. Please log in again.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return;
        }
    
        const branch_id = parsedBranchData?.branch_id;
        const branch_token = localStorage.getItem("branch_token");
    
    
        // Ensure the required data is available before making the request
        if (!branch_id || !branch_token) {
            Swal.fire({
                title: 'Error',
                text: 'Branch ID or Token is missing. Please log in again.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return;
        }
    
        // Prepare the headers and body for the request
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
    
        const raw = JSON.stringify({
            "branch_id": branch_id,
            "_token": branch_token,
            ...(parsedBranchData?.type === "sub_user" && { sub_user_id: parsedBranchData.id }),

        });
      
    
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
    
        // Show loading Swal while processing
        Swal.fire({
            title: "Processing...",
            text: "Please wait while we process your request.",
            icon: "info",
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading(); // Display loading spinner
            }
        });
    
        // Start fetch request
    
        fetch("https://api.goldquestglobal.in/branch/callback-request", requestOptions)
            .then((response) => {
    
                // If the response is not okay, process the error
                if (!response.ok) {
                    return response.json().then((result) => {
                        const errorMessage = result.message || 'An unexpected error occurred.';
    
                        // Check for invalid token in the error message
                        if (
                            errorMessage.toLowerCase().includes("invalid") &&
                            errorMessage.toLowerCase().includes("token")
                        ) {
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                window.location.href = `/customer-login?email=${encodeURIComponent(parsedBranchData?.email)}`;
                            });
                        } else {
                            // Display a generic error message from API
                            Swal.fire({
                                title: 'Error',
                                text: result.message || 'An unexpected error occurred. Please try again.',
                                icon: 'error',
                                confirmButtonText: 'OK',
                            });
                        }
                        throw new Error(errorMessage); // Stop further processing
                    });
                }
    
                // Log the response if OK

                
                // Convert the response to JSON
                return response.json();
            })
            .then((result) => {
                // Log the parsed result
    
                Swal.close(); // Close loading spinner
    
                // Check if the response contains a new token and store it
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("branch_token", newToken);
                }
    
                // Show success message
                Swal.fire({
                    title: "Success",
                    text: result.message || "Callback request was successful.",
                    icon: "success",
                    confirmButtonText: "OK"
                });
            })
            .catch((error) => {
                // Log any errors caught
                console.error("Error caught in fetch:", error);
    
                // Close loading Swal and handle error
                Swal.close();
    
                // Display a generic error message
                Swal.fire({
                    title: 'Error',
                    text: 'An error occurred while processing your request. Please try again later.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            });
    };
    




    return (
        <>
            <button className='p-3 bg-white rounded-md text-green-green-500 ' onClick={runCallback}>Request Callback</button>

        </>
    )
}

export default Callback