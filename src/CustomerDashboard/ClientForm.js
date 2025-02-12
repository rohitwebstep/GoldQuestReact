import React, { useContext, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import DropBoxContext from './DropBoxContext';
import { useApi } from '../ApiContext';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';

const ClientForm = () => {
    const { isBranchApiLoading, setIsBranchApiLoading } = useApiCall();

    const [formLoading, setFormLoading] = useState(false);
    const branch_name = JSON.parse(localStorage.getItem("branch"));
    const storedBranchData = JSON.parse(localStorage.getItem("branch"));
    const branch_token = localStorage.getItem("branch_token");
    const API_URL = useApi();
    const customer_id = storedBranchData?.customer_id;
    const customer_code = localStorage.getItem("customer_code");
    const [files, setFiles] = useState({});

    const navigate = useNavigate();
    const GotoBulk = () => {
        navigate('/ClientBulkUpload')
    }
    const { isEditClient, setIsEditClient, inputError, setInputError, fetchClientDrop, setClientInput, services, uniquePackages, clientInput, loading } = useContext(DropBoxContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    const validate = () => {
        const newErrors = {};
        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]; // Allowed file types

        // Helper function to validate a file field
        const validateFile = (fileName) => {
            if (inputError[fileName] && inputError[fileName].length > 0) {
                // If there are existing errors, return them
                return inputError[fileName];
            } else {
                const selectedFiles = files[fileName]; // Get the files for this field
                let fileErrors = [];

                // Check if it's a new submission or the field is required
                if (fileName === 'attach_documents' && (!selectedFiles || selectedFiles.length === 0)) {
                    if (isEditClient !== true) { // If it's not an edit, file is required
                        fileErrors.push('Attach documents are required.');
                    }
                }

                if (selectedFiles && selectedFiles.length > 0) {
                    selectedFiles.forEach((file) => {
                        if (file.size > maxSize) {
                            fileErrors.push(`${file.name}: File size must be less than 2MB.`);
                        }

                        if (!allowedTypes.includes(file.type)) {
                            fileErrors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
                        }
                    });
                }

                return fileErrors;
            }
        };

        // Validate file fields: photo and attach_documents
        ['photo', 'attach_documents'].forEach((fileField) => {
            const fileErrors = validateFile(fileField);
            if (fileErrors.length > 0) {
                newErrors[fileField] = fileErrors;
            }
        });

        // Validate required text fields
        ['name', 'employee_id', 'spoc',].forEach((field) => {
            if (!clientInput[field] || clientInput[field].trim() === "") {
                newErrors[field] = "This Field is Required";
            }
            if (field === 'employee_id') {
                if (/\s/.test(clientInput[field])) {  // Check for spaces
                    newErrors[field] = 'Employee ID cannot contain spaces';
                } else if (/[^a-zA-Z0-9-]/.test(clientInput[field])) {
                    newErrors[field] = 'Employee ID should only contain letters, numbers, and hyphens';
                }
            }
        });

        return newErrors;
    };
    const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;

    const handleFileChange = (fileName, e) => {
        const selectedFiles = Array.from(e.target.files);

        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]; // Allowed file types

        let errors = [];

        // Validate each file
        selectedFiles.forEach((file) => {
            // Check file size
            if (file.size > maxSize) {
                errors.push(`${file.name}: File size must be less than 2MB.`);
            }

            // Check file type (MIME type)
            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
            }
        });

        // If there are errors, show them and don't update the state
        if (errors.length > 0) {
            setInputError((prevErrors) => ({
                ...prevErrors,
                [fileName]: errors, // Set errors for this file
            }));
            return; // Don't update state if there are errors
        }

        setFiles(prevFiles => ({ ...prevFiles, [fileName]: selectedFiles }));


        setInputError((prevErrors) => {
            const { [fileName]: removedError, ...restErrors } = prevErrors; // Remove the error for this field if valid
            return restErrors;
        });
    };
    const handleCustomInputChange = (e) => {
        const { name, value } = e.target;
        setClientInput((prevInput) => ({
            ...prevInput,
            [name]: value
        }));

        // Open the modal when "CUSTOM" is selected
        if (value === 'CUSTOM') {
            setIsModalOpen(true);
        } else {
            setIsModalOpen(false);
        }
    };

    const handleSaveCustomState = () => {
        if (clientInput.customPurpose) {
            setClientInput((prevState) => ({
                ...prevState,
                purpose_of_application: clientInput.customPurpose, // Save custom value
            }));
            setIsModalOpen(false); // Close the modal after saving
        }
    };



    const uploadCustomerLogo = async (insertedId, new_application_id) => {
        const fileCount = Object.keys(files).length;
        const serviceData = JSON.stringify(services);
        setIsBranchApiLoading(true);  // Start loading

        try {
            // Loop through the files to upload
            for (const [index, [key, value]] of Object.entries(files).entries()) {
                const customerLogoFormData = new FormData();
                customerLogoFormData.append('branch_id', storedBranchData?.id);
                customerLogoFormData.append('_token', branch_token);
                customerLogoFormData.append('customer_code', customer_code);
                customerLogoFormData.append('client_application_id', insertedId);

                // Append each file in the category to FormData
                for (const file of value) {
                    customerLogoFormData.append('images', file);
                }
                customerLogoFormData.append('upload_category', key);

                // Append additional data on the last iteration
                if (fileCount === (index + 1)) {
                    if (isEditClient) {
                        customerLogoFormData.append('send_mail', 0);  // Don't send mail if editing
                    } else {
                        customerLogoFormData.append('send_mail', 1);  // Send mail for new client
                    }
                    customerLogoFormData.append('services', serviceData);
                    customerLogoFormData.append('client_application_name', clientInput.name);
                    customerLogoFormData.append('client_application_generated_id', new_application_id);
                }

                // Perform the upload
                await axios.post(`${API_URL}/branch/client-application/upload`, customerLogoFormData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            }
        } catch (err) {
            console.error('Error uploading logo:', err); // Log more details about the error
            Swal.fire('Error!', `An error occurred while uploading logo: ${err.message}`, 'error');
        } finally {
            setIsBranchApiLoading(false);  // Stop loading once all files are processed
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        let requestBody;
        const errors = validate();

        if (Object.keys(errors).length === 0) {
            setFormLoading(true);

            const branch_id = storedBranchData?.id;
            const fileCount = Object.keys(files).length;

            // Prepare the request body
            // Remove customPurpose from clientInput using destructuring
            const { customPurpose, ...finalData } = clientInput;

            // Construct requestBody based on fileCount
            let requestBody;
            if (fileCount === 0) {
                requestBody = {
                    customer_id,
                    branch_id,
                    send_mail: 1, // No file uploaded, so we send mail
                    _token: branch_token,
                    ...finalData, // Spread the remaining data
                };
            } else {
                requestBody = {
                    customer_id,
                    branch_id,
                    send_mail: 0, // File uploaded, so we don't send mail initially
                    _token: branch_token,
                    ...finalData, // Spread the remaining data
                };
            }


            setIsBranchApiLoading(true);

            const swalInstance = Swal.fire({
                title: 'Processing...',
                text: 'Please wait while we create the Client Application.',
                didOpen: () => {
                    Swal.showLoading(); // Start the loading spinner
                },
                allowOutsideClick: false, // Prevent closing Swal while processing
                showConfirmButton: false, // Hide the confirm button
            });

            try {
                // Make the API request
                const response = await fetch(
                    isEditClient
                        ? `${API_URL}/branch/client-application/update`
                        : `${API_URL}/branch/client-application/create`,
                    {
                        method: isEditClient ? "PUT" : "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(requestBody),
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    const errorMessage = result.message || "Unknown error occurred";
                    const apiError = result.errors || "An unexpected error occurred. Please try again later.";

                    const messageToShow = result.message || `${apiError}`;
                    Swal.fire("Error!", messageToShow, "error");

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
                            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
                        });
                    }

                    throw new Error(errorMessage);
                }

                // Handle token update
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("branch_token", newToken);
                }

                let insertedId;
                let new_application_id;

                if (isEditClient) {
                    // Only assign if available, otherwise continue
                    if (clientInput?.client_application_id && clientInput?.application_id) {
                        insertedId = clientInput?.client_application_id;
                        new_application_id = clientInput?.application_id;
                    } else {
                        // Skip this part and continue to the next step
                        console.warn("Client application ID or application ID is missing for edit.");
                    }
                } else {
                    // Assign for new client
                    insertedId = result?.result?.results?.insertId;
                    new_application_id = result?.result?.new_application_id;
                }

                // Handle success message
                let successMessage = `${isEditClient ? "Application Updated Successfully" : "Application Created Successfully"}`;

                if (fileCount > 0) {
                    // Handle file upload and call the upload function
                    if (insertedId && new_application_id) {
                        await uploadCustomerLogo(insertedId, new_application_id);
                        successMessage = "Client Application Created Successfully.";
                    } else {
                        console.warn("Inserted ID or Application ID not available, skipping upload.");
                    }
                }

                // Show the success message
                Swal.fire({
                    title: "Success",
                    text: successMessage,
                    icon: "success",
                    confirmButtonText: "Ok",
                }).then(() => {
                    // Reset form and state after showing success message
                    setClientInput({
                        name: "",
                        employee_id: "",
                        spoc: "",
                        location: "",
                        batch_number: "",
                        sub_client: "",
                        services: [],
                        package: "",
                        client_application_id: "",
                    });

                    setFiles({});
                    setInputError({});
                    fetchClientDrop(); // Fetch client dropdown data

                    setIsEditClient(false); // Reset edit mode
                });

            } catch (error) {
                console.error("There was an error!", error);
            } finally {
                swalInstance.close(); // Close the Swal loading spinner
                setFormLoading(false);
                setIsBranchApiLoading(false);
            }
        } else {
            setInputError(errors); // Set the input errors if validation fails
        }
    };



    const handlePackageChange = (e) => {
        const selectedValue = e.target.value; // The selected package ID

        if (selectedValue === "") {
            // If no package selected, reset services and package
            setClientInput(prevState => ({
                ...prevState,
                package: "",
                services: [], // Clear services if no package is selected
            }));
            return;
        }

        if (selectedValue === "select_all") {
            // If "Select All" is selected, select all services
            const allServiceIds = services.map(service => String(service.serviceId)); // Collect all service IDs
            setClientInput(prevState => ({
                ...prevState,
                package: selectedValue, // Optionally store "Select All" in the package field
                services: allServiceIds, // Select all services
            }));
        } else {
            // Otherwise, select the services related to the specific package
            const associatedServices = services
                .filter(service => service.packages && Object.keys(service.packages).includes(selectedValue))
                .map(service => String(service.serviceId)); // Ensure service IDs are strings

            setClientInput(prevState => ({
                ...prevState,
                package: selectedValue, // Set the selected package
                services: associatedServices, // Automatically select all associated services
            }));
        }
    };

    const handleChange = (event) => {
        const { name, value, checked } = event.target;

        if (name === 'services') {
            setClientInput((prev) => {
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
            setClientInput((prev) => ({
                ...prev, [name]: name === 'employee_id' ? value.replace(/\s+/g, '').toUpperCase() : value,
            }));
        }
    };



    const emptyForm = () => {
        setClientInput({
            name: "",
            employee_id: "",
            spoc: "",
            location: "",
            batch_number: "",
            sub_client: "",
            services: [],
            package: "",
            client_application_id: "",
        });
        setInputError({});
        setIsEditClient(false);
    };
    return (
        <>
            {formLoading ? (
                <div className='flex justify-center'>  <PulseLoader color="#36A2EB" loading={formLoading} size={15} /></div>
            ) : (

                <form onSubmit={handleSubmit}>
                    <div className="md:grid gap-4 grid-cols-2 mb-4">
                        <div className="col bg-white shadow-md rounded-md p-3 md:p-6">
                            <div className="md:flex gap-5">
                                <div className="mb-4 md:w-6/12">
                                    <label htmlFor="organisation_name" className='text-sm'>Name of the organisation<span className="text-red-500">*</span></label>
                                    <input type="text" name="organisation_name" id="Organisation_Name" className="border w-full capitalize rounded-md p-2 mt-2" disabled value={branch_name?.name} />
                                    {inputError.organisation_name && <p className='text-red-500'>{inputError.organisation_name}</p>}
                                </div>
                                <div className="mb-4 md:w-6/12">
                                    <label htmlFor="name" className='text-sm'>Full name of the applicant <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" id="Applicant-Name" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.name} />
                                    {inputError.name && <p className='text-red-500'>{inputError.name}</p>}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="attach_documents" className='text-sm'>Attach documents<span className="text-red-500">*</span></label>
                                <input type="file" name="attach_documents" multiple id="Attach_Docs" className="border w-full capitalize rounded-md p-2 mt-2"
                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                    onChange={(e) => handleFileChange('attach_documents', e)} />
                                {inputError.attach_documents && <p className='text-red-500'>{inputError.attach_documents}</p>}
                                <p className="text-gray-500 text-sm mt-2">
                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed. Max file size: 2MB.
                                </p>
                            </div>
                            <div className="md:flex gap-5">
                                <div className="mb-4 md:w-6/12">
                                    <label htmlFor="employee_id" className='text-sm'>Employee ID<span className="text-red-500">*</span></label>
                                    <input type="text" name="employee_id" disabled={isEditClient} id="EmployeeId" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.employee_id.toUpperCase()} />
                                    {inputError.employee_id && <p className='text-red-500'
                                    >{inputError.employee_id}</p>}
                                </div>
                                <div className="mb-4 md:w-6/12">
                                    <label htmlFor="spoc" className='text-sm'>Name of the SPOC<span className="text-red-500">*</span></label>
                                    <input type="text" name="spoc" id="spoc" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.spoc} />
                                    {inputError.spoc && <p className='text-red-500'>{inputError.spoc}</p>}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="location" className='text-sm'>Location</label>
                                <input type="text" name="location" id="Locations" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.location} />
                                {inputError.location && <p className='text-red-500'>{inputError.location}</p>}
                            </div>
                            <div className="md:flex gap-5">
                                <div className="mb-4 md:w-6/12">
                                    <label htmlFor="batch_number" className='text-sm'>Batch number</label>
                                    <input type="text" name="batch_number" id="Batch-Number" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.batch_number} />
                                    {inputError.batch_number && <p className='text-red-500'>{inputError.batch_number}</p>}
                                </div>
                                <div className="mb-4 md:w-6/12">
                                    <label htmlFor="sub_client" className='text-sm'>Sub client</label>
                                    <input type="text" name="sub_client" id="SubClient" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.sub_client} />
                                    {inputError.sub_client && <p className='text-red-500'>{inputError.sub_client}</p>}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="photo">Upload photo</label>
                                <input type="file" name="photo" id="upPhoto" className="border w-full capitalize rounded-md p-2 mt-2 outline-none" accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                    onChange={(e) => handleFileChange('photo', e)} />
                                {inputError.photo && <p className='text-red-500'>{inputError.photo}</p>}
                                <p className="text-gray-500 text-sm mt-2">
                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed. Max file size: 2MB.
                                </p>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="email" className='text-sm'>Purpose of Application</label>
                                <select
                                    name="purpose_of_application"
                                    onChange={handleCustomInputChange}
                                    value={clientInput.purpose_of_application || clientInput.customPurpose}
                                    className="border w-full rounded-md p-2 mt-2"
                                    id="purpose_of_application"
                                >
                                    <option value="">SELECT PURPOSE</option>
                                    <option value="TENANT VERIFICATION(TENANCY VERIFICATION)">TENANT VERIFICATION(TENANCY VERIFICATION)</option>
                                    <option value="TENANT VERIFICATION">TENANT VERIFICATION</option>
                                    <option value="JUNIOR STAFF(MAID)">JUNIOR STAFF(MAID)</option>
                                    <option value="JUNIOR STAFF(NANNY)">JUNIOR STAFF(NANNY)</option>
                                    <option value="JUNIOR STAFF(BABY SITTER)">JUNIOR STAFF(BABY SITTER)</option>
                                    <option value="JUNIOR STAFF(PATIENT ATTENDER)">JUNIOR STAFF(PATIENT ATTENDER)</option>
                                    <option value="JUNIOR STAFF(DRIVER)">JUNIOR STAFF(DRIVER)</option>
                                    <option value="NORMAL BGV(EMPLOYMENT)">NORMAL BGV(EMPLOYMENT)</option>
                                    <option value="CUSTOM">CUSTOM</option>
                                    {clientInput.customPurpose && (
                                        <option value={clientInput.customPurpose} selected>{clientInput.customPurpose}</option>
                                    )}
                                </select>
                            </div>

                            {isModalOpen && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                                    <div className="bg-white rounded-md p-4 max-w-lg w-full">
                                        <div className="mb-4">
                                            <label htmlFor="customPurpose" className="text-sm">Please specify the custom purpose</label>
                                            <input
                                                type="text"
                                                name="customPurpose"
                                                value={clientInput.customPurpose}
                                                onChange={handleChange}
                                                className="border w-full rounded-md p-2 mt-2"
                                                id="customPurpose"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-4">
                                            <button
                                                type='button'
                                                onClick={handleCloseModal}
                                                className="bg-gray-500 text-white px-4 py-2 rounded-md"
                                            >
                                                Close
                                            </button>
                                            <button
                                                type='button'
                                                onClick={handleSaveCustomState} // Save custom state to purpose_of_application
                                                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="col bg-white shadow-md rounded-md p-3 md:p-6 md:mt-0 mt-5">
                            <div className="flex flex-wrap flex-col-reverse">
                                <div className='mt-4 md:h-[450px] h-[200px] overflow-auto'>
                                    <h2 className='bg-green-500 rounded-md p-4 text-white mb-4 hover:bg-green-200'>Service Names</h2>
                                    {loading ? (
                                        <PulseLoader color="#36A2EB" loading={loading} size={15} />
                                    ) : services.length > 0 ? (
                                        <ul className='md:grid grid-cols-2 gap-2'>
                                            {services.map((item) => (
                                                <li
                                                    key={item.serviceId}
                                                    className={`border p-2 my-1 mb-0 flex gap-3 text-sm  items-center ${clientInput.services.includes(String(item.serviceId)) ? 'selected' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="services"
                                                        value={String(item.serviceId)} // Ensure `value` matches the service ID type
                                                        onChange={handleChange}
                                                        checked={clientInput.services.includes(String(item.serviceId))} // Match ID type
                                                    />
                                                    <div className='font-bold'>{item.serviceTitle}</div>
                                                </li>
                                            ))}
                                        </ul>


                                    ) : (
                                        <p>No services available</p>
                                    )}
                                </div>
                                <div className="mt-5">
                                    <strong className="mb-2 block">Packages:</strong>
                                    {!loading && (
                                        <select
                                            value={clientInput.package[0] || ""}
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
                        <button type="submit" className={`rounded-md p-3 text-white ${isBranchApiLoading || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-200'}`}
                            disabled={formLoading}>
                            Send
                        </button>
                        <button type="button" onClick={emptyForm} className='bg-blue-400 hover:bg-blue-800 text-white p-3 rounded-md '>Reset Form</button>
                    </div>
                    {/* <button type="button" className='bg-green-400 hover:bg-green-200 mt-4 text-white p-3 rounded-md w-auto ms-3'>Bulk Upload</button> */}
                </form>
            )}

        </>
    );
}

export default ClientForm;
