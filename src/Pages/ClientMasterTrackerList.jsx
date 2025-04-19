import React, { useCallback, useContext, useRef, useEffect, useState } from 'react';
import { useApi } from '../ApiContext'
import { useSidebar } from '../Sidebar/SidebarContext.jsx';
import { BranchContextExel } from './BranchContextExel';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import Swal from 'sweetalert2'; // Make sure to import SweetAlert2
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';

const ClientMasterTrackerList = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const [searchTerm, setSearchTerm] = useState('');
    const { setBranchId } = useContext(BranchContextExel);
    const API_URL = useApi();
    const { handleTabChange } = useSidebar();
    const [loading, setLoading] = useState(false);
    const [, setError] = useState(null);
    const [data, setData] = useState([]);
    const [branches, setBranches] = useState({});
    const [expandedClient, setExpandedClient] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [options, setOptions] = useState([]);
    const [itemsPerPage, setItemPerPage] = useState(10);
    const [branchLoading, setBranchLoading] = useState(false);

    const fetchClient = useCallback((selected) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        setIsApiLoading(true);
        setLoading(true);
        setError(null);

        let queryParams;

        if (selected) {
            queryParams = new URLSearchParams({
                admin_id: admin_id || '',
                _token: storedToken || '',
                filter_status: selected || '',
            }).toString();
        } else {
            queryParams = new URLSearchParams({
                admin_id: admin_id || '',
                _token: storedToken || ''
            }).toString();
        }

        fetch(`${API_URL}/client-master-tracker/list?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                return response.json().then(result => {
                    const newToken = result._token || result.token;
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }
                    if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                        Swal.fire({
                            title: "Session Expired",
                            text: "Your session has expired. Please log in again.",
                            icon: "warning",
                            confirmButtonText: "Ok",
                        }).then(() => {
                            // Redirect to admin login page
                            window.location.href = "/admin-login"; // Replace with your login route
                        });
                        throw new Error("Session expired"); // Exit early to prevent further execution
                    }

                    // Handle non-OK response
                    if (!response.ok) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: result.message || 'Failed to load data',
                        });
                        throw new Error(result.message || 'Failed to load data');
                    }

                    // Optionally update token if available

                    return result;
                });
            })
            .then((result) => {
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                // Set data after successful response
                setData(result.data.customers || []);
                setOptions(result.data.filterOptions);
            })
            .catch((error) => {
                // Handle any errors during the fetch
                setError(error.message || 'Failed to load data');
            })
            .finally(() => {
                setLoading(false);
                setIsApiLoading(false);
            }); // Ensure loading is stopped
    }, [setData, API_URL]);


    const handleBranches = useCallback((id) => {
        setIsApiLoading(true);
        setBranchLoading(true);
        setError(null);
        setExpandedClient(prev => (prev === id ? null : id)); // Toggle branches visibility

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        fetch(`${API_URL}/client-master-tracker/branch-list-by-customer?customer_id=${id}&admin_id=${admin_id}&_token=${storedToken}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                return response.json().then(result => {
                    // Check if new token is available and update local storage
                    const newToken = result._token || result.token;
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }

                    // Check for session expiration
                    if (result.message) {
                        const message = result.message.toLowerCase();
                        if (
                            message.includes("invalid token") ||
                            message.includes("expired") ||
                            message.includes("invalid or expired token")
                        ) {
                            // Show session expired message
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                // Redirect to admin login page
                                window.location.href = "/admin-login"; // Replace with your login route
                            });
                            throw new Error("Session expired"); // Stop further processing
                        }
                    }

                    // Check if response is not OK and show error message
                    if (!response.ok) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: result.message || 'Failed to load data',
                        });
                        throw new Error(result.message || 'Failed to load data');
                    }

                    return result; // Return result if response is okay
                });
            })
            .then((data) => {
                // Handle success data and update branches state
                const newToken = data._token || data.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                setBranches(prev => ({ ...prev, [id]: data.customers || [] }));
            })
            .catch((error) => {
                setError('Failed to load data');
            })
            .finally(() => {
                {
                    setBranchLoading(false);
                    setIsApiLoading(false);
                }
            }); // Stop loading after the operation
    }, []);


    const tableRef = useRef(null); // Ref for the table container

    // Function to reset expanded rows
    const handleOutsideClick = (event) => {
        if (tableRef.current && !tableRef.current.contains(event.target)) {
            setExpandedClient({}); // Reset to empty object instead of null
        }
    };


    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    useEffect(() => {
        if (!isApiLoading) {
            fetchClient();
        }

    }, [fetchClient]);


    const filteredItems = data.filter(item => {
        return (
            item.client_unique_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name.toLowerCase?.().includes(searchTerm.toLowerCase())

        );
    });

    // const filteredOptions = filteredItems.filter(item =>
    //     item.status.toLowerCase().includes(selectedStatus.toLowerCase())
    // );

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

    const handleClick = (branch_id) => {
        setBranchId(branch_id); // Set branch_id in context
        handleTabChange('tracker_status');
    };

    const handleStatusChange = (event) => {
        const selected = event.target.value;
        fetchClient(selected);

    };
    const handleSelectChange = (e) => {

        const selectedValue = e.target.value;
        setItemPerPage(selectedValue)

    }


    const exportToExcel = () => {
        // Filtered data to export
        const dataToExport = currentItems;

        // Map the data to match the structure of the table headers
        const formattedData = dataToExport.map((client, index) => ({
            Index: index + 1,
            "Client Code": client.client_unique_id,
            "Company Name": client.name,
            "Client Spoc": client.single_point_of_contact,
            "Active Cases": client.application_count || 'NIL',
        }));

        // Create a worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Filtered Data');

        // Write the Excel file to disk
        XLSX.writeFile(wb, 'Client-Mater-Tracker.xlsx');
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

    const formattedStatuses = options.map(item => ({
        status: statuses[item.status] || item.status, // Replace if found, else use original
        count: item.count
    }));



    return (
        <>
            <h2 className='text-center md:text-3xl text-xl md:mt-12 font-bold py-4'>Client Master Tracker</h2>

            <div className="bg-white m-4 md:m-6 shadow-md rounded-md p-3">

                <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4">
                    <div className="col">
                        <form action="">
                            <div className="flex gap-2">
                                <select name="options" onChange={(e) => {
                                    handleSelectChange(e); // Call the select change handler
                                    setCurrentPage(1); // Reset current page to 1
                                }} id="" className='outline-none border p-2 ps-2 text-left rounded-md w-7/12 md:w-6/12'>
                                    <option value="10">10 Rows</option>
                                    <option value="20">20 Rows</option>
                                    <option value="50">50 Rows</option>
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
                    <div className="col md:flex justify-end gap-3">
                        <select
                            name="status"
                            onChange={handleStatusChange}
                            className="outline-none border-2 p-2 w-full rounded-md md:w-8/12 my-4 md:my-0"
                        >
                            <option value="">Select Any Status</option>
                            {Array.isArray(options) && options.length > 0 ? (
                                options.map((item, index) =>
                                    item?.status && item.status !== "closed" ? (
                                        <option key={index} value={item.status}>
                                            {statuses[item.status] || item.status} - {item.count || 0}
                                        </option>
                                    ) : null
                                )
                            ) : (
                                <option disabled>No statuses available</option> // Handles empty options case
                            )}
                        </select>

                        <form action="">
                            <div className="flex md:items-stretch items-center  gap-3">
                                <input
                                    type="search"
                                    className='outline-none border-2 p-3 text-sm rounded-md w-full my-4 md:my-0'
                                    placeholder='Search Here..'
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

                <div className="overflow-x-auto py-6 md:px-4">
                    {loading ? (
                        <div className='flex justify-center items-center py-6 h-full'>
                            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

                        </div>
                    ) : currentItems.length > 0 ? (
                        <table className="min-w-full mb-4" ref={tableRef}>
                            <thead>
                                <tr className='bg-[#3e76a5]'>
                                    <th className="md:py-3 p-2 px-4 border-b border-r border-l text-white text-left uppercase whitespace-nowrap">SL</th>
                                    <th className="md:py-3 p-2 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Client Code</th>
                                    <th className="md:py-3 p-2 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Company Name</th>
                                    <th className="md:py-3 p-2 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Client Spoc</th>
                                    <th className="md:py-3 p-2 px-4 border-b border-r text-white text-center uppercase whitespace-nowrap ">Application Stats
                                    </th>
                                    <th className="md:py-3 p-2 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item, index) => (
                                    <>
                                        <tr key={index}>
                                            <td className="md:py-3 p-2 px-4 border-b border-l border-r text-left whitespace-nowrap">
                                                <input type="checkbox" className='me-2' />
                                                {index + 1 + (currentPage - 1) * itemsPerPage}
                                            </td>
                                            <td className="md:py-3 p-2 px-4 border-b border-r text-center whitespace-nowrap">{item.client_unique_id}</td>
                                            <td className="md:py-3 p-2 px-4 border-b border-r whitespace-nowrap">{item.name}</td>
                                            <td className="md:py-3 p-2 px-4 border-b border-r whitespace-nowrap text-center">{item.single_point_of_contact}</td>
                                            <td className="md:py-3 p-2 px-4 border-b border-r whitespace-nowrap text-center cursor-pointer">

                                                <table>

                                                    <tbody>
                                                        <tr className=''>
                                                            <th className="md:py-3 p-1 px-4 border border-r text-left uppercase whitespace-nowrap text-sm">Total Applications</th>
                                                            <td className="md:py-3 p-2 px-4 border-b border border-r  text-left uppercase whitespace-nowrap">{item.application_count}</td>
                                                        </tr>
                                                        <tr>
                                                            <th className="md:py-3 p-1 px-4 border border-r text-left uppercase whitespace-nowrap text-sm">Completed Applications</th>
                                                            <td className="md:py-3 p-2 px-4 border-b border border-r  text-left uppercase whitespace-nowrap">{item.completedApplicationsCount}</td>
                                                        </tr>
                                                        <tr>
                                                            <th className="md:py-3 p-1 px-4 border border-r text-left uppercase whitespace-nowrap text-sm">Pending Applications</th>
                                                            <td className="md:py-3 p-2 px-4 border-b border border-r  text-left uppercase whitespace-nowrap">{item.pendingApplicationsCount}</td>
                                                        </tr>
                                                    </tbody>

                                                </table>

                                            </td>
                                            <td className="md:py-3 p-2 px-4 border-b border-r text-center whitespace-nowrap">
                                                <button
                                                    disabled={branchLoading || isApiLoading}
                                                    className={`rounded-md p-3 text-white ${branchLoading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}
                                                    onClick={() => handleBranches(item.main_id)}>
                                                    {expandedClient === item.main_id ? 'Hide Branches' : 'View Branches'}
                                                </button>


                                            </td>
                                        </tr>

                                        {expandedClient === item.main_id && (
                                            branchLoading ? (
                                                <tr>
                                                    <td colSpan="6" className="py-3 md:px-4">
                                                        <div className="flex justify-center items-center">
                                                            <PulseLoader
                                                                color="#36D7B7"
                                                                loading={branchLoading}
                                                                size={10}
                                                                aria-label="Loading Spinner"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                branches[item.main_id]?.length > 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="py-3 md:px-4">
                                                            <table className='w-full'>
                                                                <thead>
                                                                    <tr className='bg-[#3e76a5] text-white'>
                                                                        <th className="w-4/12 md:py-3 p-2 px-4 border-b border-r border-l whitespace-nowrap text-center text-bold">Branch Name</th>
                                                                        <th className="w-4/12 md:py-3 p-2 px-4 border-b border-r border-l whitespace-nowrap text-center text-bold">Branch Application Count</th>
                                                                        <th className="w-4/12 md:py-3 p-2 px-4 border-b border-r border-l whitespace-nowrap text-center">Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {branches[item.main_id]?.map((branch, branchIndex) => (
                                                                        <tr key={branchIndex} className="border bg-gray-100">
                                                                            <td className="w-4/12 md:py-3 p-2 px-4 border-b border-r border-l whitespace-nowrap text-center text-bold">{branch.branch_name}</td>
                                                                            <td className="w-4/12 md:py-3 p-2 px-4 border-b border-r border-l whitespace-nowrap text-center text-bold">{branch.application_count}</td>
                                                                            <td className="w-4/12 md:py-3 p-2 px-4 border-b border-r border-l whitespace-nowrap text-center">
                                                                                <button className="bg-[#3e76a5] hover:bg-[#3e76a5] rounded-md p-2 text-white" onClick={() => handleClick(branch.branch_id)}>Check In</button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="md:py-3 p-2 px-4 text-center text-gray-500">
                                                            No branches available
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        )}

                                    </>


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
        </>
    );
};

export default ClientMasterTrackerList;