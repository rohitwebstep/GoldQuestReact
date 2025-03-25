import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useData } from './DataContext';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useApi } from '../ApiContext';
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';

const ExternalLoginData = () => {
  const { isApiLoading, setIsApiLoading } = useApiCall();

  const [branches, setBranches] = useState([]);
  const [openAccordionId, setOpenAccordionId] = useState(null);

  const { listData, fetchData, loading } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const API_URL = useApi();
  const [branchLoading, setBranchLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleAccordion = useCallback((id) => {
    // Reset branches and prepare the state for loading
    setIsApiLoading(true);
    setBranches([]);
    setOpenAccordionId((prevId) => (prevId === id ? null : id));
    setBranchLoading(true);
    setError(null);

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      Swal.fire({
        title: "Session Expired",
        text: "Admin ID or token is missing. Please log in again.",
        icon: "warning",
        confirmButtonText: "Ok",
      }).then(() => {
        window.location.href = "/admin-login"; // Redirect to login page if missing session data
      });
      return;
    }

    fetch(`${API_URL}/branch/list-by-customer?customer_id=${id}&admin_id=${admin_id}&_token=${storedToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((response) => response.json().then(result => {
        // Handle token expiration check
        const newToken = result._token || result.token;
        if (newToken) {
          localStorage.setItem("_token", newToken); // Update token in localStorage
        }

        if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            window.location.href = "/admin-login"; // Redirect to login page on token expiration
          });
          return; // Stop further processing if token expired
        }

        if (!response.ok) {
          Swal.fire({
            title: 'Error!',
            text: `An error occurred: ${result.message}`,
            icon: 'error',
            confirmButtonText: 'Ok'
          });
          throw new Error('Network response was not ok');
        }

        return result; // Return the successful result if no errors
      }))
      .then((data) => {
        if (data) {
          setBranches(data.branches || []); // Set the branches if the response was successful
        }
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        setError('Failed to load data'); // Set error state in case of failure
      })
      .finally(() => {
        setBranchLoading(false);
        setIsApiLoading(false);
        // Stop loading when fetch is done
      });
  }, [API_URL]);

  const tableRef = useRef(null); // Ref for the table container

  // Function to reset expanded rows
  const handleOutsideClick = (event) => {
    if (tableRef.current && !tableRef.current.contains(event.target)) {
      setOpenAccordionId({}); // Reset to empty object instead of null
    }
  };


  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);



  useEffect(() => {
    if (!isApiLoading) {
      fetchData();
    }

  }, [fetchData]);


  const handleSelectChange = (e) => {
    const checkedStatus = e.target.value;
    setItemPerPage(checkedStatus);
  }

  const filteredItems = listData.filter(item => {
    return (
      item.client_unique_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobile?.toString().includes(searchTerm)

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



  const getEmail = (email) => {
    localStorage.removeItem("branch");
    localStorage.removeItem("branch_token");
    window.open(`customer-login?email=${encodeURIComponent(email)}`, '_blank');

  }
  const flattenDataForExport = () => {
    const flattenedData = currentItems.map((item, index) => {
      // Flattening the data for the table
      const branchData = item.branch_count > 1 && openAccordionId === item.main_id
        ? branches.map((branch) => ({
          "Branch Name": branch.name,
          "Email": branch.email,
        }))
        : [];

      // Flattened data for client details and branches
      const clientData = {
        "S.No": index + 1 + indexOfFirstItem,
        "Client Unique ID": item.client_unique_id,
        "Name": item.name,
        "Mobile": item.mobile,
      };

      const data = [clientData];

      // If there are branch details to be shown, include them in the export
      if (branchData.length > 0) {
        branchData.forEach((branch) => {
          data.push({
            ...clientData, // Copy client details to each branch
            ...branch,
          });
        });
      }
      return data;
    });

    // Flatten the nested arrays into a single array
    return flattenedData.flat();
  };


  const exportToExcel = () => {
    const flattenedData = flattenDataForExport();
    // Create a worksheet from the flattened data
    const ws = XLSX.utils.json_to_sheet(flattenedData);

    // Create a new workbook and append the worksheet to it
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Client Data");

    // Write the Excel file and trigger the download
    XLSX.writeFile(wb, "client_data.xlsx");
  };

  return (
    <div className="bg-white m-4 md:m-24 shadow-md rounded-md p-3">
      <h2 className='text-center md:text-3xl text-xl font-bold py-4'>External Login Credentials</h2>

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
                className="bg-[#3e76a5] text-white text-sm py-3 px-4 rounded-md capitalize"
                type="button"
                disabled={currentItems.length === 0}
              >
                Export To Excel
              </button>
            </div>
          </form>
        </div>
        <div className="col md:flex justify-end ">
          <form action="">
            <div className="flex md:items-stretch items-center  gap-3">
              <input
                type="search"
                className='outline-none border p-2 text-sm rounded-md w-full my-4 md:my-0'
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
      <div className="overflow-x-auto py-6 md:px-4">
        {loading ? (
          <div className="flex justify-center items-center py-6 h-full">
            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
          </div>
        ) : currentItems.length > 0 ? (
          <table className="min-w-full mb-4" ref={tableRef}>
            <thead>
              <tr className="bg-[#3e76a5] border">
                <th className="py-3 px-4 border-b border-l text-white text-left uppercase whitespace-nowrap">SL</th>
                <th className="py-3 px-4 border-b border-l text-white text-left uppercase whitespace-nowrap">Client Code</th>
                <th className="py-3 px-4 border-b border-l text-white text-left uppercase whitespace-nowrap">Company Name</th>
                <th className="py-3 px-4 border-b border-l text-white text-left uppercase whitespace-nowrap">Mobile</th>
                <th className="py-3 px-4 border-b border-l text-white text-center uppercase whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <React.Fragment key={item.main_id}>
                  <tr className="border">
                    <td className="py-3 px-4 border-b border-l text-left whitespace-nowrap capitalize">
                      {index + 1 + indexOfFirstItem}
                    </td>
                    <td className="py-3 px-4 border-b border-l text-center whitespace-nowrap capitalize">
                      {item.client_unique_id}
                    </td>
                    <td className="py-3 px-4 border-b border-l whitespace-nowrap capitalize">{item.name}</td>
                    <td className="py-3 px-4 border-b border-l text-left cursor-pointer">{item.mobile}</td>
                    <td className="py-3 px-4 border-b border-l text-center cursor-pointer">
                      {item.branch_count > 1 ? (
                        <button
                          disabled={branchLoading || isApiLoading}
                          className={` rounded-md p-3 text-white ${branchLoading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}
                          onClick={() => toggleAccordion(item.main_id)}
                        >
                          View Branches
                        </button>
                      ) : (
                        // Handle the case where there's 1 or no branch
                        (() => {
                          const parsedEmails = JSON.parse(item.emails); // Parse the string into an array
                          return (
                            <button onClick={() => getEmail(parsedEmails[0])}
                              disabled={branchLoading || isApiLoading}
                              className={` rounded-md p-3 text-white ${branchLoading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}
                            >
                              Go
                            </button>
                          );
                        })()
                      )}
                    </td>

                  </tr>
                  <tr>

                    <td colSpan={5}>{openAccordionId === item.main_id && (
                      branchLoading ? (
                        <tr>
                          <td colSpan="4" className="py-3 px-4">
                            <div className="flex justify-center items-center">
                              <PulseLoader
                                color="#36D7B7"
                                loading={branchLoading}
                                size={10}
                                aria-label="Loading Spinner"
                              />
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          <tr className="bg-[#3e76a5] text-white">
                            <th className="py-3 px-4 border-b border-l text-center whitespace-nowrap">Branch Name</th>
                            <th className="py-3 px-4 border-b border-l text-center whitespace-nowrap">Email</th>
                            <th className="py-3 px-4 border-b border-l text-center whitespace-nowrap">Action</th>
                            <th className="py-3 px-4 border-b border-l text-center whitespace-nowrap">Delete</th>
                          </tr>
                          {branches.map((branch) => (
                            <tr key={branch.id} className="border bg-gray-100">
                              <td className="py-2 px-4 border-b border-l text-center whitespace-nowrap">{branch.name}</td>
                              <td className="py-2 px-4 border-b border-l whitespace-nowrap">{branch.email}</td>
                              <td className="py-2 px-4 border-b border-l text-center uppercase whitespace-nowrap text-blue-500 font-bold">
                                <button onClick={() => getEmail(branch.email)}>
                                  Go
                                </button>
                              </td>
                              <td className="py-2 px-4 border-b border-l text-center">
                                <button className="bg-red-600 hover:bg-red-200 rounded-md p-2 whitespace-nowrap text-white">
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </>
                      )
                    )}</td>

                  </tr>


                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6">
            <p>No Data Found</p>
          </div>
        )}

      </div>
      <div className="flex items-center justify-end rounded-md bg-white px-4 py-3 sm:px-6 md:m-4 mt-2">
        <button
          onClick={showPrev}
          disabled={currentPage === 1}
          className="inline-flex items-center rounded-0 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          aria-label="Previous page"
        >
          <MdArrowBackIosNew />
        </button>
        <div className="flex items-center">{renderPagination()}</div>
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

export default ExternalLoginData;