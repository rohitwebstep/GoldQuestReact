import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';
import { MdOutlineArrowRightAlt } from "react-icons/md";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // Correct path for newer Swiper versions
import axios from 'axios';
import LogoBgv from '../Images/LogoBgv.jpg'
import { FaGraduationCap, FaBriefcase, FaIdCard } from 'react-icons/fa';
import { FaUser, FaCog, FaCheckCircle } from 'react-icons/fa'

const CandidateBGV = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const [error, setError] = useState(null);
    const [customBgv, setCustomBgv] = useState('');
    const [nationality, setNationality] = useState([]);
    const [cefData, setCefData] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [purpose, setPurpose] = useState('');
    const [serviceData, setServiceData] = useState([]);
    const [serviceValueData, setServiceValueData] = useState([]);

    const location = useLocation();
    const currentURL = location.pathname + location.search;

    const queryParams = new URLSearchParams(location.search);

    const branchId = queryParams.get('branch_id');
    const applicationId = queryParams.get('applicationId');

    const fetchData = useCallback(() => {
        setIsApiLoading(true);
        setLoading(true); // Start loading

        const MyToken = localStorage.getItem('_token');
        const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
        const admin_id = adminData?.id;

        if (!MyToken || !admin_id || !applicationId || !branchId) {
            setError('Missing required parameters or authentication token.');
            setLoading(false); // Stop loading if required params are missing
            return;
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        fetch(
            `https://api.goldquestglobal.in/candidate-master-tracker/bgv-application-by-id?application_id=${applicationId}&branch_id=${branchId}&admin_id=${admin_id}&_token=${MyToken}`,
            requestOptions
        )
            .then(res => {
                return res.json().then(data => {
                    const newToken = data.token || data._token || '';
                    if (newToken) {
                        localStorage.setItem("_token", newToken); // Save the new token in localStorage
                    }
                    if (data.message && data.message.toLowerCase().includes("invalid") && data.message.toLowerCase().includes("token")) {
                        // Session expired, redirect to login
                        Swal.fire({
                            title: "Session Expired",
                            text: "Your session has expired. Please log in again.",
                            icon: "warning",
                            confirmButtonText: "Ok",
                        }).then(() => {
                            window.location.href = "/admin-login"; // Redirect to login page
                        });
                        return; // Stop further execution after session expiry
                    }

                    // Handle non-OK responses
                    if (!res.ok) {
                        throw new Error(`Error fetching data: ${res.statusText}`);
                    }

                    // Process the data if the response is OK
                    setCompanyName(data.application?.customer_name || 'N/A');
                    setPurpose(data.application?.purpose_of_application || 'N/A');
                    setCefData(data.CEFData || {});

                    // Handle service data safely
                    const serviceDataa = data.serviceData || {};
                    const jsonDataArray = Object.values(serviceDataa)?.map(item => item.jsonData) || [];
                    const serviceValueDataArray = Object.values(serviceDataa)?.map(item => item.data) || [];

                    setServiceData(jsonDataArray);
                    setServiceValueData(serviceValueDataArray);

                    setCustomBgv(data.customerInfo?.is_custom_bgv || '');
                    const parsedData = data?.serviceData || [];

                    let allJsonData = [];
                    let allJsonDataValue = [];

                    // Sorting and restructuring the parsed data
                    const sortedData = Object.entries(parsedData)
                        .sort(([, a], [, b]) => {
                            const groupA = a.group || '';  // Default to empty string if a.group is null or undefined
                            const groupB = b.group || '';  // Default to empty string if b.group is null or undefined
                            return groupA.localeCompare(groupB);
                        })
                        .reduce((acc, [key, value]) => {
                            acc[key] = value;  // Reconstruct the object with sorted entries
                            return acc;
                        }, {});

                    // Collecting jsonData and jsonDataValue
                    for (const key in parsedData) {
                        if (parsedData.hasOwnProperty(key)) {
                            const jsonData = parsedData[key]?.jsonData;  // Safe navigation in case it's null or undefined
                            if (jsonData) {
                                allJsonData.push(jsonData);  // Store jsonData in the array
                                ;
                            }

                            const jsonDataValue = parsedData[key]?.data;  // Safe navigation in case it's null or undefined
                            if (jsonDataValue) {
                                allJsonDataValue.push(jsonDataValue);  // Store jsonData in the array
                            }
                        }
                    }
                    setAnnexureImageData(allJsonDataValue)


                    // Constructing the annexureData object
                    allJsonData.forEach(service => {
                        if (service.db_table !== 'gap_validation') {
                            service?.rows?.forEach(row => {  // Check if rows exist before iterating
                                row?.inputs?.forEach(input => {
                                    // Fetch the static inputs dynamically from annexureData

                                    // Fetch the dynamic field value from allJsonDataValue
                                    let fieldValue = allJsonDataValue.find(data => data && data.hasOwnProperty(input.name)); // Check for null or undefined before accessing `hasOwnProperty`
                                    // If fieldValue exists, we set it, otherwise, static value should remain
                                    if (fieldValue && fieldValue.hasOwnProperty(input.name)) {

                                        // Set dynamic value in the correct field in annexureData
                                        if (!annexureData[service.db_table]) {
                                            annexureData[service.db_table] = {}; // Initialize the service table if it doesn't exist
                                        }

                                        // Set the dynamic value in the service table under the input's name
                                        annexureData[service.db_table][input.name] = fieldValue[input.name] || "  ";


                                    } else {

                                    }
                                });
                            });
                        } else {
                            let fieldValue = allJsonDataValue.find(data => data && data.hasOwnProperty('phd_institute_name_gap')); // Check for null or undefined before accessing `hasOwnProperty`
                            let initialAnnexureDataNew = initialAnnexureData;
                            if (fieldValue && fieldValue.hasOwnProperty('no_of_employment')) {
                                initialAnnexureDataNew = updateEmploymentFields(fieldValue.no_of_employment, fieldValue); // Call function to handle employment fields
                            }

                            Object.keys(initialAnnexureDataNew.gap_validation).forEach((item, index) => {

                                let fieldValueLoop = allJsonDataValue.find(data => data && data.hasOwnProperty(item));

                                if (fieldValueLoop && fieldValueLoop.hasOwnProperty(item)) {

                                    // Ensure the service table exists in annexureData
                                    if (!annexureData[service.db_table]) {
                                        annexureData[service.db_table] = {}; // Initialize the service table if it doesn't exist
                                    }

                                    // Set the dynamic value in the service table under the input's name
                                    annexureData[service.db_table][item] = fieldValueLoop[item] || "";
                                } else {
                                }
                            });



                        }

                    });


                    setAnnexureData(annexureData);
                    const fileInputs = allJsonData
                        .flatMap(item =>
                            item.rows.flatMap(row =>
                                row.inputs
                                    .filter(input => input.type === "file")
                                    .map(input => ({
                                        [input.name]: `${item.db_table}_${input.name}`
                                    }))
                            )
                        );
                    calculateGaps();
                    setServiceDataImageInputNames(fileInputs);
                    setServiceDataMain(allJsonData);
                    setNationality(data.application?.nationality || '');
                });
            })
            .catch(err => {
                setError(err.message || 'An unexpected error occurred.');
            })
            .finally(() => {
                setLoading(false);
                setIsApiLoading(false); // End loading
            });
    }, [applicationId, branchId]);



    const [isSameAsPermanent, setIsSameAsPermanent] = useState(false);
    const [gaps, setGaps] = useState({});
    const [employGaps, setEmployGaps] = useState({});

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false)
    const [conditionHtml, setConditionHtml] = useState("");
    const [initialAnnexureData, setInitialAnnexureData] = useState({
        gap_validation: {
            phd_institute_name_gap: '',
            phd_school_name_gap: '',
            phd_start_date_gap: '',
            phd_end_date_gap: '',
            phd_specialization_gap: '',
            post_graduation_university_institute_name_gap: '',
            post_graduation_course_gap: '',
            post_graduation_specialization_major_gap: '',
            graduation_university_institute_name_gap: '',
            graduation_course_gap: '',
            highest_education_gap: '',
            graduation_specialization_major_gap: '',
            senior_secondary_school_name_gap: '',
            senior_secondary_start_date_gap: '',
            senior_secondary_end_date_gap: '',
            secondary_school_name_gap: '',
            secondary_start_date_gap: '',
            secondary_end_date_gap: '',
            years_of_experience_gap: '',
            graduation_end_date_gap: "",
            graduation_start_date_gap: "",
            post_graduation_end_date_gap: "",
            post_graduation_start_date_gap: "",
            no_of_employment: 0,
        }
    });


    const [activeTab, setActiveTab] = useState(0); // Tracks the active tab (0, 1, or 2)

    const createEmploymentFields = (noOfEmployments) => {
        const employmentFields = {};
        for (let i = 1; i <= noOfEmployments; i++) {
            // Ensure we keep existing values if they are already set
            employmentFields[`employment_type_gap_${i}`] = annexureData.gap_validation[`employment_type_gap_${i}`] || '';
            employmentFields[`employment_start_date_gap_${i}`] = annexureData.gap_validation[`employment_start_date_gap_${i}`] || '';
            employmentFields[`employment_end_date_gap_${i}`] = annexureData.gap_validation[`employment_end_date_gap_${i}`] || '';
        }
        return employmentFields;
    };
    const updateEmploymentFields = (noOfEmployment, fieldValue) => {
        // Generate all possible employment fields
        const allEmploymentFields = createEmploymentFields(noOfEmployment);

        // Manually compute the updated data before updating state
        const updatedData = {
            ...initialAnnexureData, // Copy existing state
            gap_validation: {
                ...initialAnnexureData.gap_validation, // Preserve existing values
                ...allEmploymentFields, // Ensure all new employment fields are included
            },
        };

        // Override only the values present in `fieldValue`
        Object.keys(fieldValue).forEach((key) => {
            if (updatedData.gap_validation.hasOwnProperty(key)) {
                updatedData.gap_validation[key] = fieldValue[key]; // Update relevant fields only
            }
        });

        // Set state asynchronously
        setInitialAnnexureData(updatedData);

        return updatedData; // Now `newData` will contain the updated values
    };




    // Update the state with the new employment fields
    const [annexureData, setAnnexureData] = useState(initialAnnexureData);

    const [hiddenRows, setHiddenRows] = useState({});
    const [serviceDataMain, setServiceDataMain] = useState([]);
    const [serviceDataImageInputNames, setServiceDataImageInputNames] = useState([]);
    const [cefDataApp, setCefDataApp] = useState([]);
    const [annexureImageData, setAnnexureImageData] = useState([]);


    const getValuesFromUrl = (currentURL) => {
        const result = {};
        const keys = [
            "YXBwX2lk", // app_id
            "YnJhbmNoX2lk", // branch_id
            "Y3VzdG9tZXJfaWQ=" // customer_id
        ];


        // Loop through keys to find their values in the URL
        keys.forEach(key => {
            const regex = new RegExp(`${key}=([^&]*)`);
            const match = currentURL.match(regex);
            result[key] = match && match[1] ? match[1] : null;
        });

        // Function to check if the string is a valid base64
        const isValidBase64 = (str) => {
            const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
            return base64Pattern.test(str) && (str.length % 4 === 0);
        };


        // Function to decode key-value pairs
        const decodeKeyValuePairs = (obj) => {
            return Object.entries(obj).reduce((acc, [key, value]) => {
                const decodedKey = isValidBase64(key) ? atob(key) : key;
                const decodedValue = value && isValidBase64(value) ? atob(value) : null;
                acc[decodedKey] = decodedValue;
                return acc;
            }, {});
        };

        // Decoding key-value pairs and returning the result
        const decodedResult = decodeKeyValuePairs(result);
        return decodedResult;
    };


    const renderGapMessage = (gap) => {
        if (gap?.years > 0 || gap?.months > 0) {
            return (
                <p style={{ color: 'red' }}>
                    Gap : {gap?.years} years, {gap?.months} months
                </p>
            );
        }
        return (
            <p style={{ color: 'green' }}>
                No Gap
            </p>
        );
    };






    const toggleRowsVisibility = (serviceIndex, rowIndex, isChecked) => {


        setHiddenRows((prevState) => {
            const newState = { ...prevState };
            const serviceRows = serviceDataMain[serviceIndex].rows || serviceDataMain.rows;
            const row = serviceRows[rowIndex];
            const fileInputs = row.inputs.filter(input => input.type === 'file');
            let removedFileInputs = [];

            // Check if any checkbox in this row is either 'done_or_not' or 'has_not_done'
            const isSpecialCheckbox = row.inputs.some(input =>
                input.type === 'checkbox' &&
                (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'))
            );


            if (isSpecialCheckbox) {
                if (isChecked) {

                    // Remove from serviceDataImageInputNames when checked
                    setServiceDataImageInputNames((prevFileInputs) => {
                        const updatedFileInputs = prevFileInputs.filter(fileInput => {
                            const fileInputName = Object.values(fileInput)[0];
                            const isCurrentServiceFile = fileInputName.startsWith(`${serviceDataMain[serviceIndex].db_table}_`);

                            const isCheckboxRelated = row.inputs.some(input =>
                                input.type === 'checkbox' &&
                                (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'))
                            );

                            if (isCurrentServiceFile && !isCheckboxRelated) {
                                // Track removed file inputs to restore them later
                                removedFileInputs.push(fileInput);
                                return false;
                            }

                            return true;
                        });

                        return updatedFileInputs;
                    });

                    // Add rows visibility when checked
                    for (let i = rowIndex + 1; i < serviceRows.length; i++) {
                        const row = serviceRows[i];
                        const hasCheckbox = row.inputs && row.inputs.some(input => input.type === 'checkbox');

                        const isSpecialCheckbox = hasCheckbox && row.inputs.some(input => {
                            if (typeof input.name === 'string') {
                                return input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done');
                            }
                            return false;
                        });

                        if (isSpecialCheckbox) continue;

                        newState[`${serviceIndex}-${i}`] = true; // Show next row
                    }

                    // Handle dynamic content (HTML, PDFs, etc.)
                    const conditions = serviceDataMain[serviceIndex]?.conditions || [];
                    if (Array.isArray(conditions)) {
                        conditions.forEach(condition => {
                            if (row.inputs.some(input => input.name === condition.name) && isChecked) {
                                const attributes = condition.show?.attribute || [];
                                attributes.forEach(attr => {
                                    const replaceAttributes = condition.replace_attributes || [];
                                    let updatedContent = condition[attr] || "";

                                    if (replaceAttributes.length > 0) {
                                        replaceAttributes.forEach(replaceAttr => {
                                            let dynamicValue = cefDataApp[replaceAttr] || 'NIL';
                                            if (replaceAttr === 'date') {
                                                dynamicValue = new Date().toISOString().split('T')[0]; // Current date in 'YYYY-MM-DD'
                                            }
                                            const regex = new RegExp(`{{${replaceAttr}}}`, 'g');
                                            updatedContent = updatedContent.replace(regex, dynamicValue);
                                        });

                                        // Update the condition HTML state
                                        setConditionHtml(prevState => ({
                                            ...prevState,
                                            [attr]: updatedContent,
                                            service_index: serviceIndex
                                        }));
                                    } else {
                                        setConditionHtml(prevState => ({
                                            ...prevState,
                                            service_index: serviceIndex,
                                            [attr]: 'NIL' // Default to 'NIL' if no attributes present
                                        }));
                                    }
                                });
                            }
                        });
                    }

                } else {

                    // Restore removed file inputs when unchecked
                    setServiceDataImageInputNames((prevFileInputs) => {
                        const updatedFileInputs = [...prevFileInputs, ...removedFileInputs];
                        return updatedFileInputs;
                    });

                    // Remove rows visibility when unchecked
                    for (let i = rowIndex + 1; i < serviceRows.length; i++) {
                        const row = serviceRows[i];
                        const hasCheckbox = row.inputs && row.inputs.some(input => input.type === 'checkbox');

                        const isSpecialCheckbox = hasCheckbox && row.inputs.some(input => {
                            if (typeof input.name === 'string') {
                                return input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done');
                            }
                            return false;
                        });

                        if (isSpecialCheckbox) continue;

                        delete newState[`${serviceIndex}-${i}`]; // Hide next row
                    }

                    // Clear dynamic content (reset condition HTML)
                    setConditionHtml({});
                }
            }

            return newState;
        });
    };


    const handleBack = () => {
        if (activeTab > 0) {
            setActiveTab(activeTab - 1); // Adjust the active tab to go back
        }
    };

    const handleNext = () => {
        setActiveTab(activeTab + 1);
        if (activeTab > 0 && activeTab <= serviceDataMain.length) {
            // Iterate over serviceDataMain for the rows to toggle visibility
            serviceDataMain[activeTab - 1].rows.forEach((row, rowIndex) => {
                const isChecked = ["1", 1, true, "true"].includes(
                    annexureData[serviceDataMain[activeTab - 1].db_table]?.[row.inputs.find(input => input.type === 'checkbox')?.name] ?? false
                );

                toggleRowsVisibility(activeTab - 1, rowIndex, isChecked);
            });
        }
    };





    const calculateDateGap = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return null; // Return null for negative gaps (startDate is later than endDate)
        }

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        return { years: Math.abs(years), months: Math.abs(months) };
    };


    function calculateDateDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        if (isNaN(d1) || isNaN(d2)) return "Invalid Date";

        // Check if date1 is greater than or equal to date2
        if (d1 >= d2) return "No gap";

        let years = d2.getFullYear() - d1.getFullYear();
        let months = d2.getMonth() - d1.getMonth();
        let days = d2.getDate() - d1.getDate();

        if (days < 0) {
            months--;
            days += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        return `${years > 0 ? years + " year(s) " : ""}${months > 0 ? months + " month(s) " : ""}${days > 0 ? days + " day(s)" : ""}`.trim();
    }

    const calculateGaps = () => {
        // Data from your JSON
        const secondaryEndDate = annexureData.gap_validation.secondary_end_date_gap;
        const seniorSecondaryStartDate = annexureData.gap_validation.senior_secondary_start_date_gap;
        const seniorSecondaryEndDate = annexureData.gap_validation.senior_secondary_end_date_gap;
        const graduationStartDate = annexureData.gap_validation.graduation_start_date_gap;
        const graduationEndDate = annexureData.gap_validation.graduation_end_date_gap;
        const postGraduationStartDate = annexureData.gap_validation.post_graduation_start_date_gap;
        const postGraduationEndDate = annexureData.gap_validation.post_graduation_end_date_gap;
        const phdStartDate = annexureData.gap_validation.phd_start_date_gap;

        // Calculate gaps
        const gapSecToSrSec = calculateDateGap(secondaryEndDate, seniorSecondaryStartDate);
        const gapSrSecToGrad = calculateDateGap(seniorSecondaryEndDate, graduationStartDate);
        const gapGradToPostGrad = calculateDateGap(graduationEndDate, postGraduationStartDate);
        const gapPostGradToPhd = calculateDateGap(postGraduationEndDate, phdStartDate);

        // Only proceed if the gap is not null
        const validGaps = {
            gapSecToSrSec,
            gapSrSecToGrad,
            gapGradToPostGrad,
            gapPostGradToPhd
        };

        // Filter out null gaps (negative values)
        const nonNegativeGaps = Object.fromEntries(
            Object.entries(validGaps).filter(([key, value]) => value !== null)
        );

        // Update state with non-negative gaps
        setGaps(nonNegativeGaps);

        function getEmploymentDates(annexureData) {
            const employmentStartDates = [];
            const employmentEndDates = [];

            let i = 1; // Start index
            while (true) {
                const startKey = `employment_start_date_gap_${i}`;
                const endKey = `employment_end_date_gap_${i}`;

                // Break the loop if neither start nor end date exists
                if (!(startKey in annexureData.gap_validation) && !(endKey in annexureData.gap_validation)) {
                    break;
                }

                // Push to arrays if exists
                if (startKey in annexureData.gap_validation) {
                    employmentStartDates.push({ name: startKey, value: annexureData.gap_validation[startKey] });
                }
                if (endKey in annexureData.gap_validation) {
                    employmentEndDates.push({ name: endKey, value: annexureData.gap_validation[endKey] });
                }

                i++; // Increment index
            }

            return { employmentStartDates, employmentEndDates };
        }

        const { employmentStartDates, employmentEndDates } = getEmploymentDates(annexureData);

        function getEmploymentDateDifferences(startDates, endDates) {
            let differences = [];

            for (let i = 0; i < endDates.length; i++) {
                const currentEnd = endDates[i].value;
                const nextStart = startDates[i + 1] ? startDates[i + 1].value : null;

                if (currentEnd && nextStart && currentEnd !== nextStart) {
                    const diff = calculateDateDifference(currentEnd, nextStart);

                    // Only add valid differences (not empty strings or null)
                    if (diff) {
                        differences.push({
                            endName: endDates[i].name,
                            endValue: currentEnd,
                            startName: startDates[i + 1].name,
                            startValue: nextStart,
                            difference: diff
                        });
                    }
                }
            }

            return differences;
        }

        // Get differences
        const dateDifferences = getEmploymentDateDifferences(employmentStartDates, employmentEndDates);

        setEmployGaps(dateDifferences);
    };


    useEffect(() => {
        if (!isApiLoading) {
            fetchData();
        }
    }, [fetchData, annexureData]);


    return (
        <>
            {
                loading ? (
                    <div className='flex justify-center items-center py-6 ' >
                        <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
                    </div >
                ) :
                    <form className='py-6 bg-[#e5e7eb24]' id='bg-form'>
                        <div className="md:w-10/12 mx-auto md:p-6" >
                            {customBgv === 1 && (
                                <div className='flex justify-center my-3'>
                                    <img src={LogoBgv} className='md:w-[12%] w-[50%] m-auto' alt="Logo" />
                                </div>
                            )}

                            <h4 className="text-Black md:text-3xl text-center text-xl md:mb-6 mb-3 font-bold mt-3">Background Verification Form</h4>
                            <div className='md:flex gap-5 justify-center'>
                                <div className="mb-2 py-4 rounded-md">
                                    <h5 className="text-lg font-bold text-center md:text-start">Company name: <span className="text-lg font-normal">{companyName}</span></h5>
                                </div>
                                <div className="md:mb-6 mb-2 py-4 rounded-md">
                                    <h5 className="text-lg font-bold text-center md:text-start">Purpose of Application: <span className="text-lg font-normal">{purpose || 'NIL'}</span></h5>
                                </div>
                            </div>

                            <div className="mb-6 flex p-2 filter-menu overflow-x-auto border rounded-md items-center flex-nowrap relative space-x-4">
                                {/* Personal Information Tab */}
                                <div className="text-center flex items-end gap-2">
                                    <button
                                        type='button'
                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center ${activeTab === 0 ? "text-green-500" : "text-gray-700"}`}
                                    >
                                        <FaUser
                                            className="mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full bg-green-500 text-white"
                                        />
                                        Personal Information
                                    </button>
                                    <MdOutlineArrowRightAlt className='text-2xl' />
                                </div>

                                {/* Current/Permanent Address Tab */}
                                <div className="text-center flex items-end gap-2">
                                    <button
                                        type='button'
                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
${activeTab === 1 ? "text-green-500" : "text-gray-700"}`} // Text color changes based on tab active customBgv
                                    >
                                        <FaUser
                                            className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
${activeTab === 1 ? "bg-green-500 text-white" : (activeTab > 0 ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400")}`} // Icon color changes based on active tab
                                        />
                                        Current/Permanent Address
                                    </button>
                                    <MdOutlineArrowRightAlt className={`text-2xl ${activeTab === 1 ? "text-green-500" : "text-gray-700"}`} />


                                </div>

                                {/* Service Tabs */}
                                {serviceData.map((service, index) => {
                                    const isTabEnabled = activeTab > index + 1;
                                    return (
                                        <div key={index} className="text-center flex items-end gap-2">
                                            <button
                                                type='button'
                                                className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
${activeTab === index + 2 ? "text-green-500" : (isTabEnabled ? "text-gray-700" : "text-gray-400")}`}
                                            >
                                                <FaCog
                                                    className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
${activeTab === index + 2 ? "bg-green-500 text-white" : (isTabEnabled ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400")}`}
                                                />
                                                {service.heading}
                                            </button>
                                            <MdOutlineArrowRightAlt className='text-2xl' />
                                        </div>
                                    );
                                })}

                                {/* Declaration and Authorization Tab */}
                                <div className="text-center">
                                    <button
                                        type='button'
                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
${activeTab === serviceData.length + 2 ? "text-green-500" : "text-gray-400"}`} // Text color changes based on tab active customBgv
                                    >
                                        <FaCheckCircle
                                            className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
${activeTab === serviceData.length + 2 ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`} // Icon color changes based on active tab
                                        />
                                        Declaration and Authorization
                                    </button>

                                </div> </div>


                            <div className="border p-4 rounded-md shadow-md">
                                {activeTab === 0 && (
                                    <div>
                                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6 border rounded-md  p-4" >
                                            {purpose == 'NORMAL BGV(EMPLOYMENT)' && (
                                                <div className="form-group col-span-2" >
                                                    <label className='text-sm' > Applicant’s CV: <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                        className="form-control border rounded w-full bg-white p-2 mt-2"
                                                        name="resume_file"
                                                        id="resume_file"

                                                    />
                                                    <p className="text-gray-500 text-sm mt-2" >
                                                        Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                    </p>
                                                    {cefData.resume_file && (
                                                        <div className='md:h-20 md:w-20 border rounded-md p-2'><img src={cefData.resume_file || "NO IMAGE FOUND"} className='h-full w-full object-contain p-3' alt="NO IMAGE FOUND" /></div>
                                                    )}
                                                </div>
                                            )}
                                            < div className="form-group col-span-2" >
                                                <label className='text-sm' > Attach Govt.ID Proof: <span className="text-red-500 text-lg" >* </span></label >
                                                <input
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png" // Restrict to image files
                                                    className="form-control border rounded w-full bg-white p-2 mt-2"
                                                    name="govt_id"
                                                    disabled // Allow  disabled file selection
                                                />
                                                <p className="text-gray-500 text-sm mt-2" >
                                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                </p>
                                                <div className='md:grid grid-cols-5 gap-3'>

                                                    {cefData.govt_id ? (
                                                        cefData.govt_id.split(',').map((item, index) => {
                                                            // Check if the item is an image (based on its extension)
                                                            const isImage = item && (item.endsWith('.jpg') || item.endsWith('.jpeg') || item.endsWith('.png'));

                                                            return (
                                                                <div key={index} className='border rounded-md flex items-center justify-center'>
                                                                    {isImage ? (
                                                                        <img src={item} alt={`Image ${index}`} className='p-3 ' />
                                                                    ) : (
                                                                        <div>
                                                                            <button onClick={() => window.open(item, '_blank')}>Open Link</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <p>No image or link available</p>
                                                    )}
                                                </div>


                                            </div>



                                            {
                                                customBgv === 1 && (
                                                    <>
                                                        <div className="form-group col-span-2" >
                                                            <label className='text-sm' > Passport size photograph - (mandatory with white Background)<span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                type="file"
                                                                accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types

                                                                className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                name="passport_photo"

                                                                disabled

                                                            />
                                                            <p className="text-gray-500 text-sm mt-2" >
                                                                Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                            </p>
                                                            <div className='md:grid grid-cols-5 gap-3'>
                                                                {cefData.passport_photo ? (
                                                                    cefData.passport_photo.split(',').map((item, index) => {
                                                                        // Check if the item is an image (based on its extension)
                                                                        const isImage = item && (item.endsWith('.jpg') || item.endsWith('.jpeg') || item.endsWith('.png'));

                                                                        return (
                                                                            <div key={index} className='border rounded-md flex items-center justify-center'>
                                                                                {isImage ? (
                                                                                    <img src={item} alt={`Image ${index}`} className='p-3' />
                                                                                ) : (
                                                                                    <div>
                                                                                        <button onClick={() => window.open(item, '_blank')}>Open Link</button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <p>No image or link available</p>
                                                                )}
                                                            </div>


                                                        </div>
                                                    </>
                                                )}

                                        </div>

                                        < div className='border p-4' >
                                            <h4 className="md:text-start text-start md:text-2xl text-sm my-6 font-bold " > Personal Information </h4>

                                            < div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 " >
                                                <div className="form-group" >
                                                    <label className='text-sm' > Full Name as per Govt ID Proof(first, middle, last): <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        disabled
                                                        value={cefData.full_name}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="full_name"
                                                        name="full_name"

                                                    />
                                                </div>
                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="former_name" > Former Name / Maiden Name(if applicable)<span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        disabled
                                                        value={cefData.former_name}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="former_name"
                                                        name="former_name"
                                                    />
                                                </div>
                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="mob_no" > Mobile Number: <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        disabled
                                                        value={cefData.mb_no}
                                                        type="number"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="mb_no"
                                                        id="mob_no"
                                                        minLength="10"
                                                        maxLength="10"

                                                    />
                                                </div>
                                            </div>
                                            < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >

                                                <div className="form-group" >
                                                    <label className='text-sm' htmlFor="father_name">Father's Name: <span className="text-red-500 text-lg">*</span></label>
                                                    <input
                                                        disabled
                                                        value={cefData.father_name}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="father_name"
                                                        name="father_name"

                                                    />
                                                </div>
                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="husband_name" > Spouse's Name</label>
                                                    < input
                                                        disabled
                                                        value={cefData.husband_name}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="husband_name"
                                                        name="husband_name"
                                                    />
                                                </div>

                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="dob" > DOB: <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        disabled
                                                        value={cefData.dob}
                                                        type="date"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="dob"
                                                        id="dob"

                                                    />
                                                </div>
                                            </div>
                                            < div className="grid grid-cols-1 md:grid-cols-1 gap-4" >

                                                <div className="form-group my-4" >
                                                    <label className='text-sm' htmlFor="gender" >
                                                        Gender: <span className="text-red-500 text-lg" >* </span>
                                                    </label>
                                                    < select
                                                        disabled
                                                        value={cefData.gender}
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="gender"
                                                        id="gender"
                                                    >
                                                        <option value=""  >
                                                            Select gender
                                                        </option>
                                                        < option value="male" > Male </option>
                                                        < option value="female" > Female </option>
                                                        < option value="other" > Other </option>
                                                    </select>
                                                </div>
                                            </div>
                                            {nationality === "Indian" && (
                                                <div className='form-group'>
                                                    <label className='text-sm'>Aadhar card No</label>
                                                    <input
                                                        type="text"
                                                        name="aadhar_card_number"
                                                        value={cefData.aadhar_card_number}
                                                        disabled
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            )}
                                            < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
                                                {
                                                    customBgv === 1 && nationality === "Indian" && (
                                                        <>
                                                            <div className='form-group'>
                                                                <label className='text-sm'>
                                                                    Name as per Aadhar card <span className='text-red-500 text-lg'>*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="aadhar_card_name"
                                                                    value={cefData.aadhar_card_name}
                                                                    disabled
                                                                    className="form-control border rounded w-full p-2 mt-2"
                                                                />

                                                            </div>

                                                            <div className='form-group'>
                                                                <label className='text-sm'>
                                                                    Aadhar Card Image <span className='text-red-500 text-lg'>*</span>
                                                                </label>
                                                                <input
                                                                    disabled
                                                                    type="file"
                                                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                                    name="aadhar_card_image"
                                                                    className="form-control border rounded w-full p-1 mt-2"
                                                                />

                                                                <p className="text-gray-500 text-sm mt-2">
                                                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed. Max file size: 2MB.
                                                                </p>


                                                            </div>
                                                        </>
                                                    )
                                                }

                                            </div>

                                            {nationality === "Indian" && (
                                                <div className='form-group' >
                                                    <label className='text-sm' > Pan card No </label>
                                                    <input
                                                        type="text"
                                                        disabled
                                                        name="pan_card_number"
                                                        value={cefData.pan_card_number}
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            )
                                            }
                                            < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >

                                                {
                                                    customBgv === 1 && nationality === "Indian" && (
                                                        <>

                                                            <div className='form-group' >
                                                                <label className='text-sm' >Name as per Pan Card< span className='text-red-500 text-lg' >* </span></label >
                                                                <input
                                                                    disabled
                                                                    type="text"
                                                                    name="pan_card_name"
                                                                    value={cefData.pan_card_name}
                                                                    className="form-control border rounded w-full p-2 mt-2"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                {customBgv === 1 && nationality === "Indian" && (
                                                    <div className='form-group' >
                                                        <label className='text-sm' > Pan Card Image < span className='text-red-500 text-lg' >* </span></label >
                                                        <input
                                                            type="file"
                                                            disabled
                                                            accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                            name="pan_card_image"
                                                            className="form-control border rounded w-full p-1 mt-2"

                                                        />
                                                        <p className="text-gray-500 text-sm mt-2" >
                                                            Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                        </p>
                                                        {cefData.pan_card_image && (
                                                            <div className='md:h-20 md:w-20 border rounded-md p-2'><img src={cefData.pan_card_image || "NO IMAGE FOUND"} className='h-full w-full object-contain p-3' alt="NO IMAGE FOUND" /></div>

                                                        )}
                                                    </div>
                                                )}



                                            </div>
                                            {
                                                customBgv == 0 && nationality === "Other" && (
                                                    <div className="form-group" >
                                                        <label className='text-sm' > Social Security Number(if applicable): </label>
                                                        < input
                                                            disabled
                                                            value={cefData.ssn_number}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                            name="ssn_number"

                                                        />
                                                    </div>
                                                )
                                            }
                                            {nationality === "Other" && (
                                                <>
                                                    < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >

                                                        <div className="form-group" >
                                                            <label className='text-sm' >Passport No</label>
                                                            < input
                                                                disabled
                                                                value={cefData.passport_no}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                name="passport_no"

                                                            />
                                                        </div>
                                                        <div className="form-group" >
                                                            <label className='text-sm' >Driving Licence / Resident Card / Id no</label>
                                                            < input
                                                                disabled
                                                                value={cefData.dme_no}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                name="dme_no"

                                                            />
                                                        </div>

                                                    </div>
                                                    <div className="form-group" >
                                                        <label className='text-sm' >TAX No</label>
                                                        < input
                                                            disabled
                                                            value={cefData.tax_no}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                            name="tax_no"
                                                        />
                                                    </div>

                                                </>
                                            )}
                                            < div className="grid grid-cols-1 md:grid-cols-2 gap-4 " >
                                                <div className="form-group" >
                                                    <label className='text-sm' htmlFor="nationality" > Nationality: <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        disabled
                                                        value={cefData.nationality}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="nationality"
                                                        id="nationality"

                                                    />
                                                </div>
                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="marital_status" > Marital Status: <span className="text-red-500 text-lg" >* </span></label >
                                                    <select
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="marital_status"
                                                        id="marital_status"
                                                        disabled
                                                        value={cefData.marital_status}

                                                    >
                                                        <option value="" > SELECT Marital Status </option>
                                                        < option value="Dont wish to disclose" > Don't wish to disclose</option>
                                                        < option value="Single" > Single </option>
                                                        < option value="Married" > Married </option>
                                                        < option value="Widowed" > Widowed </option>
                                                        < option value="Divorced" > Divorced </option>
                                                        < option value="Separated" > Separated </option>
                                                    </select>
                                                </div>
                                            </div>

                                        </div>
                                        {
                                            customBgv === 1 && (
                                                <>
                                                    <div className='border border-gray-300 p-6 rounded-md mt-5 hover:transition-shadow duration-300' >

                                                        <label className='text-sm' > Blood Group </label>
                                                        < div className='form-group' >
                                                            <input
                                                                type="text"
                                                                name="blood_group"
                                                                value={cefData.blood_group}
                                                                disabled
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                            />
                                                        </div>

                                                        < div className='border rounded-md p-3 my-5 ' >
                                                            <h3 className='md:text-center text-start md:text-xl text-sm font-bold pb-4' > Add Emergency Contact Details </h3>
                                                            < div className='md:grid grid-cols-3 gap-3 ' >
                                                                <div className='form-group' >
                                                                    <label className='text-sm' > Name < span className='text-red-500 text-lg' >* </span></label >
                                                                    <input
                                                                        type="text"
                                                                        name="emergency_details_name"
                                                                        value={cefData.emergency_details_name}
                                                                        disabled
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                                < div className='form-group' >
                                                                    <label className='text-sm' > Relation < span className='text-red-500 text-lg' >* </span></label >
                                                                    <input
                                                                        type="text"
                                                                        name="emergency_details_relation"
                                                                        value={cefData.emergency_details_relation}
                                                                        disabled
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                                < div className='form-group' >
                                                                    <label className='text-sm' > Contact Number < span className='text-red-500 text-lg' >* </span></label >
                                                                    <input
                                                                        type="text"
                                                                        name="emergency_details_contact_number"
                                                                        value={cefData.emergency_details_contact_number}
                                                                        disabled
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>


                                                        < div className='border rounded-md p-3 mt-3  ' >
                                                            <h3 className='md:text-center text-start md:text-xl text-sm font-bold pb-2' > Insurance Nomination Details: - (A set of parent either Parents or Parents in Law, 1 child, Spouse Nominee details)</h3>
                                                            < div className='md:grid grid-cols-2 gap-3' >
                                                                <div className='form-group' >
                                                                    <label className='text-sm' > Name(s)
                                                                    </label>
                                                                    < input
                                                                        type="text"
                                                                        name="insurance_details_name"
                                                                        value={cefData.insurance_details_name}
                                                                        disabled
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                                < div className='form-group' >
                                                                    <label className='text-sm' > Nominee Relationship
                                                                    </label>
                                                                    < input
                                                                        type="text"
                                                                        name="insurance_details_nominee_relation"
                                                                        value={cefData.insurance_details_nominee_relation}
                                                                        disabled
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                                < div className='form-group' >
                                                                    <lalbel>Nominee Date of Birth
                                                                    </lalbel>
                                                                    < input
                                                                        type="date"
                                                                        name="insurance_details_nominee_dob"
                                                                        value={cefData.insurance_details_nominee_dob}
                                                                        disabled
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                                < div className='form-group' >
                                                                    <label className='text-sm' > Contact No.
                                                                    </label>
                                                                    < input
                                                                        type="text"
                                                                        name="insurance_details_contact_number"
                                                                        value={cefData.insurance_details_contact_number}
                                                                        disabled
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        < label className='text-sm mt-5 block' > Do you want to opt for a Food Coupon ? <span className='text-red-500 text-lg' >* </span></label >

                                                        <div className='flex gap-6 mb-4  ' >
                                                            <div className='form-group pt-2 flex gap-2' >
                                                                <input
                                                                    type="radio"
                                                                    name="food_coupon"
                                                                    value="Yes"
                                                                    checked={cefData.food_coupon === 'Yes'} // Check if "No" is selected

                                                                    disabled
                                                                    className="form-control border rounded p-2"
                                                                />
                                                                <label className='text-sm' > Yes </label>
                                                            </div>
                                                            < div className='form-group pt-2 flex gap-2' >
                                                                <input
                                                                    type="radio"
                                                                    name="food_coupon"
                                                                    value="No"
                                                                    checked={cefData.food_coupon === 'No'} // Check if "No" is selected

                                                                    disabled
                                                                    className="form-control border rounded p-2"
                                                                />
                                                                <label className='text-sm' > No </label>
                                                            </div>
                                                        </div>


                                                        <p className='text-left ' > Food coupons are vouchers or digital meal cards given to employees to purchase food and non - alcoholic beverages.Specific amount as per your requirement would get deducted from your Basic Pay.These are tax free, considered as a non - monetary benefit and are exempt from tax up to a specified limit.</p>
                                                    </div>
                                                </>
                                            )}





                                    </div>
                                )}

                                {activeTab === 1 && (
                                    <>
                                        <div className=' border-gray-300 rounded-md mt-5 hover:transition-shadow duration-300' >

                                            <h3 className='md:text-start md:mb-2 text-start md:text-2xl text-sm font-bold my-5' > Permanent Address </h3>
                                            <div className='border border-black p-4 rounded-md'>
                                                < div className="grid grid-cols-1 md:grid-cols-2 gap-4 " >

                                                    <div className="form-group" >
                                                        <label className='text-sm' htmlFor="permanent_address" > Permanent Address < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.permanent_address}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="permanent_address"
                                                            name="permanent_address"

                                                        />
                                                    </div>

                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="permanent_pin_code" > Pin Code < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.permanent_pin_code}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="permanent_pin_code"
                                                            name="permanent_pin_code"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="permanent_address_landline_number" > Mobile Number < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.permanent_address_landline_number}
                                                            type="number"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="permanent_address_landline_number"
                                                            name="permanent_address_landline_number"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="permanent_address_state" > Current State < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.permanent_address_state}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="permanent_address_state"
                                                            name="permanent_address_state"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="permanent_prominent_landmark" > Current Landmark < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.permanent_prominent_landmark}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="permanent_prominent_landmark"
                                                            name="permanent_prominent_landmark"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="permanent_address_stay_to" > Current Address Stay No.< span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.permanent_address_stay_to}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="permanent_address_stay_to"
                                                            name="permanent_address_stay_to"

                                                        />
                                                    </div>

                                                </div>

                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="nearest_police_station" > Nearest Police Station.</label>
                                                    < input
                                                        disabled
                                                        value={cefData.permanent_address_nearest_police_station}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="permanent_address_nearest_police_station"
                                                        name="permanent_address_nearest_police_station"

                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className=' border-gray-300 rounded-md mt-5 hover:transition-shadow duration-300' >
                                            <input type="checkbox" name="" checked={isSameAsPermanent}
                                                id="" className='me-2' /><label>Same as Permanent Address</label>

                                            <h3 className='md:text-start md:mb-2 text-start md:text-2xl text-sm font-bold my-5' > Current Address </h3>
                                            <div className='border border-black p-4 rounded-md'>
                                                < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >


                                                    < div className="form-group" >
                                                        <label className='text-sm' > Current Address <span className="text-red-500 text-lg" >*</span></label >
                                                        <input
                                                            value={cefData.current_address}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address"
                                                            name="current_address"
                                                            disabled

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="current_address_pin_code" > Pin Code < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.current_address_pin_code}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address_pin_code"
                                                            name="current_address_pin_code"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="current_address_landline_number" > Mobile Number < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.current_address_landline_number}
                                                            type="number"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address_landline_number"
                                                            name="current_address_landline_number"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="current_address_state" > Current State < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.current_address_state}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address_state"
                                                            name="current_address_state"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="current_prominent_landmark" > Current Landmark < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.current_prominent_landmark}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_prominent_landmark"
                                                            name="current_prominent_landmark"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="current_address_stay_to" > Current Address Stay No.< span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.current_address_stay_to}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address_stay_to"
                                                            name="current_address_stay_to"
                                                        />
                                                    </div>

                                                </div>

                                                <div className="form-group" >
                                                    <label className='text-sm' htmlFor="nearest_police_station" > Nearest Police Station.</label>
                                                    < input
                                                        disabled
                                                        value={cefData.current_address_nearest_police_station}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="current_address_nearest_police_station"
                                                        name="current_address_nearest_police_station"

                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {serviceData.map((service, serviceIndex) => {
                                    if (activeTab === serviceIndex + 2) {
                                        return (
                                            <div key={serviceIndex} className="md:p-6">
                                                <h2 className="text-2xl font-bold mb-6">{service.heading}</h2>
                                                {service.db_table == "gap_validation" && <><label for="highest_education" className='font-bold'>Your Highest Education:</label>
                                                    <select id="highest_education_gap" name="highest_education_gap"
                                                        value={annexureData["gap_validation"].highest_education_gap || ''}
                                                        disabled
                                                        className="mt-1 mb-3 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Your Highest Education</option>
                                                        <option value="phd">PHD</option>
                                                        <option value="post_graduation">Post Graduation</option>
                                                        <option value="graduation">Graduation</option>
                                                        <option value="senior_secondary">Senior Secondary Education</option>
                                                        <option value="secondary">Secondary Education</option>
                                                    </select>
                                                    {annexureData["gap_validation"].highest_education_gap === 'phd' && (
                                                        <>
                                                            <h3 className="text-lg font-bold py-3">PHD</h3>
                                                            <div className=' border border-black p-4 rounded-md'>
                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                    <div>
                                                                        <label>Institute Name</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].phd_institute_name_gap || ''}
                                                                            name="phd_institute_name_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label>School Name</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].phd_school_name_gap || ''}
                                                                            name="phd_school_name_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label>Start Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].phd_start_date_gap || ''}
                                                                            name="phd_start_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label>End Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].phd_end_date_gap || ''}
                                                                            name="phd_end_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 mb-3">
                                                                    <label>Specialization</label>
                                                                    <input
                                                                        type="text"
                                                                        disabled
                                                                        value={annexureData["gap_validation"].phd_specialization_gap || ''}
                                                                        name="phd_specialization_gap"
                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {renderGapMessage(gaps.gapPostGradToPhd)}
                                                        </>
                                                    )}


                                                    {(annexureData["gap_validation"].highest_education_gap === 'post_graduation' || annexureData["gap_validation"].highest_education_gap === 'phd') && (
                                                        <>
                                                            <h3 className="text-lg font-bold py-3">POST GRADUATION</h3>
                                                            <div className='border border-black p-4 rounded-md'>
                                                                <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                    <div>
                                                                        <label>University / Institute Name</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].post_graduation_university_institute_name_gap || ''}
                                                                            name="post_graduation_university_institute_name_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label>Course</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].post_graduation_course_gap || ''}
                                                                            name="post_graduation_course_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label>Specialization Major</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].post_graduation_specialization_major_gap || ''}
                                                                            name="post_graduation_specialization_major_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <label>Start Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].post_graduation_start_date_gap || ''}
                                                                            name="post_graduation_start_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label>End Date</label>
                                                                    <input
                                                                        type="date"
                                                                        disabled
                                                                        value={annexureData["gap_validation"].post_graduation_end_date_gap || ''}
                                                                        name="post_graduation_end_date_gap"
                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {renderGapMessage(gaps.gapGradToPostGrad)}
                                                        </>
                                                    )}

                                                    {(annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'post_graduation' || annexureData["gap_validation"].highest_education_gap === 'phd') && (
                                                        <>
                                                            <h3 className="text-lg font-bold py-3">GRADUATION</h3>
                                                            <div className='border border-black p-4 rounded-md'>
                                                                <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                    <div>
                                                                        <label>University / Institute Name</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].graduation_university_institute_name_gap || ''}
                                                                            name="graduation_university_institute_name_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label>Course</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].graduation_course_gap || ''}
                                                                            name="graduation_course_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label>Specialization Major</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].graduation_specialization_major_gap || ''}
                                                                            name="graduation_specialization_major_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <label>Start Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].graduation_start_date_gap || ''}
                                                                            name="graduation_start_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />

                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label>End Date</label>
                                                                    <input
                                                                        type="date"
                                                                        disabled
                                                                        value={annexureData["gap_validation"].graduation_end_date_gap || ''}
                                                                        name="graduation_end_date_gap"
                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {renderGapMessage(gaps.gapSrSecToGrad)}
                                                        </>
                                                    )}

                                                    {(annexureData["gap_validation"].highest_education_gap === 'senior_secondary' || annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'phd' || annexureData["gap_validation"].highest_education_gap === 'post_graduation') && (
                                                        <>
                                                            <h3 className="text-lg font-bold py-3">SENIOR SECONDARY</h3>
                                                            <div className="border border-black p-4 rounded-md">
                                                                <div className="my-3">
                                                                    <label>School Name</label>
                                                                    <input
                                                                        type="text"
                                                                        disabled
                                                                        value={annexureData["gap_validation"].senior_secondary_school_name_gap || ''}
                                                                        name="senior_secondary_school_name_gap"
                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                    <div>
                                                                        <label>Start Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].senior_secondary_start_date_gap || ''}
                                                                            name="senior_secondary_start_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label>End Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].senior_secondary_end_date_gap || ''}
                                                                            name="senior_secondary_end_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {renderGapMessage(gaps.gapSecToSrSec)}
                                                        </>
                                                    )}

                                                    {(annexureData["gap_validation"].highest_education_gap === 'secondary' || annexureData["gap_validation"].highest_education_gap === 'senior_secondary' || annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'phd' || annexureData["gap_validation"].highest_education_gap === 'post_graduation') && (
                                                        <>
                                                            <h3 className="text-lg font-bold py-3">SECONDARY</h3>
                                                            <div className=" border border-black p-4 rounded-md">
                                                                <div className="my-3">
                                                                    <label>School Name</label>
                                                                    <input
                                                                        type="text"
                                                                        disabled
                                                                        value={annexureData["gap_validation"].secondary_school_name_gap || ''}
                                                                        name="secondary_school_name_gap"
                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                    />
                                                                </div>
                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                    <div>
                                                                        <label>Start Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].secondary_start_date_gap || ''}
                                                                            name="secondary_start_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label>End Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData["gap_validation"].secondary_end_date_gap || ''}
                                                                            name="secondary_end_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className='mt-5'>
                                                        <label htmlFor="employmentType_gap" className='font-bold'>EMPLOYMENT</label>
                                                        <div className='mb-3'>
                                                            <label htmlFor="years_of_experience_gap">Year's of Experience</label>
                                                            <input
                                                                type="number"
                                                                disabled
                                                                id="years_of_experience_gap"
                                                                name="years_of_experience_gap"
                                                                value={annexureData["gap_validation"].years_of_experience_gap || ''}
                                                                className="form-control border rounded w-full bg-white p-2 mt-2"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="no_of_employment">No of Employment</label>
                                                            <input
                                                                type="number"
                                                                disabled
                                                                id="no_of_employment"
                                                                name="no_of_employment"
                                                                value={annexureData["gap_validation"].no_of_employment || ''}
                                                                className="form-control border rounded w-full bg-white p-2 mt-2"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Dynamically render Employment Forms based on no_of_employment */}
                                                    {Array.from({ length: annexureData["gap_validation"].no_of_employment || 0 }, (_, index) => (
                                                        <div key={index} className='border border-black p-4 rounded-md my-3'>
                                                            <h3 className="text-lg font-bold pb-3">Employment({index + 1})</h3>
                                                            <div>
                                                                <label htmlFor={`employment_type_gap_${index + 1}`}>Employment Type</label>
                                                                <input
                                                                    disabled
                                                                    type="text"
                                                                    id={`employment_type_gap_${index + 1}`}
                                                                    name={`employment_type_gap_${index + 1}`}
                                                                    value={annexureData["gap_validation"]?.[`employment_type_gap_${index + 1}`] || ''}
                                                                    className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {/* Start Date Field */}
                                                                <div>
                                                                    <label htmlFor={`employment_start_date_gap_${index + 1}`}>Start Date</label>
                                                                    <input
                                                                        disabled
                                                                        type="date"
                                                                        id={`employment_start_date_gap_${index + 1}`}
                                                                        name={`employment_start_date_gap_${index + 1}`}
                                                                        value={annexureData["gap_validation"]?.[`employment_start_date_gap_${index + 1}`] || ''}
                                                                        className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                    />
                                                                </div>

                                                                {/* End Date Field */}
                                                                <div>
                                                                    <label htmlFor={`employment_end_date_gap_${index + 1}`}>End Date</label>
                                                                    <input
                                                                        type="date"
                                                                        disabled
                                                                        id={`employment_end_date_gap_${index + 1}`}
                                                                        name={`employment_end_date_gap_${index + 1}`}
                                                                        value={annexureData["gap_validation"]?.[`employment_end_date_gap_${index + 1}`] || ''}
                                                                        className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {employGaps.map((item, idx) => {
                                                                const isNoGap = item.difference.toLowerCase().includes("no") && item.difference.toLowerCase().includes("gap");

                                                                if (item.endValue === annexureData["gap_validation"]?.[`employment_end_date_gap_${index + 1}`]) {
                                                                    return (
                                                                        <p key={idx} className={`${isNoGap ? 'text-green-500' : 'text-red-500'} py-2`}>
                                                                            {isNoGap ? item.difference : `GAP--${item.difference || 'No gap Found'}`}
                                                                        </p>
                                                                    );
                                                                }
                                                                return null;
                                                            })}

                                                        </div>
                                                    ))}
                                                </>}

                                                {service.db_table !== "gap_validation" && (
                                                    <>
                                                        <div className="md:space-y-6" id="servicesForm" key={serviceIndex}>
                                                            {service.rows.map((row, rowIndex) => {
                                                                if (hiddenRows[`${serviceIndex}-${rowIndex}`]) {
                                                                    return null;
                                                                }

                                                                return (
                                                                    <div key={rowIndex} className={`${row.class || 'grid'}`}>
                                                                        {/* Render row heading if it exists */}
                                                                        {row.heading && <h3 className="text-lg font-bold mb-4">{row.heading}</h3>}



                                                                        {/* Render row description if it exists */}
                                                                        {row.description && (
                                                                            <p className="text-sm text-gray-600">{row.description}</p>
                                                                        )}

                                                                        <div className="space-y-4">
                                                                            <div className={`md:grid grid-cols-${row.inputs.length === 1 ? '1' : row.inputs.length === 2 ? '2' : row.inputs.length === 4 ? '2' : row.inputs.length === 5 ? '3' : '3'} gap-3`}>

                                                                                {row.inputs.map((input, inputIndex) => {

                                                                                    const isCheckbox = input.type === 'checkbox';
                                                                                    const isDoneCheckbox = isCheckbox && (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'));
                                                                                    const isChecked = ["1", 1, true, "true"].includes(annexureData[service.db_table]?.[input.name] ?? false);

                                                                                    // Handle logic for checkbox checked state
                                                                                    if (isDoneCheckbox && isChecked) {
                                                                                        // Hide all rows except the one with the checked checkbox
                                                                                        service.rows.forEach((otherRow, otherRowIndex) => {
                                                                                            if (otherRowIndex !== rowIndex) {
                                                                                                hiddenRows[`${serviceIndex}-${otherRowIndex}`] = true; // Hide other rows
                                                                                            }
                                                                                        });
                                                                                        hiddenRows[`${serviceIndex}-${rowIndex}`] = false; // Ensure current row stays visible
                                                                                    }

                                                                                    return (
                                                                                        <div key={inputIndex} className={row.inputs.length === 5 && (inputIndex === 3 || inputIndex === 4) ? 'col-span-3' : ''}>
                                                                                            <label className="text-sm block font-medium mb-0 text-gray-700 capitalize">
                                                                                                {input.label.replace(/[\/\\]/g, '')}
                                                                                                {input.required && <span className="text-red-500">*</span>}
                                                                                            </label>

                                                                                            {/* Render input types dynamically */}
                                                                                            {input.type === 'input' && (
                                                                                                <input
                                                                                                    type="text"
                                                                                                    disabled
                                                                                                    name={input.name}
                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                />
                                                                                            )}
                                                                                            {input.type === 'textarea' && (
                                                                                                <textarea
                                                                                                    name={input.name}
                                                                                                    rows={1}
                                                                                                    disabled
                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                />
                                                                                            )}
                                                                                            {input.type === 'datepicker' && (
                                                                                                <input
                                                                                                    type="date"
                                                                                                    disabled
                                                                                                    name={input.name}
                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                />
                                                                                            )}
                                                                                            {input.type === 'number' && (
                                                                                                <input
                                                                                                    type="number"
                                                                                                    disabled
                                                                                                    name={input.name}
                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                />
                                                                                            )}
                                                                                            {input.type === 'email' && (
                                                                                                <input
                                                                                                    type="email"
                                                                                                    disabled
                                                                                                    name={input.name}
                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                />
                                                                                            )}
                                                                                            {input.type === 'select' && (
                                                                                                <select
                                                                                                    name={input.name}
                                                                                                    disabled
                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                >
                                                                                                    <option value="">Select</option>
                                                                                                    {Object.entries(input.options).map(([key, option], optionIndex) => (
                                                                                                        <option key={optionIndex} value={key}>
                                                                                                            {option}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </select>
                                                                                            )}

                                                                                            {input.type === 'file' && (
                                                                                                <>
                                                                                                    <input
                                                                                                        type="file"
                                                                                                        disabled
                                                                                                        name={input.name}
                                                                                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none"
                                                                                                    />
                                                                                                    <div className="border p-3 rounded-md mt-4">
                                                                                                        {annexureData[service.db_table] && annexureData[service.db_table][input.name] ? (
                                                                                                            <Swiper
                                                                                                                spaceBetween={10} // Space between slides
                                                                                                                slidesPerView={5} // Default is 5 images per view for larger screens
                                                                                                                loop={true} // Loop through images
                                                                                                                autoplay={{
                                                                                                                    delay: 1000,
                                                                                                                    disableOnInteraction: false, // Keeps autoplay active on interaction
                                                                                                                }}
                                                                                                                pagination={{
                                                                                                                    clickable: true,
                                                                                                                }}
                                                                                                                navigation={{ // Enable next/prev buttons
                                                                                                                    nextEl: '.swiper-button-next',
                                                                                                                    prevEl: '.swiper-button-prev',
                                                                                                                }}
                                                                                                                breakpoints={{
                                                                                                                    // When the screen width is 640px or smaller (mobile devices)
                                                                                                                    640: {
                                                                                                                        slidesPerView: 1, // Show 1 image per slide on mobile
                                                                                                                    },
                                                                                                                    // When the screen width is 768px or larger (tablet and desktop)
                                                                                                                    768: {
                                                                                                                        slidesPerView: 3, // Show 3 images per slide on tablets (optional)
                                                                                                                    },
                                                                                                                    1024: {
                                                                                                                        slidesPerView: 6, // Show 3 images per slide on tablets (optional)
                                                                                                                    },
                                                                                                                }}
                                                                                                            >
                                                                                                                {annexureData[service.db_table][input.name].split(',').map((item, index) => {
                                                                                                                    const isImage = item && (item.endsWith('.jpg') || item.endsWith('.jpeg') || item.endsWith('.png'));

                                                                                                                    return (
                                                                                                                        <SwiperSlide key={index}>
                                                                                                                            <div className="swiper-slide-container">
                                                                                                                                {isImage ? (
                                                                                                                                    <img
                                                                                                                                        src={item}
                                                                                                                                        alt={`Image ${index}`}
                                                                                                                                        className='md:h-[100px] md:w-[100px]'
                                                                                                                                    />
                                                                                                                                ) : (
                                                                                                                                    <button onClick={() => window.open(item, '_blank')}>Open Link</button>
                                                                                                                                )}
                                                                                                                            </div>
                                                                                                                        </SwiperSlide>
                                                                                                                    );
                                                                                                                })}
                                                                                                            </Swiper>
                                                                                                        ) : (
                                                                                                            <p>No image or link available</p>
                                                                                                        )}
                                                                                                    </div>

                                                                                                </>
                                                                                            )}

                                                                                            {input.type === 'checkbox' && (
                                                                                                <div className="flex items-center space-x-3">
                                                                                                    <input
                                                                                                        type="checkbox"
                                                                                                        disabled
                                                                                                        name={input.name}
                                                                                                        checked={
                                                                                                            ["1", 1, true, "true"].includes(annexureData[service.db_table]?.[input.name] ?? false)
                                                                                                        } // Check if the value is 1, indicating it is checked
                                                                                                        value={annexureData[service.db_table]?.[input.name] || ''}  // Set the value to an empty string if no value is found
                                                                                                        className="h-5 w-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"

                                                                                                    />
                                                                                                    <span className="text-sm text-gray-700">{input.label}</span>
                                                                                                </div>
                                                                                            )}


                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>

                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}

                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                                {activeTab === conditionHtml.service_index + 2 && Object.keys(conditionHtml).map((attr, index) => {
                                    const content = conditionHtml[attr];
                                    return content ? (  // Check if content is not empty or null
                                        <div key={index}>
                                            <div dangerouslySetInnerHTML={{ __html: content }} />
                                        </div>
                                    ) : null; // If content is empty or null, return null (i.e., don't render anything)
                                })}



                                {/* Step 3 logic */}
                                {activeTab === serviceData.length + 2 && (
                                    <div>
                                        <div className='mb-6  p-4 rounded-md border  bg-white mt-8' >
                                            <h4 className="md:text-start text-start md:text-xl text-sm my-6 font-bold" > Declaration and Authorization </h4>
                                            < div className="mb-6" >
                                                <p className='text-sm' >
                                                    I hereby authorize GoldQuest Global HR Services Private Limited and its representative to verify information provided in my application for employment and this employee background verification form, and to conduct enquiries as may be necessary, at the company’s discretion.I authorize all persons who may have information relevant to this enquiry to disclose it to GoldQuest Global HR Services Pvt Ltd or its representative.I release all persons from liability on account of such disclosure.
                                                    I confirm that the above information is correct to the best of my knowledge.I agree that in the event of my obtaining employment, my probationary appointment, confirmation as well as continued employment in the services of the company are subject to clearance of medical test and background verification check done by the company.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-6" >


                                                < div className="form-group" >
                                                    <label className='text-sm'>Name</label>
                                                    < input
                                                        value={cefData.name_declaration}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                        name="name_declaration"
                                                        disabled
                                                    />
                                                </div>


                                                < div className="form-group" >
                                                    <label className='text-sm' > Date < span className='text-red-500' >* </span></label >
                                                    <input
                                                        disabled
                                                        value={cefData.declaration_date}
                                                        type="date"
                                                        className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                        name="declaration_date"
                                                    />

                                                </div>
                                            </div>
                                            <div className="form-group" >
                                                <label className='text-sm'> Attach signature: <span className="text-red-500 text-lg" >* </span></label >
                                                <input
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                    className="form-control border rounded w-full p-1 mt-2 bg-white mb-0"
                                                    name="signature"
                                                    id="signature"
                                                    disabled
                                                />
                                                < p className="text-gray-500 text-sm mt-2" >
                                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                </p>
                                                {
                                                    cefData.signature && (
                                                        <div className='md:h-20 md:w-20 border rounded-md p-2 '><img src={cefData.signature} alt="No Signature Found" className='h-full w-full' /></div>
                                                    )
                                                }


                                            </div>
                                        </div>

                                        <div className='p-1 bg-white  rounded-md border md:p-4'>
                                            < h5 className="md:text-start text-start text-lg my-6 font-bold "> Documents(Mandatory) </h5>
                                            < div className="grid grid-cols-1  md:grid-cols-3 gap-4 pt-4">
                                                <div className="p-4 border rounded-md" >
                                                    <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                                        <FaGraduationCap className="mr-3" />
                                                        Education
                                                    </h6>
                                                    < p className='text-sm' > Photocopy of degree certificate and final mark sheet of all examinations.</p>
                                                </div>

                                                < div className="p-4 border rounded-md" >
                                                    <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                                        <FaBriefcase className="mr-3" />
                                                        Employment
                                                    </h6>
                                                    < p className='text-sm' > Photocopy of relieving / experience letter for each employer mentioned in the form.</p>
                                                </div>

                                                < div className="p-4 border rounded-md" >
                                                    <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                                        <FaIdCard className="mr-3" />
                                                        Government ID / Address Proof
                                                    </h6>
                                                    < p className='text-sm' > Aadhaar Card / Bank Passbook / Passport Copy / Driving License / Voter ID.</p>
                                                </div>
                                            </div>


                                            < p className='md:text-start text-start text-sm mt-4' >
                                                NOTE: If you experience any issues or difficulties with submitting the form, please take screenshots of all pages, including attachments and error messages, and email them to < a href="mailto:onboarding@goldquestglobal.in" > onboarding@goldquestglobal.in</a> . Additionally, you can reach out to us at <a href="mailto:onboarding@goldquestglobal.in">onboarding@goldquestglobal.in</a > .
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>


                            <div className="flex space-x-4 mt-6">
                                {activeTab > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleBack} // Call the handleBack function when the button is clicked
                                        className="px-6 py-2 text-gray-500 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Go Back
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleNext} // Call the handleNext function when the button is clicked
                                    disabled={activeTab === serviceData.length + 2} // Disable the button if on the last tab (e.g., tab 2)
                                    className="bg-green-500 text-white p-3 rounded-md"
                                >
                                    Next
                                </button>
                            </div>





                        </div>



                    </form>
            }

        </>
    );
};

export default CandidateBGV;
