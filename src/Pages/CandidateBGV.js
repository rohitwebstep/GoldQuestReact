import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import LogoBgv from '../Images/LogoBgv.jpg';
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';

const CandidateBGV = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const [error, setError] = useState(null);
    const [customBgv, setCustomBgv] = useState('');
    const [cefData, setCefData] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [serviceData, setServiceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [serviceValueData, setServiceValueData] = useState([]);

    const location = useLocation();
    const currentURL = location.pathname + location.search;

    const queryParams = new URLSearchParams(location.search);

    // Extract the branch_id and applicationId
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
                    setCefData(data.CEFData || {});

                    // Handle service data safely
                    const serviceDataa = data.serviceData || {};
                    const jsonDataArray = Object.values(serviceDataa)?.map(item => item.jsonData) || [];
                    const serviceValueDataArray = Object.values(serviceDataa)?.map(item => item.data) || [];

                    setServiceData(jsonDataArray);
                    setServiceValueData(serviceValueDataArray);

                    setCustomBgv(data.customerInfo?.is_custom_bgv || '');
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




    useEffect(() => {
        if (!isApiLoading) {
            fetchData();
        }

    }, [fetchData]);
    const getFileExtension = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        return ext;
    };
    const FileViewer = ({ fileUrl }) => {
        if (!fileUrl) {
            return <p>No file provided</p>; // Handle undefined fileUrl
        }

        const getFileExtension = (url) => url.split('.').pop().toLowerCase();

        const renderIframe = (url) => (
            <iframe
                src={`https://docs.google.com/gview?url=${url}&embedded=true`}
                width="100%"
                height="100%"
                title="File Viewer"
            />
        );

        const fileExtension = getFileExtension(fileUrl);

        // Determine the type of file and render accordingly
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(fileExtension)) {
            return <img src={fileUrl} alt="Image File" style={{}} />;
        }

        if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
            return renderIframe(fileUrl);
        }

        return <p>Unsupported file type</p>;
    };
    console.log('serviceData', serviceData)
    return (
        <>
            {
                loading ? (
                    <div className='flex justify-center items-center py-6 ' >
                        <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
                    </div >
                ) :
                    <form className='py-6 bg-[#e5e7eb24]' id='bg-form'>
                        {customBgv === 1 && (
                            <div className='flex justify-center my-3'>
                                <img src={LogoBgv} className='md:w-[12%] w-[50%] m-auto' alt="Logo" />
                            </div>
                        )}

                        <h4 className="text-Black md:text-3xl mb-6 text-center mt-5  font-bold">Background Verification Form</h4>
                        <div className="md:p-6 rounded md:w-9/12 m-auto md:p-3">
                            <div className="mb-6  p-4 rounded-md">
                                <h5 className="text-lg font-bold">Company name: <span className="text-lg font-normal">{companyName}</span></h5>
                            </div>

                            <div className="md:grid grid-cols-1 md:grid-cols-1 bg-white shadow-md gap-4 mb-6 border rounded-md  p-4">
                                <div className="form-group col-span-2">
                                    <label>Applicant’s CV: <span className="text-red-500">*</span></label>
                                    <div className="md:grid grid-cols-5 gap-4 border p-3 fileViewer rounded-md justify-center">

                                        <FileViewer fileUrl={cefData?.resume_file} className="w-full max-w-xs" />


                                    </div>

                                </div>
                                <div className="form-group col-span-2">
                                    <label>Attach Govt. ID Proof: <span className="text-red-500">*</span></label>
                                    <div className="md:grid grid-cols-5 gap-4 border p-3 fileViewer rounded-md justify-center">
                                        {cefData?.govt_id ? (
                                            cefData.govt_id.split(',').map((fileUrl, index) => (
                                                <FileViewer
                                                    key={index}
                                                    fileUrl={fileUrl.trim()} // Trim to remove any extra spaces
                                                    className="w-full max-w-xs mb-4"
                                                />
                                            ))
                                        ) : (
                                            <span className="text-gray-500">No files available</span>
                                        )}
                                    </div>




                                    {customBgv === 1 && (
                                        <>
                                            <div className="form-group col-span-2">
                                                <label>Passport size photograph  - (mandatory with white Background) <span className="text-red-500">*</span></label>


                                                <div className="md:grid grid-cols-5 gap-4 border p-3 fileViewer rounded-md justify-center">
                                                    {cefData?.passport_photo ? (
                                                        cefData.passport_photo.split(',').map((fileUrl, index) => (
                                                            <FileViewer
                                                                key={index}
                                                                fileUrl={fileUrl.trim()} // Trim any extra spaces from the URLs
                                                                className="w-full max-w-xs mb-4"
                                                            />
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-500">No passport photo available</span>
                                                    )}
                                                </div>


                                            </div>
                                        </>
                                    )}

                                </div>
                            </div>

                            <div className='border bg-white shadow-md  p-4 rounded-md'>
                                <h4 className="md:text-center text-left text-xl md:text-2xl my-6 font-bold ">Personal Information</h4>

                                <div className="md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ">
                                    <div className="form-group">
                                        <label htmlFor="full_name">Full Name as per Govt ID Proof (first, middle, last): <span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.full_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="full_name"
                                            name="full_name"

                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="former_name">Former Name/ Maiden Name (if applicable)<span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.former_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="former_name"
                                            name="former_name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="mob_no">Mobile Number: <span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.mb_no}
                                            type="tel"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="mb_no"
                                            id="mob_no"
                                            minLength="10"
                                            maxLength="10"

                                        />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-3 gap-4">

                                    <div className="form-group">
                                        <label htmlFor="father_name">Father's Name: <span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.father_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="father_name"
                                            name="father_name"

                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="husband_name">Spouse's Name</label>
                                        <input
                                            value={cefData?.husband_name}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            id="husband_name"
                                            name="husband_name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="dob">DOB: <span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.dob}
                                            type="date"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="dob"
                                            id="dob"

                                        />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="form-group">
                                        <label htmlFor="gender">
                                            Gender: <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={cefData?.gender}
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="gender"
                                            id="gender"
                                        >
                                            <option value="" disabled>
                                                Select gender
                                            </option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className='form-group'>
                                        <label>Aadhar card No</label>
                                        <input
                                            type="text"
                                            name="aadhar_card_number"
                                            value={cefData?.aadhar_card_number}

                                            className="form-control border rounded w-full p-2 mt-2"
                                        />

                                    </div>
                                    {customBgv === 1 && (
                                        <>
                                            <div className='form-group'>
                                                <label>Name as per Aadhar card<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="aadhar_card_name"
                                                    value={cefData?.aadhar_card_name}
                                                    readOnly

                                                    className="form-control border rounded w-full p-2 mt-2"
                                                />

                                            </div>
                                            <div className='form-group'>
                                                <label>Aadhar Card Image<span className='text-red-500'>*</span></label>

                                                <div className="md:grid grid-cols-5 gap-4 border p-3 fileViewer rounded-md justify-center">

                                                    <FileViewer fileUrl={cefData?.aadhar_card_image} className="w-full max-w-xs" />


                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className='form-group'>
                                        <label>Pan card No</label>
                                        <input
                                            type="text"
                                            name="pan_card_number"
                                            value={cefData?.pan_card_number}

                                            className="form-control border rounded w-full p-2 mt-2"
                                        />

                                    </div>
                                    {customBgv === 1 && (
                                        <>

                                            <div className='form-group'>
                                                <label>Name as per Pan Card<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="pan_card_name"
                                                    value={cefData?.pan_card_name}
                                                    readOnly

                                                    className="form-control border rounded w-full p-2 mt-2"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {customBgv === 1 && (
                                        <div className='form-group'>
                                            <label>Pan Card Image<span className='text-red-500'>*</span></label>

                                            <div className="md:grid grid-cols-5 gap-4 border p-3 fileViewer rounded-md justify-center">

                                                <FileViewer fileUrl={cefData?.pan_card_image} className="w-full max-w-xs" />


                                            </div>

                                        </div>
                                    )}
                                    {customBgv == 0 && (
                                        <div className="form-group">
                                            <label>Social Security Number(if applicable):</label>
                                            <input
                                                readOnly value={cefData?.ssn_number}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                name="ssn_number"

                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label htmlFor="nationality">Nationality: <span className="text-red-500">*</span></label>
                                        <input
                                            value={cefData?.nationality}
                                            type="text"
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="nationality"
                                            id="nationality"

                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="marital_status">Marital Status: <span className="text-red-500">*</span></label>
                                        <select
                                            className="form-control border rounded w-full p-2 mt-2"
                                            name="marital_status"
                                            id="marital_status"

                                        >
                                            <option value="">SELECT Marital STATUS</option>
                                            <option value="Dont wish to disclose">Don't wish to disclose</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Widowed">Widowed</option>
                                            <option value="Divorced">Divorced</option>
                                            <option value="Separated">Separated</option>
                                        </select>
                                    </div>
                                </div>
                                <div className='border bg-white shadow-md border-gray-300 p-2 md:p-6 rounded-md mt-5 hover:transition-shadow duration-300'>

                                    <h3 className='md:text-center text-left text-xl md:text-2xl font-bold my-5'>Current Address </h3>
                                    <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <div className="form-group">
                                            <label htmlFor="full_name">Full Address<span className="text-red-500">*</span></label>
                                            <input
                                                readOnly value={cefData?.full_address}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="full_address"
                                                name="full_address"

                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="full_name">Current Address <span className="text-red-500">*</span></label>
                                            <input
                                                readOnly value={cefData?.current_address}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_address"
                                                name="current_address"

                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="pin_code">Pin Code <span className="text-red-500">*</span></label>
                                            <input
                                                readOnly value={cefData?.pin_code}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="pin_code"
                                                name="pin_code"

                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="current_address_landline_number">Current Landline Number <span className="text-red-500">*</span></label>
                                            <input
                                                readOnly value={cefData?.current_address_landline_number}
                                                type="number"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_address_landline_number"
                                                name="current_address_landline_number"

                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="current_address_state">Current State <span className="text-red-500">*</span></label>
                                            <input
                                                readOnly value={cefData?.current_address_state}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_address_state"
                                                name="current_address_state"

                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="current_prominent_landmark">Current Landmark<span className="text-red-500">*</span></label>
                                            <input
                                                readOnly value={cefData?.current_prominent_landmark}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_prominent_landmark"
                                                name="current_prominent_landmark"

                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="current_address_stay_to">Current Address Stay No.<span className="text-red-500">*</span></label>
                                            <input
                                                readOnly value={cefData?.current_address_stay_to}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="current_address_stay_to"
                                                name="current_address_stay_to"

                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="nearest_police_station">Nearest Police Station.<span className="text-red-500">*</span></label>
                                            <input
                                                readOnly value={cefData?.nearest_police_station}
                                                type="text"
                                                className="form-control border rounded w-full p-2 mt-2"
                                                id="nearest_police_station"
                                                name="nearest_police_station"

                                            />
                                        </div>
                                    </div>
                                </div>




                            </div>
                            {customBgv === 1 && (
                                <>
                                    <div className='border bg-white shadow-md border-gray-300 md:p-6 p-2 rounded-md mt-5 hover:transition-shadow duration-300'>

                                        <label>Blood Group</label>
                                        <div className='form-group'>
                                            <input
                                                type="text"
                                                name="blood_group"
                                                value={cefData?.blood_group}
                                                readOnly className="form-control border rounded w-full p-2 mt-2"
                                            />
                                        </div>




                                        <div className='form-group'>
                                            <label>Declaration Date<span className='text-red-500'>*</span></label>
                                            <input
                                                type="date"
                                                name="declaration_date"
                                                value={cefData?.declaration_date}
                                                className="form-control border rounded w-full p-2 mt-2"
                                            />
                                        </div>

                                        <div className='border rounded-md p-3 my-5 '>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-4'>Add Emergency Contact Details</h3>
                                            <div className='md:grid grid-cols-3 gap-3 '>
                                                <div className='form-group'>
                                                    <label>Name<span className='text-red-500'>*</span></label>
                                                    <input
                                                        type="text"
                                                        name="emergency_details_name"
                                                        value={cefData?.emergency_details_name}
                                                        readOnly

                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label>Relation<span className='text-red-500'>*</span></label>
                                                    <input
                                                        type="text"
                                                        name="emergency_details_relation"
                                                        value={cefData?.emergency_details_relation}

                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label>Contact Number<span className='text-red-500'>*</span></label>
                                                    <input
                                                        type="text"
                                                        name="emergency_details_contact_number"
                                                        value={cefData?.emergency_details_contact_number}

                                                        className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='border rounded-md p-3  my-5'>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-4'>Add PF Details</h3>
                                            <div className='md:grid grid-cols-3 gap-3'>
                                                <div className='form-group'>
                                                    <label>PF Number</label>
                                                    <input
                                                        type="text"
                                                        name="pf_details_pf_number"
                                                        value={cefData?.pf_details_pf_number}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label>PF Type</label>
                                                    <input
                                                        type="text"
                                                        name="pf_details_pf_type"
                                                        value={cefData?.pf_details_pf_type}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label>PF Nominee</label>
                                                    <input
                                                        type="text"
                                                        name="pf_details_pg_nominee"
                                                        value={cefData?.pf_details_pg_nominee}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='border rounded-md p-3   mt-3'>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-4'>Do you have an NPS Account? If yes</h3>
                                            <div className='md:grid grid-cols-3 gap-3'>
                                                <div className='form-group '>
                                                    <label>PRAN (Permanent Retirement Account Number).</label>
                                                    <input
                                                        type="text"
                                                        name="nps_details_details_pran_number"
                                                        value={cefData?.nps_details_details_pran_number}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label>Enter Nominee Details of NPS. </label>
                                                    <input
                                                        type="text"
                                                        name="nps_details_details_nominee_details"
                                                        value={cefData?.nps_details_details_nominee_details}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label>Enter your contribution details of NPS</label>
                                                    <input
                                                        type="text"
                                                        name="nps_details_details_nps_contribution"
                                                        value={cefData?.nps_details_details_nps_contribution}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <label className='mt-5 block'>Do you have an ICICI Bank A/c<span className='text-red-500'>*</span></label>

                                        <div className='flex gap-6 mb-4  '>
                                            <div className='form-group pt-2 flex  gap-2'>

                                                <input
                                                    type="radio"
                                                    name="icc_bank_acc"
                                                    value='yes'
                                                    readOnly className="form-control border rounded p-2 "
                                                />
                                                <label>Yes</label>
                                            </div>
                                            <div className='form-group pt-2 flex  gap-2'>
                                                <input
                                                    type="radio"
                                                    name="icc_bank_acc"
                                                    value='no'
                                                    readOnly className="form-control border rounded p-2 "
                                                />
                                                <label>No</label>
                                            </div>

                                        </div>

                                        <div className='border rounded-md p-3 my-6  '>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-2'>Banking Details: </h3>
                                            <span className='text-sm md:text-center text-left block'> Note: If you have an ICICI Bank account, please provide those details. If not, feel free to share your banking information from any other bank.</span>
                                            <div className='form-group mt-4'>
                                                <label>Bank Account Number<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank_details_account_number"
                                                    value={cefData?.bank_details_account_number}
                                                    readOnly className="form-control border rounded w-full p-2 mt-2"
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label>Bank Name<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank_details_bank_name"
                                                    value={cefData?.bank_details_bank_name}
                                                    readOnly className="form-control border rounded w-full p-2 mt-2"
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label>Bank Branch Name<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank_details_branch_name"
                                                    value={cefData?.bank_details_branch_name}
                                                    readOnly className="form-control border rounded w-full p-2 mt-2"
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label>IFSC Code<span className='text-red-500'>*</span></label>
                                                <input
                                                    type="text"
                                                    name="bank_details_ifsc_code"
                                                    value={cefData?.bank_details_ifsc_code}
                                                    readOnly className="form-control border rounded w-full p-2 mt-2"
                                                />
                                            </div>
                                        </div>

                                        <div className='border rounded-md p-3 mt-3  '>
                                            <h3 className='md:text-center text-left md:text-xl font-bold pb-2'> Insurance Nomination Details:- (A set of parent either Parents or Parents in Law, 1 child, Spouse Nominee details) </h3>
                                            <div className='md:grid grid-cols-2 gap-3'>
                                                <div className='form-group'>
                                                    <label>Name(s)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="insurance_details_name"
                                                        value={cefData?.insurance_details_name}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label>Nominee Relationship
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="insurance_details_nominee_relation"
                                                        value={cefData?.insurance_details_nominee_relation}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <lalbel>Nominee Date of Birth
                                                    </lalbel>
                                                    <input
                                                        type="date"
                                                        name="insurance_details_nominee_dob"
                                                        value={cefData?.insurance_details_nominee_dob}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                                <div className='form-group'>
                                                    <label>Contact No.
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="insurance_details_contact_number"
                                                        value={cefData?.insurance_details_contact_number}
                                                        readOnly className="form-control border rounded w-full p-2 mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <label className='mt-5 block'>Do you want to opt for a Food Coupon?<span className='text-red-500'>*</span></label>

                                        <div className='flex gap-6 mb-4  '>
                                            <div className='form-group pt-2 flex gap-2'>
                                                <input
                                                    type="radio"
                                                    name="food_coupon"
                                                    value="Yes"
                                                    readOnly className="form-control border rounded p-2"
                                                />
                                                <label>Yes</label>
                                            </div>
                                            <div className='form-group pt-2 flex gap-2'>
                                                <input
                                                    type="radio"
                                                    name="food_coupon"
                                                    value="No"
                                                    readOnly className="form-control border rounded p-2"
                                                />
                                                <label>No</label>
                                            </div>
                                        </div>


                                        <p className='text-left '>Food coupons are vouchers or digital meal cards given to employees to purchase food and non-alcoholic beverages. Specific amount as per your requirement would get deducted from your Basic Pay. These are tax free, considered as a non-monetary benefit and are exempt from tax up to a specified limit.</p>
                                    </div>
                                </>
                            )}

                            {
                                serviceData?.length > 0 ? (
                                    serviceData.map((service, serviceIndex) => (
                                        <div
                                            key={serviceIndex}
                                            className="border border-gray-300 bg-white p-6 rounded-md mt-5 hover:transition-shadow duration-300"
                                        >
                                            <h2 className="md:text-center text-left py-4 text-xl md:text-2xl font-bold mb-6 text-black">
                                                {service.heading}
                                            </h2>
                                            <div className="space-y-6">
                                                {service.rows.map((row, rowIndex) => (
                                                    <div key={rowIndex}>
                                                        {row.row_heading && (
                                                            <h3 className="text-lg font-semibold mb-4">{row.row_heading}</h3>
                                                        )}

                                                        {row.inputs && row.inputs.length > 0 ? (
                                                            <div className="space-y-4">
                                                                <div
                                                                    className={`md:grid grid-cols-${row.inputs.length === 1
                                                                        ? '1'
                                                                        : row.inputs.length === 2
                                                                            ? '2'
                                                                            : '3'
                                                                        } gap-3`}
                                                                >
                                                                    {row.inputs.map((input, inputIndex) => {
                                                                        // Safely find the prefilled value from serviceValueData
                                                                        const prefilledValue =
                                                                            Array.isArray(serviceValueData) &&
                                                                            serviceValueData.find(
                                                                                (item) => item && item[input.name]
                                                                            ) || {};

                                                                        const inputValue = prefilledValue[input.name] || '';

                                                                        return (
                                                                            <div
                                                                                key={inputIndex}
                                                                                className={`flex flex-col space-y-2 ${row.inputs.length === 1
                                                                                    ? 'col-span-1'
                                                                                    : row.inputs.length === 2
                                                                                        ? 'col-span-1'
                                                                                        : ''
                                                                                    }`}
                                                                            >
                                                                                <label className="block text-sm font-medium mb-2 text-gray-700 capitalize">
                                                                                    {input.label.replace(/[\/\\]/g, '')}
                                                                                </label>

                                                                                {input.type === 'input' && (
                                                                                    <input
                                                                                        readOnly
                                                                                        type="text"
                                                                                        name={input.name}
                                                                                        value={inputValue}
                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                    />
                                                                                )}
                                                                                {input.type === 'textarea' && (
                                                                                    <textarea
                                                                                        readOnly
                                                                                        name={input.name}
                                                                                        rows={1}
                                                                                        value={inputValue}
                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                    />
                                                                                )}
                                                                                {input.type === 'datepicker' && (
                                                                                    <input
                                                                                        readOnly
                                                                                        type="date"
                                                                                        name={input.name}
                                                                                        value={inputValue}
                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                    />
                                                                                )}
                                                                                {input.type === 'number' && (
                                                                                    <input
                                                                                        readOnly
                                                                                        type="number"
                                                                                        name={input.name}
                                                                                        value={inputValue}
                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                    />
                                                                                )}
                                                                                {input.type === 'email' && (
                                                                                    <input
                                                                                        readOnly
                                                                                        type="email"
                                                                                        name={input.name}
                                                                                        value={inputValue}
                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                    />
                                                                                )}
                                                                                {input.type === 'select' && (
                                                                                    <input
                                                                                        readOnly
                                                                                        type="text"
                                                                                        name={input.name}
                                                                                        value={inputValue}
                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                    />
                                                                                )}
                                                                                {input.type === 'file' && inputValue && typeof inputValue === 'string' && (
                                                                                    <div className="md:grid grid-cols-4 gap-4 border p-3 fileViewer_service rounded-md">
                                                                                        {inputValue.split(',').map((fileUrl, index) => (
                                                                                            <FileViewer
                                                                                                key={index}
                                                                                                fileUrl={fileUrl.trim()} // Trim to remove any extra spaces
                                                                                                className="w-full max-w-xs mb-4"
                                                                                            />
                                                                                        ))}
                                                                                    </div>
                                                                                )}



                                                                                {input.type === 'checkbox' && (
                                                                                    <div className="flex items-center space-x-3">
                                                                                        <input
                                                                                            disabled
                                                                                            type="checkbox"
                                                                                            name={input.name}
                                                                                            defaultChecked={
                                                                                                inputValue === 'on'
                                                                                            }
                                                                                            className="h-5 w-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                                                        />
                                                                                        <span className="text-sm text-gray-700">
                                                                                            {input.label}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className='text-sm'>No inputs available for this row.</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="md:text-center text-left md:text-xl text-gray-500">No services available.</p>
                                )
                            }


                            <div className='mb-6 mt-6  p-4 rounded-md border shadow-md bg-white'>
                                <h4 className="md:text-center text-left md:text-xl my-6 font-bold">Declaration and Authorization</h4>

                                <div className="mb-6">
                                    <p className='text-sm'>
                                        I hereby authorize GoldQuest Global HR Services Private Limited and its representative to verify information provided in my application for employment and this employee background verification form, and to conduct enquiries as may be necessary, at the company’s discretion. I authorize all persons who may have information relevant to this enquiry to disclose it to GoldQuest Global HR Services Pvt Ltd or its representative. I release all persons from liability on account of such disclosure.
                                        <br /><br />
                                        I confirm that the above information is correct to the best of my knowledge. I agree that in the event of my obtaining employment, my probationary appointment, confirmation as well as continued employment in the services of the company are subject to clearance of medical test and background verification check done by the company.
                                    </p>
                                </div>

                                <div className="md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
                                    <div className="form-group">
                                        <label>Attach signature: <span className="text-red-500">*</span></label>

                                        <div className="md:grid grid-cols-5 gap-4 border p-3 fileViewer justify-center rounded-md">

                                            <FileViewer fileUrl={cefData?.signature} className="w-full max-w-xs" />


                                        </div>


                                    </div>

                                    <div className="form-group">
                                        <label>Name</label>
                                        <input
                                            value={cefData?.name_declaration}
                                            type="text"
                                            disabled
                                            className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                            name="name_declaration"

                                        />
                                    </div>


                                    <div className="form-group">
                                        <label>Date</label>
                                        <input
                                            value={cefData?.declaration_date}
                                            type="date"
                                            disabled
                                            className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                            name="declaration_date"

                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
            }

        </>
    );
};

export default CandidateBGV;
