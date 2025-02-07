import React from 'react';
import { RiLoginCircleFill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { useApi } from '../ApiContext';

const Logout = () => {
    const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;

    const API_URL = useApi();
    const navigate = useNavigate();
    const handleLogout = async () => {
        const storedBranchData = localStorage.getItem("branch");
        const storedToken = localStorage.getItem("branch_token");

        try {
            const response = await fetch(`${API_URL}/branch/logout?branch_id=${JSON.parse(storedBranchData)?.id}&_token=${storedToken}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            localStorage.removeItem("branch");
            localStorage.removeItem("branch_token");


            navigate(`/customer-login?email=${encodeURIComponent(branchEmail)}`);
        } catch (error) {
            console.error('Error during logout:', error);
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
