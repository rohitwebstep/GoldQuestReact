import React, { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useSidebar } from '../Sidebar/SidebarContext.jsx';
import 'reactjs-popup/dist/index.css';
import { useEditClient } from './ClientEditContext';
import { useData } from './DataContext';
import PulseLoader from "react-spinners/PulseLoader";
import { useApi } from '../ApiContext'; // use the custom hook
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Modal from 'react-modal';
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';

Modal.setAppElement('#root');

const ClientManagementList = () => {
  const { isApiLoading, setIsApiLoading } = useApiCall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');

  // Handle opening and closing of modal
  const openModal = (item) => {
    setSelectedAddress(item.address || 'NIL');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const [showPopup, setShowPopup] = useState(false);

  const { handleTabChange } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');
  const { loading, listData, fetchData, isOpen, setIsOpen, services } = useData();

  const API_URL = useApi();
  const { setClientData } = useEditClient();
  const [branches, setBranches] = useState([]);
  const [openAccordionId, setOpenAccordionId] = useState(null);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editData, setEditData] = useState({ id: null, name: '', email: '' });

  const openPopup = (branch) => {
    setEditData({ id: branch.id, name: branch.name, email: branch.email });
    setIsPopupOpen(true); // Only open the popup
  };


  const handleEditBranch = async (e) => {
    e.preventDefault();
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    // Validate required fields
    if (!editData.id || !editData.name || !editData.email) {
      Swal.fire(
        'Error!',
        'Missing required fields: Branch ID, Name, or Email',
        'error'
      );
      return;
    }
    setIsApiLoading(true);

    // Prepare the request payload
    const raw = JSON.stringify({
      id: editData.id,
      name: editData.name,
      email: editData.email,
      admin_id,
      _token: storedToken,
    });

    const requestOptions = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: raw,
    };

    try {
      const response = await fetch(`${API_URL}/branch/update`, requestOptions);
      const result = await response.json();
      const newToken = result._token || result.token; // Update token if provided

      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      // Check for session expiration in the response
      if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
        Swal.fire({
          title: "Session Expired",
          text: "Your session has expired. Please log in again.",
          icon: "warning",
          confirmButtonText: "Ok",
        }).then(() => {
          window.location.href = "/admin-login"; // Redirect to admin login page
        });
        return; // Stop further processing after session expiration
      }

      if (!response.ok) {
        // Handle server errors gracefully
        Swal.fire('Error!', `An error occurred: ${result.message || response.statusText}`, 'error');
        return;
      }

      // Success case
      Swal.fire('Success!', 'Branch updated successfully.', 'success');
      toggleAccordion(); // Refresh UI or reload data
      setIsPopupOpen(false); // Close the popup
      closePopup();
      setIsApiLoading(false);

    } catch (error) {
      Swal.fire('Error!', 'There was a problem with the update operation.', 'error');
      console.error('Fetch error:', error);
    }
  };

  const [branchLoading, setBranchLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleAccordion = useCallback((id) => {
    const tdElement = document.getElementById('Branches');
    if (tdElement) {
      tdElement.focus();
    }

    setBranches([]);
    setOpenAccordionId((prevId) => (prevId === id ? null : id));
    setBranchLoading(true);
    setIsOpen(null);
    setError(null);
    setIsApiLoading(true);
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    fetch(`${API_URL}/branch/list-by-customer?customer_id=${id}&admin_id=${admin_id}&_token=${storedToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((response) => {
        return response.json().then(result => {
          const newToken = result._token || result.token;
          if (newToken) {
            localStorage.setItem("_token", newToken);
          }

          if (!response.ok) {
            // If the response status isn't ok, check for session expiry or other errors
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
              return; // Exit the function to prevent further execution
            }

            // Show a general error if no specific session issue is found
            Swal.fire({
              title: 'Error!',
              text: `An error occurred: ${result.message || response.statusText}`,
              icon: 'error',
              confirmButtonText: 'Ok'
            });
            throw new Error('Network response was not ok');
          }

          // Only handle success when the response is ok
          return result;
        });
      })
      .then((data) => {
        const newToken = data._token || data.token;
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
        // Only set branches if the request was successful
        setBranches(data.branches || []);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        setError('Failed to load data'); // Set a more general error state if something goes wrong
      })
      .finally(() => {
        setBranchLoading(false)
        setIsApiLoading(false)
      }); // Always stop loading
  }, [API_URL]);


  const closePopup = () => {
    setIsPopupOpen(false);
    setEditData({ id: null, name: '', email: '' });
  };




  const handleSelectChange = (e) => {
    const checkedStatus = e.target.value;
    setItemPerPage(checkedStatus);
  }

  const filteredItems = listData.filter(item => {
    return (
      item.client_unique_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.single_point_of_contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.contact_person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemPerPage] = useState(10);

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
    XLSX.writeFile(wb, 'Client-Listing.xlsx');
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
          className={`px-3 py-1 rounded-0 ${currentPage === number ? 'bg-[#3e76a5] text-white' : 'bg-[#3e76a5] text-white  border'}`}
        >
          {number}
        </button>
      )
    ));
  };


  useEffect(() => {
    if (!isApiLoading) {
      fetchData();
    }

  }, [fetchData]);


  const handleDelete = (id, type) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsApiLoading(true); // Indicate the loading state

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
          console.error("Admin ID or token is missing.");
          Swal.fire('Error', 'Admin ID or token is missing.', 'error');
          setIsApiLoading(false);
          return;
        }

        const requestOptions = {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        };

        let url;
        let successMessage;

        // Set the URL and success message based on the type of delete
        if (type === 'client') {
          url = `${API_URL}/customer/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`;
          successMessage = 'Your client has been deleted.';
        } else if (type === 'branch') {
          url = `${API_URL}/branch/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`;
          successMessage = 'Your branch has been deleted.';
        } else {
          console.error("Unknown delete type.");
          Swal.fire('Error', 'Unknown delete type.', 'error');
          setIsApiLoading(false);
          return;
        }

        // Send the DELETE request
        fetch(url, requestOptions)
          .then((response) => response.json().then((result) => {
            const newToken = result._token || result.token;
            if (newToken) {
              localStorage.setItem("_token", newToken);
            }

            // Handle errors in the response
            if (!response.ok) {
              const errorMessage = result.message || 'An error occurred';
              if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                Swal.fire({
                  title: "Session Expired",
                  text: "Your session has expired. Please log in again.",
                  icon: "warning",
                  confirmButtonText: "Ok",
                }).then(() => {
                  window.location.href = "/admin-login"; // Redirect to login
                });
              } else {
                Swal.fire('Error!', errorMessage, 'error');
              }
              throw new Error(errorMessage);
            }

            // Fetch updated data after successful delete
            fetchData();
            toggleAccordion(); // Refresh UI or reload data


            // Show success message
            Swal.fire('Deleted!', successMessage, 'success');
          }))
          .catch((error) => {
            console.error('Fetch error:', error);
          })
          .finally(() => {
            setIsApiLoading(false); // Reset the loading state
          });
      }
    });
  };




  const blockBranch = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Block it!',
      cancelButtonText: 'No, cancel!',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsApiLoading(true); // Set loading to true when the API request starts

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
          console.error("Admin ID or token is missing.");
          Swal.fire('Error!', 'Admin ID or token is missing.', 'error');
          setIsApiLoading(false); // Ensure loading is reset in case of error
          return;
        }

        fetch(`https://api.goldquestglobal.in/branch/inactive-list?branch_id=${id}&admin_id=${admin_id}&_token=${storedToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json()) // Ensure response is in JSON format
          .then((result) => {
            const newToken = result._token || result.token;
            if (newToken) {
              localStorage.setItem("_token", newToken);
            }

            // Handle session expiration
            if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
              Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again.",
                icon: "warning",
                confirmButtonText: "Ok",
              }).then(() => {
                window.location.href = "/admin-login"; // Redirect to admin login page
              });
              throw new Error("Session Expired");
            }

            // Only show error message if there was a problem with the response
            if (result.status !== true) {
              Swal.fire('Error!', `An error occurred: ${result.message || 'Unknown error'}`, 'error');
              throw new Error(result.message || 'Unknown error');
            }

            // Success case: Show success message only if the operation was successful
            Swal.fire('Blocked!', 'Your Branch has been Blocked.', 'success');
            toggleAccordion(); // Optionally reload or refresh the UI after blocking
          })
          .catch((error) => {
            console.error('Fetch error:', error);
            // Prevent further execution if the session expired or any other error occurs
            if (error.message === "Session Expired") return;
            Swal.fire('Error!', `Could not Block the Branch: ${error.message}`, 'error');
          })
          .finally(() => {
            setIsApiLoading(false); // Ensure loading is reset once the request completes (either success or failure)
          });
      }
    });
  };




  const unblockBranch = (id) => {

    Swal.fire({
      title: 'Are you sure?',
      text: "You want to unblock this branch!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Unblock it!',
      cancelButtonText: 'No, cancel!',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsApiLoading(true); // Set loading state to true when the request starts

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
          console.error("Admin ID or token is missing.");
          Swal.fire('Error!', 'Admin ID or token is missing.', 'error');
          setIsApiLoading(false); // Reset loading state immediately
          return;
        }

        // Make the API request to unblock the branch
        fetch(`https://api.goldquestglobal.in/branch/active?branch_id=${id}&admin_id=${admin_id}&_token=${storedToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json()) // Parse the response as JSON
          .then((result) => {
            // Handle session expiration and token update
            const newToken = result._token || result.token;
            if (newToken) {
              localStorage.setItem("_token", newToken); // Update token in localStorage
            }

            // Check if the session has expired
            if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
              Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again.",
                icon: "warning",
                confirmButtonText: "Ok",
              }).then(() => {
                window.location.href = "/admin-login"; // Redirect to the admin login page
              });
              throw new Error("Session Expired");
            }

            // Handle other errors from the response
            if (result.status !== true) {
              Swal.fire('Error!', `An error occurred: ${result.message || 'Unknown error'}`, 'error');
              throw new Error(result.message || 'Unknown error');
            }

            // Success case: Notify the user that the branch has been unblocked
            Swal.fire('Unblocked!', 'Your Branch has been Unblocked.', 'success');
            toggleAccordion(); // Optionally refresh the UI after unblocking the branch
          })
          .catch((error) => {
            console.error('Fetch error:', error);
            // Prevent further execution if session expired or any other error occurs
            if (error.message === "Session Expired") return;
            Swal.fire('Error!', `Could not Unblock the Branch: ${error.message}`, 'error');
          })
          .finally(() => {
            setIsApiLoading(false); // Reset the loading state once the request is completed
          });
      }
    });
  };



  const blockClient = (main_id) => {

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Block it!',
      cancelButtonText: 'No, cancel!',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsApiLoading(true); // Set the loading state to true when the request starts

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
          console.error("Admin ID or token is missing.");
          Swal.fire('Error!', 'Admin ID or token is missing.', 'error');
          setIsApiLoading(false); // Reset loading state
          return;
        }

        // Make the API request to block the client
        fetch(`${API_URL}/customer/inactive?customer_id=${main_id}&admin_id=${admin_id}&_token=${storedToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json()) // Parse the response as JSON
          .then((result) => {
            // Handle token expiration and update local token
            const newToken = result._token || result.token;
            if (newToken) {
              localStorage.setItem("_token", newToken); // Store the new token in localStorage
            }

            // Handle session expiration
            if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
              Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again.",
                icon: "warning",
                confirmButtonText: "Ok",
              }).then(() => {
                window.location.href = "/admin-login"; // Redirect to the login page
              });
              throw new Error("Session Expired");
            }

            // Check the result status for success or failure
            if (result.status === true) {
              Swal.fire('Blocked!', 'Your Client has been Blocked.', 'success');
              fetchData(); // Fetch updated data after blocking the client
            } else {
              // Handle failure based on response message
              Swal.fire('Error!', result.message || 'Unknown error', 'error');
              throw new Error(result.message || 'Unknown error');
            }
          })
          .catch((error) => {
            console.error('Fetch error:', error);
            // Prevent further execution if the session expired or another error occurred
            if (error.message === "Session Expired") return;
            Swal.fire('Error!', `Could not Block the Client: ${error.message}`, 'error');
          })
          .finally(() => {
            setIsApiLoading(false); // Set loading state to false when the request finishes
          });
      }
    });
  };


  const handleEditForm = (item) => {
    setClientData(item)
    handleTabChange('edit');
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
      <h2 className='text-center text-2xl font-bold my-5'>Active Clients</h2>

      <div className="overflow-x-auto py-6 p-3 border m-3 bg-white shadow-md rounded-md">

        {loading ? (
          <div className='flex justify-center items-center py-6 '>
            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

          </div>
        ) : currentItems.length > 0 ? (
          <table className="min-w-full mb-4" >
            <thead>
              <tr className='bg-[#3e76a5] text-white'>
                <th className=" p-3 border-b border-r border-l text-white text-left uppercase whitespace-nowrap">SL</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Client Code</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Company Name</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Name of Client Spoc</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Date of Service Agreement</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Contact Person</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Mobile</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Client Standard Procedure</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Services</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Address</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody id='clientListTableTBody'>
              {currentItems.map((item, index) => {

                return (
                  <>
                    <tr key={item.main_id}>
                      <td className=" p-3 border-b border-l border-r text-left whitespace-nowrap capitalize">
                        {index + 1 + (currentPage - 1) * itemsPerPage}
                      </td>
                      <td className=" p-3 border-b border-r text-center whitespace-nowrap capitalize">{item.client_unique_id || 'NIL'}</td>
                      <td className=" p-3 border-b border-r  whitespace-nowrap  capitalize">{item.name || 'NIL'}</td>
                      <td className=" p-3 border-b border-r text-center whitespace-nowrap capitalize">{item.single_point_of_contact || 'NIL'}</td>
                      <td className=" p-3 border-b border-r text-center cursor-pointer">
                        {new Date(item.agreement_date).getDate()}-
                        {new Date(item.agreement_date).getMonth() + 1}-
                        {new Date(item.agreement_date).getFullYear()}
                      </td>


                      <td className=" p-3 border-b border-r text-center cursor-pointer  whitespace-nowrap md:whitespace-normal">{item.contact_person_name || 'NIL'}</td>
                      <td className=" p-3 border-b border-r text-center cursor-pointer">{item.mobile || 'NIL'}</td>
                      <td className=" p-3 border-b border-r text-center whitespace-nowrap md:whitespace-normal cursor-pointer">{item.client_standard || 'NIL'}</td>
                      <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">
                        {services.find(serviceGroup => serviceGroup.customerId === item.main_id)?.services?.length > 0 ? (
                          <>
                            {/* Find the services for this particular client */}
                            <div className='flex gap-2'> {services
                              .find(serviceGroup => serviceGroup.customerId === item.main_id)
                              ?.services?.slice(0, 1)
                              .map((service) => (
                                <div key={service.serviceId} className=" text-start flex">
                                  <div className="px-4 py-2 text-sm border text-center border-[#3e76a5] rounded-lg">
                                    {service.serviceTitle}
                                  </div>
                                </div>
                              ))}

                              {/* Check if there are multiple services */}
                              {services
                                .find(serviceGroup => serviceGroup.customerId === item.main_id)
                                ?.services?.length > 1 && (
                                  <button
                                    className="view-more-btn  px-3 py-1 rounded-md "
                                    onClick={() => setShowPopup(item.main_id)} // Open the popup
                                  >
                                    View More
                                  </button>
                                )}</div>
                          </>
                        ) : (
                          "No services available"
                        )}
                      </td>

                      {/* Popup */}
                      {showPopup === item.main_id && (
                        <div
                          className="popup-overlay fixed inset-0 w-full bg-black bg-opacity-50 flex items-center p-5  justify-center z-50"
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
                            <div className="p-3 flex flex-wrap gap-3">
                              {/* Display all services for the current client */}
                              {services.find(serviceGroup => serviceGroup.customerId === item.main_id)?.services.map((service) => (
                                <div
                                  key={service.serviceId}
                                  className="px-4 py-2 border text-center text-sm   border-[#3e76a5] rounded-lg"
                                >
                                  <div>{service.serviceTitle}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}



                      <td className="p-3 border-b border-r capitalize whitespace-nowrap ">

                        <button onClick={() => openModal(item)} className='text-[#3e76a5]'> View Full address</button>
                      </td>
                      {isModalOpen && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
                            <h2 className="text-xl font-semibold mb-4">Full Address</h2>
                            <p className="text-sm">{selectedAddress}</p>
                            <button
                              className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
                              onClick={closeModal}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                      <td className=" p-3 border-b border-r text-left whitespace-nowrap fullwidth">
                        <button className={`rounded-md p-3 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-200'}`}
                          disabled={isApiLoading} onClick={() => blockClient(item.main_id)}>Block</button>
                        <button
                          className="bg-[#3e76a5]  hover:bg-[#3e76a5]   rounded-md p-2 md:p-3 px-5 text-white ms-2"
                          onClick={() => handleEditForm(item)}
                        >
                          Edit
                        </button>
                        <button className={`rounded-md p-3 mx-2 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-200'}`} disabled={isApiLoading} onClick={() => handleDelete(item.main_id, 'client')}>Delete</button>
                        {item.branch_count > 1 && (
                          <button
                            disabled={isApiLoading}
                            className={`rounded-md p-3 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5]  hover:bg-[#3e76a5] text-white'}`}
                            onClick={() => toggleAccordion(item.main_id)}
                          >
                            View Branches
                          </button>
                        )}
                      </td>
                    </tr>

                    {openAccordionId === item.main_id && (
                      branchLoading ? (
                        <tr><td colSpan="11">

                          <div className="flex justify-center items-center ">
                            <PulseLoader
                              color="#36D7B7"
                              loading={branchLoading}
                              size={13}
                              aria-label="Loading Spinner"
                            />
                          </div>
                        </td></tr>
                      ) : (
                        branches.map((branch) => {
                          // Use parseInt to ensure the value is treated as a number
                          if (parseInt(branch.is_head, 10) === 1) {
                            return; // Skip this iteration if is_head equals 1
                          }
                          const isActive = branch.status === 0;
                          const isBlocked = branch.status === 1;

                          return (
                            <tr>
                              <td colSpan="11"> {/* Ensures the div spans the entire row */}
                                <div className="w-full flex justify-end">
                                  <table key={branch.id} id="Branches" className="accordion w-4/12 m-0 bg-slate-100 p-3 rounded-md text-left mt-3">
                                    <thead>
                                      <tr>
                                        <th className="p-3 py-2 text-left whitespace-nowrap">Name</th>
                                        <th className="p-3 py-2 text-left">Email</th>
                                        <th className="p-3 py-2 text-left">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="border p-3 py-2 whitespace-nowrap">{branch.name}</td>
                                        <td className="border p-3 py-2 whitespace-nowrap">{branch.email}</td>
                                        <td className="border p-3 py-2">
                                          <div className="flex gap-3 items-center">
                                            <button
                                              className="bg-[#3e76a5] text-white hover:bg-[#3e76a5]  rounded-md p-3 px-5 "
                                              onClick={() => openPopup(branch)}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              disabled={isApiLoading}
                                              className={` rounded-md p-3 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-200'}`}
                                              onClick={() => handleDelete(branch.id, 'branch')}
                                            >
                                              Delete
                                            </button>
                                            {isActive && (
                                              <button
                                                disabled={isApiLoading}
                                                className={`rounded-md p-3 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-200'}`}

                                                onClick={() => blockBranch(branch.id)}
                                              >
                                                Block
                                              </button>
                                            )}
                                            {isBlocked && (
                                              <button
                                                disabled={isApiLoading}
                                                className={`rounded-md p-3 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5]  hover:bg-[#3e76a5] '}`}

                                                onClick={() => unblockBranch(branch.id)}
                                              >
                                                Unblock
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>

                          );
                        })
                      )
                    )}
                  </>
                );
              })}
            </tbody>
            <Modal
              isOpen={isPopupOpen}
              onRequestClose={closePopup}
              contentLabel="Edit Branch"
              className="modal"
              overlayClassName="overlay"
            >
              <h2 className="text-lg font-bold mb-4">Edit Branch</h2>
              <form>
                <div className="mb-4">
                  <label className="block text-gray-700">Name:</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="border rounded-md w-full p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Email:</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="border rounded-md w-full p-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="bg-gray-300 rounded-md px-4 py-2"
                    onClick={closePopup}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="bg-[#3e76a5] text-white rounded-md px-4 py-2"
                    onClick={handleEditBranch}
                  >
                    Save
                  </button>
                </div>
              </form>
            </Modal>
          </table>
        ) : (
          <div className="text-center py-6">
            <p>No Data Found</p>
          </div>
        )}


      </div>
      <div className="flex items-center justify-end  p-3 py-2">
        <button
          onClick={showPrev}
          disabled={currentPage === 1}
          className="inline-flex items-center rounded-0 border border-gray-300 bg-white p-3 py-2 font-medium text-gray-700 hover:bg-gray-50"
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
          className="inline-flex items-center rounded-0 border border-gray-300 bg-white p-3 py-2 font-medium text-gray-700 hover:bg-gray-50"
          aria-label="Next page"
        >
          <MdArrowForwardIos />
        </button>
      </div>
    </>
  );
};

export default ClientManagementList;