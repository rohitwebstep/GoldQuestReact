import React, { useEffect, useState } from 'react';
import { MdCancel } from "react-icons/md";
import Swal from 'sweetalert2';
import 'reactjs-popup/dist/index.css';
import { useData } from './DataContext';
import PulseLoader from "react-spinners/PulseLoader";
import { useApi } from '../ApiContext'; // use the custom hook
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Modal from 'react-modal';
import * as XLSX from 'xlsx';

import 'jspdf-autotable';
import { useApiCall } from '../ApiCallContext';
Modal.setAppElement('#root');

const DeletionCertification = () => {
  const [selectedClient, setSelectedClient] = useState(null);

  const handleDeleteClick = (client) => {
    setSelectedClient(client);
  };

  const closeModal = () => {
    setSelectedClient(null);
  };
  const [error, setError] = useState({});

  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    isClientApplication: false,
    isCandidateApplication: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const { isApiLoading, setIsApiLoading } = useApiCall();

  const [searchTerm, setSearchTerm] = useState('');
  const { loading, listData, fetchData, } = useData();
  const API_URL = useApi();


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

  const Validate = () => {
    const errors = {};
    if (!formData.fromDate) { errors.fromDate = 'This field is required'; }
    if (!formData.toDate) errors.toDate = 'This field is required';
    return errors;
  };

  useEffect(() => {
    if (!isApiLoading) {
      fetchData();
    }
  }, [fetchData]);

  const handleDelete = (mainId, type) => {

    const validateError = Validate(); // Perform validation only if not editing

    if (Object.keys(validateError).length === 0) {
      setError({}); // Clear any previous errors before proceeding
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel!',
      }).then((result) => {
        if (result.isConfirmed) {
          setIsApiLoading(true); // Start loading spinner
          const loadingSwal = Swal.fire({
            title: 'Processing...',
            text: 'Deleting, please wait.',
            timer: 6000,
            timerProgressBar: true,
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
          const storedToken = localStorage.getItem("_token");

          if (!admin_id || !storedToken) {
            console.error("Admin ID or token is missing.");
            Swal.close();
            setIsApiLoading(false); // Set loading state to false if missing token
            return;
          }

          const formdata = new FormData();
          const requestOptions = {
            method: "POST",
            body: formdata,
            redirect: "follow"
          };

          let url;
          let successMessage = ''; // Initialize success message
          let queryParams;

          queryParams = new URLSearchParams({
            id: mainId,
            admin_id: admin_id || '',
            _token: storedToken || '',
            from: formData.fromDate || '',
            to: formData.toDate || '',
            client_applications: formData.isClientApplication || '',
            candidate_applications: formData.isCandidateApplication || '',
          }).toString();

          if (type === 'client') {
            url = `${API_URL}/delete-request/create?${queryParams}`;
          } else {
            Swal.close();
            setIsApiLoading(false); // Set loading state to false if type is not 'client'
            return;
          }

          fetch(url, requestOptions)
            .then((response) => response.json())
            .then((result) => {
              const newToken = result._token || result.token;
              if (newToken) {
                localStorage.setItem("_token", newToken); // Update the token if present in the response
              }

              if (!result.ok) {
                // Check for token expiration or other errors
                if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                  Swal.fire({
                    title: "Session Expired",
                    text: "Your session has expired. Please log in again.",
                    icon: "warning",
                    confirmButtonText: "Ok",
                  }).then(() => {
                    window.location.href = "/admin-login"; // Replace with your login route
                  });
                } else {
                  Swal.fire(
                    'Error!',
                    `An error occurred: ${result.message || 'Unknown error'}`,
                    'error'
                  );
                }
              }

              successMessage = result.message || 'The request has been deleted successfully.'; // Set success message

              fetchData(); // Refresh data, this might be unnecessary to call twice
              Swal.fire(
                'Deleted!',
                successMessage,
                'success'
              );
              setSelectedClient(null);
              setFormData({
                fromDate: '',
                toDate: '',
                isClientApplication: false,
                isCandidateApplication: false,
              });
            })
            .catch((error) => {
              console.error('Fetch error:', error);

            })
            .finally(() => {
              loadingSwal.close(); // Close loading spinner
              setIsApiLoading(false); // End loading spinner here
            });
        }
      });
    } else {
      setError(validateError); // Set error if validation fails
    }
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
    XLSX.writeFile(wb, 'Client-Deletion-Certificate.xlsx');
  };


  return (
    <>



      <div className="md:grid grid-cols-2 p-3 justify-between items-center md:my-4 border-b-2 pb-4">
        <div className="col">
          <form action="">
            <div className="flex gap-2 justify-between md:justify-start">
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
                className="bg-[#3e76a5] text-sm text-white py-3 px-4 rounded-md capitalize"
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
            <div className="  gap-3">
              <input
                type="search"
                className='outline-none border p-3 text-sm rounded-md w-full my-4 md:my-0'
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
      <h2 className='text-center md:text-2xl text-xl font-bold my-5'>List Of Active Clients</h2>

      <div className="overflow-x-auto py-6 p-3 border m-3 bg-white shadow-md rounded-md">

        {loading ? (
          <div className='flex justify-center items-center py-6 '>
            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

          </div>
        ) : currentItems.length > 0 ? (
          <table className="min-w-full mb-4" >
            <thead>
              <tr className='bg-[#3e76a5]'>
                <th className=" p-3 border-b border-r border-l text-white text-left uppercase whitespace-nowrap ">SL</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap ">Client Code</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap ">Company Name</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap ">Name of Client Spoc</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap ">Date of Service Agreement</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap ">Contact Person</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap ">Mobile</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap ">Client Standard Procedure</th>
                <th className=" p-3 border-b border-r text-white text-left uppercase whitespace-nowrap ">Action</th>
              </tr>
            </thead>
            <tbody id='clientListTableTBody'>
              {currentItems.map((item, index) => {

                return (
                  <>
                    <tr key={item.main_id}>
                      <td className="p-3 border-b border-l border-r text-left whitespace-nowrap capitalize">
                        {index + 1 + (currentPage - 1) * itemsPerPage}
                      </td>
                      <td className="p-3 border-b border-r text-center whitespace-nowrap capitalize">
                        {item.client_unique_id || 'NIL'}
                      </td>
                      <td className="p-3 border-b border-r whitespace-nowrap capitalize">
                        {item.name || 'NIL'}
                      </td>
                      <td className="p-3 border-b border-r text-center whitespace-nowrap capitalize">
                        {item.single_point_of_contact || 'NIL'}
                      </td>
                      <td className="p-3 border-b border-r text-center cursor-pointer">
                        {item.agreement_date
                          ? `${new Date(item.agreement_date).getDate()}-${new Date(item.agreement_date).getMonth() + 1}-${new Date(item.agreement_date).getFullYear()}`
                          : "NIL"}
                      </td>
                      <td className="p-3 border-b border-r text-center cursor-pointer">
                        {item.contact_person_name || 'NIL'}
                      </td>
                      <td className="p-3 border-b border-r text-center cursor-pointer">
                        {item.mobile || 'NIL'}
                      </td>
                      <td className="p-3 border-b border-r text-center cursor-pointer">
                        {item.client_standard || 'NIL'}
                      </td>
                      <td className="p-3 border-b border-r text-left whitespace-nowrap fullwidth">
                        <button
                          disabled={isApiLoading || loading}
                          className={`w-full rounded-md p-3 text-white ${loading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-200'
                            }`}
                          onClick={() => handleDeleteClick(item)} // Pass the selected client
                        >
                          Delete
                        </button>
                      </td>
                    </tr>

                    {/* Delete Confirmation Modal */}
                    {selectedClient && (
                      <div className="fixed inset-0 flex justify-center items-center p-3 bg-black bg-opacity-20 z-50">
                        <div className="bg-white p-5 rounded-md md:w-4/12 w-full">
                          <div className='flex justify-between items-center'>
                            <h2 className="text-lg font-semibold mb-4">Delete Confirmation</h2>
                            <button className='bg-red-500 text-white rounded-md' onClick={closeModal}>
                              <MdCancel />
                            </button>
                          </div>

                          <div className="mb-4">
                            <label className="block mb-2">From Date<span className='text-red-600'>*</span></label>
                            <input
                              type="date"
                              name="fromDate"
                              value={formData.fromDate}
                              onChange={handleChange}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                            {error.fromDate && <p className='text-red-500'>{error.fromDate}</p>}
                          </div>

                          <div className="mb-4">
                            <label className="block mb-2">To Date<span className='text-red-600'>*</span></label>
                            <input
                              type="date"
                              name="toDate"
                              value={formData.toDate}
                              onChange={handleChange}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                            {error.toDate && <p className='text-red-500'>{error.toDate}</p>}
                          </div>

                          <div className="mb-4 flex">
                            <input
                              type="checkbox"
                              name="isClientApplication"
                              checked={formData.isClientApplication}
                              onChange={handleChange}
                              className="mr-2"
                            />
                            Client Application
                          </div>

                          <div className="mb-4 flex">
                            <input
                              type="checkbox"
                              name="isCandidateApplication"
                              checked={formData.isCandidateApplication}
                              onChange={handleChange}
                              className="mr-2"
                            />
                            Candidate Application
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => handleDelete(selectedClient.main_id, 'client')}
                              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}


                  </>
                );
              })}
            </tbody>

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
          className="inline-flex items-center rounded-0 border border-gray-300 bg-white p-3 py-2  font-medium text-gray-700 hover:bg-gray-50"
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
          className="inline-flex items-center rounded-0 border border-gray-300 bg-white p-3 py-2  font-medium text-gray-700 hover:bg-gray-50"
          aria-label="Next page"
        >
          <MdArrowForwardIos />
        </button>
      </div>
    </>
  );
};

export default DeletionCertification;