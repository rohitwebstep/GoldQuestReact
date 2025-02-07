import React, { useEffect, useState } from 'react';
import { usePackage } from './PackageContext';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext

const PackageManagementList = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext

    const [itemsPerPage, setItemPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const { editPackage, data, loading, fetchData, setError } = usePackage();
    const [searchTerm, setSearchTerm] = useState('');
    const API_URL = useApi();
    useEffect(() => {
        if (!isApiLoading) {
            fetchData();
        }
    }, [fetchData]);
    const filteredItems = data.filter(item => {
        return (
            item?.title.toLowerCase().includes(searchTerm.toLowerCase())
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
                    className={`px-3 py-1 rounded-0 ${currentPage === number ? 'bg-green-500 text-white' : 'bg-green-300 text-black border'}`}
                >
                    {number}
                </button>
            )
        ));
    };

    const handleEdit = (pkg) => {
        editPackage(pkg);
    };
    const handleSelectChange = (e) => {
        const checkedStatus = e.target.value;
        setItemPerPage(checkedStatus);
    }
    const handleDelete = (packageId) => {

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

                return fetch(`${API_URL}/package/delete?id=${packageId}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
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
                        // Handle successful deletion
                        if (result.status === false) {
                            Swal.fire('Error!', result.message, 'error');
                            return false; // Exit early if the status is false
                        }

                        setError(null); // Reset any error state
                        // Show success message and fetch updated data
                        Swal.fire('Deleted!', 'Your package has been deleted.', 'success');
                        fetchData(); // Fetch the latest data
                    })
                    .catch((error) => {
                        console.error('Fetch error:', error);
                        Swal.fire('Error!', `Could not delete the package: ${error.message}`, 'error');
                        return false; // Return false in case of error
                    })
                    .finally(() => {
                        setIsApiLoading(false); // Set loading state to false after the request completes
                    });
            }
        });
    };




    return (
        <>
            <div className="py-4 px-4">

                <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4">
                    <div className="col">
                        <form action="">
                            <div className="flex gap-5 justify-between">
                                <select name="options" onChange={handleSelectChange} id="" className='outline-none border p-2 ps-2 text-left w-full rounded-md md:w-10/12'>
                                    <option value="10">10 Rows</option>
                                    <option value="20">20 Rows</option>
                                    <option value="50">50 Rows</option>
                                    <option value="200">200 Rows</option>
                                    <option value="300">300 Rows</option>
                                    <option value="400">400 Rows</option>
                                    <option value="500">500 Rows</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div className="col md:flex justify-end ">
                        <form action="">
                            <div className="flex md:items-stretch items-center  gap-3">
                                <input
                                    type="search"
                                    className='outline-none border p-2 text-sm rounded-md w-full my-4 md:my-0'
                                    placeholder='Search by Client Code'
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                        <table className="min-w-full mb-4">
                            <thead>
                                <tr className='bg-green-500'>
                                    <th className="py-2 px-4 border-b border-r text-sm text-white text-left uppercase  whitespace-nowrap">Sl</th>
                                    <th className="py-2 px-4 border-b border-r text-sm text-white text-left uppercase  whitespace-nowrap">Package Name</th>
                                    <th className="py-2 px-4 border-b border-r text-sm text-white text-left uppercase  whitespace-nowrap">Description</th>
                                    <th className="py-2 px-4 border-b border-r text-sm text-white text-left uppercase  whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody>

                                {currentItems.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="py-2 px-4 border-b capitalize border-r text-sm border-l whitespace-nowrap">
                                            {index + 1}
                                        </td>
                                        <td className="py-2 px-4 border-b capitalize border-r text-sm border-l whitespace-nowrap">
                                            {item.title}
                                        </td>
                                        <td className="py-2 px-4 border-b capitalize border-r text-sm whitespace-nowrap">
                                            {item.description}
                                        </td>
                                        <td className="py-2 px-4 border-b capitalize border-r text-sm whitespace-nowrap">
                                            <button
                                                className='bg-green-500 hover:bg-green-200 rounded-md p-2 me-2 text-white'
                                                onClick={() => handleEdit(item)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                disabled={isApiLoading || loading}
                                                className={`rounded-md p-2 text-sm text-white ms-2 ${loading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-200'}`}
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )
                                )}

                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-6">
                            <p>No Data Found</p>
                        </div>
                    )}


                </div>
                <div className="flex items-center justify-end  rounded-md bg-white py-3 md:my-2">
                    <button
                        onClick={showPrev}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-0 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                        className="relative inline-flex items-center rounded-0 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        aria-label="Next page"
                    >
                        <MdArrowForwardIos />
                    </button>
                </div>

            </div>

        </>
    );
};

export default PackageManagementList;