import React, { useEffect, useState } from 'react';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import HolidayManagementForm from './HolidayManagementForm';
import { useHoliday } from './HolidayManagementContext';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';

const HolidayManagement = () => {
    const API_URL = useApi();
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const { editService, fetchData, loading, data } = useHoliday();
    const [itemsPerPage, setItemPerPage] = useState(10);
    useEffect(() => {
        if (!isApiLoading) {
            fetchData();
        }
    }, [fetchData]);

    const [currentPage, setCurrentPage] = useState(1);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = data.filter(item => {
        return (
            item.title.toLowerCase().includes(searchTerm.toLowerCase())

        );
    });
    const handleSelectChange = (e) => {
        const checkedStatus = e.target.value;
        setItemPerPage(checkedStatus);
    }


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


    const handleEditService = (service) => {
        editService(service);
        fetchData();
    };

    const handleDelete = (serviceId) => {

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
        }).then((result) => {
            if (result.isConfirmed) {
                setIsApiLoading(true);

                const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
                const storedToken = localStorage.getItem("_token");

                if (!admin_id || !storedToken) {
                    console.error("Admin ID or token is missing.");
                    Swal.fire({
                        title: 'Error!',
                        text: 'Admin ID or token is missing. Please log in again.',
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                    return;
                }

                const requestOptions = {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };

                fetch(`${API_URL}/holiday/delete?id=${serviceId}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
                    .then(response => response.json())
                    .then(result => {
                        // Handle token renewal if provided
                        const newToken = result._token || result.token;
                        if (newToken) {
                            localStorage.setItem("_token", newToken);
                        }

                        // Check for session expiration due to an invalid token
                        const message = result.message?.toLowerCase();
                        if (message && message.includes("invalid") && message.includes("token")) {
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

                        // Check if deletion was successful
                        if (result.status) {
                            // Refresh data
                            fetchData();

                            // Show success message with the response message
                            Swal.fire({
                                title: 'Deleted!',
                                text: result.message || 'Holiday deleted successfully.',
                                icon: 'success',
                                confirmButtonText: 'Ok'
                            });
                        } else {
                            // If deletion failed, show error message
                            Swal.fire({
                                title: 'Error!',
                                text: result.message || 'An error occurred',
                                icon: 'error',
                                confirmButtonText: 'Ok'
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Fetch error:', error);
                        Swal.fire({
                            title: 'Error!',
                            text: 'Something went wrong. Please try again.',
                            icon: 'error',
                            confirmButtonText: 'Ok'
                        });
                    }).finally(() => {
                        setIsApiLoading(false);
                    });
            }
        });
    };

    const exportToExcel = () => {
        // Prepare the data for Excel export
        const data = currentItems.map((holiday, index) => ({
            Index: index + 1 + (currentPage - 1) * itemsPerPage,
            'Holiday Title': holiday.title,
            'Holiday Date': new Date(holiday.date).toLocaleDateString('en-GB'), // Adjust format as needed
        }));
    
        // Create a new worksheet
        const ws = XLSX.utils.json_to_sheet(data);
    
        // Create a new workbook and append the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Holidays');
    
        // Export the workbook to Excel
        XLSX.writeFile(wb, 'holidays.xlsx');
    };
    

    return (
        <>
            <h2 className='text-center md:text-3xl md:mt-14 mt-3 font-bold'> Holiday Management </h2>

            <div className="grid md:grid-cols-2 items-stretch grid-cols-1 gap-7 p-3 md:p-8">
                <div className='bg-white shadow-md rounded-md p-3'>
                    <HolidayManagementForm />
                </div>
                <div className=' border p-3 bg-white shadow-md rounded-md'>



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
                                        className="bg-[#3e76a5] text-white py-3 px-4 rounded-md text-sm capitalize"
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
                                <div className="flex md:items-stretch items-center  gap-3">
                                    <input
                                        type="search"
                                        className='outline-none border-2 p-2 text-sm rounded-md w-full my-4 md:my-0'
                                        placeholder='Search Here.'
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
                                <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

                            </div>
                        ) : currentItems.length > 0 ? (
                            <table className="min-w-full">
                                <thead>
                                    <tr className='bg-[#3e76a5]'>
                                        <th className="py-2 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">SL</th>
                                        <th className="py-2 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Holiday Title</th>
                                        <th className="py-2 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Holiday Date</th>
                                        <th className="py-2 px-4 text-white border-r border-b text-center uppercase whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length > 0 ?
                                        (currentItems.map((item, index) => (
                                            <tr key={item.index}>
                                                <td className="py-2 px-4 border-l border-r border-b whitespace-nowrap">                        {index + 1 + (currentPage - 1) * itemsPerPage}
                                                </td>
                                                <td className="py-2 px-4 border-r border-b whitespace-nowrap">{item.title}</td>
                                                <td className="py-2 px-4 border-r border-b ">{new Date(item.date).toLocaleDateString()}</td>

                                                <td className="py-2 px-4 border-r border-b whitespace-nowrap text-center">
                                                    <button
                                                        disabled={loading}
                                                        className='bg-[#3e76a5] rounded-md hover:bg-[#3e76a5] p-2 text-white'
                                                        onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); handleEditService(item); }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className={`rounded-md p-2 ms-3 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-200'}`}
                                                        disabled={isApiLoading}

                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-6 px-4 border-l border-r text-center border-b whitespace-nowrap">
                                                    No data available
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-6">
                                <p>No Data Found</p>
                            </div>
                        )}


                    </div>
                    <div className="flex items-center justify-end  rounded-md px-4 py-3 sm:px-6 md:m-4 mt-2">
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


            </div>
        </>
    );
};

export default HolidayManagement;