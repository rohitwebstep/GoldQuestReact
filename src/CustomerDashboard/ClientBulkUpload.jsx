import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MultiSelect } from "react-multi-select-component";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx'; // Ensure you have xlsx installed
import axios from 'axios';
import  Customer  from '../Middleware/Customer';


const ClientBulkUpload = () => {
    const [fileName, setFileName] = useState("");
    const [isFileValid, setIsFileValid] = useState(false);
    const navigate = useNavigate();
    const [newData, setNewData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const clientEditRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 10; const storedToken = localStorage.getItem('token');
    const [branchData, setBranchData] = useState(null);
    const [errors, setErrors] = useState({});
    const [spocID, setSpocID] = useState('');
    const [spocName, setSpocName] = useState('');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState([]);
    const [organisationName, setOrganisationName] = useState('');
    const [handleEditClick, setHandleEditClick] = useState('');
    const [ApplicationId, setCandidateApplicationId] = useState('');
    const [formData, setFormData] = useState({})
    const [data, setData] = useState([]);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalServices, setModalServices] = React.useState([]);

    const allServices = services.flatMap((group, groupIndex) =>
        group.services.map((service, serviceIndex) => ({
            ...service,
            groupSymbol: group.group_symbol || group.group_title,
            index: serviceIndex,
            groupIndex,
        }))
    );
    const totalEntries = allServices.length;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    // Get current page services
    const startIndex = (currentPage - 1) * entriesPerPage;
    const currentServices = allServices.slice(startIndex, startIndex + entriesPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const branch_id = JSON.parse(localStorage.getItem("branch"))?.id;
    const customer_id = JSON.parse(localStorage.getItem("branch"))?.customer_id;
    const _token = localStorage.getItem("branch_token");

    const fetchCustomerInfo = useCallback(async () => {
        setLoading(true);
        if (!branchData) return;
        const requestData = {
            customer_id: customer_id,
            branch_id: branch_id,
            _token:_token
          };
          if (branchData?.branch_id) {
            requestData.sub_user_id = branchData.id;
          }
        const url = `https://api.goldquestglobal.in/branch/candidate-application/listings,${requestData}`;

        try {
            const response = await fetch(url);
            if (response.ok) {
                setLoading(false);
                const result = await response.json();
                const newToken = result.token || result._token || '';
                if (newToken) {
                    localStorage.setItem("branch_token", newToken);
                }

                setTableData(result.data.candidateApplications);
                const customerInfo = result.data.customer;
                const services = customerInfo.services ? JSON.parse(customerInfo.services) : [];
                setServices(services);
                setFormData(prevFormData => ({
                    ...prevFormData,
                    organizationName: customerInfo.name || '',
                }));

                setOrganisationName(customerInfo.name);
                const spocDetails = result.data.customer.spoc_details?.map(spoc => ({
                    id: spoc.id,
                    name: spoc.name,
                }));

                setSpocID(result.data.customer.spoc_details[0].id);
                setSpocName(result.data.customer.spoc_details[0].name);
            } else {
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    }, [branchData]);

    useEffect(() => {
        const initialize = async () => {
            try {
                await Customer();
                await fetchCustomerInfo();
            } catch (error) {
                console.error(error.message);
                navigate('/customer-login');
            }
        };

        initialize();
    }, [fetchCustomerInfo, navigate]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!branchData) {
                setLoading(false);
                return Swal.fire({
                    icon: "warning",
                    title: "Missing Branch Data",
                    text: "Please select a branch before submitting.",
                });
            }

            const branch_id = JSON.parse(localStorage.getItem("branch"))?.id;
            const customer_id = JSON.parse(localStorage.getItem("branch"))?.customer_id;
            const _token = localStorage.getItem("branch_token");

            // Extract selected service IDs
            const selectedServiceIds = services
                .flatMap((group) => group.services)
                .filter((service) => service.isSelected)
                .map((service) => service.serviceId)
                .join(",");

            // Validate required data
            if (
                !branch_id ||
                !customer_id ||
                !_token ||
                !data ||
                data.length === 0 ||
                !selectedServiceIds
            ) {
                setLoading(false);
                return Swal.fire({
                    icon: "error",
                    title: "Incomplete Data",
                    text: "All required fields must be completed before submitting.",
                });
            }


            // Construct request payload
            const requestBody = {
                branch_id,
                customer_id,
                _token: _token,
                applications: data,
                services: selectedServiceIds,
                package: "xyz", // Replace "xyz" with dynamic data if required
            };

            // Make the API request
            const response = await fetch(
                "https://api.goldquestglobal.in/branch/client-application/bulk-create",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                    redirect: "follow",
                }
            );

            const result = await response.json();

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
                    confirmButtonText: "OK", // Customize the button text
                }).then((result) => {
                    if (result.isConfirmed) {
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
        } finally {
            setLoading(false);
        }
    };




    const selectPackageById = (selectedPackageIds) => {
        services.forEach(group => {
            group.services.forEach(service => {
                const matchingPackage = service.packages.some(pkg => selectedPackageIds.includes(pkg.name));

                service.isSelected = matchingPackage;
            });
        });

    };

    const handlePackageChange = (selectedOptions) => {
        const selectedPackageIds = selectedOptions.map(option => option.value); 

        if (selectedPackageIds.length === 0) {
            services.forEach(group => {
                group.services.forEach(service => {
                    service.isSelected = false;
                });
            });
        } else {
            selectPackageById(selectedPackageIds);
        }

        setFormData({
            ...formData,
            package: selectedPackageIds
        });
    };

    const handleCheckboxChange = (serviceIndex, groupIndex) => {
        const updatedServices = [...services];

        const service = updatedServices[groupIndex].services[serviceIndex];
        service.isSelected = !service.isSelected;

        setServices(updatedServices); 
    };
    const uniquePackages = [
        ...new Set(
            services
                .flatMap(group => group.services.flatMap(service =>
                    service.packages.map(pkg => ({ id: pkg.id, name: pkg.name }))
                ))
        )
    ];

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/csv') {

            const reader = new FileReader();
            reader.onload = () => {
                const fileContent = reader.result;
                setFileName(file.name);
                setIsFileValid(true);
                const parsedData = parseCSV(fileContent);
                const csvHeaders = csvHeadings(fileContent); // Ass-uming csvHeadings correctly returns column headers.

                const newData = [];
                let hasError = false;

                // Validate and process data
                parsedData.forEach((row, index) => {
                    const values = Object.values(row).map((value) => value.trim());
                    const allEmpty = values.every((val) => val === '');
                    const someEmpty = values.some((val) => val === '') && !allEmpty;

                    if (allEmpty) {
                    } else if (someEmpty) {
                        setFileName('');
                        setIsFileValid(false);
                        hasError = true;

                        // Check which fields are missing
                        const missingFields = csvHeaders.filter((header, i) => !values[i] || values[i] === '');
                        const errorMessage = `Row ${index + 1} is incomplete. Missing fields: ${missingFields.join(', ')}`;

                        // Display the error
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: errorMessage,
                        });
                    } else {
                        newData.push(cleanFieldNames(row)); // Only add valid rows
                    }
                });

                if (hasError) {
                    return;
                }

                // Set valid data if no errors
                setData(newData);
            };

            reader.readAsText(file);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File',
                text: 'Please upload a valid CSV file.',
            });
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
    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    return (

        <div className="bg-[#c1dff2]" ref={clientEditRef} id="clientedit" >
            <h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">CLIENT BULK UPLOAD </h2>
            <div className="bg-white p-12 w-full mx-auto">

                <form className="space-y-4 w-full text-center" onSubmit={handleSubmit}>
                    <div className='flex space-x-4'>
                        <div className="w-2/5">
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
                                        accept=".csv"
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
                            <div className='flex justify-center gap-5 mt-10 items-center'>
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`p-6 py-3 bg-[#2c81ba] text-white font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {handleEditClick ? 'Edit' : 'Submit'}

                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className='w-3/5'>
                            <div className="space-y-4 m-auto w-full  bg-white rounded-md">
                                <MultiSelect
                                    options={Array.from(new Set(uniquePackages.map(pkg => pkg.name)))
                                        .map(name => ({ label: name, value: name }))
                                    }
                                    value={Array.isArray(formData.package) ? formData.package.map(pkg => ({ label: pkg, value: pkg })) : []}
                                    onChange={handlePackageChange}
                                    isMulti
                                    placeholder="--PACKAGE OPTIONS--"
                                    className="rounded-md p-2.5"
                                />

                            </div>
                            <div className='p-2.5'>
                                <table className="m-auto w-full border-collapse border rounded-lg">
                                    <thead>
                                        <tr className="bg-[#c1dff2] text-[#4d606b]">
                                            <th className=" uppercase border px-4 py-2">SERVICE</th>
                                            <th className=" uppercase border px-4 py-2">SERVICE CODE</th>
                                            <th className=" uppercase border px-4 py-2">SERVICE NAMES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (

                                            <tr>
                                                <td colSpan={6} className="py-4 text-center text-gray-500">
                                                    <Loader className="text-center" />
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {currentServices.map((service) => (
                                                    <tr className="text-center" key={service.serviceId}>
                                                        <td className="border px-4 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={service.isSelected || false}
                                                                name="services[]"
                                                                onChange={() =>
                                                                    handleCheckboxChange(service.index, service.groupIndex)
                                                                }
                                                            />
                                                        </td>
                                                        <td className="border px-4 py-2">
                                                            {service.serviceCode}
                                                        </td>
                                                        <td className="border px-4 text-left py-2">{service.serviceTitle}</td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-center mt-4 space-x-2">
                                <button
                                    type='button'
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                {(() => {
                                    const maxPagesToShow = 3; // Maximum page numbers to display
                                    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                                    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                                    // Adjust if we are close to the beginning or end
                                    if (endPage - startPage + 1 < maxPagesToShow) {
                                        startPage = Math.max(1, endPage - maxPagesToShow + 1);
                                    }

                                    const pages = [];
                                    if (startPage > 1) {
                                        pages.push(
                                            <button
                                                type='button'
                                                key={1}
                                                onClick={() => handlePageChange(1)}
                                                className="px-4 py-2 bg-gray-200 rounded"
                                            >
                                                1
                                            </button>
                                        );
                                        if (startPage > 2) {
                                            pages.push(<span key="start-ellipsis">...</span>);
                                        }
                                    }

                                    for (let page = startPage; page <= endPage; page++) {
                                        pages.push(
                                            <button
                                                type='button'
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-4 py-2 ${currentPage === page
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-200"
                                                    } rounded`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    }

                                    if (endPage < totalPages) {
                                        if (endPage < totalPages - 1) {
                                            pages.push(<span key="end-ellipsis">...</span>);
                                        }
                                        pages.push(
                                            <button
                                                type='button'
                                                key={totalPages}
                                                onClick={() => handlePageChange(totalPages)}
                                                className="px-4 py-2 bg-gray-200 rounded"
                                            >
                                                {totalPages}
                                            </button>
                                        );
                                    }

                                    return pages;
                                })()}

                                <button
                                    type='button'
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ClientBulkUpload;


