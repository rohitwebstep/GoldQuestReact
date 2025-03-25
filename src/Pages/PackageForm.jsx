import React, { useState, useEffect } from 'react';
import { usePackage } from './PackageContext';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext

const PackageForm = ({ onSuccess }) => {
      const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext
    
    const API_URL = useApi();
    const { fetchData } = usePackage();
    const { selectedPackage, clearSelectedPackage, packageList, updatePackageList } = usePackage();
    const [packageInput, setPackageInput] = useState({
        name: "",
        message: "",
    });
    const [error, setError] = useState({});
    const [adminId, setAdminId] = useState(null);
    const [, setStoredToken] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formMessage, setFormMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false); // New state for loading indicator
    const [initialPackageInput, setInitialPackageInput] = useState({
        name: "",
        message: "",
    });

    useEffect(() => {
        const adminData = JSON.parse(localStorage.getItem("admin"));
        const token = localStorage.getItem("_token");

        if (adminData) setAdminId(adminData.id);
        if (token) setStoredToken(token);

        if (selectedPackage) {
            setPackageInput({
                name: selectedPackage.title || "",
                message: selectedPackage.description || "",
            });
            setInitialPackageInput({
                name: selectedPackage.title || "",
                message: selectedPackage.description || "",
            });
            setIsEditMode(true);
        } else {
            setPackageInput({
                name: "",
                message: "",
            });
            setInitialPackageInput({
                name: "",
                message: "",
            });
            setIsEditMode(false);
        }

        // Handle tab visibility change event
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Reset form when the tab is hidden (switched away)
                setPackageInput({
                    name: "",
                    message: "",
                });
            }
        };

        // Add event listener for visibility change
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Cleanup the event listener when the component is unmounted
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [selectedPackage]);

    const validateInputs = () => {
        const errors = {};
        if (!packageInput.name) {
            errors.name = 'This field is required!';
        }
        if (!packageInput.message) {
            errors.message = 'This field is required!';
        }
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPackageInput(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handlePackageFormSubmit = (e) => {
        e.preventDefault();
        setIsApiLoading(true);
        setIsLoading(true); // Start loading

        const adminData = JSON.parse(localStorage.getItem("admin"));
        const token = localStorage.getItem("_token");

        if (!token) {
            // Handle the case where the token is missing
            Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again.",
                icon: "warning",
                confirmButtonText: "Ok",
            }).then(() => {
                window.location.href = "/admin-login"; // Redirect to login if no token
            });
            return; // Exit early if no token
        }

        if (adminData) setAdminId(adminData.id);
        setStoredToken(token);

        const validationErrors = validateInputs();
        if (Object.keys(validationErrors).length === 0) {
            setError({}); // Clear previous errors

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const raw = JSON.stringify({
                id: selectedPackage?.id || "",
                title: packageInput.name,
                description: packageInput.message,
                admin_id: adminId,
                _token: token,
            });

            const requestOptions = {
                method: isEditMode ? "PUT" : "POST",
                headers: myHeaders,
                body: raw,
            };

            const url = isEditMode
                ? `${API_URL}/package/update`
                : `${API_URL}/package/create`;

            fetch(url, requestOptions)
                .then((response) => {
                    if (!response.ok) {
                        return response.json().then((errorData) => {
                            // Handle invalid token case
                            if (errorData.message && errorData.message.toLowerCase().includes("invalid token")) {
                                Swal.fire({
                                    title: "Session Expired",
                                    text: "Your session has expired. Please log in again.",
                                    icon: "warning",
                                    confirmButtonText: "Ok",
                                }).then(() => {
                                    window.location.href = "/admin-login"; // Redirect to login if session expired
                                });
                            } else {
                                Swal.fire('Error!', `An error occurred: ${errorData.message}`, 'error');
                            }
                            throw new Error(errorData.message); // Propagate the error
                        });
                    }
                    return response.json(); // Parse the response if it's OK
                })
                .then((result) => {
                    // Handle the result if the response is valid
                    if (result.status === false) {
                        Swal.fire('Error!', result.message, 'error');
                        return; // Exit early if status is false
                    }

                    const newToken = result.token || result._token || "";
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }
                    // Display success message
                    Swal.fire({
                        title: "Success!",
                        text: isEditMode ? "Package Edited Successfully" : "Package Added Successfully",
                        icon: "success",
                        confirmButtonText: "Ok",
                    });

                    // Update the package list
                    setError({});
                    if (isEditMode) {
                        const updatedPackages = packageList.map((pkg) =>
                            pkg.id === result.id ? result : pkg
                        );
                        updatePackageList(updatedPackages);
                    } else {
                        updatePackageList([...packageList, result]);
                    }

                    // Reset form fields
                    setPackageInput({ name: "", message: "" });
                    fetchData();
                    setIsEditMode(false);

                    // Callbacks
                    if (typeof clearSelectedPackage === "function") {
                        clearSelectedPackage();
                    }
                    if (typeof onSuccess === "function") {
                        onSuccess(result);
                    }
                })
                .catch((error) => {
                    console.error("API Error:", error.message);

                })
                .finally(() => {
                    setIsLoading(false);
                    setIsApiLoading(false);
                    // Stop loading after submission
                });
        } else {
            // Show validation errors
            setError(validationErrors);
            setIsLoading(false); 
            setIsApiLoading(false);
            // Stop loading if there are validation errors
        }
    };



    const resetForm = () => {
        setPackageInput({
            name: "",
            message: "",
        });
        setError({});
        setIsEditMode(false);
    };

    return (
        <>
            <form onSubmit={handlePackageFormSubmit} disabled={isLoading}>
                <div className="mb-4">
                    <label htmlFor="packagename" className='text-sm'>Package Name<span className='text-red-500'>*</span></label>
                    <input
                        type="text"
                        name="name"
                        id="packagename"
                        className="border w-full rounded-md p-2 mt-2 capitalize text-sm"
                        onChange={handleChange}
                        value={packageInput.name}
                        disabled={isLoading}
                    />
                    {error.name && <p className="text-red-500">{error.name}</p>}
                </div>

                <div className="mb-4">
                    <label htmlFor="message" className='text-sm'>Package Description<span className='text-red-500'>*</span></label>
                    <textarea
                        disabled={isLoading}
                        name="message"
                        id="message"
                        className="w-full border p-3 outline-none rounded-md mt-2 capitalize text-sm"
                        rows={5}
                        cols={4}
                        onChange={handleChange}
                        value={packageInput.message}
                    ></textarea>
                    {error.message && <p className="text-red-500">{error.message}</p>}
                </div>
               
                <button
                    className={`w-full rounded-md p-3 text-white ${isLoading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}
                    type="submit"
                    disabled={isLoading || isApiLoading}
                >
                    {isLoading ? 'Processing...' : isEditMode ? 'Update' : 'Add'}
                </button>

                <button
                    onClick={resetForm}
                    type="button"
                    className='bg-blue-400 mt-5 text-white p-3 rounded-md w-full'
                >
                    Reset Form
                </button>

                {formMessage && <p className="mt-4 text-center text-[#3e76a5]">{formMessage}</p>}
            </form>
        </>
    );
};

export default PackageForm;
