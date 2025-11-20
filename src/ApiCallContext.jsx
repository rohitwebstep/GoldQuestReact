import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useApi } from './ApiContext';

const ApiCallContext = createContext();

// Custom hook to access API context
export const useApiCall = () => {
    return useContext(ApiCallContext);
};

export const ApiCallProvider = ({ children }) => {

    // ✅ State variables inside the component
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [isBranchApiLoading, setIsBranchApiLoading] = useState(false);
    const [loading, setLoading] = useState(false); // ✅ Used in checkAuthentication
    const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;

    // ✅ Function to handle authentication check
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
            const response = await axios.post(`https://api.goldquestglobal.in/admin/verify-admin-login`, {
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

                if (errorMessage.toLowerCase().includes("invalid") && errorMessage.toLowerCase().includes("token")) {
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
            setIsApiLoading(false);
        }
    };

    // ✅ Corrected function for redirecting to login
    const redirectToLogin = (errorMessage = "Please log in again.") => {
        localStorage.removeItem("admin");
        localStorage.removeItem("_token");
        window.location.href = "/admin-login";
    };


    const checkBranchAuthentication = async () => {
        const branchData = localStorage.getItem("branch");
        const storedToken = localStorage.getItem("branch_token");

        // If no branch data → redirect immediately
        if (!branchData) {
            redirectBranchToLogin();
            return;
        }

        setIsBranchApiLoading(true);

        let adminData;
        try {
            adminData = JSON.parse(branchData);
            console.log("✅ Parsed branch data:", adminData);
        } catch (error) {
            console.error("❌ Failed to parse branch data", error);
            setIsBranchApiLoading(false);
            redirectBranchToLogin();
            return;
        }

        const payLoad = {
            branch_id: adminData?.branch_id,
            _token: storedToken,

            ...(adminData?.type === "additional_user" && {
                additional_customer_id: adminData.customer_id,
            }),

            ...(adminData?.type === "sub_user" && {
                sub_user_id: adminData.id,
            }),
        };

        try {
            const response = await axios.post(
                `https://api.goldquestglobal.in/branch/verify-branch-login`,
                payLoad
            );

            console.log("📩 API Response:", response.data);

            // If API returns status FALSE → redirect
            if (!response.data.status) {
                console.warn("⚠️ Authentication failed:", response.data.message);
                redirectBranchToLogin();
                handleSessionExpired(response.data.message);
                localStorage.removeItem("branch");
                localStorage.removeItem("branch_token");
                return;
            }

            // If login success → update token if provided
            const newToken = response.data._token || response.data.token;
            if (newToken) {
                localStorage.setItem("branch_token", newToken);
            }

        } catch (error) {
            console.error("🚨 API request failed:", error);

            // If API itself fails → redirect (token expired/server error);
            localStorage.removeItem("branch");
            localStorage.removeItem("branch_token");
            redirectBranchToLogin()

        } finally {
            setIsBranchApiLoading(false);
            console.log("🏁 Authentication check finished.\n");
        }
    };




    const redirectBranchToLogin = () => {
        if (branchEmail) {

            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
        }
        window.location.href = `/customer-login`;

    };

    const handleSessionExpired = (message) => {
        if (message && message.toLowerCase().includes("invalid") && message.toLowerCase().includes("token")) {
            Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again.",
                icon: "warning",
                confirmButtonText: "Ok",
            }).then(() => {
                redirectBranchToLogin();
            });
        } else {
            handleLoginError();
        }
    };

    const handleLoginError = () => {
        localStorage.removeItem("branch");
        localStorage.removeItem("branch_token");
        setIsBranchApiLoading(false);
        redirectBranchToLogin();
    };


    return (
        <ApiCallContext.Provider value={{
            isApiLoading, setIsApiLoading,
            loading, setLoading,
            isBranchApiLoading, setIsBranchApiLoading,
            checkAuthentication, checkBranchAuthentication
        }}>
            {children}
        </ApiCallContext.Provider>
    );
};
