import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useApiCall } from '../ApiCallContext';
import Select from 'react-select';
import { useApi } from "../ApiContext";
const PermissionManager = () => {
    const [fetchServiceIds, setFetchServiceIds] = useState([]);
    const { setIsApiLoading, isApiLoading } = useApiCall();
    const API_URL = useApi();

    const [services, setServices] = useState([]);
    const [roles, setRoles] = useState([]);
    const [mainJson, setMainJson] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jsonPermissions, setJsonPermissions] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditable, setIsEditable] = useState(false);
    const [modalPermissionsContent, setModalPermissionsContent] = useState(false);
    const [modalRole, setModalRole] = useState(false);
    const navigate = useNavigate();
    const modalRef = useRef(null);
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");
    const [selectedServices, setSelectedServices] = useState([]); // To hold the selected services as an array
    const [selectedServiceIds, setSelectedServiceIds] = useState(''); // To hold the selected service IDs as a comma-separated string
    const fetchPermissionList = useCallback(async () => {
        setLoading(true);  // Start loading
        setIsApiLoading(true);  // Start API loading

        // Retrieve admin_id and storedToken from local storage
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            Swal.fire({
                icon: "warning",
                title: "Missing Information",
                text: "Admin ID or storedToken is missing. Please log in again.",
            });
            setLoading(false);  // Stop loading
            setIsApiLoading(false);  // Stop API loading
            return;  // Exit early
        }

        try {
            const response = await fetch(
                `${API_URL}/admin/permission/list?admin_id=${admin_id}&_token=${storedToken}`,
                { method: "GET", redirect: "follow" }
            );

            // Check if the response was successful
            if (!response.ok) {
                return response.json().then(result => {
                    const newToken = result._token || result.token;
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }
                    // Check for session expiry (invalid token)
                    if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                        // Handle session expiry (expired token)
                        Swal.fire({
                            title: "Session Expired",
                            text: "Your session has expired. Please log in again.",
                            icon: "warning",
                            confirmButtonText: "Ok",
                        }).then(() => {
                            // Redirect to login page after the alert
                            window.location.href = "/admin-login"; // Replace with your login route
                        });
                        return; // Stop further execution if session has expired
                    }

                    // Handle new token if available


                    // Handle other errors if response is not OK
                    if (!response.ok) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: result.message || 'Failed to load data',
                        });
                    }

                    return result;
                });
            }

            const data = await response.json();


            const newToken = data.token || data._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            // Ensure data has roles before setting state
            const mainJson = data.roles || [];
            if (mainJson.length > 0) {
                setMainJson(mainJson);
                setRoles(mainJson);
            } else {
                setRoles([]);  // Set roles to an empty array if no roles are returned
            }

        } catch (error) {

        } finally {
            setLoading(false);  // End loading
            setIsApiLoading(false);  // End API loading
        }
    }, [admin_id, storedToken]);


    const fecthPreselectServices = () => {
        if (fetchServiceIds && fetchServiceIds.length > 0) {
            const preselectedServices = services.filter(service =>
                fetchServiceIds.includes(service.id.toString()) // Assuming fetchServiceIds are strings
            ).map(service => ({
                value: service.id,
                label: service.title,
            }));

            // Set the preselected services
            setSelectedServices(preselectedServices);
        }
    }

    const handleCheckboxChange = (category) => {
        setJsonPermissions(prevState => {
            const updatedPermissions = { ...prevState, [category]: !prevState[category] };
            return updatedPermissions;
        });
    };
    const renderPermissions = () => {
        try {
            // Convert mainJson permissions to an array of categories

            return (
                <table className="border-collapse border border-black w-full">
                    <thead>
                        <tr className="bg-gray-200 ">
                            <th className="border border-black text-white px-4 py-2 bg-[#3e76a5] text-start">Permission</th>
                            <th className="border border-black text-white px-4 py-2 bg-[#3e76a5] text-center">Enabled</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(jsonPermissions).map((key) => (
                            <tr key={key}>
                                <td className="border border-black px-4 py-2 capitalize">
                                    {key.replace(/_/g, " ")}
                                </td>
                                <td className="border border-black px-4 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        disabled={!isEditable}
                                        checked={jsonPermissions[key] || false}
                                        onChange={() => handleCheckboxChange(key)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            );
        } catch (error) {
            console.error("Error parsing permissions:", error.message);
            return (
                <div className="text-center text-red-500">
                    Invalid Permissions Data
                </div>
            );
        }
    };


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                closeModal(); // Close the modal if click is outside

            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const openModal = (role, isEditable = false) => {
        const jsonObj = JSON.parse(role.json);

        setJsonPermissions(jsonObj);
        setIsEditable(isEditable);
        const permissionsContent = renderPermissions(); // Get rendered permissions as JSX
        setModalPermissionsContent(permissionsContent);
        setModalRole(role);
        if (modalOpen) {
            setModalOpen(false);
        } else {
            setModalOpen(true);
        }
    };

    // Function to handle closing the modal
    const closeModal = () => {
        setModalOpen(false);
        setJsonPermissions(null);
        setModalPermissionsContent(null);
        setModalRole(null);
        setIsEditable(false);
    };


    const formatRole = (role) => {
        return role
            .replace(/[^a-zA-Z0-9\s]/g, " ") // Replace special characters with spaces
            .split(" ") // Split into words
            .filter(Boolean) // Remove empty strings from the array
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
            .join(" "); // Join words with spaces
    };
    const handleServiceChange = (selectedOptions) => {
        setSelectedServices(selectedOptions);
        const serviceIds = selectedOptions.map(option => option.value).join(',');
        setSelectedServiceIds(serviceIds);
    };
    const handleUpdate = async (selectedServices) => {
        try {
            const updatePermissionJson = jsonPermissions;
            const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
            const storedToken = localStorage.getItem("_token");

            if (!admin_id || !storedToken) {
                Swal.fire({
                    icon: "warning",
                    title: "Missing Information",
                    text: "Admin ID or storedToken is missing. Please log in again.",
                });
                return;
            }

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            // Prepare base payload
            const payload = {
                id: modalRole?.id,
                permission_json: updatePermissionJson,
                admin_id: admin_id,
                _token: storedToken,
            };

            // Conditionally add service_ids if the role is 'team_management'
            if (modalRole?.role === 'team_management') {
                const selectedServiceIds = selectedServices
                    ? selectedServices.map((service) => service.value).join(",")
                    : "";
                payload.service_ids = selectedServiceIds; // Add service_ids to payload
            }

            const raw = JSON.stringify(payload);

            const requestOptions = {
                method: "PUT",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };

            const response = await fetch(`${API_URL}/admin/permission/update`, requestOptions);

            const data = await response.json();

            // Check for invalid token response before proceeding
            if (data?.message && data.message.toLowerCase().includes("invalid token")) {
                Swal.fire({
                    title: "Session Expired",
                    text: "Your session has expired. Please log in again.",
                    icon: "warning",
                    confirmButtonText: "Ok",
                }).then(() => {
                    window.location.href = "/admin-login";  // Redirect to login page
                });
                return;
            }

            // If the response isn't okay, throw an error
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            // Update the storedToken if a new one is provided
            const newToken = data.token || data._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            // Handle success or failure of the update
            if (data.status) {
                Swal.fire({
                    icon: "success",
                    title: "Permissions Updated",
                    text: data.message,
                });
                fetchPermissionList();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Update Failed",
                    text: data.message || "An unknown error occurred during the update.",
                });
            }

            // Reset states and close modal
            fecthPreselectServices();
            setModalOpen(false);
            setJsonPermissions(null);
            setModalPermissionsContent(null);
            setModalRole(null);
            setIsEditable(false);
        } catch (error) {
            // Handle any errors caught during the process
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: `An error occurred while updating permissions: ${error.message}`,
            });

            console.error("Error updating permissions:", error);
        }
    };



    useEffect(() => {
        if (!isApiLoading) {
            fetchPermissionList();
        }
    }, [fetchPermissionList])

    // Execute the sequence]);
    return (
        <>
            <h2 className='md:text-4xl text-2xl font-bold py-5 pb-8 md:pb-4 text-center'>Permission Manager</h2>
            <div className="w-full  overflow-hidden">
                <div className="space-y-4 py-8 md:px-12 px-6 bg-white">

                    <div className="overflow-scroll">
                        <table className="min-w-full border-collapse border border-black">
                            <thead className="bg-[#3e76a5] text-white">
                                <td className="border border-black px-4 py-2 text-center">SI</td>
                                <td
                                    className="border uppercase border-black px-4 py-2 text-center"
                                >
                                    Title
                                </td>
                                <td className="border border-black uppercase px-4 py-2 text-center">Permission</td>
                                <td className="border border-black uppercase  px-4 py-2 text-center">Action</td>
                            </thead>
                            {loading ? (
                                <tbody className="h-10">
                                    <tr className="">
                                        <td colSpan="4" className="w-full py-10 h-10  text-center">
                                            <div className="flex justify-center  items-center w-full h-full">
                                                <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            ) : (
                                <tbody>

                                    {
                                        roles.length > 0 ? (
                                            roles.map((role, index) => (
                                                <React.Fragment key={role.role}>
                                                    {/* Title Row for the Role */}
                                                    <tr className="">
                                                        <td className="border border-black px-4 py-2 text-center">{index + 1}</td>
                                                        <td className="border border-black px-4 py-2 text-center">{formatRole(role.role)}</td>
                                                        <td className="border border-black px-4 py-2 text-center">
                                                            <button
                                                                className="bg-blue-500 hover:scale-105 text-white  hover:bg-blue-600 px-4 py-2 rounded"
                                                                onClick={() => openModal(role, false)}
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                        <td className="text-center border border-black px-4 py-2">
                                                            <button className="bg-[#3e76a5] hover:scale-105 text-white rounded px-4 py-2 hover:bg-[#3e76a5] ml-2"
                                                                onClick={() => openModal(role, true)}>
                                                                Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="border px-4 py-2 text-center">
                                                    No roles found.
                                                </td>
                                            </tr>
                                        )
                                    }

                                </tbody>
                            )}
                        </table>
                    </div>


                </div>
                {modalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex z-999 justify-center m-auto items-center z-50">
                        <div className="bg-white p-6 rounded shadow-lg md:w-2/4 h-3/4  overflow-x-auto" ref={modalRef}>
                            {/* Modal Content */}
                            <h2 className="text-2xl mb-4 text-center font-bold">
                                {modalRole?.role ? formatRole(modalRole.role) : 'N/A'}
                            </h2>
                            <div className="mt-4 text-start">{renderPermissions(jsonPermissions)}</div>

                            {/* Advanced multi-select for services */}
                            {services.length > 0 && modalRole?.role === 'team_management' && (
                                <div className="mt-4">
                                    <label className="block text-lg font-medium mb-2">Select Services</label>
                                    <Select
                                        isMulti
                                        name="services"
                                        options={services.map((service) => ({
                                            value: service.id,
                                            label: service.title,
                                        }))}
                                        value={selectedServices}
                                        onChange={handleServiceChange}
                                        className="react-select-container "
                                        classNamePrefix="react-select"
                                        placeholder="Select Services"
                                        isDisabled={!isEditable}
                                        getOptionLabel={(e) => (
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedServices.some((service) => service.value === e.value)}
                                                    readOnly
                                                    className="mr-2"
                                                />
                                                {e.label}
                                            </div>
                                        )}
                                    />
                                </div>
                            )}
                            {modalRole?.role === 'view' && selectedServiceIds && (
                                <div className="mt-4">
                                    <p><strong>Selected Services:</strong> {selectedServiceIds.split(',').join(', ')}</p>
                                </div>
                            )}
                            <div className="mt-4">
                                <button
                                    className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                                    onClick={closeModal}
                                >
                                    Close
                                </button>
                                {isEditable && modalRole?.role !== 'view' && (
                                    <button
                                        className="bg-[#3e76a5] text-white px-4 py-2 rounded"
                                        onClick={() => handleUpdate(selectedServices)} // Pass selectedServices to handleUpdate
                                    >
                                        Save Changes
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}



            </div ></>

    )
};

export default PermissionManager;