import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import PulseLoader from "react-spinners/PulseLoader";
import Swal from 'sweetalert2';
import LoginContext from './InternalLoginContext';
import { useApiCall } from '../ApiCallContext';

const InternalLoginList = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const { data, loading, fetchData, handleEditAdmin, parsedServiceGroups } = useContext(LoginContext)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");
    useEffect(() => {
        if (!isApiLoading) {
            fetchData();
        }
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalServices, setModalServices] = useState([]);

    // Handle "View More" button click
    const handleViewMore = (adminId, services) => {
        setModalServices(services); // Set the services for the clicked admin
        setIsModalOpen(true); // Open the modal
    };

    // Close the modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };


    const filteredItems = data.filter(item => {
        return (
            item.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });


    const handleSelectChange = (e) => {
        const checkedStatus = e.target.value;
        setItemPerPage(checkedStatus);
    }

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

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const deleteAdmin = (id) => {
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
                    return;
                }

                const requestOptions = {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                };

                // Make the DELETE request
                fetch(`https://api.goldquestglobal.in/admin/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
                    .then((response) => response.json()) // Parse the response as JSON
                    .then((result) => {
                        Swal.fire(
                            'Deleted!',
                            'Admin has been deleted successfully.',
                            'success'
                        );
                        fetchData();
                        // Handle token expiration (if the message contains "invalid token")
                        if (result.message && result.message.toLowerCase().includes("invalid token")) {
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                // Redirect to the admin login page
                                window.location.href = "/admin-login"; // Replace with your login route
                            });
                            return; // Stop further execution if session has expired
                        }

                        // If not OK or there's an error, handle it
                        if (!result.ok) {
                            return result.text().then(text => {
                                const errorData = JSON.parse(text);
                                Swal.fire(
                                    'Error!',
                                    `An error occurred: ${errorData.message}`,
                                    'error'
                                );
                                throw new Error(errorData.message); // Handle the error
                            });
                        }

                        // If the deletion is successful, show success message

                        // Refresh the data

                    })
                    .catch((error) => {
                        console.error('Fetch error:', error);

                    }).finally(() => {
                        setIsApiLoading(false);

                    });
            }
        });
    };

    const editAdmin = (item) => {
        handleEditAdmin(item)
    }


    return (
        <>

            <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4 p-3">
                <div className="col">
                    <div className="flex gap-5 justify-between">
                        <select name="options" onChange={handleSelectChange} className='outline-none border  p-3 text-left rounded-md w-full md:w-6/12'>
                            <option value="10">10 Rows</option>
                            <option value="20">20 Rows</option>
                            <option value="50">50 Rows</option>
                            <option value="100">100 Rows</option>
                            <option value="200">200 Rows</option>
                            <option value="300">300 Rows</option>
                            <option value="400">400 Rows</option>
                            <option value="500">500 Rows</option>
                        </select>
                    </div>
                </div>
                <div className="col md:flex justify-end">
                    <form action="">
                        <div className="flex md:items-stretch items-center gap-3">
                            <input
                                type="search"
                                className='outline-none border-2 p-3 rounded-md w-full text-sm my-4 md:my-0'
                                placeholder='Search by Client Code...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </form>
                </div>
            </div>
            <h2 className='text-center text-2xl font-bold my-5'>Admin List</h2>

            <div className="overflow-x-auto">

                {loading ? (
                    <div className='flex justify-center items-center py-6 '>
                        <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

                    </div>
                ) : currentItems.length > 0 ? (
                    <table className="min-w-full">
                        <thead>
                            <tr className='bg-green-500'>
                                <th className="py-2 px-4 border-b text-left text-white border-r uppercase whitespace-nowrap">SL</th>
                                <th className="py-2 px-4 border-b text-left text-white border-r uppercase whitespace-nowrap">Employee ID</th>
                                <th className="py-2 px-4 border-b text-left text-white border-r uppercase whitespace-nowrap">Employee Name</th>
                                <th className="py-2 px-4 border-b text-left text-white border-r uppercase whitespace-nowrap">Employee Mobile</th>
                                <th className="py-2 px-4 border-b text-left text-white border-r uppercase whitespace-nowrap">Email</th>
                                <th className="py-2 px-4 border-b text-left text-white border-r uppercase whitespace-nowrap">Role</th>
                                <th className="py-2 px-4 border-b text-left text-white border-r uppercase whitespace-nowrap">Status</th>
                                <th className="py-2 px-4 border-b text-left text-white border-r uppercase whitespace-nowrap">Service Group</th>
                                <th className="py-2 px-4 border-b text-left text-white border-r uppercase whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((item, index) => {
                                const serviceGroups = parsedServiceGroups[index] || []; // Access service groups for each admin
                                const servicesToShow = serviceGroups.length > 1 ? serviceGroups[0] : serviceGroups.join(', '); // Show only the first service or all if there's only one
                                const showMoreButton = serviceGroups.length > 1; // Check if there are more than one service to show the "View More" button

                                return (
                                    <tr key={index}>
                                        <td className="py-2 px-4 border-b border-r border-l text-center whitespace-nowrap">
                                            {index + 1 + (currentPage - 1) * itemsPerPage}
                                        </td>
                                        <td className="py-2 px-4 border-b border-r text-center whitespace-nowrap">{item.emp_id || 'NIL'}</td>
                                        <td className="py-2 px-4 border-b border-r text-center whitespace-nowrap">{item.name || 'NIL'}</td>
                                        <td className="py-2 px-4 border-b border-r text-center whitespace-nowrap">{item.mobile || 'NIL'}</td>
                                        <td className="py-2 px-4 border-b border-r text-center whitespace-nowrap">{item.email}</td>
                                        <td className="py-2 px-4 border-b border-r text-center whitespace-nowrap">{item.role || 'NIL'}</td>
                                        <td className="py-2 px-4 border-b border-r text-center whitespace-nowrap">{item.status || 'NIL'}</td>
                                        <td className="py-2 px-4 border-b border-r text-center whitespace-nowrap">
                                            {item.role !== "admin" ? (
                                                <>
                                                    {servicesToShow ? (
                                                        <span className="px-4 py-2 bg-green-100 border border-green-500 rounded-lg text-sm">
                                                            {servicesToShow}
                                                        </span>
                                                    ) : (
                                                        "Nil"
                                                    )}

                                                    {showMoreButton && (
                                                        <button
                                                            className="ms-3"
                                                            onClick={() => handleViewMore(item.id, serviceGroups)} // Open the modal on click
                                                        >
                                                            View More
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                'NIL'
                                            )}
                                        </td>

                                        <td className="py-2 px-4 border-b border-r text-center whitespace-nowrap">
                                            <button className='bg-green-500 hover:bg-green-200 rounded-md me-3 p-2 text-white' onClick={() => editAdmin(item)}>Edit</button>
                                            <button className={`rounded-md p-3 text-white ${loading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-200'}`}
                                                disabled={isApiLoading || loading} onClick={() => deleteAdmin(item.id)}>Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                    </table>
                ) : (
                    <div className="text-center py-6">
                        <p>No Data Found</p>
                    </div>
                )}

                {isModalOpen && (


                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg p-4 md:w-6/12">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold">Services Groups</h2>
                                <button
                                    className="text-red-500 text-2xl"
                                    onClick={handleCloseModal}
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 w-full m-auto h-auto ">
                                <ul className='flex flex-wrap gap-3'>
                                    {modalServices.map((service, idx) => (
                                        <li key={idx} className="px-4 py-2 bg-green-100 border text-center border-green-500 rounded-lg text-sm">{service}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            <div className="flex items-center justify-end  p-3 py-2">
                <button
                    onClick={showPrev}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-0 border border-gray-300 bg-white p-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                    className="relative inline-flex items-center rounded-0 border border-gray-300 bg-white p-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    aria-label="Next page"
                >
                    <MdArrowForwardIos />
                </button>
            </div>
        </>
    )
}

export default InternalLoginList
