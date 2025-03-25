import React, { createContext, useState, useEffect, useContext } from "react";
import Modal from "react-modal";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useService } from "./ServicesContext";
import { useApiCall } from '../ApiCallContext';
import { useSidebar } from '../Sidebar/SidebarContext.jsx';
import PulseLoader from "react-spinners/PulseLoader";

Modal.setAppElement("#root");

const ServiceReportForm = () => {
    const { handleTabChange } = useSidebar();
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const [clientData, setClientData] = useState([]); // Changed to an array to handle multiple entries
    const [loading, setLoading] = useState(true);
    const [previewData, setPreviewData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // State for current page
    const [itemsPerPage] = useState(10); // Items per page
    const [searchQuery, setSearchQuery] = useState(""); // State for search query
    const navigate = useNavigate();
    const { setSelectedService } = useService();
    // Function to fetch client data
    const fetchClientData = async () => {
        const adminData = JSON.parse(localStorage.getItem("admin"));
        const admin_id = adminData?.id;
        const storedToken = localStorage.getItem("_token");
    
        if (!admin_id || !storedToken) {
            console.error("Admin ID or Token is missing from localStorage");
            return;
        }
    
        const url = `https://api.goldquestglobal.in/json-form/generate-report/list?admin_id=${admin_id}&_token=${storedToken}`;
        setIsApiLoading(true);
    
        try {
            const response = await fetch(url);
        
            if (!response.ok) {
                // Check for invalid token in response message
                const errorMessage = await response.text(); // Get the error message from the response
                if (errorMessage.toLowerCase().includes("invalid token provided")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        // Redirect to the admin login page
                        window.location.href = "/admin-login"; // Replace with your login route
                    });
                    return;
                }
    
                // Show the error message from the API response
                Swal.fire({
                    title: "Error",
                    text: errorMessage || `HTTP error! Status: ${response.status}`,
                    icon: "error",
                    confirmButtonText: "Ok",
                });
    
                throw new Error(`HTTP error! Status: ${response.status} - ${errorMessage}`);
            }
    
            const result = await response.json();
            const newToken = response.token || response._token;
    
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }
            setClientData(result.data); // Set the `data` object in state
        } catch (error) {
            console.error("Error fetching client data:", error);
        } finally {
            setLoading(false);
            setIsApiLoading(false);
        }
    };
    
    useEffect(() => {
        if (!isApiLoading) {
            fetchClientData();
        }
    }, []);
    const handleEdit = (service) => {
        setSelectedService(service);
        handleTabChange('developers')
    };

    // Filter data based on search query
    const filteredData = clientData.filter((service) =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

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


    // Function to handle preview button click
    const handlePreview = (id) => {
        const selectedService = clientData.find((service) => service.id === id);
        const parsedData = JSON.parse(selectedService.json); // Parse JSON string
        setPreviewData(parsedData); // Set to preview state
    };



    return (
        <>

            <div className="p-6 bg-white rounded-md m-6">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by service title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md w-full"
                    />
                </div>
                <div className={`${previewData ? 'hidden' : ''} min-w-full border-collapse border border-black`}>
                    <div className="overflow-x-auto py-6 px-4">
                        {loading ? (
                            <div className='flex justify-center items-center py-6 h-full'>
                                <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
                            </div>
                        ) : currentItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className={`min-w-full border-collapse border border-black`}>
                                    <thead>
                                        <tr className="bg-[#3e76a5] whitespace-nowrap text-white text-left">
                                            <th className="uppercase border border-black px-4 py-2 text-center">SI</th>
                                            <th className="uppercase border border-black px-4 py-2">Service Title</th>
                                            <th className="uppercase border border-black px-4 py-2">Short Code</th>
                                            <th className="uppercase border border-black px-4 py-2">Group Name</th>
                                            <th className="uppercase border border-black px-4 py-2 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((service, index) => (
                                            <tr key={service.id}>
                                                <td className="border border-black px-4 py-2 text-center">{index + 1 + (currentPage - 1) * itemsPerPage}
                                                </td>
                                                <td className="border border-black px-4 py-2 whitespace-nowrap">{service.title}</td>
                                                <td className="border border-black px-4 py-2">{service.short_code}</td>
                                                <td className="border border-black px-4 py-2 whitespace-nowrap">{service.group}</td>
                                                <td className="border border-black px-4 py-2">
                                                    <div className="flex justify-center ">
                                                        <button
                                                            className="ml-2 p-2 px-4 text-[#3e76a5] border border-green-400  rounded-md"
                                                            onClick={() => handleEdit(service)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="ml-2 p-2 px-4 text-white bg-[#3e76a5] hover:bg-[#3e76a5] rounded-md"
                                                            onClick={() => handlePreview(service.id)}
                                                        >
                                                            Preview
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p>No Data Found</p>
                            </div>
                        )}

                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-end rounded-md bg-white  py-3 sm:px-6  mt-2">
                        <button
                            onClick={showPrev}
                            disabled={currentPage === 1}
                            className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                            className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            aria-label="Next page"
                        >
                            <MdArrowForwardIos />
                        </button>
                    </div>
                </div>
                {/* Preview Section */}
                {previewData && (
                    <div className="py-3 mt-6 relative">
                        <button
                            className="ml-2 absolute top-4 right-0 px-10 text-right w-full p-3 font-bold text-white text-3xl border-none rounded-md"
                            onClick={() => setPreviewData(null)}
                        >
                            X
                        </button>
                        <div className="bg-[#3e76a5] rounded-t-md p-4">
                            <h3 className="text-center text-2xl font-semibold text-white">
                                {previewData.heading}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="border-white border border-t-0 rounded-md w-full">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="py-2 px-4 border border-gray-300 text-left">PARTICULARS</th>
                                        {previewData.headers.map((header, index) => (
                                            <th key={index} className="py-2 px-4 border border-gray-300 text-left">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.rows.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            <React.Fragment key={rowIndex}>
                                                <td className="py-2 px-4 border border-gray-300">
                                                    {row.inputs[0]?.label} {/* Assuming the label for the first input */}
                                                </td>
                                                {row.inputs.map((input, inputIndex) => (

                                                    <td className="py-2 px-4 border border-gray-300">
                                                        {input.type === "text" ? (
                                                            <input
                                                                type="text"
                                                                name={input.name}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                readOnly
                                                            />
                                                        ) : input.type === "datepicker" ? (
                                                            <input
                                                                type="date"
                                                                name={input.name}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                readOnly
                                                            />
                                                        ) : input.type === "file" ? (
                                                            <input
                                                                type="file"
                                                                name={input.name}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                readOnly
                                                                multiple={input.multiple || false}
                                                                required={input.required || false}
                                                            />
                                                        ) : input.type === "dropdown" ? (
                                                            <select
                                                                name={input.name}
                                                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                readOnly
                                                            >
                                                                {input.options.map((option, optionIndex) => (
                                                                    <option key={optionIndex} value={option.value}>
                                                                        {option.showText}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : null}
                                                    </td>
                                                ))}
                                            </React.Fragment>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ServiceReportForm;