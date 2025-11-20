import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2'
import axios from 'axios';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useApiCall } from '../../ApiCallContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const GenerateReport = () => {
    const { isApiLoading, setIsApiLoading, checkAuthentication } = useApiCall();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [branchInfo, setBranchInfo] = useState([]);
    const [customerInfo, setCustomerInfo] = useState([]);
    const [sortingOrder, setSortingOrder] = useState([]);
    const [applications, setApplications] = useState([]);
    const [adminNames, setAdminNames] = useState([]);
    const [reportGeneratorAdminNames, setReportGeneratorAdminNames] = useState([]);
    const [qCVerifierAdminNames, setQCVerifierAdminNames] = useState([]);
    const [selectedHour, setSelectedHour] = useState("");
    const [selectedMinute, setSelectedMinute] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    const [formData, setFormData] = useState({
        updated_json: {
            application_id: '',
            insta_drug_test: false,
            month_year: '',
            initiation_date: '', // Sets current date in dd-MM-yyyy format
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
                is_verify: 'no',
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
    const [selectedStatuses, setSelectedStatuses] = useState([]);

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
        // console.log(`formData.updated_json.month_year- `, formData.updated_json.month_year);

        if (!formData.updated_json.month_year) {

            setFormData(prevFormData => ({
                ...prevFormData,
                updated_json: {
                    ...prevFormData.updated_json,
                    month_year: formData.updated_json.month_year || prevFormData.updated_json.month_year || monthYear,
                }
            }));
        }
    }, []);



    const handleSortingOrderChange = (e, serviceIndex, index) => {
        const newSortingOrder = e.target.value;

        setSortingOrder((prevState) => {

            const updatedState = { ...prevState }; // Ensure we are working with an object
            updatedState[index] = newSortingOrder; // Update if exists, or add if not

            return updatedState;
        });

        const name = 'sorting_order';
        // console.log(`{ name, newSortingOrder } - `, { name, newSortingOrder });
        let newValue = newSortingOrder;

        // console.log(`newValue - `, newValue);
        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = [...prev];

            updatedServicesDataInfo[serviceIndex] = {
                ...updatedServicesDataInfo[serviceIndex],
                annexureData: {
                    ...updatedServicesDataInfo[serviceIndex].annexureData,
                    [name]: newValue || '',
                },
            };

            return updatedServicesDataInfo;
        });
    };


    // Compute `showInstaDrugTest` OUTSIDE useEffect to avoid multiple triggers
    const showInstaDrugTest = useMemo(() => {
        const isInstaEnabled = ['1', 1, 'true', true].includes(
            formData?.updated_json?.insta_drug_test
        );

        return (
            isInstaEnabled && formData?.updated_json?.insta_drug_test &&
            Array.isArray(servicesDataInfo) &&
            servicesDataInfo.some(
                (service) =>
                    service?.reportFormJson &&
                    JSON.parse(service.reportFormJson.json)?.heading === "INSTA DRUG TEST"
            )
        );
    }, [servicesDataInfo, formData?.updated_json?.insta_drug_test]);


    useEffect(() => {
        if (Array.isArray(servicesDataInfo) && servicesDataInfo.length > 0) {

            setSelectedStatuses(prevStatuses => {
                let rawServiceData = showInstaDrugTest
                    ? servicesDataInfo
                        .map((service, index) => ({
                            index, // Preserve the original index
                            service
                        }))
                        .filter(({ service }) =>
                            service?.reportFormJson &&
                            JSON.parse(service.reportFormJson.json)?.heading === "INSTA DRUG TEST"
                        )
                    : servicesDataInfo;

                let filteredServices = [];
                if (showInstaDrugTest) {
                    filteredServices = [];
                    rawServiceData.forEach(item => {
                        filteredServices[item.index] = item.service; // Assign service at the correct index
                    });
                } else {
                    filteredServices = rawServiceData;
                }

                return filteredServices.map((serviceData, index) => {
                    const originalIndex = servicesDataInfo.findIndex(s => s === serviceData); // Keep proper index

                    if (!serviceData?.reportFormJson) {
                        return prevStatuses[originalIndex] ?? undefined;
                    }

                    return prevStatuses[originalIndex] !== undefined
                        ? prevStatuses[originalIndex] // Preserve manually changed value
                        : serviceData?.annexureData?.status || (selectedStatuses[index] || "initiated");
                });
            });
        }
    }, [showInstaDrugTest, servicesDataInfo]); // Correct dependencies

    const handleStatusChange = (e, filteredIndex) => {
        const newValue = e.target.value;

        setSelectedStatuses(prevStatuses => {

            const updatedStatuses = [...prevStatuses];

            if (showInstaDrugTest) {
                // Find the original index of "INSTA DRUG TEST"
                const originalIndex = servicesDataInfo.findIndex(service =>
                    service?.reportFormJson &&
                    JSON.parse(service.reportFormJson.json)?.heading === "INSTA DRUG TEST"
                );

                if (originalIndex !== -1) {
                    updatedStatuses[originalIndex] = newValue; // Correctly update the mapped index
                }
            } else {
                updatedStatuses[filteredIndex] = newValue; // Normal update
            }

            // Update formData
            setFormData(prevFormData => {

                const updatedFormData = {
                    ...prevFormData,
                    updated_json: {
                        ...prevFormData.updated_json,
                        insuffDetails: {
                            ...prevFormData.updated_json.insuffDetails,
                            overall_status: updatedStatuses.every(status =>
                                typeof status === "string" &&
                                (status.startsWith("completed") || status.toLowerCase() === "nil")
                            ) ? prevFormData.updated_json.insuffDetails.overall_status : ""
                        }
                    }
                };

                return updatedFormData;
            });
            return updatedStatuses;
        });
    };


    let allCompleted = false;

    if (selectedStatuses.length > 0) {
        const validStatuses = selectedStatuses.filter(status => status); // Removes null, undefined, and empty strings
        if (validStatuses.length > 0) {
            allCompleted = validStatuses.every(status =>
                typeof status === "string" &&
                (status.startsWith("completed") || status.toLowerCase() === "nil" || status.toLowerCase() === "wip")
            );
        }
    }






    const handleFileChange = (index, dbTable, fileName, e) => {

        const selectedFiles = Array.from(e.target.files);

        // Update the state with the new selected files
        setFiles((prevFiles) => ({
            ...prevFiles,
            [dbTable]: { selectedFiles, fileName },
        }));
    };

    const refId = new URLSearchParams(window.location.search).get('ref_id');



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

        // Format the date to 'dd-MM-yyyy' format
        const formattedDate = parsedDate.toISOString().split('T')[0]; // Extracts only the date portion
        return formattedDate;
    }

    let applicationData;
    const fetchApplicationData = useCallback(() => {
        setIsApiLoading(true);

        setLoading(true);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };
        fetch(`https://api.goldquestglobal.in/client-master-tracker/application-by-id?ref_id=${refId}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => {
                return response.json()
            })
            .then((result) => {
                const newToken = result?.token || result?._token || '';
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
                applicationData = result.application;
                const cmtDataRaw = result.CMTData;
                const customerData = result.customerInfo;
                setApplications(result.application)
                const cmtData = result.CMTData || [];
                const services = applicationData.services;
                fetchServicesJson(services, applicationData, cmtDataRaw); // Fetch services JSON
                setBranchInfo(result.branchInfo); // Set branch info
                setCustomerInfo(result.customerInfo); // Set customer info
                setReportGeneratorAdminNames(result.reportGenerationTeam); // Set admin names
                setQCVerifierAdminNames(result.qcVerificationTeam); // Set admin names
                setAdminNames(result.admins || []); // Set admin names

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

                setFormData(prevFormData => {
                    // Check if cmtData.month_year is valid, otherwise use applicationData or fallback
                    const monthYear = cmtData.month_year || applicationData.month_year || prevFormData.updated_json.month_year || '';
                    // console.log(`monthYear - `, monthYear);

                    // If the monthYear is valid, format it; otherwise, skip updating
                    const formattedMonthYear = isValidMonthYear(monthYear) ? formatMonthYear(monthYear, 2025) : prevFormData.updated_json.month_year;
                    // console.log(`formattedMonthYear - `, formattedMonthYear);
                    return {
                        updated_json: {
                            application_id: applicationData.application_id || prevFormData.updated_json.application_id || '',
                            month_year: monthYear || prevFormData.updated_json.month_year || '',
                            insta_drug_test: cmtData.insta_drug_test || applicationData.insta_drug_test || prevFormData.updated_json.insta_drug_test || '',
                            organization_name: applicationData.customer_name || prevFormData.updated_json.organization_name || '',
                            verification_purpose: applicationData.purpose_of_application || prevFormData.updated_json.verification_purpose || '',
                            employee_id: applicationData.employee_id || prevFormData.updated_json.employee_id || '',
                            client_code: customerData.client_unique_id || prevFormData.updated_json.client_code || '',
                            applicant_name: applicationData.name || prevFormData.updated_json.applicant_name || '',
                            contact_number: cmtData.contact_number || prevFormData.updated_json.contact_number || '',
                            contact_number2: cmtData.contact_number2 || prevFormData.updated_json.contact_number2 || '',
                            father_name: cmtData.father_name || prevFormData.updated_json.father_name || '',
                            initiation_date: cmtData.initiation_date || applicationData.created_at || prevFormData.updated_json.initiation_date,
                            gender: cmtData.gender || prevFormData.updated_json.gender || '',
                            dob: (cmtData.dob && !isNaN(new Date(cmtData.dob).getTime()))
                                ? new Date(cmtData.dob).toISOString().split('T')[0] // Format as dd-MM-yyyy
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
                                    ? new Date(cmtData.first_insuff_date).toISOString().split('T')[0] // Format as dd-MM-yyyy
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
                setIsApiLoading(false);

            });

    }, [setBranchInfo, setCustomerInfo, setFormData]);



    useEffect(() => {
        const fetchData = async () => {
            if (!isApiLoading) {
                await checkAuthentication();
                await fetchApplicationData();
            }
        };

        fetchData();
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


    const fetchServicesJson = useCallback(async (servicesList, rawApplicationData, cmtDataApp) => {
        // console.log("rawApplicationData", rawApplicationData);
        const app_id = rawApplicationData.id;
        // console.log("app_id", app_id);
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
            url.searchParams.append("application_id", app_id);
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

            const rawSortedFilteredResults = Array.isArray(sortedFilteredResults)
                ? sortedFilteredResults.map((serviceData) => {
                    if (!serviceData.serviceStatus) return serviceData;

                    try {
                        const formJson = JSON.parse(serviceData?.reportFormJson?.json || '{}');

                        formJson.rows?.forEach((row) => {
                            row.inputs?.forEach((input) => {
                                let inputValue = '';

                                // Ensure `annexureData` exists
                                if (!serviceData.annexureData) {
                                    serviceData.annexureData = {};
                                }

                                // Initialize if input name is not present
                                if (!Object.prototype.hasOwnProperty.call(serviceData.annexureData, input.name)) {
                                    serviceData.annexureData[input.name] = '';
                                }

                                // Use annexureData value
                                inputValue = serviceData.annexureData[input.name];

                                // Fallback to application data if empty
                                if (!inputValue) {
                                    const label = input?.label?.toLowerCase() || '';
                                    const inputName = input?.name?.toLowerCase() || '';

                                    if (label.includes('name') && (label.includes('candidate') || label.includes('applicant'))) {
                                        inputValue = rawApplicationData?.name || '';
                                    } else if ((label.includes('employee') && label.includes('id')) || (label.includes('emp') && label.includes('code')) || (label.includes('emp') && label.includes('id'))) {
                                        inputValue = rawApplicationData?.employee_id || '';
                                    } else if ((label.includes('application') && label.includes('id')) || (label.includes('reference') && label.includes('id')) || (label.includes('reference') && label.includes('number'))) {
                                        inputValue = rawApplicationData?.application_id || '';
                                    } else if (inputName.includes('dob') || inputName.includes('date_of_birth')) {
                                        inputValue = cmtDataApp?.dob || '';
                                    } else if (inputName.includes('father_name')) {
                                        inputValue = cmtDataApp?.father_name || '';
                                    } else if (inputName.includes('mobile_number')) {
                                        inputValue = cmtDataApp?.contact_number || '';
                                    }
                                }

                                // Handle dropdown default value
                                if (input.type === "dropdown") {
                                    inputValue = inputValue || input.options?.find((option) => option.selected)?.value || '';
                                }
                                if (input.type === "datepicker" && formJson.db_table == "insta_drug_test") {
                                    const currentDate = new Date().toISOString().split("T")[0];
                                    inputValue = inputValue || (input.value === "currentData" ? currentDate : '');
                                }

                                // Assign the final value back
                                serviceData.annexureData[input.name] = inputValue;
                            });
                        });

                    } catch (error) {
                        console.error('Error parsing reportFormJson:', error);
                    }

                    return serviceData;
                })
                : [];



            setServicesDataInfo(rawSortedFilteredResults); // Set service data

            const servicesLength = sortedFilteredResults?.length || 0;

            const isDrugExist = Array.isArray(sortedFilteredResults) && sortedFilteredResults.some(service => {
                try {
                    const serviceJson = JSON.parse(service?.reportFormJson?.json || '{}');
                    return serviceJson.db_table === "insta_drug_test";
                } catch (error) {
                    console.error("Error parsing service JSON:", error);
                    return false;
                }
            });

            if (servicesLength === 1 && isDrugExist) {
                setFormData(prevFormData => ({
                    ...prevFormData,
                    updated_json: {
                        ...prevFormData.updated_json,
                        insta_drug_test: true,
                    },
                }));
            }


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
    }, [setServicesDataInfo]);




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
                    // console.log('insuffField', insuffField);

                    if (value === "Final" || value === "Stopcheck") {
                        updatedFormData.updated_json.insuffDetails.report_status = 'Closed';
                    } else if (value === "Interim") {
                        updatedFormData.updated_json.insuffDetails.report_status = 'Open';
                    }

                    // Always update the actual field
                    updatedFormData.updated_json.insuffDetails[insuffField] = value;


                    updatedFormData.updated_json.insuffDetails[insuffField] = value;
                } else {
                    const topLevelField = name.replace('updated_json.', '');
                    updatedFormData.updated_json[topLevelField] = value;
                }
            }



            return updatedFormData;
        });
    };

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
            customerLogoFormData.append('application_id', applications.id);
            customerLogoFormData.append('email_status', email_status || 0);
            customerLogoFormData.append('branch_id', applications.branch_id);
            customerLogoFormData.append('customer_code', customerInfo.client_unique_id);
            customerLogoFormData.append('application_code', applications.id);

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


    const handleFocusOut = useCallback((e, index) => {
        const { name, value } = e.target;

        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = [...prev];

            // Parse the JSON structure stored in reportFormJson
            const reportFormJson = JSON.parse(updatedServicesDataInfo[index].reportFormJson.json);

            // Find the current row containing the input
            const currentRow = reportFormJson.rows.find(row =>
                row.inputs.some(input => input.name === name)
            );

            if (!currentRow) return prev; // If no row found, return previous state

            // Identify the left-side input (first input in the row)
            const leftSideInput = currentRow.inputs[0];
            const rightSideInput = currentRow.inputs[1] || null; // Might be undefined if there's no right column

            // Only proceed if the changed input is the **left-side input**
            if (leftSideInput.name === name && rightSideInput) {

                // Ensure annexureData exists
                const existingAnnexureData = updatedServicesDataInfo[index]?.annexureData || {};

                // Update both fields (left -> right)
                updatedServicesDataInfo[index] = {
                    ...updatedServicesDataInfo[index],
                    annexureData: {
                        ...existingAnnexureData,
                        [name]: value || '',
                        [rightSideInput.name]: value || '', // Copy value to right-side input
                    },
                };
            } else {
            }

            return updatedServicesDataInfo;
        });


    }, []);

    const handleInputChange = useCallback((e, input, index) => {
        const { name, value } = e.target;
        // console.log(`{ name, value } - `, { name, value });
        let newValue = value;
        if (newValue.toLowerCase() === 'custom') {
            const customValue = prompt("Enter custom value:");

            if (!customValue) {
                return; // If empty or cancel is pressed, exit without updating
            }
            newValue = customValue;
        }

        // console.log(`newValue - `, newValue);
        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = [...prev];

            updatedServicesDataInfo[index] = {
                ...updatedServicesDataInfo[index],
                annexureData: {
                    ...updatedServicesDataInfo[index].annexureData,
                    [name]: newValue || '',
                },
            };

            return updatedServicesDataInfo;
        });

        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = [...prev];
            // Parse the JSON structure stored in reportFormJson
            const reportFormJson = JSON.parse(updatedServicesDataInfo[index].reportFormJson.json);

            // Check if the service heading is "INSTA DRUG TEST"
            if (reportFormJson.heading === "INSTA DRUG TEST") {
                // console.log("===> INSTA DRUG TEST block entered");

                const annexureData = updatedServicesDataInfo[index]?.annexureData || {};
                // console.log("Annexure Data:", annexureData);

                const drugPanel = annexureData["information_source_name_insta_drug_test"];
                const outcome = annexureData["out_come_insta_drug_test"];

                // console.log("Drug Panel:", drugPanel);
                // console.log("Outcome:", outcome);

                if (input.type === 'dropdown') {
                    // console.log("Input type is dropdown");

                    if (drugPanel === "5 panel" && outcome === "NEGATIVE") {
                        annexureData["test_result_insta_drug_test"] =
                            "The submitted urine specimen was tested and did not test positive for any of the drugs mentioned in the 5 Panel Drug Test, Hence closing the check as GREEN and the same is furnished as annexure";
                        // console.log("5 panel NEGATIVE matched");

                    } else if (drugPanel === "9 panel" && outcome === "NEGATIVE") {
                        annexureData["test_result_insta_drug_test"] =
                            "The submitted urine specimen was tested and did not test positive for any of the drugs mentioned in the 9 Panel Drug Test, Hence closing the check as GREEN and the same is furnished as annexure";
                        // console.log("9 panel NEGATIVE matched");

                    } else if (drugPanel === "10 panel" && outcome === "NEGATIVE") {
                        annexureData["test_result_insta_drug_test"] =
                            "The submitted urine specimen was tested and did not test positive for any of the drugs mentioned in the 10 Panel Drug Test, Hence closing the check as GREEN and the same is furnished as annexure.";
                        // console.log("10 panel NEGATIVE matched");

                    } else if (drugPanel === "5 panel" && outcome === "POSITIVE") {
                        annexureData["test_result_insta_drug_test"] =
                            "The submitted urine specimen was tested positive for (1. Marijuana – THC/  2. Cocaine/Benzoylecgonine-COC/ 3. Phencyclidine – PCP/ 4. Amphetamines – AMP/ 5. Opiates / Morphine – MOR/OPI) of the drugs mentioned in the 5 Panel Drug Test, Hence closing the check as RED and the same is furnished as annexure.";
                        // console.log("5 panel POSITIVE matched");

                    } else if (drugPanel === "9 panel" && outcome === "POSITIVE") {
                        annexureData["test_result_insta_drug_test"] =
                            "The submitted urine specimen was tested positive for (1. Marijuana – THC/  2. Cocaine/Benzoylecgonine-COC/ 3. Phencyclidine – PCP/ 4. Amphetamines – AMP/ 5. Opiates / Morphine – MOR/OPI / 6. Barbiturates /Secobarbital – BAR/ 7. Benzodiazepines / Oxazepam – BZO / 8. Methamphetamine – MET / 9. Methadone – MTD) of the drugs mentioned in the 9 Panel Drug Test, Hence closing the check as RED and the same is furnished as annexure.";
                        // console.log("9 panel POSITIVE matched");

                    } else if (drugPanel === "10 panel" && outcome === "POSITIVE") {
                        annexureData["test_result_insta_drug_test"] =
                            "The submitted urine specimen was tested positive for (1. Marijuana – THC/  2. Cocaine/Benzoylecgonine-COC/ 3. Phencyclidine – PCP/ 4. Amphetamines – AMP/ 5. Opiates / Morphine – MOR/OPI / 6. Barbiturates /Secobarbital – BAR/ 7. Benzodiazepines / Oxazepam – BZO / 8. Methamphetamine – MET / 9. Methadone – MTD / 10. Oxycodone - OXY) of the drugs mentioned in the 10 Panel Drug Test, Hence closing the check as RED and the same is furnished as annexure.";
                        // console.log("10 panel POSITIVE matched");

                    } else if (outcome === "ABSENT") {
                        annexureData["test_result_insta_drug_test"] =
                            "THE CANDIDATE WAS NOT PRESENT FOR DRUG TEST";
                        // console.log("Candidate ABSENT for drug test");

                    } else if (outcome === "DENIED") {
                        annexureData["test_result_insta_drug_test"] =
                            "THE CANDIDATE DENIED FOR TAKING THE DRUG TEST";
                        // console.log("Candidate DENIED the drug test");

                    } else {
                        annexureData[name] = newValue || '';
                        annexureData["test_result_insta_drug_test"] = "";
                        // console.log("No matching panel/outcome - reset value");
                    }

                } else {
                    annexureData[name] = newValue || '';
                    // console.log("Input type is not dropdown. Value set directly.");
                }

                updatedServicesDataInfo[index] = {
                    ...updatedServicesDataInfo[index],
                    annexureData: { ...annexureData },
                };

                // console.log("Updated annexureData:", annexureData);
                // console.log("Updated updatedServicesDataInfo:", updatedServicesDataInfo[index]);
            }

            return updatedServicesDataInfo;
        });
    }, []);


    const renderInput = (index, dbTable, input, annexureImagesSplitArr, rowHasFile) => {
        let inputValue = '';
        if (servicesDataInfo[index]?.annexureData?.hasOwnProperty(input.name)) {
            inputValue = servicesDataInfo[index].annexureData[input.name] || '';
        }

        // For all input types except file
        if (input.type !== "file") {
            switch (input.type) {
                case "text":
                case "email":
                case "tel":
                case "number":
                    return (
                        <>
                            <label className='font-bold text-gray-700 text-sm'>{input.label}</label>
                            <input
                                type={input.type}
                                name={input.name}
                                value={inputValue || input.value}
                                className="w-full p-2 border border-gray-300 shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => handleInputChange(e, input, index)}
                                onBlur={(e) => handleFocusOut(e, index)}
                            />
                        </>
                    );

                case "datepicker":
                    return (
                        <>
                            <label className='font-bold text-gray-700 text-sm'>{input.label}</label>
                            <DatePicker
                                selected={inputValue ? new Date(inputValue) : null}
                                onChange={(date) => {
                                    const formattedDate = date
                                        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                                        : "";

                                    const fakeEvent = {
                                        target: {
                                            name: input.name,
                                            value: formattedDate,
                                        },
                                    };
                                    handleInputChange(fakeEvent, input, index);
                                }}
                                onBlur={(e) => handleFocusOut(e, index)}
                                dateFormat="dd-MM-yyyy"
                                className="w-full p-2 border border-gray-300 shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </>
                    );

                case "monthyearpicker":
                    return (
                        <>
                            <label className='text-sm font-bold text-gray-700 '>{input.label}</label>
                            <input
                                type="month"
                                name={input.name}
                                value={inputValue}
                                className="w-full p-2 border border-gray-300 shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => handleInputChange(e, input, index)}
                                onBlur={(e) => handleFocusOut(e, index)}
                            />
                        </>
                    );


                case "timepicker":
                    let hour = "00", minutes = "00", period = "AM";
                    if (inputValue) {
                        const [time, timePeriod] = inputValue.trim().split(" ") || ["00:00", "AM"];
                        [hour, minutes] = time.split(":") || ["00", "00"];
                        period = timePeriod || "AM";
                    }
                    let preSelectedTime = { hour, minutes, period };

                    return (
                        <>
                            <label className='text-sm font-bold text-gray-700 '>{input.label}</label>
                            <div className="flex space-x-2 border border-gray-300 shadow-md rounded-lg p-2  bg-white">
                                <select
                                    value={hour}
                                    onChange={(e) => handleTimeChange(e, input, 'hour', index, preSelectedTime)}
                                    className="p-2 border border-gray-300 shadow-md rounded-lg focus:ring-blue-500 focus:outline-none"
                                >
                                    {Array.from({ length: 13 }, (_, i) => i.toString().padStart(2, "0")).map((hour) => (
                                        <option key={hour} value={hour}>{hour}</option>
                                    ))}
                                </select>

                                <select
                                    value={minutes}
                                    onChange={(e) => handleTimeChange(e, input, 'minute', index, preSelectedTime)}
                                    className="p-2 border border-gray-300 shadow-md rounded-lg focus:ring-blue-500 focus:outline-none"
                                >
                                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")).map((minute) => (
                                        <option key={minute} value={minute}>{minute}</option>
                                    ))}
                                </select>

                                <select
                                    value={period}
                                    onChange={(e) => handleTimeChange(e, input, 'period', index, preSelectedTime)}
                                    className="p-2 border border-gray-300 shadow-md rounded-lg focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </>
                    );

                case "dropdown":
                    // Check if the current value exists in the options
                    const isValueInOptions = input.options?.some(option => option.value === inputValue);

                    // Create a new array of options including the current value if it's missing
                    const updatedOptions = isValueInOptions
                        ? input.options
                        : [...(input.options || []), { value: inputValue, showText: inputValue }];

                    return (
                        <>
                            <label className='text-sm font-bold text-gray-700 '>{input.label}</label>
                            <select
                                name={input.name}
                                value={inputValue || ""}
                                className="w-full p-2 border border-gray-300 shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => handleInputChange(e, input, index)}
                                onBlur={(e) => handleFocusOut(e, index)}
                            >
                                {updatedOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.showText}
                                    </option>
                                ))}
                            </select>
                        </>
                    );

            }
        }

        // File input case — add select above file input
        if (input.type === "file") {
            return (
                <>
                    {/* Select dropdown before file input */}
                    <label className='text-sm font-bold text-gray-700 '>Select Spoc</label>

                    <select
                        name={`spoc`}
                        value={servicesDataInfo[index].annexureData['spoc']}
                        className="w-full mb-2 p-3 border border-gray-300 shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handleInputChange(e, input, index)}
                        onBlur={(e) => handleFocusOut(e, index)}
                    >
                        <option value="">Select Spoc</option>
                        {adminNames.map((admin, indx) => (
                            <option key={indx} value={admin.name}>{admin.name}</option>
                        ))}
                    </select>

                    {/* File input */}
                    <label className='text-sm font-bold text-gray-700 '>{input.label}</label>
                    <input
                        type="file"
                        name={input.name}
                        className="w-full p-2 border border-gray-300 shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        multiple={input.multiple}
                        onChange={(e) => handleFileChange(index, dbTable, input.name, e)}
                        onBlur={(e) => handleFocusOut(index, dbTable, input.name, e)}
                    />

                    {/* File preview */}
                    <div className="relative mt-4">
                        {annexureImagesSplitArr.length > 0 ? (
                            <div className="grid md:grid-cols-5 grid-cols-1 gap-5 overflow-auto max-h-64">
                                {annexureImagesSplitArr.map((image, idx) =>
                                    image.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                        <img src={image.trim()} alt={`Image ${idx + 1}`} key={idx} />
                                    ) : (
                                        <a href={image.trim()} target="_blank" rel="noopener noreferrer" key={idx}>
                                            <button type="button" className="px-4 py-2 bg-[#3e76a5] text-white rounded">
                                                View Document
                                            </button>
                                        </a>
                                    )
                                )}
                            </div>
                        ) : (
                            <p>No Image Found</p>
                        )}
                    </div>
                </>
            );
        }

        // If no file input in the row, add custom select at the end
        if (!rowHasFile && input.isLastInput) {
            const customInputName = `spoc`; // name to store in annexureData
            const inputValue = servicesDataInfo[index]?.annexureData?.[customInputName] || '';

            return (
                <select
                    name={customInputName}
                    value={inputValue}
                    className="w-full mt-2 p-3 border border-gray-300 shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                        // Create fake input object
                        const fakeInput = { name: customInputName, type: 'dropdown' };
                        handleInputChange(e, fakeInput, index, dbTable);
                    }}
                    onBlur={(e) => {
                        const fakeInput = { name: customInputName, type: 'dropdown' };
                        handleFocusOut(e, index, dbTable);
                    }}
                >
                    <option value="">Select Spoc</option>
                    {adminNames.map((admin, indx) => (
                        <option key={indx} value={admin.name}>{admin.name}</option>
                    ))}
                </select>
            );
        }

    };

    console.log(`ServicesDataInfo - `, servicesDataInfo);

    const handleTimeChange = useCallback((e, input, type, index, preSelectedTime) => {
        const { name, value } = e.target;
        let rawSelectedHour = selectedHour || preSelectedTime.hour;
        let rawSelectedMinute = selectedMinute || preSelectedTime.minutes;
        let rawSelectedPeriod = selectedPeriod || preSelectedTime.period;
        if (type == 'hour') {
            setSelectedHour(value);
            rawSelectedHour = value;
        } else if (type == 'minute') {
            setSelectedMinute(value);
            rawSelectedMinute = value;
        } else if (type == 'period') {
            setSelectedPeriod(value);
            rawSelectedPeriod = value;
        }
        const formattedTime = `${rawSelectedHour}:${rawSelectedMinute} ${rawSelectedPeriod}`;
        handleInputChange({ target: { name: input.name, value: formattedTime } }, input, index);
    }, [selectedHour, selectedMinute, selectedPeriod, handleInputChange]);




    const handleSubmit = useCallback(async (e, allSortingOrder) => {
        e.preventDefault();
        setIsApiLoading(true); // Start global loading spinner

        // Initialize the SweetAlert2 instance
        const swalInstance = Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we generate your report',
            allowOutsideClick: false, // Prevent closing Swal while processing
            showConfirmButton: false, // Hide the confirm button
            willOpen: () => {
                Swal.showLoading(); // Show the default spinner
            }
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
                            annexure[category].status = status || 'initiated';
                            annexure[category].sorting_order = sorting_order;
                            annexure[category].spoc = serviceData.annexureData?.spoc;
                        }

                        return { annexure };
                    })
                    .filter(Boolean); // Remove null values



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
                branch_id: applications.branch_id,
                customer_id: branchInfo?.customer_id || "",
                application_id: applications.id,
                ...formData,
                annexure: filteredSubmissionData,
                send_mail: Object.keys(files).length === 0 ? 1 : 0,
            });

            /*
            console.log(`raw - `, {
                admin_id: adminData?.id || "",
                _token: token || "",
                branch_id: applications.branch_id,
                customer_id: branchInfo?.customer_id || "",
                application_id: applications.id,
                ...formData,
                annexure: filteredSubmissionData,
                send_mail: Object.keys(files).length === 0 ? 1 : 0,
            });
            */

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

            // Reload the current page
            // window.location.reload();
            // fetchApplicationData();
            // fetchServicesJson();

        } catch (error) {
            console.error("Error during submission:", error);

            // If an error occurs, show the error message from the API
            Swal.fire("Error", error.message || "Failed to submit the application. Please try again.", "error");
        } finally {
            swalInstance.close(); // Close the Swal spinner
            setLoading(false); // Stop specific loading spinner
            setIsApiLoading(false); // Stop global loading spinner
        }
    }, [servicesDataInfo, branchInfo, formData, selectedStatuses, files]);

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

    const handleDatesChange = (date, fieldName) => {
        // console.log(`date - `, date);
        // Log when no date is selected
        if (!date) {
            // console.log("No date selected.");
            return;
        }

        // Adjust for the local time zone offset
        const localOffset = date.getTimezoneOffset() * 60000; // in milliseconds
        const localDate = new Date(date.getTime() - localOffset); // adjust to local time

        const formattedDate = localDate.toISOString().split("T")[0]; // Convert to "yyyy-mm-dd"
        // console.log("Formatted Date:", formattedDate);

        setFormData((prevFormData) => {
            // Log the previous form data
            // console.log("Previous Form Data:", prevFormData);

            const updatedFormData = {
                ...prevFormData,
                updated_json: {
                    ...prevFormData.updated_json,
                },
            };

            // Check if the field is inside `insuffDetails`
            if (fieldName.startsWith("updated_json.insuffDetails.")) {
                // console.log("Field is inside insuffDetails:", fieldName);

                const insuffField = fieldName.replace("updated_json.insuffDetails.", "");
                // console.log("InsuffField:", insuffField);

                updatedFormData.updated_json.insuffDetails = {
                    ...prevFormData.updated_json.insuffDetails, // Ensure existing values are kept
                    [insuffField]: formattedDate,
                };
            } else {
                // console.log("Field is outside insuffDetails:", fieldName);
                updatedFormData.updated_json[fieldName.split(".").pop()] = formattedDate;
            }

            // Log the updated form data before returning
            // console.log("Updated Form Data:", updatedFormData);

            return updatedFormData;
        });
    };

    return (
        <div className="border border-gray-300 shadow-md rounded-md">
            <h2 className="text-2xl font-bold py-3 text-center px-3  text-[#3e76a5] ">GENERATE REPORT</h2>
            <div className="bg-white ">
                {loading ? (
                    <div className='flex justify-center items-center py-6 '>
                        <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

                    </div>
                ) : (
                    <form className="space-y-4 p-2" autoComplete="off" onSubmit={(e) => handleSubmit(e, sortingOrder)}>

                        <div className=" form start space-y-4 py-[30px] md:px-[51px] bg-white rounded-md" id="client-spoc">
                            <input
                                type="checkbox"
                                name="updated_json.insta_drug_test"
                                id="insta_drug_test"
                                checked={
                                    ([true, "1", 1].includes(formData.updated_json.insta_drug_test)
                                    )
                                }
                                onChange={handleChange}
                                value={formData.updated_json.insta_drug_test}
                            />

                            <label htmlFor="insta_drug_test" className='font-bold  text-gray-700 capitalize text-lg ms-2'>Only Drug Test</label>

                            <div className="mb-4">
                                <label className='font-bold text-gray-700 text-sm' htmlFor="application_id">Application ID</label>
                                <input
                                    type="text"
                                    name="application_id"
                                    id="application_id"
                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                    value={formData.updated_json.application_id}
                                    disabled={formData.updated_json.application_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label className='font-bold text-gray-700 text-sm' htmlFor="month_year">Month - Year*</label>
                                        <DatePicker
                                            selected={formData.updated_json.month_year}  // Convert month_year string to Date
                                            onChange={handleDateChange}
                                            dateFormat="MMM yyyy"  // Format to display abbreviated Month and Year (e.g., "Jan 2025")
                                            showMonthYearPicker
                                            className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                            name="month_year"
                                            id="month_year"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className='font-bold text-gray-700 text-sm' htmlFor="initiation_date">Initiation Date</label>
                                        <DatePicker
                                            selected={formData.updated_json.initiation_date ? new Date(formData.updated_json.initiation_date) : null}
                                            onChange={(date) => handleDatesChange(date, "updated_json.initiation_date")}
                                            dateFormat="dd-MM-yyyy"
                                            className="w-full border border-gray-300 shadow-md p-2 outline-none rounded-md mt-2"
                                        />

                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label className='font-bold text-gray-700 text-sm' htmlFor="organization_name">Name of the Client Organization</label>
                                        <input
                                            type="text"
                                            name="organization_name"
                                            id="organization_name"
                                            className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.organization_name}
                                            disabled={formData.updated_json.organization_name}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="email" className='text-sm font-bold text-gray-700 ' >Purpose of Application</label>
                                        <select
                                            name="verification_purpose"
                                            onChange={handleCustomInputChange}
                                            value={formData.updated_json.verification_purpose}
                                            className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2"
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
                                                <label htmlFor="customPurpose" className='text-sm font-bold text-gray-700 '>Please specify the custom purpose</label>
                                                <input
                                                    type="text"
                                                    name="customPurpose"
                                                    value={formData.updated_json.customPurpose}
                                                    onChange={handleChange}
                                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2"
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
                                        <label className='font-bold text-gray-700 text-sm' htmlFor="employee_id">Applicant Employee ID</label>
                                        <input
                                            type="text"
                                            name="employee_id"
                                            id="employee_id"
                                            className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.employee_id}
                                            disabled={formData.updated_json.employee_id}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className='font-bold text-gray-700 text-sm' htmlFor="client_code">Client Code</label>
                                        <input
                                            type="text"
                                            name="client_code"
                                            id="client_code"
                                            disabled
                                            className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.client_code}

                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid  grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label className='font-bold text-gray-700 text-sm' htmlFor="applicant_name">Name of the Applicant*</label>
                                        <input
                                            type="text"
                                            name="applicant_name"
                                            id="applicant_name"
                                            className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.applicant_name}
                                            disabled
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                {![true, "1", 1].includes(formData.updated_json.insta_drug_test) && (
                                    <>

                                        <div className="mb-4">
                                            <label className='font-bold text-gray-700 text-sm' htmlFor="contact_number">Contact Number</label>
                                            <input
                                                type="tel"
                                                name="contact_number"
                                                id="contact_number"
                                                className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.contact_number}

                                                onChange={handleChange}
                                            />
                                        </div>


                                        <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                            <div className="mb-4">
                                                <label className='font-bold text-gray-700 text-sm' htmlFor="contact_number2">Contact Number 2:</label>
                                                <input
                                                    type="tel"
                                                    name="contact_number2"
                                                    id="contact_number2"
                                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                                    value={formData.updated_json.contact_number2}

                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className='font-bold text-gray-700 text-sm' htmlFor="father_name">Father's Name:</label>
                                                <input
                                                    type="text"
                                                    name="father_name"
                                                    id="father_name"
                                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                                    value={formData.updated_json.father_name}

                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
                                            <div className="mb-4">
                                                <label className='font-bold text-gray-700 text-sm' htmlFor="gender">Gender</label>
                                                <select
                                                    name="gender"
                                                    id="gender"
                                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2"
                                                    value={formData.updated_json.gender
                                                        ? formData.updated_json.gender.charAt(0).toUpperCase() + formData.updated_json.gender.slice(1).toLowerCase()
                                                        : ""}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>

                                            </div>
                                            <div className="mb-4">
                                                <label className='font-bold text-gray-700 text-sm' htmlFor="dob">Date Of Birth</label>

                                                <DatePicker
                                                    selected={formData.updated_json.dob ? new Date(formData.updated_json.dob) : null}
                                                    onChange={(date) => handleDatesChange(date, "updated_json.dob")}
                                                    dateFormat="dd-MM-yyyy"
                                                    className="w-full border-gray-300 shadow-md border p-2 outline-none rounded-md mt-2"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className='font-bold text-gray-700 text-sm' htmlFor="marital_status">Marital Status</label>
                                                <select
                                                    name="marital_status"
                                                    id="marital_status"
                                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2"
                                                    value={formData.updated_json.marital_status}

                                                    onChange={handleChange}
                                                >
                                                    <option value="">Select Marital Status</option>
                                                    < option value="Don't wish to disclose"> Don't wish to disclose</option>
                                                    < option value="Single"> Single </option>
                                                    < option value="Married"> Married </option>
                                                    < option value="Widowed"> Widowed </option>
                                                    < option value="Divorced"> Divorced </option>
                                                    < option value="Separated"> Separated </option>
                                                </select>
                                            </div>
                                        </div></>
                                )}

                            </div>
                            {![true, "1", 1].includes(formData.updated_json.insta_drug_test) && (
                                <>
                                    {/* Permanent Address */}
                                    <div className="permanentaddress">
                                        <div className="my-4 text-left md:text-2xl text-lg font-semibold mb-4">Permanent Address</div>
                                        <div className="form-group border border-blue-700 p-3 rounded-md">
                                            <div className="mb-4">
                                                <label className="font-bold text-gray-700 text-sm" htmlFor="full_address">Full Address:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.permanent_address.permanent_address"
                                                    id="full_address"
                                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                                    value={formData.updated_json.permanent_address.permanent_address || ''}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <h3 className="font-semibold text-xl mb-3">Period of Stay</h3>
                                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                                    <div className="mb-4">
                                                        <label className="font-bold text-gray-700 text-sm" htmlFor="permanent_sender_name">From:</label>
                                                        <input
                                                            type="text"
                                                            name="updated_json.permanent_address.permanent_sender_name"
                                                            id="permanent_sender_name"
                                                            className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                                            value={formData.updated_json.permanent_address.permanent_sender_name}
                                                            onChange={handleChange}
                                                        />
                                                    </div>

                                                    <div className="mb-4">
                                                        <label className="font-bold text-gray-700 text-sm" htmlFor="permanent_receiver_name">To:</label>
                                                        <input
                                                            type="text"
                                                            name="updated_json.permanent_address.permanent_receiver_name"
                                                            id="permanent_receiver_name"
                                                            className="w-full border p-2 border-gray-300 shadow-md outline-none rounded-md mt-2 capitalize"
                                                            value={formData.updated_json.permanent_address.permanent_receiver_name}
                                                            onChange={handleChange}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                                    <div className="mb-4">
                                                        <label className="font-bold text-gray-700 text-sm" htmlFor="permanent_landmark">Landmark:</label>
                                                        <input
                                                            type="text"
                                                            name="updated_json.permanent_address.permanent_landmark"
                                                            id="permanent_landmark"
                                                            className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                                            value={formData.updated_json.permanent_address.permanent_landmark}
                                                            onChange={handleChange}
                                                        />
                                                    </div>

                                                    <div className="mb-4">
                                                        <label className="font-bold text-gray-700 text-sm" htmlFor="permanent_pin_code">Pin Code:</label>
                                                        <input
                                                            type="text"
                                                            name="updated_json.permanent_address.permanent_pin_code"
                                                            id="permanent_pin_code"
                                                            className="w-full border p-2 outline-none border-gray-300 shadow-md rounded-md mt-2 capitalize"
                                                            value={formData.updated_json.permanent_address.permanent_pin_code}
                                                            onChange={handleChange}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <label className="font-bold text-gray-700 text-sm" htmlFor="permanent_state">State:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_state"
                                                        id="permanent_state"
                                                        className="w-full border p-2 border-gray-300 shadow-md outline-none rounded-md mt-2 capitalize"
                                                        value={formData.updated_json.permanent_address.permanent_state}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Address */}
                                    <div className="currentaddress">
                                        <div className="my-4 text-left md:text-2xl text-lg font-semibold mb-4">Current Address</div>
                                        <div className="form-group border border-blue-700 rounded-md p-3">
                                            <div className="mb-4">
                                                <label className="font-bold text-gray-700 text-sm" htmlFor="current_full_address">Full Address:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.address.address"
                                                    id="current_full_address"
                                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                                    value={formData.updated_json.address.address}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="font-bold text-gray-700 text-sm" htmlFor="landmark">Landmark:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.address.landmark"
                                                    id="landmark"
                                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                                    value={formData.updated_json.address.landmark}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="font-bold text-gray-700 text-sm" htmlFor="residence_mobile_number">Residence Mobile No:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.address.residence_mobile_number"
                                                    id="residence_mobile_number"
                                                    className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                                    value={formData.updated_json.address.residence_mobile_number}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="font-bold text-gray-700 text-sm" htmlFor="state">State:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.address.state"
                                                    id="state"
                                                    className="w-full border p-2 border-gray-300 shadow-md outline-none rounded-md mt-2 capitalize"
                                                    value={formData.updated_json.address.state}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>

                        <div>
                            <h1 className="text-center md:text-2xl text-lg text-[#3e76a5]">SELECTED SERVICES</h1>

                            <div className="SelectedServices border md:p-5 p-2 overflow-auto bg-gray-100 rounded-md md:mx-12">
                                {servicesDataInfo && servicesDataInfo.map((serviceData, index) => {
                                    if (serviceData.serviceStatus) {
                                        const formJson = JSON.parse(serviceData.reportFormJson.json);
                                        const dbTable = formJson.db_table;
                                        const status = serviceData?.annexureData?.status || "initiated";
                                        const sortingOrderFinal = serviceData?.annexureData?.sorting_order || "";
                                        const preselectedStatus = selectedStatuses[index] ?? status;
                                        const preselectedSortingOrder = sortingOrder[dbTable] ?? sortingOrderFinal;

                                        const isInstaDrugTestEnabled = !["0", 0, false, "false", null, undefined, ""].includes(
                                            formData.updated_json.insta_drug_test
                                        );

                                        if ((isInstaDrugTestEnabled && formJson.heading === "INSTA DRUG TEST") || !isInstaDrugTestEnabled) {
                                            return (
                                                <div key={index} className="mb-6 md:grid grid-cols-3 gap-3 justify-between mt-5">
                                                    {formJson.heading && (
                                                        <>
                                                            <span className="text-sm block font-bold text-gray-700">{formJson.heading}</span>

                                                            {/* Status Selector */}
                                                            <select
                                                                className="border border-gray-300 text-sm shadow-md p-2 mt-4 md:mt-0 w-full rounded-md"
                                                                value={preselectedStatus}
                                                                onChange={(e) => handleStatusChange(e, index)}
                                                            >
                                                                <option value="">--Select Status--</option>
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
                                                                type="number"
                                                                placeholder="Sorting Order"
                                                                className="border border-gray-300 text-sm shadow-md p-2 mt-4 md:mt-0 rounded-md w-full"
                                                                id={`sorting_order_${index}`}
                                                                value={preselectedSortingOrder}
                                                                onChange={(e) => {
                                                                    handleSortingOrderChange(e, index, dbTable);
                                                                }}
                                                            />

                                                        </>
                                                    )}
                                                </div>
                                            );
                                        }
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
                                        const annexureData = serviceData?.annexureData || {};
                                        let annexureImagesSplitArr = [];

                                        const isInstaDrugTestEnabled = !["0", 0, false, "false", null, undefined, ""].includes(
                                            formData.updated_json.insta_drug_test
                                        );

                                        if ((isInstaDrugTestEnabled && formJson.heading === "INSTA DRUG TEST") || !isInstaDrugTestEnabled) {
                                            const annexureImagesKey = Object.keys(annexureData).find(key =>
                                                key.toLowerCase().startsWith("annexure") &&
                                                !key.includes("[") &&
                                                !key.includes("]")
                                            );
                                            if (annexureImagesKey) {
                                                const annexureImagesStr = annexureData[annexureImagesKey];
                                                annexureImagesSplitArr = annexureImagesStr ? annexureImagesStr.split(",") : [];
                                            }

                                            return (
                                                <>
                                                    {((isInstaDrugTestEnabled && formJson.heading === "INSTA DRUG TEST") || !isInstaDrugTestEnabled) &&
                                                        selectedStatuses[index] !== "nil" && (
                                                            <div key={index} className="mb-6 overflow-x-auto p-4 bg-gray-100 border border-blue-700">
                                                                {dbTableHeading && (
                                                                    <h3 className="text-center text-lg md:text-xl font-semibold mb-4 text-[#3e76a5]">
                                                                        {dbTableHeading}
                                                                    </h3>
                                                                )}
                                                                <table className="md:w-full">
                                                                    <thead>
                                                                        <tr className="bg-[#3e76a5] text-white">
                                                                            {formJson.headers.map((header, idx) => (
                                                                                <th
                                                                                    key={idx}
                                                                                    className={`py-2 px-4 text-lg ${idx === 0 ? "text-left" : idx === 1 ? "text-right" : ""}`}
                                                                                >
                                                                                    {header}
                                                                                </th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {formJson.rows.map((row, idx) => {
                                                                            const hasSingleInput = row.inputs.length === 1;
                                                                            return (
                                                                                <tr key={idx}>
                                                                                    {hasSingleInput ? (
                                                                                        <td colSpan={formJson.headers.length} className="py-2 px-4 w-full">
                                                                                            {renderInput(index, dbTable, row.inputs[0], annexureImagesSplitArr)}
                                                                                        </td>
                                                                                    ) : (
                                                                                        row.inputs.map((input, i) => (
                                                                                            <td key={i} className="py-2 px-4 w-full md:w-1/2">
                                                                                                {renderInput(index, dbTable, input, annexureImagesSplitArr)}
                                                                                            </td>
                                                                                        ))
                                                                                    )}
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                </>
                                            );

                                        }
                                    }
                                    return null;
                                })}
                            </div>
                        </div>


                        <div className="form-group  rounded-md p-3">
                            <div className="mb-4">
                                <label className='capitalize text-gray-500' htmlFor="first_insufficiency_marks">First Level Insufficiency Remarks</label>
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
                                <label className='capitalize text-gray-500' htmlFor="first_insuff_date">First Insuff Raised Date:</label>
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
                                <label className='capitalize text-gray-500' htmlFor="first_insuff_reopened_date">First Insuff Cleared Date / Re-Opened date</label>
                                <input
                                    type="date"
                                    name="updated_json.insuffDetails.first_insuff_reopened_date"
                                    id="first_insuff_reopened_date"
                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                    value={formData.updated_json.insuffDetails.first_insuff_reopened_date}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="capitalize font-bold text-gray-700 text-sm" htmlFor="overall_status">
                                    Overall Status
                                </label>
                                <select
                                    name="updated_json.insuffDetails.overall_status"
                                    value={formData.updated_json.insuffDetails.overall_status}
                                    onChange={handleChange}
                                    className="border border-gray-300 shadow-md rounded-md p-2 mt-2 capitalize w-full"
                                >
                                    <option value="">Select Overall Status</option>
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
                                    <option value="completed" disabled={!allCompleted}>
                                        COMPLETED
                                    </option>
                                </select>
                            </div>

                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className="capitalize font-bold text-gray-700 text-sm" htmlFor="report_date">
                                        Report Date
                                    </label>
                                    <DatePicker
                                        selected={
                                            formData.updated_json.insuffDetails.report_date
                                                ? new Date(formData.updated_json.insuffDetails.report_date)
                                                : null
                                        }
                                        onChange={(date) => handleDatesChange(date, "updated_json.insuffDetails.report_date")}
                                        dateFormat="dd-MM-yyyy"
                                        className="border border-gray-300 shadow-md rounded-md p-2 w-full mt-2 capitalize"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="capitalize font-bold text-gray-700 text-sm" htmlFor="report_type">
                                        Report Type:
                                    </label>
                                    <select
                                        name="updated_json.insuffDetails.report_type"
                                        value={formData.updated_json.insuffDetails.report_type}
                                        onChange={handleChange}
                                        className="border uppercase border-gray-300 shadow-md rounded-md p-2 mt-2 w-full"
                                    >
                                        <option value="">Select Report Type</option>
                                        <option value="Final">Final</option>
                                        <option value="Stopcheck">Stopcheck</option>
                                        <option value="Interim">Interim</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className="capitalize font-bold text-gray-700 text-sm" htmlFor="final_verification_status">
                                        Final Verification Status:
                                    </label>
                                    <select
                                        name="updated_json.insuffDetails.final_verification_status"
                                        value={formData.updated_json.insuffDetails.final_verification_status}
                                        onChange={handleChange}
                                        className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                    >
                                        <option value="">Select Verification Status</option>
                                        <option value="green">Green</option>
                                        <option value="red">Red</option>
                                        <option value="yellow">Yellow</option>
                                        <option value="pink">Pink</option>
                                        <option value="orange">Orange</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="capitalize font-bold text-gray-700 text-sm" htmlFor="report_status">
                                        Report Status:
                                    </label>
                                    <select
                                        name="updated_json.insuffDetails.report_status"
                                        value={formData.updated_json.insuffDetails.report_status}
                                        onChange={handleChange}
                                        className="border border-gray-300 shadow-md rounded-md p-2 mt-2 capitalize w-full"
                                    >
                                        <option value="">Select Report Status</option>
                                        <option value="Open">Open</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-1 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className="capitalize font-bold text-gray-700 text-sm" htmlFor="is_verify">
                                        Is Verified by Quality Team
                                    </label>
                                    <select
                                        name="updated_json.insuffDetails.is_verify"
                                        value={formData.updated_json.insuffDetails.is_verify}
                                        onChange={handleChange}
                                        className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                    >
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className="capitalize font-bold text-gray-700 text-sm" htmlFor="report_generate_by">
                                        Report Generated By:
                                    </label>
                                    <select
                                        name="updated_json.insuffDetails.report_generate_by"
                                        value={formData?.updated_json?.insuffDetails?.report_generate_by ?? ""}
                                        onChange={handleChange}
                                        className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                    >
                                        <option value="">Select Admin</option>
                                        {reportGeneratorAdminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>
                                                {spoc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="capitalize block font-bold text-gray-700 text-sm" htmlFor="qc_done_by">
                                        QC Done By:
                                    </label>
                                    <select
                                        name="updated_json.insuffDetails.qc_done_by"
                                        value={formData?.updated_json?.insuffDetails?.qc_done_by ?? ""}
                                        onChange={handleChange}
                                        className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                    >
                                        <option value="">Select Admin</option>
                                        {qCVerifierAdminNames.map((spoc, index) => (
                                            <option key={index} value={spoc.id}>
                                                {spoc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {!["1", 1, true].includes(formData.updated_json.insta_drug_test) && (
                                <div className="mb-4">
                                    <label className="capitalize font-bold text-gray-700 text-sm" htmlFor="deadline_date">
                                        Deadline Date
                                    </label>
                                    <DatePicker
                                        selected={
                                            formData.updated_json.insuffDetails.deadline_date
                                                ? new Date(formData.updated_json.insuffDetails.deadline_date)
                                                : null
                                        }
                                        onChange={(date) => handleDatesChange(date, "updated_json.insuffDetails.deadline_date")}
                                        dateFormat="dd-MM-yyyy"
                                        className="border border-gray-300 shadow-md w-full rounded-md p-2 mt-2 capitalize"
                                        placeholderText="Deadline Date"
                                    />
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
