import React, { useEffect, useState, useCallback } from 'react';
import Multiselect from 'multiselect-react-dropdown';
import { useEditClient } from './ClientEditContext';
import { useApi } from '../ApiContext';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Swal from 'sweetalert2';
const ServiceEditForm = () => {
    const [selectedServices, setSelectedServices] = useState({});
    const [serviceData, setServiceData] = useState([]);
    const [packageList, setPackageList] = useState([]);
    
    const [paginated, setPaginated] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPackages,] = useState({});
    const [priceData, setPriceData] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const { clientData, setClientData,setAdmins } = useEditClient();
    const API_URL = useApi();
    const itemsPerPage = 10;
    const filteredItems = paginated.filter(item => {
        return (
            item.service_title?.toLowerCase().includes(searchTerm.toLowerCase())
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



    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const admin_id = JSON.parse(localStorage.getItem("admin"))?.id || '';
            const storedToken = localStorage.getItem("_token") || '';
            const res = await fetch(`${API_URL}/customer/add-customer-listings?admin_id=${admin_id}&_token=${storedToken}`);
            const result = await res.json();
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
            }

            const admins = result.data.admins || [];
            setAdmins(admins)
            const processedServices = result.data.services.map(item => ({
                ...item,
                service_id: item.id,
                service_title: item.title,
                price: '', // Assuming this is still required
                packages: {} // Assuming this is still required
            }));
            setServiceData(processedServices);

            const processedPackages = result.data.packages.map(item => ({
                ...item,
                service_id: item.id
            }));
            setPackageList(processedPackages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);
    useEffect(() => {
        let prefilledData = [];
        try {
            if (typeof clientData.services === 'string') {
                prefilledData = JSON.parse(clientData.services) || [];
            } else if (Array.isArray(clientData.services)) {
                prefilledData = clientData.services;
            }
        } catch (error) {
            console.error('Error parsing PrefilledData:', error);
        }

        // Ensure prefilledData is an array
        if (!Array.isArray(prefilledData)) {
            prefilledData = [];
        }

        const updatedServiceData = serviceData.map(item => {
            const prefilledService = prefilledData.find(service => service.serviceId === item.service_id) || {};
            return {
                ...item,
                price: prefilledService.price || priceData[item.service_id]?.price || '',
                packages: prefilledService.packages || {},
            };
        });

        setPaginated(updatedServiceData);

        const initialSelectedServices = updatedServiceData.reduce((acc, item) => {
            if (prefilledData.some(service => service.serviceId === item.service_id)) {
                acc[item.service_id] = true;
            }
            return acc;
        }, {});
        setSelectedServices(initialSelectedServices);


        setClientData(prev => ({ ...prev, services: prefilledData }));



    }, [serviceData, clientData.services, priceData,]);


    const handleCheckboxChange = (serviceId) => {

        setSelectedServices((prev) => {
            const isCurrentlySelected = !!prev[serviceId];

            const updatedSelection = {
                ...prev,
                [serviceId]: !isCurrentlySelected,
            };



            const updatedServices = paginated.map(service => {
                let packages = selectedPackages[service.service_id] || service.packages || {};

                if (Array.isArray(packages)) {
                    packages = Object.fromEntries(
                        packages.map(pkgId => {
                            const pkg = packageList.find(p => p.id === pkgId);
                            return [pkgId.toString(), pkg ? pkg.title : pkgId];
                        })
                    );
                }

                if (updatedSelection[service.service_id]) {

                    return {
                        serviceId: service.service_id,
                        serviceTitle: service.service_title,
                        price: priceData[service.service_id]?.price || service.price || '',
                        packages,
                    };
                } else {

                    return {
                        serviceId: service.service_id,
                        serviceTitle: service.service_title,
                        price: '',
                        packages: {},
                    };
                }
            });


            const filteredServices = updatedServices.filter(service => updatedSelection[service.serviceId]);



            setClientData(prev => ({ ...prev, services: filteredServices }));


            // const serviceDetails = paginated.find(service => service.service_id === serviceId);
            // if (serviceDetails) {
            //     const details = `
            //         Service ID: ${serviceDetails.service_id}
            //         Service Name: ${serviceDetails.service_title}
            //         Price: ${priceData[serviceId]?.price || serviceDetails.price || ''}
            //         Packages: ${JSON.stringify(isCurrentlySelected ? selectedPackages[serviceId] || {} : {})}
            //     `;

            // }

            return updatedSelection;
        });
    };


    function updateServicePackages(obj, serviceID, serviceList) {
        // Iterate over the services to find the matching serviceId
        let serviceFound = false;

        for (let service of obj.services) {
            if (service.serviceId === serviceID) {
                // Convert serviceList into key-value pairs where id is the key and name is the value
                let newPackages = {};
                serviceList.forEach((item) => {
                    newPackages[item.id] = item.name;
                });

                // Update the service packages
                service.packages = {
                    ...service.packages, // Retain existing packages
                    ...newPackages      // Merge new packages
                };
                serviceFound = true;
                break; // Exit loop once service is found and updated
            }
        }

      

        return obj;
    }



    const handlePackageChange = (selectedList, serviceId) => {
        let updatedObj = updateServicePackages(clientData, serviceId, selectedList);
        setClientData(updatedObj);
    };


    const handleChange = (e, serviceId) => {
        const { name, value } = e.target;

        setPriceData(prev => ({ ...prev, [serviceId]: { [name]: value } }));

        setClientData(prev => {

            const updatedServices = (Array.isArray(prev.services) ? prev.services : []).map(service => {
                if (service.serviceId === serviceId) {
                    return { ...service, price: value };
                }
                return service;
            });

            return { ...prev, services: updatedServices };
        });
    };


    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <>
            <div className="col  mb-4">
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
            <div className="overflow-x-auto py-6 px-0 bg-white md:mt-4 m-auto">

                <table className="min-w-full">
                    <thead>
                        <tr className='bg-[#3e76a5]'>
                            <th className="py-2 md:py-3 px-4 text-sm text-white border-r border-b text-left uppercase whitespace-nowrap">Service Name</th>
                            <th className="py-2 md:py-3 px-4 text-sm text-white border-r border-b text-left uppercase whitespace-nowrap">Price</th>
                            <th className="py-2 md:py-3 px-4 text-sm text-white border-r border-b text-left uppercase whitespace-nowrap">Select Package</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((item) => (
                            <tr key={item.service_id}>
                                <td className="py-2 md:py-3 text-sm px-4 border-l border-r border-b whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        className='me-2'
                                        checked={!!selectedServices[item.service_id]} // Ensure this is derived directly from state
                                        onChange={() => handleCheckboxChange(item.service_id)}
                                    />
                                    {item.service_title}
                                </td>
                                <td className="py-2 md:py-3 px-4 border-r border-b whitespace-nowrap">
                                    <input
                                        type="number"
                                        name="price"
                                        value={item.price}
                                        onChange={(e) => handleChange(e, item.service_id)}
                                        className='outline-none'
                                    />
                                </td>
                                <td className="py-2 md:py-3 px-4 border-r border-b whitespace-nowrap uppercase text-left">
                                    <Multiselect
                                        options={packageList.map(pkg => ({ name: pkg.title, id: pkg.id }))}
                                        selectedValues={Object.entries(item.packages).map(([id, name]) => ({ name, id }))}
                                        onSelect={(selectedList) => handlePackageChange(selectedList, item.service_id)}
                                        onRemove={(selectedList) => handlePackageChange(selectedList, item.service_id)}
                                        displayValue="name"
                                        className='text-left text-sm'
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-end  rounded-md bg-white px-4 py-3 sm:px-6 md:m-4 mt-2">
                <button
                    type="button"
                    onClick={showPrev}
                    disabled={currentPage === 1}
                    className="inline-flex items-center rounded-0 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    aria-label="Previous page"
                >
                    <MdArrowBackIosNew />
                </button>
                <div className="flex items-center">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            type="button"
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            className={` px-3 py-1 rounded-0 ${currentPage === index + 1 ? 'bg-[#3e76a5] text-white' : 'bg-[#3e76a5] text-black border'}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
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

export default ServiceEditForm;