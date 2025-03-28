import React, { useEffect, useCallback, useState } from 'react';
import Swal from 'sweetalert2';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';

const CallbackAdmin = () => {
  const { isApiLoading, setIsApiLoading } = useApiCall();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Calculate total pages based on current filtered data
  const filteredData = data.filter(item =>
    item.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

      // Make the API request
      const response = await fetch(`https://api.goldquestglobal.in/admin/callback/list?admin_id=${admin_id}&_token=${storedToken}`, {
        headers: {
          'Cache-Control': 'no-cache', // Prevent caching
        },
      });

      // Parse the response JSON
      const result = await response.json();

      const newToken = result._token || result.token;
      if (newToken) {
        localStorage.setItem("_token", newToken); // Update the token in localStorage
        const updatedToken = localStorage.getItem("_token"); // Retrieve the updated token
      }

      // Check for session expiration by looking for token-related issues
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
        return; // Stop further processing if the session has expired
      }

      // Handle response errors (if status is not OK)
      if (!response.ok) {
        Swal.fire('Error!', `An error occurred: ${result.message || 'Unknown error'}`, 'error');
        return;
      }

      // Successfully fetched data
      const customers = result.callbackRequests || [];
      setData(customers); // Update the customers data

    } catch (error) {
      console.error('Fetch error:', error);
      Swal.fire('Error!', 'An unexpected error occurred while fetching data.', 'error');
    } finally {
      setLoading(false); // Stop loading regardless of success or error
      setIsApiLoading(false); // Stop loading regardless of success or error
    }
  }, []);





  useEffect(() => {
    if (!isApiLoading) {
      fetchClients();
    }
  }, [fetchClients]);


  const handleSelectChange = (e) => {
    const selectedValue = parseInt(e.target.value, 10);
    setItemsPerPage(selectedValue);
  };

  const exportToExcel = () => {
    // Prepare the data for Excel export
    const data = currentItems.map((item, index) => ({
      Index: index + 1 + (currentPage - 1) * itemsPerPage,
      CustomerName: item.customer_name || 'NIL',
      BranchName: item.branch_name || 'NIL',
      SinglePointOfContact: item.single_point_of_contact || 'NIL',
      RequestedAt: new Date(item.requested_at).toLocaleDateString(),
    }));

    // Create a new worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create a new workbook and append the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Requests');

    // Export the workbook to Excel
    XLSX.writeFile(wb, 'requests.xlsx');
  };
  return (
    <div className="bg-white m-4 md:m-24 shadow-md rounded-md p-3">
      <h2 className='text-center text-2xl font-bold my-5'>Callback Request</h2>

      <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4 p-2 md:px-4">
        <div className="col">
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
        </div>
        <div className="col md:flex justify-end">
          <form action="">
            <div className="flex md:items-stretch items-center gap-3">
              <input
                type="search"
                className='outline-none border-2 p-2 rounded-md w-full my-4 md:my-0'
                placeholder='Search by Customer Code'
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
                <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Customer Name</th>
                <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Branch Name</th>
                <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Spoc Name</th>
                <th className="py-3 px-4 border-b border-r text-white text-left uppercase whitespace-nowrap">Requested Date</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr key={index} className="border">
                  <td className="py-3 px-4 border-b border-l border-r text-left whitespace-nowrap">
                    <input type="checkbox" className="me-2" />
                    {index + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
                  <td className="py-3 px-4 border-b border-r text-start whitespace-nowrap">{item.customer_name || 'NIL'}</td>
                  <td className="py-3 px-4 border-b border-r text-start whitespace-nowrap">{item.branch_name || 'NIL'}</td>
                  <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">{item.single_point_of_contact || 'NIL'}</td>
                  <td className="py-3 px-4 border-b border-r whitespace-nowrap text-center">
                    {new Date(item.requested_at).getDate()}-
                    {new Date(item.requested_at).getMonth() + 1}-
                    {new Date(item.requested_at).getFullYear()}
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
  );
};

export default CallbackAdmin;
