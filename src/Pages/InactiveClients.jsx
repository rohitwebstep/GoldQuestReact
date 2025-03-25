import React, { useEffect, useCallback, useState } from 'react';
import Swal from 'sweetalert2';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext
import * as XLSX from 'xlsx';

const InactiveClients = () => {
  const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [services, setServices] = useState([]);

  // Calculate total pages based on current filtered data
  const filteredData = data.filter(item =>
    item.item_unique_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
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

    return pageNumbers.map((number, index) =>
      number === '...' ? (
        <span key={`ellipsis-${index}`} className="px-3 py-1">...</span>
      ) : (
        <button
          type="button"
          key={`page-${number}`}
          onClick={() => handlePageChange(number)}
          className={`px-3 py-1 rounded-0 ${currentPage === number ? 'bg-[#3e76a5] text-white' : 'bg-[#3e76a5] text-black border'}`}
        >
          {number}
        </button>
      )
    );
  };

  const fetchClients = useCallback(async () => {
    const admin_id = JSON.parse(localStorage.getItem('admin'))?.id;
    const storedToken = localStorage.getItem('_token');
    setIsApiLoading(true);
    setLoading(true);

    try {
      const response = await fetch(`https://api.goldquestglobal.in/customer/inactive-list?admin_id=${admin_id}&_token=${storedToken}`);

      // Check if the response is OK (status 200-299)
      if (!response.ok) {
        const errorData = await response.json();
        // Show error from the API response
        Swal.fire('Error!', `An error occurred: ${errorData.message || 'Unknown error'}`, 'error');
        return; // Exit early, since the API returned an error
      }

      const result = await response.json();
      const newToken = result._token || result.token;

      // Update token if necessary
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

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
        return; // Exit if session expired
      }

      // Proceed with setting data if the response is valid
      const customers = result?.customers || [];
      setData(customers); // Update the customers data

      // Process services for each customer
      const customerServices = customers.map((customer) => {
        let services = [];
        try {
          services = JSON.parse(customer.services || '[]');
        } catch (error) {
          console.error('Failed to parse services JSON for customer:', customer.id, error);
        }
        return { customerId: customer.main_id, services };
      });

      setServices(customerServices); // Update services state

    } catch (error) {
      console.error('Fetch error:', error);
      // If network or unexpected error occurs
      Swal.fire('Error!', 'An unexpected error occurred while fetching data.', 'error');
    } finally {
      setLoading(false);
      setIsApiLoading(false); // Stop loading
    }
  }, []);




  useEffect(() => {
    if (!isApiLoading) {
      fetchClients();
    }
  }, [fetchClients]);

  const inActive = async (name, id) => {
    const confirm = await Swal.fire({
      title: 'Confirm Action',
      text: `Are you sure you want to activate client ${name} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, activate client',
      cancelButtonText: 'No, keep inactive',
    });

    if (confirm.isConfirmed) {
      setIsApiLoading(true);
      const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
      const storedToken = localStorage.getItem("_token");

      if (!admin_id || !storedToken) {
        Swal.fire('Error!', 'Admin ID or token is missing.', 'error');
        return;
      }

      try {
        const response = await fetch(`https://api.goldquestglobal.in/customer/active?customer_id=${id}&admin_id=${admin_id}&_token=${storedToken}`, { method: 'GET' });

        const result = await response.json();
        const newToken = result._token || result.token;
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
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
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
        if (!response.ok) {
          const errorData = await response.json();
          Swal.fire('Error!', `An error occurred: ${errorData.message}`, 'error');
          return;
        }

        Swal.fire('Success!', `The client ${name} has been successfully unblocked.`, 'success');
        fetchClients();
      } catch (error) {
        console.error('Fetch error:', error);
        Swal.fire('Error', `Failed to unblock the client ${name}: ${error.message}`, 'error');
      }
      finally {
        setIsApiLoading(false);
      }
    }
  };



  const handleSelectChange = (e) => {
    const selectedValue = parseInt(e.target.value, 10);
    setItemsPerPage(selectedValue);
  };
  const exportToExcel = () => {
    // Filtered data to export
    const dataToExport = currentItems;

    // Map the data to match the structure of the table headers
    const formattedData = dataToExport.map((client, index) => ({
      Index: index + 1,
      "Client Code": client.client_unique_id,
      "Company Name": client.name,
      "Name of Client Spoc": client.single_point_of_contact,

      // Use the client ID (or the correct field) for finding services
      Services: services
        .find((serviceGroup) => serviceGroup.customerId === client.main_id)?.services
        .map((service) => service.serviceTitle).join(', ') || 'NIL',

      "Date of Service Agreement": client.agreement_date ? new Date(client.agreement_date).toLocaleDateString() : 'NIL',
      "Contact Person": client.contact_person_name || 'NIL',
      "Mobile": client.mobile || 'NIL',
      "Client Standard Procedure": client.client_standard || 'NIL',
      Address: client.address || 'NIL',
      industry_classification: client.industry_classification || 'NIL',
    }));

    // Create a worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Data');

    // Write the Excel file to disk
    XLSX.writeFile(wb, 'Inactive-Client-Listing.xlsx');
  };

  return (

    <>


      <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4 p-3">
        <div className="col">
          <div className="flex gap-3">
            <select
              name="options"
              onChange={(e) => {
                handleSelectChange(e); // Call the select change handler
                setCurrentPage(1); // Reset current page to 1
              }}
              className="outline-none p-3 text-left rounded-md w-7/12 md:w-6/12"
            >

              <option value="10">10 Rows</option>
              <option value="20">20 Rows</option>
              <option value="50">50 Rows</option>
              <option value="100">100 Rows</option>
              <option value="200">200 Rows</option>
              <option value="300">300 Rows</option>
              <option value="400">400 Rows</option>
              <option value="500">500 Rows</option>
            </select>
            <button
              onClick={exportToExcel}
              className="bg-[#3e76a5] text-white py-3 text-sm px-4 rounded-md capitalize"
              type="button"
              disabled={currentItems.length === 0}
            >
              Export to Excel
            </button>
          </div>
        </div>
        <div className="col md:flex justify-end">
          <form action="">
            <div className="flex md:items-stretch items-center gap-3">
              <input
                type="search"
                className='outline-none border-2 p-3 rounded-md w-full my-4 md:my-0'
                placeholder='Search Here...'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </form>
        </div>
      </div >
      <div className="bg-white m-4  shadow-md rounded-md p-3">
        <h2 className='text-center text-2xl font-bold my-5'>InActive Clients</h2>


        <div className="overflow-x-auto py-6 px-4">
          {loading ? (
            <div className="flex justify-center items-center py-6 h-full">
              <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
            </div>
          ) : currentItems && currentItems.length > 0 ? (
            <table className="min-w-full mb-4">
              <thead>
                <tr className="bg-[#3e76a5]">
                  <th className="py-3 px-4 border-b border-r border-l text-white text-left uppercase whitespace-nowrap">SL</th>
                  <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Client Code</th>
                  <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Company Name</th>
                  <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Name of Client Spoc</th>
                  <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Date of Service Agreement</th>
                  <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Contact Person</th>
                  <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Mobile</th>
                  <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Client Standard Procedure</th>
                  <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Services</th>
                  <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr key={index} className="border">
                    <td className="py-3 px-4 border-b border-l border-r text-left whitespace-nowrap">
                      <input type="checkbox" className="me-2" />
                      {index + 1 + (currentPage - 1) * itemsPerPage}
                    </td>
                    <td className="py-3 px-4 border-b border-r text-center whitespace-nowrap">{item.client_unique_id || 'NIL'}</td>
                    <td className="py-3 px-4 border-b border-r whitespace-nowrap">{item.name || 'NIL'}</td>
                    <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">{item.single_point_of_contact || 'NIL'}</td>
                    <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">
                      {new Date(item.agreement_date).getDate()}-
                      {new Date(item.agreement_date).getMonth() + 1}-
                      {new Date(item.agreement_date).getFullYear()}
                    </td>
                    <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">{item.contact_person_name || 'NIL'}</td>
                    <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">{item.mobile || 'NIL'}</td>
                    <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">{item.client_standard || 'NIL'}</td>
                    <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">
                      {services.find(serviceGroup => serviceGroup.customerId === item.main_id)?.services?.length > 0 ? (
                        <>
                          {/* Find the services for this particular client */}
                          {services
                            .find(serviceGroup => serviceGroup.customerId === item.main_id)
                            ?.services?.slice(0, 1)
                            .map((service) => (
                              <div key={service.serviceId} className="py-2 pb-1 text-start flex">
                                <div className="px-4 py-2  border text-center border-[#3e76a5] rounded-lg text-sm">
                                  {service.serviceTitle}
                                </div>
                              </div>
                            ))}

                          {/* Check if there are multiple services */}
                          {services
                            .find(serviceGroup => serviceGroup.customerId === item.main_id)
                            ?.services?.length > 1 && (
                              <button
                                className="view-more-btn  px-3 py-1 rounded-md"
                                onClick={() => setShowPopup(item.main_id)} // Open the popup
                              >
                                View More
                              </button>
                            )}
                        </>
                      ) : (
                        "No services available"
                      )}
                    </td>



                    {/* Popup */}
                    {showPopup === item.main_id && (
                      <div
                        className="popup-overlay fixed p-3 inset-0 bg-black bg-opacity-50 flex items-center P-8 justify-center z-50"
                        onClick={() => setShowPopup(null)} // Close the popup when clicking outside
                      >
                        <div
                          className=" bg-white w-auto max-h-[80vh] overflow-y-auto rounded-lg shadow-lg md:w-6/12 p-6"
                          onClick={(e) => e.stopPropagation()} // Prevent popup close when clicking inside
                        >
                          <button
                            className="close-btn text-gray-500 hover:text-gray-700 absolute top-3 right-3"
                            onClick={() => setShowPopup(null)} // Close the popup when clicking close button
                          >
                            ✕
                          </button>
                          <h3 className="text-xl text-center font-bold mb-4">All Services</h3>
                          <div className="space-y-2 flex p-3 flex-wrap gap-3">
                            {/* Display all services for the current client */}
                            {services.find(serviceGroup => serviceGroup.customerId === item.main_id)?.services.map((service) => (
                              <div
                                key={service.serviceId}
                                className="px-4 py-2 border text-center border-[#3e76a5] rounded-lg text-sm"
                              >
                                <div>{service.serviceTitle}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}


                    <td className="py-3 px-4 border-b border-r text-center whitespace-nowrap">
                      <button
                        className="bg-red-600 hover:bg-red-200 rounded-md p-2 text-white mx-2"
                        onClick={() => inActive(item.name, item.main_id)}
                      >
                        Unblock
                      </button>
                    </td>
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

        <div className="flex items-center justify-end rounded-md bg-white px-4 py-2">
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


    </>

  );
};

export default InactiveClients;
