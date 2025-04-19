import React, { useEffect, useState, useRef } from 'react';
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import Swal from 'sweetalert2';
import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';
import * as XLSX from 'xlsx';

const Tickets = () => {
    const { isApiLoading, setIsApiLoading } = useApiCall();

    const [showPopup, setShowPopup] = useState(false);
    const [data, setData] = useState([]);
    const [conversation, setConversation] = useState([]);
    const [conversationMsg, setConversationMsg] = useState([]);
    const messageEndRef = useRef(null);
    const [loading, setLoading] = useState(null);
    const [formLoading, setFormLoading] = useState(null);
    const [ticket, setTicket] = useState([]);
    const [messages, setMessages] = useState([
        { sender: "bot", text: "Hello! How can I assist you with your ticket today?" },
    ]);
    const [userInput, setUserInput] = useState("");
    const replyTickets = async (ticket_number, description) => {
        try {
            setIsApiLoading(true); // Set loading state

            setTicket(ticket_number);
            setConversationMsg(description);
            setShowPopup(true); // Show the popup

            const admin_id = JSON.parse(localStorage.getItem("admin"))?.id || '';
            const storedToken = localStorage.getItem("_token") || '';

            // Fetch the ticket details
            const response = await fetch(`https://api.goldquestglobal.in/ticket/view?ticket_number=${ticket_number}&admin_id=${admin_id}&_token=${storedToken}`);

            // Check if response is OK (2xx)
            if (!response.ok) {
                const result = await response.json();
                // Handle token expiration or other errors
                return handleErrorResponse(result);
            }

            // Parse the successful response as JSON
            const result = await response.json();

            // Set the conversation based on the response
            setConversation(result.branches.conversations);

            // Update token if returned in the response
            updateToken(result);

            // Trigger scroll after updating the conversation
            setTimeout(() => {
                if (messageEndRef.current) {
                    messageEndRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "end",
                        inline: "nearest"
                    });

                    // Add an offset of 40 pixels to scroll smoothly
                    window.scrollBy(0, 40);
                }
            }, 0); // Ensure DOM updates before scrolling

        } catch (error) {
            console.error("Error fetching ticket:", error);
            Swal.fire({
                title: 'Error',
                text: 'An error occurred while fetching the ticket details. Please try again later.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsApiLoading(false); // Reset loading state after request completion
        }
    };

    // Helper function to handle error responses
    const handleErrorResponse = (result) => {
        if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
            // Session expired, update token if available and redirect to login
            const newToken = result._token || result.token;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            Swal.fire({
                title: 'Session Expired',
                text: 'Your session has expired. Redirecting to the login page.',
                icon: 'warning',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = "/admin-login"; // Redirect to login page
            });
        } else {
            // Handle other errors
            Swal.fire({
                title: 'Error',
                text: result.message || 'An unexpected error occurred. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
            throw new Error(result.message || 'Error fetching ticket data');
        }
    };

    // Helper function to update token if it's returned in the response
    const updateToken = (result) => {
        const newToken = result._token || result.token;
        if (newToken) {
            localStorage.setItem("_token", newToken); // Update token if available
        }
    };


    const handleSend = () => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id || '';
        const storedToken = localStorage.getItem("_token") || '';

        // Check if there's user input
        if (userInput.trim()) {
            const userMessage = { sender: "user", text: userInput };
            const botReply = { sender: "bot", text: "Thank you for your message. We'll look into it!" };
            setMessages([...messages, userMessage, botReply]);
            setUserInput(""); // Clear user input after sending
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "ticket_number": ticket,
            "message": userInput,
            "admin_id": admin_id,
            "_token": storedToken
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        // Set loading state to true when starting the request
        setFormLoading(true);
        setIsApiLoading(true);

        fetch("https://api.goldquestglobal.in/ticket/chat", requestOptions)
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((result) => {
                        const newToken = result._token || result.token;
                        if (newToken) {
                            localStorage.setItem("_token", newToken); // Update the token if available
                        }
                        if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                            // Session expired, redirect to login page
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                window.location.href = "/admin-login"; // Redirect to admin login page
                            });

                            return; // Stop further execution after redirecting
                        }



                        throw new Error(result.message || 'Error sending message');
                    });
                }
                return response.json();
            })
            .then((result) => {
                // If new token is received, update it in localStorage
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Update the token if available
                }

                if (result.error) {
                    // Show error message if there's any
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'An error occurred while sending the message. Please try again later.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                } else {
                    // If no errors, refresh the chat (this could be a function to update the chat UI)
                    replyTickets(ticket, conversationMsg);
                }
            })
            .catch((error) => {
                console.error("Error sending message:", error);
                // Handle generic error (e.g., network issue)
                Swal.fire({
                    title: 'Error',
                    text: 'An error occurred while sending the message. Please try again later.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            })
            .finally(() => {
                setFormLoading(false);
                setIsApiLoading(false); // Reset loading state
            });
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
        setShowPopup(false);
    };

    const fetchTickets = () => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id || '';
        const storedToken = localStorage.getItem("_token") || '';
        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        setLoading(true);
        setIsApiLoading(true);

        fetch(`https://api.goldquestglobal.in/ticket/list?admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
            .then((response) => {
                if (!response.ok) {
                    return response.json().then(result => {
                        const newToken = result._token || result.token;
                        if (newToken) {
                            localStorage.setItem("_token", newToken);
                        }
                        // Check for session expiry (invalid token)
                        if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                            // Handle session expiry (expired token)
                            Swal.fire({
                                title: "Session Expired",
                                text: "Your session has expired. Please log in again.",
                                icon: "warning",
                                confirmButtonText: "Ok",
                            }).then(() => {
                                // Redirect to login page after the alert
                                window.location.href = "/admin-login"; // Replace with your login route
                            });
                            return; // Stop further execution if session has expired
                        }

                        // Handle new token if available


                        // Handle other errors if response is not OK
                        if (!response.ok) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: result.message || 'Failed to load data',
                            });
                        }

                        return result;
                    });
                }

                return response.json();  // Parse the response as JSON if the status is OK
            })
            .then((result) => {

                // Extract tickets from the branches array
                const tickets = result.branches?.map(branch => branch.branches?.map(b => b.tickets)).flat(2);
                setData(tickets || [])

                // Update token if a new one is available
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);  // Update token if available
                }
            })
            .catch((error) => {
                console.error("Error fetching tickets:", error);
                // Handle generic error (e.g., network issue)
                Swal.fire({
                    title: 'Error',
                    text: 'An error occurred while fetching the tickets. Please try again later.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            })
            .finally(() => {
                setLoading(false); // Stop loading state
                setIsApiLoading(false); // Stop loading state
            });
    };

    useEffect(() => {
        if (!isApiLoading) {
            fetchTickets();
        }
    }, []);

    const deleteTicket = async (ticket_number) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id || '';
        const storedToken = localStorage.getItem("_token") || '';
        const formdata = new FormData();

        const requestOptions = {
            method: "DELETE",
            body: formdata,
            redirect: "follow"
        };


        // Show confirmation Swal
        Swal.fire({
            title: "Are you sure?",
            text: "This action will permanently delete the ticket. Do you want to proceed?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                setIsApiLoading(true); // Set loading state to true before the request

                // Proceed with the deletion if confirmed by user
                fetch(`https://api.goldquestglobal.in/ticket/delete?ticket_number=${ticket_number}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            const newToken = response._token || response.token;
                            if (newToken) {
                                localStorage.setItem("_token", newToken);  // Update token if available
                            }
                            return response.json().then((result) => {
                                const newToken = result._token || result.token;
                                if (newToken) {
                                    localStorage.setItem("_token", newToken);  // Update token if available
                                }
                                if (result.message && result.message.toLowerCase().includes("invalid") && result.message.toLowerCase().includes("token")) {
                                    // Session expired, redirect to login page
                                    Swal.fire({
                                        title: "Session Expired",
                                        text: "Your session has expired. Please log in again.",
                                        icon: "warning",
                                        confirmButtonText: "Ok",
                                    }).then(() => {
                                        window.location.href = "/admin-login";  // Redirect to login page
                                    });

                                    return;  // Prevent further code execution
                                } else {
                                    // Show error message for other issues
                                    Swal.fire({
                                        title: 'Error',
                                        text: result.message || 'An unexpected error occurred. Please try again.',
                                        icon: 'error',
                                        confirmButtonText: 'OK'
                                    });

                                    throw new Error(result.message || 'Error deleting ticket');
                                }
                            });
                        }
                        return response.json();  // Parse response as JSON
                    })
                    .then((result) => {
                        if (result.error) {
                            // Show API-level error message
                            Swal.fire({
                                title: 'Error',
                                text: result.message || 'An unexpected error occurred. Please try again.',
                                icon: 'error',
                                confirmButtonText: 'OK',
                            });
                        } else {
                            // Show success message and refresh ticket list
                            Swal.fire({
                                title: "Deleted!",
                                text: "The ticket has been successfully deleted.",
                                icon: "success",
                                confirmButtonText: "OK"
                            });
                            fetchTickets();  // Refresh the tickets list after deletion

                            // Update the token if a new one is provided in the response
                            const newToken = result._token || result.token;
                            if (newToken) {
                                localStorage.setItem("_token", newToken);  // Update token if available
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Error during ticket deletion:", error);  // Log detailed error message
                        Swal.fire({
                            title: "Error",
                            text: "An error occurred while deleting the ticket. Please try again later.",
                            icon: "error",
                            confirmButtonText: "OK"
                        });
                    })
                    .finally(() => {
                        setIsApiLoading(false);  // Reset loading state
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
            "Case Title": ticket.title || 'NIL',
            "Ticket Number": ticket.ticket_number || 'NIL',
        }));

        // Create a worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Filtered Data');

        // Write the Excel file to disk
        XLSX.writeFile(wb, 'Tickets.xlsx');
    };

    return (
        <div className=' gap-4 justify-between m-6 items-stretch'>

            <div>
                <h2 className='text-center md:text-3xl md:mt-10 md:mb-10 mt-3 font-bold mb-4'> Tickets Details </h2>
                <div className=' border p-3 bg-white shadow-md rounded-md  mx-auto'>

                    <div className="md:grid md:grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4">
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
                                            <td className="py-2 px-4 border-r border-l border-b whitespace-nowrap">
                                                {index + 1 + (currentPage - 1) * itemsPerPage}
                                            </td>
                                            <td className="py-2 px-4 border-r  border-b whitespace-nowrap">{item.title}</td>
                                            <td className="py-2 px-4 border-r border-b text-center whitespace-nowrap">{item.ticket_number}</td>
                                            <td className="py-2 px-4 border-r border-b text-center whitespace-nowrap">
                                                <button
                                                    className="bg-[#3e76a5] rounded-md hover:bg-[#3e76a5] p-2 me-3 text-white"
                                                    onClick={() => replyTickets(item.ticket_number, item.description)}
                                                >
                                                    View
                                                </button>
                                                <button
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
                            className="absolute top-2 right-2 text-red-600 font-bold px-3 py-1 "
                            onClick={handleClose}
                        >
                            X
                        </button>

                        {/* Fixed Message at the Top */}
                        <div className="w-full text-yellow-800 text-center py-2 font-medium">
                            {conversationMsg}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {(conversation || []).map((conversation, index) => { // Safely map over conversations
                                const isFromBranch = conversation.from === "branch";
                                const isFromAdmin = conversation.from === "admin";

                                if (isFromBranch) {
                                    return (
                                        <div key={index} className="flex justify-start">
                                            <div className="max-w-[70%] p-3 rounded-lg text-sm bg-gray-300 text-gray-900">
                                                {conversation.message}
                                            </div>
                                        </div>
                                    );
                                } else if (isFromAdmin) {
                                    return (
                                        <div key={index} className="flex justify-end">
                                            <div className="max-w-[70%] p-3 rounded-lg text-sm bg-blue-500 text-white">
                                                {conversation.message}
                                            </div>
                                        </div>
                                    );
                                }

                                return null; // In case there is a message from neither "branch" nor "admin"
                            })}
                            {/* Reference element to scroll to */}
                            <div ref={messageEndRef} />
                        </div>

                        {/* Input and Send Button */}
                        <div className="flex items-center p-3 bg-white border-t border-gray-300">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Type your message..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
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

export default Tickets;
