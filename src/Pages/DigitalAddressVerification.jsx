import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from "axios";
import ProofExamplePopup from "./ProofExample"; // Adjust path
import hometrue from "../Images/hometrue.png"
import validPassport from "../Images/validPassport.png"
import invalidPasport from "../Images/invalidPasport.png"
import invalidhomepic from "../Images/invalidhomepic.png"
import validHousename from "../Images/validHousename.png"
import invalidhousename from "../Images/Untitled design.png"

import landmarkTrue from "../Images/landmarkTrue.png"
import landmarkFalse from "../Images/landmarkFalse.png"
import streetTrue from "../Images/streetTrue.png"
import streetFalse from "../Images/streetFalse.png"

import PulseLoader from 'react-spinners/PulseLoader';
const DigitalAddressVerification = () => {
    const [data, setData] = useState([]);
    const [popupData, setPopupData] = useState({ open: false, title: "", examples: [] });

    const [loading, setLoading] = useState(false);
    const [mapLocation, setMapLocation] = useState({ latitude: '', longitude: '' });
    const [locationFetch, setLocationFetch] = useState(null);
    const [nearbyPlaces, setNearbyPlaces] = useState({});
    const handleShowPopup = (field) => {
        let title = "", examples = [];

        switch (field) {
            case "id_proof":
                title = "Examples: ID or Proof of Residence";
                examples = [
                    { valid: true, imageUrl: `${validPassport}`, description: "Inner page of passport with address." },
                    { valid: false, imageUrl: `${invalidPasport}`, description: "Inner page of passport without address." }
                ];
                break;

            case "home_photo":
                title = "Examples: House Name Board / Main Door";
                examples = [
                    { valid: true, imageUrl: `${validHousename}`, description: "Clearly visible nameplate on main door." },
                    { valid: false, imageUrl: `${invalidhousename}`, description: "Blurry or dark photo without nameplate." }
                ];
                break;

            case "building_photo":
                title = "Examples: Building / Home Photo";
                examples = [
                    { valid: true, imageUrl:`${hometrue}`, description: "Front view of entire building." },
                    { valid: false, imageUrl: `${invalidhomepic}`, description: "Only a partial wall or unrelated structure." }
                ];
                break;

            case "street_photo":
                title = "Examples: Street Photo";
                examples = [
                    { valid: true, imageUrl: `${streetTrue}`, description: "Street showing road and house clearly." },
                    { valid: false, imageUrl: `${streetFalse}`, description: "Random street not showing context." }
                ];
                break;

            case "nearest_landmark":
                title = "Examples: Nearest Landmark";
                examples = [
                    { valid: true, imageUrl: `${landmarkTrue}`, description: "Visible and well-known nearby landmark." },
                    { valid: false, imageUrl: `${landmarkFalse}`, description: "Object or area not recognizable as a landmark." }
                ];
                break;

            default:
                break;
        }

        setPopupData({ open: true, title, examples });
    };
    const [isValidApplication, setIsValidApplication] = useState(true);
    const location = useLocation();
    const currentURL = location.pathname + location.search;
    const [errors, setErrors] = useState({});
    const [files, setFiles] = useState([]);
    const [remainingPlaces, setRemainingPlaces] = useState({
        police_station_name: '',
        police_station_address: '',
        police_station_latitude: '',
        police_station_longitude: '',
        post_office_name: '',
        post_office_address: '',
        post_office_latitude: '',
        post_office_longitude: '',
        tourist_attraction_name: '',
        tourist_attraction_address: '',
        tourist_attraction_latitude: '',
        tourist_attraction_longitude: '',
    });

    const [formData, setFormData] = useState({
        personal_information: {
            company_name: '',
            name: '',
            employee_id: '',
            mobile_number: '',
            email: '',
            candidate_location: '',
            candidate_address: '',
            id_card_details: '',
            dob: '',
            distance: '',
            verifier_name: '',
            house_flat_no: '',
            locality_name: '',
            relation_with_verifier: '',
            street_adress: '',
            latitude: '',
            longitude: '',
            city: '',
            gender: '',
            country: '',
            marital_status: '',
            pin_code: '',
            state: '',
            nature_of_residence: '',
            landmark: '',
            police_station: '',
            post_office: '',
            years_staying: '',
            from_date: '',
            to_date: '',
            id_type: ''
        },
    });
    async function fetchUserLocationFromGoogle() {
        const apiKey = 'AIzaSyANLPu_6hJC4Pz4oAbrwobs_0C6i--k2gI';  // Replace with your Google API Key
        const url = `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}), // empty body = IP-based location
            });

            if (!response.ok) {
                throw new Error(`Google Geolocation API error: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.location) {
                throw new Error('No location returned by Google API');
            }

            return data.location;
        } catch (err) {
            throw err;
        }
    }
    const fetchNearbyPlaces = async (lat, lng) => {
        const types = ['police_station', 'post_office', 'tourist_attraction'];
        const results = {};
        const apiKey = 'AIzaSyANLPu_6hJC4Pz4oAbrwobs_0C6i--k2gI';  // Replace with your Google API Key
        const radius = 2000;
        const placesUrl = 'https://api.goldquestglobal.in/test/nearby-locations-by-coordinates';

        try {
            const response = await fetch(placesUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude: lat,
                    longitude: lng,
                    locations: types.join(','), // Send all types at once
                    radius: radius
                })
            });

            if (!response.ok) {
                throw new Error(`Google Places API error: ${response.statusText}`);
            }

            const placesData = await response.json();
            if (placesData.data) {
                setFormData(prevState => ({
                    ...prevState,
                    personal_information: {
                        ...prevState.personal_information,
                        police_station: placesData.data.police_station?.name || '',
                        post_office: placesData.data.post_office?.name || '',
                        landmark: placesData.data.tourist_attraction?.name || '',

                    },
                }));
                setRemainingPlaces({
                    police_station_name: placesData.data.police_station?.name || '',
                    police_station_address: placesData.data.police_station?.address || '',
                    police_station_latitude: placesData.data.police_station?.coordinates?.latitude || '',
                    police_station_longitude: placesData.data.police_station?.coordinates?.longitude || '',
                    post_office_name: placesData.data.post_office?.name || '',
                    post_office_address: placesData.data.post_office?.address || '',
                    post_office_latitude: placesData.data.post_office?.coordinates?.latitude || '',
                    post_office_longitude: placesData.data.post_office?.coordinates?.longitude || '',
                    tourist_attraction_name: placesData.data.tourist_attraction?.name || '',
                    tourist_attraction_address: placesData.data.tourist_attraction?.address || '',
                    tourist_attraction_latitude: placesData.data.tourist_attraction?.coordinates?.latitude || '',
                    tourist_attraction_longitude: placesData.data.tourist_attraction?.coordinates?.longitude || '',
                });
            }

            if (placesData.status === 'OK') {
                types.forEach(type => {
                    results[type] = placesData.results
                        .filter(place => place.types.includes(type))
                        .map(place => ({
                            name: place.name,
                            address: place.vicinity,
                            rating: place.rating || 'N/A',
                        }));
                });



            } else {
                types.forEach(type => {
                    results[type] = [];
                });
            }


        } catch (error) {
            console.error("Error fetching places:", error);
            types.forEach(type => {
                results[type] = [];
            });
        }

        setNearbyPlaces(results);
    };

    const fetchAddressDetails = async (latitude, longitude) => {
        try {
            const apiKey = 'AIzaSyANLPu_6hJC4Pz4oAbrwobs_0C6i--k2gI';
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );
            const data = await response.json();

            if (data.status === "OK") {
                const addressComponents = data.results[0].address_components;

                const getComponent = (type) =>
                    addressComponents.find((c) => c.types.includes(type))?.long_name || '';

                const city = getComponent("locality") || getComponent("administrative_area_level_2");
                const state = getComponent("administrative_area_level_1");
                const country = getComponent("country");
                const pincode = getComponent("postal_code");


                console.log('dsdsd', city, state, country)
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    personal_information: {
                        ...prevFormData.personal_information,
                        country: country,
                        state: state,
                        city: city,
                        pin_code: pincode,

                    },
                }));
            } else {
                console.warn("No address found for location.");
            }
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
        }
    };

    const getLocation = async () => {
        try {
            const loc = await fetchUserLocationFromGoogle(); // returns { lat, lng }

            // Update lat/lng in formData
            setFormData((prevFormData) => ({
                ...prevFormData,
                personal_information: {
                    ...prevFormData.personal_information,
                    latitude: loc.lat,
                    longitude: loc.lng,
                },
            }));

            // Call reverse geocoding to fetch country/state/city
            await fetchAddressDetails(loc.lat, loc.lng);

            await fetchNearbyPlaces(loc.lat, loc.lng);
        } catch (err) {
            console.error('err', err);
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
        ];

        // Validate mapLocation (latitude and longitude)
        if (!formData.personal_information.latitude) {
            newErrors.latitude = 'Latitude is required';
        }
        if (!formData.personal_information.longitude) {
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
        const fileFields = ['id_proof', 'house_name_main_door', 'building_photo', 'street_photo', 'nearest_landmark']; // Define dynamic file fields
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
                                company_name: result.data?.branch_name || '',
                                name: result.data?.name || '',
                                employee_id: result.data?.employee_id || '',
                                mobile_number: result.data?.mobile_number || '',
                                email: result.data?.email || '',
                                candidate_location: '',
                                candidate_address: '',
                                id_card_details: '',
                                dob: '',
                                verifier_name: '',
                                house_flat_no: '',
                                locality_name: '',
                                relation_with_verifier: '',
                                street_adress: '',
                                latitude: '',
                                longitude: '',
                                city: '',
                                gender: '',
                                country: '',
                                marital_status: '',
                                pin_code: '',
                                state: '',
                                nature_of_residence: '',
                                landmark: '',
                                police_station: '',
                                post_office: '',
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

    async function getCoordinatesFromAddress(address) {
        try {


            const encoded = encodeURIComponent(address);
            const apiKey = 'AIzaSyANLPu_6hJC4Pz4oAbrwobs_0C6i--k2gI';
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;

            const response = await axios.get(url);

            if (response.data.status === 'OK') {
                const location = response.data.results[0].geometry.location;
                return location;
            } else {
                if (response.data.status == 'ZERO_RESULTS') {
                    const error = 'Address is not valid';
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error,
                    });
                    return;
                }
                console.error('⚠️ Geocoding failed with status:', response.data.status);
                return null;
            }
        } catch (error) {
            console.error('❌ Error while fetching geocode:', error.message);
            return null;
        }
    }
    const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // in kilometers

        return distance.toFixed(2); // e.g., "12.34"
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setLoading(true);

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
        const fullAddress = [
            personal_information.house_flat_no,
            personal_information.street_adress,
            personal_information.locality_name,
            personal_information.landmark,
            personal_information.city,
            personal_information.state,
            personal_information.country
        ].filter(Boolean).join(', ');

        const secondCoord = await getCoordinatesFromAddress(fullAddress);
        personal_information.address_latitude = secondCoord.lat;
        personal_information.address_longitude = secondCoord.lng;

        const distance = calculateHaversineDistance(personal_information.address_latitude, personal_information.address_longitude, personal_information.latitude, personal_information.longitude);

        const raw = JSON.stringify({
            branch_id: decodedValues.branch_id,
            customer_id: decodedValues.customer_id,
            application_id: decodedValues.app_id,
            personal_information: {
                ...personal_information,
                ...remainingPlaces,
                distance: distance
            }
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

                        <div className="border md:w-7/12 bg-white rounded-md m-auto p-4 ">
                            <div className="md:grid grid-cols-1 md:grid-cols-3 mb-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name:</label>
                                    <input type="text" value={data?.branch_name || formData.personal_information?.company_name} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="company_name" name="company_name" />
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

                            <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude<span className='text-red-500'>*</span></label>
                                    <input type="text" value={formData.personal_information.latitude} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="latitude" name="latitude" />
                                    {errors.latitude && (
                                        <p className="text-sm text-red-500 mt-1">{errors.latitude}</p>
                                    )}
                                </div>
                                <div className=" my-3 form-group">
                                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude<span className='text-red-500'>*</span></label>
                                    <input type="text" value={formData.personal_information.longitude} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="longitude" name="longitude" />
                                    {errors.longitude && (
                                        <p className="text-sm text-red-500 mt-1">{errors.longitude}</p>
                                    )}
                                </div>

                            </div>
                            <div className="col-span-2">
                                <button type="button" className="mt-3 bg-[#3e76a5] text-white font-bold py-2 px-4 rounded" onClick={getLocation}>Fetch My location <i className="fa fa-map-marker"></i></button>
                            </div>
                            <div className="col-span-2 mt-5 mb-2">
                                <h4 className="text-center text-xl font-semibold">Personal Information</h4>
                            </div>


                            <div className="md:grid grid-cols-1 md:grid-cols-1 gap-4 mb-2">
                                <div className=" my-3 form-group">
                                    <label htmlFor="id_card_details" className="block text-sm font-medium text-gray-700">Id Card details (Passport/Dl/Resident Card/Adhaar)</label>
                                    <input type="text" value={formData.personal_information.id_card_details} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="id_card_details" />
                                </div>
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                <div className="form-group mb-2">
                                    <label htmlFor="verifier_name" className="block text-sm font-medium text-gray-700">Verifier Name:</label>
                                    <input type="text" value={formData.personal_information.verifier_name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="verifier_name" />
                                </div>
                                <div className="form-group mb-2">
                                    <label htmlFor="relation_with_verifier" className="block text-sm font-medium text-gray-700">Relation With the Candidate:</label>
                                    <select
                                        value={formData.personal_information.relation_with_verifier}
                                        onChange={handleChange}
                                        name="relation_with_verifier"
                                        className="mt-1 block w-full border-gray-300 rounded-md border p-2"
                                    >
                                        <option value="">-- Select Relation --</option>

                                        {/* Immediate Family */}
                                        <option value="Self">Self</option>
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Husband">Husband</option>
                                        <option value="Wife">Wife</option>
                                        <option value="Son">Son</option>
                                        <option value="Daughter">Daughter</option>
                                        <option value="Brother">Brother</option>
                                        <option value="Sister">Sister</option>

                                        {/* In-laws */}
                                        <option value="Father in law">Father-in-law</option>
                                        <option value="Mother in law">Mother-in-law</option>
                                        <option value="Brother in law">Brother-in-law</option>
                                        <option value="Sister in law">Sister-in-law</option>
                                        <option value="Son in law">Son-in-law</option>
                                        <option value="Daughter in law">Daughter-in-law</option>

                                        {/* Extended Family */}
                                        <option value="Grandfather">Grandfather</option>
                                        <option value="Grandmother">Grandmother</option>
                                        <option value="Uncle">Uncle</option>
                                        <option value="Aunt">Aunt</option>
                                        <option value="Cousin">Cousin</option>
                                        <option value="Nephew">Nephew</option>
                                        <option value="Niece">Niece</option>

                                        {/* Others */}
                                        <option value="Guardian">Guardian</option>
                                        <option value="Friend">Friend</option>
                                        <option value="Other">Other</option>
                                    </select>

                                </div>
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                <div className="form-group mb-2">
                                    <label htmlFor="house_flat_no" className="block text-sm font-medium text-gray-700">House Number / Flat Number</label>
                                    <input type="text" value={formData.personal_information.house_flat_no} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="house_flat_no" />
                                </div>
                                <div className="form-group mb-2">
                                    <label htmlFor="street_adress" className="block text-sm font-medium text-gray-700">Street Address
                                    </label>
                                    <input type="text" value={formData.personal_information.street_adress} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="street_adress" />
                                </div>
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                <div className="form-group mb-2">
                                    <label htmlFor="locality_name" className="block text-sm font-medium text-gray-700">Locality Name
                                    </label>
                                    <input type="text" value={formData.personal_information.locality_name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="locality_name" />
                                </div>
                                <div className="form-group mb-2">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City
                                    </label>
                                    <input type="text" value={formData.personal_information.city} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="city" />
                                </div>
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">

                                <div className=" my-3 form-group">
                                    <label htmlFor="pin_code" className="block text-sm font-medium text-gray-700">Pin code:</label>
                                    <input type="text" value={formData.personal_information.pin_code} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="pin_code" />
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">State :</label>
                                    <input type="text" value={formData.personal_information.state} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="state" />
                                </div>
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">

                                <div className=" my-3 form-group">
                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                                    <input type="text" value={formData.personal_information.country} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="country" />
                                </div>
                                <div className="my-3 form-group">
                                    <label htmlFor="nature_of_residence" className="block text-sm font-medium text-gray-700">
                                        Nature of Residence :
                                    </label>
                                    <select
                                        value={formData.personal_information.nature_of_residence}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md border p-2"
                                        name="nature_of_residence"
                                        id="nature_of_residence"
                                    >
                                        <option value="">Select Nature of Residence</option>
                                        <option value="Owned">Owned</option>
                                        <option value="Rented">Rented</option>
                                        <option value="Relative">Relative</option>
                                        <option value="PG">PG</option>
                                        <option value="Hostel">Hostel</option>
                                    </select>
                                </div>


                            </div>
                            <div className=" my-3 form-group">
                                <label htmlFor="landmark" className="block text-sm font-medium text-gray-700">Prominent Landmark:</label>
                                <input type="text" value={formData.personal_information.landmark} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="landmark" />
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="police_station" className="block text-sm font-medium text-gray-700">Nearest Police Station:</label>
                                    <input type="text" value={formData.personal_information.police_station} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="police_station" />
                                </div>
                                <div className=" my-3 form-group">
                                    <label htmlFor="post_office" className="block text-sm font-medium text-gray-700">Nearest Post Office:</label>
                                    <input type="text" value={formData.personal_information.post_office} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="post_office" />
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

                            <div className=" my-3 form-group">
                               
                                    <label htmlFor="id_proof" className="block text-sm font-medium text-gray-700">Upload id or Proof of Residence (Electricity Bill, Rent Receipt, Adhaar, Passport with same Address )<span className='text-red-500'>* </span>  
                                    <button type="button" onClick={() => handleShowPopup("id_proof")} className="text-blue-600 text- underline ">
                                        Show Examples
                                    </button></label>
                               

                                <input type="file" className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="id_proof" name="id_proof"
                                    onChange={(e) => handleFileChange('id_proof', e)}
                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                                    multiple
                                />
                                {errors.id_proof && (
                                    <p className="text-sm text-red-500 mt-1">{errors.id_proof}</p>
                                )}
                            </div>

                            <div className=" my-3 form-group">
                                <label htmlFor="house_name_main_door" className="block text-sm font-medium text-gray-700">House name board / Main Door<span className='text-red-500'>* </span>
                                <button type="button" onClick={() => handleShowPopup("home_photo")} className="text-blue-600 text- underline ">
                                        Show Examples
                                    </button></label>
                                <input type="file" className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="house_name_main_door" name="house_name_main_door" onChange={(e) => handleFileChange('house_name_main_door', e)}
                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" multiple />
                                {errors.house_name_main_door && (
                                    <p className="text-sm text-red-500 mt-1">{errors.house_name_main_door}</p>
                                )}
                            </div>
                            <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className=" my-3 form-group">
                                    <label htmlFor="building_photo" className="block text-sm font-medium text-gray-700">Building / Home Photo<span className='text-red-500'>* </span>
                                     <button type="button" onClick={() => handleShowPopup("building_photo")} className="text-blue-600 text- underline ">
                                        Show Examples
                                    </button>
                                    </label>
                                    <input type="file" className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="building_photo" name="building_photo" onChange={(e) => handleFileChange('building_photo', e)}
                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" multiple />
                                    {errors.building_photo && (
                                        <p className="text-sm text-red-500 mt-1">{errors.building_photo}</p>
                                    )}
                                </div>
                                <div className=" my-3 form-group">
                                    <label htmlFor="street_photo" className="block text-sm font-medium text-gray-700">Street Photo<span className='text-red-500'>* </span>
                                      <button type="button" onClick={() => handleShowPopup("street_photo")} className="text-blue-600 text- underline ">
                                        Show Examples
                                    </button></label>
                                    <input type="file" className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="street_photo" name="street_photo" onChange={(e) => handleFileChange('street_photo', e)}
                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" multiple />
                                    {errors.street_photo && (
                                        <p className="text-sm text-red-500 mt-1">{errors.street_photo}</p>
                                    )}
                                </div>
                                <div className=" my-3 form-group">
                                    <label htmlFor="nearest_landmark" className="block text-sm font-medium text-gray-700"> Nearest landmark if any<span className='text-red-500'>* </span>
                                       <button type="button" onClick={() => handleShowPopup("nearest_landmark")} className="text-blue-600 text- underline ">
                                        Show Examples
                                    </button></label>
                                    <input type="file" className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="nearest_landmark" name="nearest_landmark" onChange={(e) => handleFileChange('nearest_landmark', e)}
                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" multiple />
                                    {errors.nearest_landmark && (
                                        <p className="text-sm text-red-500 mt-1">{errors.nearest_landmark}</p>
                                    )}
                                </div>
                                <div className="form-group my-3">
                                    <label htmlFor="nof_yrs_staying" className="block text-sm font-medium text-gray-700">No of years staying in the address:</label>
                                    <input type="text" value={formData.personal_information.years_staying} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md border p-3" name="years_staying" />
                                </div>
                            </div>
                            <ProofExamplePopup
                                isOpen={popupData.open}
                                onClose={() => setPopupData({ ...popupData, open: false })}
                                title={popupData.title}
                                examples={popupData.examples}
                            />
                            <button type="submit" className='bg-[#3e76a5] p-3 w-full rounded-md text-white mt-4'>Submit</button>
                        </div>
                    </>
                )}

            </form>


        </>
    );
};

export default DigitalAddressVerification;
