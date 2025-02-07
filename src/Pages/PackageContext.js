import React, { createContext, useState, useContext, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext

const PackageContext = createContext();

export const usePackage = () => useContext(PackageContext);

export const PackageProvider = ({ children }) => {
    const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [packageList, setPackageList] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [error, setError] = useState(null);
    const API_URL = useApi();

    const updatePackageList = (updatedPackages) => {
        setPackageList(updatedPackages);
    };

    const editPackage = (pkg) => {
        setSelectedPackage(pkg);
    };

    const clearSelectedPackage = () => {
        setSelectedPackage(null);
    };
    const fetchData = useCallback(() => {
        setIsApiLoading(true);
        setLoading(true);
        setError(null);

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        const queryParams = new URLSearchParams({
            admin_id: admin_id || '',
            _token: storedToken || ''
        }).toString();

        fetch(`${API_URL}/package/list?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(async (response) => {
                const result = await response.json(); // Parse JSON from the response

                // Check for invalid token in the response
                if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        // Redirect to admin login page
                        window.location.href = "/admin-login"; // Replace with your login route
                    });
                    return; // Exit early after redirect
                }

                const newToken = result._token || result.token; // Use result.token if result._token is not available
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Replace the old token with the new one
                }

                // Handle unsuccessful response status
                if (!response.ok) {
                    Swal.fire({
                        title: 'Error!',
                        text: `An error occurred: ${result.message || response.statusText}`,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                    throw new Error('Network response was not ok');
                }

                return result; // Proceed with result
            })
            .then((data) => {
                // If token is valid, proceed to set data
                setData(data.packages || []);
            })
            .catch((error) => {
                console.error('Fetch error:', error);
                setError('Failed to load data');
            })
            .finally(() => {
                setLoading(false);
                setIsApiLoading(false);

            });
    }, [API_URL]);


    return (
        <PackageContext.Provider
            value={{
                packageList,
                selectedPackage,
                updatePackageList,
                editPackage,
                clearSelectedPackage,
                data, setData, loading, setLoading, fetchData, setError, error
            }}
        >
            {children}
        </PackageContext.Provider>
    );
};
