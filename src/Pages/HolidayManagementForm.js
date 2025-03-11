import React, { useEffect, useState } from 'react';
import { useHoliday } from './HolidayManagementContext';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import { useApiCall } from '../ApiCallContext';

const HolidayManagementForm = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const API_URL = useApi();
    const { selectedService, updateServiceList, fetchData } = useHoliday();
    const [adminId, setAdminId] = useState(null);
    const [storedToken, setStoredToken] = useState(null);
    const [isEdit, setIsEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dateInput, setDateInput] = useState({
        name: "",
        date: "",
    });
    const [error, setError] = useState({});


    useEffect(() => {
        const adminData = JSON.parse(localStorage.getItem("admin"));
        const token = localStorage.getItem("_token");
        if (adminData) setAdminId(adminData.id);
        if (token) setStoredToken(token);
        if (selectedService) {
            const initialDate = selectedService.date;
            const formattedDate = initialDate.split("T")[0];
            setDateInput({
                name: selectedService.title || '',
                date: formattedDate || '',
            });
            setIsEdit(true);
        } else {
            setDateInput({
                name: "",
                date: "",
            });
            setIsEdit(false);
        }
    }, [selectedService]);

    const validate = () => {
        const newErrors = {};
        if (!dateInput.name) {
            newErrors.name = 'This Field is Required!';
        }
        if (!dateInput.date) {
            newErrors.date = 'This Field is Required!';
        }
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDateInput((prevInput) => ({
            ...prevInput, [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validateError = validate();

        if (Object.keys(validateError).length === 0) {
            setIsApiLoading(true); // Set loading state at the start

            setLoading(true); // Start loading spinner

            Swal.fire({
                title: 'Processing...',
                text: 'Please wait while we create the Client.',
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const requestOptions = {
                method: isEdit ? "PUT" : "POST", // Set method to PUT for editing
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: selectedService?.id || '',
                    title: dateInput.name,
                    date: dateInput.date,
                    admin_id: adminId,
                    _token: storedToken,
                }),
            };

            const url = isEdit
                ? `${API_URL}/holiday/update`
                : `${API_URL}/holiday/create`;

            fetch(url, requestOptions)
                .then(response => response.json())  // Parse the JSON response
                .then((result) => {
                    // Check for token renewal and session expiration
                    const newToken = result._token || result.token;
                    if (newToken) {
                        localStorage.setItem("_token", newToken); // Update token if available
                    }

                    // Handle session expiration
                    if (result.message?.toLowerCase().includes("invalid") && result.message?.toLowerCase().includes("token")) {
                        Swal.fire({
                            title: "Session Expired",
                            text: "Your session has expired. Please log in again.",
                            icon: "warning",
                            confirmButtonText: "Ok",
                        }).then(() => {
                            window.location.href = "/admin-login"; // Redirect to login page
                        });
                        return;  // Exit further processing if session expired
                    }

                    // Success handling
                    setError({});  // Clear previous errors
                    Swal.fire({
                        title: "Success",
                        text: isEdit ? 'Holiday updated successfully' : 'Holiday added successfully',
                        icon: "success",
                        confirmButtonText: "Ok"
                    });

                    // Update the service list based on whether it's an edit or create
                    if (isEdit) {
                        updateServiceList(prevList => prevList.map(service => service.id === result.id ? result : service));
                    } else {
                        updateServiceList(prevList => [...prevList, result]);
                    }

                    fetchData();  // Refresh data after success
                    setDateInput({ name: "", date: "" });  // Clear form inputs
                    setIsEdit(false);  // Reset the edit flag
                })
                .catch((error) => {
                    // Handle errors during the fetch operation
                    console.error(error);
                    Swal.fire({
                        title: 'Error!',
                        text: error.message || 'An error occurred while processing your request.',
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                })
                .finally(() => {
                    setLoading(false);  // Stop loading spinner
                    setIsApiLoading(false);  // Stop the API loading state
                });
        } else {
            setError(validateError);  // Set validation errors if validation fails
        }
    };



    return (
        <form onSubmit={handleSubmit} className='border rounded-md p-5'>
            <div className="mb-4">
                <label htmlFor="holidaytitle" className="block"> Name<span className='text-red-500'>*</span></label>
                <input
                    type="text"
                    name="name"
                    id="holidaytitle"
                    value={dateInput.name}
                    onChange={handleChange}
                    className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2 mt-2 capitalize' />
                {error.name && <p className='text-red-500'>{error.name}</p>}
            </div>
            <div className="mb-4">
                <label htmlFor="HoliDayDate" className="block">Date<span className='text-red-500'>*</span></label>
                <input
                    type="date"
                    name="date"
                    id="HoliDayDate"
                    value={dateInput.date}
                    onChange={handleChange}
                    className='outline-none pe-4 ps-2 text-left rounded-md w-full border p-2 mt-2 capitalize' />
                {error.date && <p className='text-red-500'>{error.date}</p>}
            </div>
            <button
                className={`rounded-md p-3 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}
                type='submit' disabled={loading || isApiLoading}>
                {loading ? 'Processing...' : isEdit ? 'Update' : 'Add'}
            </button>
        </form>
    );
};

export default HolidayManagementForm;
