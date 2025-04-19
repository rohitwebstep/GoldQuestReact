import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { MdOutlineArrowRightAlt } from "react-icons/md";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // Correct path for newer Swiper versions

import axios from 'axios';
import LogoBgv from '../Images/LogoBgv.jpg'
import { FaGraduationCap, FaBriefcase, FaIdCard } from 'react-icons/fa';
import { FaUser, FaCog, FaCheckCircle } from 'react-icons/fa'

const BackgroundForm = () => {
    const [isSameAsPermanent, setIsSameAsPermanent] = useState(false);
    const [gaps, setGaps] = useState({});
    const [employGaps, setEmployGaps] = useState({});

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false)
    const [conditionHtml, setConditionHtml] = useState("");
    const [applicationData, setApplicationData] = useState([]);
    const [initialAnnexureData, setInitialAnnexureData] = useState({
        gap_validation: {
            highest_education_gap: '',
            years_of_experience_gap: '',
            no_of_employment: 0,
            i_am_fresher:'',

        }
    });

    const createEmploymentFields = (noOfEmployments, fieldValue) => {
        let employmentFieldsData = fieldValue.employment_fields;

        // Check if it's a string (i.e., it's been stringified previously) and parse it
        if (typeof employmentFieldsData === 'string') {
            employmentFieldsData = JSON.parse(employmentFieldsData);
        } else {
        }

        const employmentFields = {}; // Initialize the employmentFields object to store all employment data

        // Dynamically structure the data like: employment_1, employment_2, etc.
        for (let i = 1; i <= noOfEmployments; i++) {

            const employmentData = employmentFieldsData[`employment_${i}`] || {};

            employmentFields[`employment_${i}`] = {
                [`employment_type_gap`]: employmentData[`employment_type_gap`] || '',
                [`employment_start_date_gap`]: employmentData[`employment_start_date_gap`] || '',
                [`employment_end_date_gap`]: employmentData[`employment_end_date_gap`] || '',
            };

        }

        return employmentFields;
    };


    function isImage(fileUrl) {
        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        return validImageExtensions.some(ext => fileUrl.toLowerCase().endsWith(ext));
    }

    const addCoressPondencePhd = () => {


        // Clone the current state
        let updatedData = { ...annexureData };

        // Ensure gap_validation exists
        if (!updatedData.gap_validation) {
            updatedData.gap_validation = {};
        }

        // Ensure education_fields exists and is an object
        if (!updatedData.gap_validation.education_fields) {
            updatedData.gap_validation.education_fields = {};
        } else if (typeof updatedData.gap_validation.education_fields !== 'object') {
            console.error('education_fields is not an object, resetting it to an empty object');
            updatedData.gap_validation.education_fields = {}; // Reset it to an empty object if it's not
        }

        const educationFields = updatedData.gap_validation.education_fields;

        // Get existing phd_corespondence keys
        const phdKeys = Object.keys(educationFields);
        const phdCorrespondenceKeys = phdKeys.filter(key => key.startsWith('phd_corespondence_'));

        let newKey;
        if (phdCorrespondenceKeys.length === 0) {
            newKey = 'phd_corespondence_1';
        } else {
            // Extract numeric values, find max, and increment
            const lastNumber = Math.max(...phdCorrespondenceKeys.map(key => parseInt(key.split('_')[2], 10)));
            newKey = `phd_corespondence_${lastNumber + 1}`;
        }


        updatedData.gap_validation.education_fields[newKey] = {};

        // Update state to trigger re-render
        setAnnexureData({ ...updatedData });

    };


    const addCoressPondencePostGraduation = () => {


        // Clone the current state
        let updatedData = { ...annexureData };

        // Ensure gap_validation exists
        if (!updatedData.gap_validation) {
            updatedData.gap_validation = {};
        }

        // Ensure education_fields exists and is an object
        if (!updatedData.gap_validation.education_fields) {
            updatedData.gap_validation.education_fields = {};
        } else if (typeof updatedData.gap_validation.education_fields !== 'object') {
            console.error('education_fields is not an object, resetting it to an empty object');
            updatedData.gap_validation.education_fields = {}; // Reset to an object if it's not
        }

        const educationFields = updatedData.gap_validation.education_fields;

        // Get existing post_graduation_corespondence keys
        const postGraduationKeys = Object.keys(educationFields);
        const postGraduationCorrespondenceKeys = postGraduationKeys.filter(key => key.startsWith('post_graduation_corespondence_'));

        let newKey;
        if (postGraduationCorrespondenceKeys.length === 0) {
            newKey = 'post_graduation_corespondence_1';
        } else {
            // Extract numeric values, find max, and increment
            const lastNumber = Math.max(...postGraduationCorrespondenceKeys.map(key => parseInt(key.split('_')[3], 10)));
            newKey = `post_graduation_corespondence_${lastNumber + 1}`;
        }

        // Log the new key

        // Add new entry to education_fields
        updatedData.gap_validation.education_fields[newKey] = {};

        // Update state to trigger re-render
        setAnnexureData({ ...updatedData });

    };
    const addCoressPondenceGraduation = () => {

        // Clone the current state
        let updatedData = { ...annexureData };

        // Ensure gap_validation exists
        if (!updatedData.gap_validation) {
            updatedData.gap_validation = {};
        }

        // Ensure education_fields exists and is an object
        if (!updatedData.gap_validation.education_fields) {
            updatedData.gap_validation.education_fields = {};
        } else if (typeof updatedData.gap_validation.education_fields !== 'object') {
            console.error('education_fields is not an object, resetting it to an empty object');
            updatedData.gap_validation.education_fields = {}; // Reset to an object if it's not
        }

        const educationFields = updatedData.gap_validation.education_fields;

        // Get existing post_graduation_corespondence keys
        const postGraduationKeys = Object.keys(educationFields);

        const postGraduationCorrespondenceKeys = postGraduationKeys.filter(key => key.startsWith('graduation_corespondence_'));

        let newKey;
        if (postGraduationCorrespondenceKeys.length === 0) {
            newKey = 'graduation_corespondence_1';
        } else {
            // Extract numeric values, find max, and increment
            const lastNumber = Math.max(...postGraduationCorrespondenceKeys.map(key => parseInt(key.split('_')[2], 10)));
            newKey = `graduation_corespondence_${lastNumber + 1}`;
        }


        updatedData.gap_validation.education_fields[newKey] = {};

        // Update state to trigger re-render
        setAnnexureData({ ...updatedData });

    };

    const addCoressPondenceSeniorSecondary = () => {

        // Clone the current state
        let updatedData = { ...annexureData };

        // Ensure gap_validation exists
        if (!updatedData.gap_validation) {
            updatedData.gap_validation = {};
        }

        // Ensure education_fields exists and is an object
        if (!updatedData.gap_validation.education_fields) {
            updatedData.gap_validation.education_fields = {};
        } else if (typeof updatedData.gap_validation.education_fields !== 'object') {
            console.error('education_fields is not an object, resetting it to an empty object');
            updatedData.gap_validation.education_fields = {}; // Reset to an object if it's not
        }

        const educationFields = updatedData.gap_validation.education_fields;

        // Get existing post_graduation_corespondence keys
        const postGraduationKeys = Object.keys(educationFields);
        const postGraduationCorrespondenceKeys = postGraduationKeys.filter(key => key.startsWith('senior_secondary_corespondence_'));

        let newKey;
        if (postGraduationCorrespondenceKeys.length === 0) {
            newKey = 'senior_secondary_corespondence_1';
        } else {
            // Extract numeric values, find max, and increment
            const lastNumber = Math.max(...postGraduationCorrespondenceKeys.map(key => parseInt(key.split('_')[3], 10)));
            newKey = `senior_secondary_corespondence_${lastNumber + 1}`;
        }

        // Log the new key

        // Add new entry to education_fields
        updatedData.gap_validation.education_fields[newKey] = {};

        // Update state to trigger re-render
        setAnnexureData({ ...updatedData });

    };
    const addCoressPondenceSecondary = () => {

        // Clone the current state
        let updatedData = { ...annexureData };

        // Ensure gap_validation exists
        if (!updatedData.gap_validation) {
            updatedData.gap_validation = {};
        }

        // Ensure education_fields exists and is an object
        if (!updatedData.gap_validation.education_fields) {
            updatedData.gap_validation.education_fields = {};
        } else if (typeof updatedData.gap_validation.education_fields !== 'object') {
            updatedData.gap_validation.education_fields = {}; // Reset to an object if it's not
        }

        const educationFields = updatedData.gap_validation.education_fields;

        // Get existing post_graduation_corespondence keys
        const postGraduationKeys = Object.keys(educationFields);
        const postGraduationCorrespondenceKeys = postGraduationKeys.filter(key => key.startsWith('secondary_corespondence_'));

        let newKey;
        if (postGraduationCorrespondenceKeys.length === 0) {
            newKey = 'secondary_corespondence_1';
        } else {
            // Extract numeric values, find max, and increment
            const lastNumber = Math.max(...postGraduationCorrespondenceKeys.map(key => parseInt(key.split('_')[2], 10)));
            newKey = `secondary_corespondence_${lastNumber + 1}`;
        }

        // Log the new key

        // Add new entry to education_fields
        updatedData.gap_validation.education_fields[newKey] = {};

        // Update state to trigger re-render
        setAnnexureData({ ...updatedData });

    };

    const updateEmploymentFields = (noOfEmployments, fieldValue) => {

        // Generate new employment fields based on the provided number of employments
        const allEmploymentFields = createEmploymentFields(noOfEmployments, fieldValue);


        // Create a copy of the current annexureData
        const updatedAnnexureData = { ...annexureData };

        // Check if gap_validation exists before modifying
        if (updatedAnnexureData.gap_validation) {
            // Delete the existing employment_fields key
            delete updatedAnnexureData.gap_validation.employment_fields;
        } else {
            // If gap_validation doesn't exist, initialize it
            updatedAnnexureData.gap_validation = {};
        }

        // Add the new employment_fields data
        updatedAnnexureData.gap_validation.highest_education_gap = fieldValue.highest_education_gap;
        updatedAnnexureData.gap_validation.no_of_employment = fieldValue.no_of_employment;
        updatedAnnexureData.gap_validation.years_of_experience_gap = fieldValue.years_of_experience_gap;
        updatedAnnexureData.gap_validation.i_am_fresher = fieldValue.i_am_fresher;
        updatedAnnexureData.gap_validation.education_fields = JSON.parse(fieldValue.education_fields);
        updatedAnnexureData.gap_validation.employment_fields = allEmploymentFields;

        // Set state with updated data
        setAnnexureData(updatedAnnexureData);

        return updatedAnnexureData; // This can be used for further handling if needed
    };





    const [annexureData, setAnnexureData] = useState(initialAnnexureData);


    const handleServiceChange = (tableName, fieldName, value) => {
        setAnnexureData((prevData) => {
            const updatedData = {
                ...prevData,
                [tableName]: {
                    ...prevData[tableName],
                    [fieldName]: value
                }
            };
            return updatedData;
        });
        validateDate();
        calculateGaps();
    };
    const handleEmploymentGapChange = (tableName, group, type, fieldName, value) => {


        setAnnexureData((prevData) => {
            const updatedData = {
                ...prevData,
                [tableName]: {
                    ...prevData[tableName], // Keep other properties
                    [group]: {
                        ...prevData[tableName]?.[group], // Preserve group data
                        [type]: {
                            ...prevData[tableName]?.[group]?.[type], // Preserve type data
                            [fieldName]: value // Correctly replace the value
                        }
                    }
                }
            };

            return updatedData;
        });

        validateDate();
        calculateGaps();
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
        const secondaryEndDate = annexureData?.gap_validation?.education_fields?.secondary?.secondary_end_date_gap || null;
        const seniorSecondaryStartDate = annexureData?.gap_validation?.education_fields?.senior_secondary?.senior_secondary_start_date_gap || null;
        const seniorSecondaryEndDate = annexureData?.gap_validation?.education_fields?.senior_secondary?.senior_secondary_end_date_gap || null;
        const graduationStartDate = annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_start_date_gap || null;
        const graduationEndDate = annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_end_date_gap || null;
        const postGraduationStartDate = annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_start_date_gap || null;
        const postGraduationEndDate = annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_end_date_gap || null;
        const phdStartDate = annexureData?.gap_validation?.education_fields?.phd_1?.phd_start_date_gap || null;

        const gapSecToSrSec = calculateDateGap(secondaryEndDate, seniorSecondaryStartDate);
        const gapSrSecToGrad = calculateDateGap(seniorSecondaryEndDate, graduationStartDate);
        const gapGradToPostGrad = calculateDateGap(graduationEndDate, postGraduationStartDate);
        const gapPostGradToPhd = calculateDateGap(postGraduationEndDate, phdStartDate);

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


            const employmentValues = annexureData?.gap_validation?.employment_fields;

            if (!employmentValues) {
                return { employmentStartDates, employmentEndDates };
            }

            while (true) {
                const employmentKey = `employment_${i}`;
                const employmentData = employmentValues[employmentKey];

                if (!employmentData) {
                    break;
                }

                // Define keys
                const startKey = `employment_start_date_gap`;
                const endKey = `employment_end_date_gap`;


                // Check if start or end date exists
                const hasStartDate = startKey in employmentData;
                const hasEndDate = endKey in employmentData;


                if (!hasStartDate && !hasEndDate) {
                    console.warn(`%cNo start or end date found for ${employmentKey}, stopping loop.`, 'color: orange;');
                    break;
                }

                // Push values if they exist
                if (hasStartDate) {
                    employmentStartDates.push({
                        name: startKey,
                        value: employmentData[startKey]
                    });
                }
                if (hasEndDate) {
                    employmentEndDates.push({
                        name: endKey,
                        value: employmentData[endKey]
                    });
                }

                i++; // Move to next employment record
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

            // Log differences

            return differences;
        }

        // Get differences
        const dateDifferences = getEmploymentDateDifferences(employmentStartDates, employmentEndDates);

        // Log final employment gaps

        setEmployGaps(dateDifferences);
    };



    useEffect(() => {
        if (!annexureData) {
            setAnnexureData(initialAnnexureData);
        }
        validateDate();
    }, [annexureData]);


    const [activeTab, setActiveTab] = useState(0); // Tracks the active tab (0, 1, or 2)
    const [errors, setErrors] = useState({});
    const [checkedCheckboxes, setCheckedCheckboxes] = useState({});
    const [hiddenRows, setHiddenRows] = useState({});
    const [showModal, setShowModal] = useState(false);  // Control modal visibility
    const [progress, setProgress] = useState(0);
    const [files, setFiles] = useState({});
    const [serviceDataMain, setServiceDataMain] = useState([]);
    const [status, setStatus] = useState([]);
    const [fileNames, setFileNames] = useState([]);
    const [serviceDataImageInputNames, setServiceDataImageInputNames] = useState([]);
    const [apiStatus, setApiStatus] = useState(true);
    const [cefDataApp, setCefDataApp] = useState([]);
    const [nationality, setNationality] = useState([]);
    const [annexureImageData, setAnnexureImageData] = useState([]);
    const [purpose, setPurpose] = useState([]);
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
            permanent_address: '',
            current_address_pin_code: '',
            permanent_pin_code: '',
            declaration_date: '',
            current_address: '',
            current_address_landline_number: '',
            permanent_address_landline_number: '',
            current_address_state: '',
            permanent_address_state: '',
            current_prominent_landmark: '',
            permanent_prominent_landmark: '',
            current_address_stay_to: '',
            permanent_address_stay_to: '',
            current_address_nearest_police_station: '',
            permanent_address_nearest_police_station: '',
            insurance_details_contact_number: '',
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
            passport_no: '',
            dme_no: '',
            tax_no: '',
            pan_card_number: "",
            insurance_details_name: '',
            insurance_details_nominee_dob: "",
            insurance_details_nominee_relation: ""

        },
    });

    const fetchApplicationStatus = async () => {
        setLoadingData(true);
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
                    setNationality(result.data?.application?.nationality || '');
                    setPurpose(result.data?.application?.purpose_of_application || '');

                    const cefData = result.data?.cefApplication || [];
                    const applicationData = result.data?.application || [];
                    setApplicationData(result.data?.applicationData)
                    setCefDataApp(cefData);

                    setFormData({
                        ...formData,
                        personal_information: {
                            full_name: cefData?.full_name || formData.full_name,
                            former_name: cefData?.former_name || formData.former_name,
                            mb_no: cefData?.mb_no || formData.mb_no,
                            father_name: cefData?.father_name || formData.father_name,
                            husband_name: cefData?.husband_name || formData.husband_name,
                            dob: cefData?.dob || formData.dob,
                            gender: cefData?.gender || formData.gender,
                            permanent_address: cefData?.permanent_address || formData.permanent_address,
                            current_address_pin_code: cefData?.current_address_pin_code || formData.current_address_pin_code,
                            permanent_pin_code: cefData?.permanent_pin_code || formData.permanent_pin_code,
                            declaration_date: formData.personal_information.declaration_date || cefData?.declaration_date,
                            current_address: cefData?.current_address || formData.current_address,
                            current_address_landline_number: cefData?.current_address_landline_number || formData.current_address_landline_number,
                            permanent_address_landline_number: cefData?.permanent_address_landline_number || formData.permanent_address_landline_number,
                            current_address_state: cefData?.current_address_state || formData.current_address_state,
                            permanent_address_state: cefData?.permanent_address_state || formData.permanent_address_state,
                            current_prominent_landmark: cefData?.current_prominent_landmark || formData.current_prominent_landmark,
                            permanent_prominent_landmark: cefData?.permanent_prominent_landmark || formData.permanent_prominent_landmark,
                            current_address_stay_to: cefData?.current_address_stay_to || formData.current_address_stay_to,
                            permanent_address_stay_to: cefData?.permanent_address_stay_to || formData.permanent_address_stay_to,
                            current_address_nearest_police_station: cefData?.current_address_nearest_police_station || formData.current_address_nearest_police_station,
                            permanent_address_nearest_police_station: cefData?.permanent_address_nearest_police_station || formData.permanent_address_nearest_police_station,
                            nationality: cefData?.nationality || formData.nationality,
                            insurance_details_name: cefData?.insurance_details_name || formData.insurance_details_name,
                            insurance_details_contact_number: cefData.insurance_details_contact_number || formData.insurance_details_contact_number,
                            insurance_details_nominee_dob: cefData.insurance_details_nominee_dob || formData.insurance_details_nominee_dob,
                            insurance_details_nominee_relation: cefData.insurance_details_nominee_relation || formData.insurance_details_nominee_relation,
                            marital_status: cefData?.marital_status || formData.marital_status,
                            name_declaration: applicationData?.name || formData.name_declaration,
                            blood_group: cefData?.blood_group || formData.blood_group,
                            pan_card_name: cefData?.pan_card_name || formData.pan_card_name,
                            aadhar_card_name: cefData?.aadhar_card_name || formData.aadhar_card_name,
                            aadhar_card_number: cefData?.aadhar_card_number || formData.aadhar_card_number,
                            emergency_details_name: cefData?.emergency_details_name || formData.emergency_details_name,
                            emergency_details_relation: cefData?.emergency_details_relation || formData.emergency_details_relation,
                            emergency_details_contact_number: cefData?.emergency_details_contact_number || formData.emergency_details_contact_number,
                            icc_bank_acc: cefData?.icc_bank_acc || formData.icc_bank_acc,
                            food_coupon: cefData?.food_coupon || formData.food_coupon,
                            ssn_number: cefData?.ssn_number || formData.ssn_number,
                            passport_no: cefData?.passport_no || formData.passport_no,
                            dme_no: cefData?.dme_no || formData.dme_no,
                            tax_no: cefData?.tax_no || formData.tax_no,
                            pan_card_number: cefData?.pan_card_number || formData.pan_card_number,
                        },
                    });

                    const parsedData = result.data?.serviceData || [];

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
                    setAnnexureImageData(allJsonDataValue);


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
                            let fieldValue = allJsonDataValue.find(data => data && data.hasOwnProperty('no_of_employment')); // Check for null or undefined before accessing `hasOwnProperty`
                            let initialAnnexureDataNew = initialAnnexureData;
                            if (fieldValue && fieldValue.hasOwnProperty('no_of_employment')) {
                                initialAnnexureDataNew = updateEmploymentFields(fieldValue.no_of_employment, fieldValue); // Call function to handle employment fields
                            } else {
                            }
                            annexureData[service.db_table].employment_fields = initialAnnexureDataNew.gap_validation.employment_fields;
                        }

                    });

                    calculateGaps();
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

                    setServiceDataImageInputNames(fileInputs);
                    setServiceDataMain(allJsonData);


                } else {

                    setApiStatus(false);

                    Swal.fire({
                        title: 'error',
                        text: result.message || 'Application does not exist.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                        allowOutsideClick: false,  // Disable side clicks
                        allowEscapeKey: false,    // Disable escape key to close
                        preConfirm: () => {
                            // Prevent the modal from closing when the OK button is clicked
                            return false;  // This will stop the modal from closing
                        },
                        customClass: {
                            container: 'custom-container',  // Add class to the container
                            popup: 'custom-popup',          // Optional: Add class to the entire popup
                            header: 'custom-header'         // Optional: Add class to the header
                        }
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
            finally {
                setLoadingData(false);
            }
        }
    };

    const handleAddressCheckboxChange = (e) => {
        setIsSameAsPermanent(e.target.checked);

        // If checkbox is checked, copy the permanent address to current address fields
        if (e.target.checked) {
            setFormData({
                ...formData,
                personal_information: {
                    ...formData.personal_information,
                    current_address: formData.personal_information.permanent_address,
                    current_address_landline_number: formData.personal_information.permanent_address_landline_number,
                    current_address_state: formData.personal_information.permanent_address_state,
                    current_prominent_landmark: formData.personal_information.permanent_prominent_landmark,
                    current_address_stay_to: formData.personal_information.permanent_address_stay_to,
                    current_address_nearest_police_station: formData.personal_information.permanent_address_nearest_police_station,
                    current_address_pin_code: formData.personal_information.permanent_pin_code,
                },
            });
        } else {
            // If unchecked, clear current address fields
            setFormData({
                ...formData,
                personal_information: {
                    ...formData.personal_information,
                    current_address: '',
                    current_address_landline_number: '',
                    current_address_state: '',
                    current_prominent_landmark: '',
                    current_address_stay_to: '',
                    current_address_nearest_police_station: '',
                    current_address_pin_code: '',
                },
            });
        }
    };
    const [companyName, setCompanyName] = useState([]);
    const refs = useRef({});

    const [isValidApplication, setIsValidApplication] = useState(true);
    const location = useLocation();
    const currentURL = location.pathname + location.search;


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
        const service = serviceDataMain[activeTab - 2];
        if (service.db_table == 'gap_validation') {
            return {}; // Skip validation for gap_validation service
        }


        // Loop through the rows to validate files and fields
        service.rows.forEach((row, rowIndex) => {
            // Check if any of the checkboxes 'done_or_not' or 'has_not_done' is checked for this row
            const shouldSkipServiceValidation = service.rows.some(row => {

                return row.inputs.some(input => {

                    const startsWithCondition = input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done');

                    const annexureDataCondition = annexureData[service.db_table]?.[input.name];


                    if (
                        annexureDataCondition === null ||
                        annexureDataCondition === undefined ||
                        (typeof annexureDataCondition === 'string' && annexureDataCondition.trim() === '')
                        || annexureDataCondition == 0 || !annexureDataCondition
                    ) {
                        return false;
                    }

                    const finalCondition = input.type === 'checkbox' &&
                        startsWithCondition &&
                        annexureDataCondition;


                    return finalCondition;
                });
            });


            if (shouldSkipServiceValidation) {
                return {}; // Skip all validation for this service and return empty errors
            }

            row.inputs.forEach((input, inputIndex) => {

                // Skip validation for this input if the row was skipped due to checkbox being checked
                if (shouldSkipServiceValidation) {
                    return;
                }

                if (input.type === 'file') {
                    const fileName = input.name;

                    const mapping = serviceDataImageInputNames.find(entry => entry[fileName]);
                    const createdFileName = mapping ? mapping[fileName] : undefined;
                    const annexureImagesMap = annexureImageData.reduce((acc, item) => {
                        Object.keys(item).forEach((key) => {
                            if (createdFileName) {
                                acc[key] = item[key]; // Store the file URL by the field name
                            }
                        });
                        return acc;
                    }, {});



                    const validateFile = (fileName) => {
                        let fileErrors = [];


                        // Check if createdFileName is valid and the structure exists in 'files'
                        let filesToCheck = createdFileName && files[createdFileName]
                            ? files[createdFileName][fileName]
                            : undefined;


                        if (!filesToCheck) {

                            filesToCheck = annexureImagesMap && annexureImagesMap[fileName]
                                ? (annexureImagesMap[fileName] || undefined)  // Ensures empty values are treated as undefined
                                : undefined;

                        }


                        if (typeof filesToCheck === "string" && filesToCheck.trim() !== "" ||
                            (Array.isArray(filesToCheck) && filesToCheck.length > 0)) {
                        } else {
                            filesToCheck = undefined;
                        }

                        // If the file exists in annexureImageData, skip validation for this file
                        if (filesToCheck && annexureImagesMap[fileName]) {
                            delete newErrors[fileName]; // Clear any previous error for this file
                            return fileErrors; // No errors for already uploaded files
                        }

                        // Handle the scenario where the checkbox is unchecked but files are still present in the structure
                        if (!annexureData[service.db_table]?.[input.name] && filesToCheck && filesToCheck.length > 0) {
                            delete newErrors[fileName]; // Clear error if files are found
                        }


                        if (
                            !annexureData[service.db_table]?.[input.name] || // Not found or undefined
                            (typeof annexureData[service.db_table]?.[input.name] === "string" && annexureData[service.db_table]?.[input.name].trim() === "") || // Empty/whitespace string
                            (typeof annexureData[service.db_table]?.[input.name] === "object" && !Array.isArray(annexureData[service.db_table]?.[input.name]) && Object.keys(annexureData[service.db_table]?.[input.name]).length === 0) || // Empty object
                            (Array.isArray(annexureData[service.db_table]?.[input.name]) && annexureData[service.db_table]?.[input.name].length === 0) // Empty array
                        ) {


                            if (!filesToCheck || filesToCheck.length === 0) {
                                fileErrors.push(`${fileName} is required.`);
                            }
                        } else {
                        }


                        return fileErrors;
                    };

                    const fileErrors = validateFile(fileName);

                    // Ensure errors[fileField] is always an array
                    if (!Array.isArray(newErrors[fileName])) {
                        newErrors[fileName] = []; // Initialize it as an array if not already
                    }

                    // If there are file errors, push them to newErrors
                    if (fileErrors.length > 0) {
                        newErrors[fileName] = [...newErrors[fileName], ...fileErrors];
                    } else {
                        // If no errors and files were selected, clear any previous errors
                        delete newErrors[fileName];
                    }
                } else {
                    // For non-file inputs, validate required fields
                    const inputValue = annexureData[service.db_table]?.[input.name];

                    if (input.required && (!inputValue || inputValue.trim() === '')) {
                        newErrors[input.name] = 'This field is required';
                    } else {
                        // Clear the error if the field has value
                        delete newErrors[input.name];
                    }
                }
            });
        });

        return newErrors; // Return the accumulated errors
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

    const handleNext = () => {
        let validationErrors = {};


        if (activeTab === 0) {
            validationErrors = validate1(); // Validation for the first tab
        } else if (activeTab === 1) {
            validationErrors = validateSec(); // Validation for the second tab
        } else if (activeTab > 0 && activeTab <= (serviceDataMain.length + 2)) {
            serviceDataMain[activeTab - 2].rows.forEach((row, rowIndex) => {

                const checkboxInput = row.inputs.find(input => input.type === 'checkbox');

                const checkboxName = checkboxInput?.name;

                const annexureValue = annexureData[serviceDataMain[activeTab - 2].db_table]?.[checkboxName] ?? false;

                const isChecked = ["1", 1, true, "true"].includes(annexureValue);

                toggleRowsVisibility(activeTab - 2, rowIndex, isChecked);
            });

            validationErrors = validate(); // Validation for service-related tabs
        } else if (activeTab === serviceDataMain.length + 2) {
            validationErrors = validate2(); // Validation for the last tab
        }

        if (Object.keys(validationErrors).length === 0) {
            setErrors({}); // Clear any previous errors

            if (activeTab < serviceDataMain.length + 2) {
                setActiveTab(activeTab + 1);
            }
        } else {
            setErrors(validationErrors); // Set the validation errors to the state
        }
    };

    const handleCheckboxChange = (checkboxName, isChecked, tablename) => {
        setCheckedCheckboxes((prevState) => ({
            ...prevState,
            [checkboxName]: isChecked,
        }));
        setAnnexureData((prevData) => {
            const updatedData = {
                ...prevData,
                [tablename]: {
                    ...prevData[tablename],
                    [checkboxName]: isChecked
                }
            };
            return updatedData;
        });
    };


    const validate1 = () => {

        const newErrors = {}; // Object to hold validation errors
        const resumeFileErrors = []; // Separate array for resume file errors
        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            "image/jpeg", "image/png", "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];


        const requiredFields = [
            "marital_status", "full_name", "former_name", "mb_no", "father_name", "dob",
            "gender", "nationality",
        ];


        if (status === 1) {
            requiredFields.push(
                "emergency_details_name", "emergency_details_relation", "emergency_details_contact_number", "food_coupon"
            );
        }

        if (status === 1 && nationality === "Indian") {
            requiredFields.push("aadhar_card_name", "pan_card_name");
        }

        if (purpose === 'NORMAL BGV(EMPLOYMENT)') {
            requiredFields.push('resume_file');
        }

        const validateFile = (fileName) => {
            let file;
            const fileErrors = [];

            // Check if the file exists in cefDataApp first
            const existingFileInCefData = cefDataApp[fileName] || files[fileName];

            if (existingFileInCefData) {
                return fileErrors; // No validation required if it's already in cefDataApp or files
            }

            // If file is not in cefDataApp, check in the files object with correct keys
            // Adjust this part to match the structure of your files
            const fileKey = Object.keys(files).find(key => key.includes(fileName)); // Find the correct file key
            file = fileKey ? files[fileKey][fileName] : undefined;

            // Check if the file exists in files object (either as a single file or array of files)
            if (file && file[0]) {
                // Multiple files uploaded
                file.forEach((fileItem) => {

                });
            } else if (file && file.size) {

            } else {
                // File is required and was not found
                fileErrors.push(`${fileName} is required.`);
            }

            return fileErrors;
        };


        const requiredFileInputsRaw = ["govt_id"];
        let requiredFileInputs = [...requiredFileInputsRaw];

        if (status === 1 && nationality === "Indian") {
            requiredFileInputs.push("aadhar_card_image", "pan_card_image");
        }
        if (status === 1) {
            requiredFileInputs.push("passport_photo");
        }

        // Validate files for the required fields
        requiredFileInputs.forEach((field) => {
            const fileErrors = validateFile(field);
            if (fileErrors.length > 0) {
                newErrors[field] = fileErrors;
            } else {
                // If no errors, remove any existing errors for this field
                delete newErrors[field];
            }
        });

        // Handle required fields validation for the first tab
        requiredFields.forEach((field) => {
            if (!formData.personal_information[field] || formData.personal_information[field].trim() === "") {
                newErrors[field] = "This field is required*";
            } else {
                // If the field is filled, remove the error if it exists
                delete newErrors[field];
            }
        });
        if (purpose === 'NORMAL BGV(EMPLOYMENT)') {
            const resumeFileInFiles = files['applications_resume_file'] && files['applications_resume_file'].resume_file;
            const resumeFileInCefData = cefDataApp['resume_file'];
            let file = null;

            // Ensure the file exists in resume_file array
            if (resumeFileInFiles && Array.isArray(resumeFileInFiles) && resumeFileInFiles.length > 0) {
                file = resumeFileInFiles[0];  // Access the file in the array
            }

            // If the file exists, proceed with validation
            if (file) {
                // Check if the file has required properties like name and size
                if (!file.name || !file.size) {
                    resumeFileErrors.push('Resume file is required.');
                } else {

                    if (resumeFileErrors.length === 0) {
                        const fileErrors = validateFile('resume_file');
                        if (fileErrors.length > 0) {
                            resumeFileErrors.push(...fileErrors);
                        }
                    }
                }
            } else if (resumeFileInCefData) {
                delete newErrors['resume_file']; // No error if the file is already in CefData
            } else {
                resumeFileErrors.push('Resume file is required.');
            }

            if (resumeFileErrors.length > 0) {
                newErrors["resume_file"] = resumeFileErrors;
            } else {
                delete newErrors["resume_file"];
            }
        }
        return newErrors;
    };
    const handleBack = () => {
        if (activeTab > 1) {
            setActiveTab(activeTab - 1); // Adjust the active tab to go back
        }
    };

    const validateSec = () => {
        const newErrors = {};
        const requiredFields = [
            "current_address", "permanent_address",
            "current_address_landline_number", "permanent_address_landline_number", "current_address_state", "permanent_address_state",
            "current_prominent_landmark", "permanent_prominent_landmark",
            "current_address_nearest_police_station", "permanent_address_nearest_police_station", "current_address_pin_code",
            "permanent_pin_code"
        ];

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
            }

            let fileErrors = [];

            // Check if the file already exists in cefDataApp, skip validation if it does
            if (cefDataApp && cefDataApp[fileName]) {
                return fileErrors; // Skip validation if the file already exists
            }

            // If file doesn't exist in cefDataApp, continue validation
            if (file) {
                file.forEach((fileItem) => {
                    // Remove the size validation block
                    // if (fileItem.size > maxSize) {
                    //     const errorMessage = `${fileItem.name}: File size must be less than 2MB.`;
                    //     fileErrors.push(errorMessage);
                    // }

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
            "declaration_date", "name_declaration" // Add other required fields here if needed
        ];

        requiredFields.forEach((field) => {
            if (!formData.personal_information[field] || formData.personal_information[field].trim() === "") {
                newErrors[field] = "This field is required*";
            }
        });

        return newErrors;
    };

    const handleTabClick = (heading) => {
        setActiveTab(heading);
    };

    useEffect(() => {
        fetchApplicationStatus();
    }, []);



    const handleFileChange = (dbTable, fileName, e) => {
        const selectedFiles = Array.from(e.target.files);
        const maxSize = 2 * 1024 * 1024;
        const allowedTypes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]; // Allowed file types

        let errors = [];

        // selectedFiles.forEach((file) => {
        //     if (file.size > maxSize) {
        //         errors.push(`${file.name}: File size must be less than 2MB.`);
        //     }

        //     if (!allowedTypes.includes(file.type)) {
        //         errors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
        //     }
        // });

        if (errors.length > 0) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [fileName]: errors, // Set errors for this file input
            }));
            return;
        }

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

    let isGapPresent = "no";

    // Check if any gap exists
    for (let key in gaps) {
        if (gaps[key].years > 0 || gaps[key].months > 0) {
            isGapPresent = "yes";
            break;  // No need to check further once a gap is found
        }
    }


    let isEmploymentGapPresent = "no";

    // Check if any gap exists in the employment gaps
    for (let i = 0; i < employGaps.length; i++) {
        if (employGaps[i].difference !== "No gap") {
            isEmploymentGapPresent = "yes";
            break;  // No need to check further once a gap is found
        }
    }

    const handleSubmit = async (custombgv, e) => {
        e.preventDefault();

        const fileCount = Object.keys(files).length;
        const TotalApiCalls = fileCount + 1;
        const dataToSubmitting = 100 / TotalApiCalls;

        if (custombgv === 0) {
            // Show SweetAlert loading spinner for custombgv === 0
            Swal.fire({
                title: "Processing...",
                text: "Please wait while we process your request.",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading(); // Show the loading spinner
                },
            });
        }

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

        // Initialize requestData
        const requestData = {
            branch_id: decodedValues.branch_id,
            customer_id: decodedValues.customer_id,
            application_id: decodedValues.app_id,
            ...formData,
            is_submitted: custombgv,
            annexure: annexureData,
            send_mail: fileCount === 0 ? 1 : 0, // Send mail if no files are uploaded
            is_custom_bgv: custombgv, // Use the passed value for is_custom_bgv
        };

        // Check if 'GAP VALIDATION' section is present
        const gapValidationSection = serviceDataMain.find(section => section.heading === "GAP VALIDATION");

        if (gapValidationSection) {
            // If the "GAP VALIDATION" section is present, remove is_submitted from annexureData.gap_validation
            if (annexureData && annexureData.gap_validation) {
                delete annexureData.gap_validation.is_submitted;
            }

            // Check if the education_fields and employment_fields are already stringified
            const isEducationFieldsStringified = typeof annexureData.gap_validation.education_fields === 'string';
            const isEmploymentFieldsStringified = typeof annexureData.gap_validation.employment_fields === 'string';
   

            // Only stringify if the fields are not already stringified
            const educationFieldsString = isEducationFieldsStringified
                ? annexureData.gap_validation.education_fields
                : JSON.stringify(annexureData.gap_validation.education_fields);

            const employmentFieldsString = isEmploymentFieldsStringified
                ? annexureData.gap_validation.employment_fields
                : JSON.stringify(annexureData.gap_validation.employment_fields);

            // Assign stringified fields to the gap_validation object in requestData
            requestData.annexure.gap_validation.education_fields = educationFieldsString;
            requestData.annexure.gap_validation.employment_fields = employmentFieldsString;

            // Add the gap fields to requestData based on your conditions
            requestData.is_education_gap = isGapPresent;
            requestData.is_employment_gap = isEmploymentGapPresent;
        }

        // Logging for debugging purposes
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
                        text: activeTab === serviceDataMain.length + 2 ? "Your Form is saved successfully" : 'Your Form is saved successfully. You can proceed to your next step!',
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        fetchApplicationStatus(); // Call fetch status only for custombgv 0
                        Swal.close(); // Close the loading spinner after processing is complete
                    });
                } else {
                    // Handle file upload logic for custombgv 0, but without progress
                    await uploadCustomerLogo(result.cef_id, fileCount, TotalApiCalls, custombgv); // Upload files
                    Swal.fire({
                        title: "Success",
                        text: activeTab === serviceDataMain.length + 2 ? "Your Form is saved successfully" : 'Your Form is saved successfully. You can proceed to your next step!',
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        fetchApplicationStatus(); // Call fetch status after success
                        Swal.close(); // Close the loading spinner after processing is complete
                    });
                }
            }

            if (custombgv === 1) {
                // If custombgv is 1, show detailed success message and proceed with progress and file uploads
                if (fileCount === 0) {
                    Swal.fire({
                        title: "Success",
                        text: result.message || "BGV Application Created Successfully.",
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        fetchApplicationStatus(); // Call fetch status after submission
                        Swal.close(); // Close the loading spinner
                    });
                } else {
                    await uploadCustomerLogo(result.cef_id, fileCount, TotalApiCalls, custombgv); // Upload files
                    setProgress(100); // Set progress to 100% after file upload
                    Swal.fire({
                        title: "Success",
                        text: result.message || "BGV Application Created Successfully",
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        fetchApplicationStatus(); // Call fetch status after successful file upload
                        Swal.close(); // Close the loading spinner
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
                        permanent_address: '',
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
            Swal.fire("Error!", error.message, "error");
            Swal.close(); // Close the loading spinner if an error occurs
        } finally {
            // Stop loading indicator and close modal after processing
            setLoading(false);
            setShowModal(false);
        }
    };

    const validateDate = () => {
        const newErrors = {};

        // Fetch dates from annexureData
        const {
            secondary_end_date_gap,
            senior_secondary_start_date_gap,
            senior_secondary_end_date_gap,
            graduation_start_date_gap,
            graduation_end_date_gap,
            post_graduation_start_date_gap,
            post_graduation_end_date_gap,
            phd_start_date_gap,
        } = annexureData.gap_validation;

        // Helper function to convert string dates to Date objects
        const parseDate = (dateString) => new Date(dateString);

        // Convert the date strings into Date objects for comparison
        const secondaryEndDate = parseDate(secondary_end_date_gap);
        const seniorSecondaryStartDate = parseDate(senior_secondary_start_date_gap);
        const seniorSecondaryEndDate = parseDate(senior_secondary_end_date_gap);
        const graduationStartDate = parseDate(graduation_start_date_gap);
        const graduationEndDate = parseDate(graduation_end_date_gap);
        const postGraduationStartDate = parseDate(post_graduation_start_date_gap);
        const postGraduationEndDate = parseDate(post_graduation_end_date_gap);
        const phdStartDate = parseDate(phd_start_date_gap);

        // Validation logic

        // Senior Secondary Start should be after Secondary End
        if (seniorSecondaryStartDate < secondaryEndDate) {
            newErrors.senior_secondary_start_date_gap = "Senior Secondary start date must be after Secondary end date.";
        }

        // Graduation Start should be after Senior Secondary End
        if (graduationStartDate < seniorSecondaryEndDate) {
            newErrors.graduation_start_date_gap = "Graduation start date must be after Senior Secondary end date.";
        }

        // Graduation End should be after Graduation Start
        if (graduationEndDate < graduationStartDate) {
            newErrors.graduation_end_date_gap = "Graduation end date must be after Graduation start date.";
        }

        // Post Graduation Start should be after Graduation End
        if (postGraduationStartDate < graduationEndDate) {
            newErrors.post_graduation_start_date_gap = "Post Graduation start date must be after Graduation end date.";
        }

        // Post Graduation End should be after Post Graduation Start
        if (postGraduationEndDate < postGraduationStartDate) {
            newErrors.post_graduation_end_date_gap = "Post Graduation end date must be after Post Graduation start date.";
        }

        // PhD Start should be after Post Graduation End
        if (phdStartDate < postGraduationEndDate) {
            newErrors.phd_start_date_gap = "PhD start date must be after Post Graduation end date.";
        }

        setErrors(newErrors);
    };
    const uploadCustomerLogo = async (cef_id, fileCount, TotalApiCalls, custombgv) => {

        if (custombgv == 0) {
            setLoading(false);
        }

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
                customerLogoFormData.append('send_mail', custombgv);
                customerLogoFormData.append('is_submitted', custombgv);
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


    useEffect(() => {
        const currentDate = new Date().toISOString().split('T')[0]; // Format to 'YYYY-MM-DD'

        setFormData(prevState => ({
            ...prevState,
            personal_information: {
                ...prevState.personal_information,
                declaration_date: currentDate, // Set current date
            }
        }));
    }, [activeTab]);


    return (
        <>
            {
                loadingData ? (
                    <div className='flex justify-center items-center py-6 ' >
                        <PulseLoader color="#36D7B7" loading={loadingData} size={15} aria-label="Loading Spinner" />
                    </div >
                ) :
                    (

                        <div>

                            {
                                loading ? (
                                    <div className='flex justify-center items-center py-6'>
                                        {showModal && (
                                            <div className="fixed inset-0 p-3 flex justify-center items-center bg-gray-300 bg-opacity-50 z-50">
                                                <div className="bg-white p-8 rounded-lg md:w-5/12 shadow-xl md:py-20 relative">
                                                    <div className="flex justify-center items-center mb-6">
                                                        <h2 className="md:text-xl font-bold text-gray-800 text-center uppercase">Generating Candidate Application</h2>
                                                        <button
                                                            type='button'
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
                                    <div className='py-5' id="hiddenForm">

                                        <div className="md:w-10/12 mx-auto p-6" >
                                            {status === 1 && (
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
                                                        onClick={() => handleTabClick(0)} // Navigate to tab 0 (Personal Information)
                                                        disabled={false} // Always enable the first tab
                                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center ${activeTab === 0 ? "text-[#3e76a5]" : "text-gray-700"}`}
                                                    >
                                                        <FaUser
                                                            className="mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full bg-[#3e76a5] text-white"
                                                        />
                                                        Personal Information
                                                    </button>
                                                    <MdOutlineArrowRightAlt className='text-2xl' />
                                                </div>

                                                {/* Current/Permanent Address Tab */}
                                                <div className="text-center flex items-end gap-2">
                                                    <button
                                                        type='button'
                                                        onClick={() => handleTabClick(1)} // Navigate to tab 1 (Current/Permanent Address)
                                                        disabled={activeTab == 0} // Enable only when on step 1
                                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
    ${activeTab === 1 ? "text-[#3e76a5]" : "text-gray-700"}`} // Text color changes based on tab active status
                                                    >
                                                        <FaUser
                                                            className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
      ${activeTab === 1 ? "bg-[#3e76a5] text-white" : (activeTab > 0 ? "bg-[#3e76a5] text-white" : "bg-gray-100 text-gray-400")}`} // Icon color changes based on active tab
                                                        />
                                                        Current/Permanent Address
                                                    </button>
                                                    <MdOutlineArrowRightAlt className={`text-2xl ${activeTab === 1 ? "text-[#3e76a5]" : "text-gray-700"}`} />


                                                </div>

                                                {/* Service Tabs */}
                                                {serviceDataMain.map((service, index) => {
                                                    const isTabEnabled = activeTab > index + 1;
                                                    return (
                                                        <div key={index} className="text-center flex items-end gap-2">
                                                            <button
                                                                type='button'
                                                                disabled={!isTabEnabled} // Disable tab if it's not the current step
                                                                className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
                                ${activeTab === index + 2 ? "text-[#3e76a5]" : (isTabEnabled ? "text-gray-700" : "text-gray-400")}`}
                                                                onClick={() => handleTabClick(index + 2)} // Navigate to the tab when clicked
                                                            >
                                                                <FaCog
                                                                    className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
                                    ${activeTab === index + 2 ? "bg-[#3e76a5] text-white" : (isTabEnabled ? "bg-[#3e76a5] text-white" : "bg-gray-100 text-gray-400")}`}
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
                                                        onClick={() => handleTabClick(serviceDataMain.length + 2)} // Set tab to the last one (declaration)
                                                        disabled={activeTab !== serviceDataMain.length + 2} // Disable until all previous steps are completed
                                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
    ${activeTab === serviceDataMain.length + 2 ? "text-[#3e76a5]" : "text-gray-400"}`} // Text color changes based on tab active status
                                                    >
                                                        <FaCheckCircle
                                                            className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
      ${activeTab === serviceDataMain.length + 2 ? "bg-[#3e76a5] text-white" : "bg-gray-100 text-gray-400"}`} // Icon color changes based on active tab
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
                                                                        onChange={(e) => handleFileChange("applications_resume_file", "resume_file", e)}
                                                                        ref={(el) => (refs.current["resume_file"] = el)} // Attach ref here

                                                                    />
                                                                    {errors.resume_file && <p className="text-red-500 text-sm" > {errors.resume_file} </p>}

                                                                    {cefDataApp.resume_file && (
                                                                        <div className=' border rounded-md mt-4'><img src={cefDataApp.resume_file || "NO IMAGE FOUND"} className=' object-contain p-3' alt="NO IMAGE FOUND" /></div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            < div className="form-group col-span-2" >
                                                                <label className='text-sm' > Attach Govt.ID Proof: <span className="text-red-500 text-lg" >* </span> (Please attach only masked aadhar card , if don't have masked aadhar card then attach pan card/passowrd/voter ID/DL)</label >
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

                                                                <div className='md:flex overflow-scroll gap-3'>

                                                                    {cefDataApp.govt_id ? (
                                                                        cefDataApp.govt_id.split(',').map((item, index) => {
                                                                            // Check if the item is an image (based on its extension)
                                                                            const isImage = item && (item.endsWith('.jpg') || item.endsWith('.jpeg') || item.endsWith('.png'));

                                                                            return (
                                                                                <div key={index} className='border mt-3 w-4/12 rounded-md flex items-center justify-center'>
                                                                                    {isImage ? (
                                                                                        <img src={item} alt={`Image ${index}`} className='p-3 ' />
                                                                                    ) : (
                                                                                        <div>
                                                                                            <button onClick={() => window.open(item, '_blank')} type='button'>Open Link</button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <p></p>
                                                                    )}
                                                                </div>


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

                                                                            <div className='md:grid grid-cols-3 mt-3 gap-3'>
                                                                                {cefDataApp.passport_photo ? (
                                                                                    cefDataApp.passport_photo.split(',').map((item, index) => {
                                                                                        // Check if the item is an image (based on its extension)
                                                                                        const isImage = item && (item.endsWith('.jpg') || item.endsWith('.jpeg') || item.endsWith('.png'));

                                                                                        return (
                                                                                            <div key={index} className='border rounded-md flex items-center justify-center'>
                                                                                                {isImage ? (
                                                                                                    <img src={item} alt={`Image ${index}`} className='p-3' />
                                                                                                ) : (
                                                                                                    <div>
                                                                                                        <button onClick={() => window.open(item, '_blank')} type='button' className='text-blue-600 font-bold p-5'>Open Link</button>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })
                                                                                ) : (
                                                                                    <p></p>
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
                                                                        type="number"
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
                                                                    <label className='text-sm' htmlFor="father_name">Father's Name: <span className="text-red-500 text-lg">*</span></label>
                                                                    <input
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
                                                                        <option value=""  >
                                                                            Select gender
                                                                        </option>
                                                                        < option value="male" > Male </option>
                                                                        < option value="female" > Female </option>
                                                                        < option value="other" > Other </option>
                                                                    </select>
                                                                    {errors.gender && <p className="text-red-500 text-sm" >{errors.gender} </p>}
                                                                </div>
                                                            </div>
                                                            {nationality === "Indian" && (
                                                                <div className='form-group'>
                                                                    <label className='text-sm'>Aadhar card No</label>
                                                                    <input
                                                                        type="text"
                                                                        name="aadhar_card_number"
                                                                        value={formData.personal_information.aadhar_card_number}
                                                                        onChange={handleChange}
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                            )}
                                                            < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >



                                                                {
                                                                    status === 1 && nationality === "Indian" && (
                                                                        <>
                                                                            <div className='form-group'>
                                                                                <label className='text-sm'>
                                                                                    Name as per Aadhar card <span className='text-red-500 text-lg'>*</span>
                                                                                </label>
                                                                                <input
                                                                                    type="text"
                                                                                    name="aadhar_card_name"
                                                                                    value={formData.personal_information.aadhar_card_name}
                                                                                    onChange={handleChange}
                                                                                    ref={(el) => (refs.current["aadhar_card_name"] = el)} // Attach ref here
                                                                                    className="form-control border rounded w-full p-2 mt-2"
                                                                                />
                                                                                {errors.aadhar_card_name && (
                                                                                    <p className="text-red-500 text-sm">{errors.aadhar_card_name}</p>
                                                                                )}
                                                                            </div>

                                                                            <div className='form-group'>
                                                                                <label className='text-sm'>
                                                                                    Aadhar Card Image <span className='text-red-500 text-lg'>*</span> (Please attach only masked aadhar card)
                                                                                </label>
                                                                                <input
                                                                                    type="file"
                                                                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                                                    name="aadhar_card_image"
                                                                                    onChange={(e) => handleFileChange("applications_aadhar_card_image", "aadhar_card_image", e)}
                                                                                    className="form-control border rounded w-full p-1 mt-2"
                                                                                    ref={(el) => (refs.current["aadhar_card_image"] = el)} // Attach ref here
                                                                                />
                                                                                {errors.aadhar_card_image && (
                                                                                    <p className="text-red-500 text-sm">{errors.aadhar_card_image}</p>
                                                                                )}


                                                                            </div>
                                                                        </>
                                                                    )
                                                                }
                                                            </div>
                                                            {
                                                                cefDataApp.aadhar_card_image && (
                                                                    isImage(cefDataApp.aadhar_card_image) ? (
                                                                        // If it's an image, display it
                                                                        <div className='border rounded-md my-4 p-2'>
                                                                            <p className="font-bold ">Aadhar Card Image</p>
                                                                            <div>
                                                                                <img
                                                                                    src={cefDataApp.aadhar_card_image || "NO IMAGE FOUND"}
                                                                                    alt="Aadhar Card"
                                                                                    className=' object-contain p-3'
                                                                                />
                                                                            </div>

                                                                        </div>
                                                                    ) : (
                                                                        // If it's not an image, show a clickable link (view document)
                                                                        <div className='mt-2 p-5 border text-center'>
                                                                            <a
                                                                                href={cefDataApp.aadhar_card_image}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-500 text-center font-bold "
                                                                            >
                                                                                View Aadhar Card Document
                                                                            </a>
                                                                        </div>
                                                                    )
                                                                )
                                                            }
                                                            {nationality === "Indian" && (
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
                                                            )
                                                            }
                                                            < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >

                                                                {
                                                                    status === 1 && nationality === "Indian" && (
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

                                                                {status === 1 && nationality === "Indian" && (
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

                                                                    </div>
                                                                )}



                                                            </div>

                                                            {cefDataApp.pan_card_image && (
                                                                isImage(cefDataApp.pan_card_image) ? (
                                                                    // If it's an image, display it
                                                                    <div className='mt-3 border rounded-md p-2'>
                                                                        <p className=' font-bold'>Pan Card Image</p>
                                                                        <img
                                                                            src={cefDataApp.pan_card_image || "NO IMAGE FOUND"}
                                                                            className='object-contain p-3'
                                                                            alt="Pan Card Image"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    // If it's not an image, show a clickable link (view document)
                                                                    <div className='mt-2 p-5 border text-center'>
                                                                    <a
                                                                        href={cefDataApp.pan_card_image}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-500 font-bold "
                                                                    >
                                                                        View Pan Card Document
                                                                    </a>
                                                                </div>
                                                                )
                                                            )}
                                                            {
                                                                status == 0 && nationality === "Other" && (
                                                                    <div className="form-group" >
                                                                        <label className='text-sm' > Social Security Number(if applicable): </label>
                                                                        < input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.ssn_number}
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
                                                                                onChange={handleChange}
                                                                                value={formData.personal_information.passport_no}
                                                                                type="text"
                                                                                className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                                name="passport_no"

                                                                            />
                                                                        </div>
                                                                        <div className="form-group" >
                                                                            <label className='text-sm' >Driving Licence / Resident Card / Id no</label>
                                                                            < input
                                                                                onChange={handleChange}
                                                                                value={formData.personal_information.dme_no}
                                                                                type="text"
                                                                                className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                                name="dme_no"

                                                                            />
                                                                        </div>

                                                                    </div>
                                                                    <div className="form-group" >
                                                                        <label className='text-sm' >TAX No</label>
                                                                        < input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.tax_no}
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
                                                                    <label className='text-sm' htmlFor="marital_status"> Marital Status: <span className="text-red-500 text-lg" >*</span></label >
                                                                    <select
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                        name="marital_status"
                                                                        id="marital_status"
                                                                        onChange={handleChange}
                                                                        value={formData.personal_information.marital_status}

                                                                    >
                                                                        <option value="" selected> SELECT Marital STATUS </option>
                                                                        < option value="Don't wish to disclose"> Don't wish to disclose</option>
                                                                        < option value="Single"> Single </option>
                                                                        < option value="Married"> Married </option>
                                                                        < option value="Widowed"> Widowed </option>
                                                                        < option value="Divorced"> Divorced </option>
                                                                        < option value="Separated"> Separated </option>
                                                                    </select>
                                                                    {errors.marital_status && <p className="text-red-500 text-sm" > {errors.marital_status} </p>}
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
                                                                                    checked={formData.personal_information.food_coupon === 'Yes'} // Check if "No" is selected

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
                                                                                    checked={formData.personal_information.food_coupon === 'No'} // Check if "No" is selected

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

                                                {activeTab === 1 && (
                                                    <>
                                                        <div className=' border-gray-300 rounded-md mt-5 hover:transition-shadow duration-300' >

                                                            <h3 className='md:text-start md:mb-2 text-start md:text-2xl text-sm font-bold my-5' > Permanent Address </h3>
                                                            <div className='border border-black p-4 rounded-md'>
                                                                < div className="grid grid-cols-1 md:grid-cols-2 gap-4 " >

                                                                    <div className="form-group" >
                                                                        <label className='text-sm' htmlFor="permanent_address" > Permanent Address < span className="text-red-500 text-lg" >* </span></label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.permanent_address}
                                                                            type="text"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="permanent_address"
                                                                            name="permanent_address"
                                                                            disabled={isSameAsPermanent} // Disable if checkbox is checked

                                                                            ref={(el) => (refs.current["permanent_address"] = el)} // Attach ref here

                                                                        />
                                                                        {errors.permanent_address && <p className="text-red-500 text-sm" > {errors.permanent_address} </p>}
                                                                    </div>

                                                                    < div className="form-group" >
                                                                        <label className='text-sm' htmlFor="permanent_pin_code" > Pin Code < span className="text-red-500 text-lg" >* </span></label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.permanent_pin_code}
                                                                            type="text"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="permanent_pin_code"
                                                                            name="permanent_pin_code"
                                                                            ref={(el) => (refs.current["permanent_pin_code"] = el)} // Attach ref here

                                                                        />
                                                                        {errors.permanent_pin_code && <p className="text-red-500 text-sm" > {errors.permanent_pin_code} </p>}
                                                                    </div>
                                                                    < div className="form-group" >
                                                                        <label className='text-sm' htmlFor="permanent_address_landline_number" > Mobile Number < span className="text-red-500 text-lg" >* </span></label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.permanent_address_landline_number}
                                                                            type="number"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="permanent_address_landline_number"
                                                                            name="permanent_address_landline_number"
                                                                            ref={(el) => (refs.current["permanent_address_landline_number"] = el)} // Attach ref here

                                                                        />
                                                                        {errors.permanent_address_landline_number && <p className="text-red-500 text-sm" > {errors.permanent_address_landline_number} </p>}
                                                                    </div>
                                                                    < div className="form-group" >
                                                                        <label className='text-sm' htmlFor="permanent_address_state" > Current State < span className="text-red-500 text-lg" >* </span></label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.permanent_address_state}
                                                                            type="text"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="permanent_address_state"
                                                                            name="permanent_address_state"
                                                                            ref={(el) => (refs.current["permanent_address_state"] = el)} // Attach ref here

                                                                        />
                                                                        {errors.permanent_address_state && <p className="text-red-500 text-sm" > {errors.permanent_address_state} </p>}
                                                                    </div>
                                                                    < div className="form-group" >
                                                                        <label className='text-sm' htmlFor="permanent_prominent_landmark" > Current Landmark < span className="text-red-500 text-lg" >* </span></label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.permanent_prominent_landmark}
                                                                            type="text"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="permanent_prominent_landmark"
                                                                            name="permanent_prominent_landmark"
                                                                            ref={(el) => (refs.current["permanent_prominent_landmark"] = el)} // Attach ref here

                                                                        />
                                                                        {errors.permanent_prominent_landmark && <p className="text-red-500 text-sm" > {errors.permanent_prominent_landmark} </p>}
                                                                    </div>
                                                                    < div className="form-group" >
                                                                        <label className='text-sm' htmlFor="permanent_address_stay_to">Alternate Mobile No</label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.permanent_address_stay_to}
                                                                            type="text"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="permanent_address_stay_to"
                                                                            name="permanent_address_stay_to"

                                                                        />
                                                                    </div>

                                                                </div>

                                                                < div className="form-group" >
                                                                    <label className='text-sm' htmlFor="nearest_police_station" > Nearest Police Station.<span className="text-red-500">*</span></label>
                                                                    < input
                                                                        onChange={handleChange}
                                                                        value={formData.personal_information.permanent_address_nearest_police_station}
                                                                        type="text"
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                        id="permanent_address_nearest_police_station"
                                                                        name="permanent_address_nearest_police_station"

                                                                    />
                                                                    {errors.permanent_address_nearest_police_station && <p className="text-red-500 text-sm" > {errors.permanent_address_nearest_police_station} </p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className=' border-gray-300 rounded-md mt-5 hover:transition-shadow duration-300' >
                                                            <input type="checkbox" name="" checked={isSameAsPermanent} onChange={handleAddressCheckboxChange}
                                                                id="" className='me-2' /><label>Same as Permanent Address</label>

                                                            <h3 className='md:text-start md:mb-2 text-start md:text-2xl text-sm font-bold my-5' > Current Address </h3>
                                                            <div className='border border-black p-4 rounded-md'>
                                                                < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >


                                                                    < div className="form-group" >
                                                                        <label className='text-sm' > Current Address <span className="text-red-500 text-lg" >*</span></label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.current_address}
                                                                            type="text"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="current_address"
                                                                            name="current_address"
                                                                            disabled={isSameAsPermanent} // Disable if checkbox is checked

                                                                            ref={(el) => (refs.current["current_address"] = el)} // Attach ref here

                                                                        />
                                                                        {errors.current_address && <p className="text-red-500 text-sm" > {errors.current_address} </p>}
                                                                    </div>
                                                                    < div className="form-group" >
                                                                        <label className='text-sm' htmlFor="current_address_pin_code" > Pin Code < span className="text-red-500 text-lg" >* </span></label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.current_address_pin_code}
                                                                            type="text"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="current_address_pin_code"
                                                                            name="current_address_pin_code"
                                                                            ref={(el) => (refs.current["current_address_pin_code"] = el)} // Attach ref here

                                                                        />
                                                                        {errors.current_address_pin_code && <p className="text-red-500 text-sm" > {errors.current_address_pin_code} </p>}
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
                                                                        <label className='text-sm' htmlFor="current_address_stay_to" > Alternate Mobile No</label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.current_address_stay_to}
                                                                            type="text"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="current_address_stay_to"
                                                                            name="current_address_stay_to"

                                                                        />
                                                                    </div>

                                                                </div>

                                                                < div className="form-group" >
                                                                    <label className='text-sm' htmlFor="nearest_police_station" > Nearest Police Station.<span className="text-red-500">*</span></label>
                                                                    < input
                                                                        onChange={handleChange}
                                                                        value={formData.personal_information.current_address_nearest_police_station}
                                                                        type="text"
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                        id="current_address_nearest_police_station"
                                                                        name="current_address_nearest_police_station"
                                                                        ref={(el) => (refs.current["current_address_nearest_police_station"] = el)} // Attach ref here

                                                                    />
                                                                    {errors.current_address_nearest_police_station && <p className="text-red-500 text-sm" > {errors.current_address_nearest_police_station} </p>}

                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                {serviceDataMain.map((service, serviceIndex) => {
                                                    if (activeTab === serviceIndex + 2) {
                                                        return (
                                                            <div key={serviceIndex} className="md:p-6">
                                                                <h2 className="text-2xl font-bold mb-6">{service.heading}</h2>
                                                                {service.db_table == "gap_validation" && <><label for="highest_education" className='font-bold uppercase'>Your Highest Education:</label>
                                                                    <select id="highest_education_gap" name="highest_education_gap"
                                                                        value={annexureData["gap_validation"].highest_education_gap || ''}
                                                                        onChange={(e) => handleServiceChange("gap_validation", "highest_education_gap", e.target.value)}
                                                                        className="mt-1 mb-3 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    >
                                                                        <option value="">Select Your Highest Education</option>
                                                                        <option value="phd">PHD</option>
                                                                        <option value="post_graduation">Post Graduation</option>
                                                                        <option value="graduation">Graduation</option>
                                                                        <option value="senior_secondary">Senior Secondary Education</option>
                                                                        <option value="secondary">Secondary Education</option>
                                                                    </select>
                                                                    {
                                                                        annexureData["gap_validation"].highest_education_gap === 'phd' && (
                                                                            <>
                                                                                <h3 className="text-lg font-bold py-3">PHD</h3>
                                                                                <div className='border border-black p-4 rounded-md'>
                                                                                    <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                        <div>
                                                                                            <label>Institute Name</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_institute_name_gap`] || ''}
                                                                                                onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "phd_1", `phd_institute_name_gap`, e.target.value)}
                                                                                                name="phd_institute_name_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label>School Name</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_school_name_gap`] || ''}
                                                                                                onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "phd_1", `phd_school_name_gap`, e.target.value)}
                                                                                                name="phd_school_name_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label>Start Date</label>
                                                                                            <input
                                                                                                type="date"
                                                                                                value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_start_date_gap`] || ''}
                                                                                                onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "phd_1", `phd_start_date_gap`, e.target.value)}
                                                                                                name="phd_start_date_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                            {errors["phd_start_date_gap"] && <p className="text-red-500 text-sm">{errors["phd_start_date_gap"]}</p>}
                                                                                        </div>
                                                                                        <div>
                                                                                            <label>End Date</label>
                                                                                            <input
                                                                                                type="date"
                                                                                                value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_end_date_gap`] || ''}
                                                                                                onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "phd_1", `phd_end_date_gap`, e.target.value)}
                                                                                                name="phd_end_date_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="mt-2 mb-3">
                                                                                        <label htmlFor="phd_specialization_gap" className="block text-sm font-medium text-gray-700">Specialization</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            id="phd_specialization_gap"
                                                                                            value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_specialization_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "phd_1", "phd_specialization_gap", e.target.value)}
                                                                                            name="phd_specialization_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                {
                                                                                    (() => {
                                                                                        let index = 1;
                                                                                        let elements = [];

                                                                                        while (true) {
                                                                                            const key = `phd_corespondence_${index}`;

                                                                                            // Check if the key exists in education_fields
                                                                                            if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                                                                                break; // Exit loop if the key is missing
                                                                                            }

                                                                                            const phdSection = annexureData.gap_validation.education_fields[key];

                                                                                            elements.push(
                                                                                                <div key={index} className='border border-black p-4 mt-4 rounded-md'>
                                                                                                    <h3 className="text-lg font-bold py-3">Correspondence PHD {index}</h3>
                                                                                                    <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                                        <div>
                                                                                                            <label>Institute Name</label>
                                                                                                            <input
                                                                                                                type="text"
                                                                                                                value={phdSection?.phd_institute_name_gap || ''}
                                                                                                                onChange={(e) => {
                                                                                                                    handleEmploymentGapChange("gap_validation", "education_fields", key, "phd_institute_name_gap", e.target.value);
                                                                                                                }}
                                                                                                                name="phd_institute_name_gap"
                                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                            />
                                                                                                        </div>
                                                                                                        <div>
                                                                                                            <label>School Name</label>
                                                                                                            <input
                                                                                                                type="text"
                                                                                                                value={phdSection?.phd_school_name_gap || ''}
                                                                                                                onChange={(e) => {
                                                                                                                    handleEmploymentGapChange("gap_validation", "education_fields", key, "phd_school_name_gap", e.target.value);
                                                                                                                }}
                                                                                                                name="phd_school_name_gap"
                                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                            />
                                                                                                        </div>
                                                                                                        <div>
                                                                                                            <label>Start Date</label>
                                                                                                            <input
                                                                                                                type="date"
                                                                                                                value={phdSection?.phd_start_date_gap || ''}
                                                                                                                onChange={(e) => {
                                                                                                                    handleEmploymentGapChange("gap_validation", "education_fields", key, "phd_start_date_gap", e.target.value);
                                                                                                                }}
                                                                                                                name="phd_start_date_gap"
                                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                            />
                                                                                                            {errors["phd_start_date_gap"] && <p className="text-red-500 text-sm">{errors["phd_start_date_gap"]}</p>}
                                                                                                        </div>
                                                                                                        <div>
                                                                                                            <label>End Date</label>
                                                                                                            <input
                                                                                                                type="date"
                                                                                                                value={phdSection?.phd_end_date_gap || ''}
                                                                                                                onChange={(e) => {
                                                                                                                    handleEmploymentGapChange("gap_validation", "education_fields", key, "phd_end_date_gap", e.target.value);
                                                                                                                }}
                                                                                                                name="phd_end_date_gap"
                                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                            />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className="mt-2 mb-3">
                                                                                                        <label htmlFor="phd_specialization_gap" className="block text-sm font-medium text-gray-700">Specialization</label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            id="phd_specialization_gap"
                                                                                                            value={phdSection?.phd_specialization_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "phd_specialization_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="phd_specialization_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            );

                                                                                            index++; // Move to the next phd_corespondence_*
                                                                                        }

                                                                                        return elements;
                                                                                    })()
                                                                                }
                                                                                <button type='button' className='bg-[#3e76a5] text-white p-3 rounded-md mt-3' onClick={addCoressPondencePhd}>
                                                                                    Add Correspondence PHD Education
                                                                                </button>

                                                                            </>
                                                                        )
                                                                    }


                                                                    {(annexureData["gap_validation"].highest_education_gap === 'post_graduation' || annexureData["gap_validation"].highest_education_gap === 'phd') && (
                                                                        <>

                                                                            <h3 className="text-lg font-bold py-3">POST GRADUATION</h3>
                                                                            <div className="border border-black p-4 rounded-md">
                                                                                <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                                    <div>
                                                                                        <label>University / Institute Name</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_university_institute_name_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "post_graduation_1", `post_graduation_university_institute_name_gap`, e.target.value)}
                                                                                            name="post_graduation_university_institute_name_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>Course</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_course_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "post_graduation_1", `post_graduation_course_gap`, e.target.value)}
                                                                                            name="post_graduation_course_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>Specialization Major</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_specialization_major_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "post_graduation_1", `post_graduation_specialization_major_gap`, e.target.value)}

                                                                                            name="post_graduation_specialization_major_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>

                                                                                    <div>
                                                                                        <label>Start Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_start_date_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "post_graduation_1", `post_graduation_start_date_gap`, e.target.value)}

                                                                                            name="post_graduation_start_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                        {errors["post_graduation_start_date_gap"] && <p className="text-red-500 text-sm">{errors["post_graduation_start_date_gap"]}</p>}
                                                                                    </div>

                                                                                </div>
                                                                                <div>
                                                                                    <label>End Date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_end_date_gap`] || ''}
                                                                                        onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "post_graduation_1", `post_graduation_end_date_gap`, e.target.value)}
                                                                                        name="post_graduation_end_date_gap"
                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {
                                                                                (() => {
                                                                                    let index = 1;
                                                                                    let elements = [];

                                                                                    while (true) {
                                                                                        const key = `post_graduation_corespondence_${index}`;

                                                                                        if (!annexureData?.gap_validation?.education_fields?.[key]) {

                                                                                            break; // Exit loop if the key is missing
                                                                                        }

                                                                                        const phdSection = annexureData.gap_validation.education_fields[key];


                                                                                        elements.push(
                                                                                            <div className="border border-black  mt-4 p-4 rounded-md">
                                                                                                <h3 className="text-lg font-bold py-3 ">Correspondence POST GRADUATION {index}</h3>
                                                                                                <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                                                    <div>
                                                                                                        <label>University / Institute Name</label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={phdSection?.post_graduation_university_institute_name_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "post_graduation_university_institute_name_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="post_graduation_university_institute_name_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label>Course</label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={phdSection?.post_graduation_course_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "post_graduation_course_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="post_graduation_course_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label>Specialization Major</label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={phdSection?.post_graduation_specialization_major_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "post_graduation_specialization_major_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="post_graduation_specialization_major_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>

                                                                                                    <div>
                                                                                                        <label>Start Date</label>
                                                                                                        <input
                                                                                                            type="date"
                                                                                                            value={phdSection?.post_graduation_start_date_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "post_graduation_start_date_gap", e.target.value);
                                                                                                            }}

                                                                                                            name="post_graduation_start_date_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                        {errors["post_graduation_start_date_gap"] && <p className="text-red-500 text-sm">{errors["post_graduation_start_date_gap"]}</p>}
                                                                                                    </div>

                                                                                                </div>
                                                                                                <div>
                                                                                                    <label>End Date</label>
                                                                                                    <input
                                                                                                        type="date"
                                                                                                        value={phdSection?.post_graduation_end_date_gap || ''}
                                                                                                        onChange={(e) => {
                                                                                                            handleEmploymentGapChange("gap_validation", "education_fields", key, "post_graduation_end_date_gap", e.target.value);
                                                                                                        }}
                                                                                                        name="post_graduation_end_date_gap"
                                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        );


                                                                                        index++; // Move to the next phd_corespondence_*
                                                                                    }


                                                                                    return elements;
                                                                                })()
                                                                            }
                                                                            <button type='button' className='bg-[#3e76a5] text-white p-3 rounded-md mt-3' onClick={addCoressPondencePostGraduation}>
                                                                                Add Correspondence POST GRADUATION Education
                                                                            </button>

                                                                        </>
                                                                    )}



                                                                    {(annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'post_graduation' || annexureData["gap_validation"].highest_education_gap === 'phd') && (
                                                                        <>
                                                                            <h3 className="text-lg font-bold py-3">GRADUATION</h3>
                                                                            <div className="border border-black p-4 rounded-md">
                                                                                <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                                    <div>
                                                                                        <label>University / Institute Name</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_university_institute_name_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "graduation_1", `graduation_university_institute_name_gap`, e.target.value)}
                                                                                            name="graduation_university_institute_name_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>Course</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_course_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "graduation_1", `graduation_course_gap`, e.target.value)}
                                                                                            name="graduation_course_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>Specialization Major</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_specialization_major_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "graduation_1", `graduation_specialization_major_gap`, e.target.value)}

                                                                                            name="graduation_specialization_major_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>

                                                                                    <div>
                                                                                        <label>Start Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_start_date_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "graduation_1", `graduation_start_date_gap`, e.target.value)}

                                                                                            name="graduation_start_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                        {errors["graduation_start_date_gap"] && <p className="text-red-500 text-sm">{errors["graduation_start_date_gap"]}</p>}
                                                                                    </div>

                                                                                </div>
                                                                                <div>
                                                                                    <label>End Date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_end_date_gap`] || ''}
                                                                                        onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "graduation_1", `graduation_end_date_gap`, e.target.value)}
                                                                                        name="graduation_end_date_gap"
                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {
                                                                                (() => {
                                                                                    let index = 1;
                                                                                    let elements = [];

                                                                                    while (true) {
                                                                                        const key = `graduation_corespondence_${index}`;


                                                                                        // Check if the key exists in education_fields
                                                                                        if (!annexureData?.gap_validation?.education_fields?.[key]) {

                                                                                            break; // Exit loop if the key is missing
                                                                                        }

                                                                                        const phdSection = annexureData.gap_validation.education_fields[key];


                                                                                        elements.push(
                                                                                            <div className="border border-black p-4 mt-4 rounded-md">
                                                                                                <h3 className="text-lg font-bold py-3">Correspondence GRADUATION {index}</h3>
                                                                                                <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                                                    <div>
                                                                                                        <label>University / Institute Name</label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={phdSection?.graduation_university_institute_name_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "graduation_university_institute_name_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="graduation_university_institute_name_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label>Course</label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={phdSection?.graduation_course_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "graduation_course_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="graduation_course_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label>Specialization Major</label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={phdSection?.graduation_specialization_major_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "graduation_specialization_major_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="graduation_specialization_major_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>

                                                                                                    <div>
                                                                                                        <label>Start Date</label>
                                                                                                        <input
                                                                                                            type="date"
                                                                                                            value={phdSection?.graduation_start_date_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "graduation_start_date_gap", e.target.value);
                                                                                                            }}

                                                                                                            name="graduation_start_date_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                        {errors["graduation_start_date_gap"] && <p className="text-red-500 text-sm">{errors["graduation_start_date_gap"]}</p>}
                                                                                                    </div>

                                                                                                </div>
                                                                                                <div>
                                                                                                    <label>End Date</label>
                                                                                                    <input
                                                                                                        type="date"
                                                                                                        value={phdSection?.graduation_end_date_gap || ''}
                                                                                                        onChange={(e) => {
                                                                                                            handleEmploymentGapChange("gap_validation", "education_fields", key, "graduation_end_date_gap", e.target.value);
                                                                                                        }}
                                                                                                        name="graduation_end_date_gap"
                                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        );


                                                                                        index++; // Move to the next phd_corespondence_*
                                                                                    }


                                                                                    return elements;
                                                                                })()
                                                                            }
                                                                            <button type='button' className='bg-[#3e76a5] text-white p-3 rounded-md mt-3' onClick={addCoressPondenceGraduation}>
                                                                                Add Correspondence GRADUATION Education
                                                                            </button>

                                                                        </>
                                                                    )}



                                                                    {(annexureData["gap_validation"].highest_education_gap === 'senior_secondary' || annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'phd' || annexureData["gap_validation"].highest_education_gap === 'post_graduation') && (
                                                                        <>
                                                                            <h3 className="text-lg font-bold py-3">SENIOR SECONDARY</h3>
                                                                            <div className="border border-black  p-4 rounded-md">
                                                                                <div className="my-3">
                                                                                    <label>School Name</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={annexureData?.gap_validation?.education_fields?.senior_secondary?.[`senior_secondary_school_name_gap`] || ''}
                                                                                        onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "senior_secondary", `senior_secondary_school_name_gap`, e.target.value)}
                                                                                        name="senior_secondary_school_name_gap"
                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                    />
                                                                                </div>
                                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                    <div>
                                                                                        <label>Start Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData?.gap_validation?.education_fields?.senior_secondary?.[`senior_secondary_start_date_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "senior_secondary", `senior_secondary_start_date_gap`, e.target.value)}
                                                                                            name="senior_secondary_start_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>End Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData?.gap_validation?.education_fields?.senior_secondary?.[`senior_secondary_end_date_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "senior_secondary", `senior_secondary_end_date_gap`, e.target.value)}
                                                                                            name="senior_secondary_end_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            {
                                                                                (() => {
                                                                                    let index = 1;
                                                                                    let elements = [];

                                                                                    while (true) {
                                                                                        const key = `senior_secondary_corespondence_${index}`;


                                                                                        // Check if the key exists in education_fields
                                                                                        if (!annexureData?.gap_validation?.education_fields?.[key]) {

                                                                                            break; // Exit loop if the key is missing
                                                                                        }

                                                                                        const phdSection = annexureData.gap_validation.education_fields[key];


                                                                                        elements.push(
                                                                                            <div className="border border-black mt-4 p-4 rounded-md">
                                                                                                <h3 className="text-lg font-bold py-3">Correspondence SENIOR SECONDARY {index}</h3>

                                                                                                <div className="my-3">
                                                                                                    <label>School Name</label>
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        value={phdSection?.senior_secondary_school_name_gap || ''}
                                                                                                        onChange={(e) => {
                                                                                                            handleEmploymentGapChange("gap_validation", "education_fields", key, "senior_secondary_school_name_gap", e.target.value);
                                                                                                        }}
                                                                                                        name="senior_secondary_school_name_gap"
                                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                                    <div>
                                                                                                        <label>Start Date</label>
                                                                                                        <input
                                                                                                            type="date"
                                                                                                            value={phdSection?.senior_secondary_start_date_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "senior_secondary_start_date_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="senior_secondary_start_date_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label>End Date</label>
                                                                                                        <input
                                                                                                            type="date"
                                                                                                            value={phdSection?.senior_secondary_end_date_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "senior_secondary_end_date_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="senior_secondary_end_date_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );


                                                                                        index++; // Move to the next phd_corespondence_*
                                                                                    }


                                                                                    return elements;
                                                                                })()
                                                                            }
                                                                            <button type='button' className='bg-[#3e76a5] text-white p-3 rounded-md mt-3' onClick={addCoressPondenceSeniorSecondary}>
                                                                                Add Correspondence Senior Secondary Education
                                                                            </button>

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
                                                                                        value={annexureData?.gap_validation?.education_fields?.secondary?.[`secondary_school_name_gap`] || ''}
                                                                                        onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "secondary", `secondary_school_name_gap`, e.target.value)}
                                                                                        name="secondary_school_name_gap"
                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                    />
                                                                                </div>
                                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                    <div>
                                                                                        <label>Start Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData?.gap_validation?.education_fields?.secondary?.[`secondary_start_date_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "secondary", `secondary_start_date_gap`, e.target.value)}
                                                                                            name="secondary_start_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>End Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData?.gap_validation?.education_fields?.secondary?.[`secondary_end_date_gap`] || ''}
                                                                                            onChange={(e) => handleEmploymentGapChange("gap_validation", "education_fields", "secondary", `secondary_end_date_gap`, e.target.value)}
                                                                                            name="secondary_end_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {
                                                                                (() => {
                                                                                    let index = 1;
                                                                                    let elements = [];

                                                                                    while (true) {
                                                                                        const key = `secondary_corespondence_${index}`;


                                                                                        // Check if the key exists in education_fields
                                                                                        if (!annexureData?.gap_validation?.education_fields?.[key]) {

                                                                                            break; // Exit loop if the key is missing
                                                                                        }

                                                                                        const phdSection = annexureData.gap_validation.education_fields[key];


                                                                                        elements.push(
                                                                                            <div className="border border-black p-4 mt-4 rounded-md">
                                                                                                <h3 className="text-lg font-bold py-3">Correspondence SECONDARY {index}</h3>

                                                                                                <div className="my-3">
                                                                                                    <label>School Name</label>
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        value={phdSection?.secondary_school_name_gap || ''}
                                                                                                        onChange={(e) => {
                                                                                                            handleEmploymentGapChange("gap_validation", "education_fields", key, "secondary_school_name_gap", e.target.value);
                                                                                                        }}
                                                                                                        name="secondary_school_name_gap"
                                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                                    <div>
                                                                                                        <label>Start Date</label>
                                                                                                        <input
                                                                                                            type="date"
                                                                                                            value={phdSection?.secondary_start_date_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "secondary_start_date_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="secondary_start_date_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label>End Date</label>
                                                                                                        <input
                                                                                                            type="date"
                                                                                                            value={phdSection?.secondary_end_date_gap || ''}
                                                                                                            onChange={(e) => {
                                                                                                                handleEmploymentGapChange("gap_validation", "education_fields", key, "secondary_end_date_gap", e.target.value);
                                                                                                            }}
                                                                                                            name="secondary_end_date_gap"
                                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );


                                                                                        index++; // Move to the next phd_corespondence_*
                                                                                    }


                                                                                    return elements;
                                                                                })()
                                                                            }
                                                                            <button type='button' className='bg-[#3e76a5] text-white p-3 rounded-md mt-3' onClick={addCoressPondenceSecondary}>
                                                                                Add Correspondence Secondary Education
                                                                            </button>

                                                                        </>
                                                                    )}

                                                                    <div className='flex gap-3 items-center my-2'>
                                                                        <input
                                                                            type="checkbox"
                                                                            name="i_am_fresher"
                                                                            id="i_am_fresher"
                                                                            checked={
                                                                                annexureData["gap_validation"].i_am_fresher === true ||
                                                                                annexureData["gap_validation"].i_am_fresher === "1" ||
                                                                                annexureData["gap_validation"].i_am_fresher === 1
                                                                            }
                                                                            onChange={(e) => handleServiceChange("gap_validation", "i_am_fresher", e.target.checked ? "1" : "0")}
                                                                            className="border rounded-md p-2 capitalize"
                                                                        />
                                                                        <label htmlFor="i_am_fresher" className='font-bold capitalize text-lg'>I am Fresher</label>
                                                                    </div>

                                                                    {/* Conditional Rendering Fix */}
                                                                    {!(annexureData["gap_validation"].i_am_fresher === true ||
                                                                        annexureData["gap_validation"].i_am_fresher === "1" ||
                                                                        annexureData["gap_validation"].i_am_fresher === 1) && (
                                                                            <div className='mt-5'>
                                                                                <label htmlFor="employmentType_gap" className='font-bold'>EMPLOYMENT</label>
                                                                                <div className='mb-3'>
                                                                                    <label htmlFor="years_of_experience_gap">Year's of Experience</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        id="years_of_experience_gap"
                                                                                        name="years_of_experience_gap"
                                                                                        value={annexureData["gap_validation"].years_of_experience_gap || ''}
                                                                                        onChange={(e) => handleServiceChange("gap_validation", "years_of_experience_gap", e.target.value)}
                                                                                        className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label htmlFor="no_of_employment">No of Employment</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        id="no_of_employment"
                                                                                        name="no_of_employment"
                                                                                        value={annexureData["gap_validation"].no_of_employment || ''}
                                                                                        onChange={(e) => handleServiceChange("gap_validation", "no_of_employment", e.target.value)}
                                                                                        className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}



                                                                    {/* Dynamically render Employment Forms based on no_of_employment */}
                                                                    {Array.from({ length: annexureData["gap_validation"].no_of_employment || 0 }, (_, index) => (
                                                                        <div key={index} className='border border-black p-4 rounded-md my-3'>
                                                                            <h3 className="text-lg font-bold pb-3">Employment({index + 1})</h3>
                                                                            <div>
                                                                                <label htmlFor={`employment_type_gap`}>Employment Type</label>
                                                                                <select
                                                                                    type="text"
                                                                                    id={`employment_type_gap`}
                                                                                    name={`employment_type_gap`}
                                                                                    value={annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_type_gap`] || ''}
                                                                                    onChange={(e) => handleEmploymentGapChange("gap_validation", "employment_fields", `employment_${index + 1}`, `employment_type_gap`, e.target.value)}
                                                                                    className="form-control border rounded w-full bg-white p-2 mt-2 mb-2"
                                                                                >
                                                                                    <option value="">Select Your Employment Type</option>
                                                                                    <option value="employed">Employed</option>
                                                                                    <option value="self-employed">Self Employed</option>
                                                                                    <option value="freelancer">Freelancer</option>
                                                                                    <option value="family-business">Family Business</option>
                                                                                </select>
                                                                            </div>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                {/* Start Date Field */}
                                                                                <div>
                                                                                    <label htmlFor={`employment_start_date_gap`}>Start Date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        id={`employment_start_date_gap`}
                                                                                        name={`employment_start_date_gap`}
                                                                                        value={annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_start_date_gap`] || ''}
                                                                                        onChange={(e) => handleEmploymentGapChange("gap_validation", "employment_fields", `employment_${index + 1}`, `employment_start_date_gap`, e.target.value)}
                                                                                        className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                                    />
                                                                                </div>


                                                                                {/* End Date Field */}
                                                                                <div>
                                                                                    <label htmlFor={`employment_end_date_gap`}>End Date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        id={`employment_end_date_gap`}
                                                                                        name={`employment_end_date_gap`}
                                                                                        value={annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_end_date_gap`] || ''}
                                                                                        onChange={(e) => handleEmploymentGapChange("gap_validation", "employment_fields", `employment_${index + 1}`, `employment_end_date_gap`, e.target.value)}
                                                                                        className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                </>
                                                                }



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
                                                                                                                    name={input.name}
                                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                                    onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)}
                                                                                                                />
                                                                                                            )}
                                                                                                            {input.type === 'textarea' && (
                                                                                                                <textarea
                                                                                                                    name={input.name}
                                                                                                                    rows={1}
                                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                                    onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)}
                                                                                                                />
                                                                                                            )}
                                                                                                            {input.type === 'datepicker' && (
                                                                                                                <input
                                                                                                                    type="date"
                                                                                                                    name={input.name}
                                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                                    onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)}
                                                                                                                />
                                                                                                            )}
                                                                                                            {input.type === 'number' && (
                                                                                                                <input
                                                                                                                    type="number"
                                                                                                                    name={input.name}
                                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                                    onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)}
                                                                                                                />
                                                                                                            )}
                                                                                                            {input.type === 'email' && (
                                                                                                                <input
                                                                                                                    type="email"
                                                                                                                    name={input.name}
                                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                                    onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)}
                                                                                                                />
                                                                                                            )}
                                                                                                            {input.type === 'select' && (
                                                                                                                <select
                                                                                                                    name={input.name}
                                                                                                                    value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                                    className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                                    onChange={(e) => handleServiceChange(service.db_table, input.name, e.target.value)}
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
                                                                                                                        name={input.name}
                                                                                                                        multiple
                                                                                                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                                                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none"
                                                                                                                        onChange={(e) => handleFileChange(service.db_table + '_' + input.name, input.name, e)}
                                                                                                                    />

                                                                                                                    {annexureData[service.db_table] && annexureData[service.db_table][input.name] ? (
                                                                                                                        <div className="border p-3 rounded-md mt-4">
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
                                                                                                                                        slidesPerView: 4, // Show 3 images per slide on tablets (optional)
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
                                                                                                                                                        className='md:h-[100px] '
                                                                                                                                                    />
                                                                                                                                                ) : (
                                                                                                                                                    <button onClick={() => window.open(item, '_blank')} type='button'>Open Link</button>
                                                                                                                                                )}
                                                                                                                                            </div>
                                                                                                                                        </SwiperSlide>
                                                                                                                                    );
                                                                                                                                })}
                                                                                                                            </Swiper>
                                                                                                                        </div>
                                                                                                                    ) : (
                                                                                                                        <p><></></p>
                                                                                                                    )}

                                                                                                                </>
                                                                                                            )}

                                                                                                            {input.type === 'checkbox' && (
                                                                                                                <div className="flex items-center space-x-3">
                                                                                                                    <input
                                                                                                                        type="checkbox"
                                                                                                                        name={input.name}
                                                                                                                        checked={
                                                                                                                            ["1", 1, true, "true"].includes(annexureData[service.db_table]?.[input.name] ?? false)
                                                                                                                        } // Check if the value is 1, indicating it is checked
                                                                                                                        value={annexureData[service.db_table]?.[input.name] || ''}  // Set the value to an empty string if no value is found
                                                                                                                        className="h-5 w-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                                                                                        onChange={(e) => {
                                                                                                                            handleCheckboxChange(input.name, e.target.checked, service.db_table);
                                                                                                                            toggleRowsVisibility(serviceIndex, rowIndex, e.target.checked);
                                                                                                                        }}
                                                                                                                    />
                                                                                                                    <span className="text-sm text-gray-700">{input.label}</span>
                                                                                                                </div>
                                                                                                            )}


                                                                                                            {errors[input.name] && <p className="text-red-500 text-sm">{errors[input.name]}</p>}
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
                                                {activeTab === serviceDataMain.length + 2 && (
                                                    <div>
                                                        <div className='mb-6  p-4 rounded-md border bg-white mt-8' >
                                                            <h4 className="md:text-start text-start md:text-xl text-sm my-6 font-bold" > Declaration and Authorization </h4>
                                                            < div className="mb-6" >
                                                                <p className='text-sm' >
                                                                    I hereby authorize GoldQuest Global HR Services Private Limited and its representative to verify information provided in my application for employment and this employee background verification form, and to conduct enquiries as may be necessary, at the company’s discretion.I authorize all persons who may have information relevant to this enquiry to disclose it to GoldQuest Global HR Services Pvt Ltd or its representative.I release all persons from liability on account of such disclosure.
                                                                    I confirm that the above information is correct to the best of my knowledge.I agree that in the event of my obtaining employment, my probationary appointment, confirmation as well as continued employment in the services of the company are subject to clearance of medical test and background verification check done by the company.
                                                                </p>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-6" >


                                                                < div className="form-group" >
                                                                    <label className='text-sm' >Declaration Name < span className='text-red-500' >* </span> </label>
                                                                    < input
                                                                        value={formData.personal_information.name_declaration}
                                                                        onChange={handleChange}
                                                                        type="text"
                                                                        disabled
                                                                        className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                        name="name_declaration"
                                                                    />
                                                                    {errors.name_declaration && <p className="text-red-500 text-sm"> {errors.name_declaration} </p>}
                                                                </div>


                                                                < div className="form-group" >
                                                                    <label className='text-sm' >Declaration Date < span className='text-red-500' >* </span></label >
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


                                                                {
                                                                    cefDataApp.signature && (
                                                                        isImage(cefDataApp.signature) ? (
                                                                            // If it's an image, display it
                                                                            <div className='border rounded-md p-2 mt-3'>
                                                                                <img
                                                                                    src={cefDataApp.signature || "NO IMAGE FOUND"}
                                                                                    alt="Signature"
                                                                                    className='object-contain p-3'
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            // If it's not an image, show a clickable link (view document)
                                                                            <div className='mt-2'>
                                                                                <a
                                                                                    href={cefDataApp.signature}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-blue-500 "
                                                                                >
                                                                                    View Signature Document
                                                                                </a>
                                                                            </div>
                                                                        )
                                                                    )
                                                                }



                                                            </div>
                                                        </div>




                                                        <div className="bg-white rounded-md border md:p-4">
                                                            < h5 className="md:text-start text-start text-lg mt-6 mb-2 font-bold" > Documents(Mandatory) </h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4  p-1">
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

                                                            <p className='md:text-start text-start text-sm mt-4 ' >
                                                                NOTE: If you experience any issues or difficulties with submitting the form, please take screenshots of all pages, including attachments and error messages, and email them to < a href="mailto:onboarding@goldquestglobal.in" > onboarding@goldquestglobal.in</a> . Additionally, you can reach out to us at <a href="mailto:onboarding@goldquestglobal.in">onboarding@goldquestglobal.in</a > .
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex space-x-4 mt-6">
                                                <button
                                                    onClick={(e) => handleSubmit(0, e)} // Pass 0 when Save is clicked
                                                    className="px-6 py-2 bg-[#3e76a5] text-white rounded-md hover:bg-[#3e76a5]"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        if (activeTab === serviceDataMain.length + 2) {
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
                                                    {activeTab === serviceDataMain.length + 2 ? 'Submit' : 'Next'} {/* Change button text based on the active tab */}
                                                </button>
                                                {activeTab > 0 && (
                                                    <button
                                                        type='button'
                                                        onClick={handleBack} // Call the handleBack function when the button is clicked
                                                        className="px-6 py-2 text-gray-500 bg-gray-200 rounded-md hover:bg-gray-300"
                                                    >
                                                        Go Back
                                                    </button>
                                                )}
                                            </div>
                                        </div>




                                    </div >
                                )

                            }
                        </div >
                    )}
        </>

    );
};

export default BackgroundForm;
