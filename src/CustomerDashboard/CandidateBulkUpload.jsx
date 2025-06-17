import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MultiSelect } from "react-multi-select-component";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import { useApi } from '../ApiContext';
import * as XLSX from 'xlsx';
import Customer from '../Middleware/Customer';
import { useApiCall } from '../ApiCallContext';

const CandidateBulkUpload = () => {
    const API_URL = useApi();
    const { setIsBranchApiLoading, isBranchApiLoading } = useApiCall();
    const [uniquePackages, setUniquePackages] = useState([]);
    const [clientInput, setClientInput] = useState({
        services: [],
        package: [],
        purpose_of_application: "",
        customPurpose: "",
        nationality: "",
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    const [fileName, setFileName] = useState("");
    const [isFileValid, setIsFileValid] = useState(false);
    const navigate = useNavigate();
    const candidateEditRef = useRef(null);
    const [errors, setErrors] = useState({});
    const [spocID, setSpocID] = useState('');
    const [spocName, setSpocName] = useState('');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [organisationName, setOrganisationName] = useState('');
    const [handleEditClick, setHandleEditClick] = useState('');
    const [ApplicationId, setCandidateApplicationId] = useState('');
    const [formData, setFormData] = useState({})
    const [data, setData] = useState([]);


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


    const fetchCustomerInfo = useCallback(async () => {
        const branchData = JSON.parse(localStorage.getItem("branch")) || {};
        const branchEmail = branchData?.email;
        setIsBranchApiLoading(true);
        const branchId = branchData?.branch_id;
        const customerId = branchData?.customer_id;
        const token = localStorage.getItem("branch_token");

        if (!branchId || !token) {
            setIsBranchApiLoading(false);
            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
            return;
        }

        const payLoad = {
            branch_id: branchId,
            _token: token,
            customer_id: customerId,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
        };

        const queryString = new URLSearchParams(payLoad).toString();

        try {
            const response = await fetch(`${API_URL}/branch/candidate-application/list?${queryString}`, {
                method: "GET",
                redirect: "follow",
            });

            const result = await response.json();

            // Check if a new token is present

            if (result.token) {
                localStorage.setItem("branch_token", result.token);
            } else {
                console.warn("No token found in API response.");
            }



            if (!response.ok) {
                const errorMessage = result?.message || "Something went wrong. Please try again later.";
                Swal.fire({
                    title: "Error!",
                    text: errorMessage,
                    icon: "error",
                    confirmButtonText: "OK",
                });
                return;
            }

            if (result.message?.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                Swal.fire({
                    title: "Session Expired",
                    text: "Your session has expired. Please log in again.",
                    icon: "warning",
                    confirmButtonText: "Ok",
                }).then(() => {
                    window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
                });
                return;
            }

            setTableData(result.data.candidateApplications || []);
            const customerInfo = result.data.customer || {};
            const customer = result.data.customerInfo;

            const services = customer.services && customer.services !== '""' ? JSON.parse(customer.services) : [];
            setServices(services);

            const uniquePackages = [];
            const packageSet = new Set();
            services.forEach(service => {
                if (service.packages) {
                    Object.keys(service.packages).forEach(packageId => {
                        if (!packageSet.has(packageId)) {
                            packageSet.add(packageId);
                            uniquePackages.push({ id: packageId, name: service.packages[packageId] });
                        }
                    });
                }
            });

            setUniquePackages(uniquePackages);

            setFormData(prevFormData => ({
                ...prevFormData,
                organizationName: customerInfo.name || "",
            }));
            setOrganisationName(customerInfo.name || "");

            if (customerInfo.spoc_details?.length) {
                setSpocID(customerInfo.spoc_details[0].id);
                setSpocName(customerInfo.spoc_details[0].name);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            Swal.fire("Error!", "An unexpected error occurred.", "error");
        } finally {
            setIsBranchApiLoading(false);
        }
    }, [API_URL, setTableData, setServices, setFormData, setOrganisationName, setSpocID, setSpocName]);

    useEffect(() => {
        if (!isBranchApiLoading) {
            fetchCustomerInfo();
        }
    }, [fetchCustomerInfo]);



    const handleSubmit = async (e) => {
        e.preventDefault();

        const branchData = JSON.parse(localStorage.getItem("branch")) || {};
        const branchId = branchData?.branch_id;
        const customerId = branchData?.customer_id;
        const token = localStorage.getItem("branch_token");

        try {
            if (!clientInput || !data.length) {
                Swal.fire({
                    icon: "warning",
                    title: "Incomplete Data",
                    text: "Please ensure all required fields are filled before submitting.",
                });
                return;
            }

            const requestBody = {
                branch_id: branchId,
                customer_id: customerId,
                _token: token,
                applications: data.map(app => ({
                    ...app,
                    purpose_of_application: clientInput.purpose_of_application,
                    nationality: clientInput.nationality
                })),
                services: clientInput.services,
                package: clientInput.package,
                ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
            };


            const response = await fetch(
                "https://api.goldquestglobal.in/branch/candidate-application/bulk-create",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                    redirect: "follow",
                }
            );

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                throw new Error("Invalid response format from server.");
            }

            // Update token if provided in the response
            const updatedToken = result.token || result._token || "";
            if (updatedToken) {
                localStorage.setItem("branch_token", updatedToken);
            }

            if (response.ok && result.status) {
                Swal.fire({
                    icon: "success",
                    title: "Submission Successful",
                    text: result.message || "The data has been submitted successfully.",
                    confirmButtonText: "OK",
                }).then((res) => {
                    if (res.isConfirmed) {
                        navigate("/user-candidateManager");
                    }
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Submission Failed",
                    text: result.message || "Failed to submit the data.",
                });
            }

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: `An error occurred during submission: ${error.message}`,
            });
            console.error("Error during submission:", error);
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
    const handleFileUpload = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const isCSV = fileExtension === 'csv';
        const isExcel = fileExtension === 'xls' || fileExtension === 'xlsx';

        if (isCSV) {
            const reader = new FileReader();
            reader.onload = () => {
                const fileContent = reader.result;
                setFileName(file.name);
                setIsFileValid(true);
                const parsedData = parseCSV(fileContent);
                const csvHeaders = csvHeadings(fileContent);

                processFileData(parsedData, csvHeaders);
            };
            reader.readAsText(file);
        } else if (isExcel) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const parsedData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                const csvHeaders = Object.keys(parsedData[0] || {}); // Extract headers from the first row
                setFileName(file.name);
                setIsFileValid(true);

                processFileData(parsedData, csvHeaders);
            };
            reader.readAsArrayBuffer(file);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File',
                text: 'Please upload a valid CSV or Excel file (.csv, .xls, .xlsx).',
            });
        }
    };

    const processFileData = (parsedData, csvHeaders) => {

        // Convert CSV headers: lowercase + replace spaces with underscores
        const formattedHeaders = csvHeaders.map(header =>
            header.toLowerCase().replace(/\s+/g, '_') // Replace spaces with underscores
        );


        const newData = [];
        let hasError = false;

        parsedData.forEach((row, index) => {

            const values = Object.values(row).map(value => (value ? value.toString().trim() : ''));

            const allEmpty = values.every(val => val === '');
            const someEmpty = values.some(val => val === '') && !allEmpty;

            if (allEmpty) {
                return;
            } else if (someEmpty) {

                setFileName('');
                setIsFileValid(false);
                hasError = true;

                const missingFields = formattedHeaders.filter((header, i) => !values[i] || values[i] === '');

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Row ${index + 1} is incomplete. Missing fields: ${missingFields.join(', ')}`,
                });
            } else {

                // Ensure keys in the row match formatted headers
                const formattedRow = {};
                formattedHeaders.forEach((header, i) => {
                    formattedRow[header] = values[i] || '';
                });

                newData.push(cleanFieldNames(formattedRow));
            }
        });

        if (!hasError) {
            setData(newData);
        } else {
        }
    };






    const cleanFieldNames = (row) => {
        const cleanedRow = {};
        Object.keys(row).forEach((key) => {
            const cleanKey = key.replace(/^_+|_+$/g, ''); // Remove leading and trailing underscores
            cleanedRow[cleanKey] = row[key];
        });
        return cleanedRow;
    };

    const csvHeadings = (csv) => {
        const rows = csv.split('\n');
        const headers = rows[0].split(','); // Get headers (first row)
        return headers.map((header) => header);
    };

    const parseCSV = (csv) => {
        const rows = csv.split('\n');
        const headers = rows[0].split(','); // Get headers (first row)
        const dataArray = rows.slice(1).map((row) => {
            const values = row.split(',');
            let rowObject = {};
            headers.forEach((header, index) => {
                const formattedHeader = formatKey(header);
                rowObject[formattedHeader] = values[index] ? values[index].trim() : '';
            });
            return rowObject;
        });
        return dataArray;
    };

    const formatKey = (key) => {
        // Convert to lowercase, remove special characters, replace spaces with underscores, and double underscores with a single one
        return key
            .toLowerCase()                    // Convert to lowercase
            .replace(/[^a-z0-9\s_]/g, '')      // Remove special characters
            .replace(/\s+/g, '_')              // Replace spaces with underscores
            .replace(/__+/g, '_');             // Replace double underscores with single
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

    return (

        <div className="w-10/12 m-auto" ref={candidateEditRef} id="candidateedit" >
            <h2 className="text-2xl font-bold py-3 text-center text-[#4d606b] px-3  ">CANDIDATE BULK UPLOAD </h2>
            <form onSubmit={handleSubmit} className='py-5'>

                <div className="md:grid gap-4 grid-cols-2 mb-4">

                    <div className="col bg-white shadow-md rounded-md p-3 md:p-6">
                        <div className="w-full">
                            <div className="file-upload-wrapper text-left">
                                {/* Custom Button */}
                                <button
                                    type="button"
                                    onClick={() => document.getElementById("fileInput").click()}
                                    className="upload-button"
                                >
                                    Upload CSV
                                </button>

                                {/* Hidden Input */}
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept=".csv,.xlsx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />


                                {/* Display File Name Conditionally */}
                                <input
                                    type="text"
                                    value={isFileValid ? fileName : ""}
                                    placeholder="No file selected"
                                    readOnly
                                    className="file-name-input mt-4 p-2 border rounded w-full"
                                />
                            </div>
                            {errors.organizationName && <p className="text-red-500 text-sm">{errors.organizationName}</p>}
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
                        <div className="mb-4">
                            <label htmlFor="email" className='text-sm'>Nationality<span className='text-red-500'>*</span></label>
                            <select name="nationality" onChange={handleChange} value={clientInput.nationality} className="border w-full rounded-md p-2 mt-2" id="nationality">
                                <option value="">Select Nationality</option>
                                <option value="Indian">Indian</option>
                                <option value="Other">Other</option> {/* Correct option for "Other" */}
                            </select>
                            {errors.nationality && <p className='text-red-500'>{errors.nationality}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`p-6 py-3 bg-[#2c81ba] text-white font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {handleEditClick ? 'Edit' : 'Submit'}
                        </button>
                    </div>



                    <div className="col bg-white shadow-md rounded-md p-3 md:p-6 md:mt-0 mt-5">
                        <div className="flex flex-wrap flex-col-reverse">
                            <div className='mt-4 md:h-[450px] h-[200px] overflow-auto'>
                                <h2 className='bg-[#3e76a5] rounded-md p-4 text-white mb-4 hover:bg-[#3e76a5]'>Service Names</h2>
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
            </form>
        </div>
    );
};

export default CandidateBulkUpload;


