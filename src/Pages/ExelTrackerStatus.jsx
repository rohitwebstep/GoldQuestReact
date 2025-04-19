import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useApi } from '../ApiContext';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useSidebar } from '../Sidebar/SidebarContext.jsx';
import { BranchContextExel } from './BranchContextExel';
import Swal from 'sweetalert2';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';
import verified from '../Images/verified.webp'
import isologo from '../Images/iso-logo.jpg'
const AdminChekin = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const { handleTabChange } = useSidebar();
    const [options, setOptions] = useState([]);
    const [branchData, setBranchData] = useState([]);
    const [expandedRow, setExpandedRow] = useState(null); // Initializing as null
    const navigate = useNavigate();
    const location = useLocation();
    const [itemsPerPage, setItemPerPage] = useState(10)
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [loadingStates, setLoadingStates] = useState({}); // To track loading state for each button
    const API_URL = useApi();
    const { branch_id } = useContext(BranchContextExel);
    const queryParams = new URLSearchParams(location.search);
    const clientId = queryParams.get('clientId');
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem('_token');

    const fetchData = useCallback((selected) => {
        if (!branch_id || !adminId || !token) {
            return; // Prevent fetch if essential data is missing
        } else {
            setLoading(true); // Show loading indicator
        }
        setIsApiLoading(true);

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        const url = `${API_URL}/client-master-tracker/applications-by-branch?branch_id=${branch_id}&admin_id=${adminId}&_token=${token}&filter_status=${selected}`;

        fetch(url, requestOptions)
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(result => {
                        const newToken = result._token || result.token;

                        if (newToken) {
                            localStorage.setItem("_token", newToken);
                        }

                        if (result.message && result.message.toLowerCase().includes("invalid token")) {
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                window.location.href = "/admin-login";
                            });

                            return;
                        }

                        Swal.fire({
                            title: "Error",
                            text: result.message || "An unknown error occurred.",
                            icon: "error",
                            confirmButtonText: "Ok",
                        });

                        throw new Error(result.message || "An unknown error occurred");
                    });
                }
                return response.json(); // Parse response if OK
            })
            .then((result) => {

                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                } else {
                    console.warn("No token found in response!");
                }

                setData(result.data?.customers || []); // Set customers data
                setBranchData(result.data?.customerName || []); // Set customers data
                setOptions(result.data?.filterOptions || []); // Set filter options
            })
            .catch((error) => {
                console.error("Fetch error:", error);
            })
            .finally(() => {
                setLoading(false);
                setIsApiLoading(false);
            });

    }, [branch_id, adminId, token, setData, setOptions]);


    // const fetchAdminList = useCallback(() => {
    //     setIsApiLoading(true);
    //     setLoading(true); // Start loading before fetching data
    //     const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    //     const token = localStorage.getItem('_token');

    //     if (!adminId || !token) {
    //         // If there's no adminId or token, stop execution and alert
    //         Swal.fire({
    //             title: "Session Expired",
    //             text: "No valid session found. Please log in again.",
    //             icon: "warning",
    //             confirmButtonText: "Ok",
    //         }).then(() => {
    //             window.location.href = "/admin-login"; // Force redirect to login page
    //         });
    //         setLoading(false); // Stop loading
    //         return;
    //     }

    //     const requestOptions = {
    //         method: "GET",
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         redirect: "follow"
    //     };


    //     fetch(`${API_URL}/client-master-tracker/list?admin_id=${adminId}&_token=${token}`, requestOptions)
    //         .then(response => {
    //             if (!response.ok) {
    //                 return response.json().then(result => {
    //                     throw new Error(result.message || 'Failed to load data'); // Throw error if response is not OK
    //                 });
    //             }
    //             return response.json(); // Parse the response JSON if the status is OK
    //         })
    //         .then((result) => {

    //             // Check for invalid or expired token in the response message
    //             if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
    //                 Swal.fire({
    //                     title: "Session Expired",
    //                     text: "Your session has expired. Please log in again.",
    //                     icon: "warning",
    //                     confirmButtonText: "Ok",
    //                 }).then(() => {
    //                     setTimeout(() => {
    //                         window.location.href = "/admin-login"; // Force redirect after a short delay to ensure Swal completes
    //                     }, 500); // Delay to allow Swal to process
    //                 });
    //                 throw new Error("Session expired"); // Stop further processing if token is invalid
    //             }

    //             // If a new token is received, update it in localStorage
    //             const newToken = result._token || result.token;
    //             if (newToken) {
    //                 localStorage.setItem("_token", newToken);
    //             }

    //             // Process the list of customers and extract `tat_days`
    //             const tat_days = result.customers.map(spoc => spoc.tat_days);

    //             setAdminTAT(tat_days); // Store the `tat_days` in state
    //         })
    //         .catch((error) => {
    //             console.error("Error fetching data:", error);

    //         })
    //         .finally(() => {
    //             setLoading(false);
    //             setIsApiLoading(false); // Stop loading once the fetch is complete
    //         });

    // }, []); // Empty dependency array to run on mount

    const goBack = () => {
        handleTabChange('client_master');
    }



    const handleStatusChange = (event) => {
        setSelectedStatus(event.target.value);
        const selected = event.target.value;
        fetchData(selected);
    };


    const filteredItems = data.filter(item => {
        return (
            item.application_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Function to reset expanded rows



    // useEffect(() => {
    //     document.addEventListener("mousedown", handleOutsideClick);
    //     return () => {
    //         document.removeEventListener("mousedown", handleOutsideClick);
    //     };
    // }, []);

    const handleDelete = (data) => {

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            showLoaderOnConfirm: true, // Show loading spinner while deleting
            preConfirm: () => {
                setIsApiLoading(true); // Set loading state to true when the request starts

                const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
                const storedToken = localStorage.getItem("_token");

                if (!admin_id || !storedToken) {
                    console.error("Admin ID or token is missing.");
                    Swal.fire('Error!', 'Admin ID or token is missing.', 'error');
                    setIsApiLoading(false); // Reset the loading state if admin ID or token is missing
                    return false;
                }

                const requestOptions = {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                };

                return fetch(`${API_URL}/client-master-tracker/delete?client_application_id=${data.id}&customer_id=${data.customer_id}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            return response.json().then((errorData) => {
                                // Handle invalid token scenario
                                if (errorData.message && errorData.message.toLowerCase().includes("invalid token")) {
                                    Swal.fire({
                                        title: "Session Expired",
                                        text: "Your session has expired. Please log in again.",
                                        icon: "warning",
                                        confirmButtonText: "Ok",
                                    }).then(() => {
                                        window.location.href = "/admin-login"; // Redirect to login if session expired
                                    });
                                } else {
                                    Swal.fire('Error!', `An error occurred: ${errorData.message}`, 'error');
                                }
                                throw new Error(errorData.message); // Propagate the error
                            });
                        }
                        return response.json(); // Parse the response if it's OK
                    })
                    .then((result) => {
                        const newToken = result._token || result.token;
                        if (newToken) {
                            localStorage.setItem("_token", newToken);
                        }
                        // Handle successful deletion
                        if (result.status === false) {
                            Swal.fire('Error!', result.message, 'error');
                            return false; // Exit early if the status is false
                        }

                        // Show success message and fetch updated data
                        Swal.fire('Deleted!', 'Your Application has been deleted.', 'success');
                        fetchData(); // Fetch the latest data
                    })
                    .catch((error) => {
                        console.error('Fetch error:', error);
                        Swal.fire('Error!', `Could not delete: ${error.message}`, 'error');
                        return false; // Return false in case of error
                    })
                    .finally(() => {
                        setIsApiLoading(false); // Set loading state to false after the request completes
                    });
            }
        });
    };



    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

    const showPrev = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const showNext = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        setExpandedRow(null); // Reset expanded row when page changes
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


    const fetchServicesData = async (applicationId, servicesList, reportDownload = 0) => {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");

        setIsApiLoading(true); // Start loading state

        // Return early if servicesList is empty
        if (!servicesList || servicesList.length === 0) {
            setIsApiLoading(false); // Stop loading if no services
            return [];
        }

        try {
            const url = `${API_URL}/client-master-tracker/services-annexure-data?service_ids=${encodeURIComponent(servicesList)}&report_download=${reportDownload}&application_id=${encodeURIComponent(applicationId)}&admin_id=${encodeURIComponent(adminId)}&_token=${encodeURIComponent(token)}`;

            const response = await fetch(url, { method: "GET", redirect: "follow" });

            if (response.ok) {
                const result = await response.json();

                const newToken = result.token || result._token || "";
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                const message = result.message?.message?.toLowerCase() || '';
                if (message.includes("invalid") || message.includes("expired") || message.includes("token")) {

                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        window.location.href = "/admin-login";
                    });
                    return; // Stop further execution if session expired
                }

                // If no invalid token message, proceed with result filtering
                const filteredResults = result.results.filter((item) => item != null);

                const sortedFilteredResults = filteredResults.sort((a, b) => {
                    const orderA = a.annexureData && a.annexureData.sorting_order != null
                        ? parseInt(a.annexureData.sorting_order) || Number.MAX_SAFE_INTEGER
                        : Number.MAX_SAFE_INTEGER;

                    const orderB = b.annexureData && b.annexureData.sorting_order != null
                        ? parseInt(b.annexureData.sorting_order) || Number.MAX_SAFE_INTEGER
                        : Number.MAX_SAFE_INTEGER;

                    return orderA - orderB;
                });

                return sortedFilteredResults;

            } else {
                const result = await response.json(); // Get the result to show the error message from API
                const errorMessage = result.message || response.statusText || 'Failed to fetch service data';
                console.error("API error:", errorMessage);

                // Check if the error message contains 'invalid' or 'expired' and prompt the user to log in again
                if (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("expired")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        window.location.href = "/admin-login";
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: errorMessage,
                    });
                }

                return [];
            }
        } catch (error) {
            console.error("Error occurred:", error);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to fetch service data',
            });

            return [];
        } finally {
            setIsApiLoading(false); // Stop loading state
        }
    };

    function addFooter(doc) {
        const footerHeight = 15; // Footer height
        const pageHeight = doc.internal.pageSize.height; // Get the total page height
        const footerYPosition = pageHeight - footerHeight + 10; // Position footer closer to the bottom

        // Define page width and margins
        const pageWidth = doc.internal.pageSize.width;
        const margin = 10; // Margins on the left and right

        // Space between sections (adjust dynamically based on page width)
        const availableWidth = pageWidth - 2 * margin; // Usable width excluding margins
        const centerX = pageWidth / 2; // Center of the page

        // Insert text into the center column (centered)
        const footerText = "No 293/154/172, 4th Floor, Outer Ring Road, Kadubeesanahalli, Marathahalli, Bangalore-560103 | www.goldquestglobal.in";
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0); // Set text color to black (RGB: 0, 0, 0)
        doc.setFontSize(7);
        doc.text(footerText, centerX, footerYPosition - 3, { align: 'center' }); // Adjusted vertical position

        // Insert page number into the right column (right-aligned)
        const pageCount = doc.internal.getNumberOfPages(); // Get total number of pages
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber; // Get current page number
        const pageNumberText = `Page ${currentPage} / ${pageCount}`;
        const pageNumberWidth = doc.getTextWidth(pageNumberText); // Calculate text width

        // Right-align page number with respect to the page width
        const pageNumberX = pageWidth - margin - pageNumberWidth;
        doc.text(pageNumberText, pageNumberX, footerYPosition - 3); // Adjusted vertical position

        // Draw a line above the footer
        doc.setLineWidth(0.3);
        doc.setDrawColor(0, 0, 0); // Set line color to black (RGB: 0, 0, 0)
        doc.line(margin, footerYPosition - 7, pageWidth - margin, footerYPosition - 7); // Line above the footer
    }


    const fetchImageToBase = async (imageUrls) => {
        setIsApiLoading(true); // Set loading state to true before making the request
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
            setIsApiLoading(false);
        }
    };


    const generatePDF = async (index, reportDownloadFlag, reportInfo) => {


        const swalLoading = Swal.fire({
            title: 'Generating PDF...',
            text: 'Please wait a moment.',
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        try {
            const applicationInfo = data.find(item => item.main_id === reportInfo.main_id);
            const servicesData = await fetchServicesData(applicationInfo.main_id, applicationInfo.services, reportDownloadFlag);
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPosition = 5;
            const backgroundColor = '#f5f5f5';

            doc.addImage("https://i0.wp.com/goldquestglobal.in/wp-content/uploads/2024/03/goldquestglobal.png?w=771&ssl=1", 'PNG', 10, yPosition, 50, 30);

            const rightImageX = pageWidth - 10 - 70; // Page width minus margin (10) and image width (50)
            doc.addImage(isologo, 'PNG', rightImageX + 34, yPosition, 30, 25);

            if (applicationInfo?.photo) {
                const imageBases = await fetchImageToBase([applicationInfo?.photo.trim()]);
                doc.addImage(imageBases?.[0]?.base64 || "https://static-00.iconduck.com/assets.00/profile-circle-icon-512x512-zxne30hp.png", 'PNG', rightImageX, yPosition, 25, 25);

            } else {

            }


            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);

            doc.text("CONFIDENTIAL BACKGROUND VERIFICATION REPORT", 105, 40, { align: 'center' });

            const getStatusColor = (status) => {
                let statusColor;
                let statusText = status;  // Remove 'completed_' and convert to uppercase
                switch (statusText.toLowerCase()) {
                    case 'green':
                        statusColor = { textColor: 'green' }; // Green text
                        break;
                    case 'red':
                        statusColor = { textColor: 'red' }; // Red text
                        break;
                    case 'orange':
                        statusColor = { textColor: 'orange' }; // Orange text
                        break;
                    case 'yellow':
                        statusColor = { textColor: 'yellow' }; // Yellow text
                        break;
                    case 'pink':
                        statusColor = { textColor: 'pink' }; // Pink text
                        break;
                    default:
                        statusColor = { textColor: '#000000' }; // Default black text if no match
                        break;
                }
                return statusColor;
            };

            // First Table
            const firstTableData = [
                [
                    { content: 'Name of the Candidate', styles: { cellWidth: 'auto', fontStyle: 'bold' } },
                    { content: applicationInfo?.name || 'NA' },
                    { content: 'Client Name', styles: { cellWidth: 'auto', fontStyle: 'bold' } },
                    { content: branchData || 'NA' },
                ],
                [
                    { content: 'Application ID', styles: { fontStyle: 'bold' } },
                    { content: applicationInfo?.application_id || 'NA' },
                    { content: 'Report Status', styles: { fontStyle: 'bold' } },
                    {
                        content: applicationInfo?.report_status
                            ? applicationInfo.report_status
                                .replace(/[-_]/g, ' ') // Replace '-' and '_' with space
                                .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize each word
                            : 'NA'
                    }

                ],
                [
                    { content: 'Date of Birth', styles: { fontStyle: 'bold' } },
                    {
                        content: applicationInfo?.dob
                            ? new Date(applicationInfo.dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                            : "NA"
                    },

                    { content: 'Application Received', styles: { fontStyle: 'bold' } },
                    {
                        content: applicationInfo?.created_at
                            ? new Date(applicationInfo.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : "NA"
                    }


                ],
                [
                    { content: 'Candidate Employee ID', styles: { fontStyle: 'bold' } },
                    { content: applicationInfo?.employee_id || 'NA' },
                    { content: 'Insuff Cleared/Reopened', styles: { fontStyle: 'bold' } },
                    {
                        content: applicationInfo?.first_insuff_reopened_date
                            ? new Date(applicationInfo.first_insuff_reopened_date).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : 'NA'
                    }

                ],
                [
                    { content: 'Report Type', styles: { fontStyle: 'bold' } },
                    {
                        content: applicationInfo?.report_type
                            ? applicationInfo.report_type
                                .replace(/[-_]/g, ' ') // Replace '-' and '_' with space
                                .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize each word
                            : 'NA'
                    },

                    { content: 'Final Report Date', styles: { fontStyle: 'bold' } },
                    {
                        content: applicationInfo?.report_date
                            ? new Date(applicationInfo.report_date).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : 'NA'
                    }
                ],
                [
                    { content: 'Verification Purpose', styles: { fontStyle: 'bold' } },
                    { content: applicationInfo?.purpose_of_application?.toLowerCase() || 'NA' },
                    { content: 'Overall Report Status', styles: { fontStyle: 'bold' } },
                    {
                        content: applicationInfo?.final_verification_status.toUpperCase() || 'NA', // Show only the color name (e.g., GREEN, RED, etc.)
                        styles: { fontStyle: 'bold', ...getStatusColor(applicationInfo?.final_verification_status) } // Apply dynamic text color
                    },
                ],
            ];

            doc.autoTable({
                head: [],  // Remove the header by setting it to an empty array
                body: firstTableData,
                styles: {
                    cellPadding: 2,
                    fontSize: 10,
                    valign: 'middle',
                    lineColor: [62, 118, 165],
                    lineWidth: 0.4,  // Border width for the table
                    textColor: '#000',  // Default text color
                },
                headStyles: {
                    fillColor: [255, 255, 255],  // Ensure no background color for the header
                    textColor: 0,                // Optional: Reset header text color
                    lineColor: [62, 118, 165],
                    lineWidth: 0.2,  // Reduced border width for header
                },
                theme: 'grid',
                margin: { top: 50 },
                // Customize the overall status text color
                willDrawCell: (data) => {
                    const statusCell = data.cell.raw && data.cell.raw.content;
                    const statusRow = firstTableData[5];  // We assume the status row is in index 5

                    if (statusCell === statusRow[3].content) {
                        const { textColor } = getStatusColor(statusCell);
                        data.cell.styles.textColor = textColor;  // Apply dynamic text color
                    }
                },
            });


            addFooter(doc);
            const secondTableData = servicesData.map(item => {
                const sourceKey = item.annexureData
                    ? Object.keys(item.annexureData).find(key => key.startsWith('info_source') || key.startsWith('information_source'))
                    : undefined;
                const dateKey = item.annexureData && Object.keys(item.annexureData).find(key => key.includes('verified_date'));

                return {
                    component: item.heading || 'NIL',
                    source: sourceKey ? item.annexureData[sourceKey] : 'NIL',
                    completedDate: dateKey && item.annexureData[dateKey] && !isNaN(new Date(item.annexureData[dateKey]).getTime())
                        ? new Date(item.annexureData[dateKey]).toLocaleDateString('en-GB').replace(/\//g, "-") // Use 'en-GB' for DD-MM-YYYY format
                        : 'NIL'
                    ,
                    status: item.annexureData && item.annexureData.status ? item.annexureData.status : 'Initiated',
                };
            });

            console.log('servicesData', servicesData);
            console.log('secondTableData', secondTableData);

            const filteredSecondTableData = secondTableData.filter(row =>
                [row.component, row.source, row.completedDate, row.status].some(value => value !== 'NIL')
            );

            console.log('filteredSecondTableData', filteredSecondTableData);


            // Generate the Second Table


            // Generate the Second Table
            doc.autoTable({
                head: [
                    [
                        {
                            content: 'REPORT COMPONENT',
                            rowSpan: 2,
                            styles: {
                                halign: 'center',
                                valign: 'middle', // <== Vertically center text
                                fillColor: "#6495ed",
                                textColor: [255, 255, 255],
                                fontStyle: 'bold',
                                cellPadding: 3,
                            },
                        },
                        {
                            content: 'INFORMATION SOURCE',
                            rowSpan: 2,
                            styles: {
                                halign: 'center',
                                valign: 'middle', // <== Vertically center text
                                fillColor: "#6495ed",
                                textColor: [255, 255, 255],
                                fontStyle: 'bold',
                            },
                        },
                        {
                            content: 'COMPONENT STATUS',
                            colSpan: 2,
                            styles: {
                                halign: 'center',
                                valign: 'middle',
                                fillColor: "#6495ed",
                                textColor: [255, 255, 255],
                                fontStyle: 'bold',
                            },
                        },
                    ],
                    [
                        // Only include cells under the colSpan above
                        {
                            content: 'COMPLETED DATE',
                            styles: {
                                halign: 'center',
                                fillColor: "#6495ed",
                                textColor: [255, 255, 255],
                                lineWidth: 0.4,
                                fontStyle: 'bold',
                            },
                        },
                        {
                            content: 'VERIFICATION STATUS',
                            styles: {
                                halign: 'center',
                                fillColor: "#6495ed",
                                textColor: [255, 255, 255],
                                lineWidth: 0.4,
                                fontStyle: 'bold',
                            },
                        },
                    ]
                ],
                body: filteredSecondTableData.map(row => {
                    // Set text color based on verification status
                    let statusColor;
                    let statusText = row.status.replace(/^completed_/, '').toUpperCase(); // Remove 'completed_' and convert to uppercase

                    // Determine the color based on status
                    switch (statusText.toLowerCase()) {
                        case 'green':
                            statusColor = { textColor: 'green' }; // Green text
                            break;
                        case 'red':
                            statusColor = { textColor: 'red' }; // Red text
                            break;
                        case 'orange':
                            statusColor = { textColor: 'orange' }; // Orange text
                            break;
                        case 'yellow':
                            statusColor = { textColor: 'yellow' }; // Yellow text
                            break;
                        case 'pink':
                            statusColor = { textColor: 'pink' }; // Pink text
                            break;
                        default:
                            statusColor = { textColor: '#000000' }; // Default black text if no match
                            break;
                    }

                    // Only return a row if the component is not 'NIL'
                    if (row.component !== 'NIL') {
                        return [
                            row.component || 'NIL',
                            row.source || 'NIL',
                            row.completedDate || 'NIL', // Show completedDate in its own column
                            {
                                content: statusText, // Show only the color name (e.g., GREEN, RED, etc.)
                                styles: { halign: 'center', fontStyle: 'bold', ...statusColor } // Apply dynamic text color
                            },
                        ];
                    }
                }).filter(Boolean), // Filter out undefined rows from the map (if any)

                styles: {
                    cellPadding: 2,
                    fontSize: 10,
                    valign: 'middle',
                    lineWidth: 0.3,
                    lineColor: "#6495ed",
                    textColor: [0, 0, 0],
                    tableLineColor: [100, 149, 237],
                },
                theme: 'grid',
                headStyles: {
                    fillColor: [61, 117, 166],
                    textColor: [0, 0, 0],
                    lineWidth: 0.3,
                    fontStyle: 'bold',
                    lineColor: [61, 117, 166],
                },
                bodyStyles: {
                    lineColor: [61, 117, 166],
                    lineWidth: 0.3,
                },
                columnStyles: {
                    0: { halign: 'left' },
                    1: { halign: 'center' },
                    2: { halign: 'center' }, // Center alignment for the completed date column
                    3: { halign: 'center' }, // Center alignment for the status column
                },
            });


            addFooter(doc);
            const pageHeight = doc.internal.pageSize.height;
            yPosition = doc.lastAutoTable.finalY || 0; // Current Y position


            // Check if adding the space will exceed the page height


            if (yPosition + 70 > pageHeight) {
                addFooter(doc);  // Add the footer before adding a new page
                doc.addPage();   // Add a new page
                yPosition = 20;    // Reset currentY to start from the top of the new page
            }


            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("End of summary report", pageWidth / 2, yPosition + 10, { align: "center" });

            const tableStartX = 15; // Adjusted X position for full-width table
            const tableStartY = yPosition + 20; // Y position of the table
            const totalTableWidth = pageWidth - 2 * tableStartX; // Total table width
            const legendColumnWidth = 15; // Smaller width for the "Legend" column
            const remainingTableWidth = totalTableWidth - legendColumnWidth; // Remaining space for other columns
            const columnCount = 5; // Number of remaining columns
            const otherColumnWidth = remainingTableWidth / columnCount; // Width of each remaining column
            const tableHeight = 12; // Reduced height of the table
            const boxWidth = 5; // Width of the color box
            const boxHeight = 9; // Height of the color box
            const textBoxGap = 1; // Gap between text and box

            // Data for the columns
            const columns = [
                { label: "Legend:", color: null, description: "" },
                { label: "", color: "#FF0000", description: "-Major discrepancy" },
                { label: "", color: "#FFFF00", description: "-Minor discrepancy" },
                { label: "", color: "#FFA500", description: "-Unable to verify" },
                { label: "", color: "#FFC0CB", description: "-Pending from source" },
                { label: "", color: "#008000", description: "-All clear" },
            ];

            // Set the border color
            doc.setDrawColor("#3e76a5");


            // Draw table border
            doc.setLineWidth(0.5);
            doc.rect(tableStartX, tableStartY, totalTableWidth, tableHeight);

            // Draw columns
            columns.forEach((col, index) => {
                const columnStartX =
                    index === 0
                        ? tableStartX // "Legend" column starts at tableStartX
                        : tableStartX + legendColumnWidth + (index - 1) * otherColumnWidth; // Remaining columns start after the "Legend" column

                const columnWidth = index === 0 ? legendColumnWidth : otherColumnWidth;

                // Draw column separators
                if (index > 0) {
                    doc.line(columnStartX, tableStartY, columnStartX, tableStartY + tableHeight);
                }

                // Add label text (for Legend)
                if (col.label) {
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(7); // Reduced font size for better fit
                    doc.text(
                        col.label,
                        columnStartX + 3, // Padding for text inside "Legend" column
                        tableStartY + tableHeight / 2 + 2,
                        { baseline: "middle" }
                    );
                }

                // Add color box
                if (col.color) {
                    const boxX = columnStartX + 3; // Adjusted padding for color box
                    const boxY = tableStartY + tableHeight / 2 - boxHeight / 2;
                    doc.setFillColor(col.color);
                    doc.rect(boxX, boxY, boxWidth, boxHeight, "F");
                }

                // Add description text
                if (col.description) {
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7); // Reduced font size for better fit
                    const textX = columnStartX + 3 + boxWidth + textBoxGap;
                    const textY = tableStartY + tableHeight / 2 + 2;
                    doc.text(col.description, textX, textY, { baseline: "middle" });
                }
            });



            addFooter(doc);


            yPosition = 20;
            let annexureIndex = 1;
            let pageLoopCount = 0;
            for (const service of servicesData) {
                pageLoopCount += 1;
                let reportFormJson;
                let rows = [];

                try {
                    if (!service.reportFormJson || !service.reportFormJson.json) {
                        // Skip this service if reportFormJson is not found or is empty
                        console.warn('No reportFormJson found for this service');
                        continue; // Skip the rest of the loop for this service
                    }

                    // Attempt to parse the JSON string
                    reportFormJson = JSON.parse(service.reportFormJson.json);

                    // Only process if rows are present
                    rows = reportFormJson && Array.isArray(reportFormJson.rows) ? reportFormJson.rows : [];
                } catch (error) {
                    console.warn('Failed to parse reportFormJson:', error);
                    continue; // Skip this service if parsing fails
                }

                if (rows.length === 0) {
                    console.warn('No rows found in reportFormJson for this service');
                    continue; // Skip if there are no rows
                }

                // Start adding content for the page if data is valid
                // doc.addPage();
                // addFooter(doc);

                let yPosition = 20;
                const serviceData = [];

                // Process the rows as needed
                rows.forEach((row) => {
                    const inputLabel = row.inputs.length > 0 ? row.inputs[0].label || "Unnamed Label" : "Unnamed Label";

                    const valuesObj = {};

                    row.inputs.forEach((input) => {
                        const inputName = input.name;

                        let reportDetailsInputName = inputName.includes("report_details_") ? inputName : `report_details_${inputName}`;

                        if (input.label && typeof input.label === "string") {
                            input.label = input.label.replace(/:/g, "");
                        }

                        if (service.annexureData) {
                            const value = service.annexureData[inputName] !== undefined && service.annexureData[inputName] !== null
                                ? service.annexureData[inputName]
                                : "";

                            const reportDetailsValue = service.annexureData[reportDetailsInputName] !== undefined && service.annexureData[reportDetailsInputName] !== null
                                ? service.annexureData[reportDetailsInputName]
                                : "";

                            valuesObj[inputName] = value;
                            valuesObj["isReportDetailsExist"] = !!reportDetailsValue;
                            if (reportDetailsValue) {
                                valuesObj[reportDetailsInputName] = reportDetailsValue;
                            }

                            valuesObj["name"] = inputName.replace("report_details_", "");
                        } else {
                            valuesObj[inputName] = "";
                            valuesObj["isReportDetailsExist"] = false;
                            valuesObj[reportDetailsInputName] = "";
                        }
                    });

                    serviceData.push({
                        label: inputLabel,
                        values: valuesObj,
                    });
                });
                const tableData = serviceData.map((data) => {
                    if (!data || !data.values) {
                        return null;
                    }

                    const name = data.values.name;

                    // Check if name starts with 'annexure' or 'additional_fee', and skip those entries
                    if (!name || name.startsWith("annexure") || name.startsWith("additional_fee")) {
                        return null;
                    }

                    const isReportDetailsExist = data.values.isReportDetailsExist;
                    let value = data.values[name];
                    let reportDetails = data.values[`report_details_${name}`];

                    if (value === undefined || value === "" || (isReportDetailsExist && !reportDetails)) {
                        return null;
                    }

                    if (name.startsWith("verification_status")) {
                        value = String(value).toUpperCase();
                    }

                    function parseDate(value) {
                        if (typeof value !== "string") return value;
                    
                        // Strict check for date-like formats
                        const isStrictDateFormat =
                            /^\d{4}-\d{2}-\d{2}$/.test(value) || // YYYY-MM-DD
                            /^\d{2}\/\d{2}\/\d{4}$/.test(value) || // DD/MM/YYYY or MM/DD/YYYY
                            /^\d{4}-\d{2}-\d{2}T/.test(value); // ISO 8601
                    
                        if (!isStrictDateFormat) return value;
                    
                        const parsedDate = new Date(value);
                        return isNaN(parsedDate) ? value : parsedDate.toLocaleDateString('en-GB').replace(/\//g, '-');
                    }
                    


                    if (isReportDetailsExist && reportDetails) {
                        return [data.label, parseDate(value), parseDate(reportDetails)];
                    } else {
                        return [data.label, parseDate(value)];
                    }
                }).filter(Boolean);

                // Skip table rendering if no valid tableData
                if (tableData.length > 0) {
                    doc.addPage();
                    const pageWidth = doc.internal.pageSize.width;

                    let headingText = '';
                    if (reportFormJson && reportFormJson.heading) {
                        headingText = reportFormJson.heading.toUpperCase();
                    } else {
                        console.warn('Heading is missing or invalid.');
                    }

                    const backgroundColor = "#f5f5f5";
                    const backgroundColorHeading = "#6495ed";
                    const borderColor = "#6495ed";
                    const xsPosition = 10;
                    const rectHeight = 10;

                    doc.setFillColor(backgroundColorHeading);
                    doc.setDrawColor(borderColor);
                    doc.rect(xsPosition, yPosition, pageWidth - 20, rectHeight, "FD");

                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");

                    const textHeight = doc.getTextDimensions(headingText).h;
                    const verticalCenter = yPosition + rectHeight / 2 + textHeight / 4;

                    doc.setTextColor("#fff");
                    doc.text(headingText, pageWidth / 2, verticalCenter, { align: "center" });

                    yPosition += rectHeight;

                    // Check if tableData is not empty before generating the table
                    doc.autoTable({
                        head: [
                            [
                                { content: "PARTICULARS", styles: { halign: "left" } },
                                { content: "APPLICATION DETAILS", styles: { halign: "center" } },
                                { content: "REPORT DETAILS", styles: { halign: "center" } },
                            ]
                        ],
                        body: tableData.map((row) => {
                            if (row.length === 2) {
                                return [
                                    { content: row[0], styles: { halign: "left", fontStyle: 'bold' } },
                                    { content: row[1], colSpan: 2, styles: { halign: "left" } },
                                ];
                            } else {
                                return [
                                    { content: row[0], styles: { halign: "left", fontStyle: 'bold' } },
                                    { content: row[1], styles: { halign: "left" } },
                                    { content: row[2], styles: { halign: "left" } },
                                ];
                            }
                        }),
                        startY: yPosition,
                        styles: {
                            fontSize: 9,
                            cellPadding: 3,
                            lineWidth: 0.3,
                            lineColor: [62, 118, 165],
                        },
                        theme: "grid",
                        headStyles: {
                            fillColor: backgroundColor,
                            textColor: [0, 0, 0],
                            halign: "center",
                            fontSize: 10,
                        },
                        bodyStyles: {
                            textColor: [0, 0, 0],
                            halign: "left",
                        },
                        tableLineColor: [62, 118, 165],
                        tableLineWidth: 0.5,
                        margin: { horizontal: 10 },
                    });

                    addFooter(doc);


                    yPosition = doc.lastAutoTable.finalY + 5;

                    const remarksData = serviceData.find((data) => data.label === "Remarks");
                    if (remarksData) {
                        const remarks = service.annexureData[remarksData.values.name] || "No remarks available.";
                        doc.setFont("helvetica", "italic");
                        doc.setFontSize(10);
                        doc.setTextColor(100, 100, 100);
                        doc.text(`Remarks: ${remarks}`, 10, yPosition);
                        yPosition += 7;
                    }

                    const annexureData = service.annexureData || {}; // Ensure annexureData is an empty object if it's null or undefined

                    const annexureImagesKey = Object.keys(annexureData).find((key) =>
                        key.toLowerCase().startsWith("annexure") && !key.includes("[") && !key.includes("]")
                    );


                    if (annexureImagesKey) {

                        doc.addPage();

                        yPosition = 20;
                        const annexureImagesStr = annexureData[annexureImagesKey];

                        const annexureImagesSplitArr = annexureImagesStr ? annexureImagesStr.split(",") : [];

                        if (annexureImagesSplitArr.length === 0) {
                            console.warn("⚠️ No annexure images available.");
                            doc.setFont("helvetica", "italic");
                            doc.setFontSize(10);
                            doc.setTextColor(150, 150, 150);
                            doc.text("No annexure images available.", 10, yPosition);
                            yPosition += 10;
                        } else {
                            const imageBases = await fetchImageToBase(annexureImagesStr.trim());

                            if (imageBases && imageBases.length > 0) {
                                imageBases.forEach((image, index) => {

                                    if (!image.base64 || !image.base64.startsWith("data:image/")) {
                                        console.error(`❌ Invalid base64 data for image ${index + 1}`);
                                        return;
                                    }

                                    // **Add a new page ONLY if there are multiple images and it's not the first one**
                                    if (index > 0 && imageBases.length > 1) {
                                        doc.addPage();
                                    }

                                    const pageWidth = doc.internal.pageSize.width - 20; // Keeping margins
                                    const pageHeight = doc.internal.pageSize.height - 40; // Keeping margins

                                    // **Scale Image to Fit the Page**
                                    let { width, height } = scaleImageForPDF(image.width, image.height, pageWidth, pageHeight);

                                    // **Center Image**
                                    const centerX = (doc.internal.pageSize.width - width) / 2;
                                    const centerY = (doc.internal.pageSize.height - height) / 2;

                                    // **Add Annexure Title**
                                    const annexureText = `Annexure ${annexureIndex} (${String.fromCharCode(97 + index)})`;

                                    doc.setFont("helvetica", "bold");
                                    doc.setFontSize(12);
                                    doc.setTextColor(0, 0, 0);
                                    doc.text(annexureText, doc.internal.pageSize.width / 2, 15, { align: "center" });

                                    // **Add Image to the Center of the Page**
                                    try {
                                        doc.addImage(image.base64, image.type, centerX, centerY, width, height);
                                    } catch (error) {
                                        console.error(`❌ Error adding image ${index + 1}:`, error);
                                    }

                                    addFooter(doc);
                                });
                            } else {
                                console.warn("⚠️ No valid images found after fetching.");
                            }
                        }
                    } else {
                        console.warn("⚠️ No annexure images key found.");
                        doc.setFont("helvetica", "italic");
                        doc.setFontSize(10);
                        doc.setTextColor(150, 150, 150);
                        doc.text("No annexure images available.", 10, yPosition);
                        yPosition += 15;
                    }


                    /**
                     * Function to scale image properly within the page
                     */
                    function scaleImageForPDF(imageWidth, imageHeight, maxWidth, maxHeight) {
                        let width = imageWidth;
                        let height = imageHeight;

                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }

                        return { width, height };
                    }




                }







                addFooter(doc);
                annexureIndex++;
                yPosition += 20;
            }

            addFooter(doc);
            doc.addPage();

            const disclaimerButtonHeight = 10;
            const disclaimerButtonWidth = doc.internal.pageSize.width - 20;

            const buttonBottomPadding = 5;
            const disclaimerTextTopMargin = 5;

            const adjustedDisclaimerButtonHeight = disclaimerButtonHeight + buttonBottomPadding;

            const disclaimerTextPart1 = `This report is confidential and is meant for the exclusive use of the Client. This report has been prepared solely for the purpose set out pursuant to our letter of engagement (LoE)/Agreement signed with you and is not to be used for any other purpose. The Client recognizes that we are not the source of the data gathered and our reports are based on the information purpose. The Client recognizes that we are not the source of the data gathered and our reports are based on the information responsible for employment decisions based on the information provided in this report.`;
            const anchorText = "";
            const disclaimerTextPart2 = "";


            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            const disclaimerLinesPart1 = doc.splitTextToSize(disclaimerTextPart1, disclaimerButtonWidth);
            const disclaimerLinesPart2 = doc.splitTextToSize(disclaimerTextPart2, disclaimerButtonWidth);


            const lineHeight = 7;
            const disclaimerTextHeight =
                disclaimerLinesPart1.length * lineHeight +
                disclaimerLinesPart2.length * lineHeight +
                lineHeight;

            const totalContentHeight = adjustedDisclaimerButtonHeight + disclaimerTextHeight + disclaimerTextTopMargin;

            const availableSpace = doc.internal.pageSize.height - 40;

            let disclaimerY = 20;

            if (disclaimerY + totalContentHeight > availableSpace) {
                doc.addPage();
                addFooter(doc);
                disclaimerY = 20;
            }

            const disclaimerButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2;


            if (disclaimerButtonWidth > 0 && disclaimerButtonHeight > 0 && !isNaN(disclaimerButtonXPosition) && !isNaN(disclaimerY)) {
                doc.setDrawColor(62, 118, 165);
                doc.setFillColor(backgroundColor);
                doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'F');
                doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'D');
            } else {
            }

            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");

            const disclaimerButtonTextWidth = doc.getTextWidth('Disclaimer');
            const buttonTextHeight = doc.getFontSize();


            const disclaimerTextXPosition =
                disclaimerButtonXPosition + disclaimerButtonWidth / 2 - disclaimerButtonTextWidth / 2 - 1;
            const disclaimerTextYPosition = disclaimerY + disclaimerButtonHeight / 2 + buttonTextHeight / 4 - 1;

            doc.text('Disclaimer', disclaimerTextXPosition, disclaimerTextYPosition);

            let currentY = disclaimerY + adjustedDisclaimerButtonHeight + disclaimerTextTopMargin;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            disclaimerLinesPart1.forEach((line) => {
                doc.text(line, 10, currentY);
                currentY += lineHeight;
            });

            doc.setTextColor(0, 0, 255);
            doc.textWithLink(anchorText, 10 + doc.getTextWidth(disclaimerLinesPart1[disclaimerLinesPart1.length - 1]), currentY - lineHeight, {
                url: "mailto:goldquest.in",
            });

            doc.setTextColor(0, 0, 0);
            disclaimerLinesPart2.forEach((line) => {
                doc.text(line, 10, currentY);
                currentY += lineHeight;
            });

            let endOfDetailY = currentY + disclaimerTextTopMargin - 5;

            if (endOfDetailY + disclaimerButtonHeight > doc.internal.pageSize.height - 20) {
                doc.addPage();
                endOfDetailY = 20;
            }

            const endButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2; // Centering horizontally

            if (disclaimerButtonWidth > 0 && disclaimerButtonHeight > 0 && !isNaN(endButtonXPosition) && !isNaN(endOfDetailY)) {
                doc.setDrawColor(62, 118, 165);
                doc.setFillColor(backgroundColor);
                doc.rect(endButtonXPosition, endOfDetailY, disclaimerButtonWidth, disclaimerButtonHeight, 'F');
                doc.rect(endButtonXPosition, endOfDetailY, disclaimerButtonWidth, disclaimerButtonHeight, 'D');
            } else {
            }

            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");

            const endButtonTextWidth = doc.getTextWidth('End of detail report');
            const endButtonTextHeight = doc.getFontSize();

            const endButtonTextXPosition =
                endButtonXPosition + disclaimerButtonWidth / 2 - endButtonTextWidth / 2 - 1;
            const endButtonTextYPosition = endOfDetailY + disclaimerButtonHeight / 2 + endButtonTextHeight / 4 - 1;

            doc.text('End of detail report', endButtonTextXPosition, endButtonTextYPosition);


            // Calculate the width and height of the image dynamically using jsPDF's getImageProperties
            const imgWidth = 50;  // Adjust this scale factor as needed
            const imgHeight = 40; // Adjust this scale factor as needed

            // Calculate the X position to center the image horizontally
            const centerX = (pageWidth - imgWidth) / 2;

            // Calculate the Y position (adjust this based on where you want the image)
            const centerY = endOfDetailY + 20; // Example: Place the image 20 units below the "END OF DETAIL REPORT" text

            // Add the image to the PDF at the calculated position
            doc.addImage(verified, 'JPEG', centerX, centerY, imgWidth, imgHeight);

            // Continue with adding the footer and saving the document

            const FomratedDate = reportInfo.report_date && !isNaN(new Date(reportInfo.report_date))
                ? `${String(new Date(reportInfo.report_date).getDate()).padStart(2, '0')}-${String(new Date(reportInfo.report_date).getMonth() + 1).padStart(2, '0')}-${new Date(reportInfo.report_date).getFullYear()}`
                : 'NIL'
            addFooter(doc);

            doc.save(`${reportInfo.application_id}-${reportInfo.name}-${FomratedDate}`);

            swalLoading.close();

            // Optionally, show a success message
            Swal.fire({
                title: 'PDF Generated!',
                text: 'Your PDF has been successfully generated.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        }
        catch (error) {
            // In case of error, close the Swal loading and show an error message
            swalLoading.close();
            Swal.fire({
                title: 'Error!',
                text: 'Something went wrong while generating the PDF.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    useEffect(() => {
        if (!isApiLoading) { fetchData(); }
    }, [clientId, branch_id]);


    const handleViewMore = async (index) => {
        const globalIndex = index + (currentPage - 1) * itemsPerPage; // Calculate the global index

        setIsApiLoading(true);

        setServicesLoading((prev) => ({
            ...prev,
            [globalIndex]: true
        }));

        if (expandedRow && expandedRow.index === globalIndex) {
            setExpandedRow(null); // Collapse the row
            setServicesLoading((prev) => ({
                ...prev,
                [globalIndex]: false
            }));
            setIsApiLoading(false); // End loading state when collapsing
            return;
        }

        try {
            const applicationInfo = currentItems[index]; // Data for the current page
            const servicesData = await fetchServicesData(applicationInfo.main_id, applicationInfo.services);

            const headingsAndStatuses = [];

            servicesData.forEach((service) => {
                if (service.reportFormJson && service.reportFormJson.json) {
                    const heading = JSON.parse(service.reportFormJson.json).heading;
                    if (heading) {
                        let status = service.annexureData?.status || "Initiated";
                        status = status.replace(/[^a-zA-Z0-9\s]/g, " ").toUpperCase() || 'Initiated';
                        headingsAndStatuses.push({ heading, status });
                    }
                }
            });

            // ✅ Show "No Data Found" if there are no headings or statuses
            if (headingsAndStatuses.length === 0) {
                Swal.fire({
                    title: "No Data Found",
                    text: "No valid headings or statuses were found.",
                    icon: "info",
                    confirmButtonText: "Ok"
                });
                setServicesLoading(false)
                return;
            }

            setExpandedRow({
                index: globalIndex, // Use the global index
                headingsAndStatuses: headingsAndStatuses || "Initiated",
            });

            setServicesLoading((prev) => ({
                ...prev,
                [globalIndex]: false
            }));

            const expandedRowElement = document.getElementById(`expanded-row-${globalIndex}`);
            if (expandedRowElement) {
                expandedRowElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
            setServicesLoading((prev) => ({
                ...prev,
                [globalIndex]: false
            }));
            console.error('Error fetching service data:', error);
        } finally {
            setIsApiLoading(false); // Stop global loading state
        }
    };

    const handleSelectChange = (e) => {

        const selectedValue = e.target.value;
        setItemPerPage(selectedValue)
    }
    const handleUpload = (ref_id) => {
        const url = `/client?ref_id=${ref_id}`;
        window.open(url, '_blank'); // Opens in a new tab
    };


    function sanitizeText(text) {
        if (!text) return text;
        return text.replace(/_[^\w\s]/gi, '');
    }

    const adminData = JSON.parse(localStorage.getItem("admin"));
    const userRole = adminData.role;


    const exportToExcel = async () => {
        const worksheetData = await Promise.all(
            currentItems.map(async (data, index) => {
                const servicesData = await fetchServicesData(data.main_id, data.services);
                const headingsAndStatuses = [];

                // Process servicesData
                servicesData.forEach((service) => {
                    if (service.reportFormJson && service.reportFormJson.json) {
                        const reportJson = JSON.parse(service.reportFormJson.json);
                        const heading = reportJson?.heading || "NIL";

                        // Ensure excelsorting is always an array
                        let excelsorting = [];
                        try {
                            excelsorting = service?.reportFormJson?.excel_sorting
                                ? JSON.parse(service.reportFormJson.excel_sorting)
                                : [];
                            if (!Array.isArray(excelsorting)) excelsorting = []; // Ensure it's an array
                        } catch (error) {
                            console.error("Error parsing excel_sorting:", error);
                            excelsorting = [];
                        }

                        if (heading) {
                            let status = service.annexureData?.status || "Initiated";
                            status = (status || "").replace(/[^a-zA-Z0-9\s]/g, " ").toUpperCase() || "Initiated";
                            headingsAndStatuses.push({ heading, status, sortOrder: excelsorting.indexOf(heading) });
                        }
                    }
                });

                // Sort by excelsorting order (headings not in the array go to the end)
                headingsAndStatuses.sort((a, b) => (a.sortOrder - b.sortOrder || 0));

                // Construct Excel row data
                const row = {
                    INDEX: index + 1,
                    "TAT DAYS": data?.tat_days || "NIL",
                    "LOCATION NAME": data?.location || "NIL",
                    "BATCH NUMBER": data?.batch_number || "NIL",
                    "APPLICATION ID": data?.application_id || "NIL",
                    "NAME OF THE APPLICANT": data?.name || "NIL",
                    "APPLICANT EMPLOYEE ID": data?.employee_id || "NIL",
                    "INITIATION DATE": data?.created_at ? new Date(data.created_at).toLocaleDateString() : "NIL",
                    "DOWNLOAD REPORT STATUS": data?.is_report_downloaded ? "Downloaded" : "Not Downloaded",
                    "REPORT TYPE": data?.report_type || "NIL",
                    "REPORT DATE": data?.report_date ? new Date(data.report_date).toLocaleDateString() : "NIL",
                    "OVERALL STATUS": data?.overall_status || "NIL",
                    ...headingsAndStatuses.reduce((acc, { heading, status }) => {
                        acc[heading] = status || 'Initiated';
                        return acc;
                    }, {}),
                    "INSUFF REMARKS": data?.first_insufficiency_marks || "NIL",
                    "INSUFF DATE": data?.first_insuff_date ? new Date(data.first_insuff_date).toLocaleDateString() : "NIL",
                    "INSUFF CLEARED": data?.first_insuff_reopened_date
                        ? new Date(data.first_insuff_reopened_date).toLocaleDateString()
                        : "NIL",


                    "REMARKS & REASON FOR DELAY": data?.delay_reason || "NIL",
                    ADDRESS: data?.address || "NIL",
                    EDUCATION: data?.education || "NIL",
                    "BASIC ENTRY": data?.basic_entry || "NIL",
                    "CASE UPLOADED": data?.case_upload || "NIL",
                    "EMPLOYEMENT SPOC": data?.single_point_of_contact || "NIL",
                    "REPORT GENERATED BY": data?.report_generated_by_name || "NIL",
                    "QC DONE BY": data?.qc_done_by_name || "NIL",
                };

                return row;
            })
        );

        // Generate the Excel sheet
        const ws = XLSX.utils.json_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");

        // Save the workbook
        XLSX.writeFile(wb, "Data.xlsx");
    };

    const statuses = {
        "overallCount": "OVERALL COUNT",
        "wipCount": "WIP",
        "insuffCount": "INSUFF",
        "completedGreenCount": "COMPLETED GREEN",
        "completedRedCount": "COMPLETED RED",
        "completedYellowCount": "COMPLETED YELLOW",
        "completedPinkCount": "COMPLETED PINK",
        "completedOrangeCount": "COMPLETED ORANGE",
        "previousCompletedCount": "PREVIOUS COMPLETED",
        "stopcheckCount": "STOPCHECK",
        "activeEmploymentCount": "ACTIVE EMPLOYMENT",
        "nilCount": "NIL",
        "candidateDeniedCount": "CANDIDATE DENIED",
        "notDoableCount": "NOT DOABLE",
        "initiatedCount": "INITIATED",
        "holdCount": "HOLD",
        "closureAdviceCount": "CLOSURE ADVICE",
        "qcStatusPendingCount": "QC STATUS PENDING",
        "notReadyCount": "NOT READY",
        "downloadReportCount": "DOWNLOAD REPORT"
    };

    return (
        <div className="bg-[#c1dff2]">
            <div className="space-y-4 md:py-[30px] md:px-[51px] bg-white">

                <div className='flex gap-4 justify-end p-4 pb-0'>
                    <select
                        id=""
                        name="status"
                        onChange={handleStatusChange}
                        className="outline-none border-2 p-2 rounded-md w-full md:w-5/12 my-4 md:my-0"
                    >
                        <option value="">Select Any Status</option>
                        {Array.isArray(options) && options.length > 0 ? (
                            options
                                .filter((item) => item?.status && item.status !== "closed")
                                .map((item, index) => {
                                    const formattedStatus = statuses[item.status] || item.status; // Replace if found, else use original

                                    return (
                                        <option key={index} value={item.status}>
                                            {formattedStatus}
                                            {userRole === "admin" ? ` - ${item.count || 0}` : ""}
                                        </option>
                                    );
                                })
                        ) : (
                            <option disabled>No statuses available</option> // Handles empty options case
                        )}
                    </select>

                </div>
                <div className="mx-4 mt-0 bg-white ">
                    <div className="md:flex justify-between items-center md:my-4 border-b-2 pb-4">
                        <div className="col">
                            <form action="">
                                <div className="flex gap-5 flex-wrap justify-between">
                                    <select name="options" id="" onChange={(e) => {
                                        handleSelectChange(e); // Call the select change handler
                                        setCurrentPage(1); // Reset current page to 1
                                    }} className='outline-none pe-14 ps-2 w-7/12 md:w-auto text-left rounded-md border'>
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
                                        className="bg-[#3e76a5] text-sm text-white py-3 px-4 rounded-md capitalize"
                                        type="button"
                                        disabled={currentItems.length === 0}
                                    >
                                        Export to Excel
                                    </button>
                                    <button onClick={goBack} className="bg-[#3e76a5] mx-2 text-sm whitespace-nowrap hover:bg-[#3e76a5] text-white rounded-md p-3">Go Back</button>

                                </div>
                            </form>
                        </div>
                        <div className="col md:flex justify-end ">
                            <form action="">
                                <div className="flex md:items-stretch items-center  gap-3">
                                    <input
                                        type="search"
                                        className='outline-none border-2 p-2 rounded-md w-full my-4 md:my-0'
                                        placeholder='Search Here'
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

                </div>
                <div className="overflow-x-auto m-4 py-6 px-4 shadow-md rounded-md bg-white">
                    {loading ? (
                        <div className='flex justify-center items-center py-6 h-full'>
                            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
                        </div>
                    ) : currentItems.length > 0 ? (
                        <table className="min-w-full border-collapse border overflow-scroll rounded-lg whitespace-nowrap">
                            <thead className='rounded-lg'>
                                <tr className="bg-[#3e76a5] text-white">
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">SL NO</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">TAT Days</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Location</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Name</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Reference Id</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Photo</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Applicant Employe Id</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Initiation Date</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Deadline Date</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Report Data</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Download Status</th>

                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Overall Status</th>
                                    <th className="text-left p-2 border uppercase ">Report Type</th>
                                    <th className="text-left p-2 border uppercase ">Report Date</th>
                                    <th className="text-left p-2 border uppercase ">Report Generated By</th>
                                    <th className="text-left p-2 border uppercase ">QC Done By</th>
                                    <th className="text-left p-2 border uppercase ">Insuff</th>
                                    <th className="text-left p-2 border uppercase ">Insuff Date</th>
                                    <th className="text-left p-2 border uppercase ">Insuff Reopen Date</th>
                                    <th className="text-left p-2 border uppercase ">Reason For Delay</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((data, index) => {
                                    const globalIndex = index + (currentPage - 1) * itemsPerPage; // Calculate the global index

                                    return (
                                        <React.Fragment key={data.id}>
                                            <tr className="text-center sliding-container" id={`row-${index}`} >
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize"> {index + 1 + (currentPage - 1) * itemsPerPage}</td>
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">{data.tat_days || 'NIL'}</td>
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">{data.location || 'NIL'}</td>
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">{data.name || 'NIL'}</td>
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">{data.application_id || 'NIL'}</td>
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                    {data.photo ? (
                                                        data.photo.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                            <img
                                                                src={`${data.photo}`}
                                                                alt="Image"
                                                                className=" h-[70px] w-[70px]"
                                                            />
                                                        ) : (
                                                            <a
                                                                href={`${data.photo}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <button type='button' className="px-4 py-2 bg-[#3e76a5] text-white rounded">
                                                                    View Document
                                                                </button>
                                                            </a>
                                                        )
                                                    ) : (
                                                        "No Image Found"
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">{data.employee_id || 'NIL'}</td>
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                    {data.created_at && !isNaN(new Date(data.created_at))
                                                        ? `${String(new Date(data.created_at).getDate()).padStart(2, '0')}- 
                            ${String(new Date(data.created_at).getMonth() + 1).padStart(2, '0')}- 
                            ${new Date(data.created_at).getFullYear()}`
                                                        : "NIL"}
                                                </td>

                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                    {data.deadline_date
                                                        ? `${new Date(data.deadline_date).getDate()}-${new Date(data.deadline_date).getMonth() + 1}-${new Date(data.deadline_date).getFullYear()}`
                                                        : "NIL"}
                                                </td>


                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                    <button
                                                        disabled={isApiLoading}
                                                        className={`w-full rounded-md p-3 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}

                                                        onClick={() => handleUpload(data.application_id)}
                                                    >
                                                        Generate Report
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                    <button
                                                        onClick={() => {
                                                            const reportDownloadFlag = (data.overall_status === 'completed' && data.is_verify === 'yes') || data.is_verify === 'no' ? 1 : 0;

                                                            setLoadingStates(prevState => ({
                                                                ...prevState,
                                                                [index]: true
                                                            }));

                                                            generatePDF(index, reportDownloadFlag, data).finally(() => {
                                                                setLoadingStates(prevState => ({
                                                                    ...prevState,
                                                                    [index]: false
                                                                }));
                                                            });
                                                        }}
                                                        className={`uppercase border border-white hover:border-[#3e76a5] text-white px-4 py-2 rounded 
        hover:bg-white hover:text-[#3e76a5] 
        ${!data.overall_status || (data.overall_status !== 'completed' && data.is_verify !== 'no') ? 'opacity-50 cursor-not-allowed' : ''} 
        ${loadingStates[index] ? 'cursor-wait' : ''} 
        ${data.overall_status === 'completed' && data.is_verify === 'yes' ? 'bg-green-500' // Blue for DOWNLOAD REPORT
                                                                : data.overall_status === 'completed' && (!data.is_verify || data.is_verify === 'no') ? 'bg-[#17a2b8]' // Green for QC PENDING
                                                                    : 'bg-red-500' // Red for NOT READY
                                                            }`
                                                        }
                                                        disabled={(!data.overall_status || (data.overall_status !== 'completed' && data.is_verify !== 'no')) || loadingStates[index] || isApiLoading}
                                                    >
                                                        {
                                                            loadingStates[index]
                                                                ? 'Please Wait, Your PDF is Generating'
                                                                : data.overall_status === 'completed'
                                                                    ? (data.is_verify === 'yes'
                                                                        ? 'DOWNLOAD REPORT'
                                                                        : (!data.is_verify || data.is_verify === 'no' ? 'QC PENDING' : 'NOT READY'))
                                                                    : data.overall_status === 'wip'
                                                                        ? 'WIP'
                                                                        : data.overall_status === 'insuff'
                                                                            ? 'INSUFF'
                                                                            : 'NOT READY'
                                                        }
                                                    </button>

                                                </td>
                                                <td className="text-left p-2 border capitalize">{data.overall_status || 'WIP'}</td>
                                                <td className="text-left p-2 border capitalize">{data.report_type || 'NIL'}</td>

                                                <td className="text-left p-2 border capitalize">
                                                    {data.report_date && !isNaN(new Date(data.report_date))
                                                        ? `${String(new Date(data.report_date).getDate()).padStart(2, '0')}-${String(new Date(data.report_date).getMonth() + 1).padStart(2, '0')}-${new Date(data.report_date).getFullYear()}`
                                                        : 'NIL'}
                                                </td>

                                                <td className="text-left p-2 border capitalize">{data.report_generated_by_name || 'NIL'}</td>
                                                <td className="text-left p-2 border capitalize">{data.qc_done_by_name || 'NIL'}</td>
                                                <td className="text-left p-2 border capitalize whitespace-pre-wrap">{sanitizeText(data.first_insufficiency_marks) || 'NIL'}</td>

                                                <td className="text-left p-2 border capitalize whitespace-pre-wrap">
                                                    {data.first_insuff_date && !isNaN(new Date(data.first_insuff_date))
                                                        ? `${String(new Date(data.first_insuff_date).getDate()).padStart(2, '0')}-${String(new Date(data.first_insuff_date).getMonth() + 1).padStart(2, '0')}-${new Date(data.first_insuff_date).getFullYear()}`
                                                        : 'NIL'}
                                                </td>

                                                <td className="text-left p-2 border capitalize whitespace-pre-wrap">
                                                    {data.first_insuff_reopened_date && !isNaN(new Date(data.first_insuff_reopened_date))
                                                        ? `${String(new Date(data.first_insuff_reopened_date).getDate()).padStart(2, '0')}-${String(new Date(data.first_insuff_reopened_date).getMonth() + 1).padStart(2, '0')}-${new Date(data.first_insuff_reopened_date).getFullYear()}`
                                                        : 'NIL'}
                                                </td>

                                                <td className="py-3 px-4 border-b border-r-2  capitalize whitespace-pre-wrap">{data.delay_reason || 'NIL'}</td>
                                                <td className="border px-4 py-2">
                                                    <button
                                                        disabled={isApiLoading}
                                                        className={`bg-orange-500 uppercase border border-white text-white px-4 py-2 rounded hover:bg-white hover:text-orange-500 
  ${isApiLoading ? 'cursor-not-allowed bg-gray-400 border-gray-400' : ''}`} // Apply styles when loading
                                                        onClick={() => {
                                                            handleViewMore(index);

                                                            // Get the specific row by index
                                                            const slidingRow = document.querySelectorAll('.sliding-container')[index];
                                                            if (slidingRow) {
                                                                slidingRow.classList.add('active');
                                                            } else {
                                                                console.warn(`Row at index ${index} not found`);
                                                            }
                                                        }}

                                                    >
                                                        {expandedRow && expandedRow.index === globalIndex ? 'Less' : 'View Services'}
                                                    </button>
                                                    <button className='bg-red-500 text-white p-3 py-2 ms-2 rounded-md' onClick={() => handleDelete(data)}>Delete</button>

                                                </td>
                                            </tr>

                                            {/* Show loading state */}
                                            {servicesLoading[globalIndex] && (
                                                <tr >
                                                    <td colSpan={12} className="py-4 text-center text-gray-500">
                                                        <div className='flex justify-center'>
                                                            <PulseLoader color="#36D7B7" loading={servicesLoading[globalIndex]} size={15} aria-label="Loading Spinner" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {expandedRow && expandedRow.index === globalIndex && (
                                                <tr id={`expanded-row-${globalIndex}`} className="expanded-row">
                                                    <td colSpan="100%" className="text-center p-4 bg-gray-100">
                                                        {/* Render the expanded content */}
                                                        <div className="relative max-w-[900px] overflow-x-auto">
                                                            <table className="w-full ">
                                                                {expandedRow.headingsAndStatuses && expandedRow.headingsAndStatuses.length > 0 && (
                                                                    <thead>
                                                                        <tr >
                                                                            {expandedRow.headingsAndStatuses.map((item, idx) => (

                                                                                <th className="text-left p-2 border capitalize ">
                                                                                    {sanitizeText(item.heading)}
                                                                                </th>


                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                )}


                                                                {expandedRow.headingsAndStatuses && expandedRow.headingsAndStatuses.length > 0 && (
                                                                    <tbody>
                                                                        <tr >
                                                                            {expandedRow.headingsAndStatuses.map((item, idx) => (
                                                                                <td className="text-left p-2 border capitalize">
                                                                                    {sanitizeText(item.status || 'Initiated')}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    </tbody>
                                                                )}


                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
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
    );

};

export default AdminChekin;