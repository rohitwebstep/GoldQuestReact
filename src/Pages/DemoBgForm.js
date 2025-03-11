import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import LogoBgv from '../Images/LogoBgv.jpg'
import { FaGraduationCap, FaBriefcase, FaIdCard } from 'react-icons/fa';
import { FaUser, FaCog, FaCheckCircle } from 'react-icons/fa'
const DemoBgForm = () => {
    const [activeTab, setActiveTab] = useState(0); // Tracks the active tab (0, 1, or 2)


    const [errors, setErrors] = useState({});
    const [checkedCheckboxes, setCheckedCheckboxes] = useState({});
    const [hiddenRows, setHiddenRows] = useState({});
    const [showModal, setShowModal] = useState(false);  // Control modal visibility
    const [progress, setProgress] = useState(0);
    const [files, setFiles] = useState({});
    const [serviceData, setServiceData] = useState([]);
    const [status, setStatus] = useState([]);

    // Handler to toggle row visibility
    const [fileNames, setFileNames] = useState([]);
    const [serviceDataImageInputNames, setServiceDataImageInputNames] = useState([]);
    const [apiStatus, setApiStatus] = useState(true);
    const [annexureData, setAnnexureData] = useState({});
    const [serviceIds, setServiceIds] = useState(''); // Expecting a comma-separated string

    const [formData, setFormData] = useState({
        personal_information: {
            full_name: '',
            former_name: '',
            mb_no: '',
            father_name: '',
            husband_name: '',
            dob: '',
            gender: '',
            full_address: '',
            pin_code: '',
            declaration_date: '',
            current_address: '',
            current_address_landline_number: '',
            current_address_state: '',
            current_prominent_landmark: '',
            current_address_stay_to: '',
            nearest_police_station: '',
            nationality: '',
            marital_status: '',
            name_declaration: '',
            blood_group: '',
            pan_card_name: '',
            aadhar_card_name: '',
            aadhar_card_number: '',
            emergency_details_name: '',
            emergency_details_relation: '',
            emergency_details_contact_number: '',
            icc_bank_acc: '',
            food_coupon: "",
            ssn_number: "",

        },
    });
    const [companyName, setCompanyName] = useState([]);
    const refs = useRef({});

    const [isValidApplication, setIsValidApplication] = useState(true);
    const location = useLocation();
    const currentURL = location.pathname + location.search;

    const [loading, setLoading] = useState(false);

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


    const decodedValues = getValuesFromUrl(currentURL);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({
                ...formData,
                personal_information: {
                    ...formData.personal_information,
                    [name]: value
                }
            });
        }
    };
    const validate = () => {
        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            "image/jpeg", "image/png", "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]; // Allowed file types

        let newErrors = {}; // Object to store errors
        const service = serviceData[activeTab - 1];

        // Check if any checkbox is checked in any row of this service to skip the validation for the entire service
        const shouldSkipServiceValidation = service.rows.some(row =>
            row.inputs.some(input =>
                input.type === 'checkbox' &&
                (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done')) &&
                checkedCheckboxes[input.name]
            )
        );


        if (shouldSkipServiceValidation) {
            return {}; // Skip all validation for this service and return empty errors
        }
        service.rows.forEach((row, rowIndex) => {

            // Check if any of the checkboxes `done_or_not` is checked for this row
            const skipRowValidation = row.inputs.some(input =>
                input.type === 'checkbox' && input.name.startsWith('done_or_not') && checkedCheckboxes[input.name]
            );


            if (skipRowValidation) {
                return; // Skip this row entirely (no validation will be performed for this row)
            }

            row.inputs.forEach((input, inputIndex) => {

                // Skip validation for this input if the row was skipped
                if (skipRowValidation) {
                    return;
                }

                // If the input is a file, validate the file type and size
                if (input.type === 'file') {
                    const validateFile = (fileName) => {
                        let fileErrors = [];
                        const mapping = serviceDataImageInputNames.find(entry => entry[fileName]);
                        const createdFileName = mapping ? mapping[fileName] : undefined;

                        // Check if createdFileName is valid and the structure exists in 'files'
                        const filesToCheck = createdFileName && files[createdFileName] ? files[createdFileName][fileName] : undefined;

                

                        // If files exist for the input, perform file validation
                        if (filesToCheck && filesToCheck.length > 0) {
                            filesToCheck.forEach((fileItem) => {

                                // Validate file size
                                if (fileItem.size > maxSize) {
                                    fileErrors.push(`${fileItem.name}: File size must be less than 2MB.`);
                                }

                                // Validate file type
                                if (!allowedTypes.includes(fileItem.type)) {
                                    fileErrors.push(`${fileItem.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
                                }
                            });
                        } else {
                            fileErrors.push(`${fileName} is required.`);
                        }

                        return fileErrors;
                    };

                    // Validate files for all required file inputs
                    const fileInputKeys = row.inputs.filter(input => input.type === 'file').map(input => input.name);

                    fileInputKeys.forEach((fileField) => {
                        const fileErrors = validateFile(fileField);

                        // Ensure errors[fileField] is always an array
                        if (!Array.isArray(newErrors[fileField])) {
                            newErrors[fileField] = []; // Initialize it as an array if not already
                        }

                        // If there are file errors, push them to newErrors
                        if (fileErrors.length > 0) {
                            newErrors[fileField] = [...newErrors[fileField], ...fileErrors];
                        } else {
                            // If no errors and files were selected, clear any previous errors
                            delete newErrors[fileField];
                        }
                    });
                } else {
                    // For non-file inputs, validate required fields
                    const inputValue = annexureData[service.db_table]?.[input.name];

                    if (input.required && (!inputValue || inputValue.trim() === '')) {
                        newErrors[input.name] = 'This field is required';
                    }
                }
            });
        });


        // Log the errors at the end of validation
        if (Object.keys(newErrors).length > 0) {
        } else {
        }

        return newErrors; // Return the accumulated errors
    };




    const handleCheckboxChange = (checkboxName, isChecked) => {
        setCheckedCheckboxes((prevState) => ({
            ...prevState,
            [checkboxName]: isChecked,
        }));
    };

    const toggleRowsVisibility = (serviceIndex, rowIndex, isChecked) => {

        setHiddenRows((prevState) => {
            const newState = { ...prevState };
            const serviceRows = serviceData[serviceIndex].rows;
            const row = serviceRows[rowIndex];


            const fileInputs = row.inputs.filter(input => input.type === 'file');

            if (isChecked) {
                setServiceDataImageInputNames((prevFileInputs) => {

                    return prevFileInputs.filter(fileInput => {
                        const fileInputName = Object.values(fileInput)[0];
                        const isCurrentServiceFile = fileInputName.startsWith(`${serviceData[serviceIndex].db_table}_`);


                        return !(isCurrentServiceFile &&
                            (row.inputs.some(input =>
                                input.type === 'checkbox' &&
                                input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'))));
                    });
                });

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


                    newState[`${serviceIndex}-${i}`] = true;
                }
            } else {
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


                    delete newState[`${serviceIndex}-${i}`];
                }
            }


            return newState;
        });
    };


    const handleServiceChange = (tableName, fieldName, value) => {
        // Update the state with the latest value
        setAnnexureData((prevData) => ({
            ...prevData,
            [tableName]: {
                ...prevData[tableName],
                [fieldName]: value
            }
        }));

        // Trigger validation immediately after the state change
        validate();
    };



    const handleNext = () => {
        let validationErrors = {};

        // Run the validation based on the current active tab
        if (activeTab === 0) {
            validationErrors = validate1(); // Ensure validate1() returns an error object
        } else if (activeTab > 0 && activeTab <= serviceData.length) {
            validationErrors = validate(); // Call the modified validate function for service validation
        } else if (activeTab === serviceData.length + 1) {
            validationErrors = validate2(); // Ensure validate2() handles declaration validation
        }

        if (Object.keys(validationErrors).length === 0) {
            // No errors, proceed to the next tab
            setErrors({}); // Clear previous errors
            if (activeTab < serviceData.length + 1) {
                setActiveTab(activeTab + 1); // Move to the next tab
            }
        } else {
            // There are validation errors, show them and prevent tab change
            setErrors(validationErrors); // Update state with validation errors

            // Optional: You could show errors in a user-friendly way
            alert("Please fill all required fields before moving to the next tab.");
        }
    };


    const validate1 = () => {
        const newErrors = {}; // Object to hold validation errors

        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            "image/jpeg", "image/png", "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]; // Allowed file types
        // Define the required fields for the first tab
        const requiredFields = [
            "full_name", "former_name", "mb_no", "father_name", "dob",
            "gender", "full_address", "pin_code", "current_address", "current_address_landline_number",
            "current_address_state", "current_prominent_landmark", "current_address_stay_to",
            "nationality", "marital_status",
        ];

        if (status === 1) {
            // Additional fields for status === 1
            const additionalFields = [
                "emergency_details_name", "emergency_details_relation", "emergency_details_contact_number",
                "aadhar_card_name", "pan_card_name", "food_coupon"
            ];

            // Add additional fields to the required fields
            requiredFields.push(...additionalFields);
        }

        // Validate file uploads
        const validateFile = (fileName) => {
            let file;
            let createdFileName;

            if (["govt_id", "resume_file", "passport_photo", "aadhar_card_image", "pan_card_image"].includes(fileName)) {
                createdFileName = `applications_${fileName}`;
                file = files[createdFileName]?.[fileName];
            } else {
                const mapping = serviceDataImageInputNames.find(entry => entry[fileName]);
                createdFileName = mapping ? mapping[fileName] : undefined;
                file = createdFileName ? files[createdFileName]?.[fileName] : undefined;
            }

            let fileErrors = [];
            if (file) {
                file.forEach((fileItem) => {
                    if (fileItem.size > maxSize) {
                        const errorMessage = `${fileItem.name}: File size must be less than 2MB.`;
                        fileErrors.push(errorMessage);
                    }

                    if (!allowedTypes.includes(fileItem.type)) {
                        const errorMessage = `${fileItem.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`;
                        fileErrors.push(errorMessage);
                    }
                });
            } else {
                const errorMessage = `${fileName} is required.`;
                fileErrors.push(errorMessage);
            }

            return fileErrors;
        };

        // Define required file inputs for the first tab
        const requiredFileInputsRaw = ["govt_id", "resume_file"];
        const requiredFileInputs = [...requiredFileInputsRaw];

        if (status === 1) {
            const additionalImagesFields = ["passport_photo", "aadhar_card_image", "pan_card_image"];
            requiredFileInputs.push(...additionalImagesFields);
        }

        requiredFileInputs.forEach((field) => {
            const agrUploadErrors = validateFile(field);
            if (agrUploadErrors.length > 0) {
                newErrors[field] = agrUploadErrors;
            }
        });

        // Handle required fields validation for the first tab
        requiredFields.forEach((field) => {
            if (!formData.personal_information[field] || formData.personal_information[field].trim() === "") {
                newErrors[field] = "This field is required*";
            }
        });

        return newErrors;
    };
    const validate2 = () => {
        const newErrors = {}; // Object to hold validation errors
        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]; // Allowed file types

        // Check for the signature file in the state (files object)
        const validateFile = (fileName) => {
            let file;
            let createdFileName;

            if (["signature"].includes(fileName)) {
                createdFileName = `applications_${fileName}`;
                file = files[createdFileName]?.[fileName];
            } else {
                const mapping = serviceDataImageInputNames.find(entry => entry[fileName]);
                createdFileName = mapping ? mapping[fileName] : undefined;
                file = createdFileName ? files[createdFileName]?.[fileName] : undefined;
            }

            let fileErrors = [];
            if (file) {
                file.forEach((fileItem) => {
                    if (fileItem.size > maxSize) {
                        const errorMessage = `${fileItem.name}: File size must be less than 2MB.`;
                        fileErrors.push(errorMessage);
                    }

                    if (!allowedTypes.includes(fileItem.type)) {
                        const errorMessage = `${fileItem.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`;
                        fileErrors.push(errorMessage);
                    }
                });
            } else {
                const errorMessage = `${fileName} is required.`;
                fileErrors.push(errorMessage);
            }

            return fileErrors;
        };

        // Define required file inputs for the first tab
        const requiredFileInputsRaw = ["signature"];
        const requiredFileInputs = [...requiredFileInputsRaw];


        requiredFileInputs.forEach((field) => {
            const agrUploadErrors = validateFile(field);
            if (agrUploadErrors.length > 0) {
                newErrors[field] = agrUploadErrors;
            }
        });

        // Now handle the required fields validation
        const requiredFields = [
            "declaration_date", // Add other required fields here if needed
        ];

        requiredFields.forEach((field) => {
            if (!formData.personal_information[field] || formData.personal_information[field].trim() === "") {
                newErrors[field] = "This field is required*";
            }
        });

        return newErrors;
    };




    const fetchApplicationStatus = async () => {
        if (
            isValidApplication &&
            decodedValues.app_id &&
            decodedValues.branch_id &&
            decodedValues.customer_id
        ) {
            try {
                const response = await fetch(
                    `https://api.goldquestglobal.in/branch/candidate-application/backgroud-verification/is-application-exist?candidate_application_id=${decodedValues.app_id}&branch_id=${decodedValues.branch_id}&customer_id=${decodedValues.customer_id}`
                );

                const result = await response.json();
                if (result?.status) {
                    // Application exists and is valid
                    setServiceIds(result.data?.application?.services || '');
                    setStatus(result.data?.application?.is_custom_bgv || '');
                    setCompanyName(result.data?.application?.branch_name || '');


                } else {
                    // Application does not exist or other error: Hide the form and show an alert
                    const form = document.getElementById('bg-form');
                    if (form) {
                        form.remove();
                    } else {
                    }
                    setApiStatus(false);

                    // Show message from the response
                    Swal.fire({
                        title: 'Notice',
                        text: result.message || 'Application does not exist.',
                        icon: 'warning',
                        confirmButtonText: 'OK',
                    });
                }
            } catch (err) {
                Swal.fire({
                    title: 'Error',
                    text: err.message || 'An unexpected error occurred.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            }
        }
    };

    const handleTabClick = (heading) => {
        setActiveTab(heading);
    };


    useEffect(() => {
        fetchApplicationStatus();
    }, []); // The empty array ensures this runs only once, on mount

    const fetchData = useCallback(() => {

        const serviceArr = serviceIds.split(',').map(Number);
        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        const fetchPromises = serviceArr.map(serviceId =>
            fetch(
                `https://api.goldquestglobal.in/branch/candidate-application/backgroud-verification/service-form-json?service_id=${serviceId}`,
                requestOptions
            )
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`Error fetching service ID ${serviceId}: ${res.statusText}`);
                    }
                    return res.json();
                })
        );

        Promise.all(fetchPromises)
            .then(results => {
                const combinedResults = results.flatMap(result => result.formJson || []);
                const parsedData = combinedResults.map(item => {
                    try {
                        const cleanedJson = item.json.replace(/\\/g, '\\\\');
                        return JSON.parse(cleanedJson);
                    } catch (error) {
                        console.error('JSON Parse Error:', error, 'for item:', item);
                        return null;
                    }
                }).filter(data => data !== null);

                const fileInputs = parsedData
                    .flatMap(item =>
                        item.rows.flatMap(row =>
                            row.inputs
                                .filter(input => input.type === "file")
                                .map(input => ({
                                    [input.name]: `${item.db_table}_${input.name}`
                                }))
                        )
                    );

                setServiceDataImageInputNames(fileInputs);
                setServiceData(parsedData);
            })

            .catch(err => console.error('Fetch error:', err));
    }, [serviceIds]);
    useEffect(() => {
        const currentDate = new Date().toISOString().split('T')[0];
        setFormData((prevData) => ({
            ...prevData,
            personal_information: {
                ...prevData.personal_information,
                declaration_date: currentDate,  // Update declaration_date
            },
        }));
    }, []);

    useEffect(() => {
        if (serviceIds) {
            fetchData();
        }
    }, [fetchData, serviceIds]);

    const handleFileChange = (dbTable, fileName, e) => {
        const selectedFiles = Array.from(e.target.files); // Convert FileList to array

        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]; // Allowed file types

        let errors = [];

        selectedFiles.forEach((file) => {
            if (file.size > maxSize) {
                errors.push(`${file.name}: File size must be less than 2MB.`);
            }

            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
            }
        });

        if (errors.length > 0) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [fileName]: errors, // Set errors for this file input
            }));
            return; // Don't update state if there are errors
        }

        // Update files state with the selected files
        setFiles((prevFiles) => ({
            ...prevFiles,
            [dbTable]: {
                ...prevFiles[dbTable],
                [fileName]: selectedFiles, // Correctly store the file data (not empty object)
            },
        }));

        // Remove any errors for this field if no issues
        setErrors((prevErrors) => {
            const { [fileName]: removedError, ...restErrors } = prevErrors; // Remove the error for this file input
            return restErrors;
        });

    };

    const handleSubmit = async (custombgv, e) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Get file count and calculate progress if custombgv is 1
        const fileCount = Object.keys(files).length;
        const TotalApiCalls = fileCount + 1; // Include the API call for the form data
        const dataToSubmitting = 100 / TotalApiCalls;

        // Validation only if custombgv is 1
        let newErrors = {};
        if (custombgv === 1) {
            const validationError = validate2();
            Object.keys(validationError).forEach((key) => {
                if (validationError[key]) {
                    newErrors[key] = validationError[key];
                }
            });

            // If there are errors, show them and focus on the first error field
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                const errorField = Object.keys(newErrors)[0];
                if (refs.current[errorField]) {
                    refs.current[errorField].focus();
                }
                return;
            } else {
                setErrors({});
            }

            // Start loading indicator and open progress modal
            setLoading(true);
            setShowModal(true);
            setProgress(0); // Reset progress before starting
        }

        // Prepare request data
        const requestData = {
            branch_id: decodedValues.branch_id,
            customer_id: decodedValues.customer_id,
            application_id: decodedValues.app_id,
            ...formData,
            is_submitted: 0,
            annexure: annexureData,
            send_mail: fileCount === 0 ? 1 : 0, // Send mail if no files are uploaded
            is_custom_bgv: custombgv, // Use the passed value for is_custom_bgv
        };

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: JSON.stringify(requestData),
            redirect: "follow",
        };

        try {
            // Send the form data request to the API
            const response = await fetch(
                "https://api.goldquestglobal.in/branch/candidate-application/backgroud-verification/submit",
                requestOptions
            );

            if (!response.ok) {
                const errorResponse = await response.json();
                throw new Error(errorResponse.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (custombgv === 1) {
                setProgress(dataToSubmitting); // Update progress
            }

            // Handle the response based on custombgv
            if (custombgv === 0) {
                // If custombgv is 0, show success or error messages only without progress or function calls
                if (fileCount === 0) {
                    Swal.fire({
                        title: "Success",
                        text: "Your Form is saved successfully. You can proceed to your next step!",
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        fetchApplicationStatus(); // Call fetch status only for custombgv 0
                    });
                } else {
                    // Handle file upload logic for custombgv 0, but without progress
                    await uploadCustomerLogo(result.cef_id, fileCount, TotalApiCalls, custombgv); // Upload files
                    Swal.fire({
                        title: "Success",
                        text: "Your Form is saved successfully. You can proceed to your next step!",
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        fetchApplicationStatus(); // Call fetch status after success
                    });
                }
            }

            if (custombgv === 1) {
                // If custombgv is 1, show detailed success message and proceed with progress and file uploads
                if (fileCount === 0) {
                    Swal.fire({
                        title: "Success",
                        text: "CEF Application Created Successfully.",
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        fetchApplicationStatus(); // Call fetch status after submission
                    });
                } else {
                    // Handle file upload if files exist for custombgv 1
                    await uploadCustomerLogo(result.cef_id, fileCount, TotalApiCalls, custombgv); // Upload files
                    setProgress(100); // Set progress to 100% after file upload
                    Swal.fire({
                        title: "Success",
                        text: "CEF Application Created Successfully and files uploaded.",
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        fetchApplicationStatus(); // Call fetch status after successful file upload
                    });
                }

                setFormData({
                    personal_information: {
                        full_name: '',
                        former_name: '',
                        mb_no: '',
                        father_name: '',
                        husband_name: '',
                        dob: '',
                        gender: '',
                        full_address: '',
                        pin_code: '',
                        declaration_date: '',
                        current_address: '',
                        current_address_landline_number: '',
                        current_address_state: '',
                        current_prominent_landmark: '',
                        current_address_stay_to: '',
                        nearest_police_station: '',
                        nationality: '',
                        marital_status: '',
                        name_declaration: '',
                        blood_group: '',
                        pan_card_name: '',
                        aadhar_card_name: '',
                        aadhar_card_number: '',
                        emergency_details_name: '',
                        emergency_details_relation: '',
                        emergency_details_contact_number: '',
                        icc_bank_acc: '',
                        food_coupon: "",
                        ssn_number: "",
                    },
                });
            }

        } catch (error) {
            console.error("Error:", error);
            Swal.fire("Error!", error.message, "error");
        } finally {
            // Stop loading indicator and close modal after processing
            setLoading(false);
            setShowModal(false);
        }
    };




    const uploadCustomerLogo = async (cef_id, fileCount, custombgv) => {
        if (custombgv == 1) {
            setLoading(false); // Stop loading after completion
            return; // Exit the function early for custombgv == 0
        } // Set loading to true when starting the upload

        let progressIncrement = 100 / fileCount; // Calculate progress increment per file

        for (const [index, [key, value]] of Object.entries(files).entries()) {
            const customerLogoFormData = new FormData();
            customerLogoFormData.append('branch_id', decodedValues.branch_id);
            customerLogoFormData.append('customer_id', decodedValues.customer_id);
            customerLogoFormData.append('candidate_application_id', decodedValues.app_id);

            const dbTableRaw = key;
            const dbColumn = Object.keys(value).map((key) => {
                const firstValue = value[key]?.[0]; // Get the first element of the array in 'value'
                return key; // Return the key
            });

            const dbTable = dbTableRaw.replace("_" + dbColumn, ''); // Removes dbColumn from dbTableRaw
            setFileNames(dbColumn);


            customerLogoFormData.append('db_table', dbTable);
            customerLogoFormData.append('db_column', dbColumn);
            customerLogoFormData.append('cef_id', cef_id);

            // Get the first value from the object by accessing the first element of each key
            const allValues = Object.keys(value).flatMap((key) => value[key]); // Flatten all arrays into a single array

            for (const file of allValues) {
                customerLogoFormData.append('images', file); // Append each file to the FormData
            }
            if (fileCount === index + 1) {
                customerLogoFormData.append('send_mail', 1);
            }
            try {
                // Make the API request to upload the logo
                await axios.post(
                    `https://api.goldquestglobal.in/branch/candidate-application/backgroud-verification/upload`,
                    customerLogoFormData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                setProgress((prevProgress) => prevProgress + progressIncrement);

            } catch (err) {
                Swal.fire('Error!', `An error occurred while uploading logo: ${err.message}`, 'error');
            }
        }

        setLoading(false); // Set loading to false once the upload is complete
    };


    const isFormFilled = formData[`tab${activeTab + 1}`] !== "";

    return (
        <>
            {
                loading ? (
                    <div className='flex justify-center items-center py-6'>
                        {showModal && (
                            <div className="fixed inset-0 p-3 flex justify-center items-center bg-gray-300 bg-opacity-50 z-50">
                                <div className="bg-white p-8 rounded-lg md:w-5/12 shadow-xl md:py-20 relative">
                                    <div className="flex justify-center items-center mb-6">
                                        <h2 className="md:text-xl font-bold text-gray-800 text-center uppercase">Generating Candidate Application</h2>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="text-gray-600  absolute md:top-5 top-1 right-5 hover:text-gray-900 font-bold text-lg"
                                        >
                                            &times;
                                        </button>
                                    </div>

                                    <p className="mt-4 text-gray-700 text-lg">
                                        Uploading... <span className="font-medium text-gray-900">{fileNames.join(', ')}</span>
                                        {progress >= 90 && ' - Generating final report...'}
                                    </p>

                                    <div className="mt-6">
                                        <div className="w-full bg-gray-300 rounded-full h-3">
                                            <div
                                                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-4 text-center text-lg font-semibold text-[#3e76a5]">
                                            {Math.round(progress)}%
                                        </div>
                                    </div>


                                </div>
                            </div>
                        )}
                    </div>

                ) : (
                    <div className='py-5'>

                        <div className="md:w-10/12 mx-auto p-6" >
                            {status === 1 && (
                                <div className='flex justify-center my-3'>
                                    <img src={LogoBgv} className='md:w-[12%] w-[50%] m-auto' alt="Logo" />
                                </div>
                            )}

                            <h4 className="text-Black md:text-3xl text-center text-xl md:mb-6 mb-3 font-bold mt-3">Background Verification Form</h4>
                            <div className="md:mb-6 mb-2 py-4 rounded-md">
                                <h5 className="text-lg font-bold text-center md:text-start">Company name: <span className="text-lg font-normal">{companyName}</span></h5>
                            </div>
                            <div className="mb-6 flex p-2 filter-menu overflow-x-auto border rounded-md items-center flex-nowrap relative space-x-4">
                                {/* Personal Information Tab */}
                                <div className="text-center flex items-end">
                                    <button
                                        onClick={() => handleTabClick(0)} // Navigate to tab 0 (Personal Information)
                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center ${activeTab === 0 ? "text-[#3e76a5]" : "text-gray-700"}`}
                                    >
                                        <FaUser
                                            className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full ${activeTab === 0 ? "bg-[#3e76a5] text-white" : "bg-gray-300 text-gray-700"}`}
                                        />
                                        Personal Information
                                    </button>
                                    <hr className="border-[1px] w-20" />
                                </div>

                                {/* Service Tabs */}
                                {serviceData.filter(service => service).map((service, index) => {
                                    // Check if the current tab is filled (this is a flag to check if the tab is filled)
                                    const isTabFilled = formData[`tab${index + 1}`]; // Check if the tab is filled based on formData (you may adjust this depending on your logic)

                                    // Allow navigation to this tab if it's filled, or if it's the previous tab
                                    const isTabEnabled = (activeTab > index) || (isTabFilled && activeTab === index);

                                    return (
                                        <div key={index} className="text-center flex items-end">
                                            <button
                                                disabled={!isTabEnabled} // Disable tab if not filled or if it's not the current tab
                                                className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
                    ${activeTab === index + 1 ? "text-[#3e76a5]" : (isTabEnabled ? "text-gray-700" : "text-gray-400")}`}
                                                onClick={() => handleTabClick(index + 1)} // Switch to this tab if clicked
                                            >
                                                <FaCog
                                                    className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
                        ${activeTab === index + 1 ? "bg-[#3e76a5] text-white" : (isTabEnabled ? "bg-gray-300 text-gray-700" : "bg-gray-100 text-gray-400")}`}
                                                />
                                                {service.heading}
                                            </button>
                                            <hr className="border-[1px] w-20" />
                                        </div>
                                    );
                                })}

                                {/* Declaration and Authorization Tab */}
                                <div className="text-center">
                                    <button
                                        onClick={() => handleTabClick(serviceData.length + 1)} // Set tab to the last one (declaration)
                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center ${activeTab === serviceData.length + 1 ? "text-[#3e76a5]" : "text-gray-700"}`}
                                        disabled={!formData[`tab${serviceData.length}`]} // Disable the tab if the last form is not filled
                                    >
                                        <FaCheckCircle
                                            className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full ${activeTab === serviceData.length + 1 ? "bg-[#3e76a5] text-white" : "bg-gray-300 text-gray-700"}`}
                                        />
                                        Declaration and Authorization
                                    </button>
                                </div>
                            </div>


                            <div className="border p-4 rounded-md shadow-md" >
                                {activeTab === 0 && (
                                    <div>
                                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6 border rounded-md  p-4" >
                                            <div className="form-group col-span-2" >
                                                <label className='text-sm' > Applicant’s CV: <span className="text-red-500 text-lg" >* </span></label >
                                                <input
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types

                                                    className="form-control border rounded w-full bg-white p-2 mt-2"
                                                    name="resume_file"
                                                    id="resume_file"
                                                    onChange={(e) => handleFileChange("applications_resume_file", "resume_file", e)}
                                                    ref={(el) => (refs.current["resume_file"] = el)} // Attach ref here

                                                />
                                                {errors.resume_file && <p className="text-red-500 text-sm" > {errors.resume_file} </p>}
                                                <p className="text-gray-500 text-sm mt-2" >
                                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                </p>
                                            </div>
                                            < div className="form-group col-span-2" >
                                                <label className='text-sm' > Attach Govt.ID Proof: <span className="text-red-500 text-lg" >* </span></label >
                                                <input
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png" // Restrict to image files
                                                    className="form-control border rounded w-full bg-white p-2 mt-2"
                                                    name="govt_id"
                                                    onChange={(e) => handleFileChange("applications_govt_id", "govt_id", e)}
                                                    multiple // Allow multiple file selection
                                                    ref={(el) => (refs.current["applications_govt_id"] = el)} // Attach ref here
                                                />
                                                {errors.govt_id && <p className="text-red-500 text-sm" > {errors.govt_id} </p>}
                                                <p className="text-gray-500 text-sm mt-2" >
                                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                </p>
                                            </div>


                                            {
                                                status === 1 && (
                                                    <>
                                                        <div className="form-group col-span-2" >
                                                            <label className='text-sm' > Passport size photograph - (mandatory with white Background)<span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                type="file"
                                                                accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types

                                                                className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                name="passport_photo"
                                                                onChange={(e) => handleFileChange("applications_passport_photo", "passport_photo", e)
                                                                }
                                                                multiple
                                                                ref={(el) => (refs.current["passport_photo"] = el)} // Attach ref here

                                                            />
                                                            {errors.passport_photo && <p className="text-red-500 text-sm" > {errors.passport_photo} </p>}
                                                            <p className="text-gray-500 text-sm mt-2" >
                                                                Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                            </p>
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
                                                        onChange={handleChange}
                                                        value={formData.personal_information.full_name}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="full_name"
                                                        name="full_name"
                                                        ref={(el) => (refs.current["full_name"] = el)}

                                                    />
                                                    {errors.full_name && <p className="text-red-500 text-sm" > {errors.full_name} </p>}
                                                </div>
                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="former_name" > Former Name / Maiden Name(if applicable)<span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        onChange={handleChange}
                                                        value={formData.personal_information.former_name}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="former_name"
                                                        ref={(el) => (refs.current["former_name"] = el)} // Attach ref here
                                                        name="former_name"
                                                    />
                                                    {errors.former_name && <p className="text-red-500 text-sm"> {errors.former_name} </p>}
                                                </div>
                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="mob_no" > Mobile Number: <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        onChange={handleChange}
                                                        value={formData.personal_information.mb_no}
                                                        type="tel"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="mb_no"
                                                        id="mob_no"
                                                        minLength="10"
                                                        maxLength="10"
                                                        ref={(el) => (refs.current["mob_no"] = el)} // Attach ref here

                                                    />
                                                    {errors.mb_no && <p className="text-red-500 text-sm" > {errors.mb_no} </p>}
                                                </div>
                                            </div>
                                            < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >

                                                <div className="form-group" >
                                                    <label className='text-sm' htmlFor="father_name" > Father's Name: <span className="text-red-500 text-lg">*</span></label>
                                                    < input
                                                        onChange={handleChange}
                                                        value={formData.personal_information.father_name}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="father_name"
                                                        name="father_name"
                                                        ref={(el) => (refs.current["father_name"] = el)} // Attach ref here

                                                    />
                                                    {errors.father_name && <p className="text-red-500 text-sm" > {errors.father_name} </p>}
                                                </div>
                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="husband_name" > Spouse's Name</label>
                                                    < input
                                                        onChange={handleChange}
                                                        value={formData.personal_information.husband_name}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        id="husband_name"
                                                        ref={(el) => (refs.current["husband_name"] = el)} // Attach ref here
                                                        name="husband_name"
                                                    />
                                                </div>

                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="dob" > DOB: <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        onChange={handleChange}
                                                        value={formData.personal_information.dob}
                                                        type="date"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="dob"
                                                        id="dob"
                                                        ref={(el) => (refs.current["dob"] = el)} // Attach ref here

                                                    />
                                                    {errors.dob && <p className="text-red-500 text-sm" > {errors.dob} </p>}
                                                </div>
                                            </div>
                                            < div className="grid grid-cols-1 md:grid-cols-1 gap-4" >

                                                <div className="form-group my-4" >
                                                    <label className='text-sm' htmlFor="gender" >
                                                        Gender: <span className="text-red-500 text-lg" >* </span>
                                                    </label>
                                                    < select
                                                        onChange={handleChange}
                                                        value={formData.personal_information.gender}
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="gender"
                                                        id="gender"
                                                        ref={(el) => (refs.current["gender"] = el)} // Attach ref here
                                                    >
                                                        <option value="" disabled >
                                                            Select gender
                                                        </option>
                                                        < option value="male" > Male </option>
                                                        < option value="female" > Female </option>
                                                        < option value="other" > Other </option>
                                                    </select>
                                                    {errors.gender && <p className="text-red-500 text-sm" > {errors.gender} </p>}
                                                </div>
                                            </div>
                                            < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >

                                                <div className='form-group' >
                                                    <label className='text-sm' > Aadhar card No </label>
                                                    < input
                                                        type="text"
                                                        name="aadhar_card_number"
                                                        value={formData.personal_information.aadhar_card_number}
                                                        onChange={handleChange}

                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />

                                                </div>
                                                {
                                                    status === 1 && (
                                                        <>
                                                            <div className='form-group' >
                                                                <label className='text-sm' > Name as per Aadhar card < span className='text-red-500 text-lg' >* </span></label >
                                                                <input
                                                                    type="text"
                                                                    name="aadhar_card_name"
                                                                    value={formData.personal_information.aadhar_card_name}
                                                                    onChange={handleChange}
                                                                    ref={(el) => (refs.current["aadhar_card_name"] = el)
                                                                    } // Attach ref here

                                                                    className="form-control border rounded w-full p-2 mt-2"
                                                                />
                                                                {errors.aadhar_card_name && <p className="text-red-500 text-sm"> {errors.aadhar_card_name} </p>}

                                                            </div>
                                                            < div className='form-group' >
                                                                <label className='text-sm' > Aadhar Card Image < span className='text-red-500 text-lg' >* </span></label >
                                                                <input
                                                                    type="file"
                                                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types

                                                                    name="aadhar_card_image"
                                                                    onChange={(e) => handleFileChange("applications_aadhar_card_image", "aadhar_card_image", e)}
                                                                    className="form-control border rounded w-full p-1 mt-2"
                                                                    ref={(el) => (refs.current["aadhar_card_image"] = el)} // Attach ref here


                                                                />
                                                                {errors.aadhar_card_image && <p className="text-red-500 text-sm" > {errors.aadhar_card_image} </p>}
                                                                <p className="text-gray-500 text-sm mt-2" >
                                                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                                </p>
                                                            </div>

                                                        </>
                                                    )}
                                                <div className='form-group' >
                                                    <label className='text-sm' > Pan card No </label>
                                                    < input
                                                        type="text"
                                                        name="pan_card_number"
                                                        value={formData.personal_information.pan_card_number}
                                                        onChange={handleChange}

                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />

                                                </div>

                                                {
                                                    status === 1 && (
                                                        <>

                                                            <div className='form-group' >
                                                                <label className='text-sm' > Name as per Pan Card < span className='text-red-500 text-lg' >* </span></label >
                                                                <input
                                                                    type="text"
                                                                    name="pan_card_name"
                                                                    value={formData.personal_information.pan_card_name}
                                                                    onChange={handleChange}
                                                                    ref={(el) => (refs.current["pan_card_name"] = el)
                                                                    } // Attach ref here

                                                                    className="form-control border rounded w-full p-2 mt-2"
                                                                />
                                                                {errors.pan_card_name && <p className="text-red-500 text-sm"> {errors.pan_card_name} </p>}
                                                            </div>
                                                        </>
                                                    )}
                                                {
                                                    status === 1 && (
                                                        <div className='form-group' >
                                                            <label className='text-sm' > Pan Card Image < span className='text-red-500 text-lg' >* </span></label >
                                                            <input
                                                                type="file"
                                                                accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types

                                                                name="pan_card_image"
                                                                onChange={(e) => handleFileChange("applications_pan_card_image", "pan_card_image", e)
                                                                }
                                                                className="form-control border rounded w-full p-1 mt-2"
                                                                ref={(el) => (refs.current["pan_card_image"] = el)} // Attach ref here


                                                            />
                                                            {errors.pan_card_image && <p className="text-red-500 text-sm" > {errors.pan_card_image} </p>}
                                                            <p className="text-gray-500 text-sm mt-2" >
                                                                Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                            </p>
                                                        </div>
                                                    )}

                                                {
                                                    status == 0 && (
                                                        <div className="form-group" >
                                                            <label className='text-sm' > Social Security Number(if applicable): </label>
                                                            < input
                                                                onChange={handleChange}
                                                                value={formData.ssn_number}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                name="ssn_number"

                                                            />
                                                        </div>
                                                    )
                                                }
                                            </div>
                                            < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
                                                <div className="form-group" >
                                                    <label className='text-sm' htmlFor="nationality" > Nationality: <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        onChange={handleChange}
                                                        value={formData.personal_information.nationality}
                                                        type="text"
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="nationality"
                                                        id="nationality"
                                                        ref={(el) => (refs.current["nationality"] = el)} // Attach ref here

                                                    />
                                                    {errors.nationality && <p className="text-red-500 text-sm" > {errors.nationality} </p>}
                                                </div>
                                                < div className="form-group" >
                                                    <label className='text-sm' htmlFor="marital_status" > Marital Status: <span className="text-red-500 text-lg" >* </span></label >
                                                    <select
                                                        ref={(el) => (refs.current["marital_status"] = el)}
                                                        className="form-control border rounded w-full p-2 mt-2"
                                                        name="marital_status"
                                                        id="marital_status"
                                                        onChange={handleChange}

                                                    >
                                                        <option value="" > SELECT Marital STATUS </option>
                                                        < option value="Dont wish to disclose" > Don't wish to disclose</option>
                                                        < option value="Single" > Single </option>
                                                        < option value="Married" > Married </option>
                                                        < option value="Widowed" > Widowed </option>
                                                        < option value="Divorced" > Divorced </option>
                                                        < option value="Separated" > Separated </option>
                                                    </select>
                                                    {errors.marital_status && <p className="text-red-500 text-sm" > {errors.marital_status} </p>}
                                                </div>
                                            </div>
                                            < div className=' border-gray-300 rounded-md mt-5 hover:transition-shadow duration-300' >

                                                <h3 className='md:text-start md:mb-2 text-start md:text-2xl text-sm font-bold my-5' > Current Address </h3>
                                                < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >

                                                    <div className="form-group" >
                                                        <label className='text-sm' htmlFor="full_address" > permanent Address < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            onChange={handleChange}
                                                            value={formData.personal_information.full_address}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="full_address"
                                                            name="full_address"
                                                            ref={(el) => (refs.current["full_address"] = el)} // Attach ref here

                                                        />
                                                        {errors.full_address && <p className="text-red-500 text-sm" > {errors.full_address} </p>}
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' > Current Address < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            onChange={handleChange}
                                                            value={formData.personal_information.current_address}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address"
                                                            name="current_address"
                                                            ref={(el) => (refs.current["current_address"] = el)} // Attach ref here

                                                        />
                                                        {errors.current_address && <p className="text-red-500 text-sm" > {errors.current_address} </p>}
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="pin_code" > Pin Code < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            onChange={handleChange}
                                                            value={formData.personal_information.pin_code}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="pin_code"
                                                            name="pin_code"
                                                            ref={(el) => (refs.current["pin_code"] = el)} // Attach ref here

                                                        />
                                                        {errors.pin_code && <p className="text-red-500 text-sm" > {errors.pin_code} </p>}
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="current_address_landline_number" > Mobile Number < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            onChange={handleChange}
                                                            value={formData.personal_information.current_address_landline_number}
                                                            type="number"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address_landline_number"
                                                            name="current_address_landline_number"
                                                            ref={(el) => (refs.current["current_address_landline_number"] = el)} // Attach ref here

                                                        />
                                                        {errors.current_address_landline_number && <p className="text-red-500 text-sm" > {errors.current_address_landline_number} </p>}
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="current_address_state" > Current State < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            onChange={handleChange}
                                                            value={formData.personal_information.current_address_state}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address_state"
                                                            name="current_address_state"
                                                            ref={(el) => (refs.current["current_address_state"] = el)} // Attach ref here

                                                        />
                                                        {errors.current_address_state && <p className="text-red-500 text-sm" > {errors.current_address_state} </p>}
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="current_prominent_landmark" > Current Landmark < span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            onChange={handleChange}
                                                            value={formData.personal_information.current_prominent_landmark}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_prominent_landmark"
                                                            name="current_prominent_landmark"
                                                            ref={(el) => (refs.current["current_prominent_landmark"] = el)} // Attach ref here

                                                        />
                                                        {errors.current_prominent_landmark && <p className="text-red-500 text-sm" > {errors.current_prominent_landmark} </p>}
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="current_address_stay_to" > Current Address Stay No.< span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            onChange={handleChange}
                                                            value={formData.personal_information.current_address_stay_to}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address_stay_to"
                                                            name="current_address_stay_to"
                                                            ref={(el) => (refs.current["current_address_stay_to"] = el)} // Attach ref here

                                                        />
                                                        {errors.current_address_stay_to && <p className="text-red-500 text-sm" > {errors.current_address_stay_to} </p>}
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="nearest_police_station" > Nearest Police Station.</label>
                                                        < input
                                                            onChange={handleChange}
                                                            value={formData.personal_information.nearest_police_station}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="nearest_police_station"
                                                            name="nearest_police_station"
                                                            ref={(el) => (refs.current["nearest_police_station"] = el)} // Attach ref here

                                                        />
                                                    </div>
                                                </div>
                                            </div>




                                        </div>
                                        {
                                            status === 1 && (
                                                <>
                                                    <div className='border border-gray-300 p-6 rounded-md mt-5 hover:transition-shadow duration-300' >

                                                        <label className='text-sm' > Blood Group </label>
                                                        < div className='form-group' >
                                                            <input
                                                                type="text"
                                                                name="blood_group"
                                                                value={formData.personal_information.blood_group}
                                                                onChange={handleChange}
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
                                                                        value={formData.personal_information.emergency_details_name}
                                                                        onChange={handleChange}
                                                                        ref={(el) => (refs.current["emergency_details_name"] = el)
                                                                        } // Attach ref here

                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                    {errors.emergency_details_name && <p className="text-red-500 text-sm"> {errors.emergency_details_name} </p>}
                                                                </div>
                                                                < div className='form-group' >
                                                                    <label className='text-sm' > Relation < span className='text-red-500 text-lg' >* </span></label >
                                                                    <input
                                                                        type="text"
                                                                        name="emergency_details_relation"
                                                                        value={formData.personal_information.emergency_details_relation}
                                                                        onChange={handleChange}
                                                                        ref={(el) => (refs.current["emergency_details_relation"] = el)} // Attach ref here

                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                    {errors.emergency_details_relation && <p className="text-red-500 text-sm"> {errors.emergency_details_relation} </p>}
                                                                </div>
                                                                < div className='form-group' >
                                                                    <label className='text-sm' > Contact Number < span className='text-red-500 text-lg' >* </span></label >
                                                                    <input
                                                                        type="text"
                                                                        name="emergency_details_contact_number"
                                                                        value={formData.personal_information.emergency_details_contact_number}
                                                                        onChange={handleChange}
                                                                        ref={(el) => (refs.current["emergency_details_contact_number"] = el)} // Attach ref here

                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                    {errors.emergency_details_contact_number && <p className="text-red-500 text-sm"> {errors.emergency_details_contact_number} </p>}
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
                                                                        value={formData.personal_information.insurance_details_name}
                                                                        onChange={handleChange}
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                                < div className='form-group' >
                                                                    <label className='text-sm' > Nominee Relationship
                                                                    </label>
                                                                    < input
                                                                        type="text"
                                                                        name="insurance_details_nominee_relation"
                                                                        value={formData.personal_information.insurance_details_nominee_relation}
                                                                        onChange={handleChange}
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                                < div className='form-group' >
                                                                    <lalbel>Nominee Date of Birth
                                                                    </lalbel>
                                                                    < input
                                                                        type="date"
                                                                        name="insurance_details_nominee_dob"
                                                                        value={formData.personal_information.insurance_details_nominee_dob}
                                                                        onChange={handleChange}
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                                < div className='form-group' >
                                                                    <label className='text-sm' > Contact No.
                                                                    </label>
                                                                    < input
                                                                        type="text"
                                                                        name="insurance_details_contact_number"
                                                                        value={formData.personal_information.insurance_details_contact_number}
                                                                        onChange={handleChange}
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
                                                                    onChange={handleChange}
                                                                    className="form-control border rounded p-2"
                                                                />
                                                                <label className='text-sm' > Yes </label>
                                                            </div>
                                                            < div className='form-group pt-2 flex gap-2' >
                                                                <input
                                                                    type="radio"
                                                                    name="food_coupon"
                                                                    value="No"
                                                                    onChange={handleChange}
                                                                    className="form-control border rounded p-2"
                                                                />
                                                                <label className='text-sm' > No </label>
                                                            </div>
                                                        </div>
                                                        {errors.food_coupon && <p className="text-red-500 text-sm" > {errors.food_coupon} </p>}


                                                        <p className='text-left ' > Food coupons are vouchers or digital meal cards given to employees to purchase food and non - alcoholic beverages.Specific amount as per your requirement would get deducted from your Basic Pay.These are tax free, considered as a non - monetary benefit and are exempt from tax up to a specified limit.</p>
                                                    </div>
                                                </>
                                            )}





                                    </div>
                                )}

                                {/* Render Service Tabs Dynamically */}
                                {serviceData.map((service, serviceIndex) => {
                                    if (activeTab === serviceIndex + 1) {
                                        return (
                                            <div key={serviceIndex} className="p-6" >
                                                <h2 className="text-2xl font-bold mb-6" > {service.heading} </h2>
                                                < div className="space-y-6" id="servicesForm" >
                                                    {
                                                        service.rows.map((row, rowIndex) => {
                                                            if (hiddenRows[`${serviceIndex}-${rowIndex}`]) {
                                                                return null;
                                                            }

                                                            return (
                                                                <div key={rowIndex} >
                                                                    {
                                                                        row.row_heading && (
                                                                            <h3 className="text-sm font-semibold mb-4"> {row.row_heading} </h3>
                                                                        )
                                                                    }

                                                                    {/* Form inputs for the row */}
                                                                    <div className="space-y-4" >
                                                                        <div className={`grid grid-cols-${row.inputs.length === 1 ? '1' : row.inputs.length === 2 ? '2' : '3'} gap-3`}>
                                                                            {
                                                                                row.inputs.map((input, inputIndex) => {
                                                                                    // Determine if the input is a checkbox
                                                                                    const isCheckbox = input.type === 'checkbox';
                                                                                    const isDoneCheckbox = isCheckbox && (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'));
                                                                                    const isChecked = checkedCheckboxes[input.name];

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
                                                                                        <div key={inputIndex} className="flex flex-col space-y-2" >
                                                                                            <label className="text-sm block font-medium mb-2 text-gray-700 capitalize" >
                                                                                                {input.label.replace(/[\/\\]/g, '')}
                                                                                                {input.required && <span className="text-red-500" >* </span>}
                                                                                            </label>

                                                                                            {/* Various input types */}
                                                                                            {
                                                                                                input.type === 'input' && (
                                                                                                    <>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            name={input.name}
                                                                                                            value={annexureData[service.db_table]?.[input.name] || ''}  // Correctly bind value to state
                                                                                                            className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                            onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)}
                                                                                                        />

                                                                                                        {errors[input.name] && <p className="text-red-500 text-sm" > {errors[input.name]} </p>}
                                                                                                    </>
                                                                                                )
                                                                                            }
                                                                                            {
                                                                                                input.type === 'textarea' && (
                                                                                                    <>
                                                                                                        <textarea
                                                                                                            name={input.name}
                                                                                                            rows={1}
                                                                                                            value={annexureData[service.db_table]?.[input.name] || ''}  // Correctly bind value to state

                                                                                                            className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                            onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)
                                                                                                            }

                                                                                                        />
                                                                                                        {errors[input.name] && <p className="text-red-500 text-sm" > {errors[input.name]} </p>}
                                                                                                    </>
                                                                                                )
                                                                                            }
                                                                                            {
                                                                                                input.type === 'datepicker' && (
                                                                                                    <>
                                                                                                        <input
                                                                                                            type="date"
                                                                                                            name={input.name}
                                                                                                            value={annexureData[service.db_table]?.[input.name] || ''}  // Correctly bind value to state

                                                                                                            className="mt-3 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                            onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)
                                                                                                            }
                                                                                                        />
                                                                                                        {errors[input.name] && <p className="text-red-500 text-sm" > {errors[input.name]} </p>}

                                                                                                    </>
                                                                                                )}
                                                                                            {
                                                                                                input.type === 'number' && (
                                                                                                    <>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            name={input.name}
                                                                                                            value={annexureData[service.db_table]?.[input.name] || ''}  // Correctly bind value to state

                                                                                                            className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                            onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)
                                                                                                            }
                                                                                                        />
                                                                                                        {errors[input.name] && <p className="text-red-500 text-sm" > {errors[input.name]} </p>}
                                                                                                    </>

                                                                                                )}
                                                                                            {
                                                                                                input.type === 'email' && (
                                                                                                    <>
                                                                                                        <input
                                                                                                            type="email"
                                                                                                            name={input.name}
                                                                                                            value={annexureData[service.db_table]?.[input.name] || ''}  // Correctly bind value to state

                                                                                                            className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                            onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)
                                                                                                            }
                                                                                                        />
                                                                                                        {errors[input.name] && <p className="text-red-500 text-sm" > {errors[input.name]} </p>}

                                                                                                    </>
                                                                                                )}
                                                                                            {
                                                                                                input.type === 'select' && (
                                                                                                    <>
                                                                                                        <select
                                                                                                            name={input.name}
                                                                                                            value={annexureData[service.db_table]?.[input.name] || ''}  // Correctly bind value to state

                                                                                                            className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                            onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)
                                                                                                            }
                                                                                                        >
                                                                                                            {
                                                                                                                Object.entries(input.options).map(([key, option], optionIndex) => (
                                                                                                                    <option key={optionIndex} value={key} >
                                                                                                                        {option}
                                                                                                                    </option>
                                                                                                                ))
                                                                                                            }
                                                                                                        </select>
                                                                                                        {errors[input.name] && <p className="text-red-500 text-sm" > {errors[input.name]} </p>}
                                                                                                    </>

                                                                                                )}
                                                                                            {
                                                                                                input.type === 'file' && (
                                                                                                    <>
                                                                                                        <input
                                                                                                            type="file"
                                                                                                            name={input.name}
                                                                                                            multiple
                                                                                                            accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                                                                                                            className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none"
                                                                                                            onChange={(e) => handleFileChange(service.db_table + '_' + input.name, input.name, e)}
                                                                                                        />
                                                                                                        {errors[input.name] && <p className="text-red-500 text-sm">{errors[input.name]}</p>}
                                                                                                    </>
                                                                                                )
                                                                                            }

                                                                                            {
                                                                                                input.type === 'checkbox' && (
                                                                                                    <div className="flex items-center space-x-3">
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            name={input.name}
                                                                                                            value={annexureData[service.db_table]?.[input.name] || ''}  // Correctly bind value to state

                                                                                                            className="h-5 w-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                                                                            onChange={(e) => {
                                                                                                                handleCheckboxChange(input.name, e.target.checked);
                                                                                                                toggleRowsVisibility(serviceIndex, rowIndex, e.target.checked); // Optional for any additional row toggle logic
                                                                                                            }}
                                                                                                        />
                                                                                                        <span className="text-sm text-gray-700">{input.label}</span>
                                                                                                    </div>
                                                                                                )
                                                                                            }

                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}

                                {
                                    activeTab === serviceData.length + 1 && (


                                        <div>
                                            <div className='mb-6  p-4 rounded-md border shadow-md bg-white mt-8' >
                                                <h4 className="md:text-start text-start md:text-xl text-sm my-6 font-bold" > Declaration and Authorization </h4>
                                                < div className="mb-6" >
                                                    <p className='text-sm' >
                                                        I hereby authorize GoldQuest Global HR Services Private Limited and its representative to verify information provided in my application for employment and this employee background verification form, and to conduct enquiries as may be necessary, at the company’s discretion.I authorize all persons who may have information relevant to this enquiry to disclose it to GoldQuest Global HR Services Pvt Ltd or its representative.I release all persons from liability on account of such disclosure.
                                                        I confirm that the above information is correct to the best of my knowledge.I agree that in the event of my obtaining employment, my probationary appointment, confirmation as well as continued employment in the services of the company are subject to clearance of medical test and background verification check done by the company.
                                                    </p>
                                                </div>

                                                < div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6" >
                                                    <div className="form-group" >
                                                        <label className='text-sm' > Attach signature: <span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            onChange={(e) => handleFileChange("applications_signature", "signature", e)}
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types

                                                            className="form-control border rounded w-full p-1 mt-2 bg-white mb-0"
                                                            name="signature"
                                                            id="signature"

                                                        />
                                                        {errors.signature && <p className="text-red-500 text-sm"> {errors.signature} </p>}
                                                        < p className="text-gray-500 text-sm mt-2" >
                                                            Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                        </p>

                                                    </div>

                                                    < div className="form-group" >
                                                        <label className='text-sm' > Name </label>
                                                        < input
                                                            onChange={handleChange}
                                                            value={formData.name_declaration}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                            name="name_declaration"

                                                        />
                                                    </div>


                                                    < div className="form-group" >
                                                        <label className='text-sm' > Date < span className='text-red-500' >* </span></label >
                                                        <input
                                                            onChange={handleChange}
                                                            value={formData.personal_information.declaration_date}
                                                            type="date"
                                                            className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                            name="declaration_date"
                                                        />
                                                        {errors.declaration_date && <p className="text-red-500 text-sm"> {errors.declaration_date} </p>}

                                                    </div>
                                                </div>
                                            </div>

                                            < h5 className="md:text-start text-start text-lg my-6 font-bold" > Documents(Mandatory) </h5>

                                            < div className="grid grid-cols-1 bg-white shadow-md  md:grid-cols-3 gap-4 pt-4  md:p-4 p-1 rounded-md border" >
                                                <div className="p-4" >
                                                    <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                                        <FaGraduationCap className="mr-3" />
                                                        Education
                                                    </h6>
                                                    < p className='text-sm' > Photocopy of degree certificate and final mark sheet of all examinations.</p>
                                                </div>

                                                < div className="p-4" >
                                                    <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                                        <FaBriefcase className="mr-3" />
                                                        Employment
                                                    </h6>
                                                    < p className='text-sm' > Photocopy of relieving / experience letter for each employer mentioned in the form.</p>
                                                </div>

                                                < div className="p-4" >
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
                                    )
                                }
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-4 mt-6">
                                <button
                                    onClick={(e) => handleSubmit(0, e)} // Pass 0 when Save is clicked
                                    className="px-6 py-2 bg-[#3e76a5] text-white rounded-md hover:bg-[#3e76a5]"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={(e) => {
                                        if (activeTab === serviceData.length + 1) {
                                            handleSubmit(1, e); // Pass 1 when Submit is clicked (on the last tab)
                                        } else {
                                            handleNext(); // Otherwise, move to the next tab
                                        }
                                    }}
                                    className={`px-6 py-2 rounded-md ${isFormFilled
                                        ? "text-white bg-blue-500 hover:bg-blue-600"
                                        : "text-gray-500 bg-blue-400 cursor-not-allowed"
                                        }`}
                                    disabled={!isFormFilled} // Disable button if form is not filled
                                >
                                    {activeTab === serviceData.length + 1 ? 'Submit' : 'Next'} {/* Change button text based on the active tab */}
                                </button>
                            </div>

                        </div>
                    </div>
                )

            }

            {
                !apiStatus && (
                    <div className="error-box">
                        Application not found
                    </div>
                )
            }
        </>

    );
};

export default DemoBgForm;
