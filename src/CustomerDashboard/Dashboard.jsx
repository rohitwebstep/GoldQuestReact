import React, { useEffect, useCallback, useState, useContext } from 'react';

import Chart from './Chart';
import Chart2 from './Chart2';
import { MdArrowBackIosNew, MdArrowForwardIos } from 'react-icons/md';
import { useDashboard } from './DashboardContext';
import * as XLSX from 'xlsx';
import PulseLoader from 'react-spinners/PulseLoader';


const Dashboard = () => {

    const color = "#36A2EB"; // Define loader color
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term

    const override = {
        display: "block",
        margin: "0 auto",
    };
    const [itemsPerPage, setItemsPerPage] = useState({}); // Track items per page for each status
    const [paginatedData, setPaginatedData] = useState({});

    const { tableData, loading } = useDashboard();


    const formatKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

    const handlePageChange = (pageNumber, status) => {
        setPaginatedData(prevState => ({
            ...prevState,
            [status]: { pageNumber }
        }));
    };

    const showPrev = (status) => {
        const currentPage = paginatedData[status]?.pageNumber || 1;
        if (currentPage > 1) handlePageChange(currentPage - 1, status);
    };

    const showNext = (status) => {
        const currentPage = paginatedData[status]?.pageNumber || 1;
        const totalPages = calculateTotalPages(tableData.clientApplications[status], itemsPerPage[status] || 10);
        if (currentPage < totalPages) handlePageChange(currentPage + 1, status);
    };

    const handleSelectChange = (e, status) => {
        const newItemsPerPage = Number(e.target.value);
        setItemsPerPage(prev => ({
            ...prev,
            [status]: newItemsPerPage
        }));
        handlePageChange(1, status);
    };

    const calculateTotalPages = (applications, itemsPerPage) => {
        return Math.ceil(applications?.applications.length / itemsPerPage) || 1;
    };

    const renderPagination = (status) => {
        const currentPage = paginatedData[status]?.pageNumber || 1;
        const totalPages = calculateTotalPages(tableData.clientApplications[status], itemsPerPage[status] || 10);
        const pageNumbers = [];

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pageNumbers.push(1, 2, 3, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
            } else {
                pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }

        return pageNumbers.map((number, index) =>
            number === '...' ? (
                <span key={index} className="px-3 py-1 text-gray-400">...</span>
            ) : (
                <button
                    key={number}
                    onClick={() => handlePageChange(number, status)}
                    className={`px-3 py-1 rounded-0 ${currentPage === number ? 'bg-[#3e76a5] text-white' : 'bg-[#3e76a5] text-black border'}`}
                >
                    {number}
                </button>
            )
        );
    };


    const exportToExcel = (applications, key) => {
        // Map data to export format
        const dataToExport = applications.map((app, index) => ({
            No: index + 1,
            "Application ID": app.application_id,
            "Application Name": app.application_name,
        }));

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, key);

        // Download the Excel file
        XLSX.writeFile(workbook, `${key}_Applications.xlsx`);
    };



    return (
        <div className="md:p-14 p-4 px-2">
            <div className="my-10">
                <div className="md:flex items-stretch gap-6">
                    <div className="md:w-6/12 bg-white shadow-md rounded-md">
                        <Chart />
                    </div>
                    <div className="md:w-6/12 bg-white shadow-md rounded-md md:mt-0 mt-4 p-3 border">
                        <Chart2 />
                    </div>
                </div>
            </div>
            <div className="border p-2  md:flex flex-wrap ">
                {loading ? (
                    <div className="grid md:grid-cols-2 grid-cols-1 gap-6 border-t-2">
                        <div className="flex justify-center items-center w-full py-10">
                            <PulseLoader
                                color={color}
                                loading={loading}
                                cssOverride={override}
                                size={15}
                                aria-label="Loading Spinner"
                                data-testid="loader"
                            />
                        </div>
                    </div>
                ) : Object.keys(tableData.clientApplications).length > 0 ? (
                    Object.keys(tableData.clientApplications).map((key) => {
                        const applicationGroup = tableData.clientApplications[key];
                        const currentPage = paginatedData[key]?.pageNumber || 1;
                        const currentItemsPerPage = itemsPerPage[key] || 10;
                        const paginatedApplications = applicationGroup.applications.slice(
                            (currentPage - 1) * currentItemsPerPage,
                            currentPage * currentItemsPerPage
                        );

                        return (
                            <div className="overflow-x-auto  md:w-6/12  " key={key}>
                                <div className='bg-white shadow-md mb-4 rounded-md p-3 mx-3'> <h2 className="font-bold text-gray-700 text-2xl  pb-6 w-full text-center uppercase">
                                    {formatKey(key) || 'NIL'}
                                </h2>
                                    <div className="md:flex justify-between items-center md:my-4 border-b-2 pb-4">
                                        <div className="flex gap-3 md:w-7/12">
                                            <select
                                                onChange={(e) => handleSelectChange(e, key)}
                                                className="outline-none pe-3 ps-2 border-gray-300  shadow-md text-left py-3 rounded-md w-7/12 md:w-6/12 border"
                                                value={itemsPerPage[key] || 10}
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
                                                onClick={() => exportToExcel(applicationGroup.applications, key)}
                                                className="bg-[#3e76a5] text-sm text-white py-3 p-2 md:px-4 rounded-md capitalize"
                                                type="button"
                                            >
                                                Export to Excel
                                            </button>
                                        </div>
                                        <div className="md:flex justify-end gap-3">
                                            <input
                                                type="search"
                                                className="outline-none border-2 p-2 border-gray-300 shadow-md rounded-md w-full my-4 md:my-0"
                                                placeholder="Search Here"
                                            />
                                        </div>
                                    </div>
                                    <table className="min-w-full bg-white border">
                                        <thead>
                                            <tr className="bg-[#3e76a5]">
                                                <th className="py-3 px-4 border-b text-left border-r-2 text-white whitespace-nowrap uppercase">
                                                    No
                                                </th>
                                                <th className="py-3 px-4 border-b text-left border-r-2 text-white whitespace-nowrap uppercase">
                                                    Application ID
                                                </th>
                                                <th className="py-3 px-4 border-b text-left border-r-2 text-white whitespace-nowrap uppercase">
                                                    Application Name
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedApplications.length > 0 ? (
                                                paginatedApplications.map((application, appIndex) => (
                                                    <tr key={appIndex}>
                                                        <td className="py-3 px-4 border-b text-[#3e76a5] whitespace-nowrap">
                                                            {(currentPage - 1) * currentItemsPerPage + appIndex + 1}
                                                        </td>
                                                        <td className="py-3 px-4 border-b whitespace-nowrap">
                                                            {application.application_id}
                                                        </td>
                                                        <td className="py-3 px-4 border-b whitespace-nowrap">
                                                            {application.application_name}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="py-3 px-4 border-b text-center text-gray-700">
                                                        No applications available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="flex items-center justify-end rounded-md bg-white px-4 py-3 sm:px-6 md:m-4 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => showPrev(key)}
                                            disabled={currentPage === 1}
                                            className="inline-flex items-center rounded-0 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            aria-label="Previous page"
                                        >
                                            <MdArrowBackIosNew />
                                        </button>
                                        <div className="flex items-center">{renderPagination(key)}</div>
                                        <button
                                            type="button"
                                            onClick={() => showNext(key)}
                                            disabled={currentPage >= calculateTotalPages(applicationGroup, currentItemsPerPage)}
                                            className="inline-flex items-center rounded-0 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            aria-label="Next page"
                                        >
                                            <MdArrowForwardIos />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex justify-center items-center w-full py-10">
                        <p className="text-center text-lg">No applications available</p>
                    </div>
                )}
            </div>
        </div>

    );
};

export default Dashboard;


