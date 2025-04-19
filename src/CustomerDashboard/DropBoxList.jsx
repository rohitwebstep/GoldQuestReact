import React, { useContext, useEffect, useState } from 'react'
import Swal from 'sweetalert2';
import DropBoxContext from './DropBoxContext';
import { useApi } from '../ApiContext';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import ClientForm from './ClientForm';
import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


const DropBoxList = () => {
    const { isBranchApiLoading, setIsBranchApiLoading ,checkBranchAuthentication} = useApiCall();

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalServices, setModalServices] = React.useState([]);
    const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;
    const [activeReportId, setActiveReportId] = useState(null); // Track which report's modal is active

    const openModal = (reportId) => {
        setActiveReportId(reportId); // Set the active report ID to open its modal
    };

    const closeModal = () => {
        setActiveReportId(null); // Reset active report ID to close the modal
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemPerPage] = useState(10)
    const API_URL = useApi();
    const [currentPage, setCurrentPage] = useState(1);
    const { handleEditDrop, fetchClientDrop, listData, loading } = useContext(DropBoxContext);

  
     useEffect(() => {
         const fetchDataMain = async () => {
           if (!isBranchApiLoading) {
             await checkBranchAuthentication();
             await fetchClientDrop();
           }
         };
     
         fetchDataMain();
       }, [fetchClientDrop]);
    const handleViewMore = (services) => {
        setModalServices(services);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalServices([]);
    };

    const filteredItems = listData.filter(item => {
        return (
            item.application_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())

        );
    });


    const handleEdit = (client) => {
        handleEditDrop(client);
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

            const response = await axios.post(
                "https://api.goldquestglobal.in/test/image-to-base",
                raw,
                { headers }
            );

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

            // Collect all image URLs
            const urls = attachments.split(',').map(url => url.trim()); // Split and trim the comma-separated URLs

            allUrls = urls.map(url => ({ category: "attachments", label: "image", urls: [url] }));

            if (allUrls.length === 0) {
                Swal.fire('No valid image URLs found', '', 'warning');
                return;
            }

            // Fetch all images as Base64
            const base64Response = await fetchImageToBase(urls); // Assuming fetchImageToBase returns Base64 images
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
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const showPrev = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const showNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };


    const renderPagination = () => {
        const pageNumbers = [];

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);

            if (currentPage > 3) {
                pageNumbers.push('...');
            }
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                if (!pageNumbers.includes(i)) {
                    pageNumbers.push(i);
                }
            }
            if (currentPage < totalPages - 2) {
                pageNumbers.push('...');
            }

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
                const branchData = JSON.parse(localStorage.getItem("branch"));
                const branch_id = JSON.parse(localStorage.getItem("branch"))?.branch_id;
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


                const payLoad = {
                    branch_id: branch_id,
                    id: id,
                    _token: _token,
                    ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
                };

                // Convert the object to a query string
                const queryString = new URLSearchParams(payLoad).toString();
                fetch(`${API_URL}/branch/client-application/delete?${queryString}`, requestOptions)
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
                        fetchClientDrop();
                        Swal.fire(
                            'Deleted!',
                            'Your Client Application has been deleted.',
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


    const exportToExcel = () => {
        // Prepare the data for Excel export
        const data = currentItems.map((data, index) => ({
            "INDEX": index + 1,
            "TAT DAYS": data?.tat_days || "NIL",
            "LOCATION NAME": data.location || "NIL",
            "BATCH NUMBER": data.batch_number || "NIL",
            "APPLICATION ID": data.application_id || "NIL",
            "NAME OF THE APPLICANT": data.name || "NIL",
            "APPLICANT EMPLOYEE ID": data.employee_id || "NIL",
            "INITIATION DATE": data.created_at ? new Date(data.created_at).toLocaleDateString() : "NIL",
            "DOWNLOAD REPORT STATUS": data.is_report_downloaded ? "Downloaded" : "Not Downloaded",
            "REPORT TYPE": data.report_type || "NIL",
            "REPORT DATE": data.report_date ? new Date(data.report_date).toLocaleDateString() : "NIL",
            "OVERALL STATUS": data.overall_status || "NIL",
            Services: data.serviceNames ? data.serviceNames.join(', ') : 'No Services',
            "FIRST LEVEL INSUFF REMARKS": data.first_insufficiency_marks || "NIL",
            "FIRST INSUFF DATE": data.first_insuff_date ? new Date(data.first_insuff_date).toLocaleDateString() : "NIL",
            "FIRST INSUFF CLEARED": data.first_insuff_reopened_date ? new Date(data.first_insuff_reopened_date).toLocaleDateString() : "NIL",
            "SECOND LEVEL INSUFF REMARKS": data.second_insufficiency_marks || "NIL",
            "SECOND INSUFF DATE": data.second_insuff_date ? new Date(data.second_insuff_date).toLocaleDateString() : "NIL",
            "SECOND INSUFF CLEARED": data.second_insuff_reopened_date ? new Date(data.second_insuff_reopened_date).toLocaleDateString() : "NIL",
            "THIRD LEVEL INSUFF REMARKS": data.third_insufficiency_marks || "NIL",
            "THIRD INSUFF DATE": data.third_insuff_date ? new Date(data.third_insuff_date).toLocaleDateString() : "NIL",
            "THIRD INSUFF CLEARED": data.third_insuff_reopened_date ? new Date(data.third_insuff_reopened_date).toLocaleDateString() : "NIL",
            "REMARKS & REASON FOR DELAY": data.delay_reason || "NIL",
            "ADDRESS": data.address || "NIL",
            "EDUCATION": data.education || "NIL",
            "BASIC ENTRY": data.basic_entry || "NIL",
            "CASE UPLOADED": data.case_upload || "NIL",
            "EMPLOYEMENT SPOC": data.single_point_of_contact || "NIL",
            "REPORT GENERATED BY": data.report_generated_by_name || "NIL",
            "QC DONE BY": data.qc_done_by_name || "NIL",
        }));

        // Create a new worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Create a new workbook and append the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reports');

        // Export the workbook to Excel
        XLSX.writeFile(wb, 'Client-Applications.xlsx');
    };


    return (
        <>
            <div className=" py-4 md:py-16">
                <h2 className='md:text-4xl text-2xl font-bold pb-8 md:pb-4 text-center'>Client DropBox</h2>
                <div className="m-5">
                    <div>
                        <ClientForm />
                    </div>

                </div>
                <div className="overflow-x-auto py-6 px-4 bg-white shadow-md rounded-md md:m-10 m-3">
                    <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4">
                        <div className="col">
                            <form action="">
                                <div className="flex gap-2">
                                    <select name="options" id="" onChange={(e) => {
                                        handleSelectChange(e); // Call the select change handler
                                        setCurrentPage(1); // Reset current page to 1
                                    }} className='outline-none pe-14 ps-2 text-left p-3 md:w-6/12 w-7/12 rounded-md border'>
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
                                        className="bg-[#3e76a5] text-white text-sm py-3 px-4 rounded-md capitalize"
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
                                        className="outline-none border-2 p-3 text-sm rounded-md w-full my-4 md:my-0"
                                        placeholder="Search Here..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="overflow-x-auto py-6 px-4">
                        {loading ? (
                            <div className='flex justify-center items-center py-6 h-full'>
                                <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="loading Spinner" />

                            </div>
                        ) : currentItems.length > 0 ? (
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-[#3e76a5]">
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">SL NO.</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Photo</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Application Id	</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Employee Name</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Application Date/time</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Location</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Batch Number</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Sub Client</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Documents</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Services</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Spoc Case Name</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Employee Id</th>
                                        <th className="py-3 text-center text-white px-4 border-b whitespace-nowrap uppercase">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {currentItems.map((report, index) => (
                                        <tr key={index} id={report.id}>
                                            <td className="py-3 px-4 border-b border-r text-center border-l whitespace-nowrap">
                                                {index + 1 + (currentPage - 1) * itemsPerPage}
                                            </td>

                                            <td className="py-3 px-4 border-b border-r text-center whitespace-nowrap">
                                                <div className='flex gap-3'> {report.photo ? (
                                                    report.photo.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                        <img
                                                            src={`${report.photo}`}
                                                            alt="Image"
                                                            className="md:h-20 h-10 w-20"
                                                        />
                                                    ) : (
                                                        <a href={`${report.photo}`} target="_blank" rel="noopener noreferrer">
                                                            <button type="button" className="px-4 py-2 bg-[#3e76a5] text-white rounded">
                                                                View Document
                                                            </button>
                                                        </a>
                                                    )
                                                ) : (
                                                    'No Image Found'
                                                )}</div>
                                            </td>

                                            <td className="py-3 px-4 border-b border-r text-center whitespace-nowrap">{report.application_id || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap">{report.name || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap">
                                                {new Date(report.created_at).getDate()}-
                                                {new Date(report.created_at).getMonth() + 1}-
                                                {new Date(report.created_at).getFullYear()}
                                            </td>

                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap">{report.location || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap">{report.batch_number || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap">{report.sub_client || 'NIL'}</td>

                                            <td className="py-3 px-4 border-b border-r text-center whitespace-nowrap">
                                                {report.attach_documents ? (
                                                    <>

                                                        {report.attach_documents.split(',').length > 0 ? (
                                                            <button
                                                                onClick={() => openModal(report.id)} // Open modal for clicked report
                                                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                                                            >
                                                                View All Documents
                                                            </button>
                                                        ) : null}
                                                    </>
                                                ) : (
                                                    'No Image Found'
                                                )}
                                            </td>


                                            {activeReportId === report.id && (
                                                <div className="fixed inset-0 z-50 bg-gray-800 bg-opacity-50 flex p-4 justify-center items-center">
                                                    <div className="bg-white rounded-lg p-6 md:w-6/12 h-[400px] md:h-[500px] overflow-x-auto">
                                                        <div className='flex flex-wrap justify-between items-center pb-3'> <h2 className="md:text-xl font-semibold mb-4 text-sm">All Documents</h2>
                                                            <div className='flex gap-2'><button className="modal-download-button text-sm bg-blue-500 p-3 text-white rounded-md px-4 ms-3" onClick={() => handleDownloadAll(report.attach_documents)}>
                                                                Download All
                                                            </button>
                                                                <button
                                                                    onClick={closeModal}
                                                                    className=" px-4 py-2 bg-red-500 text-sm text-white rounded"
                                                                >
                                                                    Close
                                                                </button></div></div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {report.attach_documents.split(',').map((doc, index) => (
                                                                <div key={index} className="card border p-4 rounded-lg">
                                                                    {doc.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                                        <img
                                                                            src={doc}
                                                                            alt={`Document ${index + 1}`}
                                                                            className="w-full h-40 object-contain rounded-lg"
                                                                        />
                                                                    ) : (
                                                                        <a href={doc} target="_blank" rel="noopener noreferrer">
                                                                            <button type="button" className="px-4 py-2 bg-[#3e76a5] text-white rounded">
                                                                                View Document {index + 1}
                                                                            </button>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>



                                                    </div>
                                                </div>
                                            )}

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
                                                                    <span className="md:px-4 py-2  p-2 border border-[#3e76a5] rounded-lg text-xs md:text-sm">
                                                                        {report.serviceNames[0]}
                                                                    </span>
                                                                ) : (
                                                                    <span className="md:px-4 py-2   border  border-[#3e76a5] rounded-lg text-sm">
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

                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">{report.single_point_of_contact || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap">{report.employee_id}</td>
                                            <td className="py-3 px-4 border-b whitespace-nowrap border-r">
                                                <button className="bg-[#3e76a5] text-white p-3 rounded-md hover:bg-[#3e76a5]" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); handleEdit(report) }}>Edit</button>
                                                <button disabled={loading || isBranchApiLoading}
                                                    className={`rounded-md p-3 ms-2 text-white ${isBranchApiLoading || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-200'}`}

                                                    onClick={() => handleDelete(report.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>


                            </table>
                        ) : (
                            <div className="text-center py-6">
                                <p>No Data Found</p>
                            </div>
                        )}


                    </div>
                    <div className="flex items-center justify-end  rounded-md bg-white px-4 py-3 sm:px-6 md:m-4 mt-2">
                        <button
                            onClick={showPrev}
                            disabled={currentPage === 1}
                            className="inline-flex items-center rounded-0 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                            className="inline-flex items-center rounded-0 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            aria-label="Next page"
                        >
                            <MdArrowForwardIos />
                        </button>
                    </div>
                </div>

            </div >

        </>
    )
}

export default DropBoxList