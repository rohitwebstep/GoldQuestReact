import React, { createContext, useState, useContext, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext
const ServiceContext = createContext();

export const ServiceProvider = ({ children }) => {
    const API_URL = useApi();
    const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext

    const [selectedService, setSelectedService] = useState(null);// Store Service list
    const [ServiceList, setServiceList] = useState([]); // Store package list
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const editService = (pkg) => {
        setSelectedService(pkg);
    };

    const updateServiceList = (newList) => {
        setServiceList(newList);
    };
    const fetchData = useCallback(async () => {
        try {
            setIsApiLoading(true);
            setLoading(true);
            setError(null);

            const adminData = JSON.parse(localStorage.getItem("admin"));
            const storedToken = localStorage.getItem("_token");

            // Check if admin ID and token are available before proceeding
            if (!adminData?.id || !storedToken) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Admin ID or token is missing.',
                    icon: 'error',
                    confirmButtonText: 'Ok',
                });
                return;
            }

            const queryParams = new URLSearchParams({
                admin_id: adminData.id,
                _token: storedToken,
            }).toString();

            const res = await fetch(`${API_URL}/service/list?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await res.json();

            // Check if response is OK and if result status is truthy
            if (!res.ok || !result.status) {
                
                const errorMessage = result.message || 'An error occurred';
                if (result.message && result.message.toLowerCase().includes("invalid token")) {
                    // Handle invalid token
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        window.location.href = "/admin-login"; // Redirect to login page
                    });
                    return; // Exit early after redirect
                }

                // For other error messages
                Swal.fire({
                    title: 'Error!',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'Ok',
                });
                setError(errorMessage);
                return;
            }

            // Handle new token (if available)
            const newToken = result._token || result.token;
            if (newToken) {
                localStorage.setItem('_token', newToken);
            }

            // Process and set data (simplified mapping function)
            const processedData = result.services?.map((item, index) => ({
                ...item,
                index: index + 1,
            })) || [];

            setData(processedData);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setIsApiLoading(false);
            
        }
    }, []);



    return (
        <ServiceContext.Provider value={{selectedService, setSelectedService, editService, ServiceList, updateServiceList, fetchData, loading, setData, data, error, setError }}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useService = () => useContext(ServiceContext);
