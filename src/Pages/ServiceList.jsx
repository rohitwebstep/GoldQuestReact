import React, { useEffect, useState } from 'react';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import { useService } from './ServiceContext';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext
import * as XLSX from 'xlsx';

const ServiceList = () => {
  const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext

  const API_URL = useApi();
  const { editService, fetchData, loading, data } = useService();
  const [itemsPerPage, setItemPerPage] = useState(10);
  useEffect(() => {
    if (!isApiLoading) {
      fetchData();
    }

  }, [fetchData]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems = data.filter(item => {
    return (
      item?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.short_code.toLowerCase().includes(searchTerm.toLowerCase())


    );
  });
  const handleSelectChange = (e) => {
    const checkedStatus = e.target.value;
    setItemPerPage(checkedStatus);
  }


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


  const handleEditService = (service) => {
    editService(service);
    fetchData();
  };

  const handleDelete = (serviceId) => {

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsApiLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
          console.error("Admin ID or token is missing.");
          return;
        }

        const requestOptions = {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        };

        // Make the DELETE request
        fetch(`${API_URL}/service/delete?id=${serviceId}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
          .then((response) => response.json()) // Parse the response as JSON
          .then((result) => {
            Swal.fire(
              'Deleted!',
              'Your service has been deleted successfully.',
              'success'
            );
            fetchData();
            // Handle token expiration (if the message contains "invalid token")
            if (result.message && result.message.toLowerCase().includes("invalid token")) {
              Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again.",
                icon: "warning",
                confirmButtonText: "Ok",
              }).then(() => {
                // Redirect to the admin login page
                window.location.href = "/admin-login"; // Replace with your login route
              });
              return; // Stop further execution if session has expired
            }

            // If not OK or there's an error, handle it
            if (!result.ok) {
              return result.text().then(text => {
                const errorData = JSON.parse(text);
                Swal.fire(
                  'Error!',
                  `An error occurred: ${errorData.message}`,
                  'error'
                );
                throw new Error(errorData.message); // Handle the error
              });
            }

            // If the deletion is successful, show success message

            // Refresh the data
            fetchData();
          })
          .catch((error) => {
            console.error('Fetch error:', error);

          }).finally(() => {
            setIsApiLoading(false);
          });
      }
    });
  };

  const exportToExcel = () => {
    // Filtered data to export
    const dataToExport = currentItems;

    // Map the data to match the structure of the table headers
    const formattedData = dataToExport.map((service, index) => ({
      Index: index + 1,
      "Service Name": service.title,
      "Service Description": service.description,
      "SAC": service.sac_code,
      "Short Code": service.short_code,
      "Service Group": service.group,
      "Email Description": service.email_description,
    }));

    // Create a worksheet and workbook


    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Create a new workbook and append the worksheet to it
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");

    // Write the Excel file and trigger the download
    XLSX.writeFile(wb, "Services-List.xlsx");
  };


  return (
    <div className='overflow-auto'>


      <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4">
        <div className="col">
          <form action="">
            <div className="flex gap-2">
              <select
                name="options"
                onChange={(e) => {
                  handleSelectChange(e); // Call the select change handler
                  setCurrentPage(1); // Reset current page to 1
                }}
                className="outline-none border p-3 text-left rounded-md  w-7/12 md:w-6/12"
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
                className="bg-[#3e76a5] text-sm text-white py-3 px-4 rounded-md capitalize"
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

      <div className="overflow-x-auto py-6 px-4">
        {loading ? (
          <div className='flex justify-center items-center py-6 h-full'>
            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
          </div>
        ) : currentItems.length > 0 ? (
          <table className="min-w-full mb-4">
            <thead>
              <tr className='bg-[#3e76a5]'>
                <th className="py-2 px-4 text-white border-r border-b text-left text-sm uppercase whitespace-nowrap">SL</th>
                <th className="py-2 px-4 text-white border-r border-b text-left text-sm uppercase whitespace-nowrap">Service Name</th>
                <th className="py-2 px-4 text-white border-r border-b text-left text-sm uppercase whitespace-nowrap">Service Description</th>
                <th className="py-2 px-4 text-white border-r border-b text-left text-sm uppercase whitespace-nowrap">SAC Code</th>
                <th className="py-2 px-4 text-white border-r border-b text-left text-sm uppercase whitespace-nowrap">Short Code</th>
                <th className="py-2 px-4 text-white border-r border-b text-left text-sm uppercase whitespace-nowrap">Group</th>
                <th className="py-2 px-4 text-white border-r border-b text-center text-sm uppercase whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-2 px-4 border-l border-r text-sm border-b whitespace-nowrap">                        {index + 1 + (currentPage - 1) * itemsPerPage}
                  </td>
                  <td className="py-2 px-4 border-r text-sm border-b whitespace-nowrap">{item.title}</td>
                  <td className="py-2 px-4 border-r text-sm border-b">{item.description}</td>
                  <td className="py-2 px-4 border-r text-sm border-b">{item.sac_code}</td>
                  <td className="py-2 px-4 border-r text-sm border-b">{item.short_code}</td>
                  <td className="py-2 px-4 border-r text-sm border-b">{item.group}</td>
                  <td className="py-2 px-4 border-r text-sm border-b whitespace-nowrap text-center">
                    <button
                      disabled={loading}
                      className="bg-[#3e76a5] rounded-md text-sm hover:bg-[#3e76a5] p-2 text-white"
                      onClick={() => {
                        // Scroll to the top of the page smoothly
                        window.scrollTo({ top: 0, behavior: 'smooth' });

                        // Call the handleEditService function
                        handleEditService(item);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      disabled={loading || isApiLoading}
                      className={`rounded-md p-2 text-sm text-white ms-2 ${loading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-200'}`}
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
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
      <div className="flex items-center justify-end rounded-md bg-white  py-3 sm:px-6  mt-2">
        <button
          onClick={showPrev}
          disabled={currentPage === 1}
          className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          aria-label="Next page"
        >
          <MdArrowForwardIos />
        </button>
      </div>
    </div>

  );
};

export default ServiceList;