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

    // Update the state with the new employment fields
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
        calculateGaps();
        validateDate();
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
        if (!annexureData) {
            setAnnexureData(initialAnnexureData);
        }
        calculateGaps();
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
    const [isDuplicateInProgress, setIsDuplicateInProgress] = useState(false);
    const duplicateRow = (serviceIndex, rowIndex, row, isInitialDuplication = true, inputIndex = 1) => {
        // Ensure serviceDataMain exists and is structured correctly
        if (!serviceDataMain || !Array.isArray(serviceDataMain)) {
            return;
        }

        // Retrieve the correct service data object
        const service = serviceDataMain[serviceIndex];
        if (!service || !service.rows) {
            return;
        }

        const targetRowClasses = row.inputs[0]?.['data-target']?.row?.class || [];
        if (!Array.isArray(targetRowClasses) || targetRowClasses.length === 0) {
            // console.error("No valid target row classes found in the button data");
            return;
        }

        const matchingRows = service.rows.filter((serviceRow) => {
            return targetRowClasses.some(className => serviceRow.class && serviceRow.class.includes(className));
        });

        if (matchingRows.length === 0) {
            return;
        }

        // Track the maximum input index across all rows
        let existingInputNames = new Set(); // Track already existing input names

        service.rows.forEach((row) => {
            row.inputs.forEach((input) => {
                const match = input.name.match(/_(\d+)$/); // Check for the trailing number in input name
                if (match) {
                    const currentIndex = parseInt(match[1], 10);
                    existingInputNames.add(input.name); // Track this name as already existing
                    inputIndex = Math.max(inputIndex, currentIndex + 1);  // Update the max inputIndex
                }
            });
        });

        // Set the next available index for rows (this is row-wise)
        let maxIndex = 0;
        service.rows.forEach((row) => {
            const match = row.class?.match(/row-(\d+)/); // Match row-<number>
            if (match) {
                const currentIndex = parseInt(match[1], 10);
                maxIndex = Math.max(maxIndex, currentIndex); // Get the highest index
            }
        });

        let rowIndexToUse = maxIndex + 1;

        const newRows = matchingRows.map((matchingRow) => {
            const newRow = {
                ...matchingRow,  // Copy the properties from the matched row
                class: `row-${rowIndexToUse}`, // Add the next available index to the outer row class
                inputs: matchingRow.inputs.map((input) => {
                    let newInputName = `${input.name.replace(/_\d+$/, '')}_${inputIndex}`;

                    // If the input name already exists (from previous duplications), adjust the index
                    while (existingInputNames.has(newInputName)) {
                        inputIndex++; // Increment index until the name is unique
                        newInputName = `${input.name.replace(/_\d+$/, '')}_${inputIndex}`;
                    }

                    existingInputNames.add(newInputName); // Add the new input name to the set

                    return {
                        ...input,
                        name: newInputName, // Update the name with the current input index
                        value: isInitialDuplication ? (annexureData[service.db_table]?.[input.name] || input.value || '') : '', // Reset value for subsequent duplications
                    };
                }),
            };

            rowIndexToUse++; // Increment rowIndexToUse to ensure the rows are in order
            return newRow;
        });

        const buttonRowIndex = service.rows.findIndex(row => row.inputs.some(input => input.type === "button"));
        if (buttonRowIndex === -1) {
            // console.error("Button row not found");
            return;
        }

        const updatedRows = [
            ...service.rows.slice(0, buttonRowIndex),
            ...newRows,
            ...service.rows.slice(buttonRowIndex),
        ];

        const updatedServiceData = [...serviceDataMain];
        updatedServiceData[serviceIndex] = {
            ...service,
            rows: updatedRows,
        };
        setServiceDataMain(updatedServiceData);  // Update the state with the new rows

        // Log the duplicated rows inputs for debugging
        newRows.forEach(newRow => {
            newRow.inputs.forEach(input => {
            });
        });

        // Now, update annexureData for the new duplicated rows
        newRows.forEach((newRow) => {
            newRow.inputs.forEach((input) => {
                const fieldValue = annexureImageData.find(data => data && data.hasOwnProperty(input.name));
                const newValue = fieldValue ? fieldValue[input.name] : input.value || "  ";

                // Update annexureData for the new duplicated input
                setAnnexureData((prevData) => {
                    const updatedData = {
                        ...prevData,
                        [service.db_table]: {
                            ...prevData[service.db_table],
                            [input.name]: newValue,
                        },
                    };

                    return updatedData;
                });
            });
        });

        // Check if the newly duplicated row is filled, and if it is, trigger duplication again (with empty values for the original row)
        if (isInitialDuplication) {
            const rowsToDuplicate = service.rows.filter((row) => {
                return row.inputs.some(input => input['data-target']);
            });

            rowsToDuplicate.forEach((originalRow) => {
                const isRowFilled = originalRow.inputs.every(input => input.value !== ''); // Check if all inputs have values

                if (isRowFilled) {

                    // Create an empty duplicate of the original row (reset input values)
                    const emptyRow = {
                        ...originalRow,
                        inputs: originalRow.inputs.map(input => ({
                            ...input,
                            value: '',  // Reset the value to empty
                        })),
                    };

                    // Increment the inputIndex for the next duplication
                    duplicateRow(serviceIndex, rowIndex, emptyRow, false, inputIndex + 1);
                }
            });
        }
    };


    useEffect(() => {
        const duplicateRowsIfNeeded = () => {
            setIsDuplicateInProgress(true);

            serviceDataMain.forEach((service, serviceIndex) => {
                if (!service || !service.rows) {
                    return;
                }

                const serviceHasDuplicateRow = service.rows.some((row) => {
                    return row.inputs.some(input => input['data-action'] === 'duplicate');
                });

                if (serviceHasDuplicateRow) {
                    const rowsToDuplicate = service.rows.filter((row) => {
                        return row.inputs.some(input => input['data-action'] === 'duplicate');
                    });

                    rowsToDuplicate.forEach((mainRow, rowIndex) => {
                        const isRowFilled = mainRow.inputs.every(input => {
                            const inputVal = annexureData[service.db_table]?.[input.name] || '';
                            return inputVal !== ''; // Ensure the row is filled
                        });

                        // Case 1: First-time duplicate (row is filled and not duplicated yet)
                        if (isRowFilled && !mainRow.isNewlyDuplicated) {
                            mainRow.isNewlyDuplicated = true;
                            duplicateRow(serviceIndex, rowIndex, mainRow); // Duplicate the row

                            // Check if the newly created row is filled and duplicate again if so
                            const newRow = service.rows.find(r => r.class === mainRow.class);
                            if (newRow) {
                                const isNewRowFilled = newRow.inputs.every(input => input.value !== '');
                                if (isNewRowFilled) {
                                    duplicateRow(serviceIndex, rowIndex, mainRow); // Duplicate again
                                }
                            }
                        } else if (isRowFilled && mainRow.isNewlyDuplicated) {
                        } else if (!isRowFilled && mainRow.isNewlyDuplicated) {
                            mainRow.isNewlyDuplicated = false;
                        }
                    });
                }
            });
        };

        duplicateRowsIfNeeded();
    }, [serviceDataMain, annexureData, isDuplicateInProgress]);

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
                            declaration_date: cefData?.declaration_date || formData.declaration_date,
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
                            name_declaration: cefData?.name_declaration || formData.name_declaration,
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

                    setServiceDataImageInputNames(fileInputs);
                    setServiceDataMain(allJsonData);

                } else {
                    // Application does not exist or other error: Hide the form and show an alert
                    const form = document.getElementById('bg-form');
                    if (form) {
                        console.log(`Form Removed`);
                        form.remove();
                    } else {
                        console.log(`Form not found`);
                    }
                    setApiStatus(false);

                    Swal.fire({
                        title: 'Notice',
                        text: result.message || 'Application does not exist.',
                        icon: 'warning',
                        confirmButtonText: 'OK',
                        allowOutsideClick: false,  // Disable side clicks
                        allowEscapeKey: false,    // Disable escape key to close
                        preConfirm: () => {
                            // Prevent the modal from closing when the OK button is clicked
                            return false;  // This will stop the modal from closing
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


    const renderGapMessage = (gap) => {
        if (gap?.years > 0 || gap?.months > 0) {
            return (
                <p style={{ color: 'red' }}>
                    Gap between Post Graduation and PhD: {gap?.years} years, {gap?.months} months
                </p>
            );
        }
        return (
            <p style={{ color: 'green' }}>
                No Gap between Post Graduation and PhD
            </p>
        );
    };
    const renderGapMessage1 = (employmentGaps) => {
        // Check if there are no employment gaps
        if (!employmentGaps || employmentGaps.length === 0) {
            return <p>No employment gaps available.</p>;
        }

        // Map through employment gaps and render them
        return employmentGaps.map((gap, index) => {
            return (
                <div key={index}>
                    <p>
                        Gap {index + 1}:
                        {gap.years > 0 ? `${gap.years} years` : ""}
                        {gap.months > 0 ? `${gap.months} months` : ""}
                        {gap.years === 0 && gap.months === 0 ? "No gap" : ""}
                    </p>
                </div>
            );
        });
    };


    const validate = () => {

        console.log(`Validate Function Started`);
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

        console.log(`service - `, service);

        // Loop through the rows to validate files and fields
        service.rows.forEach((row, rowIndex) => {
            // Check if any of the checkboxes 'done_or_not' or 'has_not_done' is checked for this row
            const shouldSkipServiceValidation = service.rows.some(row => {
                console.log("Processing row:", row); // Log each row

                return row.inputs.some(input => {
                    console.log("Processing input:", input); // Log each input

                    const startsWithCondition = input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done');
                    console.log("startsWithCondition:", startsWithCondition); // Log the startsWithCondition check

                    const annexureDataCondition = annexureData[service.db_table]?.[input.name];
                    console.log("annexureDataCondition:", annexureDataCondition); // Log the annexureData condition value

                    if (
                        annexureDataCondition === null ||
                        annexureDataCondition === undefined ||
                        (typeof annexureDataCondition === 'string' && annexureDataCondition.trim() === '')
                        || annexureDataCondition == 0 || !annexureDataCondition
                    ) {
                        console.log("annexureDataCondition is null, undefined, or empty string. Skipping...");
                        return false;
                    }

                    const finalCondition = input.type === 'checkbox' &&
                        startsWithCondition &&
                        annexureDataCondition;

                    console.log("Final Condition for input:", input.name, "=>", finalCondition); // Log the final condition evaluation

                    return finalCondition;
                });
            });

            console.log("shouldSkipServiceValidation:", shouldSkipServiceValidation); // Log final result



            // Log the checkbox validation
            console.log(`shouldSkipServiceValidation - `, shouldSkipServiceValidation);

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

                    // Log the mapping and annexure data map
                    console.log('Created File Name:', createdFileName);
                    console.log('Annexure Images Map:', annexureImagesMap);
                    console.log('Annexure Images files:', files);

                    const validateFile = (fileName) => {
                        let fileErrors = [];

                        console.log('Validating file:', fileName);

                        // Check if createdFileName is valid and the structure exists in 'files'
                        let filesToCheck = createdFileName && files[createdFileName]
                            ? files[createdFileName][fileName]
                            : undefined;

                        console.log('Step 1 - filesToCheck from files object:', filesToCheck);

                        if (!filesToCheck) {
                            console.log('Step 2 - filesToCheck is empty, checking annexureImagesMap');

                            filesToCheck = annexureImagesMap && annexureImagesMap[fileName]
                                ? (annexureImagesMap[fileName] || undefined)  // Ensures empty values are treated as undefined
                                : undefined;

                            console.log('Step 3 - filesToCheck from annexureImagesMap:', filesToCheck);
                        }


                        if (typeof filesToCheck === "string" && filesToCheck.trim() !== "" ||
                            (Array.isArray(filesToCheck) && filesToCheck.length > 0)) {
                            console.log("filesToCheck has a valid value:", filesToCheck);
                        } else {
                            filesToCheck = undefined;
                        }


                        // Log the file check process
                        console.log('Files to Check for', fileName, ':', filesToCheck);

                        // If the file exists in annexureImageData, skip validation for this file
                        if (filesToCheck && annexureImagesMap[fileName]) {
                            console.log(`${fileName} is in annexureImageData, skipping validation. 1`);
                            delete newErrors[fileName]; // Clear any previous error for this file
                            return fileErrors; // No errors for already uploaded files
                        }

                        // Handle the scenario where the checkbox is unchecked but files are still present in the structure
                        if (!annexureData[service.db_table]?.[input.name] && filesToCheck && filesToCheck.length > 0) {
                            console.log('Files present but checkbox unchecked, clearing error for:', fileName);
                            delete newErrors[fileName]; // Clear error if files are found
                        }

                        // If the checkbox is unchecked and no files are present, add an error
                        if (!filesToCheck || (!annexureData[service.db_table]?.[input.name] && (!filesToCheck || filesToCheck.length === 0))) {
                            console.log(`Error: ${fileName} is required.`);
                            fileErrors.push(`${fileName} is required.`);
                        }

                        // If files exist for the input, perform file validation
                        if (filesToCheck && filesToCheck.length > 0) {
                            filesToCheck.forEach((fileItem) => {
                                // Log each file being checked
                                console.log('Validating file:', fileItem.name);

                                // Validate file size
                                if (fileItem.size > maxSize) {
                                    console.log(`Error: ${fileItem.name} exceeds size limit.`);
                                    fileErrors.push(`${fileItem.name}: File size must be less than 2MB.`);
                                }

                                // Validate file type
                                if (!allowedTypes.includes(fileItem.type)) {
                                    console.log(`Error: ${fileItem.name} has invalid type.`);
                                    fileErrors.push(`${fileItem.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
                                }
                            });
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
                        console.log(`Field ${input.name} is empty, setting error.`);
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

    // const validate = () => {
    //     const maxSize = 2 * 1024 * 1024; // 2MB size limit
    //     const allowedTypes = [
    //         "image/jpeg", "image/png", "application/pdf",
    //         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    //         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    //     ]; // Allowed file types

    //     let newErrors = {}; // Object to store errors
    //     const service = serviceDataMain[activeTab - 2];
    //     if (service.db_table == 'gap_validation') {
    //         return {}; // Skip validation for gap_validation service
    //     }

    //     // Loop through the rows to validate files and fields
    //     service.rows.forEach((row, rowIndex) => {
    //         // Check if any of the checkboxes 'done_or_not' or 'has_not_done' is checked for this row
    //         const shouldSkipServiceValidation = service.rows.some(row =>

    //             row.inputs.some(input =>
    //                 input.type === 'checkbox' &&
    //                 (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done')) &&
    //                 annexureData[service.db_table]?.[input.name] // Log for each checkbox
    //             )
    //         );

    //         // Log the checkbox validation
    //         console.log('shouldSkipServiceValidation:', shouldSkipServiceValidation);

    //         if (shouldSkipServiceValidation) {
    //             return {}; // Skip all validation for this service and return empty errors
    //         }

    //         row.inputs.forEach((input, inputIndex) => {
    //             // Log to check if we should skip validation for this input
    //             console.log('Validating input:', input);

    //             // Skip validation for this input if the row was skipped due to checkbox being checked
    //             if (shouldSkipServiceValidation) {
    //                 return;
    //             }

    //             if (input.type === 'file') {
    //                 const fileName = input.name;

    //                 const mapping = serviceDataImageInputNames.find(entry => entry[fileName]);
    //                 const createdFileName = mapping ? mapping[fileName] : undefined;
    //                 const annexureImagesMap = annexureImageData.reduce((acc, item) => {
    //                     Object.keys(item).forEach((key) => {
    //                         if (createdFileName) {
    //                             acc[key] = item[key]; // Store the file URL by the field name
    //                         }
    //                     });
    //                     return acc;
    //                 }, {});

    //                 // Log the mapping and annexure data map
    //                 console.log('Created File Name:', createdFileName);
    //                 console.log('Annexure Images Map:', annexureImagesMap);

    //                 const validateFile = (fileName) => {
    //                     let fileErrors = [];

    //                     // Check if createdFileName is valid and the structure exists in 'files'
    //                     const filesToCheck = createdFileName && files[createdFileName] ? files[createdFileName][fileName] : undefined;

    //                     // Log the file check process
    //                     console.log('Files to Check for', fileName, ':', filesToCheck);

    //                     // If the file exists in annexureImageData, skip validation for this file
    //                     if (annexureImagesMap[fileName]) {
    //                         console.log(`${fileName} is in annexureImageData, skipping validation.`);
    //                         delete newErrors[fileName]; // Clear any previous error for this file
    //                         return fileErrors; // No errors for already uploaded files
    //                     }

    //                     // Handle the case where the checkbox is unchecked, but files are still present in the structure
    //                     if (!annexureData[service.db_table]?.[input.name] && filesToCheck && filesToCheck.length > 0) {
    //                         console.log('Files found but checkbox is unchecked, clearing error for:', fileName);
    //                         delete newErrors[fileName]; // Clear error if files are found
    //                     }

    //                     // If the checkbox is unchecked and no files are present, add an error
    //                     if (!annexureData[service.db_table]?.[input.name] && (!filesToCheck || filesToCheck.length === 0)) {
    //                         console.log(`Error: ${fileName} is required.`);
    //                         fileErrors.push(`${fileName} is required.`);
    //                     }

    //                     // If files exist for the input, perform file validation
    //                     if (filesToCheck && filesToCheck.length > 0) {
    //                         filesToCheck.forEach((fileItem) => {
    //                             // Log each file being checked
    //                             console.log('Validating file:', fileItem.name);

    //                             // Validate file size
    //                             if (fileItem.size > maxSize) {
    //                                 console.log(`Error: ${fileItem.name} exceeds size limit.`);
    //                                 fileErrors.push(`${fileItem.name}: File size must be less than 2MB.`);
    //                             }

    //                             // Validate file type
    //                             if (!allowedTypes.includes(fileItem.type)) {
    //                                 console.log(`Error: ${fileItem.name} has invalid type.`);
    //                                 fileErrors.push(`${fileItem.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
    //                             }
    //                         });
    //                     }

    //                     return fileErrors;
    //                 };

    //                 const fileErrors = validateFile(fileName);

    //                 // Ensure errors[fileField] is always an array
    //                 if (!Array.isArray(newErrors[fileName])) {
    //                     newErrors[fileName] = []; // Initialize it as an array if not already
    //                 }

    //                 // If there are file errors, push them to newErrors
    //                 if (fileErrors.length > 0) {
    //                     newErrors[fileName] = [...newErrors[fileName], ...fileErrors];
    //                 } else {
    //                     // If no errors and files were selected, clear any previous errors
    //                     delete newErrors[fileName];
    //                 }
    //             }
    //         });
    //     });

    //     // Log the errors at the end of validation
    //     if (Object.keys(newErrors).length > 0) {
    //         console.log('Validation Errors:', newErrors);
    //     } else {
    //         console.log('No validation errors.');
    //     }

    //     return newErrors; // Return the accumulated errors
    // };


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

        // Validate based on the active tab
        console.log("Active Tab:", activeTab);
        console.log(`serviceDataMain.length - `, serviceDataMain.length);

        if (activeTab === 0) {
            console.log("Validating first tab...");
            validationErrors = validate1(); // Validation for the first tab
        } else if (activeTab === 1) {
            console.log("Validating second tab...");
            validationErrors = validateSec(); // Validation for the second tab
        } else if (activeTab > 0 && activeTab <= (serviceDataMain.length + 2)) {
            console.log("Validating service-related tab:", activeTab);
            console.log(`serviceDataMain - `, serviceDataMain);
            // Iterate over serviceDataMain for the rows to toggle visibility
            serviceDataMain[activeTab - 2].rows.forEach((row, rowIndex) => {
                console.log(`Processing row ${rowIndex} in activeTab ${activeTab - 2}:`, row);

                const checkboxInput = row.inputs.find(input => input.type === 'checkbox');
                console.log("Found checkbox input:", checkboxInput);

                const checkboxName = checkboxInput?.name;
                console.log("Checkbox input name:", checkboxName);

                const annexureValue = annexureData[serviceDataMain[activeTab - 2].db_table]?.[checkboxName] ?? false;
                console.log("Annexure value:", annexureValue);

                const isChecked = ["1", 1, true, "true"].includes(annexureValue);
                console.log("Is checked:", isChecked);

                toggleRowsVisibility(activeTab - 2, rowIndex, isChecked);
            });

            console.log("Validating service-related tabs...");
            validationErrors = validate(); // Validation for service-related tabs
        } else if (activeTab === serviceDataMain.length + 2) {
            console.log("Validating last tab...");
            validationErrors = validate2(); // Validation for the last tab
        }

        console.log("Final Validation Errors:", validationErrors);

        // Check if there are no validation errors
        if (Object.keys(validationErrors).length === 0) {
            setErrors({}); // Clear any previous errors

            // If there are no errors and the active tab is not the last one, move to the next tab
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
                    if (fileItem.size > maxSize) {
                        fileErrors.push(`${fileItem.name}: File size must be less than 2MB.`);
                    }

                    if (!allowedTypes.includes(fileItem.type)) {
                        fileErrors.push(`${fileItem.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
                    }
                });
            } else if (file && file.size) {
                // Single file uploaded
                if (file.size > maxSize) {
                    fileErrors.push(`${file.name}: File size must be less than 2MB.`);
                }

                if (!allowedTypes.includes(file.type)) {
                    fileErrors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
                }
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

                    // Validate the file type
                    if (!file.name.match(/\.(pdf|docx|doc|jpg|jpeg|png)$/i)) {
                        resumeFileErrors.push('Invalid file type. Please upload a PDF, DOCX, or image file.');
                    }

                    // Validate file size (example: 5MB max)
                    if (file.size > 5 * 1024 * 1024) {
                        resumeFileErrors.push('File size exceeds the limit of 5MB.');
                    }

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
            "current_prominent_landmark", "permanent_prominent_landmark", "current_address_stay_to", "permanent_address_stay_to",
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

    const handleTabClick = (heading) => {
        setActiveTab(heading);
    };

    useEffect(() => {
        fetchApplicationStatus();
    }, []);


    useEffect(() => {
        const currentDate = new Date().toISOString().split('T')[0];
        setFormData((prevData) => ({
            ...prevData,
            personal_information: {
                ...prevData.personal_information,
                declaration_date: currentDate,
            },
        }));
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

    const handleSubmit = async (custombgv, e) => {
        e.preventDefault();

        const fileCount = Object.keys(files).length;
        const TotalApiCalls = fileCount + 1;
        const dataToSubmitting = 100 / TotalApiCalls;

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

    console.log('errors', errors)

    const uploadCustomerLogo = async (cef_id, fileCount, custombgv) => {
        if (custombgv == 1) {
            setLoading(false);
            return;
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
                loadingData ? (
                    <div className='flex justify-center items-center py-6 ' >
                        <PulseLoader color="#36D7B7" loading={loadingData} size={15} aria-label="Loading Spinner" />
                    </div >
                ) :
                    (

                        <div id="bg-form">

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
                                                        <div className="mt-4 text-center text-lg font-semibold text-green-600">
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
                                                        onClick={() => handleTabClick(0)} // Navigate to tab 0 (Personal Information)
                                                        disabled={false} // Always enable the first tab
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
                                                        onClick={() => handleTabClick(1)} // Navigate to tab 1 (Current/Permanent Address)
                                                        disabled={activeTab == 0} // Enable only when on step 1
                                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
    ${activeTab === 1 ? "text-green-500" : "text-gray-700"}`} // Text color changes based on tab active status
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
                                                {serviceDataMain.map((service, index) => {
                                                    const isTabEnabled = activeTab > index + 1;
                                                    return (
                                                        <div key={index} className="text-center flex items-end gap-2">
                                                            <button
                                                                disabled={!isTabEnabled} // Disable tab if it's not the current step
                                                                className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
                                ${activeTab === index + 2 ? "text-green-500" : (isTabEnabled ? "text-gray-700" : "text-gray-400")}`}
                                                                onClick={() => handleTabClick(index + 2)} // Navigate to the tab when clicked
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
                                                        onClick={() => handleTabClick(serviceDataMain.length + 2)} // Set tab to the last one (declaration)
                                                        disabled={activeTab !== serviceDataMain.length + 2} // Disable until all previous steps are completed
                                                        className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
    ${activeTab === serviceDataMain.length + 2 ? "text-green-500" : "text-gray-400"}`} // Text color changes based on tab active status
                                                    >
                                                        <FaCheckCircle
                                                            className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
      ${activeTab === serviceDataMain.length + 2 ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`} // Icon color changes based on active tab
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
                                                                    <p className="text-gray-500 text-sm mt-2" >
                                                                        Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                                    </p>
                                                                    {cefDataApp.resume_file && (
                                                                        <div className='md:h-20 md:w-20 border rounded-md'><img src={cefDataApp.resume_file || "NO IMAGE FOUND"} className='h-full w-full object-contain p-3' alt="NO IMAGE FOUND" /></div>
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
                                                                    onChange={(e) => handleFileChange("applications_govt_id", "govt_id", e)}
                                                                    multiple // Allow multiple file selection
                                                                    ref={(el) => (refs.current["applications_govt_id"] = el)} // Attach ref here
                                                                />
                                                                {errors.govt_id && <p className="text-red-500 text-sm" > {errors.govt_id} </p>}
                                                                <p className="text-gray-500 text-sm mt-2" >
                                                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                                </p>
                                                                <div className='md:grid grid-cols-5 gap-3'>

                                                                    {cefDataApp.govt_id ? (
                                                                        cefDataApp.govt_id.split(',').map((item, index) => {
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
                                                                            <div className='md:grid grid-cols-5 gap-3'>
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
                                                                                    Aadhar Card Image <span className='text-red-500 text-lg'>*</span>
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
                                                                                <p className="text-gray-500 text-sm mt-2">
                                                                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed. Max file size: 2MB.
                                                                                </p>
                                                                                {cefDataApp.aadhar_card_image && (
                                                                                    <div className='md:h-20 md:w-20 border rounded-md'><img src={cefDataApp.aadhar_card_image || "NO IMAGE FOUND"} className='h-full w-full object-contain p-3' alt="NO IMAGE FOUND" /></div>

                                                                                )}

                                                                            </div>
                                                                        </>
                                                                    )
                                                                }
                                                            </div>
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
                                                                        <p className="text-gray-500 text-sm mt-2" >
                                                                            Only JPG, PNG, PDF, DOCX, and XLSX files are allowed.Max file size: 2MB.
                                                                        </p>
                                                                        {cefDataApp.pan_card_image && (
                                                                            <div className='md:h-20 md:w-20 border rounded-md'><img src={cefDataApp.pan_card_image || "NO IMAGE FOUND"} className='h-full w-full object-contain p-3' alt="NO IMAGE FOUND" /></div>

                                                                        )}
                                                                    </div>
                                                                )}



                                                            </div>
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
                                                                        <label className='text-sm' htmlFor="permanent_address_stay_to" > Current Address Stay No.< span className="text-red-500 text-lg" >* </span></label >
                                                                        <input
                                                                            onChange={handleChange}
                                                                            value={formData.personal_information.permanent_address_stay_to}
                                                                            type="text"
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                            id="permanent_address_stay_to"
                                                                            name="permanent_address_stay_to"
                                                                            ref={(el) => (refs.current["permanent_address_stay_to"] = el)} // Attach ref here

                                                                        />
                                                                        {errors.permanent_address_stay_to && <p className="text-red-500 text-sm" > {errors.permanent_address_stay_to} </p>}
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
                                                                {service.db_table == "gap_validation" && <><label for="highest_education" className='font-bold'>Your Highest Education:</label>
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
                                                                    {annexureData["gap_validation"].highest_education_gap === 'phd' && (
                                                                        <>
                                                                            <h3 className="text-lg font-bold py-3">PHD</h3>
                                                                            <div className=' border border-black p-4 rounded-md'>
                                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                    <div>
                                                                                        <label>Institute Name</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData["gap_validation"].phd_institute_name_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "phd_institute_name_gap", e.target.value)}
                                                                                            name="phd_institute_name_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>School Name</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData["gap_validation"].phd_school_name_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "phd_school_name_gap", e.target.value)}
                                                                                            name="phd_school_name_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>Start Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData["gap_validation"].phd_start_date_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "phd_start_date_gap", e.target.value)}
                                                                                            name="phd_start_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                        {errors["phd_start_date_gap"] && <p className="text-red-500 text-sm">{errors["phd_start_date_gap"]}</p>}
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>End Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData["gap_validation"].phd_end_date_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "phd_end_date_gap", e.target.value)}
                                                                                            name="phd_end_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mt-2 mb-3">
                                                                                    <label>Specialization</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={annexureData["gap_validation"].phd_specialization_gap || ''}
                                                                                        onChange={(e) => handleServiceChange("gap_validation", "phd_specialization_gap", e.target.value)}
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
                                                                            <div className="border border-black p-4 rounded-md">
                                                                                <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                                    <div>
                                                                                        <label>University / Institute Name</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData["gap_validation"].post_graduation_university_institute_name_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "post_graduation_university_institute_name_gap", e.target.value)}
                                                                                            name="post_graduation_university_institute_name_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>Course</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData["gap_validation"].post_graduation_course_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "post_graduation_course_gap", e.target.value)}
                                                                                            name="post_graduation_course_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>Specialization Major</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData["gap_validation"].post_graduation_specialization_major_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "post_graduation_specialization_major_gap", e.target.value)}
                                                                                            name="post_graduation_specialization_major_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>

                                                                                    <div>
                                                                                        <label>Start Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData["gap_validation"].post_graduation_start_date_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "post_graduation_start_date_gap", e.target.value)}
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
                                                                                        value={annexureData["gap_validation"].post_graduation_end_date_gap || ''}
                                                                                        onChange={(e) => handleServiceChange("gap_validation", "post_graduation_end_date_gap", e.target.value)}
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
                                                                            <div className="border border-black p-4 rounded-md">
                                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                    <div>
                                                                                        <label>University / Institute Name</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData["gap_validation"].graduation_university_institute_name_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "graduation_university_institute_name_gap", e.target.value)}
                                                                                            name="graduation_university_institute_name_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>Course</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData["gap_validation"].graduation_course_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "graduation_course_gap", e.target.value)}
                                                                                            name="graduation_course_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>Specialization Major</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={annexureData["gap_validation"].graduation_specialization_major_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "graduation_specialization_major_gap", e.target.value)}
                                                                                            name="graduation_specialization_major_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>

                                                                                    <div>
                                                                                        <label>Start Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData["gap_validation"].graduation_start_date_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "graduation_start_date_gap", e.target.value)}
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
                                                                                        value={annexureData["gap_validation"].graduation_end_date_gap || ''}
                                                                                        onChange={(e) => handleServiceChange("gap_validation", "graduation_end_date_gap", e.target.value)}
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
                                                                                        value={annexureData["gap_validation"].senior_secondary_school_name_gap || ''}
                                                                                        onChange={(e) => handleServiceChange("gap_validation", "senior_secondary_school_name_gap", e.target.value)}
                                                                                        name="senior_secondary_school_name_gap"
                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                    />
                                                                                </div>
                                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                    <div>
                                                                                        <label>Start Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData["gap_validation"].senior_secondary_start_date_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "senior_secondary_start_date_gap", e.target.value)}
                                                                                            name="senior_secondary_start_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>End Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData["gap_validation"].senior_secondary_end_date_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "senior_secondary_end_date_gap", e.target.value)}
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
                                                                                        value={annexureData["gap_validation"].secondary_school_name_gap || ''}
                                                                                        onChange={(e) => handleServiceChange("gap_validation", "secondary_school_name_gap", e.target.value)}
                                                                                        name="secondary_school_name_gap"
                                                                                        className="p-2 border w-full border-gray-300 rounded-md"
                                                                                    />
                                                                                </div>
                                                                                <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                    <div>
                                                                                        <label>Start Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData["gap_validation"].secondary_start_date_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "secondary_start_date_gap", e.target.value)}
                                                                                            name="secondary_start_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label>End Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={annexureData["gap_validation"].secondary_end_date_gap || ''}
                                                                                            onChange={(e) => handleServiceChange("gap_validation", "secondary_end_date_gap", e.target.value)}
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

                                                                    {/* Dynamically render Employment Forms based on no_of_employment */}
                                                                    {Array.from({ length: annexureData["gap_validation"].no_of_employment || 0 }, (_, index) => (
                                                                        <div key={index} className='border border-black p-4 rounded-md my-3'>
                                                                            <h3 className="text-lg font-bold pb-3">Employment({index + 1})</h3>
                                                                            <div>
                                                                                <label htmlFor={`employment_type_gap_${index + 1}`}>Employment Type</label>
                                                                                <input
                                                                                    type="text"
                                                                                    id={`employment_type_gap_${index + 1}`}
                                                                                    name={`employment_type_gap_${index + 1}`}
                                                                                    value={annexureData["gap_validation"]?.[`employment_type_gap_${index + 1}`] || ''}
                                                                                    onChange={(e) => handleServiceChange("gap_validation", `employment_type_gap_${index + 1}`, e.target.value)}
                                                                                    className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                {/* Start Date Field */}
                                                                                <div>
                                                                                    <label htmlFor={`employment_start_date_gap_${index + 1}`}>Start Date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        id={`employment_start_date_gap_${index + 1}`}
                                                                                        name={`employment_start_date_gap_${index + 1}`}
                                                                                        value={annexureData["gap_validation"]?.[`employment_start_date_gap_${index + 1}`] || ''}
                                                                                        onChange={(e) => handleServiceChange("gap_validation", `employment_start_date_gap_${index + 1}`, e.target.value)}
                                                                                        className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                                    />
                                                                                </div>

                                                                                {/* End Date Field */}
                                                                                <div>
                                                                                    <label htmlFor={`employment_end_date_gap_${index + 1}`}>End Date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        id={`employment_end_date_gap_${index + 1}`}
                                                                                        name={`employment_end_date_gap_${index + 1}`}
                                                                                        value={annexureData["gap_validation"]?.[`employment_end_date_gap_${index + 1}`] || ''}
                                                                                        onChange={(e) => handleServiceChange("gap_validation", `employment_end_date_gap_${index + 1}`, e.target.value)}
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

                                                                                                                                        {isImage ? (
                                                                                                                                            <div className="border p-3 rounded-md mt-4">
                                                                                                                                                <div className="swiper-slide-container">
                                                                                                                                                    <img
                                                                                                                                                        src={item}
                                                                                                                                                        alt={`Image ${index}`}
                                                                                                                                                        className='md:h-[100px] md:w-[100px]'
                                                                                                                                                    />
                                                                                                                                                </div>
                                                                                                                                            </div>
                                                                                                                                        ) : (
                                                                                                                                            ''
                                                                                                                                        )}
                                                                                                                                    </SwiperSlide>
                                                                                                                                );
                                                                                                                            })}
                                                                                                                        </Swiper>
                                                                                                                    ) : (
                                                                                                                        <p>No image or link available</p>
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
                                                                    <div className='md:h-20 md:w-20 border rounded-md p-2 '><img src={cefDataApp.signature} alt="No Signature Found" className='h-full w-full' /></div>


                                                                </div>

                                                                < div className="form-group" >
                                                                    <label className='text-sm' > Name </label>
                                                                    < input
                                                                        value={formData.personal_information.name_declaration}
                                                                        onChange={handleChange}
                                                                        type="text"
                                                                        className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                        name="name_declaration"

                                                                    />
                                                                </div>


                                                                < div className="form-group" >
                                                                    <label className='text-sm' > Date < span className='text-red-500' >* </span></label >
                                                                    <input
                                                                        onChange={handleChange}
                                                                        value={formData.declaration_date}
                                                                        type="date"
                                                                        className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                        name="declaration_date"
                                                                    />
                                                                    {errors.declaration_date && <p className="text-red-500 text-sm"> {errors.declaration_date} </p>}

                                                                </div>
                                                            </div>
                                                        </div>

                                                        < h5 className="md:text-start text-start text-lg my-6 font-bold" > Documents(Mandatory) </h5>


                                                        <div className="bg-white shadow-md  rounded-md border">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 md:p-4 p-1">
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

                                                            <p className='md:text-start text-start text-sm mt-4 p-4' >
                                                                NOTE: If you experience any issues or difficulties with submitting the form, please take screenshots of all pages, including attachments and error messages, and email them to < a href="mailto:onboarding@goldquestglobal.in" > onboarding@goldquestglobal.in</a> . Additionally, you can reach out to us at <a href="mailto:onboarding@goldquestglobal.in">onboarding@goldquestglobal.in</a > .
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex space-x-4 mt-6">
                                                <button
                                                    onClick={(e) => handleSubmit(0, e)} // Pass 0 when Save is clicked
                                                    className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
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
