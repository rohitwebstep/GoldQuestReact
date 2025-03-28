import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import Default from "../Images/Icon.png"
import { useApiCall } from "../ApiCallContext";
import { useApi } from "../ApiContext";

const ActivityLogs = () => {
    const { setIsApiLoading, isApiLoading } = useApiCall();
    const [responseError, setResponseError] = useState(null);

    const API_URL = useApi();
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState(""); // Start date filter
    const [endDate, setEndDate] = useState(""); // End date filter
    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200];
    const navigate = useNavigate();

    const fetchData = useCallback(() => {
        setLoading(true);
        setIsApiLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error("Missing admin_id or _token");
            setLoading(false);
            setIsApiLoading(false);
            return;
        }

        const url = `${API_URL}/user-history?admin_id=${admin_id}&_token=${storedToken}`;

        fetch(url, {
            method: "GET",
            redirect: "follow",
        })
            .then((response) => {
                return response.json().then((result) => {
                    // Check if the API response status is false
                    if (result.status === false) {
                        // Log the message from the API response
                        console.error('API Error:', result.message);
                        Swal.fire('Error!', `${result.message}`, 'error');
                        setResponseError(result.message);

                        // Optionally, you can throw an error here if you want to halt the further execution
                        throw new Error(result.message);
                    }
                    return result;
                });
            })
            .then((result) => {
                const newToken = result.token || result._token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                setTableData(result.client_spocs || []);
            })
            .catch((error) => {
                console.error("Fetch error:", error);
                setTableData([]);
            })
            .finally(() => {
                setIsApiLoading(false);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const initialize = async () => {
            try {
                if (isApiLoading == false) {
                    await fetchData();
                }
            } catch (error) {
                console.error(error.message);
                navigate("/admin-login");
            }
        };

        initialize();
    }, [navigate, fetchData]);

    // Filtered and paginated data
    const filteredData = (Array.isArray(tableData) ? tableData : []).filter((row) => {
        const matchesSearchTerm =
            row?.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row?.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row?.admin_id?.toString().includes(searchTerm.toLowerCase());

        const matchesDateRange =
            (!startDate || new Date(row.created_at) >= new Date(startDate)) &&
            (!endDate || new Date(row.created_at) <= new Date(endDate));

        return matchesSearchTerm && matchesDateRange;
    });


    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(tableData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Acknowledgement");
        XLSX.writeFile(wb, "Acknowledgement.xlsx");
    };

    const Loader = () => (
        <tr>
            <td colSpan="6">
                <div className="flex w-full justify-center items-center h-20">
                    <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                </div>
            </td>
        </tr>
    );

    const handleView = (adminId, id) => {
        navigate(`/admin-ViewUser?log_admin_id=${adminId}&log_id=${id}`);
    };

    return (
        <div className="bg-[#3e76a5]  border  m-4">
            <div className="bg-white md:p-12 p-3 w-full mx-auto">
                <div className="md:flex justify-between items-center md:space-x-4 mb-4">
                    <div className="flex gap-3">

                        <input
                            type="text"
                            placeholder="Search by Admin ID or Action"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border p-2 rounded md:w-full w-7/12 "
                        />

                        <button
                            onClick={exportToExcel}
                            className="bg-[#3e76a5] hover:scale-105  w-full  transition duration-200 text-white px-4 py-3  rounded hover:bg-[#3e76a5]"
                        >
                            Export to Excel
                        </button>

                    </div>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="border rounded-lg px-3 py-2 mt-2 md:mt-0 text-gray-700 w-full md:w-auto bg-white  shadow-sm focus:ring-2 focus:ring-blue-400"
                    >
                        {optionsPerPage.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    {/* <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border p-2 rounded"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border p-2 rounded"
                    /> */}

                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border  rounded-lg overflow-scroll whitespace-nowrap">
                        <thead>
                            <tr className="bg-[#3e76a5] text-white ">
                                <th className="border  uppercase px-4 py-2">SL</th>
                                <th className="border  uppercase px-4 py-2">Photo</th>
                                <th className="border  uppercase px-4 py-2">Admin Name</th>
                                <th className="border  uppercase px-4 py-2">Email</th>
                                <th className="border  uppercase px-4 py-2">Mobile Number</th>
                                <th className="border  uppercase px-4 py-2">Action</th>
                                <th className="border  uppercase px-4 py-2">Result</th>
                                <th className="border  uppercase px-4 py-2">Created At</th>
                                {/* <th className="border  uppercase px-4 py-2">View</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <Loader />
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((row, index) => (
                                    <tr className="text-center" key={index}>
                                        <td className="border  px-4 py-2">
                                            {index + 1 + (currentPage - 1) * itemsPerPage}
                                        </td>
                                        <td className="border  text-center capitalize px-4 py-2">
                                            <div className="flex justify-center items-center">
                                                <img src={row.profile_picture ? row.profile_picture : `${Default}`} alt={row.admin_name} className="w-10 h-10 rounded-full" />
                                            </div>
                                        </td>
                                        <td className="border  capitalize px-4 py-2">{row.admin_name}</td>
                                        <td className="border   px-4 py-2">{row.admin_email}</td>
                                        <td className="border  capitalize px-4 py-2">{row.admin_mobile}</td>

                                        <td className="border  capitalize px-4 py-2">{row.action}</td>
                                        <td className="border  capitalize px-4 py-2">
                                            {row.result === "1" ? (
                                                <span className="text-[#3e76a5]">Success</span>
                                            ) : (
                                                <span className="text-red-500">Failed</span>
                                            )}
                                        </td>
                                        <td className="border  px-4 py-2">
                                            {new Date(row.created_at).toLocaleString().replace(/\//g, '-')}
                                        </td>
                                        {/* <td className="border  px-4 py-2">
                                            <button
                                                onClick={() => handleView(row.admin_id, row.id)}
                                                className="bg-[#3e76a5] text-white hover:scale-105 font-bold  transition duration-200 px-4 py-2 rounded hover:bg-[#3e76a5]"
                                            >
                                                View
                                            </button>
                                        </td> */}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="text-center text-red-500 border  px-4 py-2" colSpan="10">
                                        {responseError && responseError !== "" ? responseError : "No data available in table"}
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
                    >
                        Previous
                    </button>
                    <span className="text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogs;