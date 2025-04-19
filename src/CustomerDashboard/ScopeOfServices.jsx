import { React, useCallback, useEffect, useState } from 'react';
import { useApi } from '../ApiContext';
import PulseLoader from 'react-spinners/PulseLoader';
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';

const ScopeOfServices = () => {
    const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;
    const { isBranchApiLoading, setIsBranchApiLoading,checkBranchAuthentication } = useApiCall();

    const storedBranchData = JSON.parse(localStorage.getItem("branch"));
    const branch_token = localStorage.getItem("branch_token");
    const API_URL = useApi();
    const branch = storedBranchData;
    const customer_id = storedBranchData?.customer_id;
    const [services, setServices] = useState([]);
    const [customer, setCustomer] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const color = "#36A2EB"; // Define loader color

    const override = {
        display: "block",
        margin: "0 auto",
    };

    const fetchServicePackage = useCallback(async () => {
        if (!customer_id || !branch?.id || !branch_token) {
            setError('Missing required data to fetch services.');
            setLoading(false);
            return;
        }

        setIsBranchApiLoading(true);
        setLoading(true);

        const payLoad = {
            branch_id: branch.branch_id,
            customer_id: customer_id,
            branch_token: branch_token,
            ...(branch?.type === "sub_user" && { sub_user_id: branch.id }),
          };
          
          // Zet het object om naar een query string
          const queryString = new URLSearchParams(payLoad).toString();
          
          try {
            const response = await fetch(`${API_URL}/branch/customer-info?${queryString}`, {
              method: "GET",
              redirect: "follow",
            });
            // Check if response is not ok (non-2xx status code)
            if (!response.ok) {
                const data = await response.json();

                // Check for session expiration (invalid token)
                if (data.message && data.message.toLowerCase().includes("invalid") && data.message.toLowerCase().includes("token")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        // Redirect to customer login page in the current tab
                        window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
                    });
                    return; // Stop execution after redirect
                }

                // Show error message from API response
                const errorMessage = data?.message || 'Network response was not ok';
                throw new Error(errorMessage);
            }

            // If response is OK, parse the response JSON
            const data = await response.json();

            // Store new token if available
            const newToken = data?._token || data?.token;
            if (newToken) {
                localStorage.setItem("branch_token", newToken);
            }

            if (data.customers) {
                const customers = data.customers;
                setCustomer(customers);

                const servicesData = data.customers.services;

                try {
                    const parsedServices = JSON.parse(servicesData);
                    setServices(parsedServices || []);
                } catch (parseError) {
                    console.error('Failed to parse services data:', parseError);
                    setError('Failed to parse service data.');
                }
            } else {
                setError('No customer data found.');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            // Show the API error message in the Swal alert
            Swal.fire({
                title: 'Error!',
                text: err.message || 'Failed to fetch services.',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
            setError('Failed to fetch services.');
        } finally {
            setLoading(false);
            setIsBranchApiLoading(false);
        }
    }, [API_URL, customer_id, branch?.id, branch_token]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isBranchApiLoading) {
        await checkBranchAuthentication();
        await fetchServicePackage();
      }
    };

    fetchData();
  }, [fetchServicePackage]);


    return (
        <>
            <div className=''>
                <h2 className='text-center md:text-4xl text-2xl font-bold pb-8 md:pt-7 md:pb-4'>Client Master Data</h2>
                <div className="overflow-x-auto bg-white shadow-md rounded-md md:m-10 m-3 h-full">
                    <table className="min-w-full border bg-white overflow-auto shadow-md rounded-md p-3 ">

                        <tr className='bg-[#3e76a5] text-white'>
                            <th className="py-2 px-4 border-b border-r-2 whitespace-nowrap text-center font-bold">PARTICULARS</th>
                            <td className="py-2 px-4 border-b text-center border-r-2 whitespace-nowrap uppercase font-bold">INFORMATION</td>
                        </tr>
                        <tr>
                            <th className="py-2 px-4 border-b border-r-2 whitespace-nowrap text-left">Company Name</th>
                            <td className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">{customer.name || 'NA'}</td>
                        </tr>
                        <tr>
                            <th className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">Company Email</th>
                            <td className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">
                                {customer.emails ? JSON.parse(customer.emails).join(', ') || 'NA' : 'NA'}
                            </td>
                        </tr>
                        <tr>
                            <th className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">Company Mobile</th>
                            <td className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">{customer.mobile || 'NA'}</td>
                        </tr>
                        <tr>
                            <th className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">Company Address</th>
                            <td className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">{customer.address || 'NA'}</td>
                        </tr>

                        <tr>
                            <th className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">GST</th>
                            <td className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">{customer.gst_number || 'NA'}</td>
                        </tr>
                        <tr>
                            <th className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">Contact Person</th>
                            <td className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">{customer.contact_person_name || 'NA'}</td>
                        </tr>
                        <tr>
                            <th className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">Status</th>
                            <td className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">{customer.status || 'NA'}</td>
                        </tr>
                        <tr>
                            <th className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">TAT</th>
                            <td className="py-2 px-4 border-b text-left border-r-2 whitespace-nowrap">{customer.tat_days || 'NA'}</td>
                        </tr>

                    </table></div>
                <h2 className='text-center md:text-4xl text-2xl font-bold pb-8 pt-7 md:pb-4'>Scope Of Services</h2>

                <div className="overflow-x-auto bg-white shadow-md rounded-md md:m-10 m-3 h-full">
                    {loading && (
                        <div className="flex justify-center items-center py-5">
                            <PulseLoader
                                color={color}
                                loading={loading}
                                cssOverride={override}
                                size={15}
                                aria-label="Loading Spinner"
                                data-testid="loader"
                            />
                        </div>
                    )}
                    {error && <p className="text-center text-red-500 p-6">{error}</p>}
                    {!loading && !error && (
                        <div className='max-h-[300px] overflow-auto'>
                        <table className="min-w-full ">
                            <thead>
                                <tr className='bg-[#3e76a5]'>
                                    <th className="py-3 px-4 border-b text-center border-r-2 text-white uppercase whitespace-nowrap">SL NO</th>
                                    <th className="py-3 px-4 border-b text-center border-r-2 text-white uppercase whitespace-nowrap">SERVICES</th>
                                    <th className="py-3 px-4 border-b text-center border-r-2 text-white uppercase whitespace-nowrap">PRICING</th>
                                    <th className="py-3 px-4 border-b text-center text-white uppercase whitespace-nowrap">SERVICE PACKAGE</th>
                                </tr>
                            </thead>
                            {services.length > 0 ? (
                                <tbody>
                                    {services.map((item, index) => (
                                        <tr>
                                            <td className="py-2 px-4 border-b text-center border-r-2 whitespace-nowrap">{index + 1}</td>
                                            <td className="py-2 px-4 border-b border-r-2 whitespace-nowrap">{item.serviceTitle}</td>
                                            <td className="py-2 px-4 border-b border-r-2 text-center whitespace-nowrap">{item.price} RS</td>
                                            <td className="py-2 px-4 border-b whitespace-nowrap text-center">
                                                {Object.values(item.packages).join(', ')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            ) : (
                                <tbody>
                                    <tr>
                                        <td colSpan={4} className='text-center py-5 text-lg'>No data found</td>
                                    </tr>
                                </tbody>
                            )}

                        </table>
                        </div>
                    )}
                </div>
            </div>

        </>
    );
};

export default ScopeOfServices;
