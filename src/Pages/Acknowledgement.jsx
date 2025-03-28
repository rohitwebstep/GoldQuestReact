import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Swal from 'sweetalert2';
import PulseLoader from 'react-spinners/PulseLoader';
const Acknowledgement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemPerPage] = useState(10);
  const [emailsData, setEmailsData] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state
  const { isApiLoading, setIsApiLoading } = useApiCall();


  const [searchTerm, setSearchTerm] = useState('');
  const fetchEmails = useCallback(() => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    setIsApiLoading(true); // Start loading
    setLoading(true); // Start loading

    fetch(`https://api.goldquestglobal.in/acknowledgement/list?admin_id=${admin_id}&_token=${storedToken}`)
      .then(response => response.json())
      .then(data => {
        // Check if the response contains a new token and update it
        const newToken = data._token || data.token;
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }

        // Check for session expiration or invalid token
        if (data.message && data.message.toLowerCase().includes("invalid") && data.message.toLowerCase().includes("token")) {
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            // Redirect to admin login page after the user clicks "Ok"
            window.location.href = "/admin-login"; // Replace with your actual login route
          });
          return; // Exit further processing
        }

        // If the response format is as expected, set the emails data
        if (data.status && data.customers && Array.isArray(data.customers.data)) {
          setEmailsData(data.customers.data);
        } else {
          // Handle unexpected response format
          Swal.fire({
            title: "Error",
            text: data.message || "An unexpected error occurred while fetching emails.",
            icon: "error",
            confirmButtonText: "Ok",
          });
          console.error("Invalid response format:", data);
        }
      })
      .catch(error => {
        // Catch any other errors (network or otherwise)
        Swal.fire({
          title: "Error",
          text: error.message || "An error occurred while fetching emails. Please try again.",
          icon: "error",
          confirmButtonText: "Ok",
        });
        console.error(error);
      })
      .finally(() => {
        setLoading(false); // Stop loading after fetch completes
        setIsApiLoading(false); // Stop loading after fetch completes
      });
  }, [setEmailsData]);




  const sendApproval = (id) => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      "admin_id": admin_id,
      "_token": storedToken,
      "customer_id": id
    });

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    setIsApiLoading(true); // Set loading state

    fetch("https://api.goldquestglobal.in/acknowledgement/send-notification", requestOptions)
      .then(response => {
        if (!response.ok) {
          return response.json().then(result => {
            // Handle session expiration or invalid token
            return handleErrorResponse(result);
          });
        }
        return response.json(); // Continue if the response is okay
      })
      .then((result) => {
        // Handle new token if present in the response
        updateToken(result);

        // After successful approval, refresh emails or perform any other action
        fetchEmails(); // Fetch emails or take further action after approval
      })
      .catch((error) => {
        // Log unexpected errors
        console.error("Error sending approval:", error);
        Swal.fire({
          title: 'Error',
          text: 'An unexpected error occurred. Please try again later.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      })
      .finally(() => {
        setIsApiLoading(false); // Reset loading state
      });
  };

  // Helper function to handle error responses
  const handleErrorResponse = (result) => {
    if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
      Swal.fire({
        title: "Session Expired",
        text: "Your session has expired. Please log in again.",
        icon: "warning",
        confirmButtonText: "Ok",
      }).then(() => {
        window.location.href = "/admin-login"; // Redirect to admin login page
      });
      return; // Exit after showing session expired message
    }

    // Show error message if the response indicates a failure
    Swal.fire(
      'Error!',
      `An error occurred: ${result.message || 'Unknown error'}`,
      'error'
    );
    throw new Error(result.message || 'Unknown error');
  };

  // Helper function to update token if it's present in the response
  const updateToken = (result) => {
    const newToken = result._token || result.token;
    if (newToken) {
      localStorage.setItem("_token", newToken); // Update token if available
    }
  };



  const filteredItems = emailsData.filter(item => {
    return (
      item.client_unique_id?.toLowerCase().includes(searchTerm.toLowerCase()) || ''
    )
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

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleSelectChange = (e) => {
    const checkedStatus = e.target.value;
    setItemPerPage(checkedStatus);
  }
 
    const exportToExcel = () => {
      // Prepare the data for Excel export
      const data = currentItems.map((item, index) => ({
        Index: index + 1 + (currentPage - 1) * itemsPerPage,
        "Client Code": item.client_unique_id,
        "Comapany Name": item.name,
        'Application Count': item.applicationCount,
      }));
  
      // Create a new worksheet
      const ws = XLSX.utils.json_to_sheet(data);
  
      // Create a new workbook and append the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Emails');
  
      // Export the workbook to Excel
      XLSX.writeFile(wb, 'emails.xlsx');
    };
  
  return (
    <div className='p-4 md:py-16'>
      <div className="text-center">
        <h2 className='md:text-4xl text-xl font-bold pb-8 md:pb-4'>Acknowledgement Emails</h2>
      </div>
      <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4">
        <div className="col">
          <form action="">
          <div className="flex gap-2">
                <select name="options" onChange={(e) => {
                  handleSelectChange(e); // Call the select change handler
                  setCurrentPage(1); // Reset current page to 1
                }} id="" className='outline-none border p-2 ps-2 text-left rounded-md w-7/12 md:w-6/12'>
                  <option value="10">10 Rows</option>
                  <option value="20">20 Rows</option>
                  <option value="50">50 Rows</option>
                  <option value="200">200 Rows</option>
                  <option value="300">300 Rows</option>
                  <option value="400">400 Rows</option>
                  <option value="500">500 Rows</option>
                </select>
                <button
                  onClick={exportToExcel}
                  className="bg-[#3e76a5] text-white py-3 px-4 text-sm rounded-md capitalize"
                  type="button"
                  disabled={currentItems.length === 0}
                >
                  Export to Excel
                </button>
            </div>
          </form>
        </div>
        <div className="col md:flex justify-end ">
          <form action="">
            <div className="flex md:items-stretch items-center  gap-3">
              <input
                type="search"
                className='outline-none border-2 p-2 text-sm rounded-md w-full my-4 md:my-0'
                placeholder='Search Here'
                value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
              />
            </div>
          </form>
        </div>

      </div>
      <div className="overflow-x-auto py-6 md:px-4 bg-white rounded-md shadow-md">
        {loading ? (
          <div className='flex justify-center items-center py-6 h-full'>
            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

          </div>
        ) : currentItems.length > 0 ? (
          <table className="min-w-full md:mb-4">
            <thead>
              <tr className='bg-[#3e76a5]'>
                <th className="py-3 text-left text-white px-4 border-b-2 border-r-2 whitespace-nowrap uppercase text-sm md:text-lg">SL</th>
                <th className="py-3 text-left text-white px-4 border-b-2 border-r-2 whitespace-nowrap uppercase text-sm md:text-lg">Client Code</th>
                <th className="py-3 text-left text-white px-4 border-b-2 border-r-2 whitespace-nowrap uppercase text-sm md:text-lg">Company Name</th>
                <th className="py-3 text-left text-white px-4 border-b-2 border-r-2 whitespace-nowrap uppercase text-sm md:text-lg">Application Count</th>
                <th className="py-3 text-left text-white px-4 border-b-2 border-r-2 whitespace-nowrap uppercase text-sm md:text-lg">Send Notification</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((email, index) => (
                <tr key={index}>
                  <td className="py-3 px-4 border-b-2 text-center border-r-2 border-l-2 whitespace-nowrap">                        {index + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
                  <td className="py-3 px-4 border-b-2 text-center border-r-2 whitespace-nowrap">{email.client_unique_id}</td>
                  <td className="py-3 px-4 border-b-2 text-center border-r-2 whitespace-nowrap">{email.name.trim()}</td>
                  <td className="py-3 px-4 border-b-2 text-center border-r-2 whitespace-nowrap">{email.applicationCount}</td>
                  <td className="py-3 px-4 border-b-2 text-center border-r-2 whitespace-nowrap">
                    <button
                      disabled={isApiLoading}
                        type="button"
                        className={`rounded-md p-3 text-white ${isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}

                      onClick={() => sendApproval(email.id)}
                    >
                      Send
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
      <div className="flex items-center justify-end  rounded-md px-4 py-3 sm:px-6 md:m-4 mt-2">
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
  );
};

export default Acknowledgement;