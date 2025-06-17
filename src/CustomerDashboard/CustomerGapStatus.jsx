import React, { useState, useEffect, useCallback } from 'react'; import { useApiCall } from '../ApiCallContext';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
const GapStatus = () => {
    const { isBranchApiLoading, setIsBranchApiLoading ,checkBranchAuthentication} = useApiCall();
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

    const [annexureData, setAnnexureData] = useState(initialAnnexureData);
    const [loading, setLoading] = useState(false);
    const [serviceDataMain, setServiceDataMain] = useState([]);
    const [serviceDataImageInputNames, setServiceDataImageInputNames] = useState([]);
    const [serviceData, setServiceData] = useState([]);
    const [serviceValueData, setServiceValueData] = useState([]);
    const location = useLocation();
    const [annexureImageData, setAnnexureImageData] = useState([]);
    const [gaps, setGaps] = useState({});
    const [employGaps, setEmployGaps] = useState({});
    const queryParams = new URLSearchParams(location.search);

    const applicationId = queryParams.get('applicationId');


    const fetchData = useCallback(() => {
        const branchData = JSON.parse(localStorage.getItem("branch"));

        const branchEmail = branchData?.email;
        setIsBranchApiLoading(true);
        setLoading(true);
        const branchId = JSON.parse(localStorage.getItem("branch"))?.branch_id;
        const token = localStorage.getItem("branch_token");
        const queryParams = new URLSearchParams(location.search);

        const applicationId = queryParams.get('applicationId');

        const payLoad = {
            application_id: applicationId,
            branch_id: branchId,
            _token: token,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
        };

        // Zet het object om naar een query string
        const queryString = new URLSearchParams(payLoad).toString();

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        fetch(
            `https://api.goldquestglobal.in/branch/candidate-application/gap-check?${queryString}`,
            requestOptions
        )
            .then(res => {
                return res.json().then(data => {
                    const newToken = data.token || data._token || '';
                    if (newToken) {
                        localStorage.setItem("branch_token", newToken); // Save the new token in localStorage
                    }
                    if (data.message && data.message.toLowerCase().includes("invalid") && data.message.toLowerCase().includes("token")) {
                        // Session expired, redirect to login
                        Swal.fire({
                            title: "Session Expired",
                            text: "Your session has expired. Please log in again.",
                            icon: "warning",
                            confirmButtonText: "Ok",
                        }).then(() => {
                            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`; // Stop loading if required params are missing
                        });
                        return; // Stop further execution after session expiry
                    }

                    // Handle non-OK responses
                    if (!res.ok) {
                        const errorMessage = data.message || "An error occurred while fetching data"; // Default error message if none is provided
                        throw new Error(errorMessage); // Throw an error with the message from the API
                    }
                    // Process the data if the response is OK

                    // Handle service data safely
                    const serviceDataa = data.serviceData || {};
                    const jsonDataArray = Object.values(serviceDataa)?.map(item => item.jsonData) || [];
                    const serviceValueDataArray = Object.values(serviceDataa)?.map(item => item.data) || [];

                    setServiceData(jsonDataArray);
                    setServiceValueData(serviceValueDataArray);

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
                            let fieldValue = allJsonDataValue.find(data => data && data.hasOwnProperty('no_of_employment')); // Check for null or undefined before accessing `hasOwnProperty`
                            let initialAnnexureDataNew = initialAnnexureData;
                            if (fieldValue && fieldValue.hasOwnProperty('no_of_employment')) {

                                initialAnnexureDataNew = updateEmploymentFields(fieldValue.no_of_employment, fieldValue); // Call function to handle employment fields

                            } else {

                            }
                            annexureData[service.db_table].employment_fields = initialAnnexureDataNew.gap_validation.employment_fields;
                        }

                    });


                    // Handle successful response
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
                });
            })
            .catch(err => {
                // Show the error message in SweetAlert
                Swal.fire({
                    title: "Error",
                    text: err.message, // Display the error message from the API response
                    icon: "error",
                    confirmButtonText: "Ok",
                });
            })
            .finally(() => {
                setLoading(false);
                setIsBranchApiLoading(false); // End loading
            });
    }, [applicationId]);

    useEffect(() => {
        const fetchDataMain = async () => {
            if (!isBranchApiLoading) {
                await checkBranchAuthentication();
                await fetchData();
            }
        };

        fetchDataMain();
    }, [fetchData]);


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
    const createEmploymentFields = (noOfEmployments, fieldValue) => {
        // Ensure employment_fields is parsed if it's a JSON string
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
        updatedAnnexureData.gap_validation.education_fields = JSON.parse(fieldValue.education_fields);
        updatedAnnexureData.gap_validation.employment_fields = allEmploymentFields;

        // Set state with updated data
        setAnnexureData(updatedAnnexureData);

        return updatedAnnexureData; // This can be used for further handling if needed
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
        const secondaryEndDate = annexureData?.gap_validation?.education_fields?.secondary?.secondary_end_date_gap;
        const seniorSecondaryStartDate = annexureData?.gap_validation?.education_fields?.senior_secondary?.senior_secondary_start_date_gap;
        const seniorSecondaryEndDate = annexureData?.gap_validation?.education_fields?.senior_secondary?.senior_secondary_end_date_gap;
        const graduationStartDate = annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_start_date_gap;
        const graduationEndDate = annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_end_date_gap;
        const postGraduationStartDate = annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_start_date_gap;
        const postGraduationEndDate = annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_end_date_gap;
        const phdStartDate = annexureData.gap_validation?.education_fields?.phd_1?.phd_start_date_gap;


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
                    console.warn(`%cNo data found for ${employmentKey}, stopping loop.`, 'color: orange;');
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

            // Final logs

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


    const educationData = annexureData.gap_validation;

    return (
        <>
            <div className="p-3">
                <div className="space-y-4 p-3 md:py-[30px] md:px-[51px] m-auto md:w-8/12 bg-white shadow-md">
                    <h2 className='font-bold text-2xl pb-3'>Employment Gap</h2>
                    <div className="overflow-x-auto ">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#3e76a5] text-white ">
                                    <th className="border px-4 py-2">Employment</th>
                                    <th className="border px-4 py-2">Employment Type</th>
                                    <th className="border px-4 py-2">Start Date</th>
                                    <th className="border px-4 py-2">End Date</th>
                                    <th className="border px-4 py-2">Gap Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: annexureData["gap_validation"].no_of_employment || 0 }, (_, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="border px-4 py-2">Employment({index + 1})</td>
                                        <td className="border px-4 py-2">
                                            {annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_type_gap`] || 'NIL'}
                                        </td>
                                        <td className="border px-4 py-2">
                                            {annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_start_date_gap`] || 'NIL'}
                                        </td>
                                        <td className="border px-4 py-2">
                                            {annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_end_date_gap`] || 'NIL'}
                                        </td>
                                        <td className="border px-4 py-2">
                                            {employGaps.map((item, idx) => {
                                                const isNoGap = item.difference.toLowerCase().includes("no") && item.difference.toLowerCase().includes("gap");

                                                if (item.startValue === annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_start_date_gap`]) {
                                                    return (
                                                        <p key={idx} className={`${isNoGap ? 'text-[#3e76a5]' : 'text-red-500'} py-2`}>
                                                            {isNoGap ? item.difference : `GAP-${item.difference || 'No gap Found'}`}
                                                        </p>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <h2 className='font-bold text-2xl pb-3'>Education Gap</h2>


                    {(annexureData["gap_validation"].highest_education_gap === 'secondary' || annexureData["gap_validation"].highest_education_gap === 'senior_secondary' || annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'phd' || annexureData["gap_validation"].highest_education_gap === 'post_graduation') && (


                        <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                            <h2 className='font-bold text-xl pb-3 text-[#3e76a5]'>SECONDARY:</h2>

                            <table className="w-full border">
                                <tbody>
                                    {/* Row for School Name */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">School Name</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.secondary?.[`secondary_school_name_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for Start Date */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.secondary?.[`secondary_start_date_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for End Date */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.secondary?.[`secondary_end_date_gap`] || 'NIL'}</td>
                                    </tr>
                                </tbody>
                            </table>

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

                                        const secondarySection = annexureData.gap_validation.education_fields[key];

                                        elements.push(
                                            <div className="border border-black p-4 mt-4 rounded-md">
                                                <h3 className="text-lg font-bold py-3">Correspondence SECONDARY {index}</h3>
                                                <table className="w-full border-collapse">

                                                    <tbody>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">School Name</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{secondarySection?.secondary_school_name_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">Start Date</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{secondarySection?.secondary_start_date_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">End Date</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{secondarySection?.secondary_end_date_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        );

                                        index++; // Move to the next secondary_corespondence_*
                                    }

                                    return elements;
                                })()
                            }

                        </div>
                    )}
                    {(annexureData["gap_validation"].highest_education_gap === 'senior_secondary' || annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'phd' || annexureData["gap_validation"].highest_education_gap === 'post_graduation') && (

                        <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                            <h2 className='font-bold text-xl pb-3 text-[#3e76a5]'>SENIOR SECONDARY:</h2>

                            <table className="w-full border">
                                <tbody>
                                    {/* Row for School Name */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">School Name</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.senior_secondary?.[`senior_secondary_school_name_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for Start Date */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.senior_secondary?.[`senior_secondary_start_date_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for End Date */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.senior_secondary?.[`senior_secondary_end_date_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for Gap Status */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Gap Status</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{renderGapMessage(gaps.gapSecToSrSec)}</td>
                                    </tr>
                                </tbody>
                            </table>

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

                                        const seniorSecondarySection = annexureData.gap_validation.education_fields[key];

                                        elements.push(
                                            <div className="border border-black mt-4 p-4 rounded-md">
                                                <h3 className="text-lg font-bold py-3">Correspondence SENIOR SECONDARY {index}</h3>
                                                <table className="w-full border-collapse">

                                                    <tbody>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">School Name</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{seniorSecondarySection?.senior_secondary_school_name_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">Start Date</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{seniorSecondarySection?.senior_secondary_start_date_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">End Date</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{seniorSecondarySection?.senior_secondary_end_date_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        );

                                        index++; // Move to the next senior_secondary_corespondence_*
                                    }

                                    return elements;
                                })()
                            }

                        </div>
                    )}
                    {(annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'post_graduation' || annexureData["gap_validation"].highest_education_gap === 'phd') && (

                        <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                            <h2 className='font-bold text-xl pb-3 text-[#3e76a5]'>GRADUATION:</h2>

                            <table className="w-full border">
                                <tbody>
                                    {/* Row for Institute Name */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Institute Name</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.graduation_1?.[`graduation_course_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for School Name */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">University / Institute Name</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.graduation_1?.[`graduation_university_institute_name_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for Specialization */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Specialization</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.graduation_1?.[`graduation_specialization_major_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for Start Date */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.graduation_1?.[`graduation_start_date_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for End Date */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.graduation_1?.[`graduation_end_date_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for Gap Status */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Gap Status</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{renderGapMessage(gaps.gapSrSecToGrad)}</td>
                                    </tr>
                                </tbody>
                            </table>

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

                                        const graduationSection = annexureData.gap_validation.education_fields[key];

                                        elements.push(
                                            <div className="border border-black p-4 mt-4 rounded-md">
                                                <h3 className="text-lg font-bold py-3">Correspondence GRADUATION {index}</h3>
                                                <table className="w-full border-collapse">

                                                    <tbody>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">University / Institute Name</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{graduationSection?.graduation_university_institute_name_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">Course</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{graduationSection?.graduation_course_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">Specialization Major</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{graduationSection?.graduation_specialization_major_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">Start Date</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{graduationSection?.graduation_start_date_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">End Date</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{graduationSection?.graduation_end_date_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        );

                                        index++; // Move to the next graduation_corespondence_*
                                    }

                                    return elements;
                                })()
                            }

                        </div>
                    )}
                    {(annexureData["gap_validation"].highest_education_gap === 'post_graduation' || annexureData["gap_validation"].highest_education_gap === 'phd') && (

                        <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                            <h2 className='font-bold text-xl pb-3 text-[#3e76a5]'>POST GRADUATION:</h2>
                            <table className="w-full border">
                                <tbody>
                                    {/* Row for Course */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Course</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.post_graduation_1?.[`post_graduation_course_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for University / Institute Name */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">University / Institute Name</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.post_graduation_1?.[`post_graduation_university_institute_name_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for Specialization */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Specialization</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.post_graduation_1?.[`post_graduation_specialization_major_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for Start Date */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.post_graduation_1?.[`post_graduation_start_date_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for End Date */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.post_graduation_1?.[`post_graduation_end_date_gap`] || 'NIL'}</td>
                                    </tr>

                                    {/* Row for Gap Status */}
                                    <tr>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Gap Status</td>
                                        <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{renderGapMessage(gaps.gapGradToPostGrad)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {
                                (() => {
                                    let index = 1;
                                    let elements = [];

                                    while (true) {
                                        const key = `post_graduation_corespondence_${index}`;

                                        // Check if the key exists in education_fields
                                        if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                            break; // Exit loop if the key is missing
                                        }

                                        const postGraduationSection = annexureData.gap_validation.education_fields[key];

                                        elements.push(
                                            <div className="border border-black mt-4 p-4 rounded-md">
                                                <h3 className="text-lg font-bold py-3">Correspondence POST GRADUATION {index}</h3>
                                                <table className="w-full border-collapse">

                                                    <tbody>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">University / Institute Name</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{postGraduationSection?.post_graduation_university_institute_name_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">Course</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{postGraduationSection?.post_graduation_course_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">Specialization Major</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{postGraduationSection?.post_graduation_specialization_major_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">Start Date</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{postGraduationSection?.post_graduation_start_date_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 p-2">End Date</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <span>{postGraduationSection?.post_graduation_end_date_gap || ''}</span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        );

                                        index++; // Move to the next post_graduation_corespondence_*
                                    }

                                    return elements;
                                })()
                            }

                        </div>
                    )}
                    {
                        annexureData["gap_validation"].highest_education_gap === 'phd' && (
                            <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                                <h2 className='font-bold text-xl pb-3 text-[#3e76a5]'>PHD:</h2>

                                <table className="w-full border">
                                    <tbody>
                                        {/* Row for Course */}
                                        <tr>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Course</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.phd_1?.[`phd_institute_name_gap`] || 'NIL'}</td>
                                        </tr>

                                        {/* Row for University / Institute Name */}
                                        <tr>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">University / Institute Name</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.phd_1?.[`phd_school_name_gap`] || 'NIL'}</td>
                                        </tr>

                                        {/* Row for Specialization */}
                                        <tr>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Specialization</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.phd_1?.[`phd_specialization_gap`] || 'NIL'}</td>
                                        </tr>

                                        {/* Row for Start Date */}
                                        <tr>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.phd_1?.[`phd_start_date_gap`] || 'NIL'}</td>
                                        </tr>

                                        {/* Row for End Date */}
                                        <tr>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.education_fields?.phd_1?.[`phd_end_date_gap`] || 'NIL'}</td>
                                        </tr>

                                        {/* Row for Gap Message */}
                                        <tr>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Gap Status</td>
                                            <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{renderGapMessage(gaps.gapPostGradToPhd)}</td>
                                        </tr>
                                    </tbody>
                                </table>

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
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr>
                                                                <th className="border border-gray-300 p-2 text-left">Field</th>
                                                                <th className="border border-gray-300 p-2 text-left">Value</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td className="border border-gray-300 p-2">Institute Name</td>
                                                                <td className="border border-gray-300 p-2">
                                                                    <span>{phdSection?.phd_institute_name_gap || ''}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="border border-gray-300 p-2">School Name</td>
                                                                <td className="border border-gray-300 p-2">
                                                                    <span>{phdSection?.phd_school_name_gap || ''}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="border border-gray-300 p-2">Start Date</td>
                                                                <td className="border border-gray-300 p-2">
                                                                    <span>{phdSection?.phd_start_date_gap || ''}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="border border-gray-300 p-2">End Date</td>
                                                                <td className="border border-gray-300 p-2">
                                                                    <span>{phdSection?.phd_end_date_gap || ''}</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="border border-gray-300 p-2">Specialization</td>
                                                                <td className="border border-gray-300 p-2">
                                                                    <span>{phdSection?.phd_specialization_gap || ''}</span>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );

                                            index++; // Move to the next phd_corespondence_*
                                        }

                                        return elements;
                                    })()
                                }

                            </div>
                        )}

                </div>
            </div>
        </>
    )
}

export default GapStatus