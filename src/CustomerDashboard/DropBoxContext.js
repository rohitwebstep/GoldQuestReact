import React, { createContext, useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import { useApiCall } from '../ApiCallContext';

const DropBoxContext = createContext();

export const DropBoxProvider = ({ children }) => {
    const { setIsBranchApiLoading } = useApiCall();

    const [inputError, setInputError] = useState({});
    const API_URL = useApi();
    const [services, setServices] = useState([]);
    const [UniqueBgv, setUniqueBgv] = useState([]);
    const [uniquePackages, setUniquePackages] = useState([]);
    const [listData, setListData] = useState([]);
    const [candidateListData, setCandidateListData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [token, setToken] = useState(null);
    const [isEditClient, setIsEditClient] = useState(false);
    const [isEditCandidate, setIsEditCandidate] = useState(false);
    const [clientInput, setClientInput] = useState({
        name: '',
        employee_id: '',
        spoc: '',
        location: '',
        batch_number: '',
        sub_client: '',
        services: [],
        package: [],
        client_application_id: '',
        purpose_of_application: "",
        customPurpose: "",
        nationality: "",
    });
    const [input, setInput] = useState({
        name: "",
        employee_id: "",
        mobile_number: "",
        email: "",
        nationality: "",
        purpose_of_application: "",
        services: [],
        package: [],
        candidate_application_id: '',
        customPurpose: ""
    });


    const handleEditDrop = (selectedDropBox) => {
        console.log('selectedDropBox',selectedDropBox)
        setInputError({});
        const parsedServices = Array.isArray(selectedDropBox.services)
            ? selectedDropBox.services
            : selectedDropBox.services ? selectedDropBox.services.split(',') : [];

        setClientInput({
            name: selectedDropBox.name || "",
            employee_id: selectedDropBox.employee_id || "",
            spoc: selectedDropBox.single_point_of_contact || "",
            location: selectedDropBox.location || "",
            batch_number: selectedDropBox.batch_number || "",
            sub_client: selectedDropBox.sub_client || "",
            services: parsedServices, // Make sure services is always an array
            package: selectedDropBox.package || [],
            client_application_id: selectedDropBox.id || "",
            nationality: selectedDropBox.nationality || "",
        });
        setIsEditClient(true);

    }
    const handleEditCandidate = (selectedCandidate) => {

        if (selectedCandidate) {
            const parsedServices = Array.isArray(selectedCandidate.services)
                ? selectedCandidate.services
                : selectedCandidate.services ? selectedCandidate.services.split(',') : [];

            setInput({
                name: selectedCandidate.name,
                employee_id: selectedCandidate.employee_id,
                mobile_number: selectedCandidate.mobile_number,
                email: selectedCandidate.email,
                services: parsedServices,
                package: selectedCandidate.packages || [],
                candidate_application_id: selectedCandidate.id || '',
                nationality: selectedCandidate.nationality || "",
                purpose_of_application: selectedCandidate.purpose_of_application || "",
            });
            setIsEditCandidate(true);
        } else {
            setInput({
                name: "",
                employee_id: "",
                mobile_number: "",
                email: "",
                services: [],
                package: [],
                candidate_application_id: "",
                nationality: "",
                purpose_of_application: "",
            });
            setIsEditClient(false);
        }
    };

    const fetchServices = useCallback(async () => {
        setIsBranchApiLoading(true);
        setServicesLoading(true);
        const branchData = JSON.parse(localStorage.getItem("branch")) || {};
        const branch_id = branchData?.id;
        const customer_id = branchData?.customer_id;
        const branchEmail = branchData?.email; // Ensure you extract email for session expiration redirection
        const _token = localStorage.getItem("branch_token");

        if (!branch_id || !_token) {
            console.error("Branch ID or token is missing.");
            setServicesLoading(false);
            setIsBranchApiLoading(false);
            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;

            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/branch/customer-info?customer_id=${customer_id}&branch_id=${branch_id}&branch_token=${_token}`,
                {
                    method: "GET",
                    redirect: "follow",
                }
            );

            const data = await response.json();

            // Store the new token if it exists
            const newToken = data?._token || data?.token;
            if (newToken) {
                localStorage.setItem("branch_token", newToken);
                setToken(newToken);
            }

            if (!response.ok || (data.message && data.message.toLowerCase().includes("invalid token"))) {
                Swal.fire({
                    title: "Session Expired",
                    text: "Your session has expired. Please log in again.",
                    icon: "warning",
                    confirmButtonText: "Ok",
                }).then(() => {
                    // Redirect to customer login page
                    if (branchEmail) {
                        window.open(`/customer-login?email=${encodeURIComponent(branchEmail)}`, "_blank");
                    } else {
                        window.open("/customer-login", "_blank");
                    }
                });
                return;
            }

            if (data.customers) {
                const customer = data.customers;
                const customer_code = customer.client_unique_id;
                localStorage.setItem("customer_code", customer_code);

                const parsedServices =
                    customer.services && customer.services !== '""'
                        ? JSON.parse(customer.services)
                        : [];
                setServices(parsedServices);

                const uniquePackagesList = [];
                const packageSet = new Set();

                parsedServices.forEach((service) => {
                    if (service.packages) {
                        Object.keys(service.packages).forEach((packageId) => {
                            if (!packageSet.has(packageId)) {
                                packageSet.add(packageId);
                                uniquePackagesList.push({
                                    id: packageId,
                                    name: service.packages[packageId],
                                });
                            }
                        });
                    }
                });

                setUniquePackages(uniquePackagesList);
            } else {
                Swal.fire("Error!", `An error occurred: ${data.message}`, "error");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            Swal.fire("Error!", "An unexpected error occurred.", "error");
        } finally {
            setServicesLoading(false);
            setIsBranchApiLoading(false);
        }
    }, [API_URL]);

    const fetchClient = useCallback(async () => {
        const branchData = JSON.parse(localStorage.getItem("branch")) || {};
        const branchEmail = branchData?.email;
        setIsBranchApiLoading(true);
        setCandidateLoading(true);
        const branchId = JSON.parse(localStorage.getItem("branch"))?.branch_id;
        const customerId = JSON.parse(localStorage.getItem("branch"))?.customer_id;
        const token = localStorage.getItem("branch_token");

        if (!branchId || !token) {
            setCandidateLoading(false);
            setIsBranchApiLoading(false);
            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;

            return;
        }
        const payLoad = {
            branch_id: branchId,
            _token: token,
            customer_id: customerId,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
        };

        // Zet het object om naar een query string
        const queryString = new URLSearchParams(payLoad).toString();

        try {
            const response = await fetch(`${API_URL}/branch/candidate-application/list?${queryString}`, {
                method: "GET",
                redirect: "follow"
            });

            const result = await response.json();

            // Update token if it's present in the response
            const newToken = result?._token || result?.token;
            if (newToken) {
                localStorage.setItem("branch_token", newToken);
                setToken(newToken);
            }

            // Check if the session has expired (invalid token)
            if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                Swal.fire({
                    title: "Session Expired",
                    text: "Your session has expired. Please log in again.",
                    icon: "warning",
                    confirmButtonText: "Ok",
                }).then(() => {
                    // Redirect to customer login page in the current tab
                    window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
                });
                return;  // Exit the function after redirection
            }

            // Handle unsuccessful response (non-OK response)
            if (!response.ok) {
                const errorMessage = result?.message || 'Something went wrong. Please try again later.';
                Swal.fire({
                    title: 'Error!',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
                return;  // Exit the function if the response is not OK
            }

            // Set data on success
            setCandidateListData(result.data?.candidateApplications || []);
            if (result.data?.customerInfo) {
                const customer = result.data.customerInfo;
                const customerCode = customer.client_unique_id;
                localStorage.setItem('customer_code', customerCode);
                const services = customer.services && customer.services !== '""' ? JSON.parse(customer.services) : [];
                setServices(services);

                const uniquePackages = [];
                const packageSet = new Set();
                services.forEach(service => {
                    if (service.packages) {
                        Object.keys(service.packages).forEach(packageId => {
                            if (!packageSet.has(packageId)) {
                                packageSet.add(packageId);
                                uniquePackages.push({ id: packageId, name: service.packages[packageId] });
                            }
                        });
                    }
                });

                const candidateApplications = result.data?.candidateApplications

                const uniqueCefSubmitted = [...new Set(candidateApplications.map(application => application.cef_submitted))]
                    .map(cef_submitted => ({ cef_submitted }));
                setUniqueBgv(uniqueCefSubmitted);


                setUniquePackages(uniquePackages);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
        } finally {
            setCandidateLoading(false);
            setIsBranchApiLoading(false);
        }
    }, [API_URL, setCandidateLoading, setToken, setCandidateListData, setServices, setUniquePackages]);



    const fetchClientDrop = useCallback(async () => {
        setIsBranchApiLoading(true);
        setLoading(true);
        const branchData = JSON.parse(localStorage.getItem("branch")) || {};
        const branchEmail = branchData?.email;
        const branch_id = JSON.parse(localStorage.getItem("branch"))?.branch_id;
        const customer_id = JSON.parse(localStorage.getItem("branch"))?.customer_id;
        const _token = localStorage.getItem("branch_token");

        if (!branch_id || !_token) {
            setLoading(false);
            setIsBranchApiLoading(false);
            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;

            return;
        }

        const payLoad = {
            branch_id: branch_id,
            _token: _token,
            customer_id: customer_id,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
        };

        // Zet het object om naar een query string
        const queryString = new URLSearchParams(payLoad).toString();


        try {
            const response = await fetch(`${API_URL}/branch/client-application/list?${queryString}`, {
                method: "GET",
                redirect: "follow"
            });

            const result = await response.json();
            const newToken = result?._token || result?.branch_token;

            if (newToken) {
                localStorage.setItem("branch_token", newToken);
                setToken(newToken);
            }

            // Handle session expiration
            if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                Swal.fire({
                    title: "Session Expired",
                    text: "Your session has expired. Please log in again.",
                    icon: "warning",
                    confirmButtonText: "Ok",
                }).then(() => {
                    // Redirect to customer login page with email parameter if session expired
                    window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
                });
                return; // Stop further processing after session expiration
            }

            if (!response.ok) {
                const errorMessage = result?.message || 'Something went wrong. Please try again.';
                Swal.fire({
                    title: 'Error!',
                    text: errorMessage,
                    icon: 'error',
                    showCancelButton: false,
                    confirmButtonText: 'OK',
                });
                return;
            }

            // Process and set data if response is successful
            const FinalData = result.data.clientApplications;
            setListData(FinalData || []);
            if (result.data.customerInfo) {
                const customer = result.data.customerInfo;
                const customer_code = customer.client_unique_id;
                localStorage.setItem('customer_code', customer_code);

                const parsedServices = customer.services && customer.services !== '""' ? JSON.parse(customer.services) : [];
                setServices(parsedServices);

                const uniquePackagesList = [];
                const packageSet = new Set();
                parsedServices.forEach(service => {
                    if (service.packages) {
                        Object.keys(service.packages).forEach(packageId => {
                            if (!packageSet.has(packageId)) {
                                packageSet.add(packageId);
                                uniquePackagesList.push({ id: packageId, name: service.packages[packageId] });
                            }
                        });
                    }
                });
                setUniquePackages(uniquePackagesList);
            }

        } catch (error) {
            console.error('Fetch error:', error);
            Swal.fire('Error!', 'An unexpected error occurred. Please try again later.', 'error');
        } finally {
            setLoading(false);
            setIsBranchApiLoading(false);
        }
    }, [API_URL]);


    return (
        <DropBoxContext.Provider value={{
            services,
            setClientInput,
            fetchClient,
            fetchClientDrop,
            uniquePackages,
            handleEditDrop,
            handleEditCandidate,
            setServices,
            listData,
            setUniqueBgv,
            UniqueBgv,
            setListData,
            setUniquePackages,
            fetchServices,
            candidateLoading,
            loading,
            clientInput,
            servicesLoading,
            candidateListData,
            isEditClient, setIsEditClient, input, setInput, isEditCandidate, setIsEditCandidate, inputError, setInputError
        }}>
            {children}
        </DropBoxContext.Provider>
    );
};

export default DropBoxContext;
