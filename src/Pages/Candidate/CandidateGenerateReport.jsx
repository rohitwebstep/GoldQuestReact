
import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2'
import axios from 'axios';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader

const CandidateGenerateReport = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [branchInfo, setBranchInfo] = useState([]);
    const [customerInfo, setCustomerInfo] = useState([]);
    const [adminNames, setAdminNames] = useState([]);

    const [formData, setFormData] = useState({
        updated_json: {
            month_year: '',
            initiation_date: '',
            organization_name: '',
            verification_purpose: '',
            employee_id: '',
            client_code: '',
            applicant_name: '',
            contact_number: '',
            contact_number2: '',
            father_name: '',
            dob: '',
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
                first_insufficiency_marks: '',
                first_insuff_date: '',
                first_insuff_reopened_date: '',
                second_insufficiency_marks: '',
                second_insuff_date: '',
                second_insuff_reopened_date: '',
                third_insufficiency_marks: '',
                third_insuff_date: '',
                third_insuff_reopened_date: '',
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
    };

    // Check if all statuses are 'completed' (as per your original logic)
    const allCompleted = selectedStatuses.every(status =>
        status && status.includes('completed')
    );

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


    const fetchServicesJson = useCallback(async (servicesList) => {
        setLoading(true);

        try {
            const adminData = JSON.parse(localStorage.getItem("admin"));
            const adminId = adminData?.id;
            const token = localStorage.getItem("_token");

            // Return an empty array if servicesList is empty or undefined
            if (!servicesList || servicesList.length === 0) {
                console.warn("Services list is empty.");
                setLoading(false);
                return [];
            }

            // Ensure necessary parameters are available
            if (!adminId || !token) {
                console.error("Missing admin ID or token.");
                setLoading(false);
                return [];
            }

            const requestOptions = {
                method: "GET",
                redirect: "follow",
            };

            // Construct the URL with service IDs
            const url = new URL(
                "https://api.goldquestglobal.in/client-master-tracker/services-annexure-data"
            );
            url.searchParams.append("service_ids", servicesList);
            url.searchParams.append("application_id", applicationId);
            url.searchParams.append("admin_id", adminId);
            url.searchParams.append("_token", token);

            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                console.error("Failed to fetch service data:", response.statusText);
                setLoading(false);
                return [];
            }

            const result = await response.json();

            // Update the token if a new one is provided
            const newToken = result.token || result._token || "";
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            // Filter out null or invalid items
            const filteredResults = result.results?.filter((item) => item != null) || [];
            setServicesDataInfo(filteredResults);
            return filteredResults;
        } catch (error) {
            console.error("Error fetching service data:", error);
            return [];
        } finally {
            setLoading(false); // Ensure loading is stopped in all cases
        }
    }, [applicationId, setServicesDataInfo]); // Add dependencies where necessary


    useEffect(() => {
        fetchServicesJson();
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
        setLoading(true);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`https://api.goldquestglobal.in/client-master-tracker/application-by-id?application_id=${applicationId}&branch_id=${branchid}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {

                const newToken = result.token || result._token || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                const applicationData = result.application;
                const cmtData = result.CMTData || [];
                const services = applicationData.services;
                fetchServicesJson(services);
                setBranchInfo(result.branchInfo);
                setCustomerInfo(result.customerInfo);


                setAdminNames(result.admins)

                setFormData(prevFormData => ({
                    ...prevFormData,
                    updated_json: {
                        month_year: cmtData.month_year || applicationData.month_year || prevFormData.updated_json.month_year || '',

                        organization_name: applicationData.name || prevFormData.updated_json.organization_name || '',
                        verification_purpose: cmtData.verification_purpose || prevFormData.updated_json.verification_purpose || '',
                        employee_id: applicationData.employee_id || prevFormData.updated_json.employee_id || '',
                        client_code: cmtData.client_code || prevFormData.updated_json.client_code || '',
                        applicant_name: cmtData.applicant_name || prevFormData.updated_json.applicant_name || '',
                        contact_number: cmtData.contact_number || prevFormData.updated_json.contact_number || '',
                        contact_number2: cmtData.contact_number2 || prevFormData.updated_json.contact_number2 || '',
                        father_name: cmtData.father_name || prevFormData.updated_json.father_name || '',
                        initiation_date: (cmtData.initiation_date && !isNaN(new Date(cmtData.initiation_date).getTime()))
                            ? new Date(cmtData.initiation_date).toISOString().split('T')[0] // Format as YYYY-MM-DD
                            : (prevFormData.updated_json.insuffDetails.initiation_date
                                ? new Date(prevFormData.updated_json.insuffDetails.initiation_date).toISOString().split('T')[0]
                                : ''),

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



                            second_insufficiency_marks: cmtData.second_insufficiency_marks || prevFormData.updated_json.insuffDetails.second_insufficiency_marks || '',
                            second_insuff_date: (cmtData.second_insuff_date && !isNaN(new Date(cmtData.second_insuff_date).getTime()))
                                ? parseAndConvertDate(cmtData.second_insuff_date)
                                : (prevFormData.updated_json.insuffDetails.second_insuff_date
                                    ? parseAndConvertDate(prevFormData.updated_json.insuffDetails.second_insuff_date)
                                    : ''),
                            second_insuff_reopened_date: (cmtData.second_insuff_reopened_date && !isNaN(new Date(cmtData.second_insuff_reopened_date).getTime()))
                                ? new Date(cmtData.second_insuff_reopened_date).toISOString().split('T')[0]
                                : (prevFormData.updated_json.insuffDetails.second_insuff_reopened_date
                                    ? new Date(prevFormData.updated_json.insuffDetails.second_insuff_reopened_date).toISOString().split('T')[0]
                                    : ''),

                            third_insufficiency_marks: cmtData.third_insufficiency_marks || prevFormData.updated_json.insuffDetails.third_insufficiency_marks || '',
                            third_insuff_date: (cmtData.third_insuff_date && !isNaN(new Date(cmtData.third_insuff_date).getTime()))
                                ? new Date(cmtData.third_insuff_date).toISOString().split('T')[0]
                                : (prevFormData.updated_json.insuffDetails.third_insuff_date
                                    ? new Date(prevFormData.updated_json.insuffDetails.third_insuff_date).toISOString().split('T')[0]
                                    : ''),

                            third_insuff_reopened_date: (cmtData.third_insuff_reopened_date && !isNaN(new Date(cmtData.third_insuff_reopened_date).getTime()))
                                ? new Date(cmtData.third_insuff_reopened_date).toISOString().split('T')[0]
                                : (prevFormData.updated_json.insuffDetails.third_insuff_reopened_date
                                    ? new Date(prevFormData.updated_json.insuffDetails.third_insuff_reopened_date).toISOString().split('T')[0]
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
                        },

                    }
                }));
            })
            .catch((error) => {
            }).finally(() => {
                setLoading(false);

            })
    }, [applicationId, branchid, fetchServicesJson, setBranchInfo, setCustomerInfo, setFormData]);

    useEffect(() => {
        fetchApplicationData();
    }, [fetchApplicationData]);


    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prevFormData) => {
            const updatedFormData = { ...prevFormData };

            // Determine where to update based on the name
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

            return updatedFormData;
        });
    };
    const fetchAdminList = useCallback(() => {
        setLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            return;
        } else {
            setLoading(true);
        }

        // Construct the URL with query parameters
        const url = `https://api.goldquestglobal.in/admin/list?admin_id=${admin_id}&_token=${storedToken}`;

        const requestOptions = {
            method: 'GET',  // GET request doesn't need a body
            redirect: 'follow', // Handling redirects, if any
        };

        fetch(url, requestOptions)
            .then((response) => {
                const result = response.json();
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return result;
            })
            .then((result) => {

                if (result.status) {
                    // Map through the `client_spocs` array to get the names
                    const spocsWithIds = result.client_spocs.map(spoc => ({
                        id: spoc.id,
                        name: spoc.name
                    }));

                    setAdminNames(spocsWithIds || []);
                } else {
                    console.error('Error: ', result.message);
                }
            })
            .catch((error) => {
                console.error('Fetch error:', error);
                setLoading(false); // Ensure loading state is reset on error
            })
            .finally(() => {
                setLoading(false);  // Reset loading state after fetch completes
            });
    }, []); // Empty dependency array, so it only runs once on component mount

    useEffect(() => {
        fetchAdminList();
    }, [fetchAdminList]);

    const uploadCustomerLogo = async (email_status) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;

        const fileCount = Object.keys(files).length;
        for (const [rawKey, value] of Object.entries(files)) {
            const storedToken = localStorage.getItem("_token");

            const key = rawKey.replace("[]", "");
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

                // Set new token if available in the response
                const newToken = response?.data?.filteredResults?.find(
                    (result) => result?.token || result?._token
                );
                if (newToken) {
                    localStorage.setItem("_token", newToken.token || newToken._token);
                }

            } catch (err) {
                // Handle error
                console.error(err);
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
                        <label className='text-sm md:text-lg'>{input.label}</label>
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
                        <label>{input.label}</label>
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
                        <label>{input.label}</label>
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
                        <label>{input.label}</label>
                        <input
                            type="file"
                            name={input.name}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            multiple={input.multiple}
                            onChange={(e) => handleFileChange(index, dbTable, input.name, e)} // Update this function if needed
                        />
                        <div className="relative w-full    mt-4 max-w-full">
                            {annexureImagesSplitArr.length > 0 && (
                                <div className=" grid  grid-cols-6 gap-5">
                                    {annexureImagesSplitArr.map((image, index) => (
                                        <img
                                            key={index}
                                            src={`${image.trim()}`}
                                            alt={`${index + 1}`}
                                            className="cursor-pointer h-[200px] mt-0 object-contain"

                                        />
                                    ))}
                                </div>
                            )}
                        </div>




                    </>
                );
            default:
                return (
                    <><label>{input.label}</label>
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


    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true); // Start loading spinner
        const fileCount = Object.keys(files).length;

        try {
            const adminData = JSON.parse(localStorage.getItem("admin"));
            const token = localStorage.getItem("_token");

            // Prepare submission data
            const submissionData = servicesDataInfo
                .map((serviceData, index) => {
                    if (serviceData.serviceStatus) {
                        const formJson = serviceData.reportFormJson?.json
                            ? JSON.parse(serviceData.reportFormJson.json)
                            : null;

                        if (!formJson) {
                            console.warn(`Invalid formJson for service at index ${index}`);
                            return null;
                        }

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

                        const category = formJson.db_table || "default_category";
                        const status = selectedStatuses?.[index] || "";
                        if (annexure[category]) {
                            annexure[category].status = status;
                        }

                        return { annexure };
                    }
                    return null;
                })
                .filter(Boolean); // Remove null values

            if (!submissionData.length) {
                console.warn("No valid submission data found.");
                Swal.fire("Error", "No data to submit. Please check your inputs.", "error");
                setLoading(false);
                return;
            }

            // Flatten and clean up annexure data
            const filteredSubmissionData = submissionData.reduce(
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

            // Prepare request payload
            const raw = JSON.stringify({
                admin_id: adminData?.id || "",
                _token: token || "",
                branch_id: branchid,
                customer_id: branchInfo?.customer_id || "",
                application_id: applicationId,
                ...formData,
                annexure: filteredSubmissionData,
                send_mail: fileCount === 0 ? 1 : 0,
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
                throw new Error(errorMessage);
            }

            // Success Handling
            const successMessage = result.success_message || "Application updated successfully.";
            if (fileCount == 0) {
                Swal.fire({
                    title: "Success",
                    text: successMessage,
                    icon: "success",
                    confirmButtonText: "Ok",
                });
            }
            if (fileCount > 0) {
                await uploadCustomerLogo(result.email_status);
                Swal.fire({
                    title: "Success",
                    text: successMessage,
                    icon: "success",
                    confirmButtonText: "Ok",
                });
            }

        } catch (error) {
            console.error("Error during submission:", error);
            Swal.fire("Error", error.message || "Failed to submit the application. Please try again.", "error");
        } finally {
            setLoading(false); // Ensure loading spinner stops
        }
    }, [servicesDataInfo, branchid, branchInfo, applicationId, formData, selectedStatuses, files]);



    return (
        <div className="border rounded-md">
            <h2 className="text-2xl font-bold py-3 text-center px-3 "> CANDIDATE GENERATE REPORT</h2>
            <div className="bg-white md:p-12">
                {loading ? (
                    <div className='flex justify-center items-center py-6 '>
                        <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

                    </div>
                ) : (
                    <form className="space-y-4 p-2" autoComplete="off" onSubmit={handleSubmit}>

                        <div className=" form start space-y-4 py-[30px] md:px-[51px] bg-white rounded-md" id="client-spoc">
                            <div>
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="month_year">Month - Year*</label>
                                        <input
                                            type="text"
                                            name="month_year"
                                            id="month_year"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.month_year || ''}
                                            onChange={handleChange}
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
                                        <label htmlFor="verification_purpose">Verification Purpose*</label>
                                        <input
                                            type="text"
                                            name="verification_purpose"
                                            id="verification_purpose"
                                            className="border w-full rounded-md p-2 mt-2 capitalize"
                                            value={formData.updated_json.verification_purpose}

                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

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
                                <div className='my-4 text-center md:text-2xl text-lg font-semibold'>Permanent Address</div>
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
                                <div className='my-4 text-center md:text-2xl text-lg font-semibold'>Current Address </div>
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
                            <div className="SelectedServices border md:p-5 p-2  rounded-md md:mx-12">
                                <h1 className="text-center md:text-2xl text-lg">SELECTED SERVICES</h1>
                                {servicesDataInfo && servicesDataInfo.map((serviceData, index) => {
                                    if (serviceData.serviceStatus) {
                                        const formJson = JSON.parse(serviceData.reportFormJson.json);
                                        let status = serviceData?.annexureData?.status || '';
                                        let preselectedStatus = selectedStatuses[index] || status;

                                        return (
                                            <div key={index} className="mb-6 flex justify-between mt-5">
                                                {formJson.heading && (
                                                    <>
                                                        <span>{formJson.heading}</span>
                                                        <select
                                                            className="border p-2 w-7/12 rounded-md"
                                                            value={preselectedStatus}
                                                            onChange={(e) => handleStatusChange(e, index)}  // Call the handler here
                                                            required
                                                        >
                                                            <option value="">--Select status--</option>
                                                            <option value="nil">NIL</option>
                                                            <option value="initiated">INITIATED</option>
                                                            <option value="hold">HOLD</option>
                                                            <option value="closure advice">CLOSURE ADVICE</option>
                                                            <option value="wip">WIP</option>
                                                            <option value="insuff">INSUFF</option>
                                                            <option value="completed">COMPLETED</option>
                                                            <option value="completed_green">COMPLETED GREEN</option>
                                                            <option value="completed_orange">COMPLETED ORANGE</option>
                                                            <option value="completed_red">COMPLETED RED</option>
                                                            <option value="completed_yellow">COMPLETED YELLOW</option>
                                                            <option value="completed_pink">COMPLETED PINK</option>
                                                            <option value="stopcheck">STOPCHECK</option>
                                                            <option value="active employment">ACTIVE EMPLOYMENT</option>
                                                            <option value="not doable">NOT DOABLE</option>
                                                            <option value="candidate denied">CANDIDATE DENIED</option>
                                                        </select>
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
                                                        <table className="w-full table-auto border-collapse border border-gray-300">
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
                                <label className='capitalize text-gray-500' htmlFor="second Level Insufficiency Remarks">Second Level Insufficiency Remarks</label>
                                <input
                                    type="text"
                                    name="updated_json.insuffDetails.second_insufficiency_marks"
                                    id="second_insufficiency_marks"
                                    value={formData.updated_json.insuffDetails.second_insufficiency_marks}
                                    onChange={handleChange}
                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                />

                            </div>
                            <div className="mb-4">
                                <label className='capitalize text-gray-500' htmlFor="second Insuff Raised Date:">Second Insuff Raised Date:</label>
                                <input
                                    type="date"
                                    name="updated_json.insuffDetails.second_insuff_date"
                                    id="second_insuff_date"
                                    value={formData.updated_json.insuffDetails.second_insuff_date}
                                    onChange={handleChange}
                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                />

                            </div>
                            <div className="mb-4">
                                <label className='capitalize text-gray-500' htmlFor="second Insuff Cleared Date / Re-Opened date">Second Insuff Cleared Date / Re-Opened date</label>
                                <input
                                    type="date"
                                    name="updated_json.insuffDetails.second_insuff_reopened_date"
                                    id="second_insuff_reopened_date"
                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                    value={formData.updated_json.insuffDetails.second_insuff_reopened_date}
                                    onChange={handleChange}
                                />

                            </div>
                            <div className="mb-4">
                                <label className='capitalize text-gray-500' htmlFor="third Level Insufficiency Remarks">third Level Insufficiency Remarks</label>
                                <input
                                    type="text"
                                    name="updated_json.insuffDetails.third_insufficiency_marks"
                                    id="third_insufficiency_marks"
                                    value={formData.updated_json.insuffDetails.third_insufficiency_marks}
                                    onChange={handleChange}
                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                />

                            </div>
                            <div className="mb-4">
                                <label className='capitalize text-gray-500' htmlFor="third Insuff Raised Date:">third Insuff Raised Date:</label>
                                <input
                                    type="date"
                                    name="updated_json.insuffDetails.third_insuff_date"
                                    id="third_insuff_date"
                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                    value={formData.updated_json.insuffDetails.third_insuff_date}
                                    onChange={handleChange}
                                />

                            </div>
                            <div className="mb-4">
                                <label className='capitalize text-gray-500' htmlFor="third Insuff Cleared Date / Re-Opened date">third Insuff Cleared Date / Re-Opened date</label>
                                <input
                                    type="date"
                                    name="updated_json.insuffDetails.third_insuff_reopened_date"
                                    id="third_insuff_reopened_date"
                                    className="border w-full rounded-md p-2 mt-2 capitalize"
                                    value={formData.updated_json.insuffDetails.third_insuff_reopened_date}
                                    onChange={handleChange}
                                />

                            </div>
                            <div className="mb-4 ">
                                <label className='capitalize text-gray-500' htmlFor="overall status">overall status</label>
                                <select
                                    name="updated_json.insuffDetails.overall_status"
                                    value={formData.updated_json.insuffDetails.overall_status}
                                    onChange={handleChange}
                                    className="border rounded-md p-2 mt-2 uppercase w-full"
                                >
                                    <option value="insuff">insuff</option>
                                    <option value="initiated">initiated</option>
                                    <option value="wip">wip</option>
                                    <option value="hold">hold</option>
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
                                        className="border rounded-md p-2 mt-2 uppercase w-full">
                                        <option value="insuff">insuff</option>
                                        <option value="inititated">inititated</option>
                                        <option value="wip" >wip</option>
                                        <option value="hold">hold</option>
                                    </select>

                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="report status">Report Type:</label>
                                    <select name="updated_json.insuffDetails.report_type" id=""
                                        value={formData.updated_json.insuffDetails.report_type}
                                        onChange={handleChange}
                                        className="border rounded-md p-2 mt-2 uppercase w-full">
                                        <option value="insuff">insuff</option>
                                        <option value="inititated">inititated</option>
                                        <option value="wip" >wip</option>
                                        <option value="hold">hold</option>
                                    </select>

                                </div>
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500' htmlFor="Final Verification Status:">Final Verification Status:</label>
                                    <select name="updated_json.insuffDetails.final_verification_status"
                                        value={formData.updated_json.insuffDetails.final_verification_status}
                                        onChange={handleChange}
                                        id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                        <option value="insuff">insuff</option>
                                        <option value="inititated">inititated</option>
                                        <option value="wip" >wip</option>
                                        <option value="hold">hold</option>
                                    </select>



                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4">
                                    <label className='capitalize text-gray-500  ' htmlFor="Is verified by quality team">Is verified by quality team</label>
                                    <select name="updated_json.insuffDetails.is_verify"
                                        value={formData.updated_json.insuffDetails.is_verify}
                                        onChange={handleChange}

                                        id="" className="border w-full rounded-md p-2 mt-2 uppercase">
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
                                        id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                        <option value="yes">yes</option>
                                        <option value="no">no</option>
                                    </select>

                                </div>
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500' htmlFor="basic entry">basic entry</label>
                                    <select name="updated_json.insuffDetails.basic_entry"
                                        value={formData.updated_json.insuffDetails.basic_entry}
                                        onChange={handleChange}
                                        id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                        <option value="yes">yes</option>
                                        <option value="no">no</option>
                                    </select>

                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500 ' htmlFor="education">education</label>
                                    <select name="updated_json.insuffDetails.education" id=""
                                        value={formData.updated_json.insuffDetails.education}
                                        onChange={handleChange}
                                        className="border w-full rounded-md p-2 mt-2 uppercase">
                                        <option value="yes">yes</option>
                                        <option value="no">no</option>
                                    </select>

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
                                        className="border w-full rounded-md p-2 mt-2 uppercase">
                                        <option value="yes">yes</option>
                                        <option value="no">no</option>
                                    </select>

                                </div>
                                <div className="mb-4 ">
                                    <label className='capitalize text-gray-500' htmlFor="Report Generated By:">Report Generated By:</label>
                                    <select name="updated_json.insuffDetails.report_generate_by"
                                        value={formData.updated_json.insuffDetails.report_generate_by}
                                        onChange={handleChange}
                                        id="" className="border w-full rounded-md p-2 mt-2 uppercase">
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
                                    id="" className="border w-full rounded-md p-2 mt-2 uppercase">
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

export default CandidateGenerateReport;
