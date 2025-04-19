import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';
import { useApi } from "../ApiContext";
import PulseLoader from "react-spinners/PulseLoader";
import "jspdf-autotable";
import * as XLSX from 'xlsx';

import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
const SubUserCredentials = () => {
  const { isBranchApiLoading, setIsBranchApiLoading ,checkBranchAuthentication} = useApiCall();
  const [data, setData] = useState([]);
  const API_URL = useApi();
  const [isEditEmail, setIsEditEmail] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    id: '',
  });

  const editUser = (data) => {

    setFormData({
      email: data.email || '',
      password: '',
      id: data.id || '',
      confirmPassword: ''
    });
    setIsEditEmail(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const branch_token = localStorage.getItem('branch_token');
    const newErrors = {};
    const branch_id = branchData?.branch_id;
    const branchEmail = branchData?.email;
    const _token = branch_token; // Gebruik de opgehaalde token

    // **Validaties**
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password && !isEditEmail) newErrors.password = 'Password is required';
    if (!formData.confirmPassword && !isEditEmail) newErrors.confirmPassword = 'Confirm password is required';

    // **Wachtwoordlengtevalidatie**
    if (!isEditEmail && formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!isEditEmail && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Your passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    setErrors({});
    try {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');

      const rawData = {
        branch_id,
        _token,
        email: formData.email,
        ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
      };

      const rawData1 = {
        branch_id,
        _token,
        email: formData.email,
        id: formData.id,
        ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
      };

      if (!isEditEmail) {
        rawData.password = formData.password;
      }

      if (branchData?.type === "sub_user" && branchData.id) {
        rawData.sub_user_id = `${branchData.id}`;
      }

      const requestOptions = {
        method: isEditEmail ? 'PUT' : 'POST',
        headers: myHeaders,
        body: JSON.stringify(isEditEmail ? rawData1 : rawData),
        redirect: 'follow',
      };

      const apiUrl = isEditEmail
        ? 'https://api.goldquestglobal.in/branch/sub-user/update-email'
        : 'https://api.goldquestglobal.in/branch/sub-user/create';

      const response = await fetch(apiUrl, requestOptions);
      const result = await response.json();

      // **Handle session expiration**
      if (
        result.status === false &&
        result.message?.toLowerCase().includes("invalid token")
      ) {
        Swal.fire({
          title: "Session Expired",
          text: "Your session has expired. Please log in again.",
          icon: "warning",
          confirmButtonText: "Ok",
        }).then(() => {
          window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
        });
        return;
      }

      if (!response.ok || result.status === false) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || "Operation failed.",
        });
        throw new Error(result.message || "Operation failed.");
      }

      // **Bewaar nieuwe token indien beschikbaar**
      if (result.token || result._token) {
        localStorage.setItem("branch_token", result.token || result._token);
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: isEditEmail ? "Email updated successfully!" : "User created successfully!",
      });

      fetchData();
      setFormData({
        title: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setIsEditEmail(false);

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "An error occurred. Please try again.",
      });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };



  const fetchData = useCallback(() => {
    const branchData = JSON.parse(localStorage.getItem("branch"));
    const branch_id = branchData?.branch_id;
    const branchEmail = branchData?.email;
    const _token = localStorage.getItem("branch_token");

    if (!branch_id || !_token) {
      window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
      return;

    } else {
      setLoading(true); // Start general loading state
    }
    setIsBranchApiLoading(true); // Start branch API loading state

    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    const payLoad = {
      branch_id: branch_id,
      _token: _token,
      ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
    };

    // Zet het object om naar een query string
    const queryString = new URLSearchParams(payLoad).toString();

    fetch(
      `${API_URL}/branch/sub-user/list?${queryString}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        // Handle token refresh if a new token is provided in the response
        const newToken = result._token || result.token;
        if (newToken) {
          localStorage.setItem("branch_token", newToken); // Store the new token
        }

        // Check if the response indicates an invalid token (session expired)
        if (
          result.status === false &&
          result.message?.status === false &&
          result.message?.message?.toLowerCase().includes("invalid token")
        ) {
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            // Redirect to the login page in the current tab
            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
          });
          return; // Stop further execution if session expired
        }

        // Handle other data (customers, etc.)
        setData(result.subUsers || []);
        if (newToken) {
          localStorage.setItem("branch_token", newToken); // Store the new token
        }// Assuming 'customers' is in the response body
      })
      .catch((error) => {
        console.error("Fetch error:", error);

        // Show a generic error alert
        Swal.fire({
          title: "Error!",
          text: "An error occurred while fetching the data.",
          icon: "error",
          confirmButtonText: "Ok",
        });
      })
      .finally(() => {
        setLoading(false); // Stop general loading state once the fetch is done
        setIsBranchApiLoading(false); // Stop branch API loading state once the fetch is done
      });
  }, [setData]);



  const [itemsPerPage, setItemPerPage] = useState(10);
 useEffect(() => {
     const fetchDataMain = async () => {
       if (!isBranchApiLoading) {
         await checkBranchAuthentication();
         await fetchData();
       }
     };
 
     fetchDataMain();
   }, [fetchData]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems = Array.isArray(data)
    ? data.filter(item => item?.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

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


  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState(false);


  const [errors, setErrors] = useState({});

  useEffect(() => {
    const branchInfo = JSON.parse(localStorage.getItem('branch'));
    if (branchInfo) {
      setBranchData(branchInfo);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update the formData state
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear the specific field error dynamically
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name]; // Remove the error for the current field
      if (name === 'confirmPassword' && formData.password !== value) {
        newErrors.passwordMatch = 'Your passwords do not match';
      } else {
        delete newErrors.passwordMatch; // Clear the password match error if resolved
      }
      return newErrors;
    });
  };

  const exportToExcel = () => {
    // Prepare the data for Excel export
    const data = currentItems.map((user, index) => ({
      Index: index + 1 + (currentPage - 1) * itemsPerPage,
      userName: user.email || 'NIL',
    }));

    // Create a new worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create a new workbook and append the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');

    // Export the workbook to Excel
    XLSX.writeFile(wb, 'Subusers.xlsx');
  };

  return (
    <>
      <div className='md:grid  grid-cols-2 gap-4 p-3'>
        <div className="p-5 bg-white rounded-md shadow-md mb-5">
          <h2 className='text-center font-bold text-3xl p-3'>{isEditEmail ? "EDIT" : "CREATE"} SUBUSER</h2>
          <div className="bg-white md:p-12 p-6 w-full mx-auto ">
            <form className="space-y-4 w-full text-center" onSubmit={handleSubmit}>

              <div className="w-full text-left">
                <label htmlFor="email" className="block mb-1 font-medium">
                  Email <span className="text-red-500 text-xl">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 mb-[20px] border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {errors.email && <p className="text-red-500">{errors.email}</p>}
              </div>
              {!isEditEmail && (
                <>
                  <div className="w-full text-left">
                    <label htmlFor="password" className="block mb-1 font-medium">
                      Password <span className="text-red-500 text-xl">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full p-3 mb-[20px] border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    />
                    {errors.password && <p className="text-red-500">{errors.password}</p>}
                  </div>
                  <div className="w-full text-left">
                    <label htmlFor="confirmPassword" className="block mb-1 font-medium">
                      Confirm Password <span className="text-red-500 text-xl">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full p-3 mb-[20px] border ${errors.confirmPassword || errors.passwordMatch ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    />
                    {errors.confirmPassword && <p className="text-red-500">{errors.confirmPassword}</p>}
                  </div>
                  {errors.passwordMatch && <p className="text-red-500">{errors.passwordMatch}</p>}
                </>
              )

              }
              <div className="text-left">
                <button type="submit" className={`p-6 py-3 bg-[#3e76a5] hover:scale-105   transition duration-200  text-white font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isEditEmail ? "EDIT " : "CREATE"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className='overflow-auto bg-white rounded-md shadow-md p-3'>


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
                    className='outline-none border p-2 rounded-md w-full my-4 md:my-0'
                    placeholder='Search by Email-ID'
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
                    <th className="py-2 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">SL</th>
                    <th className="py-2 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">username</th>
                    <th className="py-2 px-4 text-white border-r border-b text-center uppercase whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="py-2 px-4 border-l border-r border-b whitespace-nowrap">
                        {index + 1 + (currentPage - 1) * itemsPerPage}
                      </td>
                      <td className="py-2 px-4 border-r border-b whitespace-nowrap">{item.email}</td>
                      <td className="py-2 px-4 border-r border-b whitespace-nowrap text-center">
                        <button
                          disabled={loading}
                          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); editUser(item) }}
                          className='bg-[#3e76a5] rounded-md hover:bg-[#3e76a5] p-2 text-white'
                        >
                          Edit Subuser
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
              className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
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
              className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              aria-label="Next page"
            >
              <MdArrowForwardIos />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubUserCredentials;