import React, { useContext, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import DropBoxContext from './DropBoxContext';
import { useApi } from '../ApiContext';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import CandidateForm from './CandidateForm';
import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
;
const CandidateList = () => {
    const { isBranchApiLoading, setIsBranchApiLoading, checkBranchAuthentication } = useApiCall();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [inputError, setInputError] = useState({});
    const [employeeId, setEmployeeId] = useState();
    const [clientInput, setClientInput] = useState({
        spoc: '',
        location: '',
        batch_number: '',
        sub_client: '',
        employee_id: '',
    });
    // Function to open the modal


    // Function to close the modal
    const closeModal = () => {
        setIsFormModalOpen(false);
    }
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalServices, setModalServices] = React.useState([]);
    const [selectedAttachments, setSelectedAttachments] = useState([]);
    const [isModalOpenDoc, setIsModalOpenDoc] = useState(false);

    const handleViewDocuments = (attachments) => {
        setSelectedAttachments(attachments);
        setIsModalOpenDoc(true);
    };


    const handleChange = (event) => {
        const { name, value, checked } = event.target;


        setClientInput((prev) => ({
            ...prev, [name]: name === 'employee_id' ? value.replace(/\s+/g, '').toUpperCase() : value,
        }));

    };
    const handleCloseModalDoc = () => {
        setIsModalOpenDoc(false);
        setSelectedAttachments([]);
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [statusChange, setStatusChange] = useState('');
    const [itemsPerPage, setItemPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(1);
    const { handleEditCandidate, candidateListData, fetchClient, candidateLoading, setUniqueBgv, UniqueBgv, } = useContext(DropBoxContext);
    const API_URL = useApi();


    useEffect(() => {
        const fetchDataMain = async () => {
            if (!isBranchApiLoading) {
                await checkBranchAuthentication();
                await fetchClient();
            }
        };

        fetchDataMain();
    }, [fetchClient]);


    const handleBGVClick = (cef_id, branch_id, applicationId) => {
        const url = `/customer-dashboard/customer-bgv?cef_id=${cef_id}&branch_id=${branch_id}&applicationId=${applicationId}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDAVClick = (def_id, branch_id, applicationId) => {
        // Construct the URL
        const url = `/customer-dashboard/customer-dav?def_id=${def_id}&branch_id=${branch_id}&applicationId=${applicationId}`;
        // Open the URL in a new tab
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCheckGap = (cef_id, branch_id, applicationId) => {
        // Construct the URL
        const url = `/customer-dashboard/customer-gap-check?cef_id=${cef_id}&branch_id=${branch_id}&applicationId=${applicationId}`;
        // Open the URL in a new tab
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const fetchImageToBase = async (imageUrls) => {
        setIsBranchApiLoading(true); // Set loading state to true before making the request
        try {
            // Define headers for the POST request
            const headers = {
                "Content-Type": "application/json",
            };

            // Prepare the body payload for the POST request
            const raw = {
                image_urls: imageUrls,
            };

            // Send the POST request to the API and wait for the response
            const response = await axios.post(
                "https://api.goldquestglobal.in/test/image-to-base",
                raw,
                { headers }
            );

            // Assuming the response data contains an array of images
            return response.data.images || [];  // Return images or an empty array if no images are found
        } catch (error) {
            console.error("Error fetching images:", error);

            // If the error contains a response, log the detailed response error
            if (error.response) {
                console.error("Response error:", error.response.data);
            } else {
                // If no response, it means the error occurred before the server could respond
                console.error("Request error:", error.message);
            }

            return null; // Return null if an error occurs
        } finally {
            // Reset the loading state after the API request finishes (success or failure)
            setIsBranchApiLoading(false);
        }
    };
    const handleDownloadAll = async (attachments) => {
        const zip = new JSZip();
        let allUrls = [];

        try {
            // Show loading indication
            Swal.fire({
                title: 'Processing...',
                text: 'Collecting image URLs...',
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Collect all image URLs and organize by category/label
            Object.entries(attachments).forEach(([category, files]) => {
                if (Array.isArray(files)) {
                    files.forEach(attachment => {
                        const label = Object.keys(attachment)[0];
                        const fileUrls = attachment[label]?.split(",").map(url => url.trim());

                        allUrls.push({ category, label, urls: fileUrls });
                    });
                } else {
                    console.error(`Expected an array for category "${category}", but got:`, files);
                }
            });

            if (allUrls.length === 0) {
                Swal.fire('No valid image URLs found', '', 'warning');
                return;
            }

            // Fetch all images as Base64
            const allImageUrls = allUrls.flatMap(item => item.urls);
            const base64Response = await fetchImageToBase(allImageUrls);
            const base64Images = base64Response || [];

            if (base64Images.length === 0) {
                Swal.fire('No images received from API', '', 'error');
                return;
            }

            // Process each image and add them to the ZIP file
            let imageIndex = 0;
            for (const { category, label, urls } of allUrls) {
                for (const url of urls) {
                    const imageData = base64Images.find(img => img.imageUrl === url);

                    if (imageData && imageData.base64.startsWith("data:image")) {
                        const base64Data = imageData.base64.split(",")[1]; // Extract Base64 content
                        const blob = base64ToBlob(base64Data, imageData.type); // Pass type dynamically

                        if (blob) {
                            const fileName = `${category}/${label}/image_${imageIndex + 1}.${imageData.type}`;
                            zip.file(fileName, blob);
                        }
                    }
                    imageIndex++;
                }
            }

            // Generate ZIP file content
            const zipContent = await zip.generateAsync({ type: "blob" });

            // Use FileSaver.js to download the ZIP file
            saveAs(zipContent, "attachments.zip");

            Swal.fire({
                title: 'Success!',
                text: 'ZIP file downloaded successfully.',
                icon: 'success'
            });
        } catch (error) {
            // Handle error and show error message to the user
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while generating the ZIP file.',
                icon: 'error'
            });
        }
    };


    const base64ToBlob = (base64) => {
        try {
            // Convert Base64 string to binary
            const byteCharacters = atob(base64);
            const byteNumbers = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            return new Blob([byteNumbers], { type: "image/png" });
        } catch (error) {
            console.error("Error converting base64 to blob:", error);
            return null;
        }
    };
    const handleViewMore = (services) => {
        setModalServices(services);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalServices([]);
    };

    const filteredItems = candidateListData.filter(item => {
        return (
            item.application_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email?.toLowerCase().includes(searchTerm.toLowerCase())


        );
    });
    const handleStatusChange = (event) => {
        setStatusChange(event.target.value);
    };
    const filteredOptions = filteredItems.filter(item =>
        item?.cef_submitted?.toString().toLowerCase().includes(statusChange?.toString().toLowerCase() || "")
    );
    

    const totalPages = Math.ceil(filteredOptions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOptions.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    const counts = candidateListData.reduce(
        (acc, application) => {
            if (application.cef_submitted === 0 && application.is_expired === 1) {
                acc.expired += 1; // Increment expired count first
            } else if (application.cef_submitted === 1) {
                acc.filled += 1; // Increment filled count
            } else if (application.cef_submitted === 0) {
                acc.notFilled += 1; // Increment not filled count
            }
            return acc;
        },
        { filled: 0, notFilled: 0, expired: 0 }
    );


    const showPrev = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const showNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };


    const renderPagination = () => {
        const pageNumbers = [];

        // Handle pagination with ellipsis
        if (totalPages <= 5) {
            // If there are 5 or fewer pages, show all page numbers
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // Always show the first page
            pageNumbers.push(1);

            // Show ellipsis if current page is greater than 3
            if (currentPage > 3) {
                pageNumbers.push('...');
            }

            // Show two pages around the current page
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                if (!pageNumbers.includes(i)) {
                    pageNumbers.push(i);
                }
            }

            // Show ellipsis if current page is less than total pages - 2
            if (currentPage < totalPages - 2) {
                pageNumbers.push('...');
            }

            // Always show the last page
            if (!pageNumbers.includes(totalPages)) {
                pageNumbers.push(totalPages);
            }
        }

        return pageNumbers.map((number, index) => (
            number === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-1">...</span>
            ) : (
                <button
                    type="button"
                    key={`page-${number}`} // Unique key for page buttons
                    onClick={() => handlePageChange(number)}
                    className={`px-3 py-1 rounded-0 ${currentPage === number ? 'bg-[#3e76a5] text-white' : 'bg-[#3e76a5] text-black border'}`}
                >
                    {number}
                </button>
            )
        ));
    };

    const handleSelectChange = (e) => {
        const selectedValue = e.target.value;
        setItemPerPage(selectedValue)

    }



    const handleSubmitClient = async (e, report) => {
        e.preventDefault();
        const branch_id = branchData?.branch_id;
        const customer_id = branchData?.customer_id;

        // Prepare the request body
        // Remove customPurpose from clientInput using destructuring
        // const { customPurpose, ...finalData } = clientInput;

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            branch_id,
            send_mail: 1, // File uploaded, so we don't send mail initially
            _token: branch_token,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
            customer_id: customer_id,
            candidate_application_id: report?.main_id,
        });



        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        setIsBranchApiLoading(true);

        const swalInstance = Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we create the Client Application.',
            didOpen: () => {
                Swal.showLoading(); // Start the loading spinner
            },
            allowOutsideClick: false, // Prevent closing Swal while processing
            showConfirmButton: false, // Hide the confirm button
        });

        try {
            // Make the API request
            const response = await fetch(
                `${API_URL}/branch/candidate-application/convert-to-client`, requestOptions
            );

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = result.message || "Unknown error occurred";
                const apiError = result.errors || "An unexpected error occurred. Please try again later.";

                const messageToShow = result.message || `${apiError}`;
                Swal.fire("Error!", messageToShow, "error");

                if (
                    errorMessage.toLowerCase().includes("invalid") &&
                    errorMessage.toLowerCase().includes("token")
                ) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
                    });
                }

                throw new Error(errorMessage);
            }

            // Handle token update
            const newToken = result._token || result.token;
            if (newToken) {
                localStorage.setItem("branch_token", newToken);
            }

            let successMessage = "Application Created Successfully";


            Swal.fire({
                title: "Success",
                text: successMessage,
                icon: "success",
                confirmButtonText: "Ok",
            }).then(() => {
                // Reset form and state after showing success message
                setClientInput({
                    employee_id: "",
                    spoc: "",
                    location: "",
                    batch_number: "",
                    sub_client: "",
                });

                setInputError({});
                fetchClient(); // Fetch client dropdown data

                setIsFormModalOpen(false);
            });

        } catch (error) {
            console.error("There was an error!", error);
        } finally {
            swalInstance.close(); // Close the Swal loading spinner
            setIsBranchApiLoading(false);
        }




    };



    const exportToExcel = () => {
        // Filtered data to export
        const dataToExport = currentItems;

        // Map the data to match the structure of the table headers
        const formattedData = dataToExport.map((report, index) => ({
            Index: index + 1,
            Name: report.name,
            Email: report.email,
            MobileNumber: report.mobile_number,
            Services: Array.isArray(report.serviceNames) && report.serviceNames.length > 0
                ? report.serviceNames.join(', ')
                : 'No Services',
            CreatedAt: report.created_at ? new Date(report.created_at).toLocaleDateString() : 'NIL',
            "CEF Filled Date": report.cef_filled_date ? new Date(report.cef_filled_date).toLocaleDateString() : 'NIL',
            "DAV Filled Date": report.dav_filled_date ? new Date(report.dav_filled_date).toLocaleDateString() : 'NIL',
            FormStatus: report.is_bgv_form_opened === "1" ? 'Open' : 'Not Yet Opened',
            EmploymentGap: report.is_employment_gap || 'NIL',
            EducationGap: report.is_education_gap || 'NIL',
        }));

        // Create a worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Filtered Data');

        // Write the Excel file to disk
        XLSX.writeFile(wb, 'Candidate-Applications.xlsx');
    };

    const handleEdit = (client) => {
        handleEditCandidate(client);
    };

    const branchData = JSON.parse(localStorage.getItem("branch"));
    const branchId = branchData?.branch_id;
    const branchEmail = branchData?.email;
    const branch_token = localStorage.getItem("branch_token");

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
        }).then((result) => {
            if (result.isConfirmed) {
                setIsBranchApiLoading(true);
                const branch_id = JSON.parse(localStorage.getItem("branch"))?.id;
                const _token = localStorage.getItem("branch_token");

                if (!branch_id || !_token) {
                    console.error("Branch ID or token is missing.");
                    return;
                }


                const requestOptions = {
                    method: "DELETE",
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                if (branchData?.branch_id) {
                    requestOptions.sub_user_id = branchData.id;
                }
                const payLoad = {
                    id: id,
                    branch_id: branchId,
                    _token: branch_token,
                    ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
                };

                // Zet het object om naar een query string
                const queryString = new URLSearchParams(payLoad).toString();

                fetch(`${API_URL}/branch/candidate-application/delete?${queryString}`, requestOptions)
                    .then(response => response.json()) // Parse the JSON response
                    .then(result => {
                        // Check if the result contains a message about invalid token (session expired)
                        if (
                            result.message &&
                            result.message.toLowerCase().includes("invalid") &&
                            result.message.toLowerCase().includes("token")
                        ) {
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
                            });
                            return; // Exit after showing the session expired message
                        }

                        // Handle token update if provided in the response
                        const newToken = result._token || result.token;
                        if (newToken) {
                            localStorage.setItem("branch_token", newToken);
                        }

                        // If there is a failure message in the result, show it
                        if (result.status === false) {
                            Swal.fire({
                                title: 'Error!',
                                text: result.message || 'An error occurred during the deletion.',
                                icon: 'error',
                                confirmButtonText: 'Ok',
                            });
                            return; // Exit if an error occurs during the deletion
                        }

                        // Successfully deleted, now show success and refresh the data
                        fetchClient();
                        Swal.fire(
                            'Deleted!',
                            'Your Candidate Application has been deleted.',
                            'success'
                        );
                    })
                    .catch(error => {
                        console.error('Fetch error:', error);
                        Swal.fire(
                            'Error!',
                            'An unexpected error occurred while deleting.',
                            'error'
                        );
                    }).finally(() => {
                        setIsBranchApiLoading(false);
                    });
            }
        });
    };



    return (
        <>

            <div className="py-4 md:py-16">
                <h2 className="md:text-4xl text-2xl font-bold pb-8 md:pb-4 text-center">Candidate DropBox</h2>
                <div className="md:grid md:grid-cols-6 md:p-4 gap-5 md:m-7 m-3">
                    <div className="md:col-span-6 md:p-6">
                        <CandidateForm />
                    </div>
                </div>
                <div className="overflow-x-auto p-2 py-6 md:px-4 bg-white shadow-md rounded-md md:m-10 m-3">
                    <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4">
                        <div className="col">
                            <form action="">
                                <div className="flex gap-3 ">
                                    <select name="" id="" onChange={(e) => {
                                        handleSelectChange(e);
                                        setCurrentPage(1);
                                    }} className='outline-none border p-2 md:p-3 w-7/12 text-left rounded-md md:w-6/12'>
                                        <option value="10">10 Rows</option>
                                        <option value="20">20 Rows</option>
                                        <option value="50">50 Rows</option>
                                        <option value="100">100 Rows</option>
                                        <option value="200">200 Rows</option>
                                        <option value="300">300 Rows</option>
                                        <option value="400">400 Rows</option>
                                        <option value="500">500 Rows</option>
                                    </select>
                                    <button
                                        onClick={exportToExcel}
                                        className="bg-[#3e76a5] text-white py-3 text-sm px-4 rounded-md capitalize"
                                        type="button"
                                        disabled={currentItems.length === 0}
                                    >
                                        Export to Excel
                                    </button>
                                </div>
                            </form>

                        </div>
                        <div className="col md:flex justify-end ">
                            <form action="">
                                <div className="flex md:items-stretch items-center gap-3">
                                    <input
                                        type="search"
                                        className='outline-none border-2 p-3 text-sm rounded-md w-full my-4 md:my-0'
                                        placeholder='Search Here...'
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                </div>
                            </form>
                        </div>

                    </div>

                    <div className='border'>
                        <select className='w-full p-3' onChange={handleStatusChange} name='is_bgv_submitted' id='is_bgv_submitted'>
                            <option value="">BGV Submitted</option>
                            {UniqueBgv.map((item, index) => {
                                return (
                                    <>
                                        <option value={item.cef_submitted}>
                                            {item.cef_submitted === 1 ? "Yes" : "No"}
                                        </option>
                                    </>

                                )
                            })}

                        </select>
                    </div>
                    <div className='bg-blue-600 p-4 text-white min-w-full'>
                        <marquee scrollamount="10">
                            <span className='text-xl font-bold uppercase tracking-[1px]'>
                                Filled BGV Applications: {counts.filled} || Not Filled BGV Applications: {counts.notFilled} || Expired Applications:{counts.expired}
                            </span>
                        </marquee>

                    </div>
                    <div className="overflow-x-auto py-6 md:px-4">
                        {candidateLoading ? (
                            <div className='flex justify-center items-center py-6 h-full'>
                                <PulseLoader color="#36D7B7" loading={candidateLoading} size={15} aria-label="candidateLoading Spinner" />

                            </div>
                        ) : currentItems.length > 0 ? (
                            <>
                                <table className="min-w-full">
                                    <thead>
                                        <tr className='bg-[#3e76a5]'>
                                            <th className="md:py-3 p-2 text-left border-r border-l text-white md:px-4 border-b whitespace-nowrap uppercase">SL NO.</th>
                                            <th className="md:py-3 p-2 text-left border-r text-white md:px-4 border-b whitespace-nowrap uppercase">Name of the applicant</th>
                                            <th className="md:py-3 p-2 text-left border-r text-white md:px-4 border-b whitespace-nowrap uppercase">Email Id</th>
                                            <th className="md:py-3 p-2 text-left border-r text-white md:px-4 border-b whitespace-nowrap uppercase">Mobile Number</th>
                                            <th className="md:py-3 p-2 text-left border-r text-white md:px-4 border-b whitespace-nowrap uppercase">Services</th>
                                            <th className="md:py-3 p-2 text-left border-r text-white md:px-4 border-b whitespace-nowrap uppercase">Date/Time</th>
                                            <th className="md:py-3 p-2 text-left border-r text-white md:px-4 border-b whitespace-nowrap uppercase">BGV Filled Date</th>
                                            <th className="md:py-3 p-2 text-left border-r text-white md:px-4 border-b whitespace-nowrap uppercase">DAV Filled Date</th>
                                            <th className="md:py-3 p-2 text-left border-r text-white md:px-4 border-b whitespace-nowrap uppercase">Is Form Opened</th>
                                            <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase text-white">Is Employment Gap</th>
                                            <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase text-white">Is Education Gap</th>
                                            <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase text-white">Gap Check</th>

                                            <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase text-white">
                                                BGV
                                            </th>

                                            <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase text-white">
                                                DAV
                                            </th>


                                            <th className="md:py-3 p-2 text-left border-r text-white md:px-4 border-b whitespace-nowrap uppercase">View Docs</th>
                                            <th className="md:py-3 p-2 text-center md:px-4 text-white border-r border-b whitespace-nowrap uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((report, index) => (
                                            <tr
                                                key={report.id || index}
                                                className={
                                                    report?.cef_submitted === 1
                                                        ? "bg-[#3e76a585] "
                                                        : report?.is_expired === 1
                                                            ? "bg-red-400 text-white"
                                                            : ""
                                                }
                                            >

                                                <td className="md:py-3 p-2 md:px-4 border-l border-b border-r whitespace-nowrap capitalize"> {index + 1 + (currentPage - 1) * itemsPerPage}</td>
                                                <td className="md:py-3 p-2 md:px-4 border-b border-r whitespace-nowrap capitalize">{report.name}</td>
                                                <td className="md:py-3 p-2 md:px-4 border-b border-r whitespace-nowrap capitalize">{report.email}</td>

                                                <td className="md:py-3 p-2 md:px-4 border-b border-r whitespace-nowrap capitalize">{report.mobile_number}</td>
                                                <td className="border p-2  md:px-4 py-2 text-left">
                                                    <div className='flex whitespace-nowrap'>
                                                        {Array.isArray(report.serviceNames) && report.serviceNames.length > 0 ? (
                                                            report.serviceNames.length === 1 ? (

                                                                <span className="md:px-4 py-2  border  border-[#3e76a5] rounded-lg text-sm">
                                                                    {typeof report.serviceNames[0] === "string"
                                                                        ? report.serviceNames[0]
                                                                        : report.serviceNames[0].join(", ")}
                                                                </span>
                                                            ) : (

                                                                <>
                                                                    {typeof report.serviceNames[0] === "string" ? (
                                                                        <span className="md:px-4 py-2 p-2 border border-[#3e76a5] rounded-lg text-xs md:text-sm">
                                                                            {report.serviceNames[0]}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="md:px-4 py-2  border  border-[#3e76a5] rounded-lg text-sm">
                                                                            {report.serviceNames[0].join(", ")}
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        className="text-[#3e76a5] ml-2"
                                                                        onClick={() => handleViewMore(report.serviceNames)}
                                                                    >
                                                                        View More
                                                                    </button>
                                                                </>
                                                            )
                                                        ) : (
                                                            // No services or serviceNames is not an array
                                                            <span className="md:px-4 py-2 bg-red-100 border border-red-500 rounded-lg">
                                                                You have no services
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                {isModalOpen && (
                                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                                        <div className="bg-white rounded-lg shadow-lg md:p-4 p-2 w-11/12 md:w-1/3 h-[calc(100vh-20%)] max-h-[80vh] overflow-y-auto">
                                                            <div className="flex justify-between items-center">
                                                                <h2 className="text-lg font-bold">Services</h2>
                                                                <button className="text-red-500 text-2xl" onClick={handleCloseModal}>
                                                                    &times;
                                                                </button>
                                                            </div>
                                                            <div className="mt-4 flex flex-wrap gap-2 w-full m-auto h-auto">
                                                                {modalServices.length > 0 ? (
                                                                    modalServices.map((service, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="md:px-4 py-2 border border-[#3e76a5] text-xs text-center p-2 rounded-lg md:text-sm"
                                                                        >
                                                                            {service}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-gray-500">No service available</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                )}



                                                <td className="md:py-3 p-2 md:px-4 border-b border-r whitespace-nowrap capitalize">
                                                    {report.created_at ? (
                                                        (() => {
                                                            const date = new Date(report.created_at);
                                                            const day = String(date.getDate()).padStart(2, '0');
                                                            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
                                                            const year = date.getFullYear();
                                                            return `${day}-${month}-${year}`;
                                                        })()
                                                    ) : 'NIL'}
                                                </td>



                                                {currentItems.some(item => item.cef_filled_date) ? (
                                                    <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                        {report.cef_filled_date
                                                            ? (new Date(report.cef_filled_date))
                                                                .toLocaleDateString('en-GB') // Format as DD/MM/YYYY
                                                                .split('/')
                                                                .map((item, index) => index === 0 || index === 1 ? item.replace(/^0/, '') : item) // Remove leading zero from day and month
                                                                .join('-')
                                                            : 'NIL'}
                                                    </td>

                                                ) : (
                                                    <td className="border px-4 py-2">NIL</td>
                                                )}


                                                {currentItems.some(item => item.dav_filled_date) ? (
                                                    <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                        {report.dav_filled_date
                                                            ? (new Date(report.dav_filled_date))
                                                                .toLocaleDateString('en-GB') // Format as DD/MM/YYYY
                                                                .split('/')
                                                                .map((item, index) => index === 0 || index === 1 ? item.replace(/^0/, '') : item) // Remove leading zero from day and month
                                                                .join('-')
                                                            : 'NIL'}
                                                    </td>
                                                ) : (
                                                    <td className="border px-4 py-2">NIL</td>
                                                )}

                                                <td className="md:py-3 p-2 md:px-4 border-b border-r whitespace-nowrap capitalize">
                                                    {
                                                        report.is_bgv_form_opened === "1" ? (
                                                            <span className="text-[#3e76a5]">Open</span>  // Green text for "Open"
                                                        ) : (
                                                            <span className="text-red-500">Not Yet Opened</span>  // Red text for "Not Yet Opened"
                                                        )
                                                    }
                                                </td>
                                                <td
                                                    className={`px-4 border-b border-r-2 whitespace-nowrap uppercase ${report.is_employment_gap === "no"
                                                        ? "text-[#3e76a5]"
                                                        : report.is_employment_gap === "yes"
                                                            ? "text-red-500"
                                                            : "text-black"
                                                        }`}
                                                >
                                                    {report.is_employment_gap || "NIL"}
                                                </td>


                                                <td
                                                    className={`px-4 border-b border-r-2 whitespace-nowrap uppercase ${report.is_education_gap === "no"
                                                        ? "text-[#3e76a5]"
                                                        : report.is_education_gap === "yes"
                                                            ? "text-red-500"
                                                            : "text-black"
                                                        }`}
                                                >
                                                    {report.is_education_gap || "NIL"}
                                                </td>
                                                <td
                                                    className={`px-4 border-b border-r-2 whitespace-nowrap uppercase ${report.is_employment_gap === "no"
                                                        ? "text-[#3e76a5]"
                                                        : report.is_employment_gap === "yes"
                                                            ? "text-red-500"
                                                            : "text-black"
                                                        }`}
                                                >
                                                    {report.is_employment_gap === "yes" || report.is_employment_gap === "no" ? (
                                                        <button
                                                            className=""
                                                            onClick={() =>
                                                                handleCheckGap(report.cef_id, report.branch_id, report.main_id)
                                                            }
                                                        >
                                                            Check GAP STATUS
                                                        </button>
                                                    ) : (
                                                        "NIL"
                                                    )}
                                                </td>


                                                {report.cef_id ? (
                                                    <td className="border px-4 py-2">
                                                        <button
                                                            className="bg-blue-500 uppercase border border-white hover:border-blue-500 text-white px-4 py-2 rounded hover:bg-white hover:text-blue-500"
                                                            onClick={() => handleBGVClick(report.cef_id, report.branch_id, report.main_id)}
                                                        >
                                                            BGV
                                                        </button>
                                                    </td>
                                                ) : (
                                                    <td className="border px-4 py-2">NIL</td>
                                                )}



                                                {report.dav_id ? (
                                                    <td className="border px-4 py-2">
                                                        <button
                                                            className="bg-purple-500 uppercase border border-white hover:border-purple-500 text-white px-4 py-2 rounded hover:bg-white hover:text-purple-500"
                                                            onClick={() => handleDAVClick(report.dav_id, report.branch_id, report.main_id)}
                                                        >
                                                            DAV
                                                        </button>
                                                    </td>
                                                ) : (
                                                    <td className="border px-4 py-2">NIL</td>
                                                )}

                                                {/* {report.cef_submitted === 0 || (report.dav_exist === 1 && report.dav_submitted === 0) ? (
                                                <td className="border px-4 py-2">
                                                    <button
                                                        className={`bg-[#3e76a5] uppercase border border-white hover:border-[#3e76a5] text-white px-4 py-2 rounded hover:bg-white ${loadingRow === report.id ? "opacity-50 cursor-not-allowed hover:text-[#3e76a5] " : "hover:text-[#3e76a5]"
                                                            }`}
                                                        onClick={() => handleSendLink(report.main_id, report.branch_id, report.customer_id, report.id)}
                                                        disabled={loadingRow} // Disable only the clicked button
                                                    >
                                                        {loadingRow === report.id ? "Sending..." : "SEND LINK"}
                                                    </button>
                                                </td>
                                            ) : <td className="border px-4 py-2">NIL</td>} */}

                                                <td className="md:py-3 p-2 md:px-4 border whitespace-nowrap">
                                                    {report.service_data?.cef &&
                                                        (Object.keys(report.service_data.cef).length > 0 || typeof report.service_data.cef === 'string') ? (
                                                        <button
                                                            className="md:px-4 py-2 p-2 bg-[#3e76a5] text-white rounded"
                                                            onClick={() => handleViewDocuments(report.service_data.cef)}
                                                        >
                                                            View Documents
                                                        </button>
                                                    ) : (
                                                        <span>No Attachments</span>
                                                    )}
                                                </td>

                                                {isModalOpenDoc && (
                                                    <Modal
                                                        isOpen={isModalOpenDoc}
                                                        onRequestClose={handleCloseModalDoc}
                                                        className="custom-modal-content"
                                                        overlayClassName="custom-modal-overlay"
                                                    >
                                                        <div className="modal-container">
                                                            <h2 className="modal-title text-center my-4 text-2xl font-bold">Attachments</h2>
                                                            <ul className="modal-list md:max-h-[400px] max-h-[250px] overflow-scroll">
                                                                {Object.entries(selectedAttachments).map(([category, attachments], idx) => (
                                                                    <li key={idx} className="modal-list-category">
                                                                        <h3 className="modal-category-title md:text-lg font-semibold my-2">{category}</h3>
                                                                        <ul>
                                                                            {attachments.map((attachment, subIdx) => {
                                                                                const label = Object.keys(attachment)[0];
                                                                                const fileUrls = attachment[label]?.split(','); // Split URLs by comma
                                                                                return (
                                                                                    <li key={subIdx} className="grid items-center grid-cols-2 border-b py-2">
                                                                                        <span className="modal-list-text">{subIdx + 1}: {label}</span>
                                                                                        <div className="modal-url-list grid md:me-7 gap-2 justify-end">
                                                                                            {fileUrls.map((url, urlIdx) => (
                                                                                                <a
                                                                                                    key={urlIdx}
                                                                                                    href={url.trim()} // Trim to remove any extra spaces
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="modal-view-button w-auto m-0 bg-[#3e76a5] text-white p-2 rounded-md md:px-4 block mt-2 text-center"
                                                                                                >
                                                                                                    View {urlIdx + 1}
                                                                                                </a>
                                                                                            ))}
                                                                                        </div>
                                                                                    </li>
                                                                                );
                                                                            })}

                                                                        </ul>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <div className="modal-footer">
                                                                <button className="modal-close-button" onClick={handleCloseModalDoc}>
                                                                    Close
                                                                </button>
                                                                <button className="modal-download-button bg-blue-500 p-3 text-white rounded-md px-4 ms-3" onClick={() => handleDownloadAll(selectedAttachments)}>
                                                                    Download All
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </Modal>
                                                )}



                                                <td className="md:py-3 p-2 md:px-4 border-b border-r whitespace-nowrap capitalize text-center">
                                                    <button disabled={isBranchApiLoading} className="bg-[#3e76a5] text-white p-3 rounded-md hover:bg-[#3e76a5]" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); handleEdit(report) }}>Edit</button>
                                                    <button disabled={isBranchApiLoading} className="bg-red-600 text-white p-3 ms-3 rounded-md hover:bg-red-200" onClick={() => handleDelete(report.id)}>Delete</button>
                                                    <button disabled={isBranchApiLoading || report?.is_converted_to_client === "1" || report?.cef_submitted === 0} className="border border-[#3e76a5] text-black p-3 ms-3 rounded-md hover:bg-[#3e76a5]" onClick={(e) => handleSubmitClient(e, report)}>{report?.is_converted_to_client === "1" ? 'Already Converted' : "Convert to Client"}</button>
                                                </td>
                                            </tr>

                                        ))}

                                        {isFormModalOpen && (
                                            <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
                                                <div className="bg-white p-6 rounded-md md:w-5/12">
                                                    <h2 className="text-xl font-semibold mb-4 text-center">Convert to Client</h2>

                                                    <form>
                                                        {!employeeId.employee_id && (
                                                            <div className="mb-4">
                                                                <label htmlFor="employee_id" className='text-sm'>
                                                                    Employee ID<span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="employee_id"
                                                                    id="EmployeeId"
                                                                    className="border w-full capitalize rounded-md p-2 mt-2"
                                                                    onChange={handleChange}
                                                                    value={(clientInput.employee_id || '').toUpperCase()}
                                                                />
                                                                {inputError.employee_id && <p className='text-red-500'>{inputError.employee_id}</p>}
                                                            </div>
                                                        )}

                                                        <div className="md:flex gap-5">

                                                            <div className="mb-4 md:w-6/12">
                                                                <label htmlFor="spoc" className='text-sm'>Name of the SPOC<span className="text-red-500">*</span></label>
                                                                <input type="text" name="spoc" id="spoc" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.spoc} />
                                                                {inputError.spoc && <p className='text-red-500'>{inputError.spoc}</p>}
                                                            </div>
                                                            <div className="mb-4 md:w-6/12">
                                                                <label htmlFor="location" className='text-sm'>Location</label>
                                                                <input type="text" name="location" id="Locations" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.location} />
                                                            </div>
                                                        </div>

                                                        <div className="md:flex gap-5">
                                                            <div className="mb-4 md:w-6/12">
                                                                <label htmlFor="batch_number" className='text-sm'>Batch number</label>
                                                                <input type="text" name="batch_number" id="Batch-Number" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.batch_number} />
                                                            </div>
                                                            <div className="mb-4 md:w-6/12">
                                                                <label htmlFor="sub_client" className='text-sm'>Sub client</label>
                                                                <input type="text" name="sub_client" id="SubClient" className="border w-full capitalize rounded-md p-2 mt-2" onChange={handleChange} value={clientInput.sub_client} />
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3">
                                                            <button
                                                                type="submit"
                                                                onClick={handleSubmitClient}
                                                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500"
                                                            >
                                                                Submit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={closeModal}
                                                                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                                                            >
                                                                Close
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </tbody>

                                </table>


                            </>
                        ) : (
                            <div className="text-center py-6">
                                <p>No Data Found</p>
                            </div>
                        )}


                    </div>

                    <div className="flex items-center justify-end  rounded-md bg-white md:px-4 md:py-3 p-2 sm:px-6 md:m-4 mt-2">
                        <button
                            onClick={showPrev}
                            disabled={currentPage === 1}
                            className="inline-flex items-center rounded-0 border border-gray-300 bg-white md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            aria-label="Previous page"
                        >
                            <MdArrowBackIosNew />
                        </button>
                        <div className="flex items-center">
                            {renderPagination()}
                        </div>
                        <button
                            onClick={showNext}
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center rounded-0 border border-gray-300 bg-white md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            aria-label="Next page"
                        >
                            <MdArrowForwardIos />
                        </button>
                    </div>
                </div>

            </div >

        </>
    );
};

export default CandidateList;
