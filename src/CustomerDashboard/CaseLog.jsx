import React, { useEffect, useState, useRef } from 'react';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import * as XLSX from 'xlsx';

import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';
import Swal from 'sweetalert2';
const CaseLog = () => {
    const [conversationMsg, setConversationMsg] = useState([]);
    const { isBranchApiLoading, setIsBranchApiLoading,checkBranchAuthentication } = useApiCall();

    const [showPopup, setShowPopup] = useState(false);
    const [data, setData] = useState([]);
    const [conversation, setConversation] = useState([]);
    const messageEndRef = useRef(null);
    const [loading, setLoading] = useState(null);
    const [formLoading, setFormLoading] = useState(null);
    const [viewLoading, setViewLoading] = useState(null);

    const [ticket, setTicket] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
    });
    const [passError, setPassError] = useState({});

    const [messages, setMessages] = useState([
        { sender: "bot", text: "Hello! How can I assist you with your ticket today?" },
    ]);
    const [userInput, setUserInput] = useState("");


    const replyTickets = (ticket_number, msg) => {
        setTicket(ticket_number);
        setShowPopup(true); // Show the popup
        setIsBranchApiLoading(true); // Start loading state
        setViewLoading(true); // Start loading state
        setConversationMsg(msg);

        const branchData = JSON.parse(localStorage.getItem("branch"));
        const branch_id = branchData?.branch_id;
        const branch_token = localStorage.getItem("branch_token");

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };
        const payLoad = {
            branch_id: branch_id,
            _token: branch_token,
            ticket_number: ticket_number,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
        };

        // Zet het object om naar een query string
        const queryString = new URLSearchParams(payLoad).toString();


        fetch(`https://api.goldquestglobal.in/branch/ticket/view?${queryString}`, requestOptions)
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((result) => {
                        const errorMessage = result.message || 'An unexpected error occurred.';

                        // Check if the token has expired
                        if (
                            errorMessage.toLowerCase().includes("invalid") &&
                            errorMessage.toLowerCase().includes("token")
                        ) {
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                const branchEmail = branchData?.email || ""; // Extract branch email
                                window.open(
                                    `/customer-login?email=${encodeURIComponent(branchEmail)}`,
                                    "_self" // Open in the same tab
                                );
                            });
                        } else {
                            // Display error message from API
                            Swal.fire({
                                title: 'Error',
                                text: result.message || 'An unexpected error occurred. Please try again.',
                                icon: 'error',
                                confirmButtonText: 'OK',
                            });
                        }
                        throw new Error(errorMessage); // Stop further processing in case of error
                    });
                }
                return response.json(); // Return the successful response
            })
            .then((result) => {
                // Save new token if available
                const newToken = result.token || result._token || "";
                if (newToken) {
                    localStorage.setItem("branch_token", newToken); // Save new token
                }

                if (result.error) {
                    // Show API-level error message
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'An unexpected error occurred. Please try again.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                    });
                } else {
                    // Successfully fetched conversations, update state
                    setConversation(result.branches?.conversations || []);

                    // Scroll to the last message
                    setTimeout(() => {
                        if (messageEndRef.current) {
                            messageEndRef.current.scrollIntoView({
                                behavior: "smooth",
                                block: "end",
                                inline: "nearest"
                            });

                            // Add an offset of 40 pixels
                            window.scrollBy(0, 40);
                        }
                    }, 0); // Use a small timeout to ensure DOM updates before scrolling
                }
            })
            .catch((error) => {
                console.error(error);
                // Handle unexpected errors
                Swal.fire({
                    title: 'Error',
                    text: 'An unexpected error occurred. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            })
            .finally(() => {
                setViewLoading(false); // Stop loading state once the request is done
                setIsBranchApiLoading(false); // Stop loading state once the request is done
            });
    };


    const handleSend = () => {
        const branchData = JSON.parse(localStorage.getItem("branch"));
        const branch_id = branchData?.branch_id;
        const branch_token = localStorage.getItem("branch_token");

        // Set loading state to true when starting the request
        setIsBranchApiLoading(true);
        setFormLoading(true);

        if (userInput.trim()) {
            const userMessage = { sender: "user", text: userInput };
            const botReply = { sender: "bot", text: "Thank you for your message. We'll look into it!" };
            setMessages([...messages, userMessage, botReply]);
            setUserInput("");
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "ticket_number": ticket,
            "message": userInput,
            "branch_id": branch_id,
            "_token": branch_token,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),

        });


        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        fetch("https://api.goldquestglobal.in/branch/ticket/chat", requestOptions)
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((result) => {
                        const errorMessage = result.message || "An unexpected error occurred.";

                        // Check if the session token has expired
                        if (errorMessage.toLowerCase().includes("invalid") && errorMessage.toLowerCase().includes("token")) {
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                // Redirect to customer login page
                                window.open(
                                    `/customer-login?email=${encodeURIComponent(branchData?.email || "")}`,
                                    "_self"
                                );
                            });
                        }

                        // Update token if needed
                        const newToken = result._token || result.token;
                        if (newToken) {
                            localStorage.setItem("branch_token", newToken);
                        }

                        // Show error message from API
                        Swal.fire({
                            title: 'Error',
                            text: errorMessage,
                            icon: 'error',
                            confirmButtonText: 'OK',
                        });
                        throw new Error(errorMessage);  // Stop further processing
                    });
                }
                return response.json();  // Successful response, process it
            })
            .then((result) => {
                if (result.error) {
                    // Handle API-level errors
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'An unexpected error occurred.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                    });
                } else {
                    // Refresh the conversation with updated messages
                    replyTickets(ticket,conversationMsg);

                    // Optionally, update token if received in response
                    const newToken = result._token || result.token;
                    if (newToken) {
                        localStorage.setItem("branch_token", newToken);
                    }
                }
            })
            .catch((error) => {
                console.error("Error occurred:", error);
                // Show a generic error message
                Swal.fire({
                    title: 'Error',
                    text: "An error occurred while sending the message. Please try again later.",
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            })
            .finally(() => {
                // Stop loading states once the process is complete
                setFormLoading(false);
                setIsBranchApiLoading(false);
            });
    };


    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (passError[name]) {
            setPassError((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const errors = {};
        if (!formData.title) errors.title = 'Title is required';
        if (!formData.description) errors.description = 'Description is required';
        return errors;
    };


    const [itemsPerPage, setItemPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = data.filter(item => {
        return (
            item.title.toLowerCase().includes(searchTerm.toLowerCase())

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


    const handleClose = () => {
        setShowPopup(false); // Close the popup
    };

    const fetchTickets = () => {
        const branchData = JSON.parse(localStorage.getItem("branch"));
        const branch_id = branchData?.branch_id;
        const branch_token = localStorage.getItem("branch_token");

        // Check if branch_id or branch_token are missing
        if (!branch_id || !branch_token) {
            console.error("Branch ID or token is missing.");
            return;
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };


        setIsBranchApiLoading(true); // Set loading state to true
        setLoading(true); // Set loading state to true
        const payLoad = {
            branch_id: branch_id,
            _token: branch_token,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
        };

        // Zet het object om naar een query string
        const queryString = new URLSearchParams(payLoad).toString();

        // Make the API request to fetch tickets
        fetch(`https://api.goldquestglobal.in/branch/ticket/list?${queryString}`, requestOptions)
            .then((response) => response.json())  // Always parse response as JSON
            .then((result) => {
                const errorMessage = result.message || "An unexpected error occurred.";

                // Check for session expiry or invalid token
                if (result.status === false && errorMessage.toLowerCase().includes("invalid") && errorMessage.toLowerCase().includes("token")) {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "OK",
                    }).then(() => {
                        // Redirect to the login page with branch email
                        window.location.href = `/customer-login?email=${encodeURIComponent(branchData?.email || "")}`;
                    });
                    return;  // Exit if token is invalid
                }

                // If the result is successful (status is true)
                if (result.status === true) {
                    setData(result.branches || []); // Set the tickets data to state

                    // Check if a new token is provided in the response
                    const newToken = result._token || result.token;
                    if (newToken) {
                        localStorage.setItem("branch_token", newToken); // Update the token in localStorage
                    }
                } else {
                    // Handle errors or failure status in response
                    Swal.fire({
                        title: 'Error',
                        text: errorMessage,
                        icon: 'error',
                        confirmButtonText: 'OK',
                    });
                }
            })
            .catch((error) => {
                console.error(error);
                // Handle network errors or unexpected issues
                Swal.fire({
                    title: 'Error',
                    text: 'An error occurred while fetching the tickets. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            })
            .finally(() => {
                // Reset loading states after the operation
                setLoading(false);
                setIsBranchApiLoading(false);
            });
    };



    // Make sure branch_id and branch_token are available
   useEffect(() => {
         const fetchDataMain = async () => {
           if (!isBranchApiLoading) {
             await checkBranchAuthentication();
             await fetchTickets();
           }
         };
     
         fetchDataMain();
       }, []);

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent form submission from reloading the page

        const branchData = JSON.parse(localStorage.getItem("branch"));
        const branch_id = branchData?.branch_id;
        const branch_token = localStorage.getItem("branch_token");


        // Validate the form data
        const formError = validate();
        if (Object.keys(formError).length > 0) {
            setPassError(formError); // Set validation errors
            return; // Prevent submission if validation fails
        }
        setIsBranchApiLoading(true);


        const requestBody = {
            "title": formData.title,
            "description": formData.description,
            "branch_id": branch_id,
            "_token": branch_token,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),

        };


        // Show loading spinner using Swal
        const swalInstance = Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we create your Ticket',
            didOpen: () => {
                Swal.showLoading(); // Start the loading spinner
            },
            allowOutsideClick: false, // Prevent closing Swal while processing
            showConfirmButton: false, // Hide the confirm button
        });

        // Make API request to create ticket
        fetch("https://api.goldquestglobal.in/branch/ticket/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        })
            .then((response) => response.json()) // Convert response to JSON
            .then((data) => {

                // Handle session expiry if token is invalid
                if (data.status === false && data.message === "Invalid token provided") {
                    Swal.fire({
                        title: "Session Expired",
                        text: "Your session has expired. Please log in again.",
                        icon: "warning",
                        confirmButtonText: "OK",
                    }).then(() => {
                        window.location.href = `/customer-login?email=${encodeURIComponent(branchData?.email || "")}`;
                    });
                    return; // Stop further execution after redirecting
                }

                // Handle validation errors from API (if any)
                if (data.errors) {
                    // Show errors from API using Swal
                    Swal.fire({
                        title: "Error",
                        text: data.errors.join(", "), // Assuming `errors` is an array of messages
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                } else if (data.status === false) {
                    // Handle failure status from the API
                    Swal.fire({
                        title: "Error",
                        text: data.message || "An unexpected error occurred.",
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                } else {
                    // Successfully created the ticket
                    Swal.fire({
                        title: "Success",
                        text: "Ticket created successfully!",
                        icon: "success",
                        confirmButtonText: "OK",
                    });

                    const newToken = data._token || data.token;

                    // Update token if provided in response
                    if (newToken) {
                        localStorage.setItem("branch_token", newToken);
                    }

                    // Clear form data after successful submission
                    setFormData({
                        title: '',
                        description: '',
                    });

                    // Reload tickets list
                    fetchTickets();
                }
            })
            .catch((error) => {
                console.error(error); // Handle the error

                // Show a generic error message if the API request fails
                Swal.fire({
                    title: "Error",
                    text: error.message || "An error occurred while creating the ticket. Please try again.",
                    icon: "error",
                    confirmButtonText: "OK",
                });
            })
            .finally(() => {
                // Close the Swal loading spinner after processing is done
                swalInstance.close();
                setIsBranchApiLoading(false);
            });
    };





    const deleteTicket = async (ticket_number) => {
        const branchData = JSON.parse(localStorage.getItem("branch"));
        const branch_id = branchData?.branch_id;
        const branch_token = localStorage.getItem("branch_token");
        const formdata = new FormData();
        const requestOptions = {
            method: "DELETE",
            body: formdata,
            redirect: "follow",
        };

        // Show confirmation Swal
        Swal.fire({
            title: "Are you sure?",
            text: "This action will permanently delete the ticket. Do you want to proceed?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                setIsBranchApiLoading(true);

                // Show loading spinner while deleting
                Swal.fire({
                    title: "Deleting...",
                    text: "Please wait while the ticket is being deleted.",
                    icon: "info",
                    allowOutsideClick: false, // Prevent closing Swal while processing
                    showConfirmButton: false, // Hide confirm button
                    didOpen: () => {
                        Swal.showLoading(); // Start loading spinner
                    }
                });
                const payLoad = {
                    branch_id: branch_id,
                    _token: branch_token,
                    ticket_number: ticket_number,
                    ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
                };

                // Zet het object om naar een query string
                const queryString = new URLSearchParams(payLoad).toString();

                // Proceed with the deletion request
                fetch(
                    `https://api.goldquestglobal.in/branch/ticket/delete?${queryString}`,
                    requestOptions
                )
                    .then((response) => {
                        if (!response.ok) {
                            return response.json().then((result) => {
                                const errorMessage = result.message || "An unexpected error occurred.";
                                // Handle session expiration
                                if (
                                    errorMessage.toLowerCase().includes("invalid") &&
                                    errorMessage.toLowerCase().includes("token")
                                ) {
                                    Swal.fire({
                                        title: "Session Expired",
                                        text: "Your session has expired. Please log in again.",
                                        icon: "warning",
                                        confirmButtonText: "OK",
                                    }).then(() => {
                                        // Redirect to customer login page
                                        window.open(
                                            `/customer-login?email=${encodeURIComponent(branchData?.email || "")}`,
                                            "_self"
                                        );
                                    });
                                }

                                throw new Error(errorMessage);
                            });
                        }
                        return response.json();
                    })
                    .then((result) => {

                        // Show success message
                        Swal.fire({
                            title: "Deleted!",
                            text: "The ticket has been successfully deleted.",
                            icon: "success",
                            confirmButtonText: "OK",
                        });

                        // Refresh the ticket list
                        fetchTickets();

                        // Update token if provided in the response
                        const newToken = result._token || result.token;
                        if (newToken) {
                            localStorage.setItem("branch_token", newToken);
                        }
                    })
                    .catch((error) => {
                        console.error(error);
                        // Show error message in case of failure
                        Swal.fire({
                            title: "Error",
                            text: "An error occurred while deleting the ticket. Please try again.",
                            icon: "error",
                            confirmButtonText: "OK",
                        });
                    })
                    .finally(() => {
                        setIsBranchApiLoading(false); // Reset loading state after the operation
                        Swal.close(); // Close the loading spinner
                    });
            }
        });
    };
    const exportToExcel = () => {
        // Filtered data to export
        const dataToExport = currentItems;

        // Map the data to match the structure of the table headers
        const formattedData = dataToExport.map((ticket, index) => ({
            Index: index + 1,
            "Case Title": ticket.tile,
            "Ticket Number": ticket.ticket_number,
        }));

        // Create a worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Filtered Data');

        // Write the Excel file to disk
        XLSX.writeFile(wb, 'Tickets.xlsx');
    };


    return (
        <div className='md:grid md:grid-cols-2 gap-4 justify-between m-6 items-stretch'>
            <div>
                <h2 className='text-center md:text-3xl md:mt-10 md:mb-10 mt-3 font-bold mb-4'> Case Logs </h2>
                <div className='m-0 bg-white shadow-md p-3 md:h-100 rounded-md'>

                    <form className='mt-4' onSubmit={handleSubmit}>

                        <div className="mb-6 text-left">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">Case-Log Title<span className='text-red-500 font-bold'>*</span></label>
                            <input
                                type="text"
                                name="title"
                                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                                id="title"
                                onChange={handleChange}
                                value={formData.title}
                            />
                            {passError.title && <p className='text-red-500'>{passError.title}</p>}
                        </div>
                        <div className="mb-6 text-left">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">Case-Log Description<span className='text-red-500 font-bold'>*</span></label>
                            <input
                                type="text"
                                name="description"
                                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                                id="confirmtitle"
                                onChange={handleChange}
                                value={formData.description}
                            />
                            {passError.description && <p className='text-red-500'>{passError.description}</p>}
                        </div>
                        <button type="submit" disabled={isBranchApiLoading} className='bg-[#3e76a5] text-white p-3 rounded-md w-full mb-4 hover:bg-[#3e76a5]'>Submit Case-Logs</button>
                    </form>
                </div>
            </div>
            <div>
                <h2 className='text-center md:text-3xl md:mt-10 md:mb-10 mt-3 font-bold mb-4'> Tickets Details </h2>
                <div className=' border p-3 bg-white shadow-md rounded-md  mx-auto'>

                    <div className="md:grid md:grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4">
                        <div className="col">
                            <form action="">
                                <div className="flex gap-2">
                                    <select name="options" id="" onChange={(e) => {
                                        handleSelectChange(e); // Call the select change handler
                                        setCurrentPage(1); // Reset current page to 1
                                    }} className='outline-none md:pe-14 md:ps-2 text-left rounded-md border w-7/12 md:w-auto p-3'>
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
                                        className='outline-none border-2 p-2 text-sm rounded-md w-full my-4 md:my-0'
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
                            <div className="flex justify-center items-center py-6 h-full">
                                <PulseLoader
                                    color="#36D7B7"
                                    loading={loading}
                                    size={15}
                                    aria-label="Loading Spinner"
                                />
                            </div>
                        ) : currentItems.length > 0 ? (
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-[#3e76a5]">
                                        <th className="py-2 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">SL</th>
                                        <th className="py-2 px-4 text-white border-r border-b text-left uppercase whitespace-nowrap">Case Title</th>
                                        <th className="py-2 px-4 text-white border-r border-b text-center uppercase whitespace-nowrap">Ticket Number</th>
                                        <th className="py-2 px-4 text-white border-r border-b text-center uppercase whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-2 px-4 border-r border-b whitespace-nowrap">
                                                {index + 1 + (currentPage - 1) * itemsPerPage}
                                            </td>
                                            <td className="py-2 px-4 border-r border-b whitespace-nowrap">{item.title}</td>
                                            <td className="py-2 px-4 border-r border-b text-center whitespace-nowrap">{item.ticket_number}</td>
                                            <td className="py-2 px-4 border-r border-b text-center whitespace-nowrap">
                                                <button
                                                    disabled={isBranchApiLoading}
                                                    className="bg-[#3e76a5] rounded-md hover:bg-[#3e76a5] p-2 me-3 text-white"
                                                    onClick={() => replyTickets(item.ticket_number, item.description)}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    disabled={isBranchApiLoading}
                                                    className="bg-red-500 rounded-md hover:bg-red-200 p-2 text-white"
                                                    onClick={() => deleteTicket(item.ticket_number)}
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

                    <div className="flex items-center justify-end  rounded-md px-4 py-3 sm:px-6 md:m-4 mt-2">
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
            </div>


            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="flex flex-col md:w-6/12 md:max-h-[500px] max-h-[300px] bg-white border relative border-gray-300 rounded-lg shadow-lg mx-auto mt-10">
                        {/* Close button */}
                        <button
                            className="absolute top-2 right-2 font-bold text-red-600 px-3 py-1 rounded-full "
                            onClick={handleClose}
                        >
                            X
                        </button>
                        <div className="w-full text-yellow-800 text-center py-2 font-medium">
                            {conversationMsg}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {viewLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <PulseLoader color="#36D7B7" size={15} aria-label="Loading Spinner" />
                                </div>
                            ) : (
                                (conversation || []).map((conversation, index) => {
                                    const isFromBranch = conversation.from === "branch";
                                    const isFromAdmin = conversation.from === "admin";

                                    if (isFromAdmin) {
                                        return (
                                            <div key={index} className="flex justify-start">
                                                <div className="max-w-[70%] p-3 rounded-lg text-sm bg-gray-300 text-gray-900">
                                                    {conversation.message}
                                                </div>
                                            </div>
                                        );
                                    } else if (isFromBranch) {
                                        return (
                                            <div key={index} className="flex justify-end">
                                                <div className="max-w-[70%] p-3 rounded-lg text-sm bg-blue-500 text-white">
                                                    {conversation.message}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return null; // Handle cases where 'from' is neither 'branch' nor 'admin'
                                })
                            )}
                            {/* Reference element to scroll to */}
                            <div ref={messageEndRef} />
                        </div>

                        {/* Input and Send Button */}
                        <div className="flex items-center p-3 bg-white border-t border-gray-300">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {  // Check if Enter key is pressed
                                        e.preventDefault();    // Prevent the default form submission or other behavior
                                        handleSend();          // Trigger the send function
                                    }
                                }}
                                placeholder="Type your message..."
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                            />
                            <button
                                onClick={handleSend}
                                type="submit"
                                disabled={userInput.length === 0}
                                className="ml-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                            >
                                {formLoading ? 'Sending.....' : "Send"}

                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CaseLog;
