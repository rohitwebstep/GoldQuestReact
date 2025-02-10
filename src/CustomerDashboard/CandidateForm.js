import React, { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import DropBoxContext from './DropBoxContext';
import { useApi } from '../ApiContext';
import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';

const CandidateForm = () => {
    const { isBranchApiLoading, setIsBranchApiLoading } = useApiCall();

    const { services, uniquePackages, input, setInput, fetchClient, isEditCandidate, setIsEditCandidate, candidateLoading } = useContext(DropBoxContext);
    const [formLoading, setFormLoading] = useState(false);
    const API_URL = useApi();
    const branch_name = JSON.parse(localStorage.getItem("branch"));

    const [error, setError] = useState({});


    const handlePackageChange = (e) => {
        const selectedValue = e.target.value; // The selected package ID

        if (selectedValue === "") {
            // If no package selected, reset services and package
            setInput(prevState => ({
                ...prevState,
                package: "",
                services: [], // Clear services if no package is selected
            }));
            return;
        }

        if (selectedValue === "select_all") {
            // If "Select All" is selected, select all services
            const allServiceIds = services.map(service => String(service.serviceId)); // Collect all service IDs
            setInput(prevState => ({
                ...prevState,
                package: selectedValue, // Optionally store "Select All" in the package field
                services: allServiceIds, // Select all services
            }));
        } else {
            // Otherwise, select the services related to the specific package
            const associatedServices = services
                .filter(service => service.packages && Object.keys(service.packages).includes(selectedValue))
                .map(service => String(service.serviceId)); // Ensure service IDs are strings

            setInput(prevState => ({
                ...prevState,
                package: selectedValue, // Set the selected package
                services: associatedServices, // Automatically select all associated services
            }));
        }
    };

    const handleChange = (event) => {
        const { name, value, checked } = event.target;

        if (name === 'services') {
            setInput((prev) => {
                let updatedServices = [...prev.services];

                if (checked) {
                    // If checked, add the service
                    updatedServices.push(value);
                } else {
                    // If unchecked, remove the service
                    updatedServices = updatedServices.filter((serviceId) => serviceId !== value);
                }

                return { ...prev, services: updatedServices };
            });
        } else {
            setInput((prev) => ({
                ...prev, [name]: name === 'employee_id' ? value.replace(/\s+/g, '').toUpperCase() : value
            }));

        }
    };

    const validate = () => {
        const NewErr = {};
    
        const name = String(input.name || '').trim();
        const employee_id = String(input.employee_id || '').trim();
        const nationality = String(input.nationality || '').trim();
        const mobile_number = String(input.mobile_number || '').trim();
        const email = String(input.email || '').trim();
    
        // Name validation
        if (!name) {
            NewErr.name = 'Name is required';
        }
    
        // Nationality validation for select box
        if (!nationality || nationality === "") {
            NewErr.nationality = 'Nationality is required';
        }
        
    
        // Employee ID validation
        if (/\s/.test(employee_id)) {  // Check for spaces
            NewErr.employee_id = 'Employee ID cannot contain spaces';
        } else if (/[^a-zA-Z0-9-]/.test(employee_id)) {
            NewErr.employee_id = 'Employee ID should only contain letters, numbers, and hyphens';
        }
    
        // Mobile number validation
        if (!mobile_number) {
            NewErr.mobile_number = 'Mobile number is required';
        } else if (!/^\d{10}$/.test(mobile_number)) {
            NewErr.mobile_number = "Please enter a valid phone number, containing 10 digits.";
        }
    
        // Email validation
        if (!email) {
            NewErr.email = 'Email is required';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                NewErr.email = 'Invalid email format';
            } else {
                input.email = email.toLowerCase();
            }
        }
    
        return NewErr;
    };
    



    const handleSubmit = (e) => {
        e.preventDefault();

        const errors = validate();
        if (Object.keys(errors).length === 0) {
            setError({});
            setIsBranchApiLoading(true);
            setFormLoading(true);
            const branchData = JSON.parse(localStorage.getItem("branch"));
            const customer_id = branchData?.customer_id;
            const branch_id = branchData?.id;
            const branch_token = localStorage.getItem("branch_token");

            const servicesString = Array.isArray(input.services) ? input.services.join(",") : "";

            const Raw = JSON.stringify({
                customer_id,
                branch_id,
                _token: branch_token,
                name: input.name,
                employee_id: input.employee_id,
                mobile_number: input.mobile_number,
                email: input.email,
                package: input.package,
                services: servicesString,
                candidate_application_id: input.candidate_application_id,
                nationality:input.nationality,
                purpose_of_application:input.purpose_of_application
            });

            const requestOptions = {
                method: isEditCandidate ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: Raw,
                redirect: "follow",
            };

            const url = isEditCandidate
                ? `${API_URL}/branch/candidate-application/update`
                : `${API_URL}/branch/candidate-application/create`;

            const swalInstance = Swal.fire({
                title: 'Processing...',
                text: 'Please wait while we create the Application.',
                didOpen: () => {
                    Swal.showLoading(); // This starts the loading spinner
                },
                allowOutsideClick: false, // Prevent closing Swal while processing
                showConfirmButton: false, // Hide the confirm button
            });

            fetch(url, requestOptions)
                .then(async (response) => {
                    if (!response.ok) {
                        const newToken = response._token || response.token;
                        if (newToken) {
                            localStorage.setItem("branch_token", newToken);
                        }
                        const errorResult = await response.json();
                        const errorMessage = errorResult.message || "An error occurred";
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
                                // Redirect to customer login page
                                window.location.href = `/customer-login?email=${encodeURIComponent(branchData?.email || "")}`;

                            });
                        } else {
                            Swal.fire("Error!", errorMessage, "error");
                        }
                        throw new Error(errorMessage);
                    }
                    return response.json();
                })
                .then((result) => {
                    const newToken = result._token || result.token;
                    if (newToken) {
                        localStorage.setItem("branch_token", newToken);
                    }

                    setInput({
                        name: "",
                        employee_id: "",
                        mobile_number: "",
                        email: "",
                        services: [],
                        package: "",
                        candidate_application_id: "",
                    });

                    setError({}); // Clear errors
                    fetchClient(); // Refresh client list

                    Swal.fire({
                        title: "Success",
                        text: isEditCandidate
                            ? "Candidate Application edited successfully"
                            : "Candidate Application added successfully",
                        icon: "success",
                        confirmButtonText: "Ok",
                    });

                    setIsEditCandidate(false);
                })
                .catch((error) => {
                    console.error("There was an error!", error);
                })
                .finally(() => {
                    swalInstance.close(); // Close the Swal loading spinner
                    setFormLoading(false);
                    setIsBranchApiLoading(false);
                });
        } else {
            setError(errors);
            setFormLoading(false);
            setIsBranchApiLoading(false);
        }
    };


    const emptyForm = () => {
        setInput({
            name: "",
            employee_id: "",
            mobile_number: "",
            email: "",
            services: [],
            package: "",
            candidate_application_id: "",
        });
        setError({});
        setIsEditCandidate(false);
    }

    return (
        <>
            {formLoading ? (
                <div className='flex justify-center'><PulseLoader color="#36A2EB" loading={formLoading} size={15} /></div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="md:grid gap-4 grid-cols-2 mb-4">
                        <div className="col bg-white shadow-md rounded-md p-3 md:p-6">
                            <div className="mb-4">
                                <label htmlFor="applicant_name" className='text-sm'>Name of the organisation<span className='text-red-500'>*</span></label>
                                <input type="text" name="applicant_name" className="border w-full rounded-md p-2 mt-2" disabled value={branch_name?.name} />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="name" className='text-sm'>Full name of the applicant <span className='text-red-500'>*</span></label>
                                <input type="text" name="name" className="border w-full rounded-md p-2 mt-2" onChange={handleChange} value={input.name} />
                                {error.name && <p className='text-red-500'>{error.name}</p>}
                            </div>
                            <div className="mb-4">
                                <label htmlFor="employee_id" className='text-sm'>Employee ID</label>
                                <input type="text" name="employee_id" disabled={isEditCandidate} className="border w-full rounded-md p-2 mt-2" onChange={handleChange} value={input.employee_id.toUpperCase()} />
                                {error.employee_id && <p className='text-red-500'>{error.employee_id}</p>}
                            </div>
                            <div className="mb-4">
                                <label htmlFor="mobile_number" className='text-sm'>Mobile Number<span className='text-red-500'>*</span></label>
                                <input type="number" name="mobile_number" className="border w-full rounded-md p-2 mt-2" onChange={handleChange} value={input.mobile_number} />
                                {error.mobile_number && <p className='text-red-500'>{error.mobile_number}</p>}
                            </div>
                            <div className="mb-4">
                                <label htmlFor="email" className='text-sm'>Email ID<span className='text-red-500'>*</span></label>
                                <input type="email" name="email" className="border w-full rounded-md p-2 mt-2" onChange={handleChange} value={input.email} />
                                {error.email && <p className='text-red-500'>{error.email}</p>}
                            </div>
                            <div className="mb-4">
                                <label htmlFor="email" className='text-sm'>Purpose of Application</label>
                                <select name="purpose_of_application" onChange={handleChange} value={input.purpose_of_application} className="border w-full rounded-md p-2 mt-2" id="purpose_of_application">
                                    <option value="">Select Purpose</option>
                                    <option value="Tenant">Tenant</option>
                                    <option value="Nursing">Nursing</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="email" className='text-sm'>Nationality<span className='text-red-500'>*</span></label>
                                <select name="nationality" onChange={handleChange} value={input.nationality} className="border w-full rounded-md p-2 mt-2" id="nationality">
                                    <option value="">Select Nationality</option>
                                    <option value="Indian">Indian</option>
                                    <option value="Other">Other</option> {/* Correct option for "Other" */}
                                </select>
                                {error.nationality && <p className='text-red-500'>{error.nationality}</p>}
                            </div>
                        </div>
                        <div className="col bg-white shadow-md rounded-md p-3 mt-5 md:mt-0 md:p-6">
                            <div className="flex flex-wrap flex-col-reverse">
                                <div className='mt-4 h-[300px] overflow-auto'>
                                    <h2 className='bg-green-500 rounded-md p-4 text-white mb-4 hover:bg-green-200'>Service Names</h2>

                                    {candidateLoading ? (
                                        <PulseLoader color="#36A2EB" loading={candidateLoading} size={15} />
                                    ) : services.length > 0 ? (
                                        <div>

                                            <ul className='md:grid grid-cols-2 gap-2'>
                                                {services.map((item) => (
                                                    <li
                                                        key={item.serviceId}
                                                        className={`border p-2 my-1 mb-0 flex gap-3 text-sm  items-center ${input.services.includes(String(item.serviceId)) ? 'selected' : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            name="services"
                                                            value={String(item.serviceId)} // Ensure `value` matches the service ID type
                                                            onChange={handleChange}
                                                            checked={input.services.includes(String(item.serviceId))} // Match ID type
                                                        />

                                                        <div className='font-bold'>{item.serviceTitle}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <p>No services available</p>
                                    )}
                                </div>

                                <div className="mt-5">
                                    <strong className="mb-2 block">Packages:</strong>
                                    {!candidateLoading && (
                                        <select
                                            value={input.package[0] || ""}
                                            onChange={handlePackageChange}
                                            className="text-left w-full border p-2 rounded-md"
                                        >
                                            <option value="">Select a package</option>
                                            <option value="select_all">Select All</option> {/* Added Select All option */}
                                            {uniquePackages.map(pkg => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    {pkg.name || "No Name"}
                                                </option>
                                            ))}
                                        </select>

                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className='flex gap-4'>
                        <button type="submit" disabled={isBranchApiLoading} className='bg-green-400 hover:bg-green-200 text-white p-3 rounded-md  md:w-2/12'>{isEditCandidate ? "Edit" : "Send"}</button>
                        <button type="button" onClick={emptyForm} className='bg-blue-400 hover:bg-blue-800 text-white p-3 rounded-md '>Reset Form</button>
                    </div>
                </form>
            )}

        </>
    );
}

export default CandidateForm;
