import React, { useState, useEffect, useRef, useCallback } from "react";
import Swal from 'sweetalert2';
import { useClient } from "./ClientManagementContext";
import ClientManagementData from "./ClientManagementData";
import { useApi } from "../ApiContext";
import { State } from 'country-state-city';
import axios from "axios";
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import { useSidebar } from '../Sidebar/SidebarContext.jsx';
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const ClientManagement = () => {
  const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext
  const [showModal, setShowModal] = useState(false); // State to handle modal visibility
  const states = State.getStatesOfCountry('IN');
  const optionState = states.map(state => ({ value: state.isoCode, label: state.name }));
  const { handleTabChange } = useSidebar();
  const [files, setFiles] = useState([]);
  const [options, setOptions] = useState(optionState);

  const [isLoading, setIsLoading] = useState(false); // New state for loading indicator
  const [dataLoading, setDataLoading] = useState(false); // New state for loading indicator
  const [custom_bgv, setCustom_Bgv] = useState(0);
  const handleModalToggle = () => {
    setShowModal(!showModal); // Toggle modal visibility
  };
  const [, setInsertId] = useState();
  const API_URL = useApi();
  const { clientData, setClientData, validationsErrors, admins } = useClient();
  useEffect(() => {

    if (!clientData) {
      setDataLoading(true);
    }
    else {
      setDataLoading(false);
    }
  })
  const refs = useRef({});


  const [input, setInput] = useState({
    company_name: "",
    client_code: "",
    address: "",
    state_code: "",
    state: "",
    mobile_number: "",
    escalation_admin_id
      : "",
    client_spoc: "",
    contact_person: "",
    gstin: "",
    tat: "",
    date_agreement: "",
    agreement_period: "",
    client_standard: "",
    additional_login: "no",
    custom_template: "",
    custom_address: "",
    username: "",
    industry_classification: '',
    director_email: '',
  });

  const handleCheckBoxChange = (event) => {
    const isChecked = event.target.checked;
    setCustom_Bgv(isChecked ? 1 : 0);

  };

  const handleFileChange = (fileName, e) => {
    const selectedFiles = Array.from(e.target.files); // Convert FileList to an array

    const maxSize = 2 * 1024 * 1024; // 2MB size limit
    const allowedTypes = [
      'image/jpeg', 'image/png', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]; // Allowed file types

    let errors = [];

    // Validate each file
    selectedFiles.forEach((file) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size must be less than 2MB.`);
      }

      // Check file type (MIME type)
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
      }
    });

    // If there are errors, show them and don't update the state
    if (errors.length > 0) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [fileName]: errors, // Set errors for this file
      }));
      return; // Don't update state if there are errors
    }

    // If no errors, update the state with the selected files
    setFiles((prevFiles) => ({
      ...prevFiles,
      [fileName]: selectedFiles,
    }));

    setErrors((prevErrors) => {
      const { [fileName]: removedError, ...restErrors } = prevErrors; // Remove the error for this field if valid
      return restErrors;
    });
  };



  const [branchForms, setBranchForms] = useState([{ branch_name: "", branch_email: "" }]);
  const [emails, setEmails] = useState([""]);
  const [errors, setErrors] = useState({});

  const handleChange = (e, index) => {
    const { name, value } = e.target;

    if (name === "client_code") {
      // Handle client_code: Ensure it starts with "GQ-" and is uppercase
      const processedValue = `GQ-${value.replace(/^GQ-/, '').toUpperCase()}`;
      setInput((prevInput) => ({
        ...prevInput,
        [name]: processedValue,
      }));
    } else if (name.startsWith("branch_")) {
      // Update branchForms
      setBranchForms((prevBranchForms) => {
        const updatedBranchForms = [...prevBranchForms];
        updatedBranchForms[index][name] = value;
        return updatedBranchForms;
      });
    } else if (name.startsWith("email")) {
      // Update emails
      setEmails((prevEmails) => {
        const updatedEmails = [...prevEmails];
        updatedEmails[index] = value;
        return updatedEmails;
      });
    } else {
      // Generic input handler
      setInput((prevInput) => ({
        ...prevInput,
        [name]: value,
      }));
    }
  };


  const validate = () => {
    const newErrors = {};
    const requiredFields = [
      "company_name", "client_code", "address", "state_code", "state", "mobile_number",
      "escalation_admin_id", "client_spoc", "contact_person", "gstin", "tat",
      "date_agreement", "custom_template", "additional_login", "industry_classification",
    ];

    // Define file validation parameters
    const maxSize = 2 * 1024 * 1024; // 2MB size limit
    const allowedTypes = [
      'image/jpeg', 'image/png', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]; // Allowed file types

    // Initialize the errors object
    let errors = {};

    // Validate if files are selected for 'custom_logo' and 'agr_upload'
    const validateFile = (fileName) => {
      if (errors[fileName] && errors[fileName].length > 0) {
        // If there are errors, skip validation
        return errors[fileName];
      } else {
        const file = fileName === 'custom_logo' ? files.custom_logo : files.agr_upload;
        let fileErrors = [];

        if (file && file.length > 0) {
          file.forEach((file) => {
            if (file.size > maxSize) {
              fileErrors.push(`${file.name}: File size must be less than 2MB.`);
            }

            if (!allowedTypes.includes(file.type)) {
              fileErrors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
            }
          });
        } else {
          fileErrors.push(`${fileName} is required.`);
        }

        return fileErrors;
      }
    };

    // Validate file errors for custom_logo and agr_upload
    if (input.custom_template === 'yes') {
      const customLogoErrors = validateFile('custom_logo');
      if (customLogoErrors.length > 0) {
        newErrors.custom_logo = customLogoErrors;
      }
    }

    const agrUploadErrors = validateFile('agr_upload');

    if (agrUploadErrors.length > 0) {
      newErrors.agr_upload = agrUploadErrors;
    }

    // Validate required fields
    requiredFields.forEach((field) => {
      if (!input[field]) {
        newErrors[field] = "This field is required";
      }
    });

    // Validate mobile_number to be 10 digits
    const mobileNumber = input.mobile_number;
    if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
      newErrors.mobile_number = "Mobile number must be exactly 10 digits";
    }

    // Validate client_code: no spaces and must be uppercase
    const clientCode = input.client_code;
    if (clientCode) {
      if (/\s/.test(clientCode)) {
        newErrors.client_code = "Client code must not contain spaces";
      }
      else if (/[^a-zA-Z0-9-]/.test(clientCode)) {
        newErrors.client_code = 'Client Code should only contain letters, numbers, and hyphens';
      }
    }



    // Validate emails
    const emailSet = new Set();
    emails.forEach((email, index) => {
      if (!email) {
        newErrors[`email${index}`] = "This field is required";
      } else if (emailSet.has(email)) {
        newErrors[`email${index}`] = "This email is already used";
      } else {
        emailSet.add(email);
      }
    });

    return newErrors;
  };


  const handleFocusOut = useCallback(debounce((event) => {
    setIsApiLoading(true);
    const value = event.target.value;
    const adminData = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem("_token");

    if (value) {
      fetch(`${API_URL}/branch/is-email-used?email=${value}&admin_id=${adminData}&_token=${token}`, {
        method: "GET"
      })
        .then(response => response.json()) // Make sure to resolve the JSON first
        .then(result => {
          const newToken = result.token || result._token; // Check both properties for the new token
          if (newToken) {
            localStorage.setItem("_token", newToken); // Store the new token
          }
          if (!result.status) {
            event.target.setCustomValidity('The Provided Email is Already Used By Client, please enter a different email!');
          } else {
            event.target.setCustomValidity('');
          }
        })
        .catch(error => {
          console.error('Error:', error);
        })
        .finally(() => {
          setIsApiLoading(false);
        });
    }

  }, 300), []);



  useEffect(() => {
    const inputs = document.querySelectorAll('.emailCheck');
    inputs.forEach(input => input.addEventListener('focusout', handleFocusOut));
    return () => inputs.forEach(input => input.removeEventListener('focusout', handleFocusOut));
  }, [handleFocusOut]);


  const handleFormSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    const validationError = validate();
    const ServicesErrors = validationsErrors; // Validate nested fields

    // Merge flat and nested validation errors
    Object.keys(validationError).forEach((key) => {
      if (validationError[key]) {
        newErrors[key] = validationError[key];
      }
    });

    Object.keys(ServicesErrors).forEach((key) => {
      Object.keys(ServicesErrors[key]).forEach((field) => {
        if (ServicesErrors[key][field]) {
          newErrors[`${key}_${field}`] = ServicesErrors[key][field];
        }
      });
    });

    // Show errors only for the current submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Focus on the first field with an error
      const errorField = Object.keys(newErrors)[0];
      if (refs.current[errorField]) {
        refs.current[errorField].focus();
      }

      return;
    } else {
      setErrors({});
    }
    setErrors({});
    setIsApiLoading(true);

    // Show the "Processing..." message and loading spinner
    const swalInstance = Swal.fire({
      title: 'Processing...',
      text: 'Please wait while we create the Client.',
      didOpen: () => {
        Swal.showLoading(); // This starts the loading spinner
      },
      allowOutsideClick: false, // Prevent closing Swal while processing
      showConfirmButton: false, // Hide the confirm button
    });
    setIsLoading(true);


    try {
      // Proceed with the submission if no errors
      const adminData = JSON.parse(localStorage.getItem("admin"));
      let token = localStorage.getItem("_token");
      const fileCount = Object.keys(files).length;

      const requestData = {
        admin_id: adminData.id,
        ...input,
        _token: token,
        clientData: clientData,
        custom_bgv: custom_bgv,
        send_mail: fileCount === 0 ? 1 : 0,
      };

      if (branchForms.some(branch => branch.branch_name.trim() !== "" && branch.branch_email.trim() !== "")) {
        requestData.branches = branchForms;
      }

      if (emails && emails.length > 0) {
        requestData.emails = emails;
      }

      const response = await fetch(`${API_URL}/customer/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      const newToken = data._token || data.token;

      if (newToken) {
        localStorage.setItem("_token", newToken);
        token = newToken;
      }

      // Check if the response message starts with "INVALID TOKEN"
      if (data.message && data.message.toLowerCase().includes("invalid") && data.message.toLowerCase().includes("token")) {
        Swal.fire({
          title: "Session Expired",
          text: "Your session has expired. Please log in again.",
          icon: "warning",
          confirmButtonText: "Ok",
        }).then(() => {
          // Redirect to admin login page
          window.location.href = "/admin-login"; // Replace with your login route
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to create client");
      }

      const customerInsertId = data.data.customerId;
      const password = data.password;
      setInsertId(customerInsertId);

      if (fileCount === 0) {
        Swal.fire({
          title: "Success",
          text: `Client Created Successfully.`,
          icon: "success",
          confirmButtonText: "Ok",
        });
      }

      if (fileCount > 0) {
        await uploadCustomerLogo(adminData.id, customerInsertId, password);

        Swal.fire({
          title: "Success",
          text: `Client Created Successfully.`,
          icon: "success",
          confirmButtonText: "Ok",
        });
      }

      handleTabChange("active_clients");
      resetFormFields();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error!", `An error occurred: ${error.message}`, "error");
    } finally {
      swalInstance.close(); // Close the Swal loading spinner
      setIsLoading(false);
      setIsApiLoading(false);
    }
  };





  const uploadCustomerLogo = async (adminId, customerInsertId, password) => {
    setIsApiLoading(true); // Start loading state

    try {
      // Loop through files
      for (const [key, value] of Object.entries(files)) {
        let token = localStorage.getItem("_token");

        const customerLogoFormData = new FormData();
        customerLogoFormData.append("admin_id", adminId);
        customerLogoFormData.append("_token", token);
        customerLogoFormData.append("customer_code", input.client_code);
        customerLogoFormData.append("customer_id", customerInsertId);

        // Append each file for upload
        for (const file of value) {
          customerLogoFormData.append("images", file);
          customerLogoFormData.append("upload_category", key);
        }

        // Add additional parameters
        customerLogoFormData.append("send_mail", 1); // Always send mail
        customerLogoFormData.append("company_name", input.company_name);
        customerLogoFormData.append("password", password);

        // Make the API request for file upload
        const response = await axios.post(`${API_URL}/customer/upload`, customerLogoFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Handle session expiration
        if (response.data.message && response.data.message.toLowerCase().includes("invalid") && response.data.message.toLowerCase().includes("token")) {
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            // Redirect to admin login page
            window.location.href = "/admin-login"; // Redirect to your login page
          });
          return; // Exit if token is invalid
        }

        // Update the token if it's available
        const newToken = response.data._token || response.data.token;
        if (newToken) {
          localStorage.setItem("_token", newToken);
          token = newToken; // Update for subsequent uploads
        }

        // Handle successful upload response (Optional, if required)
        if (response.data.status === "success") {
          // Optionally handle success scenario
        } else {
          throw new Error(response.data.message || "Unexpected error occurred.");
        }
      }

    } catch (err) {
      // Show error in case of failure
      Swal.fire("Error!", `Error uploading files: ${err.message}`, "error");
      console.error(err); // Log error to the console
    } finally {
      setIsApiLoading(false); // Reset loading state after all uploads
    }
  };



  const resetFormFields = () => {
    setInput({
      company_name: "",
      client_code: "",
      address: "",
      state_code: "",
      state: "",
      mobile_number: "",
      escalation_admin_id: "",
      client_spoc: "",
      contact_person: "",
      gstin: "",
      tat: "",
      date_agreement: "",
      agreement_period: "",
      client_standard: "",
      additional_login: "no",
      custom_template: "",
      custom_address: "",
      username: "",
      industry_classification: '',

    });

    setBranchForms([{ branch_name: "", branch_email: "" }]);
    setEmails([""]);
    setErrors({});
    setClientData([""]);
  };


  const addMoreFields = () => {
    setBranchForms([...branchForms, { branch_name: "", branch_email: "" }]);
  };

  const addMoreEmails = () => {
    setEmails([...emails, ""]);
  };

  const deleteField = (index) => {
    setBranchForms(branchForms.filter((_, i) => i !== index));
  };

  const deleteEmails = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };
  const clientCode = input.client_code.trim();
  let processedCode = '';

  if (clientCode.startsWith('GQ-')) {
    // If it starts with 'GQ-', process the part after the prefix
    processedCode = clientCode.replace(/^GQ-/, '').toUpperCase();
  } else {
    // Otherwise, assume the whole input is a raw code
    processedCode = clientCode.toUpperCase();
  };



  const handleSaveCustomState = () => {
    // Add the custom state to options
    if (input.customState && !options.some((option) => option.label === input.customState)) {
      setOptions((prevOptions) => [
        ...prevOptions,
        { value: input.customState.toLowerCase().replace(/\s+/g, '-'), label: input.customState },
      ]);
      setInput((prevState) => ({
        ...prevState,
        state: input.customState, // Set the custom state as selected
        customState: '', // Clear customState after saving
      }));
    }
  };
  return (
    <>
      <div className="py-4 md:py-16 m-4">
        <h2 className="md:text-4xl text-2xl md:mb-8 font-bold pb-8 md:pb-4 text-center">
          Client Management
        </h2>
        <div className="md:w-9/12 m-auto bg-white shadow-md border rounded-md p-3 md:p-10">
          {dataLoading ? (
            <div className='flex justify-center items-center py-6 h-full'>
              <PulseLoader color="#36D7B7" loading={dataLoading} size={15} aria-label="Loading Spinner" />

            </div>
          ) :
            (<form onSubmit={handleFormSubmit} disabled={dataLoading} >
              <div className="md:flex gap-5">
                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="company_name">Company Name: <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    ref={(el) => (refs.current["company_name"] = el)} // Attach ref here

                    name="company_name"
                    id="company_name"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.company_name}
                    onChange={handleChange}

                  />
                  {errors.company_name && <p className="text-red-500">{errors.company_name}</p>}
                </div>

                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="client_code">Client Code: <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="client_code"
                    id="client_code"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={`GQ-${processedCode}`} // Ensure the value starts with 'GQ-' and is fully uppercase
                    onChange={handleChange}
                    ref={(el) => (refs.current["client_code"] = el)} // Attach ref here

                  />
                  {errors.client_code && <p className="text-red-500">{errors.client_code}</p>}
                </div>
              </div>
              <div className="md:flex gap-5">
                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="address">Address: <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.address}
                    onChange={handleChange}
                    ref={(el) => (refs.current["address"] = el)} // Attach ref here

                  />
                  {errors.address && <p className="text-red-500">{errors.address}</p>}
                </div>
                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="mobile_number">Mobile: <span className="text-red-600">*</span></label>
                  <input
                    type="number"
                    name="mobile_number"
                    id="mobile_number"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.mobile_number}
                    onChange={handleChange}
                    ref={(el) => (refs.current["mobile_number"] = el)} // Attach ref here

                  />
                  {errors.mobile_number && <p className="text-red-500">{errors.mobile_number}</p>}
                </div>

              </div>

              <div className="md:flex gap-5">

                <div className="mb-4 md:w-6/12">
                  <label htmlFor="contact_person">Contact Person: <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="contact_person"
                    id="contact_person"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.contact_person}
                    onChange={handleChange}
                    ref={(el) => (refs.current["contact_person"] = el)} // Attach ref here

                  />
                  {errors.contact_person && <p className="text-red-500">{errors.contact_person}</p>}
                </div>
                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="state">
                    State: <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="state"
                    id="state"
                    className="w-full border p-2 rounded-md mt-2"
                    value={input.state}
                    onChange={handleChange}
                  >
                    <option value="">Select State</option>
                    <option value="other">Other (Enter Custom State)</option>
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-500">{errors.state}</p>}
                  {input.state === 'other' && (
                    <div>
                      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-md shadow-md w-96">
                          <h3 className="text-lg font-semibold mb-4">Enter Custom State</h3>
                          <input
                            type="text"
                            name="customState"
                            id="customState"
                            className="w-full border p-2 rounded-md mt-2"
                            value={input.customState}
                            onChange={handleChange}
                            placeholder="Enter custom state"
                          />
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => setInput((prevState) => ({ ...prevState, state: '' }))} // Close modal by clearing the state
                              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
                            >
                              Close
                            </button>
                            <button
                              onClick={handleSaveCustomState} // Save the custom state to the state field and add it to options
                              className="bg-blue-500 text-white px-4 py-2 rounded-md"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:flex gap-5">
                <div className="mb-4 md:w-6/12">

                  <label className="text-gray-500" htmlFor="state_code">State Code: <span className="text-red-600">*</span></label>
                  <input
                    type="number"
                    name="state_code"
                    id="state_code"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.state_code}
                    onChange={handleChange}
                    ref={(el) => (refs.current["state_code"] = el)} // Attach ref here

                  />
                  {errors.state_code && <p className="text-red-500">{errors.state_code}</p>}
                </div>
                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="escalation_admin_id">Name of the Escalation Point of Contact:<span className="text-red-600">*</span></label>

                  <select
                    name="escalation_admin_id"
                    ref={(el) => (refs.current["escalation_admin_id"] = el)} // Attach ref here
                    id="escalation_admin_id"
                    value={input.escalation_admin_id}
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    onChange={handleChange}
                  >
                    <option value="">Select Option</option>
                    {admins.map((item, index) => {
                      return (
                        <>
                          <option value={item.id}>{item.name}({item.emp_id})</option>

                        </>
                      )
                    })}
                  </select>
                  {errors.escalation_admin_id && <p className="text-red-500">{errors.escalation_admin_id}</p>}
                </div>

              </div>
              <div className="my-3 md:grid gap-5 grid-cols-2 items-center flex-wrap">
                {emails.map((email, index) => (
                  <>
                    <div key={index} className="mb-4 md:flex justify-between items-end gap-3 ">
                      <div className="w-full">   <label className="text-gray-500 whitespace-nowrap">Client Email {index + 1}: <span className="text-red-600">*</span></label>
                        <input
                          type="email"
                          name={`email${index}`}
                          value={email}
                          onChange={(e) => handleChange(e, index)}
                          ref={(el) => (refs.current[`email${index}`] = el)} // Corrected ref key
                          className="border  rounded-md p-2 mt-2 outline-none text-sm emailCheck w-full"
                        />

                        {errors[`email${index}`] && <p className="text-red-500 text-sm whitespace-nowrap">{errors[`email${index}`]}</p>}</div>
                      {index > 0 && (
                        <button
                          className="bg-red-500 rounded-md px-4 py-2 mt-3 md:mt-0  text-white"
                          type="button"
                          onClick={() => deleteEmails(index)}
                        >
                          Delete
                        </button>
                      )}

                    </div>

                  </>

                ))}
              </div>

              <button className="bg-[#3e76a5] text-white rounded-3 p-2 mt-0 rounded-md px-7 mb-3" type="button" onClick={addMoreEmails}>Add More Client Email</button>
              <div className="md:flex gap-5">
                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="client_spoc">Name of The Client SPOC:<span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="client_spoc"
                    id="client_spoc"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.client_spoc}
                    onChange={handleChange}
                    ref={(el) => (refs.current["client_spoc"] = el)} // Attach ref here

                  />

                  {errors.client_spoc && <p className="text-red-500">{errors.client_spoc}</p>}
                </div>

                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="gstin">GSTIN: <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="gstin"
                    id="gstin"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.gstin}
                    ref={(el) => (refs.current["gstin"] = el)} // Attach ref here

                    onChange={handleChange}
                  />
                  {errors.gstin && <p className="text-red-500">{errors.gstin}</p>}
                </div>
              </div>

              <div className="md:flex gap-5">
                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="tat">TAT: <span className="text-red-600">*</span></label>
                  <input
                    type="number"
                    name="tat"
                    id="tat"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.tat}
                    onChange={handleChange}
                    ref={(el) => (refs.current["tat"] = el)} // Attach ref here

                  />
                  {errors.tat && <p className="text-red-500">{errors.tat}</p>}
                </div>

                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="date_agreement">Date of Service Agreement:<span className="text-red-600">*</span></label>
                  <input
                    type="date"
                    name="date_agreement"
                    id="date_agreement"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.date_agreement}
                    onChange={handleChange}
                    ref={(el) => (refs.current["date_agreement"] = el)} // Attach ref here

                  />
                  {errors.date_agreement && <p className="text-red-500">{errors.date_agreement}</p>}
                </div>
              </div>

              <div className="md:flex gap-5">
                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="client_standard">Client Standard Procedure:</label>
                  <textarea name="client_standard"
                    id="client_standard"
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    value={input.client_standard}
                    rows={1}

                    onChange={handleChange}></textarea>
                </div>
                <div className="mb-4 md:w-6/12">
                  <label className="text-gray-500" htmlFor="agreement_period">Agreement Period</label>

                  <select name="agreement_period" // Attach ref here
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm" id="agreement_period" onChange={handleChange} value={input.agreement_period}>
                    <option value="Unless terminated" selected>Unless terminated</option>
                    <option value="1 year">1 year</option>
                    <option value="2 year">2 year</option>
                    <option value="3 year">3 year</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-gray-500" htmlFor="agr_upload">Agreement Upload:<span className="text-red-500">*</span></label>

                <input
                  ref={(el) => (refs.current["agr_upload"] = el)} // Attach ref here
                  type="file"
                  name="agr_upload"
                  id="agr_upload"
                  className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                  onChange={(e) => handleFileChange('agr_upload', e)}
                  accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                />
                {errors.agr_upload && <p className="text-red-500">{errors.agr_upload}</p>}

                <p className="text-gray-500 text-sm mt-2">
                  Only JPG, PNG, PDF, DOCX, and XLSX files are allowed. Max file size: 2MB.
                </p>
              </div>

              <div className="mb-4">
                <label className="text-gray-500" htmlFor="industry_classification">Industry Classification<span className="text-red-600">*</span></label>
                <input
                  type="text"
                  name="industry_classification"
                  id="industry_classification"
                  className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                  onChange={handleChange}
                  ref={(el) => (refs.current["industry_classifications"] = el)} // Attach ref here

                />
                {errors.industry_classification && <p className="text-red-500">{errors.industry_classification}</p>}

              </div>
              <div className="mb-4">
                <label className="text-gray-500" htmlFor="director_email">Director email
                </label>
                <input
                  type="email"
                  name="director_email"
                  id="director_email"
                  value={input.director_email}
                  className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                  onChange={handleChange}

                />

              </div>


              <div className="mb-4">
                <label className="text-gray-500" htmlFor="custom_template">Required Custom Template:<span className="text-red-600">*</span></label>
                <select
                  name="custom_template"
                  ref={(el) => (refs.current["custom_template"] = el)} // Attach ref here
                  id="custom_template"
                  value={input.custom_template || ''} // Ensure a default empty value if undefined
                  className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                  onChange={handleChange}
                >
                  <option value="">Select Option</option>
                  <option value="yes">yes</option>
                  <option value="no">no</option>
                </select>
                {errors.custom_template && <p className="text-red-500">{errors.custom_template}</p>}

                {input.custom_template === 'yes' && (
                  <>
                    <div className="mb-4">
                      <label htmlFor="custom_logo" className="text-gray-500">Upload Custom Logo :<span className="text-red-600">*</span></label>
                      <input
                        ref={(el) => (refs.current["custom_logo"] = el)} // Attach ref here
                        type="file"
                        name="custom_logo"
                        id="custom_logo"
                        className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                        onChange={(e) => handleFileChange('custom_logo', e)}
                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                      />
                      {errors.custom_logo && <p className="text-red-500">{errors.custom_logo}</p>}

                      <p className="text-gray-500 text-sm mt-2">
                        Only JPG, PNG, PDF, DOCX, and XLSX files are allowed. Max file size: 2MB.
                      </p>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="custom_address" className="text-gray-500">Custom Address</label>
                      <textarea
                        name="custom_address"
                        id="custom_address"
                        onChange={handleChange}
                        value={input.custom_address}
                        className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                      ></textarea>

                    </div>
                  </>
                )}
              </div>



              <div className="mb-4">
                <label className="text-gray-500" htmlFor="additional_login">Additional login Required</label>
                <div className="flex items-center gap-10 mt-4">
                  <div>
                    <input
                      type="radio"
                      name="additional_login"
                      value="yes"
                      checked={input.additional_login === "yes"}
                      onChange={handleChange}
                      className="me-2"
                    />Yes
                  </div>
                  <div>
                    <input
                      type="radio"
                      name="additional_login"
                      value="no"
                      checked={input.additional_login === "no"}
                      onChange={handleChange}
                      className="me-2"
                    />No
                  </div>
                </div>
                {input.additional_login === "yes" && (
                  <input
                    type="text"
                    name="username"
                    id="username"
                    placeholder="username2"
                    value={input.username}
                    className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                    onChange={handleChange}
                  />
                )}
              </div>


              <div className="my-8">
                <h3 className="text-lg font-semibold mb-4">Branch Details</h3>
                {branchForms.map((branch, index) => (
                  <div key={index} className="md:grid grid-cols-2 content-between items-center gap-4 mb-3">
                    <div>
                      <label className="text-gray-500" htmlFor={`branch_name_${index}`}>
                        Branch Name
                      </label>
                      <input
                        type="text"
                        name="branch_name"
                        id={`branch_name_${index}`}
                        className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                        value={branch.branch_name}
                        ref={(el) => (refs.current[`branch_name_${index}`] = el)} // Corrected ref key
                        onChange={(e) => handleChange(e, index)}
                      />


                    </div>
                    <div>
                      <label className="text-gray-500" htmlFor={`branch_email_${index}`}>
                        Branch Email
                      </label>
                      <input
                        type="email"
                        name="branch_email"
                        id={`branch_email_${index}`}
                        className="border w-full rounded-md p-2 mt-2 outline-none text-sm emailCheck"
                        value={branch.branch_email}
                        onChange={(e) => handleChange(e, index)}
                        ref={(el) => (refs.current[`branch_email_${index}`] = el)} // Corrected ref key

                      />

                    </div>
                    {index > 0 && (
                      <button
                        className="bg-red-500 rounded-md p-2 text-white mt-2 col-span-2"
                        type="button"
                        onClick={() => deleteField(index)}
                      >
                        Delete Branch
                      </button>
                    )}
                  </div>
                ))}

                <button
                  className="bg-[#3e76a5] text-white rounded-md p-2 mt-4"
                  type="button"
                  onClick={addMoreFields}
                >
                  Add More Branches
                </button>
              </div>
              <div className="mb-4 flex gap-2 justify-start items-center">
                <input
                  type="checkbox"
                  name="custom_bgv"
                  id="custom_bgv"
                  className="border rounded-md p-2 mt-0 outline-none text-sm"
                  onChange={handleCheckBoxChange}
                  value={custom_bgv}
                  ref={(el) => (refs.current['custom_bgv'] = el)} // Corrected ref key

                />
                <label className="text-gray-500" htmlFor="agr_upload">Custom BGV</label>
              </div>
              <ClientManagementData />
              <div className="flex justify-center">
                <button
                  type="submit"
                  className={`w-full rounded-md p-3 text-white ${isLoading || isApiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}

                  disabled={isLoading || isApiLoading}
                >
                  {isLoading ? 'Processing...' : 'Send'}

                </button>
              </div>

            </form>)}
        </div>

      </div >
    </>
  );
};

export default ClientManagement;
