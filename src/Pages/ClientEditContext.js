import React, { createContext, useState, useRef, useCallback, useContext } from 'react';
import Swal from 'sweetalert2';
import { useApi } from '../ApiContext';

import axios from 'axios';
const ClientEditContext = createContext();


export const ClientEditProvider = ({ children }) => {
    const refs = useRef({});
    const [errors, setErrors] = useState({});
    const [admins, setAdmins] = useState([]);
    const [files, setFiles] = useState([]);
    const API_URL = useApi();
    const [loading, setLoading] = useState(false);
    const [clientData, setClientData] = useState();
    const [custom_bgv, setCustom_Bgv] = useState(0);

    const uploadCustomerLogo = async (admin_id, customerInsertId,) => {
        const fileCount = Object.keys(files).length;

        for (const [index, [key, value]] of Object.entries(files).entries()) {
            const storedToken = localStorage.getItem("_token");
            const customerLogoFormData = new FormData();
            customerLogoFormData.append('admin_id', admin_id);
            customerLogoFormData.append('_token', storedToken);
            customerLogoFormData.append('customer_code', clientData.client_unique_id);
            customerLogoFormData.append('customer_id', customerInsertId);
            for (const file of value) {
                customerLogoFormData.append('images', file);
                customerLogoFormData.append('upload_category', key);
            }
            if (fileCount === (index + 1)) {
                customerLogoFormData.append('company_name', clientData.name);
            }

            try {
                const response = await axios.post(
                    `${API_URL}/customer/upload`,
                    customerLogoFormData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                // Extract new token from response and update localStorage
                const newToken = response.data._token || response.data.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                    storedToken = newToken; // Update the token for subsequent requests
                }
                if (response && response.toLowerCase().includes("invalid") && response.toLowerCase().includes("token")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "Ok",
                    }).then(() => {
                        // Redirect to admin login page
                        window.location.href = "/admin-login"; // Replace with your login route
                    });
                }
            } catch (err) {
                Swal.fire('Error!', `An error occurred while uploading logo: ${err.message}`, 'error');
            }
        }
    };


    const handleClientChange = useCallback((e) => {
        const { name, value, type, files } = e.target;
        setClientData((prevData) => ({
            ...prevData,
            [name]: type === 'file' ? files[0] : value,
        }));
    }, []);



    const validate = () => {
        const newErrors = {};
        const requiredFields = [
            "name", "address", "state_code", "state", "mobile",
            "address",
            "contact_person_name",
            "escalation_admin_id",
            "single_point_of_contact",
            "gst_number",
            "tat_days",
            "agreement_date",
            "custom_template",
            "state",
            "state_code",
            "industry_classification",
        ];

        const maxSize = 2 * 1024 * 1024;
        const allowedTypes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        const validateFile = (fileName) => {

            if (errors[fileName] && errors[fileName].length > 0) {
                return errors[fileName];
            } else {
                const file = fileName === 'custom_logo' ? files.custom_logo : files.agr_upload;
                let errors = [];

                if (file && file.length > 0) {
                    file.forEach((file) => {
                        if (file.size > maxSize) {
                            errors.push(`${file.name}: File size must be less than 2MB.`);
                        }

                        if (!allowedTypes.includes(file.type)) {
                            errors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
                        }
                    });
                }

                return errors;
            }
        };


        if (clientData.custom_template === 'yes') {
            const customLogoErrors = validateFile('custom_logo');
            if (customLogoErrors.length > 0) {
                newErrors.custom_logo = customLogoErrors;
            }
        }

        const agrUploadErrors = validateFile('agr_upload');
        if (agrUploadErrors.length > 0) {
            newErrors.agr_upload = agrUploadErrors;
        }

        requiredFields.forEach((field) => {
            if (!clientData[field]) {
                newErrors[field] = "This field is required*";
            }
        });



        return newErrors;
    };

    const handleClientSubmit = async (e) => {
      e.preventDefault();
      const fileCount = Object.keys(files).length;
  
      let newErrors = {};
  
      const validationError = validate();
  
      // Collect all validation errors
      Object.keys(validationError).forEach((key) => {
          if (validationError[key]) {
              newErrors[key] = validationError[key];
          }
      });
  
      // If there are validation errors, focus on the first error field and return
      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
  
          const errorField = Object.keys(newErrors)[0];
          if (refs.current[errorField]) {
              refs.current[errorField].focus();
          }
  
          setLoading(false);
          return;
      } else {
          setErrors({});
      }
  
      const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
      const storedToken = localStorage.getItem("_token");
  
      if (!admin_id || !storedToken) {
          Swal.fire('Error!', 'Admin ID or token is missing.', 'error');
          setLoading(false);
          return;
      }
  
      setLoading(true);
  
      // Validate clientData fields
      if (!clientData.name || !clientData.client_unique_id) {
          Swal.fire('Error!', 'Missing required fields: Name or Client Unique ID', 'error');
          setLoading(false);
          return;
      }
  
      // Convert agreement_date to locale date string if it exists
      if (clientData.agreement_date) {
          const date = new Date(clientData.agreement_date);
          clientData.agreement_date = date.toLocaleDateString('en-CA'); // 'en-CA' ensures 'YYYY-MM-DD' format
      }
  
      const raw = JSON.stringify({
          ...clientData,
          admin_id,
          custom_bgv: custom_bgv || clientData.is_custom_bgv,
          _token: storedToken,
      });
  
      const requestOptions = {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: raw,
          redirect: "follow"
      };
  
      try {
          const response = await fetch(`${API_URL}/customer/update`, requestOptions);
          const contentType = response.headers.get("content-type");
  
          const data = contentType && contentType.includes("application/json") ? await response.json() : {};
          const newToken = data._token || data.token;
  
          if (newToken) {
              localStorage.setItem("_token", newToken);
          }
  
          // Check for session expiry in response
          if (data.message && data.message.toLowerCase().includes("invalid") && data.message.toLowerCase().includes("token")) {
              Swal.fire({
                  title: "Session Expired",
                  text: "Your session has expired. Please log in again.",
                  icon: "warning",
                  confirmButtonText: "Ok",
              }).then(() => {
                  window.location.href = "/admin-login"; // Redirect to admin login page
              });
              return;
          }
  
          if (!response.ok) {
              const errorMessage = data.message || 'An error occurred'; // Show API message if present
              Swal.fire('Error!', errorMessage, 'error');
              return;
          }
  
          const customerInsertId = clientData.customer_id;
  
          // Show the success message from API (if available)
          const successMessage = data.message || 'Client Updated Successfully.'; // API response message if any
  
          if (fileCount === 0) {
              Swal.fire({
                  title: "Success",
                  text: successMessage,
                  icon: "success",
                  confirmButtonText: "Ok",
              });
              
          } else {
              // Proceed to upload files if files exist
              await uploadCustomerLogo(admin_id, customerInsertId);
              Swal.fire({
                  title: "Success",
                  text: successMessage,
                  icon: "success",
                  confirmButtonText: "Ok",
              });
          }
  
      } catch (error) {
          Swal.fire('Error!', 'There was a problem with the fetch operation.', 'error');
          console.error('Fetch error:', error);
      } finally {
          setLoading(false);
      }
  };
  
      






    return (
        <ClientEditContext.Provider value={{ loading, admins, setAdmins, clientData, errors, setErrors, setClientData, setCustom_Bgv, refs, custom_bgv, handleClientChange, handleClientSubmit, setFiles, files, loading }}>
            {children}
        </ClientEditContext.Provider>
    );
};


export const useEditClient = () => useContext(ClientEditContext);
