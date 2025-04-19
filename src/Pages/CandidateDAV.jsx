import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';

const CandidiateDav = () => {
    const { isApiLoading, setIsApiLoading,checkAuthentication } = useApiCall();

    const [davData, setDAVData] = useState([]);

    const urlParams = new URLSearchParams(window.location.search);

    const [loading, setLoading] = useState(true);

    // Step 2: Get values from localStorage




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
    const isApplicationExists = useCallback(() => {
        setIsApiLoading(true);
        setLoading(true);  // Set loading to true before making the fetch request.
    
        const applicationId = urlParams.get('applicationId');
        const branchId = urlParams.get('branch_id');
        const token = localStorage.getItem('_token');
        const adminData = JSON.parse(localStorage.getItem('admin'));
        const admin_id = adminData?.id;
    
        // Validate necessary parameters before proceeding
        if (!applicationId || !branchId || !token || !admin_id) {
            setIsApiLoading(false);
            setLoading(false);
            Swal.fire({
                title: 'Error',
                text: 'Missing required parameters.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return;
        }
    
        fetch(`https://api.goldquestglobal.in/candidate-master-tracker/dav-application-by-id?application_id=${applicationId}&branch_id=${branchId}&admin_id=${admin_id}&_token=${token}`)
            .then(res => res.json())
            .then(result => {
                const newToken = result.token || result._token || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Save the new token in localStorage
                }
                setLoading(false);  // Stop loading spinner when the request is complete.
    
                if (!result.status) {
    
                    Swal.fire({
                        title: 'Error',
                        text: result.message,
                        icon: 'error',
                        confirmButtonText: 'OK',
                    });
    
                    // Ensure form is present before trying to remove it
                    const form = document.getElementById('bg-form');
                    if (form) {
                        form.remove();
                    }
    
                    // Create and show the error message div
                    const errorMessageDiv = document.createElement('div');
                    errorMessageDiv.classList.add(
                        'bg-red-100', 'text-red-800', 'border', 'border-red-400', 'p-6',
                        'rounded-lg', 'max-w-lg', 'mx-auto', 'shadow-lg', 'absolute',
                        'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2'
                    );
    
                    errorMessageDiv.innerHTML = `
                        <h1 class="font-semibold text-2xl">Error</h1>
                        <p class="text-lg">${result.message}</p>
                    `;
                    document.body.appendChild(errorMessageDiv);
                } else {
                    setDAVData(result.DEFData);
                }
            })
            .catch(err => {
                setLoading(false);  // Ensure loading is false even if there's an error.
                setIsApiLoading(false);  // Stop global loading spinner in case of error.
    
                Swal.fire({
                    title: 'Error',
                    text: err.message || 'An error occurred while fetching application data.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            })
            .finally(() => {
                setIsApiLoading(false); // Ensure global loading state is reset
            });
    }, []);
    
        useEffect(() => {
            const fetchMainData = async () => {
                if (!isApiLoading) {
                    await checkAuthentication();
                    await isApplicationExists();  // Correct function call
                }
            };
        
            fetchMainData();  // Call the async function inside useEffect
        
        }, [isApplicationExists]);  // Correct dependencies



    const homePhotoUrls = davData?.home_photo?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));

    const identityProofUrls = davData?.identity_proof?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));

    const localityUrls = davData?.locality?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));

    return (
        <>
            <form action="" className='p-4' id='bg-form'>
                {
                    loading ? (
                        <div className='flex justify-center items-center py-6 ' >
                            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
                        </div >
                    ) : (
                        <>
                            <h3 className="text-center py-3 font-bold text-2xl">Digital Address Verification</h3>
                            <div className="border md:w-7/12 m-auto p-4 ">
                                <div className="md:grid grid-cols-1 md:grid-cols-3 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name:</label>
                                        <input type="text" value={davData?.company_name} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="company_name" name="company_name" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="candidate_name" className="block text-sm font-medium text-gray-700">Candidate Name:</label>
                                        <input type="text" value={davData?.name} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="candidate_name" name="candidateName" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label className="block text-sm font-medium text-gray-700">Employee ID:</label>
                                        <input type="text" value={davData?.employee_id} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="employee_id" />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="mob_no" className="block text-sm font-medium text-gray-700">Mobile No:</label>
                                        <input type="text" value={davData?.mobile_number} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="mob_no" name="mobNo" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="email_id" className="block text-sm font-medium text-gray-700">Email ID:</label>
                                        <input type="email" value={davData?.email} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="email_id" name="emailId" />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                        <textarea className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="address" name="candidate_address" rows="2">{davData?.candidate_address}</textarea>
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="candidate_location" className="block text-sm font-medium text-gray-700">Location:</label>
                                        <input type="text" value={davData?.candidate_location} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="candidate_location" name="candidate_location" />
                                    </div>

                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude:</label>
                                        <input type="text" value={davData?.latitude} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="latitude" name="latitude" />
                                    </div>
                                    <div className=" my-3 form-group">
                                        <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude:</label>
                                        <input type="text" value={davData?.longitude} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="longitude" name="longitude" />
                                    </div>

                                </div>
                                <div className="col-span-2 mt-5 mb-2">
                                    <h4 className="text-center text-lg font-semibold">Personal Information</h4>
                                </div>


                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="aadhaar_number" className="block text-sm font-medium text-gray-700">Aadhaar Number:</label>
                                        <input type="text" value={davData?.aadhaar_number} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="aadhaar_number" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth:</label>
                                        <input type="text" value={davData?.dob} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="dob" id="dob" />
                                    </div>
                                </div>
                                <div className="form-group mb-2">
                                    <label htmlFor="father_name" className="block text-sm font-medium text-gray-700">Father's Name:</label>
                                    <input type="text" value={davData?.father_name} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="father_name" />
                                </div>
                                <div className="form-group mb-2">
                                    <label htmlFor="husband_name" className="block text-sm font-medium text-gray-700">Husband's Name:</label>
                                    <input type="text" value={davData?.husband_name} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="husband_name" />
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">


                                    <div className=" my-3 form-group">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Gender:</p>
                                        <div className="flex space-x-4 flex-wrap">
                                            <input type="text" value={davData?.gender} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="gender" />

                                        </div>
                                    </div>

                                    <div className=" my-3 form-group">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Marital Status:</p>
                                        <div className="flex space-x-4 flex-wrap">
                                            <input type="text" value={davData?.marital_status} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="marital_status" />

                                        </div>
                                    </div>
                                </div>

                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="pin_code" className="block text-sm font-medium text-gray-700">Pin_code:</label>
                                        <input type="text" value={davData?.pin_code} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="pin_code" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">State:</label>
                                        <input type="text" value={davData?.state} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="state" />
                                    </div>


                                </div>
                                <div className=" my-3 form-group">
                                    <label htmlFor="landmark" className="block text-sm font-medium text-gray-700">Prominent Landmark:</label>
                                    <input type="text" value={davData?.landmark} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="landmark" />
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-1 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="police_station" className="block text-sm font-medium text-gray-700">Nearest Police Station:</label>
                                        <input type="text" value={davData?.police_station} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="police_station" />
                                    </div>

                                </div>

                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-700">Period of Stay:</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label>From Date:</label>
                                            <input type="text" value={davData?.from_date} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="from_date" />
                                        </div>
                                        <div>
                                            <label>To Date:</label>
                                            <input type="text" value={davData?.to_date} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="to_date" />
                                        </div>
                                    </div>
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="id_type" className="block text-sm font-medium text-gray-700">Type of ID Attached:</label>
                                    <input type="text" value={davData?.id_type} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="id_type" name="id_type" />
                                </div>

                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="id_proof" className="block text-sm font-medium text-gray-700">Upload ID:</label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                identityProofUrls && identityProofUrls.length > 0 ? (
                                                    identityProofUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No identity Proof  available.</p>
                                                )
                                            }
                                        </div>
                                    </div>

                                    <div className="my-3 form-group">
                                        <label htmlFor="home_photo" className="block text-sm font-medium text-gray-700">
                                            Home Photos:
                                        </label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                homePhotoUrls && homePhotoUrls.length > 0 ? (
                                                    homePhotoUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No home photo available.</p>
                                                )
                                            }
                                        </div>
                                    </div>

                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="locality_proof" className="block text-sm font-medium text-gray-700">Locality Photos:</label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                localityUrls && localityUrls.length > 0 ? (
                                                    localityUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No locality Proof available.</p>
                                                )
                                            }
                                        </div>
                                    </div>
                                    <div className="form-group my-3">
                                        <label htmlFor="nof_yrs_staying" className="block text-sm font-medium text-gray-700">No of years staying in the address:</label>
                                        <div className="mt-2 w-1/3">
                                            <input type="text" value={davData?.years_staying} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="years_staying" />

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}



            </form>


        </>
    );
};

export default CandidiateDav;

