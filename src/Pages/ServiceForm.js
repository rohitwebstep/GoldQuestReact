import React, { useEffect, useState } from 'react';
import { useService } from './ServiceContext';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext

const ServiceForm = () => {
  const API_URL = useApi();
  const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext

  const { selectedService, updateServiceList, setSelectedService, fetchData } = useService();
  const [adminId, setAdminId] = useState(null);
  const [storedToken, setStoredToken] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceInput, setServiceInput] = useState({
    name: "",
    d_name: "",
    short_code: "",
    sac_code: "",
    group: "",
    email_description:"",
    excel_sorting:"",
  });
  const [error, setError] = useState({});

  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem("admin"));
    const token = localStorage.getItem("_token");
    if (adminData) setAdminId(adminData.id);
    if (token) setStoredToken(token);
    if (selectedService) {
      setServiceInput({
        name: selectedService.title || '',
        d_name: selectedService.description || '',
        sac_code: selectedService.sac_code || '',
        group: selectedService.group || '',
        short_code: selectedService.short_code || '',
        email_description: selectedService.email_description || '',
        excel_sorting: selectedService.excel_sorting || '',
      });
      setIsEdit(true);
    } else {
      setServiceInput({
        name: "",
        d_name: "",
        short_code: "",
        sac_code: "",
        group: "",
        email_description:"",
        excel_sorting:""

      });
      setIsEdit(false);
    }
  }, [selectedService]);

  const validate = () => {
    const newErrors = {};
    if (!serviceInput.name) {
      newErrors.name = 'This Field is Required!';
    }
    if (!serviceInput.d_name) {
      newErrors.d_name = 'This Field is Required!';
    }
    if (!serviceInput.sac_code) {
      newErrors.sac_code = 'This Field is Required!';
    }
    if (!serviceInput.short_code) {
      newErrors.short_code = 'This Field is Required!';
    }
    if (!serviceInput.group) {
      newErrors.group = 'This Field is Required!';
    }
    if (!serviceInput.excel_sorting) {
      newErrors.excel_sorting = 'This Field is Required!';
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServiceInput((prevInput) => ({
      ...prevInput, [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validateError = validate();
    if (Object.keys(validateError).length === 0) {
      setError({});
      setIsApiLoading(true);

      setLoading(true); // Start loading

      const requestOptions = {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedService?.id || '',
          title: serviceInput.name,
          description: serviceInput.d_name,
          short_code: serviceInput.short_code,
          group: serviceInput.group,
          sac_code: serviceInput.sac_code,
          excel_sorting: serviceInput.excel_sorting,
          email_description: serviceInput.email_description,
          admin_id: adminId,
          _token: storedToken,
        }),
      };

      const url = isEdit
        ? `${API_URL}/service/update`
        : `${API_URL}/service/create`;

      fetch(url, requestOptions)
        .then((response) => {
          if (!response.ok) {
            // If response is not OK, handle the error
            return response.json().then((result) => {
              const errorMessage = result?.message || "An unknown error occurred";

              // Check if the error message contains "invalid token" (case-insensitive)
              if (result?.message && result.message.toLowerCase().includes("invalid token")) {
                Swal.fire({
                  title: "Session Expired",
                  text: "Your session has expired. Please log in again.",
                  icon: "warning",
                  confirmButtonText: "Ok",
                }).then(() => {
                  // Redirect to the login page
                  window.location.href = "/admin-login";  // Replace with your login route
                });
              } else {
                // Otherwise, show the error message from the API
                Swal.fire({
                  title: "Error!",
                  text: errorMessage,
                  icon: "error",
                  confirmButtonText: "Ok",
                });
              }
              throw new Error(errorMessage); // Throw error to skip further code execution
            });
          }

          // If response is OK, parse the JSON body and proceed
          return response.json();
        })
        .then((result) => {
          // Success: Handle the response data
          const newToken = result.token || result._token || "";
          if (newToken) {
              localStorage.setItem("_token", newToken);
          }
          const successMessage = result?.message || (isEdit ? "Service updated successfully" : "Service added successfully");
          Swal.fire({
            title: "Success!",
            text: successMessage,
            icon: "success",
            confirmButtonText: "Ok",
          });

          // Now, handle the result (e.g., update the service list)
          setError({});
          if (isEdit) {
            // Update the service list for editing
            updateServiceList((prevList) =>
              prevList.map((service) => (service.id === result.id ? result : service))
            );
          } else {
            updateServiceList((prevList) => [...prevList, result]);
          }

          fetchData(); // Refresh data:
          setServiceInput({ name: "", d_name: "", sac_code: "", short_code: "", group: "",email_description:"",excel_sorting:"" });
          setIsEdit(false);
        })
        .catch((error) => {
          console.error("API Error:", error.message);
        })
        .finally(() => {
          setLoading(false);
          setIsApiLoading(false); // Stop loading
        });
    } else {
      setError(validateError);
    }
  };




  const resetForm = () => {
    setServiceInput({ name: "", d_name: "", sac_code: "", short_code: "", group: "",excel_sorting:"" });
    setError({});
    setIsEdit(null)

  }

  return (
    <form onSubmit={handleSubmit} disabled={loading}>
      <div className="mb-4">
        <label htmlFor="ServiceName" className="block">Service Name<span className='text-red-500'>*</span></label>
        <input
          type="text"
          name="name"
          id="ServiceName"
          value={serviceInput.name}
          onChange={handleChange}
          className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2 mt-2 capitalize' />
        {error.name && <p className='text-red-500'>{error.name}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="ServiceDisplayName" className="block">Service Description<span className='text-red-500'>*</span></label>
        <input
          type="text"
          name="d_name"
          id="ServiceDisplayName"
          value={serviceInput.d_name}
          onChange={handleChange}
          className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2 mt-2 capitalize' />
        {error.d_name && <p className='text-red-500'>{error.d_name}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="sac_code" className="block">SAC<span className='text-red-500'>*</span></label>
        <input
          type="text"
          name="sac_code"
          id="sac_code"
          value={serviceInput.sac_code}
          onChange={handleChange}
          className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2 mt-2 capitalize' />
        {error.sac_code && <p className='text-red-500'>{error.sac_code}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="short_code" className="block">Short Code<span className='text-red-500'>*</span></label>
        <input
          type="text"
          name="short_code"
          id="short_code"
          value={serviceInput.short_code}
          onChange={handleChange}
          className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2 mt-2 capitalize' />
        {error.short_code && <p className='text-red-500'>{error.short_code}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="excel_sorting" className="block">Excel Sorting<span className='text-red-500'>*</span></label>
        <input
          type="number"
          name="excel_sorting"
          id="excel_sorting"
          value={serviceInput.excel_sorting}
          onChange={handleChange}
          className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2 mt-2 capitalize' />
        {error.excel_sorting && <p className='text-red-500'>{error.excel_sorting}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="group" className="block">Service Group<span className='text-red-500'>*</span></label>
        <input
          type="text"
          name="group"
          id="group"
          value={serviceInput.group}
          onChange={handleChange}
          className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2 mt-2 capitalize' />
        {error.group && <p className='text-red-500'>{error.group}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="email_description" className="block">Email Description</label>
        <input
          type="text"
          name="email_description"
          id="email_description"
          value={serviceInput.email_description}
          onChange={handleChange}
          className='outline-none pe-14 ps-2 text-left rounded-md w-full border p-2 mt-2 capitalize' />
        {error.email_description && <p className='text-red-500'>{error.email_description}</p>}
      </div>
      <button
        className={`w-full rounded-md p-3 text-white ${loading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}
        type="submit"
        disabled={loading || isApiLoading}
      >
        {loading ? 'Processing...' : isEdit ? 'Update' : 'Add'}
      </button>

      <button onClick={resetForm} className="bg-blue-500 mt-5  hover:bg-blue-200 text-white w-full rounded-md p-3" type='button' >
        Refresh Form
      </button>
    </form>
  );
};

export default ServiceForm;
