import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useService } from "./ServicesContext";
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext

const ServiceForms = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext

    const { selectedService } = useService();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [disableAdinput, setDisableAdinput] = useState(null);
    const [formData, setFormData] = useState(() => {
        const hasServiceData = selectedService?.json;

        if (hasServiceData) {
            let serviceArray;
            try {
                serviceArray = JSON.parse(selectedService.json);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                return {
                    heading: '',
                    db_table: '',
                    headers: [''],
                    rows: [],
                };
            }

            if (serviceArray) {

                const heading = serviceArray.heading || '';
                const rows = serviceArray.rows || []; // Ensure rows are handled safely


                return {
                    heading: heading,
                    db_table: heading ? heading.toLowerCase().replace(/\s+/g, '_') : '', // Use heading if available
                    headers: serviceArray.headers?.filter(header => header !== 'PARTICULARS') || [''],
                    rows: rows.map(row => ({
                        inputs: row.inputs?.map(input => ({
                            label: input.label || '',
                            name: input.name || '',
                            type: input.type || 'text',
                            options: input.options || [],
                            multiple: input.multiple || false,
                            required: input.required || false,
                        })) || [],
                    })) || [],
                };
            }
        }

        // Default fallback when no service data is present
        return {
            heading: '',
            headers: [''],
            rows: [],
        };
    });




    // Handling heading change
    const handleHeadingChange = (e) => {
        setFormData({ ...formData, heading: e.target.value });
    };

    // Handling header change
    const handleHeaderChange = (e, index) => {
        const newHeaders = [...formData.headers];
        newHeaders[index] = e.target.value;
        setFormData({ ...formData, headers: newHeaders });
    };

    // Adding a new header
    const handleAddHeader = () => {
        if (formData.headers.length < 2) {
            setFormData({ ...formData, headers: [...formData.headers, ''] });
        }
    };

    // Removing a header
    const handleRemoveHeader = (index) => {
        const newHeaders = formData.headers.filter((_, i) => i !== index);
        setFormData({ ...formData, headers: newHeaders });
    };

    // Adding a new row (label + inputs)
    const handleAddRow = () => {
        let isValid = true;
        let alertTriggered = false;
        let invalidOptions = [];

        // Validate rows for invalid dropdown options
        formData.rows.forEach(row => {
            row.inputs.forEach(input => {
                if (input.type === "dropdown" && (!input.options || input.options.length <= 0 || !input.options.every(option => option.showText))) {
                    isValid = false;
                    // Collect invalid options for the alert message
                    input.options.forEach(option => {
                        if (!option.showText) {
                            invalidOptions.push(option); // Push invalid options here
                        }
                    });
                }
            });
        });

        // Show alert only once if there are invalid options
        // if (!isValid && !alertTriggered && invalidOptions.length > 0) {
        //     const invalidOptionsDetails = invalidOptions.map(option => `ShowText: ${option.showText || "N/A"}`).join("\n");

        //     Swal.fire({
        //         icon: 'error',
        //         title: 'Incomplete Form',
        //         text: `Please fill options for all dropdowns. Invalid options:\n${invalidOptionsDetails}`,
        //     });
        //     alertTriggered = true;
        // }

        // If the form is valid, add a new row
        if (isValid) {
            const newRow = {
                inputs: [
                    // Add default inputs for the new row if necessary
                    {
                        label: "", // Modify as needed
                        name: "default_name",
                        type: "text",
                    }
                ],
            };

            setFormData({ ...formData, rows: [...formData.rows, newRow] });
        }
    };


    // Removing a row
    const handleRemoveRow = (rowIndex) => {
        const newRows = formData.rows.filter((_, i) => i !== rowIndex);
        setFormData({ ...formData, rows: newRows });
    };
    const handleLabelChange = (e, rowIndex) => {
        const newRows = [...formData.rows];
        const newLabel = e.target.value;

        // Remove the outer label at the row level
        delete newRows[rowIndex].label;

        // Ensure the label is inside the inputs array
        if (newRows[rowIndex].inputs.length === 0) {
            // If there are no inputs, add the label as the first input
            const newInput = {
                label: newLabel,
                name: newLabel.toLowerCase().replace(/\s+/g, '_'),
                type: 'text',  // default type is text
            };
            newRows[rowIndex].inputs.push(newInput);
        } else {
            // If inputs already exist, update the label in the first input
            const labelName = newLabel.toLowerCase().replace(/\s+/g, '_');
            newRows[rowIndex].inputs.forEach((input, index) => {
                // Add unique name if the label is duplicated
                input.label = newLabel;
                input.name = `${labelName}`; // ensure uniqueness for names
            });
        }

        // Update the formData state with the modified rows
        setFormData({ ...formData, rows: newRows });
    };

    // Example of how you could add rows or inputs dynamically


    const handleAddInput = (rowIndex) => {
        const newRows = [...formData.rows];
        const row = newRows[rowIndex];
        const label = row.inputs[0]?.label;  // Use the label from the first input if present
        const currentInputs = row.inputs.length;
        const totalHeaders = formData.headers.length;
        const inputType = 'text';  // Default input type can be changed


        if (currentInputs < totalHeaders) {
            if (label) {
                const labelName = label.toLowerCase().replace(/\s+/g, '_');
                const newInput = {
                    label: label,
                    name: `${labelName}`,  // Ensure uniqueness by appending index
                    type: 'text'
                };
                if (inputType === 'checkbox') {
                    newInput.options = [{ value: '', showText: '' }];
                }
                if (inputType === 'file') {
                    newInput.multiple = true;
                }
                newInput.required = newInput.required || false;

                // Clean up unnecessary properties for specific input types
                if (newInput.options && newInput.options.length === 0) {
                    delete newInput.options;
                }
                if (newInput.multiple === false) {
                    delete newInput.multiple;
                }
                if (newInput.required === false) {
                    delete newInput.required;
                }
                row.inputs.push(newInput);  // Add the new input to the row
                setFormData({ ...formData, rows: newRows });
            }
        }
    };




    // Update input fields dynamically
    const handleInputChange = (e, rowIndex, inputIndex, field) => {
        const newRows = [...formData.rows];
        const input = newRows[rowIndex].inputs[inputIndex];
        input[field] = e.target.value;
        setFormData({ ...formData, rows: newRows });
    };

    // Remove an input
    const handleRemoveInput = (rowIndex, inputIndex) => {
        const newRows = [...formData.rows];
        newRows[rowIndex].inputs = newRows[rowIndex].inputs.filter((_, i) => i !== inputIndex);
        newRows[rowIndex].currentInputIndex = Math.max(0, newRows[rowIndex].inputs.length - 1);
        setFormData({ ...formData, rows: newRows });
    };

    // Handle options for dropdowns
    const handleOptionChange = (e, rowIndex, inputIndex, optionIndex, field) => {
        const newRows = [...formData.rows];
        const option = newRows[rowIndex].inputs[inputIndex].options[optionIndex];
        option[field] = e.target.value;
        setFormData({ ...formData, rows: newRows });
    };

    // Add an option to a dropdown
    const handleAddOption = (rowIndex, inputIndex) => {
        const newRows = [...formData.rows];
        const input = newRows[rowIndex].inputs[inputIndex];

        // Ensure that options is initialized as an empty array if it's not already
        if (!input.options) {
            input.options = [];
        }

        // Now it's safe to push a new option
        input.options.push({ value: '', showText: '' });

        // Update the formData state with the new rows
        setFormData({ ...formData, rows: newRows });
    };

    // Remove an option from a dropdown
    const handleRemoveOption = (rowIndex, inputIndex, optionIndex) => {
        const newRows = [...formData.rows];
        const input = newRows[rowIndex].inputs[inputIndex];
        input.options.splice(optionIndex, 1);
        setFormData({ ...formData, rows: newRows });
    };

    // Move to the previous step
    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    // Move to the next step
    const handleNext = () => {
        let isValid = true;
        let alertTriggered = false;

        // if (step !== 1) {
        //     formData.rows.forEach(row => {
        //         row.inputs.forEach(input => {
        //             if (input.type === "dropdown" &&
        //                 (!input.options || input.options.length <= 0 ||
        //                     !input.options.every(option => option.showText))) {
        //                 isValid = false;
        //                 if (!alertTriggered) {
        //                     Swal.fire({
        //                         icon: 'error',
        //                         title: 'Incomplete Form',
        //                         text: 'Please fill options for all dropdowns!',
        //                     });
        //                     alertTriggered = true;
        //                 }
        //             }
        //         });
        //     });
        // }

        if (isValid && step < 3) {
            setStep(step + 1);
        }
    };



    const handleSubmit = () => {
        // Check if necessary data is available before proceeding
        if (!formData || !selectedService || !formData.heading || !formData.json) {
            Swal.fire('Error!', 'No data to submit. Please fill in the required fields.', 'error');
            return; // Return early if data is not available
        }
    
        setIsApiLoading(true);  // Set the loading state to true
        setLoading(true); // Set another loading state (optional, depending on your UI)
    
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const _token = localStorage.getItem("_token");
    
        if (!admin_id || !_token) {
            console.error("Missing admin_id or _token in localStorage.");
            setLoading(false);
            setIsApiLoading(false);
            return;
        }
    
        const db_table = formData.heading.replace(/\s+/g, '_').toLowerCase(); // Replace spaces with underscores and convert to lowercase
    
        const updatedFormData = {
            ...formData,
            db_table: db_table, // Add the db_table property with spaces replaced by '_'
        };
    
        const jsonString = JSON.stringify(updatedFormData);
        const raw = JSON.stringify({
            service_id: selectedService.id,
            json: jsonString,
            admin_id: parseInt(admin_id),
            _token,
        });
    
        const requestOptions = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: raw,
            redirect: "follow",
        };
    
        // Show SweetAlert loading dialog
        Swal.fire({
            title: 'Loading...',
            text: 'Please wait while we process your request.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();  // Show the loading animation
            },
        });
    
        fetch("https://api.goldquestglobal.in/json-form/generate-report/update", requestOptions)
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        // Handle invalid token case
                        if (errorData.message && errorData.message.toLowerCase().includes("invalid token")) {
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                window.location.href = "/admin-login"; // Redirect to login if session expired
                            });
                        } else {
                            Swal.fire('Error!', `An error occurred: ${errorData.message}`, 'error');
                        }
                        throw new Error(errorData.message); // Propagate the error
                    });
                }
                return response.json(); // Parse the response if it's OK
            })
            .then((result) => {
                const newToken = result.token || result._token;
    
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                if (result.status === false) {
                    Swal.fire('Error!', result.message, 'error');
                    return; // Exit early if status is false
                }
    
                // Display success message
                Swal.fire({
                    title: "Success!",
                    text: "Service Form Edited Successfully",
                    icon: "success",
                    confirmButtonText: "Ok",
                });
    
            })
            .catch((error) => {
                console.error("API Error:", error.message);
                // Optionally, you can show a generic error message in case of unexpected issues.
                Swal.fire('Error!', 'Something went wrong. Please try again later.', 'error');
            })
            .finally(() => {
                setLoading(false);  // Stop loading
                setIsApiLoading(false);  // Stop the API loading spinner
            });
    };
    


    return (
        <div className="bg-[#f7fafc] md:w-10/12 md:mx-auto m-4 mt-10 border border-gray-300 md:p-6 p-3 rounded-lg shadow-lg">
            <h2 className="md:text-3xl font-bold py-3 text-center text-[#2d3b44] mb-4">
                GENERATE REPORT SERVICE FORM
            </h2>

            {step === 1 && (
                <div className="bg-white p-6 w-full border-t border-gray-300 mx-auto rounded-lg">


                    <h3 className="text-lg font-semibold mb-3">Step 1: Define Heading and Headers</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Heading:</label>
                        <input
                            type="text"
                            value={formData.heading}
                            onChange={handleHeadingChange}
                            className="border px-4 py-2 w-full rounded-lg mt-2"
                        />
                    </div>
                    <label className="block text-sm font-medium text-gray-700">Headers:</label>

                    <div className="mb-4 md:grid grid-cols-2 gap-2">
                        {formData.headers.filter(header => header !== "PARTICULARS").map((header, index) => (
                            <div key={index} className="flex justify-between items-center space-x-2 mb-2">
                                <input
                                    type="text"
                                    value={header}
                                    onChange={(e) => handleHeaderChange(e, index)}
                                    className="border px-4 py-2 rounded-lg w-3/4"
                                />

                                <button
                                    onClick={() => handleRemoveHeader(index)}
                                    className="bg-red-500 text-white px-2 py-1 rounded"
                                >
                                    -
                                </button>
                            </div>
                        ))}

                    </div>
                    {formData.headers.length < 2 && (
                        <button
                            onClick={handleAddHeader}
                            className="bg-blue-500 text-white px-2 py-1 rounded-lg"
                        >
                            +
                        </button>
                    )}
                    <div className="flex justify-end  mt-6">

                        <div
                            onClick={handleNext}
                            className="flex items-center justify-center w-24 space-x-3 p-2 rounded-lg bg-[#3e76a5] text-white hover:bg-green-800 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <span className="font-semibold text-lg">Next</span>
                            <FaChevronRight className="text-xl text-white" />
                        </div>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="bg-white md:p-6 p-2 w-full border-t border-gray-300 mx-auto rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Step 2: Define Labels and Inputs</h3>

                    {formData.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="p-4 mb-4 border border-black rounded-md">
                            <div className='flex justify-end'>
                                <button
                                    className="text-red-500 text-end  hover:text-gray-700 focus:outline-none w-auto "
                                    onClick={() => handleRemoveRow(rowIndex)}
                                >
                                    ✖
                                </button>
                            </div>
                            <div className="md:p-4 rounded-md space-y-2">

                                <h4 className="text-sm font-medium text-gray-800">
                                   {row.row_heading || row.heading || 'NIL'}
                                </h4>
                                <div >
                                    {row.inputs.map((input, inputIndex) => (
                                        <>
                                            <div className='mb-2'>
                                                <label className="block text-sm font-medium text-gray-700">Label:</label>
                                                <input
                                                    type="text"
                                                    value={input.label}
                                                    onChange={(e) => handleLabelChange(e, rowIndex)}
                                                    className="border px-4 py-2 w-full rounded-lg"
                                                />
                                            </div>
                                            <div key={inputIndex} className="flex flex-col gap-4 p-4 border mb-4 rounded-lg shadow-sm">
                                                {/* Input heading rendered from formData.headers */}
                                                {formData.headers[inputIndex] && (
                                                    <h4 className="text-sm font-medium text-gray-800">
                                                        Input Type
                                                    </h4>
                                                )}

                                                <div className="md:flex items-center justify-between">
                                                    <select
                                                        value={input.type}
                                                        onChange={(e) => handleInputChange(e, rowIndex, inputIndex, 'type')}
                                                        className="border border-gray-300 rounded-lg p-2 mb-2 w-full md:w-10/12 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="dropdown">Dropdown</option>
                                                        <option value="file">File</option>
                                                        <option value="datepicker">datepicker</option>
                                                        <option value="email">Email</option>
                                                        <option value="number">Number</option>
                                                    </select>

                                                    <button
                                                        onClick={() => handleRemoveInput(rowIndex, inputIndex)}
                                                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                {/* Show options for select/dropdown */}
                                                {input.type === 'dropdown' && (
                                                    <div className="mt-4">
                                                        <h4 className="text-lg font-semibold mb-2">Options</h4>
                                                        {input.options?.map((option, optionIndex) => (
                                                            <div key={optionIndex} className="md:flex items-center gap-4 mb-2">
                                                                <div className="flex-1">
                                                                    <input
                                                                        type="text"
                                                                        value={option.value}
                                                                        onChange={(e) =>
                                                                            handleOptionChange(e, rowIndex, inputIndex, optionIndex, 'value')
                                                                        }
                                                                        placeholder="Option value"
                                                                        className="border border-gray-300 mb-2 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <input
                                                                        type="text"
                                                                        value={option.showText}
                                                                        onChange={(e) =>
                                                                            handleOptionChange(e, rowIndex, inputIndex, optionIndex, 'showText')
                                                                        }
                                                                        placeholder="Option text"
                                                                        className="border border-gray-300 mb-2 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemoveOption(rowIndex, inputIndex, optionIndex)}
                                                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                                                >
                                                                    Remove Option
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => handleAddOption(rowIndex, inputIndex)}
                                                            className="bg-[#3e76a5] text-white px-4 py-2 rounded-lg hover:bg-[#3e76a5] focus:outline-none focus:ring-2 focus:ring-green-400 mt-4"
                                                        >
                                                            Add Option
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Show file options (single/multiple) */}
                                                {input.type === 'file' && (
                                                    <div className="mt-4">
                                                        <label className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={input.multiple}
                                                                onChange={(e) =>
                                                                    handleInputChange(e, rowIndex, inputIndex, 'multiple')
                                                                }
                                                                className="focus:ring-2 focus:ring-blue-400"
                                                            />
                                                            Allow multiple files
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ))}

                                </div>
                                <button
                                    onClick={() => handleAddInput(rowIndex)}
                                    className={`bg-[#3e76a5] text-white px-3 py-1 rounded-lg : ""
                                        }`} >
                                    Add Input
                                </button>
                            </div>
                        </div>

                    ))}
                    <div className="mb-4">
                        <button
                            onClick={handleAddRow}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4"
                        >
                            Add Label
                        </button>
                    </div>
                    <div className="flex justify-between mt-6">
                        <div
                            onClick={handleBack}
                            className="flex items-center w-24 justify-center space-x-3 p-2 rounded-lg bg-[#3e76a5] text-white hover:bg-green-800 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <FaChevronLeft className="text-xl text-white" />
                            <span className="font-semibold text-lg">Back</span>
                        </div>

                        <div
                            onClick={handleNext}
                            className="flex items-center justify-center w-24 space-x-3 p-2 rounded-lg bg-[#3e76a5] text-white hover:bg-green-800 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <span className="font-semibold text-lg">Next</span>
                            <FaChevronRight className="text-xl text-white" />
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="bg-white p-6 w-full border-t border-gray-300 mx-auto rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Step 3: Preview</h3>
                    <div className="py-3">
                        <div className='bg-[#3e76a5] border  border-white rounded-t-md p-4'>
                            <h3 className="text-center md:text-2xl font-semibold text-white">{formData.heading}</h3>
                        </div>
                        <div className='overflow-x-auto'>
                            <table className=" border border-t-0 rounded-md w-full">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="py-2 px-4 border border-gray-300 text-left">PARTICULARS</th>
                                        {formData.headers
                                            .filter(header => header !== "PARTICULARS")
                                            .map((header, index) => (
                                                <th key={index} className="py-2 px-4 border border-gray-300 text-left">
                                                    {header}
                                                </th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData?.rows?.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {/* Render the label in the first column */}
                                            <td className="py-2 px-4 border border-gray-300">
                                                {row.inputs[0]?.label} {/* Assuming the label for the first input */}
                                            </td>

                                            {/* Render the corresponding input fields */}
                                            {row.inputs.map((input, inputIndex) => (
                                                <td key={inputIndex} className="py-2 px-4 border border-gray-300">
                                                    {input.type === "text" ? (
                                                        <input
                                                            type="text"
                                                            name={input.name}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            readOnly
                                                        />
                                                    ) : input.type === "checkbox" ? (
                                                        <input
                                                            type="checkbox"
                                                            name={input.name}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            readOnly
                                                        />
                                                    ) : input.type === "email" ? (
                                                        <input
                                                            type="email"
                                                            name={input.name}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            readOnly
                                                        />
                                                    ) : input.type === "dropdown" ? (
                                                        <select
                                                            name={input.name}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            readOnly
                                                        >
                                                            <option value="">Select an option</option>
                                                            {input.options.map((option, optionIndex) => (
                                                                <option key={optionIndex} value={option.value}>
                                                                    {option.showText}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : input.type === "file" ? (
                                                        <input
                                                            type="file"
                                                            name={input.name}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            readOnly
                                                        />
                                                    ) : input.type === "datepicker" ? (
                                                        <input
                                                            type="date"
                                                            name={input.name}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            readOnly
                                                        />
                                                    ) : input.type === "number" ? (
                                                        <input
                                                            type="number"
                                                            name={input.name}
                                                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            readOnly
                                                        />
                                                    ) : null}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex justify-between mt-6">


                    </div>
                    <div className="flex justify-between mt-6">
                        <div
                            onClick={handleBack}
                            className="flex items-center w-24 justify-center space-x-3 p-2 rounded-lg bg-[#3e76a5] text-white hover:bg-green-800 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <FaChevronLeft className="text-xl text-white" />
                            <span className="font-semibold text-lg">Back</span>
                        </div>

                        <button
                            className={`bg-[#3e76a5] text-white px-4 py-2 rounded-lg ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                            onClick={handleSubmit}
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceForms;