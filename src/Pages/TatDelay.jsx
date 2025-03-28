import React, { useCallback, useEffect, useState } from 'react';

import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Swal from 'sweetalert2';
import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';

const TatDelay = () => {
  const { isApiLoading, setIsApiLoading } = useApiCall();

  const [itemsPerPage, setItemPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tatData, setTatData] = useState([]);
  const [loading, setLoading] = useState(null);

  const totalPages = Math.ceil(tatData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = tatData.slice(indexOfFirstItem, indexOfLastItem);

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


  const fetchTat = useCallback(() => {
    setIsApiLoading(true);
    setLoading(true);
    const admin_id = JSON.parse(localStorage.getItem('admin'))?.id;
    const storedToken = localStorage.getItem('_token');

    // Ensure admin_id and storedToken are available
    if (!admin_id || !storedToken) {
      console.error("Admin ID or token is missing.");
      return;
    }

    // Use template literals for better readability
    const url = `https://api.goldquestglobal.in/tat-delay/list?admin_id=${admin_id}&_token=${storedToken}`;

    fetch(url, {
      method: "GET",
      redirect: "follow", // You can keep this if you need to follow redirects
    })
      .then(response => {
        return response.json().then(result => {
          const newToken = result._token || result.token;
          if (newToken) {
            localStorage.setItem("_token", newToken);
          }

          // Check for "invalid token" in response message
          if (!response.ok) {
            const errorMessage = result.message || "Unknown error occurred";
            if (
              errorMessage.toLowerCase().includes("invalid") ||
              errorMessage.toLowerCase().includes("expired") ||
              errorMessage.toLowerCase().includes("invalid or expired token")
            ) {
              // Show session expired message
              Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again.",
                icon: "warning",
                confirmButtonText: "Ok",
              }).then(() => {
                window.location.href = "/admin-login"; // Redirect to login page
              });
              throw new Error("Session expired"); // Stop further processing
            }

            // If not session expiration, show general error message
            Swal.fire(
              'Error!',
              `An error occurred: ${errorMessage}`,
              'error'
            );
            throw new Error(errorMessage); // Throw error to prevent further processing
          }
          return result; // Continue if response is ok
        });
      })
      .then((result) => {
        // Process result if response is successful
        const applications = result.tatDelays.applicationHierarchy.flatMap(customer =>
          customer.branches.flatMap(branch =>
            branch.applications.map(application => ({
              ...application,
              customer_id: customer.customer_id,
              customer_name: customer.customer_name,
              customer_emails: customer.customer_emails,
              customer_unique_id: customer.customer_unique_id,
              customer_mobile: customer.customer_mobile,
              tat_days: customer.tat_days,
              branch_id: branch.branch_id,
              branch_name: branch.branch_name,
              branch_email: branch.branch_email,
              branch_mobile: branch.branch_mobile
            }))
          )
        );
        setTatData(applications); // Set the application data to the state
      })
      .catch((error) => {
        console.error('Fetch error:', error);
      })
      .finally(() => {
        setLoading(false); // Stop loading once the fetch is completed
        setIsApiLoading(false); // Stop loading once the fetch is completed
      });
  }, []);


  useEffect(() => {
    if (!isApiLoading) {
      fetchTat();
    }
  }, [fetchTat]);

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    setItemPerPage(selectedValue)
  }

  const exportToExcel = () => {
    // Define table headers
    const headers = [
      'Index',
      'TAT Days',
      'Application Created At',
      'Application ID',
      'Application Name',
      'Days Out of TAT',
    ];

    // Map data to an array that can be used in the Excel file
    const data = currentItems.map((item, index) => [
      index + 1 + (currentPage - 1) * itemsPerPage,
      item.tat_days || 'NIL',
      new Date(item.application_created_at).getDate() +
      '-' +
      (new Date(item.application_created_at).getMonth() + 1) +
      '-' +
      new Date(item.application_created_at).getFullYear(),
      item.application_id || 'NIL',
      item.application_name || 'NIL',
      item.days_out_of_tat || 'NIL',
    ]);

    // Create a worksheet from the data
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TAT Applications');

    // Export to Excel
    XLSX.writeFile(wb, 'TAT_Applications.xlsx');
  };

  return (
    <>
      <div className="m-4 md:py-16">
        <div className="text-center">
          <h2 className='md:text-4xl text-2xl font-bold pb-8 md:pb-4'>Tat Delay Notifications</h2>
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
                  className='outline-none border-2 p-3 text-sm rounded-md w-full my-4 md:my-0'
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



        <div className="overflow-x-auto py-6 px-4 bg-white shadow-md p-4 rounded-md">
          {loading ? (
            <div className='flex justify-center items-center py-6 h-full'>
              <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

            </div>
          ) : currentItems.length > 0 ? (
            <table className="min-w-full table-auto">
              <thead>
                <tr className='bg-[#3e76a5]'>
                  <th className="py-3 px-4 border-b text-left uppercase whitespace-nowrap text-white border-r">SL</th>
                  <th className="py-3 px-4 border-b text-left uppercase whitespace-nowrap text-white border-r">Tat Days</th>
                  <th className="py-3 px-4 border-b text-left uppercase whitespace-nowrap text-white border-r">Initiation Date</th>
                  <th className="py-3 px-4 border-b text-left uppercase whitespace-nowrap text-white border-r">Application Id</th>
                  <th className="py-3 px-4 border-b text-left uppercase whitespace-nowrap text-white border-r">Employee Name</th>
                  <th className="py-3 px-4 border-b text-left uppercase whitespace-nowrap text-white ">Exceed Days</th>
                </tr>
              </thead>
              <tbody>
                {currentItems && currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <tr key={index}>
                      <td className="py-3 px-4 border-b border-l whitespace-nowrap text-center border-r">                        {index + 1 + (currentPage - 1) * itemsPerPage}
                      </td>
                      <td className="py-3 px-4 border-b whitespace-nowrap text-center border-r">{item.tat_days}</td>
                      <td className=" p-3 border-b border-r  text-center cursor-pointer">
                        {new Date(item.application_created_at).getDate()}-
                        {new Date(item.application_created_at).getMonth() + 1}-
                        {new Date(item.application_created_at).getFullYear()}
                      </td>
                      <td className="py-3 px-4 border-b whitespace-nowrap text-center border-r">{item.application_id}</td>
                      <td className="py-3 px-4 border-b whitespace-nowrap text-left border-r">{item.application_name}</td>
                      <td className="py-3 px-4 border-b whitespace-nowrap text-center border-r">{item.days_out_of_tat}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-3 px-4 border-b text-center text-gray-500">No TAT Delay Applications Available</td>
                  </tr>
                )}
              </tbody>

            </table>
          ) : (
            <div className="text-center py-6">
              <p>No Data Found</p>
            </div>
          )}


        </div>
        <div className="flex items-center justify-end rounded-md  px-4 py-3 sm:px-6 md:m-4 mt-2">
          <button
            type='button'
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
            type="button"
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
  )
}

export default TatDelay