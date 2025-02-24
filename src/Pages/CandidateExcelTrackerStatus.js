import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useApi } from '../ApiContext';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useSidebar } from '../Sidebar/SidebarContext';
import { BranchContextExel } from './BranchContextExel';
import Swal from 'sweetalert2';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Modal from 'react-modal';
import { useApiCall } from '../ApiCallContext';

const CandidateExcelTrackerStatus = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const [loadingRow, setLoadingRow] = useState(null);
    const [selectedAttachments, setSelectedAttachments] = useState([]);

    const { handleTabChange } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();
    const [itemsPerPage, setItemPerPage] = useState(10)
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpenDoc, setIsModalOpenDoc] = useState(false);

    const API_URL = useApi();
    const { branch_id } = useContext(BranchContextExel);
    const queryParams = new URLSearchParams(location.search);
    const clientId = queryParams.get('clientId');
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem('_token');

    // Fetch data from the main API
    const fetchData = useCallback(() => {
        setIsApiLoading(true);

        if (!branch_id || !adminId || !token) {
            return;
        } else {
            setLoading(true);
        }
        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`${API_URL}/candidate-master-tracker/applications-by-branch?branch_id=${branch_id}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then(response => {
                return response.json().then(result => {
                    const newToken = result._token || result.token;
                    if (newToken) {
                        localStorage.setItem("_token", newToken); // Update the token in localStorage
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
                        return; // Stop further execution if token is invalid
                    }



                    // If response is not OK, show error message
                    if (!response.ok) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: result.message || 'Failed to load data',
                        });
                        throw new Error(result.message || 'Failed to load data');
                    }

                    return result;
                });
            })
            .then((result) => {
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Update the token in localStorage
                }
                setLoading(false);
                setData(result.data.applications || []);
            })
            .catch((error) => {
                console.error('Fetch error:', error);
                // Optionally, show a generic error message

            })
            .finally(() => {
                setLoading(false);
                setIsApiLoading(false);
                // Always stop loading when the request is complete
            });

    }, [branch_id, adminId, token, setData]);


    const goBack = () => {
        handleTabChange('candidate_master');
    }


    const handleViewDocuments = (attachments) => {
        setSelectedAttachments(attachments);
        setIsModalOpenDoc(true);
    };

    const handleCloseModalDoc = () => {
        setIsModalOpenDoc(false);
        setSelectedAttachments([]);
    };

    const filteredItems = data.filter(item => {
        return (
            (item.application_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item.employee_id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );
    });

    const tableRef = useRef(null); // Ref for the table container




    const filteredOptions = filteredItems.filter(item =>
        (item.status?.toLowerCase() || "").includes(selectedStatus.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOptions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOptions.slice(indexOfFirstItem, indexOfLastItem);

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
                    className={`px-3 py-1 rounded-0 ${currentPage === number ? 'bg-green-500 text-white' : 'bg-green-300 text-black border'}`}
                >
                    {number}
                </button>
            )
        ));
    };

    useEffect(() => {
        if (!isApiLoading) {
            fetchData();
        }
    }, [clientId, branch_id]);





    const handleSelectChange = (e) => {
        const selectedValue = e.target.value;
        setItemPerPage(selectedValue)
    }

    const handleBGVClick = (cef_id, branch_id, applicationId) => {
        // Navigate to the Candidate BGV page with the cef_id
        navigate(`/candidate-bgv?cef_id=${cef_id}&branch_id=${branch_id}&applicationId=${applicationId}`);
    };
    const handleDAVClick = (def_id, branch_id, applicationId) => {
        // Navigate to the Candidate BGV page with the cef_id
        navigate(`/candidate-dav?def_id=${def_id}&branch_id=${branch_id}&applicationId=${applicationId}`);
    };



    const handleSendLink = (applicationID, branch_id, customer_id, rowId) => {
        setIsApiLoading(true);

        // Retrieve admin ID and token from localStorage
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");

        // Check if adminId or token is missing
        if (!adminId || !token) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Admin ID or token is missing. Please log in again.',
            });
            return;
        }


        // Construct the URL dynamically with query parameters
        const url = `${API_URL}/candidate-master-tracker/send?application_id=${applicationID}&branch_id=${branch_id}&customer_id=${customer_id}&admin_id=${adminId}&_token=${token}`;

        const requestOptions = {
            method: "GET",
            redirect: "follow", // No body required for GET requests
        };

        fetch(url, requestOptions)
            .then((response) => response.json().then(result => {
                // Handle token expiration check
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Update token in localStorage
                }

                if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        window.location.href = "/admin-login"; // Redirect to login page on token expiration
                    });
                    return; // Stop further processing if token expired
                }

                if (!response.ok) {
                    Swal.fire({
                        title: 'Error!',
                        text: `An error occurred: ${result.message}`,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                    throw new Error('Network response was not ok');
                }

                return result; // Return the successful result if no errors
            })) // Assuming the response is JSON
            .then((result) => {
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Update the token in localStorage
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
                    return; // Exit the function after session expiry handling
                }

                // Handle successful response
                if (result.status) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: result.message,
                        footer: `DAV Mail Sent: ${result.details.davMailSent} | BGV Mail Sent: ${result.details.cefMailSent}`,
                    });
                } else {
                    // Handle error in response
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: result.message,
                        footer: result.details ? `DAV Errors: ${result.details.davErrors} | CEF Errors: ${result.details.cefErrors}` : '',
                    });
                }
            })
            .catch((error) => {
                // Handle errors that occur during the fetch
                console.error(error);

            }).finally(() => {
                setIsApiLoading(false);

            });
    };

    return (
        <div className="bg-[#c1dff2]">
            <div className="space-y-4 p-3 md:py-[30px] md:px-[51px] bg-white">


                <div className=" md:mx-4 bg-white">
                    <div className="md:flex justify-between items-center md:my-4 border-b-2 pb-4">
                        <div className="col">
                            <form action="">
                                <div className="flex gap-5 justify-between">
                                    <select name="options" id="" onChange={handleSelectChange} className='outline-none pe-14 ps-2 text-left rounded-md w-full border md:w-10/12'>
                                        <option value="10">10 Rows</option>
                                        <option value="20">20 Rows</option>
                                        <option value="50">50 Rows</option>
                                        <option value="100">100 Rows</option>
                                        <option value="200">200 Rows</option>
                                        <option value="300">300 Rows</option>
                                        <option value="400">400 Rows</option>
                                        <option value="500">500 Rows</option>
                                    </select>
                                    <button onClick={goBack} className="bg-green-500 mx-2 whitespace-nowrap hover:bg-green-400 text-white rounded-md p-3">Go Back</button>

                                </div>
                            </form>
                        </div>
                        <div className="col md:flex justify-end ">
                            <form action="">
                                <div className="flex md:items-stretch items-center  gap-3">
                                    <input
                                        type="search"
                                        className='outline-none border-2 p-2 rounded-md w-full my-4 md:my-0'
                                        placeholder='Search by Client Code, Company Name, or Client Spoc'
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </form>
                        </div>

                    </div>

                </div>
                <div ref={tableRef} className="overflow-x-auto py-6 md:px-4 shadow-md rounded-md bg-white">
                    {loading ? (
                        <div className='flex justify-center items-center py-6 h-full'>
                            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
                        </div>
                    ) : currentItems.length > 0 ? (
                        <table className="min-w-full border-collapse border overflow-scroll rounded-lg whitespace-nowrap">
                            <thead className='rounded-lg'>
                                <tr className="bg-green-500 text-white">
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">SL NO</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Full name of the applicant </th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Employee ID</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Mobile Number</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Email</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Initiation Date</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">View Documents</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Is Employment Gap</th>
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">Is Education Gap</th>

                                    {currentItems.some(item => item.cef_id) ? (
                                        <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                                            BGV
                                        </th>
                                    ) : (
                                        <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                                            BGV
                                        </th>
                                    )}
                                    {currentItems.some(item => item.cef_filled_date) ? (
                                        <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                                            BGV FILLED DATE
                                        </th>
                                    ) : (
                                        <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                                            BGV FILLED DATE
                                        </th>
                                    )}
                                    {currentItems.some(item => item.dav_id) ? (
                                        <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                                            DAV
                                        </th>
                                    ) : (
                                        <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                                            DAV
                                        </th>
                                    )}
                                    {currentItems.some(item => item.dav_filled_date) ? (
                                        <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                                            DAV FILLED DATE
                                        </th>
                                    ) : (
                                        <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                                            DAV FILLED DATE
                                        </th>
                                    )}
                                    <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                                        SEND LINK
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((data, index) => (
                                    <React.Fragment key={data.id}>
                                        <tr className="text-center">
                                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">{index + 1}</td>
                                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">{data.name || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">{data.employee_id || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap ">{data.mobile_number || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap ">{data.email || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                {data.created_at
                                                    ? (new Date(data.created_at))
                                                        .toLocaleDateString('en-GB')
                                                        .split('/')
                                                        .map((item, index) => index === 0 || index === 1 ? item.replace(/^0/, '') : item) // Remove leading zero from day and month
                                                        .join('-')
                                                    : 'NIL'}
                                            </td>
                                            <td className="py-3 px-4 border whitespace-nowrap">
                                                {data.service_data?.cef ? (
                                                    <button
                                                        className="px-4 py-2 bg-green-500 text-white rounded"
                                                        onClick={() => handleViewDocuments(data.service_data.cef)}
                                                    >
                                                        View Documents
                                                    </button>
                                                ) : (
                                                    <span>No Attachments</span>
                                                )}
                                            </td>
                                            <td
                                                className={`px-4 border-b border-r-2 whitespace-nowrap uppercase ${data.is_employment_gap === "no"
                                                        ? "text-green-500"
                                                        : data.is_employment_gap === "yes"
                                                            ? "text-red-500"
                                                            : "text-black"
                                                    }`}
                                            >
                                                {data.is_employment_gap || "NIL"}
                                            </td>
                                            <td
                                                className={`px-4 border-b border-r-2 whitespace-nowrap uppercase ${data.is_education_gap === "no"
                                                        ? "text-green-500"
                                                        : data.is_education_gap === "yes"
                                                            ? "text-red-500"
                                                            : "text-black"
                                                    }`}
                                            >
                                                {data.is_education_gap || "NIL"}
                                            </td>

                                            {data.cef_id ? (
                                                <td className="border px-4 py-2">
                                                    <button
                                                        className="bg-blue-500 uppercase border border-white hover:border-blue-500 text-white px-4 py-2 rounded hover:bg-white hover:text-blue-500"
                                                        onClick={() => handleBGVClick(data.cef_id, data.branch_id, data.main_id)}
                                                    >
                                                        BGV
                                                    </button>
                                                </td>
                                            ) : (
                                                <td className="border px-4 py-2">NIL</td>
                                            )}

                                            {currentItems.some(item => item.cef_filled_date) ? (
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                    {data.cef_filled_date
                                                        ? (new Date(data.cef_filled_date))
                                                            .toLocaleDateString('en-GB') // Format as DD/MM/YYYY
                                                            .split('/')
                                                            .map((item, index) => index === 0 || index === 1 ? item.replace(/^0/, '') : item) // Remove leading zero from day and month
                                                            .join('-')
                                                        : 'NIL'}
                                                </td>

                                            ) : (
                                                <td className="border px-4 py-2">NIL</td>
                                            )}

                                            {data.dav_id ? (
                                                <td className="border px-4 py-2">
                                                    <button
                                                        className="bg-purple-500 uppercase border border-white hover:border-purple-500 text-white px-4 py-2 rounded hover:bg-white hover:text-purple-500"
                                                        onClick={() => handleDAVClick(data.def_id, data.branch_id, data.main_id)}
                                                    >
                                                        DAV
                                                    </button>
                                                </td>
                                            ) : (
                                                <td className="border px-4 py-2">NIL</td>
                                            )}
                                            {currentItems.some(item => item.dav_filled_date) ? (
                                                <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                                                    {data.dav_filled_date
                                                        ? new Intl.DateTimeFormat('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: '2-digit',
                                                        }).format(new Date(data.dav_filled_date))
                                                        : 'NIL'}
                                                </td>
                                            ) : (
                                                <td className="border px-4 py-2">NIL</td>
                                            )}
                                            {data.cef_submitted === 0 || (data.dav_exist === 1 && data.dav_submitted === 0) ? (
                                                <td className="border px-4 py-2">
                                                    <button
                                                        className={`bg-green-600 uppercase border border-white hover:border-green-500 text-white px-4 py-2 rounded hover:bg-white ${loadingRow === data.id ? "opacity-50 cursor-not-allowed hover:text-green-500 " : "hover:text-green-500"
                                                            }`}
                                                        onClick={() => handleSendLink(data.main_id, data.branch_id, data.customer_id, data.id)}
                                                        disabled={loadingRow} // Disable only the clicked button
                                                    >
                                                        {loadingRow === data.id ? "Sending..." : "SEND LINK"}
                                                    </button>
                                                </td>
                                            ) : <td className="border px-4 py-2">NIL</td>}

                                        </tr>
                                        {isModalOpenDoc && (
                                            <Modal
                                                isOpen={isModalOpenDoc}
                                                onRequestClose={handleCloseModalDoc}
                                                className="custom-modal-content"
                                                overlayClassName="custom-modal-overlay"
                                            >
                                                <div className="modal-container">
                                                    <h2 className="modal-title text-center my-4 text-2xl font-bold">Attachments</h2>
                                                    <ul className="modal-list h-[400px] overflow-scroll">
                                                        {Object.entries(selectedAttachments).map(([category, attachments], idx) => (
                                                            <li key={idx} className="modal-list-category">
                                                                <h3 className="modal-category-title md:text-lg font-semibold my-2">{category}</h3>
                                                                <ul>
                                                                    {attachments.map((attachment, subIdx) => {
                                                                        const label = Object.keys(attachment)[0];
                                                                        const fileUrls = attachment[label]?.split(','); // Split URLs by comma
                                                                        return (
                                                                            <li key={subIdx} className="grid grid-cols-2 items-center border-b py-2">
                                                                                <span className="modal-list-text">{subIdx + 1}: {label}</span>
                                                                                <div className="modal-url-list grid md:me-7 gap-2 justify-end">
                                                                                    {fileUrls.map((url, urlIdx) => (
                                                                                        <a
                                                                                            key={urlIdx}
                                                                                            href={url.trim()} // Trim to remove any extra spaces
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="modal-view-button w-auto m-0 bg-green-500 text-white p-2 rounded-md px-4 block mt-2 text-center"
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
                                                    </div>
                                                </div>
                                            </Modal>
                                        )}
                                    </React.Fragment>
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
    );

};

export default CandidateExcelTrackerStatus;
