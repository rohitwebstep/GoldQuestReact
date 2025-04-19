import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2'
import axios from 'axios';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useApiCall } from '../../ApiCallContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const GenerateReport = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [servicesForm, setServicesForm] = useState('');
    const [applicationRefID, setApplicationRefID] = useState('');
    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [servicesData, setServicesData] = useState([]);
    const [branchInfo, setBranchInfo] = useState([]);
    const [customerInfo, setCustomerInfo] = useState([]);
    const [referenceId, setReferenceId] = useState("");
    const [sortingOrder, setSortingOrder] = useState([]);
    const [adminNames, setAdminNames] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    const [formData, setFormData] = useState({
        updated_json: {
            month_year: '',
            initiation_date: '', // Sets current date in YYYY-MM-DD format
            organization_name: '',
            verification_purpose: '',
            employee_id: '',
            client_code: '',
            applicant_name: '',
            contact_number: '',
            contact_number2: '',
            father_name: '',
            dob: '',
            customPurpose: '',
            gender: '',
            marital_status: '',
            nationality: '',
            insuff: '',
            address: {
                address: '',
                landmark: '',
                residence_mobile_number: '',
                state: '',
            },
            permanent_address: {
                permanent_address: '',
                permanent_sender_name: '',
                permanent_reciever_name: '',
                permanent_landmark: '',
                permanent_pin_code: '',
                permanent_state: '',
            },
            insuffDetails: {
                have_not_insuff: '',
                first_insufficiency_marks: '',
                first_insuff_date: '',
                first_insuff_reopened_date: '',
                overall_status: '',
                report_date: '',
                report_status: '',
                report_type: '',
                final_verification_status: '',
                is_verify: '',
                deadline_date: '',
                insuff_address: '',
                basic_entry: '',
                education: '',
                case_upload: '',
                emp_spoc: '',
                report_generate_by: '',
                qc_done_by: '',
                delay_reason: '',
            },
        },
    });
    useEffect(() => {
        setFormData(prevFormData => ({
            ...prevFormData,
            updated_json: {
                ...prevFormData.updated_json,
                initiation_date: prevFormData.updated_json.initiation_date || new Date().toISOString().split('T')[0]
            }
        }));
    }, []);
    useEffect(() => {
        const currentDate = new Date();
        const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        setFormData(prevFormData => ({
            ...prevFormData,
            updated_json: {
                ...prevFormData.updated_json,
                month_year: prevFormData.updated_json.month_year || monthYear,
            }
        }));
    }, []);

    const [selectedStatuses, setSelectedStatuses] = useState([]);
    useEffect(() => {
        if (servicesDataInfo && servicesDataInfo.length > 0) {

            if (selectedStatuses.length === 0 || selectedStatuses.length !== servicesDataInfo.length) {
                const initialStatuses = servicesDataInfo.map((serviceData) => {

                    return serviceData?.annexureData?.status || '';
                });
                setSelectedStatuses(initialStatuses);
            }
        }
    }, [servicesDataInfo]); // Only trigger when `servicesDataInfo` changes

    const handleStatusChange = (e, index) => {
        const updatedStatuses = [...selectedStatuses];
        updatedStatuses[index] = e.target.value;
        setSelectedStatuses(updatedStatuses);
        setFormData(prevFormData => {
     

            const updatedFormData = {
                ...prevFormData,
                updated_json: {
                    ...prevFormData.updated_json,
                    insuffDetails: {
                        ...prevFormData.updated_json.insuffDetails,
                        overall_status: allCompleted
                            ? prevFormData.updated_json.insuffDetails.overall_status // Keep existing value if allCompleted is true
                            : "" // Reset to empty if allCompleted is false
                    }
                }
            };


            return updatedFormData;
        });

    };

    const handleSortingOrderChange = (e, index) => {
        const newSortingOrder = e.target.value;

        setSortingOrder((prevState) => {

            const updatedState = { ...prevState }; // Ensure we are working with an object
            updatedState[index] = newSortingOrder; // Update if exists, or add if not

            return updatedState;
        });
    };

    let allCompleted = false;

    // Ensure we're looking for any statuses that are truly "completed" (e.g., "completed_*" or just "completed")
    allCompleted = selectedStatuses
        .filter(status => status !== "") // Remove empty statuses
        .every(status =>
            status.startsWith("completed") ||
            status.startsWith("initiated") ||
            status.toLowerCase() === "nil"
        );
    // Only consider "completed" prefixes




    const handleFileChange = (index, dbTable, fileName, e) => {

        const selectedFiles = Array.from(e.target.files);

        // Update the state with the new selected files
        setFiles((prevFiles) => ({
            ...prevFiles,
            [dbTable]: { selectedFiles, fileName },
        }));
    };

    const applicationId = new URLSearchParams(window.location.search).get('applicationId');
    const branchid = new URLSearchParams(window.location.search).get('branchid');

    // Set referenceId only once when applicationId changes
    useEffect(() => {
        if (applicationId) setReferenceId(applicationId);
    }, [applicationId]); // Only rerun when applicationId changes

    const fetchServicesJson = useCallback(async (servicesList) => {
        setIsApiLoading(true);  // Start global loading
        setLoading(true);       // Set specific loading state

        try {
            const adminData = JSON.parse(localStorage.getItem("admin"));
            const adminId = adminData?.id;
            const token = localStorage.getItem("_token");

            // Return an empty array if servicesList is empty or undefined
            if (!servicesList || servicesList.length === 0) {
                console.warn("Services list is empty.");
                setLoading(false); // Stop loading for this operation
                setIsApiLoading(false); // Stop global loading
                return [];
            }

            // Ensure necessary parameters are available
            if (!adminId || !token) {
                console.error("Missing admin ID or token.");
                setLoading(false); // Stop loading for this operation
                setIsApiLoading(false); // Stop global loading
                return [];
            }

            const requestOptions = {
                method: "GET",
                redirect: "follow",
            };

            // Construct the URL with service IDs
            const url = new URL("https://api.goldquestglobal.in/client-master-tracker/services-annexure-data");
            url.searchParams.append("service_ids", servicesList);
            url.searchParams.append("application_id", applicationId);
            url.searchParams.append("admin_id", adminId);
            url.searchParams.append("_token", token);

            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                console.error("Failed to fetch service data:", response.statusText);
                setLoading(false); // Stop loading for this operation
                setIsApiLoading(false); // Stop global loading
                return [];
            }

            const result = await response.json();

            // Update the token if a new one is provided
            const newToken = result.token || result._token || "";
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            // Handle invalid or expired token
            if (result.message && result.message.startsWith("INVALID TOKEN")) {
                Swal.fire({
                    title: "Session Expired",
                    text: "Your session has expired. Please log in again.",
                    icon: "warning",
                    confirmButtonText: "Ok",
                }).then(() => {
                    // Redirect to admin login page
                    window.location.href = "/admin-login"; // Replace with your login route
                });
                setLoading(false); // Stop loading for this operation
                setIsApiLoading(false); // Stop global loading
                return;
            }

            // Filter out null or invalid items
            const filteredResults = result.results?.filter((item) => item != null) || [];

            const sortedFilteredResults = filteredResults.sort((a, b) => {
                // Use optional chaining to check if annexureData exists
                const orderA = parseInt(a?.annexureData?.sorting_order) || Number.MAX_SAFE_INTEGER;
                const orderB = parseInt(b?.annexureData?.sorting_order) || Number.MAX_SAFE_INTEGER;

                return orderA - orderB;
            });

            setServicesDataInfo(sortedFilteredResults); // Set service data
            return sortedFilteredResults;


        } catch (error) {
            console.error("Error fetching service data:", error);
            setLoading(false); // Stop loading for this operation
            setIsApiLoading(false); // Stop global loading
            return [];
        } finally {
            // Ensure loading is stopped in all cases
            setLoading(false); // Stop loading for this operation
            setIsApiLoading(false); // Stop global loading
        }
    }, [applicationId, setServicesDataInfo]); // Add dependencies where necessary


    useEffect(() => {
        if (!isApiLoading) {
            fetchServicesJson();
        }
    }, [fetchServicesJson]);

    function parseAndConvertDate(inputDate) {
        let parsedDate = new Date(inputDate);

        if (isNaN(parsedDate)) {
            if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(inputDate)) {
                parsedDate = new Date(inputDate);
            } else if (/\d{4}\/\d{2}\/\d{2}/.test(inputDate)) {
                parsedDate = new Date(inputDate.replace(/\//g, '-'));
            } else if (/\d{2}-\d{2}-\d{4}/.test(inputDate)) {
                const [day, month, year] = inputDate.split('-');
                parsedDate = new Date(`${year}-${month}-${day}`);
            } else {
                parsedDate = 'N/A';
            }
        }

        // Format the date to 'YYYY-MM-DD' format
        const formattedDate = parsedDate.toISOString().split('T')[0]; // Extracts only the date portion
        return formattedDate;
    }


    const fetchApplicationData = useCallback(() => {
        setIsApiLoading(true)

        setLoading(true);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`https://api.goldquestglobal.in/client-master-tracker/application-by-id?application_id=${applicationId}&branch_id=${branchid}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => {
                return response.json()
            })
            .then((result) => {
                const newToken = result.token || result._token || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Save the new token in localStorage
                }

                // Check for error message in response
                if (result.message && result.message.toLowerCase().startsWith("message")) {
                    Swal.fire({
                        title: "Error",
                        text: result.message || "An unknown error occurred.",
                        icon: "error",
                        confirmButtonText: "Ok",
                    }).finally(() => {
                        setLoading(false);
                    });
                    return; // Exit early if there's an error
                }


                if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        window.location.href = "/admin-login"; // Redirect to admin login page
                    });
                    return; // Stop further execution if token expired
                }
                // If no token expired error, proceed with data
                const applicationData = result.application;
                const cmtData = result.CMTData || [];
                const services = applicationData.services;
                fetchServicesJson(services); // Fetch services JSON
                setServicesForm(services); // Set services form
                setServicesData(result); // Set services data
                setBranchInfo(result.branchInfo); // Set branch info
                setCustomerInfo(result.customerInfo); // Set customer info
                setApplicationRefID(applicationData.application_id); // Set application ref ID
                setAdminNames(result.admins); // Set admin names

                // Set the form data
                // Helper function to validate and format dates
                const getValidDate = (dateStr) => {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        return date; // If the date is valid, return the Date object
                    }
                    return null; // Return null if the date is invalid
                };

                const isValidMonthYear = (monthYear) => {
                    // Check if monthYear is a valid month (1 to 12)
                    const month = parseInt(monthYear, 10);

                    // Return false if month is invalid (not between 1 and 12)
                    if (isNaN(month) || month < 1 || month > 12) {
                        return false;
                    }
                    return true;
                };

                const formatMonthYear = (monthStr, year = 2025) => {
                    const month = parseInt(monthStr, 10);

                    if (month < 1 || month > 12) {
                        return ''; // Invalid month
                    }

                    const date = new Date(year, month - 1); // Month is 0-indexed in JavaScript
                    const options = { year: 'numeric', month: 'long' };

                    return date.toLocaleString('en-US', options); // "Month Year"
                };

                // If the monthYear is valid, format it; otherwise, skip updating
                setFormData(prevFormData => {
                    // Check if cmtData.month_year is valid, otherwise use applicationData or fallback
                    const monthYear = cmtData.month_year || applicationData.month_year || prevFormData.updated_json.month_year || '';

                    // If the monthYear is valid, format it; otherwise, skip updating
                    const formattedMonthYear = isValidMonthYear(monthYear) ? formatMonthYear(monthYear, 2025) : prevFormData.updated_json.month_year;

                    return {
                        updated_json: {
                            month_year: formattedMonthYear || prevFormData.updated_json.month_year || '',

                            organization_name: applicationData.customer_name || prevFormData.updated_json.organization_name || '',
                            verification_purpose: applicationData.purpose_of_application || prevFormData.updated_json.verification_purpose || '',
                            employee_id: applicationData.employee_id || prevFormData.updated_json.employee_id || '',
                            client_code: applicationData.application_id || prevFormData.updated_json.client_code || '',
                            applicant_name: applicationData.name || prevFormData.updated_json.applicant_name || '',
                            contact_number: cmtData.contact_number || prevFormData.updated_json.contact_number || '',
                            contact_number2: cmtData.contact_number2 || prevFormData.updated_json.contact_number2 || '',
                            father_name: cmtData.father_name || prevFormData.updated_json.father_name || '',
                            initiation_date: cmtData.initiation_date || prevFormData.updated_json.initiation_date,


                            gender: cmtData.gender || prevFormData.updated_json.gender || '',
                            dob: (cmtData.dob && !isNaN(new Date(cmtData.dob).getTime()))
                                ? new Date(cmtData.dob).toISOString().split('T')[0] // Format as YYYY-MM-DD
                                : (prevFormData.updated_json.insuffDetails.dob
                                    ? new Date(prevFormData.updated_json.insuffDetails.dob).toISOString().split('T')[0]
                                    : ''),

                            marital_status: cmtData.marital_status || prevFormData.updated_json.marital_status || '',
                            nationality: cmtData.nationality || prevFormData.updated_json.nationality || '',
                            insuff: cmtData.insuff || prevFormData.updated_json.insuff || '',
                            address: {
                                address: cmtData.address || prevFormData.updated_json.address.address || '',
                                landmark: cmtData.landmark || prevFormData.updated_json.address.landmark || '',
                                residence_mobile_number: cmtData.residence_mobile_number || prevFormData.updated_json.address.residence_mobile_number || '',
                                state: cmtData.state || prevFormData.updated_json.address.state || '',
                            },
                            permanent_address: {
                                permanent_address: cmtData.permanent_address || prevFormData.updated_json.permanent_address.permanent_address || '',
                                permanent_sender_name: cmtData.permanent_sender_name || prevFormData.updated_json.permanent_address.permanent_sender_name || '',
                                permanent_receiver_name: cmtData.permanent_receiver_name || prevFormData.updated_json.permanent_address.permanent_receiver_name || '',
                                permanent_landmark: cmtData.permanent_landmark || prevFormData.updated_json.permanent_address.permanent_landmark || '',
                                permanent_pin_code: cmtData.permanent_pin_code || prevFormData.updated_json.permanent_address.permanent_pin_code || '',
                                permanent_state: cmtData.permanent_state || prevFormData.updated_json.permanent_address.permanent_state || '',
                            },
                            insuffDetails: {
                                have_not_insuff: cmtData.have_not_insuff || applicationData.have_not_insuff || prevFormData.updated_json.have_not_insuff || '',

                                first_insufficiency_marks: cmtData.first_insufficiency_marks || prevFormData.updated_json.insuffDetails.first_insufficiency_marks || '',
                                first_insuff_date: (cmtData.first_insuff_date && !isNaN(new Date(cmtData.first_insuff_date).getTime()))
                                    ? new Date(cmtData.first_insuff_date).toISOString().split('T')[0] // Format as YYYY-MM-DD
                                    : (prevFormData.updated_json.insuffDetails.first_insuff_date
                                        ? new Date(prevFormData.updated_json.insuffDetails.first_insuff_date).toISOString().split('T')[0]
                                        : ''),

                                first_insuff_reopened_date: (cmtData.first_insuff_reopened_date && !isNaN(new Date(cmtData.first_insuff_reopened_date).getTime()))
                                    ? parseAndConvertDate(cmtData.first_insuff_reopened_date)
                                    : (prevFormData.updated_json.insuffDetails.first_insuff_reopened_date
                                        ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.first_insuff_reopened_date)
                                        : ''),
                                overall_status: cmtData.overall_status || prevFormData.updated_json.insuffDetails.overall_status || '',
                                report_date: (cmtData.report_date && !isNaN(new Date(cmtData.report_date).getTime()))
                                    ? new Date(cmtData.report_date).toISOString().split('T')[0]
                                    : (prevFormData.updated_json.insuffDetails.report_date
                                        ? new Date(prevFormData.updated_json.insuffDetails.report_date).toISOString().split('T')[0]
                                        : ''),

                                report_status: cmtData.report_status || prevFormData.updated_json.insuffDetails.report_status || '',
                                report_type: cmtData.report_type || prevFormData.updated_json.insuffDetails.report_type || '',
                                final_verification_status: cmtData.final_verification_status || prevFormData.updated_json.insuffDetails.final_verification_status || '',
                                is_verify: cmtData.is_verify || prevFormData.updated_json.insuffDetails.is_verify || '',

                                deadline_date: (cmtData.deadline_date && !isNaN(new Date(cmtData.deadline_date).getTime()))
                                    ? new Date(cmtData.deadline_date).toISOString().split('T')[0]
                                    : (prevFormData.updated_json.insuffDetails.deadline_date
                                        ? new Date(prevFormData.updated_json.insuffDetails.deadline_date).toISOString().split('T')[0]
                                        : ''),

                                insuff_address: cmtData.insuff_address || prevFormData.updated_json.insuffDetails.insuff_address || '',
                                basic_entry: cmtData.basic_entry || prevFormData.updated_json.insuffDetails.basic_entry || '',
                                education: cmtData.education || prevFormData.updated_json.insuffDetails.education || '',
                                case_upload: cmtData.case_upload || prevFormData.updated_json.insuffDetails.case_upload || '',
                                emp_spoc: cmtData.emp_spoc || prevFormData.updated_json.insuffDetails.emp_spoc || '',
                                report_generate_by: cmtData.report_generate_by || prevFormData.updated_json.insuffDetails.report_generate_by || '',
                                qc_done_by: cmtData.qc_done_by || prevFormData.updated_json.insuffDetails.qc_done_by || '',
                                delay_reason: cmtData.delay_reason || prevFormData.updated_json.insuffDetails.delay_reason || '',
                            }

                        },
                    }
                });

            })
            .catch((error) => {
            }).finally(() => {
                setLoading(false); // End loading
                setIsApiLoading(false)

            });

    }, [applicationId, branchid, fetchServicesJson, setServicesForm, setServicesData, setBranchInfo, setCustomerInfo, setFormData]);

    useEffect(() => {
        if (!isApiLoading) {
            fetchApplicationData();
        }

    }, [fetchApplicationData]);
    const handleCustomInputChange = (e) => {
        const { name, value } = e.target;

     

        setFormData(prevFormData => ({
            ...prevFormData,
            updated_json: {
                ...prevFormData.updated_json,
                verification_purpose: value,
            }
        }));

        if (value === 'CUSTOM') {
            setIsModalOpen(true);
        } else {
            setIsModalOpen(false);
        }
    };

    const handleSaveCustomState = () => {
        if (formData.updated_json.customPurpose) {
            setFormData(prevFormData => ({
                ...prevFormData,
                updated_json: {
                    ...prevFormData.updated_json,
                    verification_purpose: formData.updated_json.customPurpose,
                }
            }));
            setIsModalOpen(false); // Close the modal after saving
        }
    };



    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;  // Destructure `type` and `checked`

        setFormData((prevFormData) => {
            const updatedFormData = { ...prevFormData };

            // Check if the field is a checkbox
            if (type === "checkbox") {
                // For checkboxes, update the value with `checked`
                if (name.startsWith('updated_json.address.')) {
                    const addressField = name.replace('updated_json.address.', '');
                    updatedFormData.updated_json.address[addressField] = checked;
                } else if (name.startsWith('updated_json.permanent_address.')) {
                    const permanentField = name.replace('updated_json.permanent_address.', '');
                    updatedFormData.updated_json.permanent_address[permanentField] = checked;
                } else if (name.startsWith('updated_json.insuffDetails.')) {
                    const insuffField = name.replace('updated_json.insuffDetails.', '');
                    updatedFormData.updated_json.insuffDetails[insuffField] = checked;
                } else {
                    const topLevelField = name.replace('updated_json.', '');
                    updatedFormData.updated_json[topLevelField] = checked;
                }
            } else {
                // For other input types (text, select, etc.), update the value normally
                if (name.startsWith('updated_json.address.')) {
                    const addressField = name.replace('updated_json.address.', '');
                    updatedFormData.updated_json.address[addressField] = value;
                } else if (name.startsWith('updated_json.permanent_address.')) {
                    const permanentField = name.replace('updated_json.permanent_address.', '');
                    updatedFormData.updated_json.permanent_address[permanentField] = value;
                } else if (name.startsWith('updated_json.insuffDetails.')) {
                    const insuffField = name.replace('updated_json.insuffDetails.', '');
                    updatedFormData.updated_json.insuffDetails[insuffField] = value;
                } else {
                    const topLevelField = name.replace('updated_json.', '');
                    updatedFormData.updated_json[topLevelField] = value;
                }
            }

            return updatedFormData;
        });
    };

    // const fetchAdminList = useCallback(() => {
    //     setIsApiLoading(true);  // Start the global loading state
    //     setLoading(true);  // Start specific loading state

    //     // Get admin ID and token from localStorage
    //     const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    //     const storedToken = localStorage.getItem("_token");

    //     // Check if admin_id or storedToken is missing
    //     if (!admin_id || !storedToken) {
    //         console.error("Admin ID or token is missing.");
    //         setLoading(false);  // Stop loading state if conditions are not met
    //         setIsApiLoading(false);  // Stop global loading state as well
    //         return;  // Exit early if missing data
    //     }

    //     // Construct the URL with query parameters
    //     const url = `https://api.goldquestglobal.in/admin/list?admin_id=${admin_id}&_token=${storedToken}`;

    //     const requestOptions = {
    //         method: 'GET',  // GET request doesn't need a body
    //         redirect: 'follow', // Handling redirects, if any
    //     };

    //     fetch(url, requestOptions)
    //         .then((response) => response.json())  // Ensure the response is parsed correctly
    //         .then((result) => {
    //             // Handle the case where the result is empty, null, or undefined
    //             if (!result || typeof result !== 'object') {
    //                 throw new Error('Invalid response format');
    //             }

    //             // Update the token if present in the response
    //             const newToken = result.token || result._token;
    //             if (newToken) {
    //                 localStorage.setItem("_token", newToken);  // Update the token in localStorage
    //             }

    //             // If response status is not successful, throw an error
    //             if (!result.status) {
    //                 throw new Error(result.message || 'Error: Unable to fetch admin list');
    //             }

    //             // Map through the `client_spocs` array to get the names, with safety checks
    //             const spocsWithIds = result.client_spocs && Array.isArray(result.client_spocs)
    //                 ? result.client_spocs.map(spoc => ({
    //                     id: spoc.id || null, // Handle cases where `id` might be missing or null
    //                     name: spoc.name || ''  // Handle cases where `name` might be missing
    //                 }))
    //                 : [];

    //             setAdminNames(spocsWithIds || []);  // Set state with the processed list
    //         })
    //         .catch((error) => {
    //             console.error('Fetch error:', error);
    //             setLoading(false);  // Stop loading state in case of an error
    //         })
    //         .finally(() => {
    //             setLoading(false);  // Stop specific loading state
    //             setIsApiLoading(false);  // Stop global loading state once everything is done
    //         });
    // }, []);




    const uploadCustomerLogo = async (email_status) => {
        setIsApiLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;

        const fileCount = Object.keys(files).length;
        for (const [rawKey, value] of Object.entries(files)) {
            const key = rawKey.replace("[]", "");
            const storedToken = localStorage.getItem("_token");
            const customerLogoFormData = new FormData();
            customerLogoFormData.append('admin_id', admin_id);
            customerLogoFormData.append('_token', storedToken);
            customerLogoFormData.append('application_id', applicationId);
            customerLogoFormData.append('email_status', email_status || 0);
            customerLogoFormData.append('branch_id', branchid);
            customerLogoFormData.append('customer_code', customerInfo.client_unique_id);
            customerLogoFormData.append('application_code', applicationId);

            // Check if selectedFiles is not empty
            if (value.selectedFiles.length > 0) {
                for (const file of value.selectedFiles) {
                    // Ensure file is a valid File object
                    if (file instanceof File) {
                        customerLogoFormData.append('images', file); // Append each valid file
                    }
                }

                // If needed, ensure the file name is sanitized (if required)
                value.fileName = value.fileName.replace(/\[\]$/, ''); // Remove '[]' from the file name if present

                // Append the sanitized file name to FormData
                customerLogoFormData.append('db_column', value.fileName);
                customerLogoFormData.append('db_table', key);
            }

            if (fileCount === Object.keys(files).indexOf(key) + 1) {
                customerLogoFormData.append('send_mail', 1);
            }

            try {
                const response = await axios.post(
                    `https://api.goldquestglobal.in/client-master-tracker/upload`,
                    customerLogoFormData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                // Log the response to check where the token is

                // Now check if the token is available and save it to localStorage
                const newToken = response?.data?.token || response?.data?._token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);  // Save the new token in localStorage
                }

            } catch (err) {
                // Handle error
                console.error('Error during upload:', err);
                setIsApiLoading(false);
            } finally {
                setIsApiLoading(false);
            }
        }
    };


    const handleInputChange = useCallback((e, index) => {
        const { name, value } = e.target;

        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = [...prev];

            updatedServicesDataInfo[index] = {
                ...updatedServicesDataInfo[index],
                annexureData: {
                    ...updatedServicesDataInfo[index].annexureData,
                    [name]: value || '',
                },
            };

            return updatedServicesDataInfo;
        });
    }, []);


    const renderInput = (index, dbTable, input, annexureImagesSplitArr) => {
        let inputValue = '';
        if (servicesDataInfo[index]?.annexureData?.hasOwnProperty(input.name)) {
            inputValue = servicesDataInfo[index].annexureData[input.name] || '';
        }

        switch (input.type) {
            case "text":
            case "email":
            case "tel":
                return (
                    <>
                        <label className='text-sm'>{input.label}</label>
                        <input
                            type={input.type}
                            name={input.name}
                            value={inputValue}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => handleInputChange(e, index)} // Pass the index
                        />
                    </>
                );
            case "datepicker":
                return (
                    <>
                        <label className='text-sm'>{input.label}</label>
                        <input
                            type="date"
                            name={input.name}
                            value={inputValue}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => handleInputChange(e, index)} // Pass the index
                        />
                    </>
                );
            case "dropdown":
                return (
                    <>
                        <label className='text-sm'>{input.label}</label>
                        <select
                            name={input.name}
                            value={inputValue}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => handleInputChange(e, index)} // Pass the index
                        >
                            {input.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.showText}
                                </option>
                            ))}
                        </select>
                    </>
                );
            case "file":
                return (
                    <>
                        <label className='text-sm'>{input.label}</label>
                        <input
                            type="file"
                            name={input.name}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            multiple={input.multiple}
                            onChange={(e) => handleFileChange(index, dbTable, input.name, e)} // Update this function if needed
                        />
                        <div className="relative mt-4">
                            {annexureImagesSplitArr.length > 0 ? (
                                <div
                                    className="grid md:grid-cols-5 grid-cols-1 gap-5 overflow-auto max-h-64" // Add max-height for scrolling
                                >
                                    {annexureImagesSplitArr.map((image, index) => (
                                        image.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                            <img
                                                src={image.trim()}
                                                alt={`Image ${index + 1}`}
                                                key={index} // Ensure key is added
                                            />
                                        ) : (
                                            <a
                                                href={image.trim()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                key={index} // Ensure key is added for anchor tags as well
                                            >
                                                <button type="button" className="px-4 py-2 bg-[#3e76a5] text-white rounded">
                                                    View Document
                                                </button>
                                            </a>
                                        )
                                    ))}
                                </div>
                            ) : (
                                <p>No Image Found</p> // Message if no images are present
                            )}
                        </div>





                    </>
                );
            default:
                return (
                    <><label className='text-sm'>{input.label}</label>
                        <input
                            type="text"
                            name={input.name}
                            value={inputValue}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => handleInputChange(e, index)} // Pass the index
                        />
                    </>
                );
        }
    };


    const handleSubmit = useCallback(async (e, allSortingOrder) => {
        e.preventDefault();
        setIsApiLoading(true); // Start global loading spinner

        // Initialize the SweetAlert2 instance
        const swalInstance = Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we generate your report',
            allowOutsideClick: false, // Prevent closing Swal while processing
            showConfirmButton: false, // Hide the confirm button
        });

        try {
            const adminData = JSON.parse(localStorage.getItem("admin"));
            const token = localStorage.getItem("_token");

            let filteredSubmissionData;
            // Prepare submission data
            if (servicesDataInfo) {
                const submissionData = servicesDataInfo
                    .map((serviceData, index) => {
                        // Check if serviceData is valid
                        if (!serviceData || !serviceData.serviceStatus) {
                            console.warn(`Skipping invalid service data at index ${index}`);
                            return null; // Skip invalid serviceData
                        }

                        const formJson = serviceData.reportFormJson?.json
                            ? JSON.parse(serviceData.reportFormJson.json)
                            : null;

                        if (!formJson) {
                            console.warn(`Invalid formJson for service at index ${index}`);
                            return null; // Skip if formJson is invalid
                        }

                        // Extract necessary data
                        const dbTable = formJson.db_table;
                        const annexure = {};

                        // Map through rows and inputs to build annexure
                        formJson.rows.forEach((row) => {
                            row.inputs.forEach((input) => {
                                let fieldName = input.name;
                                const fieldValue =
                                    serviceData.annexureData?.[fieldName] || "";

                                if (fieldName.endsWith("[]")) {
                                    fieldName = fieldName.slice(0, -2); // Remove array indicator
                                }

                                if (fieldName.startsWith("annexure.")) {
                                    const [, category, key] = fieldName.split(".");
                                    if (!annexure[category]) annexure[category] = {};
                                    annexure[category][key] = fieldValue;
                                } else {
                                    const tableKey = formJson.db_table || "default_table";
                                    if (!annexure[tableKey]) annexure[tableKey] = {};
                                    annexure[tableKey][fieldName] = fieldValue;
                                }
                            });
                        });

                        const category = formJson.db_table || "";
                        const status = selectedStatuses?.[index] || "";
                        const sorting_order = allSortingOrder?.[dbTable] || serviceData?.annexureData?.sorting_order || '';

                        if (annexure[category]) {
                            annexure[category].status = status;
                            annexure[category].sorting_order = sorting_order;
                        }

                        return { annexure };
                    })
                    .filter(Boolean); // Remove null values

                if (!submissionData.length) {
                    console.warn("No valid submission data found.");
                    Swal.fire("Error", "No data to submit. Please check your inputs.", "error");
                    setLoading(false);
                    return;
                }

                // Flatten and clean up annexure data
                filteredSubmissionData = submissionData.reduce(
                    (acc, item) => ({ ...acc, ...item.annexure }),
                    {}
                );

                Object.keys(filteredSubmissionData).forEach((key) => {
                    const data = filteredSubmissionData[key];
                    Object.keys(data).forEach((subKey) => {
                        if (subKey.startsWith("Annexure")) {
                            delete data[subKey]; // Remove unnecessary keys
                        }
                    });
                });

            }

            // Prepare request payload
            const raw = JSON.stringify({
                admin_id: adminData?.id || "",
                _token: token || "",
                branch_id: branchid,
                customer_id: branchInfo?.customer_id || "",
                application_id: applicationId,
                ...formData,
                annexure: filteredSubmissionData,
                send_mail: Object.keys(files).length === 0 ? 1 : 0,
            });

            const requestOptions = {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: raw,
            };

            // API Request
            const response = await fetch(
                `https://api.goldquestglobal.in/client-master-tracker/generate-report`,
                requestOptions
            );

            const result = await response.json();
            const newToken = result._token || result.token;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (!response.ok) {
                const errorMessage = result.message || `HTTP error! Status: ${response.status}`;
                throw new Error(errorMessage); // Show API error message
            }

            // Success Handling
            const successMessage = result.success_message || "Application updated successfully.";
            if (Object.keys(files).length === 0) {
                Swal.fire({
                    title: "Success",
                    text: successMessage,
                    icon: "success",
                    confirmButtonText: "Ok",
                });
            } else {
                await uploadCustomerLogo(result.email_status);
                Swal.fire({
                    title: "Success",
                    text: successMessage,
                    icon: "success",
                    confirmButtonText: "Ok",
                });
            }
            fetchApplicationData();
            fetchServicesJson();

        } catch (error) {
            console.error("Error during submission:", error);

            // If an error occurs, show the error message from the API
            Swal.fire("Error", error.message || "Failed to submit the application. Please try again.", "error");
        } finally {
            swalInstance.close(); // Close the Swal spinner
            setLoading(false); // Stop specific loading spinner
            setIsApiLoading(false); // Stop global loading spinner
        }
    }, [servicesDataInfo, branchid, branchInfo, applicationId, formData, selectedStatuses, files]);

    const handleDateChange = (date) => {
        // Format the date to display month and year like "March 2025"
        const formattedDate = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        setFormData(prevFormData => ({
            ...prevFormData,
            updated_json: {
                ...prevFormData.updated_json,
                month_year: formattedDate,
            },
        }));
    };


    return (
        <div className="border rounded-md">
            <h2 className="text-2xl font-bold py-3 text-center px-3 ">GENERATE REPORT</h2>
            <div className="bg-white ">
                {loading ? (
                    <div className='flex justify-center items-center py-6 '>
                        <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

                    </div>
                ) : (
                    <form className="space-y-4 p-2" autoComplete="off" onSubmit={(e) => handleSubmit(e, sortingOrder)}>

                        <div className=" form start space-y-4 py-[30px] md:px-[51px] bg-white rounded-md" id="client-spoc">
                            <div>
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="month_year">Month - Year*</label>
                                        <DatePicker
                                            selected={formData.updated_json.month_year}  // Convert month_year string to Date
                                            onChange={handleDateChange}
                                            dateFormat="MMM yyyy"  // Format to display abbreviated Month and Year (e.g., "Jan 2025")
                                            showMonthYearPicker
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            name="month_year"
                                            id="month_year"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="initiation_date">Initiation Date</label>
                                        <input
                                            type="date"
                                            name="initiation_date"
                                            id="initiation_date"
                                            className="w-full border p-2 outline-none rounded-md mt-2"
                                            value={formData.updated_json.initiation_date}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="organization_name">Name of the Client Organization</label>
                                        <input
                                            type="text"
                                            name="organization_name"
                                            id="organization_name"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.organization_name}
                                            disabled={formData.updated_json.organization_name}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="email" className='text-sm'>Purpose of Application</label>
                                        <select
                                            name="verification_purpose"
                                            onChange={handleCustomInputChange}
                                            value={formData.updated_json.verification_purpose}
                                            className="border w-full rounded-md p-2 mt-2"
                                            id="verification_purpose"
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
                                            {formData.updated_json.customPurpose && (
                                                <option value={formData.updated_json.customPurpose} selected>{formData.updated_json.customPurpose}</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                {isModalOpen && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                                        <div className="bg-white rounded-md p-4 max-w-lg w-full">
                                            <div className="mb-4">
                                                <label htmlFor="customPurpose" className="text-sm">Please specify the custom purpose</label>
                                                <input
                                                    type="text"
                                                    name="customPurpose"
                                                    value={formData.updated_json.customPurpose}
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
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="employee_id">Applicant Employee ID</label>
                                        <input
                                            type="text"
                                            name="employee_id"
                                            id="employee_id"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.employee_id}
                                            disabled={formData.updated_json.employee_id}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="client_code">Client Code</label>
                                        <input
                                            type="text"
                                            name="client_code"
                                            id="client_code"
                                            disabled
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.client_code}

                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="applicant_name">Name of the Applicant*</label>
                                        <input
                                            type="text"
                                            name="applicant_name"
                                            id="applicant_name"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.applicant_name}
                                            disabled
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="contact_number">Contact Number</label>
                                        <input
                                            type="tel"
                                            name="contact_number"
                                            id="contact_number"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.contact_number}

                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="contact_number2">Contact Number 2:</label>
                                        <input
                                            type="tel"
                                            name="contact_number2"
                                            id="contact_number2"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.contact_number2}

                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="father_name">Father's Name:</label>
                                        <input
                                            type="text"
                                            name="father_name"
                                            id="father_name"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.father_name}

                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="gender">Gender</label>
                                        <select
                                            name="gender"
                                            id="gender"
                                            className="border w-full rounded-md p-2 mt-2"
                                            value={formData.updated_json.gender}

                                            onChange={handleChange}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="dob">Date Of Birth</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            id="dob"
                                            className="w-full border p-2 outline-none rounded-md mt-2"
                                            value={formData.updated_json.dob}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="marital_status">Marital Status</label>
                                        <select
                                            name="marital_status"
                                            id="marital_status"
                                            className="border w-full rounded-md p-2 mt-2"
                                            value={formData.updated_json.marital_status}

                                            onChange={handleChange}
                                        >
                                            <option value="">Select Marital Status</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                        </select>
                                    </div>
                                </div>


                            </div>

                            <div className='permanentaddress '>
                                <div className='my-4 text-center md:text-2xl text-lg font-semibold mb-4'>Permanent Address</div>
                                <div className="form-group border p-3 rounded-md">
                                    <div className="mb-4">
                                        <label htmlFor="full_address">Full Address:</label>
                                        <input
                                            type="text"
                                            name="updated_json.permanent_address.permanent_address"
                                            id="full_address"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.permanent_address.permanent_address || ''}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <h3 className="font-semibold text-xl mb-3">Period of Stay</h3>
                                        <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                            <div className="mb-4">
                                                <label htmlFor="permanent_sender_name">From:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.permanent_address.permanent_sender_name"
                                                    id="permanent_sender_name"
                                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                                    value={formData.updated_json.permanent_address.permanent_sender_name}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="permanent_reciever_name">To:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.permanent_address.permanent_reciever_name"
                                                    id="permanent_reciever_name"
                                                    className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                    value={formData.updated_json.permanent_address.permanent_reciever_name}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                            <div className="mb-4">
                                                <label htmlFor="permanent_landmark">Landmark:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.permanent_address.permanent_landmark"
                                                    id="permanent_landmark"
                                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                                    value={formData.updated_json.permanent_address.permanent_landmark}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="permanent_pin_code">Pin Code:</label>
                                                <input
                                                    type="text" // Keep as text to handle leading zeros
                                                    name="updated_json.permanent_address.permanent_pin_code"
                                                    id="permanent_pin_code"
                                                    className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                    value={formData.updated_json.permanent_address.permanent_pin_code}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="permanent_state">State:</label>
                                            <input
                                                type="text"
                                                name="updated_json.permanent_address.permanent_state"
                                                id="permanent_state"
                                                className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                value={formData.updated_json.permanent_address.permanent_state}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='currentaddress '>
                                <div className='my-4 text-center md:text-2xl text-lg font-semibold mb-4'>Current Address </div>
                                <div className="form-group border rounded-md p-3">
                                    <div className="mb-4">
                                        <label htmlFor="full_address">Full Address:</label>
                                        <input
                                            type="text"
                                            name="updated_json.address.address"
                                            id="address"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.address.address}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="Landmark">Landmark:</label>
                                        <input
                                            type="text"
                                            name="updated_json.address.landmark"
                                            id="landmark"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.address.landmark}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="residence_mobile_number">Residence Mobile No:</label>
                                        <input
                                            type="text"
                                            name="updated_json.address.residence_mobile_number"
                                            id="residence_mobile_number"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.address.residence_mobile_number}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="state">State</label>
                                        <input
                                            type="text"
                                            name="updated_json.address.state"
                                            id="state"
                                            className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                            value={formData.updated_json.address.state}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="SelectedServices border md:p-5 p-2 overflow-auto  rounded-md md:mx-12">
                                <h1 className="text-center md:text-2xl text-lg">SELECTED SERVICES</h1>
                                {servicesDataInfo && servicesDataInfo.map((serviceData, index) => {
                                    if (serviceData.serviceStatus) {
                                        const formJson = JSON.parse(serviceData.reportFormJson.json);
                                        const dbTable = formJson.db_table;
                                        let status = serviceData?.annexureData?.status || '';
                                        let sortingOrderfinal = serviceData?.annexureData?.sorting_order || '';
                                        let preselectedStatus = selectedStatuses[index] !== undefined ? selectedStatuses[index] : status;

                                        // Ensure sorting_order for the index exists (either default value or from state)
                                        let preselectedSortingOrder = sortingOrder[dbTable] !== undefined ? sortingOrder[dbTable] : sortingOrderfinal;

                                        return (
                                            <div key={index} className="mb-6 md:grid grid-cols-3 gap-3 justify-between mt-5">
                                                {formJson.heading && (
                                                    <>
                                                        <span className='text-sm block'>{formJson.heading}</span>

                                                        {/* Status Selector */}
                                                        <select
                                                            className="border p-2 mt-4 md:mt-0 w-full rounded-md"
                                                            value={preselectedStatus}
                                                            onChange={(e) => handleStatusChange(e, index)}  // Handle status change here
                                                            required
                                                        >
                                                            <option value="">--Select status--</option>
                                                            <option value="nil">NIL</option>
                                                            <option value="initiated">INITIATED</option>
                                                            <option value="hold">HOLD</option>
                                                            <option value="closure_advice">CLOSURE ADVICE</option>
                                                            <option value="wip">WIP</option>
                                                            <option value="insuff">INSUFF</option>
                                                            <option value="completed">COMPLETED</option>
                                                            <option value="completed_green">COMPLETED GREEN</option>
                                                            <option value="completed_orange">COMPLETED ORANGE</option>
                                                            <option value="completed_red">COMPLETED RED</option>
                                                            <option value="completed_yellow">COMPLETED YELLOW</option>
                                                            <option value="completed_pink">COMPLETED PINK</option>
                                                            <option value="stopcheck">STOPCHECK</option>
                                                            <option value="active_employment">ACTIVE EMPLOYMENT</option>
                                                            <option value="not_doable">NOT DOABLE</option>
                                                            <option value="candidate_denied">CANDIDATE DENIED</option>
                                                        </select>

                                                        {/* Sorting Order Input */}
                                                        <input
                                                            type='number'
                                                            placeholder='Sorting By Order'
                                                            className="border p-2 mt-4 md:mt-0 rounded-md w-full"
                                                            id={`sorting_order_${index}`}
                                                            value={preselectedSortingOrder}
                                                            onChange={(e) => handleSortingOrderChange(e, dbTable)}  // Assuming you have a handler for sorting order
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}

                            </div>

                            <div className="container mx-auto mt-5 md:px-8">
                                {servicesDataInfo && servicesDataInfo.map((serviceData, index) => {
                                    if (serviceData.serviceStatus) {
                                        const formJson = JSON.parse(serviceData.reportFormJson.json);
                                        const dbTableHeading = formJson.heading;
                                        const dbTable = formJson.db_table;
                                        let annexureData = serviceData?.annexureData || {};
                                        let annexureImagesSplitArr = [];

                                        if (annexureData) {
                                            const annexureImagesKey = Object.keys(annexureData).find(key =>
                                                key.toLowerCase().startsWith('annexure') &&
                                                !key.includes('[') &&
                                                !key.includes(']')
                                            );
                                            if (annexureImagesKey) {
                                                const annexureImagesStr = annexureData[annexureImagesKey];
                                                annexureImagesSplitArr = annexureImagesStr ? annexureImagesStr.split(',') : [];
                                            }
                                        }

                                        return (
                                            <div key={index} className="mb-6 overflow-x-auto">
                                                {/* Only render form if the selected status is not "nil" */}
                                                {selectedStatuses[index] !== "nil" && (
                                                    <>
                                                        {dbTableHeading && (
                                                            <h3 className="text-center text-lg md:text-2xl font-semibold mb-4">{dbTableHeading}</h3>
                                                        )}
                                                        <table className="md:w-full table-auto border-collapse border border-gray-300">
                                                            <thead>
                                                                <tr className="bg-[#3e76a5] text-white">
                                                                    {formJson.headers.map((header, idx) => (
                                                                        <th
                                                                            key={idx}
                                                                            className={`py-2 px-4 border p-4 text-lg border-gray-300 ${idx === 0 ? "text-left" : idx === 1 ? "text-right" : ""}`}
                                                                        >
                                                                            {header}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>

                                                            <tbody>
                                                                {formJson.rows.map((row, idx) => {
                                                                    const hasSingleInput = row.inputs.length === 1; // Check if only one input exists

                                                                    return (
                                                                        <tr key={idx} className="">
                                                                            {hasSingleInput ? (
                                                                                // If there's only one input, span the full width of the table
                                                                                <td
                                                                                    colSpan={formJson.headers.length}
                                                                                    className="py-2 px-4 border border-gray-300 w-full"
                                                                                >
                                                                                    {renderInput(
                                                                                        index,
                                                                                        dbTable,
                                                                                        row.inputs[0], // Pass the only input available
                                                                                        annexureImagesSplitArr
                                                                                    )}
                                                                                </td>
                                                                            ) : (
                                                                                // Else, distribute inputs across columns equally with responsive classes
                                                                                row.inputs.map((input, i) => (
                                                                                    <td
                                                                                        key={i}
                                                                                        className="py-2 px-4 border border-gray-300 w-full md:w-1/2"
                                                                                    >
                                                                                        {renderInput(
                                                                                            index,
                                                                                            dbTable,
                                                                                            input,
                                                                                            annexureImagesSplitArr
                                                                                        )}
                                                                                    </td>
                                                                                ))
                                                                            )}
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>

                                                        </table>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>






                        </div>

                        <div className="form-group border rounded-md p-3">

                            <div className="mb-4 ">
                                <label className='capitalize text-gray-500' htmlFor="overall status">overall status</label>
                                <select
                                    name="updated_json.insuffDetails.overall_status"
                                    value={formData.updated_json.insuffDetails.overall_status}
                                    onChange={handleChange}
                                    className="border rounded-md p-2 mt-2 capitalize w-full"
                                >

                                    <option value="">Select overall Status</option>
                                    <option value="initiated">INITIATED</option>
                                    <option value="hold">HOLD</option>
                                    <option value="closure advice">CLOSURE ADVICE</option>
                                    <option value="wip">WIP</option>
                                    <option value="insuff">INSUFF</option>
                                    <option value="stopcheck">STOPCHECK</option>
                                    <option value="active employment">ACTIVE EMPLOYMENT</option>
                                    <option value="nil">NIL</option>
                                    <option value="not doable">NOT DOABLE</option>
                                    <option value="candidate denied">CANDIDATE DENIED</option>
                                    <option value="completed" disabled={!allCompleted}  // Disable if not all statuses are completed
                                    >
                                        completed
                                    </option>
                                </select>

                            </div>
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="report date">report date</label>
                                    <input
                                        type="date"
                                        name="updated_json.insuffDetails.report_date"
                                        id="report_date"
                                        className="border rounded-md p-2 w-full mt-2 capitalize"
                                        value={formData.updated_json.insuffDetails.report_date}
                                        onChange={handleChange}
                                    />

                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="overall status">Report Status:</label>
                                    <select name="updated_json.insuffDetails.report_status" id=""
                                        value={formData.updated_json.insuffDetails.report_status}
                                        onChange={handleChange}
                                        className="border rounded-md p-2 mt-2 capitalize w-full">
                                        <option value="">Selet Report Status</option>
                                        <option value="Open">Open</option>
                                        <option value="Closed">Closed</option>
                                    </select>

                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="report status">Report Type:</label>
                                    <select name="updated_json.insuffDetails.report_type" id=""
                                        value={formData.updated_json.insuffDetails.report_type}
                                        onChange={handleChange}
                                        className="border rounded-md p-2 mt-2  w-full">
                                        <option value="">Selet Report Type</option>
                                        <option value="Interim Report">Interim Report</option>
                                        <option value="Final Report">Final Report</option>
                                        <option value="Stopcheck">Stopcheck</option>
                                    </select>

                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="Final Verification Status:">Final Verification Status:</label>
                                    <select name="updated_json.insuffDetails.final_verification_status"
                                        value={formData.updated_json.insuffDetails.final_verification_status}
                                        onChange={handleChange}
                                        id="" className="border w-full rounded-md p-2 mt-2 capitalize">
                                        <option value="">Selet Verification Status</option>
                                        <option value="green">green</option>
                                        <option value="red">red</option>
                                        <option value="yellow" >yellow</option>
                                        <option value="pink">pink</option>
                                        <option value="orange">orange</option>
                                    </select>



                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500  ' htmlFor="Is verified by quality team">Is verified by quality team</label>
                                    <select name="updated_json.insuffDetails.is_verify"
                                        value={formData.updated_json.insuffDetails.is_verify}
                                        onChange={handleChange}

                                        id="" className="border w-full rounded-md p-2 mt-2 capitalize">
                                        <option value="">Please Select.....</option>
                                        <option value="yes">yes</option>
                                        <option value="no">no</option>
                                    </select>

                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500 ' htmlFor="deadline date">deadline date</label>
                                    <input
                                        type="date"
                                        name="updated_json.insuffDetails.deadline_date"
                                        id="deadline_date"
                                        className="border w-full rounded-md p-2 mt-2 capitalize"
                                        value={formData.updated_json.insuffDetails.deadline_date}
                                        onChange={handleChange}
                                    />

                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500 ' htmlFor="Address">Address</label>
                                    <select name="updated_json.insuffDetails.insuff_address"
                                        value={formData.updated_json.insuffDetails.insuff_address}
                                        onChange={handleChange}
                                        id="" className="border w-full rounded-md p-2 mt-2 capitalize">
                                        <option value="">Selet Address</option>
                                        {adminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>{spoc.name}</option>
                                        ))}
                                    </select>

                                </div>
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500' htmlFor="basic entry">basic entry</label>
                                    <select name="updated_json.insuffDetails.basic_entry"
                                        value={formData.updated_json.insuffDetails.basic_entry}
                                        onChange={handleChange}
                                        id="" className="border w-full rounded-md p-2 mt-2 capitalize">
                                        <option value="">Selet basic entry</option>
                                        {adminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>{spoc.name}</option>
                                        ))}                                    </select>

                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500 ' htmlFor="education">education</label>
                                    <select name="updated_json.insuffDetails.education" id=""
                                        value={formData.updated_json.insuffDetails.education}
                                        onChange={handleChange}
                                        className="border w-full rounded-md p-2 mt-2 capitalize">
                                        <option value="">Selet Education</option>
                                        {adminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>{spoc.name}</option>
                                        ))}                                    </select>

                                </div>

                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="case upload">case upload</label>
                                    <input
                                        type="text"
                                        name="updated_json.insuffDetails.case_upload"
                                        id="case_upload"
                                        className="border w-full rounded-md p-2 mt-2 capitalize"
                                        value={formData.updated_json.insuffDetails.case_upload}
                                        onChange={handleChange}
                                    />

                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500 block' htmlFor="Employment Spoc:">Employment Spoc:</label>
                                    <select name="updated_json.insuffDetails.emp_spoc" id=""
                                        value={formData.updated_json.insuffDetails.emp_spoc}
                                        onChange={handleChange}
                                        className="border w-full rounded-md p-2 mt-2 capitalize">
                                        <option value="">Selet Employment Spoc</option>
                                        <option value="yes">yes</option>
                                        <option value="no">no</option>
                                    </select>

                                </div>
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500' htmlFor="Report Generated By:">Report Generated By:</label>
                                    <select name="updated_json.insuffDetails.report_generate_by"
                                        value={formData.updated_json.insuffDetails.report_generate_by}
                                        onChange={handleChange}
                                        id="" className="border w-full rounded-md p-2 mt-2 capitalize">
                                        <option value="">Select Admin</option>
                                        {adminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>{spoc.name}</option>
                                        ))}


                                    </select>

                                </div>
                            </div>
                            <div className="mb-4 ">
                                <label className='capitalize block text-gray-500' htmlFor="QC Done By:">QC Done By:</label>

                                <select name="updated_json.insuffDetails.qc_done_by"
                                    value={formData.updated_json.insuffDetails.qc_done_by}
                                    onChange={handleChange}
                                    id="" className="border w-full rounded-md p-2 mt-2 capitalize">
                                    <option value="">Select Admin</option>
                                    {adminNames.map((spoc, index) => (
                                        <option key={index} value={spoc.id}>{spoc.name}</option>
                                    ))}

                                </select>

                            </div>
                            <div className="mb-4">
                                <label className='capitalize text-gray-500' htmlFor="Remarks & reason for Delay:">Remarks & reason for Delay:</label>
                                <input
                                    type="text"
                                    value={formData.updated_json.insuffDetails.delay_reason}
                                    onChange={handleChange}
                                    name="updated_json.insuffDetails.delay_reason"
                                    id="delay_reason"
                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                />


                            </div>
                            <div className='flex gap-3 items-center my-2'>
                                <input
                                    type="checkbox"
                                    value={formData.updated_json.insuffDetails.have_not_insuff}
                                    onChange={handleChange}
                                    name="updated_json.insuffDetails.have_not_insuff"
                                    id="have_not_insuff"
                                    checked={
                                        formData.updated_json.insuffDetails.have_not_insuff === true ||
                                        formData.updated_json.insuffDetails.have_not_insuff === "1" ||
                                        formData.updated_json.insuffDetails.have_not_insuff === 1
                                    }
                                    className="border rounded-md p-2 capitalize"
                                />
                                <label htmlFor="have_not_insuff" className='font-bold capitalize text-lg'>Have Not Insuff</label>
                            </div>

                            {!(
                                formData.updated_json.insuffDetails.have_not_insuff === true ||
                                formData.updated_json.insuffDetails.have_not_insuff === "1" ||
                                formData.updated_json.insuffDetails.have_not_insuff === 1
                            ) && (
                                    <div className='have-not-insufff'>


                                        <div className="mb-4">
                                            <label className='capitalize text-gray-500' htmlFor="first_insufficiency_marks">Insufficiency Remarks</label>
                                            <input
                                                type="text"
                                                name="updated_json.insuffDetails.first_insufficiency_marks"
                                                id="first_insufficiency_marks"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.insuffDetails.first_insufficiency_marks}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className='capitalize text-gray-500' htmlFor="first_insuff_date">Insuff Raised Date:</label>
                                            <input
                                                type="date"
                                                name="updated_json.insuffDetails.first_insuff_date"
                                                id="first_insuff_date"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.insuffDetails.first_insuff_date}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className='capitalize text-gray-500' htmlFor="first_insuff_reopened_date">Insuff Cleared Date / Re-Opened date</label>
                                            <input
                                                type="date"
                                                name="updated_json.insuffDetails.first_insuff_reopened_date"
                                                id="first_insuff_reopened_date"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.insuffDetails.first_insuff_reopened_date}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                )}
                        </div>

                        <div className="text-right mt-4">
                            <button
                                type="submit"
                                className="bg-[#3e76a5] text-white rounded-md p-2.5"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div >
    );
};

export default GenerateReport;
