import React, { createContext, useState, useContext } from 'react';
import Swal from 'sweetalert2';
import { useData } from './DataContext';
import { useApi } from '../ApiContext';
const BranchEditContext = createContext();


export const BranchEditProvider = ({ children }) => {
    const API_URL = useApi();
    const { toggleAccordion } = useData()
    const [branchEditData, setBranchEditData] = useState({
        id: '',
        name: '',
        email: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBranchEditData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleEditBranch = async (e) => {
        e.preventDefault();

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!branchEditData.id || !branchEditData.name || !branchEditData.email) {

            Swal.fire(
                'Error!',
                'Missing required fields: Branch ID, Name, Email',
                'error'
            );
            return;
        }

        const raw = JSON.stringify({
            id: branchEditData.id,
            name: branchEditData.name,
            email: branchEditData.email,
            admin_id: admin_id,
            _token: storedToken
        });

        const requestOptions = {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: raw,
            redirect: "follow"
        };

        try {
            const response = await fetch(`${API_URL}/branch/update`, requestOptions);
            const result = response.json();
            const newToken = result._token || result.token;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }
           
            if (!response.ok) {
                if (response.message && response.message.toLowerCase().includes("invalid") && response.message.toLowerCase().includes("token")) {
                    Swal.fire({
                      title: "Session Expired",
                      text: "Your session has expired. Please log in again.",
                      icon: "warning",
                      confirmButtonText: "Ok",
                    }).then(() => {
                      // Redirect to admin login page
                      window.location.href = "/admin-login"; // Replace with your login route
                    });
                  }
                return response.text().then(text => {
                    const errorData = JSON.parse(text);
                    Swal.fire(
                        'Error!',
                        `An error occurred: ${errorData.message}`,
                        'error'
                    );
                });
            }
            Swal.fire(
                'Success!',
                'Branch updated successfully.',
                'success'
            );
            toggleAccordion();
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    };

    return (
        <BranchEditContext.Provider value={{ branchEditData, setBranchEditData, handleInputChange, handleEditBranch }}>
            {children}
        </BranchEditContext.Provider>
    );
};


export const useEditBranch = () => useContext(BranchEditContext);
