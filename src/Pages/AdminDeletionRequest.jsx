import React, { useEffect, useState, useCallback } from 'react'
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';

const AdminDeletionRequest = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext
    const [listData, setListData] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemPerPage] = useState(10)
    const API_URL = useApi();
    const [currentPage, setCurrentPage] = useState(1);
    const fetchClientDrop = useCallback(async () => {
        try {
            setIsApiLoading(true);
            setLoading(true);

            const adminData = JSON.parse(localStorage.getItem("admin"));
            const storedToken = localStorage.getItem("_token");

            // Check if admin ID and token are available before proceeding
            if (!adminData?.id || !storedToken) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Admin ID or token is missing.',
                    icon: 'error',
                    confirmButtonText: 'Ok',
                });
                return;
            }

            const admin_id = adminData.id;
            const _token = storedToken;

            const res = await fetch(`${API_URL}/delete-request/list?admin_id=${admin_id}&_token=${_token}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await res.json();

            // Check if response is OK and if result status is truthy
            if (!res.ok || !result.status) {
                const errorMessage = result.message || 'An error occurred';
                if (result.message && result.message.toLowerCase().includes("invalid token")) {
                    // Handle invalid token
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        window.location.href = "/admin-login"; // Redirect to login page
                    });
                    return; // Exit early after redirect
                }

                // For other error messages
                Swal.fire({
                    title: 'Error!',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'Ok',
                });
                return;
            }

            // Handle new token (if available)
            const newToken = result._token || result.token;
            if (newToken) {
                localStorage.setItem('_token', newToken);
            }

            // Process and set data (simplified mapping function)
            const processedData = result.deleteRequests;

            setListData(processedData);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setIsApiLoading(false);

        }
    }, []);

    useEffect(() => {
        if (!isApiLoading) {
            fetchClientDrop();
        }
    }, [fetchClientDrop]);


    const filteredItems = listData.filter(item => {
        return (
            item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.admin_name?.toLowerCase().includes(searchTerm.toLowerCase())

        );
    });

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


    const exportToExcel = () => {
        // Prepare the data for Excel export
        const data = currentItems.map((report, index) => ({
            Index: index + 1 + (currentPage - 1) * itemsPerPage,
            AdminName: report.admin_name || 'NIL',
            AdminEmail: report.admin_email || 'NIL',
            AdminMobile: report.admin_mobile || 'NIL',
            CustomerName: report.customer_name || 'NIL',
            CustomerMobile: report.customer_mobile || 'NIL',
            DirectorEmail: report.director_email || 'NIL',
            FromDate: new Date(report.from).toLocaleDateString(),
            ToDate: new Date(report.to).toLocaleDateString(),
            Status: report.status || 'NIL',
        }));

        // Create a new worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Create a new workbook and append the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reports');

        // Export the workbook to Excel
        XLSX.writeFile(wb, 'reports.xlsx');
    };



    return (
        <>
            <div className=" py-4 md:py-16">
                <h2 className='md:text-4xl text-2xl font-bold pb-8 md:pb-4 text-center'>Deletion Requests</h2>

                <div className="overflow-x-auto py-6 px-4 bg-white shadow-md rounded-md md:m-10 m-3">
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
                                        className="bg-[#3e76a5] text-sm text-white py-3 px-4 rounded-md capitalize"
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
                                        placeholder='Search by Admin Name...'
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
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Admin Name	</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Admin Email</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Admin Mobile</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Customer Name</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Customer Mobile</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">Director Email</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">From</th>
                                        <th className="py-3 text-left text-white border-r px-4 border-b whitespace-nowrap uppercase">To</th>
                                        <th className="py-3 text-center text-white px-4 border-b whitespace-nowrap uppercase">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {currentItems.map((report, index) => (
                                        <tr key={index} id={report.id}>
                                            <td className="py-3 px-4 border-b border-r text-center border-l whitespace-nowrap">
                                                {index + 1 + (currentPage - 1) * itemsPerPage}
                                            </td>



                                            <td className="py-3 px-4 border-b border-r text-center whitespace-nowrap text-sm">{report.admin_name || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap text-sm">{report.admin_email || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap text-sm">{report.admin_mobile || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap text-sm">{report.customer_name || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap text-sm">{report.customer_mobile || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap text-sm">{report.director_email || 'NIL'}</td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap text-sm">
                                                {new Date(report.from).getDate()}-
                                                {new Date(report.from).getMonth() + 1}-
                                                {new Date(report.from).getFullYear()}
                                            </td>
                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap text-sm">
                                                {new Date(report.to).getDate()}-
                                                {new Date(report.to).getMonth() + 1}-
                                                {new Date(report.to).getFullYear()}
                                            </td>

                                            <td className="py-3 px-4 border-b border-r whitespace-nowrap text-sm">{report.status || 'NIL'}</td>

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

export default AdminDeletionRequest