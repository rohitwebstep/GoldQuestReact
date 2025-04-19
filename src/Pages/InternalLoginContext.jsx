import React, { createContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';
import { useApi } from '../ApiContext';
const LoginContext = createContext();

export const LoginProvider = ({ children }) => {
    const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext
    const [roles, setRoles] = useState([]);
    const [group, setGroup] = useState([]);
    const [editAdmin, setEditAdmin] = useState(false);
    const API_URL = useApi();
    const [formData, setFormData] = useState({
        employee_id: "",
        name: "",
        mobile: "",
        email: "",
        password: "",
        role: "",
        is_report_generator:'',
        is_qc_verifier:'',
        service_ids: "", // This will store the selected groups in an array

    });
    const [data, setData] = useState([]); // State to store the response data
    const [loading, setLoading] = useState(true); // Loading state
    const [parsedServiceGroups, setParsedServiceGroups] = useState([]);


    const handleEditAdmin = (selectedAdmin) => {
        setEditAdmin(true);

        // Check if service_ids exists and is a string, then parse it into an array
        const parsedServiceGroups = (() => {
            try {
                // Check if service_ids is a comma-separated string
                if (selectedAdmin.service_ids && typeof selectedAdmin.service_ids === 'string') {
                    return selectedAdmin.service_ids.split(',').map(id => id.trim()).filter(Boolean); // Ensure it's an array of strings
                }
                return [];
            } catch (error) {
                console.error("Failed to parse service_ids:", error);
                return [];
            }
        })();

        setFormData({
            employee_id: selectedAdmin.emp_id || '',
            name: selectedAdmin.name || '',
            mobile: selectedAdmin.mobile || '',
            email: selectedAdmin.email || '',
            password: selectedAdmin.password || '', // This may be an empty string or undefined, depending on your form structure
            role: selectedAdmin.role || '',
            id: selectedAdmin.id || '',
            is_report_generator: selectedAdmin.is_report_generator || '',
            is_qc_verifier: selectedAdmin.is_qc_verifier || '',
            status: selectedAdmin.status || '',
            service_ids: selectedAdmin.role !== "admin" ? parsedServiceGroups.join(',') : '', // Store as a comma-separated string for the service_ids
        });
    };

    const fetchAdminOptions = async () => {
        setIsApiLoading(true);
        setLoading(true);
        try {
            const storedAdminData = localStorage.getItem("admin");
            const storedToken = localStorage.getItem("_token");
    
            if (!storedAdminData || !storedToken) {
                handleSessionExpiry();
                return;
            }
    
            const adminData = JSON.parse(storedAdminData);
            const admin_id = adminData?.id;
    
            // Prepare request parameters
            const params = new URLSearchParams({
                admin_id,
                _token: storedToken,
            });
    
            // Fetch admin roles and permissions using fetch API
            const response = await fetch(`${API_URL}/admin/create-listing?${params.toString()}`, {
                method: 'GET', // GET request
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            // Check if response is successful (status 200)
            if (!response.ok) {
                const errorData = await response.json(); // Get the error message from the response
    
                // Show error message from the response
                const errorMessage = errorData?.message || 'An unexpected error occurred';
                const errorDetail = errorData?.err?.message || errorMessage;  // Check for specific error details
    
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorDetail,
                });
    
                return; // Stop execution if there's an error
            }
    
            // If response is successful, parse the data
            const data = await response.json();
            
            // If the response has a status of false, show the error message
            if (data.status === false) {
                const errorMessage = data?.message || 'An unexpected error occurred';
                const errorDetail = data?.err?.message || errorMessage;
    
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorDetail,
                });
    
                return;
            }
    
            // Handle successful response
            const adminRoles = data.data;
            setRoles(adminRoles.roles.roles || []);
            setGroup(adminRoles.services?.filter(Boolean) || []);
            setData(adminRoles?.admins || []); // Set the admin data
    
            // Update token if provided
            const newToken = data?._token || data?.token;
            if (newToken) localStorage.setItem("_token", newToken);
    
        } catch (error) {
            console.error("Error fetching data:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'An unexpected error occurred while fetching the data.',
            });
        } finally {
            setIsApiLoading(false);
            setLoading(false);
        }
    };
    

    const handleSessionExpiry = () => {
        Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
        }).then(() => {
            localStorage.removeItem("admin");
            localStorage.removeItem("_token");
            window.location.href = "/admin-login"; // Replace with navigate if using React Router
        });
    };


    return (
        <LoginContext.Provider value={{
            data, loading, formData, roles, group, setFormData, setEditAdmin, fetchAdminOptions, handleEditAdmin, editAdmin, setRoles, setGroup, parsedServiceGroups
        }}>
            {children}
        </LoginContext.Provider>
    );
};

export default LoginContext;
