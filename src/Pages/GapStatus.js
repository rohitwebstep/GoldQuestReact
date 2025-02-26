import React, { useState, useEffect, useCallback } from 'react'; import { useApiCall } from '../ApiCallContext';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
const GapStatus = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();
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
    const [cefDataApp, setCefDataApp] = useState([]);
    const [serviceData, setServiceData] = useState([]);
    const [serviceValueData, setServiceValueData] = useState([]);
    const location = useLocation();
    const currentURL = location.pathname + location.search;
    const [annexureImageData, setAnnexureImageData] = useState([]);
    const [gaps, setGaps] = useState({});
    const [employGaps, setEmployGaps] = useState({});
    const queryParams = new URLSearchParams(location.search);

    const branchId = queryParams.get('branch_id');
    const applicationId = queryParams.get('applicationId');
    console.log('annexureData', annexureData)
    const fetchData = useCallback(() => {
        setIsApiLoading(true);
        setLoading(true); // Start loading

        const MyToken = localStorage.getItem('_token');
        const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
        const admin_id = adminData?.id;

        if (!MyToken || !admin_id || !applicationId || !branchId) {
            setLoading(false); // Stop loading if required params are missing
            return;
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        fetch(
            // `https://api.goldquestglobal.in/candidate-master-tracker/bgv-application-by-id?application_id=${applicationId}&branch_id=${branchId}&admin_id=${admin_id}&_token=${MyToken}`,
           `https://api.goldquestglobal.in/candidate-master-tracker/gap-check?application_id=${applicationId}&branch_id=${branchId}&admin_id=${admin_id}&_token=${MyToken}`,
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
                });
            })
            .catch(err => {
            })
            .finally(() => {
                setLoading(false);
                setIsApiLoading(false); // End loading
            });
    }, [applicationId, branchId]);
    useEffect(() => {
        fetchData();
    }, [fetchData])

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

    console.log('serviceData', serviceData);
    console.log('serviceValueData', serviceValueData);


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


    const educationData = annexureData.gap_validation;
    return (
        <>
            <div className="bg-gray-300">
                <div className="space-y-4 p-3 md:py-[30px] md:px-[51px] m-auto md:w-8/12 bg-white">
                    <h2 className='font-bold text-2xl pb-3'>Employment Gap</h2>
                    <div  className="overflow-x-auto ">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-green-500 text-white ">
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
                                        {annexureData["gap_validation"]?.[`employment_type_gap_${index + 1}`] || 'NIL'}
                                    </td>
                                    <td className="border px-4 py-2">
                                        {annexureData["gap_validation"]?.[`employment_start_date_gap_${index + 1}`] || 'NIL'}
                                    </td>
                                    <td className="border px-4 py-2">
                                        {annexureData["gap_validation"]?.[`employment_end_date_gap_${index + 1}`] || 'NIL'}
                                    </td>
                                    <td className="border px-4 py-2">
                                        {employGaps.map((item, idx) => {
                                            const isNoGap = item.difference.toLowerCase().includes("no") && item.difference.toLowerCase().includes("gap");

                                            if (item.startValue === annexureData["gap_validation"]?.[`employment_start_date_gap_${index + 1}`]) {
                                                return (
                                                    <p key={idx} className={`${isNoGap ? 'text-green-500' : 'text-red-500'} py-2`}>
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
                    <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                        <h2 className='font-bold text-xl pb-3 text-green-500'>SECONDARY:</h2>

                        <table className="w-full border">
                            <tbody>
                                {/* Row for School Name */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">School Name</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.secondary_school_name_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Start Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.secondary_start_date_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for End Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.secondary_end_date_gap || 'NIL'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                        <h2 className='font-bold text-xl pb-3 text-green-500'>SENIOR SECONDARY:</h2>

                        <table className="w-full border">
                            <tbody>
                                {/* Row for School Name */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">School Name</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.senior_secondary_school_name_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Start Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.senior_secondary_start_date_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for End Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.senior_secondary_end_date_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Gap Status */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Gap Status</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{renderGapMessage(gaps.gapSecToSrSec)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                        <h2 className='font-bold text-xl pb-3 text-green-500'>GRADUATION:</h2>

                        <table className="w-full border">
                            <tbody>
                                {/* Row for Institute Name */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Institute Name</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.graduation_course_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for School Name */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">University / Institute Name</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.graduation_university_institute_name_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Specialization */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Specialization</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.graduation_specialization_major_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Start Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.graduation_start_date_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for End Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.graduation_end_date_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Gap Status */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Gap Status</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{renderGapMessage(gaps.gapSrSecToGrad)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                        <h2 className='font-bold text-xl pb-3 text-green-500'>POST GRADUATION:</h2>
                        <table className="w-full border">
                            <tbody>
                                {/* Row for Course */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Course</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.post_graduation_course_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for University / Institute Name */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">University / Institute Name</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.post_graduation_university_institute_name_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Specialization */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Specialization</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.post_graduation_specialization_major_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Start Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.post_graduation_start_date_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for End Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.post_graduation_end_date_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Gap Status */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Gap Status</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{renderGapMessage(gaps.gapGradToPostGrad)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className='border rounded-md p-4 overflow-x-auto  custom-gap-check'>
                        <h2 className='font-bold text-xl pb-3 text-green-500'>PHD:</h2>

                        <table className="w-full border">
                            <tbody>
                                {/* Row for Course */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Course</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.phd_institute_name_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for University / Institute Name */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">University / Institute Name</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.phd_school_name_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Specialization */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Specialization</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.phd_specialization_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Start Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Start Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.phd_start_date_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for End Date */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">End Date</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{educationData.phd_end_date_gap || 'NIL'}</td>
                                </tr>

                                {/* Row for Gap Message */}
                                <tr>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap font-bold">Gap Status</td>
                                    <td className="py-3 px-4 border-b border-r-2 border-l-2 whitespace-nowrap">{renderGapMessage(gaps.gapPostGradToPhd)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </>
    )
}

export default GapStatus