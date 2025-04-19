import React, { useEffect, useState, useContext, useCallback } from 'react';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Multiselect from 'multiselect-react-dropdown';
import { useClient } from './ClientManagementContext';
import { useApi } from '../ApiContext';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';

const ClientManagementData = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const [selectedServices, setSelectedServices] = useState({});
    const [, setSelectedData] = useState([]);
    const API_URL = useApi();
    const { setClientData, validationsErrors, setValidationsErrors, setAdmins } = useClient();
    const [service, setService] = useState([]);
    const [packageList, setPackageList] = useState([]);
    const [paginated, setPaginated] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedPackages, setSelectedPackages] = useState({});
    const [priceData, setPriceData] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const itemsPerPage = 10;
    const filteredItems = paginated.filter(item => {
        return (
            item.serviceTitle?.toLowerCase().includes(searchTerm.toLowerCase())
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

    const fetchServicesAndPackages = useCallback(async () => {
        setLoading(true);
        setIsApiLoading(true);
        setError(null);

        try {
            const admin_id = JSON.parse(localStorage.getItem("admin"))?.id || '';
            const storedToken = localStorage.getItem("_token") || '';

            if (!admin_id || !storedToken) {
                Swal.fire('Error!', 'Admin ID or token is missing.', 'error');
                return;
            }

            // Making the request directly without confirmation prompt
            const res = await fetch(`${API_URL}/customer/add-customer-listings?admin_id=${admin_id}&_token=${storedToken}`);
            const result = await res.json();

            const newToken = result._token || result.token; // Adjust depending on the actual structure
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (!res.ok) {
                const errorResponse = result; // Use the parsed JSON result here
                if (errorResponse.message && errorResponse.message.toLowerCase().includes("invalid") && errorResponse.message.toLowerCase().includes("token")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        setTimeout(() => {
                            window.location.href = "/admin-login"; // Redirect to the login page
                        }, 100);
                    });
                    return; // Exit early after redirect
                }
                const errorMessage = errorResponse.message || `Network response was not ok: ${res.status}`;
                throw new Error(errorMessage);
            }

            // Process the services and packages
            if (!result || !result.data || !Array.isArray(result.data.services)) {
                throw new Error('Invalid response format: Missing or invalid services data');
            }

            const admins = result.data.admins || [];
            setAdmins(admins);

            const processedServices = result.data.services.map(item => ({
                ...item,
                service_id: item.id,
                service_title: item.title,
                price: '', // Assuming this is still required
                selectedPackages: [] // Assuming this is still required
            }));
            setService(processedServices);

            if (!Array.isArray(result.data.packages)) {
                throw new Error('Invalid response format: Missing or invalid packages data');
            }

            const processedPackages = result.data.packages.map(item => ({
                ...item,
                service_id: item.id
            }));
            setPackageList(processedPackages);

        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire({
                title: 'Error!',
                text: error.message, // Display the error message from the catch block
                icon: 'error',
                confirmButtonText: 'Ok'
            });

            setError(error.message); // Set the error state with the message
        } finally {
            setLoading(false);
            setIsApiLoading(false);
        }
    }, [API_URL]);





    useEffect(() => {
        if (!isApiLoading) {
            fetchServicesAndPackages();
        }

    }, [fetchServicesAndPackages]);

    const validateServices = () => {
        const errors = {};
        service.forEach((item) => {
            const selectedPackageCount = (selectedPackages[item.service_id] || []).length;
            const enteredPrice = priceData[item.service_id]?.price;

            if (selectedPackageCount > 0 && !enteredPrice) {
                errors[item.service_id] = { price: 'Please enter a price if a package is selected' };
            } else if (enteredPrice && selectedPackageCount === 0) {
                errors[item.service_id] = { packages: 'Please select at least one package if a price is entered' };
            }
        });
        setValidationsErrors(errors);
        return Object.keys(errors).length === 0;
    };

    useEffect(() => {
        const updatedServiceData = service.map((item) => {
            const packageObject = (selectedPackages[item.service_id] || []).reduce((acc, pkgId) => {
                const pkg = packageList.find(p => p.id === pkgId);
                if (pkg) {
                    acc[pkg.id] = pkg.title;
                }
                return acc;
            }, {});

            return {
                serviceId: item.service_id,
                serviceTitle: item.service_title,
                price: priceData[item.service_id]?.price || '',
                packages: packageObject,
            };
        });
        const filteredSelectedData = updatedServiceData.filter(item => selectedServices[item.serviceId]);

        setClientData(filteredSelectedData);
        setSelectedData(updatedServiceData);

        if (validateServices()) {
            setPaginated(updatedServiceData);
        }
    }, [service, selectedPackages, priceData, selectedServices, setClientData, packageList]);

    const handlePackageChange = (selectedList, serviceId) => {
        const updatedPackages = selectedList.map(item => item.id);
        setSelectedPackages(prev => ({
            ...prev,
            [serviceId]: updatedPackages,
        }));
    };

    const handleChange = (e, serviceId) => {
        const { name, value } = e.target;
        setPriceData(prev => ({
            ...prev,
            [serviceId]: { [name]: value }
        }));
    };

    const handleCheckboxChange = (serviceId) => {
        setSelectedServices(prev => ({
            ...prev,
            [serviceId]: !prev[serviceId]
        }));
    };

    return (
        <>
            <div className="col mb-4">
                <form action="">
                    <div className="flex md:items-stretch items-center gap-3">
                        <input
                            type="search"
                            className='outline-none border-2 p-2 rounded-md w-full my-4 md:my-0'
                            placeholder='Search by Service Name'
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </form>
            </div>


            <div className="overflow-x-auto md:py-6 p-3 px-0 bg-white md:mt-4 m-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <PulseLoader color={"#36D7B7"} loading={loading} size={15} aria-label="Loading Spinner" />
                    </div>
                ) : (
                    <>
                        {paginated.length === 0 ? (
                            <p className="text-center py-4">No data available</p>
                        ) : (
                            <>

                                <table className="min-w-full">
                                    <thead>
                                        <tr className='bg-[#3e76a5]'>
                                            <th className="py-2 text-sm px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Service Name</th>
                                            <th className="py-2 text-sm px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Price</th>
                                            <th className="py-2 text-sm px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Select Package</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((item) => (
                                            <tr key={item.serviceId}>
                                                <td className="py-2 text-sm px-4 border-l border-r border-b whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className='me-2'
                                                        checked={!!selectedServices[item.serviceId]}
                                                        onChange={() => handleCheckboxChange(item.serviceId)}
                                                    /> {item.serviceTitle}
                                                </td>
                                                <td className="py-2 text-sm px-4 border-r border-b whitespace-nowrap">
                                                    <input
                                                        type="number"
                                                        name="price"
                                                        value={priceData[item.serviceId]?.price || ''}
                                                        onChange={(e) => handleChange(e, item.serviceId)}
                                                        className='outline-none'
                                                    />
                                                    {validationsErrors[item.serviceId]?.price && <span className="text-red-500 capitalize">{validationsErrors[item.serviceId].price}</span>}
                                                </td>
                                                <td className="py-2 text-sm px-4 border-r border-b whitespace-nowrap uppercase text-left">
                                                    <Multiselect
                                                        options={packageList.map(pkg => ({ name: pkg.title, id: pkg.id }))}
                                                        selectedValues={packageList.filter(pkg => (selectedPackages[item.serviceId] || []).includes(pkg.id)).map(pkg => ({ name: pkg.title, id: pkg.id }))}
                                                        onSelect={(selectedList) => handlePackageChange(selectedList, item.serviceId)}
                                                        onRemove={(selectedList) => handlePackageChange(selectedList, item.serviceId)}
                                                        displayValue="name"
                                                        className='text-left'
                                                    />
                                                    {validationsErrors[item.serviceId]?.packages && <span className="text-red-500 capitalize">{validationsErrors[item.serviceId].packages}</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            </>
                        )}
                    </>
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
        </>
    );
};

export default ClientManagementData;
