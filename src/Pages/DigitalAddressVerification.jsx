import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from "axios";
import PulseLoader from 'react-spinners/PulseLoader';
const DigitalAddressVerification = () => {
    const [data, setData] = useState([]);

    const [loading, setLoading] = useState(false);
    const [mapLocation, setMapLocation] = useState({ latitude: '', longitude: '' });

    const [isValidApplication, setIsValidApplication] = useState(true);
    const location = useLocation();
    const currentURL = location.pathname + location.search;
    const [errors, setErrors] = useState({});
    const [files, setFiles] = useState([]);
    const [formData, setFormData] = useState({
        personal_information: {
            company_name: '',
            name: '',
            employee_id: '',
            mobile_number: '',
            email: '',
            candidate_location: '',
            candidate_address: '',
            aadhaar_number: '',
            dob: '',
            father_name: '',
            husband_name: '',
            gender: '',
            marital_status: '',
            pin_code: '',
            state: '',
            landmark: '',
            police_station: '',
            years_staying: '',
            from_date: '',
            to_date: '',
            id_type: ''
        },
    });
    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setMapLocation({ latitude, longitude });
                },
                (error) => {
                    Swal.fire({
                        title: 'Error',
                        text: "Unable to retrieve your location.",
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            );
        } else {
            Swal.fire({
                title: 'Error',
                text: "Geolocation is not supported by this browser.",
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    const getValuesFromUrl = (currentURL) => {
        const result = {};
        const keys = [
            "YXBwX2lk",
            "YnJhbmNoX2lk",
            "Y3VzdG9tZXJfaWQ="
        ];

        keys.forEach(key => {
            const regex = new RegExp(`${key}=([^&]*)`);
            const match = currentURL.match(regex);
            result[key] = match && match[1] ? match[1] : null;
        });

        const isValidBase64 = (str) => /^[A-Za-z0-9+/]+={0,2}$/.test(str) && (str.length % 4 === 0);

        const decodeKeyValuePairs = (obj) => Object.entries(obj).reduce((acc, [key, value]) => {
            const decodedKey = isValidBase64(key) ? atob(key) : key;
            const decodedValue = value && isValidBase64(value) ? atob(value) : null;
            acc[decodedKey] = decodedValue;
            return acc;
        }, {});

        return decodeKeyValuePairs(result);
    };
    const decodedValues = getValuesFromUrl(currentURL);




    const handleFileChange = (fileName, e) => {
        const selectedFiles = Array.from(e.target.files); // Convert FileList to an array

        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]; // Allowed file types

        let errors = [];

        // Validate each file
        selectedFiles.forEach((file) => {

            // Check file size
            if (file.size > maxSize) {
                errors.push(`${file.name}: File size must be less than 2MB.`);
            }

            // Check file type (MIME type)
            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
            }
        });

        // If there are errors, show them and don't update the state
        if (errors.length > 0) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [fileName]: errors, // Set errors for this file field
            }));
            return; // Don't update state if there are errors
        }

        // Update the state with the selected files if no errors
        setFiles((prevFiles) => ({
            ...prevFiles,
            [fileName]: selectedFiles, // Update the specific file field
        }));

        // Remove any existing errors for this file field
        setErrors((prevErrors) => {
            const { [fileName]: removedError, ...restErrors } = prevErrors; // Remove the error for this field if valid
            return restErrors;
        });
    };

    const validate = () => {
        const newErrors = {}; // Object to hold validation errors

        // Required Fields to check (for form inputs)
        const requiredFields = [
            "candidate_address", // Add more fields as required
        ];

        // Validate mapLocation (latitude and longitude)
        if (!mapLocation.latitude) {
            newErrors.latitude = 'Latitude is required';
        }
        if (!mapLocation.longitude) {
            newErrors.longitude = 'Longitude is required';
        }

        const maxSize = 2 * 1024 * 1024; // 2MB size limit for files
        const allowedTypes = [
            "image/jpeg", "image/png", "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]; // Allowed file types

        // Function to validate file uploads
        const validateFile = (fileName) => {
            let fileErrors = [];
            const selectedFiles = files[fileName]; // Dynamically fetch the files by fileName


            if (selectedFiles && selectedFiles.length > 0) {
                selectedFiles.forEach((file) => {

                    // Check file size
                    if (file.size > maxSize) {
                        fileErrors.push(`${file.name}: File size must be less than 2MB.`);
                    }

                    // Check file type
                    if (!allowedTypes.includes(file.type)) {
                        fileErrors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
                    }
                });
            } else {
                // If no file is selected, mark it as required
                fileErrors.push(`${fileName} is required.`);
            }

            return fileErrors;
        };

        // Validate files dynamically (for each file input field)
        const fileFields = ['identity_proof', 'home_photo', 'locality']; // Define dynamic file fields
        fileFields.forEach((fileName) => {
            const fileErrors = validateFile(fileName);
            if (fileErrors.length > 0) {
                newErrors[fileName] = fileErrors;
            }
        });

        // Validate required fields for text-based fields
        requiredFields.forEach((field) => {

            if (
                !formData.personal_information[field] ||
                formData.personal_information[field].trim() === ""
            ) {
                newErrors[field] = "This field is required*";
            }
        });

        return newErrors;
    };




    const handleChange = (e) => {
        e.preventDefault();
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            setFormData(prev => ({
                ...prev,
                personal_information: {
                    ...prev.personal_information,
                    [name]: files[0]
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                personal_information: {
                    ...prev.personal_information,
                    [name]: value,
                    latitude: mapLocation.latitude,
                    longitude: mapLocation.longitude
                }
            }));

        }
    };
    const isApplicationExists = useCallback(() => {
        setLoading(true); // Set loading state to true at the beginning
        if (
            isValidApplication &&
            decodedValues.app_id &&
            decodedValues.branch_id &&
            decodedValues.customer_id
        ) {
            fetch(
                `https://api.goldquestglobal.in/branch/candidate-application/digital-address-verification/is-application-exist?app_id=${decodedValues.app_id}&branch_id=${decodedValues.branch_id}&customer_id=${decodedValues.customer_id}`
            )
                .then(res => res.json())
                .then(result => {
                    if (!result.status) {
                        setIsValidApplication(false);
                        Swal.fire({
                            title: 'Error',
                            text: result.message,
                            icon: 'error',
                            confirmButtonText: 'OK',
                        });

                        const form = document.getElementById('bg-form');
                        if (form) {
                            form.remove();
                        }

                        const errorMessageDiv = document.createElement('div');
                        errorMessageDiv.classList.add(
                            'bg-red-100',
                            'text-red-800',
                            'border',
                            'border-red-400',
                            'p-6',
                            'rounded-lg',
                            'max-w-lg',
                            'mx-auto',
                            'shadow-lg',
                            'absolute',
                            'top-1/2',
                            'left-1/2',
                            'transform',
                            '-translate-x-1/2',
                            '-translate-y-1/2'
                        );

                        errorMessageDiv.innerHTML = `
                            <h1 class="font-semibold text-2xl">Error</h1>
                            <p class="text-lg">${result.message}</p>
                        `;

                        document.body.appendChild(errorMessageDiv);
                    } else {
                        setData(result.data);
                        setFormData({
                            personal_information: {
                                company_name: result.data?.company_name || '',
                                name: result.data?.name || '',
                                employee_id: result.data?.employee_id || '',
                                mobile_number: result.data?.mobile_number || '',
                                email: result.data?.email || '',
                                candidate_location: '',
                                candidate_address: '',
                                aadhaar_number: '',
                                dob: '',
                                father_name: '',
                                husband_name: '',
                                gender: '',
                                marital_status: '',
                                pin_code: '',
                                state: '',
                                landmark: '',
                                police_station: '',
                                years_staying: '',
                                from_date: '',
                                to_date: '',
                                id_type: '',
                            },
                        });
                    }
                })
                .catch(err => {
                    Swal.fire({
                        title: 'Error',
                        text: err.message,
                        icon: 'error',
                        confirmButtonText: 'OK',
                    });
                })
                .finally(() => {
                    setLoading(false); // Ensure loading is set to false regardless of success or error
                });
        } else {
            setLoading(false); // If conditions are not met, stop loading
        }
    }, [isValidApplication, decodedValues]);



    useEffect(() => {
        isApplicationExists();

    }, []);


    const uploadCustomerLogo = async (candidate_application_id, branch_id, customer_id) => {
        for (const [index, [key, value]] of Object.entries(files).entries()) {
            const customerLogoFormData = new FormData();
            const fileCount = Object.keys(files).length;

            customerLogoFormData.append("branch_id", branch_id);
            customerLogoFormData.append("customer_id", customer_id);
            customerLogoFormData.append("application_id", candidate_application_id);
            if (fileCount === (index + 1)) {
                customerLogoFormData.append('send_mail', 1);
            }

            for (const file of value) {
                customerLogoFormData.append("images", file);
            }
            customerLogoFormData.append("upload_category", key);


            try {
                const response = await axios.post(`https://api.goldquestglobal.in/branch/candidate-application/digital-address-verification/upload`, customerLogoFormData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } catch (err) {
                Swal.fire("Error!", `Error uploading files: ${err.message}`, "error");
                throw err; // Stop process if upload fails
            }
        }
    };
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setLoading(true); // Start loading
    
        // Validate form before submission
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setLoading(false); // Stop loading
            // Optionally, show an alert or update the UI to display validation errors
            setErrors(validationErrors);
            return; // Stop submission if validation errors are found
        }
    
        // If validation passes, proceed with the submission
        const fileCount = Object.keys(files).length;
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const form = document.getElementById('bg-form');
        const personal_information = formData.personal_information;
    
        const raw = JSON.stringify({
            branch_id: decodedValues.branch_id,
            customer_id: decodedValues.customer_id,
            application_id: decodedValues.app_id,
            personal_information,
        });
    
        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
    
        try {
            const response = await fetch(
                "https://api.goldquestglobal.in/branch/candidate-application/digital-address-verification/submit",
                requestOptions
            );
            const result = await response.json();
    
            if (result.status) {
                if (fileCount === 0) {
                    Swal.fire({
                        title: "Success",
                        text: `Client Created Successfully.`,
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        // Run isApplicationExists() when the OK button is clicked
                        isApplicationExists();
                    });
                } else if (fileCount > 0) {
                    await uploadCustomerLogo(
                        decodedValues.app_id,
                        decodedValues.branch_id,
                        decodedValues.customer_id
                    );
                    Swal.fire({
                        title: "Success",
                        text: `Client Created Successfully.`,
                        icon: "success",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        // Run isApplicationExists() when the OK button is clicked
                        isApplicationExists();
                    });
                }
            } else {
                Swal.fire({
                    title: 'Error',
                    text: result.message,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'An error occurred during submission.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false); // Stop loading after operations complete
        }
    };
    

    return (
        <>

            <form action="" onSubmit={handleSubmitForm} className='p-4' id='bg-form'>
                {loading ? (
                    <div className="flex justify-center items-center h-screen w-screen">
                        <PulseLoader
                            color="#36D7B7"
                            loading={loading}
                            size={15}
                            aria-label="Candidate Loading Spinner"
                        />
                    </div>
                ) : (
                    <>

                        <h3 className="text-center py-3 font-bold text-2xl mb-7">Digital Address Verification</h3>

                        <div className="border md:w-7/12 m-auto p-4 ">
                            <div className="md:grid grid-cols-1 md:grid-cols-3 mb-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name:</label>
                                    <input type="text" value={data?.company_name} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="company_name" name="company_name" />
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="candidate_name" className="block text-sm font-medium text-gray-700">Candidate Name:</label>
                                    <input type="text" value={data?.name} readOnly onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="candidate_name" name="candidateName" />
                                </div>

                                <div className=" my-3 form-group">
                                    <label className="block text-sm font-medium text-gray-700">Employee ID:</label>
                                    <input type="text" value={data?.employee_id} readOnly onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="employee_id" />
                                </div>
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="mob_no" className="block text-sm font-medium text-gray-700">Mobile No:</label>
                                    <input type="text" value={data?.mobile_number} readOnly onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="mob_no" name="mobNo" />
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="email_id" className="block text-sm font-medium text-gray-700">Email ID:</label>
                                    <input type="email" value={data?.email} readOnly onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="email_id" name="emailId" />
                                </div>
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address <span className='text-red-500'>*</span></label>
                                    <textarea className="mt-1 block w-full border-gray-300 rounded-md border p-2" rows='1' value={formData.personal_information.candidate_address} onChange={handleChange} id="address" name="candidate_address" ></textarea>
                                    {errors.candidate_address && (
                                        <p className="text-sm text-red-500 mt-1">{errors.candidate_address}</p>
                                    )}
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="candidate_location" className="block text-sm font-medium text-gray-700">Location:</label>
                                    <input type="text" value={formData.personal_information.candidate_location} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="candidate_location" name="candidate_location" />
                                </div>

                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude<span className='text-red-500'>*</span></label>
                                    <input type="text" value={mapLocation.latitude} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="latitude" name="latitude" />
                                    {errors.latitude && (
                                        <p className="text-sm text-red-500 mt-1">{errors.latitude}</p>
                                    )}
                                </div>
                                <div className=" my-3 form-group">
                                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude<span className='text-red-500'>*</span></label>
                                    <input type="text" onChange={handleChange} value={mapLocation.longitude} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="longitude" name="longitude" />
                                    {errors.longitude && (
                                        <p className="text-sm text-red-500 mt-1">{errors.longitude}</p>
                                    )}
                                </div>

                            </div>
                            <div className="col-span-2">
                                <button type="button" className="mt-3 bg-[#3e76a5] text-white font-bold py-2 px-4 rounded" onClick={getLocation}>Get Geo Coordinates <i className="fa fa-map-marker"></i></button>
                            </div>
                            <div className="col-span-2 mt-5 mb-2">
                                <h4 className="text-center text-xl font-semibold">Personal Information</h4>
                            </div>


                            <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                <div className=" my-3 form-group">
                                    <label htmlFor="aadhaar_number" className="block text-sm font-medium text-gray-700">Aadhaar Number:</label>
                                    <input type="text" value={formData.personal_information.aadhaar_number} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="aadhaar_number" />
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth:</label>
                                    <input type="text" className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="dob" id="dob" onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group mb-2">
                                <label htmlFor="father_name" className="block text-sm font-medium text-gray-700">Father's Name:</label>
                                <input type="text" value={formData.personal_information.father_name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="father_name" />
                            </div>
                            <div className="form-group mb-2">
                                <label htmlFor="husband_name" className="block text-sm font-medium text-gray-700">Husband's Name:</label>
                                <input type="text" value={formData.personal_information.husband_name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="husband_name" />
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">


                                <div className=" my-3 form-group">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Gender:</p>
                                    <div className="flex space-x-4 flex-wrap">
                                        <label className="flex items-center">
                                            <input type="radio" className="form-radio me-2" name="gender" value="male" onChange={handleChange} /> Male
                                        </label>
                                        <label className="flex items-center">
                                            <input type="radio" className="form-radio me-2" name="gender" value="female" onChange={handleChange} /> Female
                                        </label>
                                    </div>
                                </div>

                                <div className=" my-3 form-group">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Marital Status:</p>
                                    <div className="flex space-x-4 flex-wrap">
                                        <label className="flex items-center">
                                            <input type="radio" className="form-radio me-2" name="marital_status" value="married" onChange={handleChange} /> Married
                                        </label>
                                        <label className="flex items-center">
                                            <input type="radio" className="form-radio me-2" name="marital_status" value="unmarried" onChange={handleChange} /> Unmarried
                                        </label>
                                        <label className="flex items-center">
                                            <input type="radio" className="form-radio me-2" name="marital_status" value="divorced" onChange={handleChange} /> Divorced
                                        </label>
                                        <label className="flex items-center">
                                            <input type="radio" className="form-radio me-2" name="marital_status" value="widower" onChange={handleChange} /> Widower
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="pin_code" className="block text-sm font-medium text-gray-700">Pin_code:</label>
                                    <input type="text" value={formData.personal_information.pin_code} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="pin_code" />
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">State:</label>
                                    <input type="text" value={formData.personal_information.state} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="state" />
                                </div>


                            </div>
                            <div className=" my-3 form-group">
                                <label htmlFor="landmark" className="block text-sm font-medium text-gray-700">Prominent Landmark:</label>
                                <input type="text" value={formData.personal_information.landmark} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="landmark" />
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-1 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="police_station" className="block text-sm font-medium text-gray-700">Nearest Police Station:</label>
                                    <input type="text" value={formData.personal_information.police_station} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="police_station" />
                                </div>

                            </div>

                            <div className="col-span-2">
                                <p className="text-xl text-center my-5 font-medium text-gray-700">Period of Stay:</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label>From Date:</label>
                                        <input type="text" className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="from_date" onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label>To Date:</label>
                                        <input type="text" className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="to_date" onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className=" my-3 form-group">
                                <label htmlFor="id_type" className="block text-sm font-medium text-gray-700">Type of ID Attached:</label>
                                <input type="text" value={formData.personal_information.id_type} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="id_type" name="id_type" />
                            </div>

                            <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="id_proof" className="block text-sm font-medium text-gray-700">Upload ID<span className='text-red-500'>*</span></label>
                                    <input type="file" className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="id_proof" name="id_proof"
                                        onChange={(e) => handleFileChange('identity_proof', e)}
                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                                        multiple
                                    />
                                    {errors.identity_proof && (
                                        <p className="text-sm text-red-500 mt-1">{errors.identity_proof}</p>
                                    )}
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="locality_proof" className="block text-sm font-medium text-gray-700">Home Photos<span className='text-red-500'>*</span></label>
                                    <input type="file" className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="locality_proof" name="home_photos" onChange={(e) => handleFileChange('home_photo', e)}
                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" multiple />
                                    {errors.home_photo && (
                                        <p className="text-sm text-red-500 mt-1">{errors.home_photo}</p>
                                    )}
                                </div>
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="locality_proof" className="block text-sm font-medium text-gray-700">Locality Photos<span className='text-red-500'>*</span></label>
                                    <input type="file" className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="locality_proof" name="locality_proof" onChange={(e) => handleFileChange('locality', e)}
                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" multiple />
                                    {errors.locality && (
                                        <p className="text-sm text-red-500 mt-1">{errors.locality}</p>
                                    )}
                                </div>
                                <div className="form-group my-3">
                                    <label htmlFor="nof_yrs_staying" className="block text-sm font-medium text-gray-700">No of years staying in the address:</label>
                                    <input type="text" value={formData.personal_information.years_staying} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="years_staying" />
                                </div>
                            </div>
                            <button type="submit" className='bg-[#3e76a5] p-3 w-full rounded-md text-white mt-4'>Submit</button>
                        </div>
                    </>
                )}

            </form>


        </>
    );
};

export default DigitalAddressVerification;
