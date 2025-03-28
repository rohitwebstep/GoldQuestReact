import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import LoginContext from './InternalLoginContext';
import SelectSearch from 'react-select-search';
import 'react-select-search/style.css';
import { useApiCall } from '../ApiCallContext';

const InternalLoginForm = () => {
    const { formData, setEditAdmin, setFormData, editAdmin, fetchAdminOptions, roles, group, loading } = useContext(LoginContext)
    const { isApiLoading, setIsApiLoading } = useApiCall();
    const [error, setError] = useState({});

    const handleChange = (event) => {
        const { name, value } = event.target;

        // Remove spaces from employee_id and convert to uppercase
        const updatedValue = name === 'employee_id' ? value.replace(/\s+/g, '').toUpperCase() : value;

        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));
    };

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");


    const Validate = () => {
        const errors = {};

        // Validate employee_id: no spaces allowed
        if (!formData.employee_id) {
            errors.employee_id = 'This field is required';
        } else if (/\s/.test(formData.employee_id)) {
            errors.employee_id = 'Employee ID should not contain spaces';
        } else if (/[^a-zA-Z0-9-]/.test(formData.employee_id)) {
            errors.employee_id = 'Employee ID should only contain letters, numbers, and hyphens';
        }

        // Validate mobile: no spaces and exactly 10 digits
        if (!formData.mobile) {
            errors.mobile = 'This field is required';
        } else if (/\s/.test(formData.mobile)) {
            errors.mobile = 'Mobile number should not contain spaces';
        } else if (!/^\d{10}$/.test(formData.mobile)) {
            errors.mobile = 'Mobile number must be exactly 10 digits';
        }

        // Validate other fields
        if (!formData.name) errors.name = 'This field is required';
        if (!formData.email) errors.email = 'This field is required';

        // Validate password length
        if (!formData.password) {
            errors.password = 'This field is required';
        } else if (formData.password.length < 8 || formData.password.length > 10) {
            errors.password = 'Password must be between 8 and 10 characters long';
        }


        if (!formData.role) errors.role = 'This field is required';

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let validateError = {};

        if (!editAdmin) {
            validateError = Validate(); // Perform validation only if not editing
        }

        // Check if there are any validation errors
        if (Object.keys(validateError).length === 0) {
            setIsApiLoading(true); // Start the loading state

            setError({}); // Reset errors if no validation errors

            const requestformData = {
                admin_id: admin_id,
                _token: storedToken,
                ...formData,
                send_mail: 1,
                ...(editAdmin && { id: formData.id, status: formData.status }) // Include ID and status if editing
            };

            // Show processing alert while making the request
            Swal.fire({
                title: 'Processing...',
                text: 'Please wait while we create the admin.',
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                // Make the request using fetch
                const response = await fetch(editAdmin
                    ? 'https://api.goldquestglobal.in/admin/update'
                    : 'https://api.goldquestglobal.in/admin/create', {
                    method: editAdmin ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestformData),
                });

                const result = await response.json(); // Parse the response as JSON

                // Handle session expiration (invalid token)
                if (result.message && result.message.toLowerCase().includes("invalid token")) {
                    Swal.fire({
                        title: 'Session Expired',
                        text: 'Your session has expired. Please log in again.',
                        icon: 'warning',
                        confirmButtonText: 'Ok',
                    }).then(() => {
                        window.location.href = '/admin-login'; // Redirect to login
                    });
                    return; // Stop execution if session expired
                }

                // Handle token refresh if the response contains a new token
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem('branch_token', newToken); // Update the local storage token
                }

                // Check the response status and handle success or failure
                if (result.status) {
                    // Success: Show success message
                    Swal.fire({
                        title: 'Success!',
                        text: result.message || 'Admin created successfully.',
                        icon: 'success',
                        confirmButtonText: 'Ok',
                    });

                    // Reset form data after successful submission
                    setFormData({
                        employee_id: '',
                        name: '',
                        mobile: '',
                        email: '',
                        password: '',
                        role: '',
                        id: '',
                        status: '',
                        service_ids: "",
                    });
                    fetchAdminOptions();
                    setEditAdmin(false)
                } else {
                    // Failure: Show error message
                    Swal.fire({
                        title: 'Error!',
                        text: result.message || 'Failed to create admin.',
                        icon: 'error',
                        confirmButtonText: 'Ok',
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                // Optionally, handle the error with a general failure message
                Swal.fire({
                    title: 'Error!',
                    text: 'An unexpected error occurred.',
                    icon: 'error',
                    confirmButtonText: 'Ok',
                });
            } finally {
                // Ensure loading state is turned off regardless of success or failure
                setIsApiLoading(false);
            }
        } else {
            // Show validation errors if any
            setError(validateError);
            setIsApiLoading(false); // Stop loading state on validation failure
        }
    };





    const emptyForm = () => {
        setEditAdmin(false)
        setFormData({
            employee_id: '',
            name: '',
            mobile: '',
            email: '',
            password: '',
            role: '',
            id: '',
            status: '',
            service_ids: "",
        });
        setError({});
        setEditAdmin(false);
    }
    const options = [
        { value: 'select_all', name: 'Select All / Deselect All' }, // Add the "Select All" option
        ...group.map((item) => ({ value: item.id, name: item.title })), // Map groups to SelectSearch options
    ];

    const handleServiceGroupChange = (selected) => {
        if (selected.includes('select_all')) {
            // Toggle Select All / Deselect All
            if (formData.service_ids?.split(',').length === group.length) {
                // If all selected, deselect all (clear the string)
                setFormData((prev) => ({ ...prev, service_ids: "" }));
            } else {
                // Otherwise, select all (join all IDs into a comma-separated string)
                const allIds = group.map(item => item.id).join(',');
                setFormData((prev) => ({ ...prev, service_ids: allIds }));
            }
        } else {
            // Remove 'select_all' from the selected array and update with selected options as a comma-separated string
            const updatedSelection = selected.filter(id => id !== 'select_all').join(',');
            setFormData((prev) => ({ ...prev, service_ids: updatedSelection }));
        }
    };



    return (
        <>
            <form action="" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="text-gray-500" htmlFor="employee_id">Employee ID: <span className='text-red-500'>*</span></label>
                    <input
                        type="text"
                        name="employee_id"
                        id="employee_id"
                        className="border w-full rounded-md p-2 mt-2 uppercase"
                        onChange={handleChange}
                        disabled={editAdmin}
                        value={formData.employee_id.toUpperCase()}
                    />
                    {error.employee_id && <p className='text-red-500'>{error.employee_id}</p>}
                </div>
                <div className="mb-4">
                    <label className="text-gray-500" htmlFor="Employee-name">Employee Name: <span className='text-red-500'>*</span></label>
                    <input
                        type="text"
                        name="name"
                        id="Employee-name"
                        className="border w-full rounded-md p-2 mt-2"
                        onChange={handleChange}
                        value={formData.name}
                    />
                    {error.name && <p className='text-red-500'>{error.name}</p>}
                </div>
                <div className="mb-4">
                    <label className="text-gray-500" htmlFor="mobile-mobile">Employee Mobile: <span className='text-red-500'>*</span></label>
                    <input
                        type="number"
                        name="mobile"
                        id="mobile-mobile"
                        className="border w-full rounded-md p-2 mt-2"
                        onChange={handleChange}
                        value={formData.mobile}

                    />
                    {error.mobile && <p className='text-red-500'>{error.mobile}</p>}
                </div>
                <div className="mb-4">
                    <label className="text-gray-500" htmlFor="emailid">Email: <span className='text-red-500'>*</span></label>
                    <input
                        type="email"
                        name="email"
                        id="emailid"
                        className="border w-full rounded-md p-2 mt-2"
                        onChange={handleChange}
                        value={formData.email}
                    />
                    {error.email && <p className='text-red-500'>{error.email}</p>}
                </div>
                {!editAdmin && (
                    <div className="mb-4">
                        <label className="text-gray-500" htmlFor="password">Password: <span className='text-red-500'>*</span></label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            className="border w-full rounded-md p-2 mt-2"
                            onChange={handleChange}
                            value={formData.password}
                        />
                        {error.password && <p className='text-red-500'>{error.password}</p>}
                    </div>
                )}
                {editAdmin && (
                    <div className="mb-4">
                        <label className="text-gray-500">Status</label>
                        <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="active"
                                    name="status"
                                    value="1"
                                    checked={formData.status == 1}
                                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                    className="mr-2"
                                />
                                <label htmlFor="active" className="text-sm">Active</label>
                            </div>

                            {/* Inactive Status */}
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="inactive"
                                    name="status"
                                    value="0"
                                    checked={formData.status == 0}
                                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                    className="mr-2"
                                />
                                <label htmlFor="inactive" className="text-sm">Inactive</label>
                            </div>
                        </div>
                    </div>
                )}


                <div className="mb-4">
                    <label className="text-gray-500" htmlFor="role">Role: <span className='text-red-500'>*</span></label>

                    <div className="relative">
                        <select
                            name="role"
                            id="role"
                            className="w-full border p-2 rounded-md mt-2"
                            onChange={handleChange}
                            value={formData.role}
                            disabled={loading}

                        >
                            <option value="">Select a role</option>
                            {roles.map((role, index) => (
                                <option key={index} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                        {loading && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <div className="loader border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full animate-spin z-50"></div>
                            </div>
                        )}
                    </div>
                    {error.role && <p className='text-red-500'>{error.role}</p>}
                </div>

                {formData.role !== 'admin' && (
                    <div className="mb-4 relative">
                        <label htmlFor="service_group" className="block mb-2">Services Name</label>
                        <SelectSearch
                            multiple
                            options={options}
                            value={formData.service_ids ? formData.service_ids.split(',') : []}  // Convert string to array for value
                            name="service_ids"
                            placeholder="Select Services"
                            onChange={(value) => handleServiceGroupChange(value)}
                            search
                            disabled={loading}
                        />


                        {loading && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <div className="loader border-t-transparent border-gray-400 border-2 w-5 h-5 rounded-full z-50 animate-spin"></div>
                            </div>
                        )}
                    </div>

                )}
                <button type="submit" disabled={loading || isApiLoading} className={`w-full rounded-md p-3 text-white ${loading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}
                >Send</button>
                <button type="button" onClick={emptyForm} className='bg-blue-400 hover:bg-blue-800 text-white p-3 mt-5 rounded-md w-full'>Reset Form</button>
            </form>
        </>
    );
}

export default InternalLoginForm;
