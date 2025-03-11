import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useContext,
} from "react";
import * as XLSX from 'xlsx';
import verified from '../Images/verified.webp'

import { useApiCall } from '../ApiCallContext';
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../ApiContext";
import PulseLoader from "react-spinners/PulseLoader";
import Swal from "sweetalert2";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
const ReportCaseTable = () => {
  const [servicesLoading, setServicesLoading] = useState(false);
  const { isBranchApiLoading, setIsBranchApiLoading } = useApiCall();
  const [loadingStates, setLoadingStates] = useState({}); // To track loading state for each button
  const branchEmail = JSON.parse(localStorage.getItem("branch"))?.email;

  const [expandedRow, setExpandedRow] = useState({
    index: "",
    headingsAndStatuses: [],
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [itemsPerPage, setItemPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [adminTAT, setAdminTAT] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = useApi();

  const queryParams = new URLSearchParams(location.search);
  const clientId = queryParams.get("clientId");

  const tableRef = useRef(null); // Ref for the table container

  // Function to reset expanded rows
  const handleOutsideClick = (event) => {
    if (tableRef.current && !tableRef.current.contains(event.target)) {
      setExpandedRow({}); // Reset to empty object instead of null
    }
  };

  // useEffect(() => {
  //     document.addEventListener("mousedown", handleOutsideClick);
  //     return () => {
  //         document.removeEventListener("mousedown", handleOutsideClick);
  //     };
  // }, []);

  // Fetch data from the main API
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
      `${API_URL}/branch/report-case-status/list?${queryString}`,
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
        setData(result.customers || []); // Assuming 'customers' is in the response body
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


  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const filteredItems = data.filter((item) => {
    return (
      item.application_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredOptions = filteredItems.filter((item) =>
    item.status.toLowerCase().includes(selectedStatus.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOptions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOptions.slice(indexOfFirstItem, indexOfLastItem);

  const showPrev = () => {
    if (currentPage > 1) handlePageChange(currentPage - 1);
  };

  const showNext = () => {
    if (currentPage < totalPages) handlePageChange(currentPage + 1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedRow(null); // Reset expanded row when page changes
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
  const fetchServicesData = async (applicationId, servicesList) => {
    const branchData = localStorage.getItem("branch");
    setIsBranchApiLoading(true);  // Start loading

    const branchEmail = branchData ? JSON.parse(branchData)?.email : null;
    const branchData1 = branchData ? JSON.parse(branchData) : null;
    const branch_id = JSON.parse(branchData)?.branch_id;
    const _token = localStorage.getItem("branch_token");

    // Return an empty array if servicesList is empty or undefined
    if (!servicesList || servicesList.length === 0) {
      setIsBranchApiLoading(false);  // Stop loading if servicesList is empty
      return [];
    }
    const payLoad = {
      branch_id: branch_id,
      _token: _token,
      ...(branchData1?.type === "sub_user" && { sub_user_id: branchData1.id }),
      service_ids: servicesList,
      application_id: applicationId,
    };

    // Zet het hele object correct om naar een geëncodeerde querystring
    const queryString = new URLSearchParams(payLoad).toString();

    try {
      const url = `${API_URL}/branch/report-case-status/services-annexure-data?${queryString}`;


      const response = await fetch(url, { method: "GET", redirect: "follow" });

      if (response.ok) {
        const result = await response.json();

        // Ensure the token is available in the response
        const newToken = result.token || result._token || "";
        if (newToken) {
          localStorage.setItem("branch_token", newToken); // Save new token to localStorage
        }

        // Check if the response contains an invalid token message
        const message = result.message?.message?.toLowerCase() || '';
        if (message.includes("invalid") || message.includes("expired") || message.includes("token")) {
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
          });
          return; // Stop further execution if session expired
        }

        // If no invalid token message, proceed with result filtering
        const filteredResults = result.results.filter((item) => item != null);

        const sortedFilteredResults = filteredResults.sort((a, b) => {
          const orderA = a.annexureData && a.annexureData.sorting_order != null
            ? parseInt(a.annexureData.sorting_order) || Number.MAX_SAFE_INTEGER
            : Number.MAX_SAFE_INTEGER;

          const orderB = b.annexureData && b.annexureData.sorting_order != null
            ? parseInt(b.annexureData.sorting_order) || Number.MAX_SAFE_INTEGER
            : Number.MAX_SAFE_INTEGER;

          return orderA - orderB;
        });

        return sortedFilteredResults;
      } else {
        const result = await response.json(); // Get the result to show the error message from API
        const errorMessage = result.message || response.statusText || 'Failed to fetch service data';
        console.error("API error:", errorMessage);

        // Check if the error message contains 'invalid' or 'expired' and prompt the user to log in again
        if (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("expired")) {
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage,
          });
        }

        return [];
      }
    } catch (error) {
      console.error("Error occurred:", error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to fetch service data',
      });

      return [];
    } finally {
      setIsBranchApiLoading(false);  // Stop loading after API call is completed
    }
  };




  useEffect(() => {
    if (!isBranchApiLoading) {
      fetchData();
    }
  }, [clientId]);

  const handleViewMore = async (index) => {
    const globalIndex = index + (currentPage - 1) * itemsPerPage; // Calculate the global index

    setIsBranchApiLoading(true);

    setServicesLoading((prev) => {
      const newLoadingState = { ...prev, [globalIndex]: true };
      return newLoadingState;
    });

    if (expandedRow && expandedRow.index === globalIndex) {
      setExpandedRow(null); // Collapse the row
      setServicesLoading((prev) => {
        const newLoadingState = { ...prev, [globalIndex]: false };
        return newLoadingState;
      });
      setIsBranchApiLoading(false); // End loading state when collapsing
      return;
    }

    try {
      const applicationInfo = currentItems[index]; // Data for the current page

      const servicesData = await fetchServicesData(applicationInfo.main_id, applicationInfo.services);

      const headingsAndStatuses = [];

      servicesData.forEach((service) => {
        if (service.reportFormJson && service.reportFormJson.json) {
          const heading = JSON.parse(service.reportFormJson.json).heading;
          if (heading) {
            let status = service.annexureData?.status || "NIL";
            status = status.replace(/[^a-zA-Z0-9\s]/g, " ").toUpperCase() || 'NIL';
            headingsAndStatuses.push({ heading, status });
          }
        }
      });

      setExpandedRow({
        index: globalIndex, // Use the global index
        headingsAndStatuses: headingsAndStatuses,
      });

      setServicesLoading((prev) => {
        const newLoadingState = { ...prev, [globalIndex]: false };
        return newLoadingState;
      });

      const expandedRowElement = document.getElementById(`expanded-row-${globalIndex}`);
      if (expandedRowElement) {
        expandedRowElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      setServicesLoading((prev) => {
        const newLoadingState = { ...prev, [globalIndex]: false };
        return newLoadingState;
      });
      console.error('Error fetching service data:', error);
    } finally {
      setIsBranchApiLoading(false); // Stop global loading state
    }
  };





  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    setItemPerPage(selectedValue);
  };
  function addFooter(doc) {
    const footerHeight = 15; // Footer height
    const pageHeight = doc.internal.pageSize.height; // Get the total page height
    const footerYPosition = pageHeight - footerHeight + 10; // Position footer closer to the bottom

    // Define page width and margins
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10; // Margins on the left and right

    // Space between sections (adjust dynamically based on page width)
    const centerX = pageWidth / 2; // Center of the page

    // Insert text into the center column (centered)
    const footerText =
      "No 293/154/172, 4th Floor, Outer Ring Road, Kadubeesanahalli, Marathahalli, Bangalore-560103 | www.goldquestglobal.in";
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0); // Set text color to black (RGB: 0, 0, 0)
    doc.setFontSize(7);
    doc.text(footerText, centerX, footerYPosition - 3, { align: "center" }); // Adjusted vertical position

    // Insert page number into the right column (right-aligned)
    const pageCount = doc.internal.getNumberOfPages(); // Get total number of pages
    const currentPage = doc.internal.getCurrentPageInfo().pageNumber; // Get current page number
    const pageNumberText = `Page ${currentPage} / ${pageCount}`;
    const pageNumberWidth = doc.getTextWidth(pageNumberText); // Calculate text width

    // Right-align page number with respect to the page width
    const pageNumberX = pageWidth - margin - pageNumberWidth;
    doc.text(pageNumberText, pageNumberX, footerYPosition - 3); // Adjusted vertical position

    // Draw a line above the footer
    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0); // Set line color to black (RGB: 0, 0, 0)
    doc.line(
      margin,
      footerYPosition - 7,
      pageWidth - margin,
      footerYPosition - 7
    ); // Line above the footer
  }


  const fetchImageToBase = async (imageUrls) => {
    setIsBranchApiLoading(true); // Start loading
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const raw = {
        image_urls: imageUrls,
      };

      // Send the POST request to the API
      const response = await axios.post(
        "https://api.goldquestglobal.in/test/image-to-base",
        raw,
        { headers }
      );

      // Return the images from the response
      if (response.data?.images) {
        return response.data.images; // Ensure images exist before returning
      } else {
        console.error("No images returned in the response.");
      }
    } catch (error) {
      console.error("Error fetching images:", error);

      if (error.response) {
        console.error("Response error:", error.response.data); // Log the API error response
      } else {
        console.error("Network or other error:", error.message); // Handle network or other types of errors
      }
    } finally {
      setIsBranchApiLoading(false); // Stop loading once the request is finished
    }

    return null; // Return null in case of an error or if no images were returned
  };

  const generatePDF = async (index, reportDownloadFlag, reportInfo) => {


    const swalLoading = Swal.fire({
      title: 'Generating PDF...',
      text: 'Please wait a moment.',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    try {
      const applicationInfo = data[index];
      const servicesData = await fetchServicesData(applicationInfo.main_id, applicationInfo.services, reportDownloadFlag);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 5;
      const backgroundColor = '#f5f5f5';

      doc.addImage("https://i0.wp.com/goldquestglobal.in/wp-content/uploads/2024/03/goldquestglobal.png?w=771&ssl=1", 'PNG', 10, yPosition, 50, 30);

      const rightImageX = pageWidth - 10 - 70; // Page width minus margin (10) and image width (50)
      doc.addImage("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjDtQL92lFVchI1eVL0Gpb7xrNnkqW1J7c1A&s", 'PNG', rightImageX, yPosition, 50, 30);
      if (applicationInfo?.photo) {
        const imageBases = await fetchImageToBase([applicationInfo?.photo.trim()]);
        doc.addImage(imageBases?.[0]?.base64 || "https://static-00.iconduck.com/assets.00/profile-circle-icon-512x512-zxne30hp.png", 'PNG', rightImageX + 40, yPosition, 30, 30);

      } else {
        doc.addImage("https://static-00.iconduck.com/assets.00/profile-circle-icon-512x512-zxne30hp.png", 'PNG', rightImageX + 45, yPosition, 30, 30);

      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      doc.text("CONFIDENTIAL BACKGROUND VERIFICATION REPORT", 105, 40, { align: 'center' });

      // First Table
      const firstTableData = [
        [
          { content: 'Name of the Candidate', styles: { cellWidth: 'auto', fontStyle: 'bold' } },
          { content: applicationInfo?.name || 'NIL' },
          { content: 'Client Name', styles: { cellWidth: 'auto', fontStyle: 'bold' } },
          { content: applicationInfo[0]?.client_name || 'NIL' },
        ],
        [
          { content: 'Application ID', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.application_id || 'NIL' },
          { content: 'Report Status', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.report_status || 'NIL' },
        ],
        [
          { content: 'Date of Birth', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.dob ? new Date(applicationInfo.dob).toLocaleDateString() : 'NIL' },
          { content: 'Application Received', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.updated_at ? new Date(applicationInfo.updated_at).toLocaleDateString() : 'NIL' },
        ],
        [
          { content: 'Candidate Employee ID', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.employee_id || 'NIL' },
          { content: 'Insuff Cleared/Reopened', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.application_id || 'NIL' },
        ],
        [
          { content: 'Report Type', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.report_type || 'NIL' },
          { content: 'Final Report Date', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.report_date ? new Date(applicationInfo.report_date).toLocaleDateString() : 'NIL' },
        ],
        [
          { content: 'Verification Purpose', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.overall_status || 'NIL' },
          { content: 'Overall Report Status', styles: { fontStyle: 'bold' } },
          { content: applicationInfo?.status || 'NIL' },
        ],
      ];


      doc.autoTable({
        head: [], // Remove the header by setting it to an empty array
        body: firstTableData,
        styles: {
          cellPadding: 3,
          fontSize: 10,
          valign: 'middle',
          lineColor: [62, 118, 165],
          lineWidth: 0.4,     // Reduced border width (you can adjust this value further)
          textColor: '#000',  // Set text color to black (#000)
        },
        headStyles: {
          fillColor: [255, 255, 255], // Ensure no background color for header
          textColor: 0,               // Optional: Ensure header text color is reset (not needed if header is removed)
          lineColor: [62, 118, 165],
          lineWidth: 0.2,             // Reduced border width for header (if header is re-enabled)
        },
        theme: 'grid',
        margin: { top: 50 },
      });

      addFooter(doc);
      const secondTableData = servicesData.map(item => {
        const sourceKey = item.annexureData
          ? Object.keys(item.annexureData).find(key => key.startsWith('info_source') || key.startsWith('information_source'))
          : undefined;
        const dateKey = item.annexureData && Object.keys(item.annexureData).find(key => key.includes('verified_date'));

        return {
          component: item.heading || 'NIL',
          source: sourceKey ? item.annexureData[sourceKey] : 'NIL',
          completedDate: dateKey && item.annexureData[dateKey] && !isNaN(new Date(item.annexureData[dateKey]).getTime())
            ? new Date(item.annexureData[dateKey]).toLocaleDateString()
            : 'NIL',
          status: item.annexureData && item.annexureData.status ? item.annexureData.status.replace(/[_-]/g, ' ') : 'NIL',
        };
      });

      // Filter out rows with empty values
      const filteredSecondTableData = secondTableData.filter(row =>
        row.component !== 'NIL' && row.source !== 'NIL' && row.completedDate !== 'NIL' && row.status !== 'NIL'
      );

      // Generate the Second Table
      doc.autoTable({
        head: [
          [
            { content: 'REPORT COMPONENT', styles: { halign: 'center', fillColor: "#6495ed", lineColor: [61, 117, 166], textColor: [0, 0, 0], fontStyle: 'bold' } },
            { content: 'INFORMATION SOURCE', styles: { halign: 'center', fillColor: "#6495ed", lineColor: [61, 117, 166], textColor: [0, 0, 0], fontStyle: 'bold' } },
            { content: 'COMPLETED DATE', styles: { halign: 'center', fillColor: "#6495ed", lineColor: [61, 117, 166], textColor: [0, 0, 0], fontStyle: 'bold' } },
            { content: 'COMPONENT STATUS', styles: { halign: 'center', fillColor: "#6495ed", lineColor: [61, 117, 166], textColor: [0, 0, 0], fontStyle: 'bold' } },
          ]
        ],
        body: filteredSecondTableData.map(row => [
          row.component,
          row.source,
          row.completedDate, // Show completedDate in its own column
          row.status, // Show status in its own column
        ]),
        styles: {
          cellPadding: 3,
          fontSize: 10,
          valign: 'middle',
          lineWidth: 0.3,
          lineColor: "#6495ed",
        },
        theme: 'grid',
        headStyles: {
          lineWidth: 0.4, // No border for the header
          fillColor: [61, 117, 166], // Color for the header background
          textColor: [0, 0, 0], // Text color for the header
          fontStyle: 'bold',
          lineColor: [61, 117, 166], // Border color for the body

        },
        bodyStyles: {
          lineWidth: 0.5, // Border for the body rows
          lineColor: [61, 117, 166], // Border color for the body
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'center' }, // Center alignment for the completed date column
          3: { halign: 'center' }, // Center alignment for the status column
        },
      });



      addFooter(doc);
      doc.addPage();
      const tableStartX = 15; // Adjusted X position for full-width table
      const tableStartY = 40; // Y position of the table
      const totalTableWidth = pageWidth - 2 * tableStartX; // Total table width
      const legendColumnWidth = 15; // Smaller width for the "Legend" column
      const remainingTableWidth = totalTableWidth - legendColumnWidth; // Remaining space for other columns
      const columnCount = 5; // Number of remaining columns
      const otherColumnWidth = remainingTableWidth / columnCount; // Width of each remaining column
      const tableHeight = 12; // Reduced height of the table
      const boxWidth = 5; // Width of the color box
      const boxHeight = 9; // Height of the color box
      const textBoxGap = 1; // Gap between text and box

      // Data for the columns
      const columns = [
        { label: "Legend:", color: null, description: "" },
        { label: "", color: "#FF0000", description: "-Major discrepancy" },
        { label: "", color: "#FFFF00", description: "-Minor discrepancy" },
        { label: "", color: "#FFA500", description: "-Unable to verify" },
        { label: "", color: "#FFC0CB", description: "-Pending from source" },
        { label: "", color: "#008000", description: "-All clear" },
      ];

      // Set the border color
      doc.setDrawColor("#3e76a5");


      // Draw table border
      doc.setLineWidth(0.5);
      doc.rect(tableStartX, tableStartY, totalTableWidth, tableHeight);

      // Draw columns
      columns.forEach((col, index) => {
        const columnStartX =
          index === 0
            ? tableStartX // "Legend" column starts at tableStartX
            : tableStartX + legendColumnWidth + (index - 1) * otherColumnWidth; // Remaining columns start after the "Legend" column

        const columnWidth = index === 0 ? legendColumnWidth : otherColumnWidth;

        // Draw column separators
        if (index > 0) {
          doc.line(columnStartX, tableStartY, columnStartX, tableStartY + tableHeight);
        }

        // Add label text (for Legend)
        if (col.label) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7); // Reduced font size for better fit
          doc.text(
            col.label,
            columnStartX + 3, // Padding for text inside "Legend" column
            tableStartY + tableHeight / 2 + 2,
            { baseline: "middle" }
          );
        }

        // Add color box
        if (col.color) {
          const boxX = columnStartX + 3; // Adjusted padding for color box
          const boxY = tableStartY + tableHeight / 2 - boxHeight / 2;
          doc.setFillColor(col.color);
          doc.rect(boxX, boxY, boxWidth, boxHeight, "F");
        }

        // Add description text
        if (col.description) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7); // Reduced font size for better fit
          const textX = columnStartX + 3 + boxWidth + textBoxGap;
          const textY = tableStartY + tableHeight / 2 + 2;
          doc.text(col.description, textX, textY, { baseline: "middle" });
        }
      });


      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("End of summary report", pageWidth / 2, 20 + 10, { align: "center" });

      addFooter(doc);


      yPosition = 20;
      let annexureIndex = 1;
      for (const service of servicesData) {
        let reportFormJson;
        let rows = [];

        // Attempt to parse the JSON string and only proceed if valid
        try {
          if (!service.reportFormJson || !service.reportFormJson.json) {
            // Skip this service if reportFormJson is not found or is empty
            console.warn('No reportFormJson found for this service');
            continue; // Skip the rest of the loop for this service
          }

          // Attempt to parse the JSON string
          reportFormJson = JSON.parse(service.reportFormJson.json);

          // Only process if rows are present
          rows = reportFormJson && Array.isArray(reportFormJson.rows) ? reportFormJson.rows : [];
        } catch (error) {
          console.warn('Failed to parse reportFormJson:', error);
          continue; // Skip this service if parsing fails
        }

        if (rows.length === 0) {
          console.warn('No rows found in reportFormJson for this service');
          continue; // Skip if there are no rows
        }

        // Start adding content for the page if data is valid
        doc.addPage();
        addFooter(doc);

        let yPosition = 20;
        const serviceData = [];

        // Process the rows as needed
        rows.forEach((row) => {
          const inputLabel = row.inputs.length > 0 ? row.inputs[0].label || "Unnamed Label" : "Unnamed Label";

          const valuesObj = {};

          row.inputs.forEach((input) => {
            const inputName = input.name;

            let reportDetailsInputName = inputName.includes("report_details_") ? inputName : `report_details_${inputName}`;

            if (input.label && typeof input.label === "string") {
              input.label = input.label.replace(/:/g, "");
            }

            if (service.annexureData) {
              const value = service.annexureData[inputName] !== undefined && service.annexureData[inputName] !== null
                ? service.annexureData[inputName]
                : "";

              const reportDetailsValue = service.annexureData[reportDetailsInputName] !== undefined && service.annexureData[reportDetailsInputName] !== null
                ? service.annexureData[reportDetailsInputName]
                : "";

              valuesObj[inputName] = value;
              valuesObj["isReportDetailsExist"] = !!reportDetailsValue;
              if (reportDetailsValue) {
                valuesObj[reportDetailsInputName] = reportDetailsValue;
              }

              valuesObj["name"] = inputName.replace("report_details_", "");
            } else {
              valuesObj[inputName] = "";
              valuesObj["isReportDetailsExist"] = false;
              valuesObj[reportDetailsInputName] = "";
            }
          });

          serviceData.push({
            label: inputLabel,
            values: valuesObj,
          });
        });

        const tableData = serviceData.map((data) => {
          if (!data || !data.values) {
            return null;
          }

          const name = data.values.name;

          if (!name || name.startsWith("annexure")) {
            return null;
          }

          const isReportDetailsExist = data.values.isReportDetailsExist;
          const value = data.values[name];
          const reportDetails = data.values[`report_details_${name}`];

          if (value === undefined || value === "" || (isReportDetailsExist && !reportDetails)) {
            return null;
          }

          if (isReportDetailsExist && reportDetails) {
            return [data.label, value, reportDetails];
          } else {
            return [data.label, value];
          }
        }).filter(Boolean); // Remove null/undefined entries

        // Skip table rendering if no valid tableData
        if (tableData.length > 0) {
          const pageWidth = doc.internal.pageSize.width;

          let headingText = '';
          if (reportFormJson && reportFormJson.heading) {
            headingText = reportFormJson.heading.toUpperCase();
          } else {
            console.warn('Heading is missing or invalid.');
          }

          const backgroundColor = "#f5f5f5";
          const backgroundColorHeading = "#6495ed";
          const borderColor = "#6495ed";
          const xsPosition = 10;
          const rectHeight = 10;

          doc.setFillColor(backgroundColorHeading);
          doc.setDrawColor(borderColor);
          doc.rect(xsPosition, yPosition, pageWidth - 20, rectHeight, "FD");

          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");

          const textHeight = doc.getTextDimensions(headingText).h;
          const verticalCenter = yPosition + rectHeight / 2 + textHeight / 4;

          doc.setTextColor("#fff");
          doc.text(headingText, pageWidth / 2, verticalCenter, { align: "center" });

          yPosition += rectHeight;

          // Check if tableData is not empty before generating the table
          doc.autoTable({
            head: [
              [
                { content: "PARTICULARS", styles: { halign: "left" } },
                { content: "APPLICATION DETAILS", styles: { halign: "center" } },
                { content: "REPORT DETAILS", styles: { halign: "center" } },
              ]
            ],
            body: tableData.map((row) => {
              if (row.length === 2) {
                return [
                  { content: row[0], styles: { halign: "left", fontStyle: 'bold' } },
                  { content: row[1], colSpan: 2, styles: { halign: "left" } },
                ];
              } else {
                return [
                  { content: row[0], styles: { halign: "left", fontStyle: 'bold' } },
                  { content: row[1], styles: { halign: "left" } },
                  { content: row[2], styles: { halign: "left" } },
                ];
              }
            }),
            startY: yPosition,
            styles: {
              fontSize: 9,
              cellPadding: 3,
              lineWidth: 0.3,
              lineColor: [62, 118, 165],
            },
            theme: "grid",
            headStyles: {
              fillColor: backgroundColor,
              textColor: [0, 0, 0],
              halign: "center",
              fontSize: 10,
            },
            bodyStyles: {
              textColor: [0, 0, 0],
              halign: "left",
            },
            tableLineColor: [62, 118, 165],
            tableLineWidth: 0.5,
            margin: { horizontal: 10 },
          });

          addFooter(doc);


          yPosition = doc.lastAutoTable.finalY + 5;

          const remarksData = serviceData.find((data) => data.label === "Remarks");
          if (remarksData) {
            const remarks = service.annexureData[remarksData.values.name] || "No remarks available.";
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Remarks: ${remarks}`, 10, yPosition);
            yPosition += 7;
          }

          const annexureData = service.annexureData || {}; // Ensure annexureData is an empty object if it's null or undefined

          const annexureImagesKey = Object.keys(annexureData).find((key) =>
            key.toLowerCase().startsWith("annexure") && !key.includes("[") && !key.includes("]")
          );

          if (annexureImagesKey) {
            const annexureImagesStr = annexureData[annexureImagesKey];
            const annexureImagesSplitArr = annexureImagesStr ? annexureImagesStr.split(",") : [];

            if (annexureImagesSplitArr.length === 0) {
              doc.setFont("helvetica", "italic");
              doc.setFontSize(10);
              doc.setTextColor(150, 150, 150);
              doc.text("No annexure images available.", 10, yPosition);
              yPosition += 10;
            } else {
              const imageBases = await fetchImageToBase(annexureImagesStr.trim());
              if (imageBases) {
                imageBases.forEach((image, index) => {

                  if (!image.base64 || !image.base64.startsWith('data:image/')) {
                    console.error(`Invalid base64 data for image ${index + 1}`);
                    return;
                  }

                  const { width, height } = scaleImageForPDF(image.width, image.height, doc.internal.pageSize.width - 20, 80);
                  if (yPosition + height > doc.internal.pageSize.height - 20) {
                    doc.addPage();
                    yPosition = 10;
                  }

                  const annexureText = `Annexure ${annexureIndex} (${String.fromCharCode(97 + index)})`;
                  const textWidth = doc.getTextWidth(annexureText);
                  const centerX = (doc.internal.pageSize.width - textWidth) / 2;

                  doc.setFont("helvetica", "bold");
                  doc.setFontSize(10);
                  doc.setTextColor(0, 0, 0);
                  doc.text(annexureText, centerX, yPosition + 10);
                  yPosition += 15;

                  const centerXImage = (doc.internal.pageSize.width - width) / 2;
                  try {
                    // Ensure that the base64 data and type are correctly passed
                    doc.addImage(image.base64, image.type, centerXImage, yPosition, width, height);
                    yPosition += height + 15;
                  } catch (error) {
                    console.error(`Error adding image ${index + 1}:`, error);
                  }
                });
              }


            }
          } else {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text("No annexure images available.", 10, yPosition);
            yPosition += 15;
          }

        }


        function scaleImageForPDF(pageWidth, imageHeight, availableWidth, availableHeight) {
          // Scale to full width (stretch the image)
          const width = availableWidth;  // Stretch the image to full available width
          const height = (imageHeight * availableWidth) / pageWidth;  // Calculate the height proportionally to the new width

          return { width, height };  // Return the stretched width and height
        }




        addFooter(doc);
        annexureIndex++;
        yPosition += 20;
      }


      addFooter(doc);
      doc.addPage();

      const disclaimerButtonHeight = 10;
      const disclaimerButtonWidth = doc.internal.pageSize.width - 20;

      const buttonBottomPadding = 5;
      const disclaimerTextTopMargin = 5;

      const adjustedDisclaimerButtonHeight = disclaimerButtonHeight + buttonBottomPadding;

      const disclaimerTextPart1 = `his report is confidential and is meant for the exclusive use of the Client. This report has been prepared solely for the
purpose set out pursuant to our letter of engagement (LoE)/Agreement signed with you and is not to be used for any
other purpose. The Client recognizes that we are not the source of the data gathered and our reports are based on the
information purpose. The Client recognizes that we are not the source of the data gathered and our reports are based on
the information responsible for employment decisions based on the information provided in this report.`;
      const anchorText = "";
      const disclaimerTextPart2 = "";


      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const disclaimerLinesPart1 = doc.splitTextToSize(disclaimerTextPart1, disclaimerButtonWidth);
      const disclaimerLinesPart2 = doc.splitTextToSize(disclaimerTextPart2, disclaimerButtonWidth);


      const lineHeight = 7;
      const disclaimerTextHeight =
        disclaimerLinesPart1.length * lineHeight +
        disclaimerLinesPart2.length * lineHeight +
        lineHeight;

      const totalContentHeight = adjustedDisclaimerButtonHeight + disclaimerTextHeight + disclaimerTextTopMargin;

      const availableSpace = doc.internal.pageSize.height - 40;

      let disclaimerY = 20;

      if (disclaimerY + totalContentHeight > availableSpace) {
        doc.addPage();
        addFooter(doc);
        disclaimerY = 20;
      }

      const disclaimerButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2;


      if (disclaimerButtonWidth > 0 && disclaimerButtonHeight > 0 && !isNaN(disclaimerButtonXPosition) && !isNaN(disclaimerY)) {
        doc.setDrawColor(62, 118, 165);
        doc.setFillColor(backgroundColor);
        doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'F');
        doc.rect(disclaimerButtonXPosition, disclaimerY, disclaimerButtonWidth, disclaimerButtonHeight, 'D');
      } else {
      }

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");


      const disclaimerButtonTextWidth = doc.getTextWidth('DISCLAIMER');
      const buttonTextHeight = doc.getFontSize();


      const disclaimerTextXPosition =
        disclaimerButtonXPosition + disclaimerButtonWidth / 2 - disclaimerButtonTextWidth / 2 - 1;
      const disclaimerTextYPosition = disclaimerY + disclaimerButtonHeight / 2 + buttonTextHeight / 4 - 1;

      doc.text('DISCLAIMER', disclaimerTextXPosition, disclaimerTextYPosition);

      let currentY = disclaimerY + adjustedDisclaimerButtonHeight + disclaimerTextTopMargin;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      disclaimerLinesPart1.forEach((line) => {
        doc.text(line, 10, currentY);
        currentY += lineHeight;
      });

      doc.setTextColor(0, 0, 255);
      doc.textWithLink(anchorText, 10 + doc.getTextWidth(disclaimerLinesPart1[disclaimerLinesPart1.length - 1]), currentY - lineHeight, {
        url: "mailto:goldquest.in",
      });

      doc.setTextColor(0, 0, 0);
      disclaimerLinesPart2.forEach((line) => {
        doc.text(line, 10, currentY);
        currentY += lineHeight;
      });

      let endOfDetailY = currentY + disclaimerTextTopMargin - 5;

      if (endOfDetailY + disclaimerButtonHeight > doc.internal.pageSize.height - 20) {
        doc.addPage();
        endOfDetailY = 20;
      }

      const endButtonXPosition = (doc.internal.pageSize.width - disclaimerButtonWidth) / 2; // Centering horizontally

      if (disclaimerButtonWidth > 0 && disclaimerButtonHeight > 0 && !isNaN(endButtonXPosition) && !isNaN(endOfDetailY)) {
        doc.setDrawColor(62, 118, 165);
        doc.setFillColor(backgroundColor);
        doc.rect(endButtonXPosition, endOfDetailY, disclaimerButtonWidth, disclaimerButtonHeight, 'F');
        doc.rect(endButtonXPosition, endOfDetailY, disclaimerButtonWidth, disclaimerButtonHeight, 'D');
      } else {
      }

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");

      const endButtonTextWidth = doc.getTextWidth('END OF DETAIL REPORT');
      const endButtonTextHeight = doc.getFontSize();

      const endButtonTextXPosition =
        endButtonXPosition + disclaimerButtonWidth / 2 - endButtonTextWidth / 2 - 1;
      const endButtonTextYPosition = endOfDetailY + disclaimerButtonHeight / 2 + endButtonTextHeight / 4 - 1;

      doc.text('END OF DETAIL REPORT', endButtonTextXPosition, endButtonTextYPosition);


      // Calculate the width and height of the image dynamically using jsPDF's getImageProperties
      const imgWidth = 50;  // Adjust this scale factor as needed
      const imgHeight = 40; // Adjust this scale factor as needed

      // Calculate the X position to center the image horizontally
      const centerX = (pageWidth - imgWidth) / 2;

      // Calculate the Y position (adjust this based on where you want the image)
      const centerY = endOfDetailY + 20; // Example: Place the image 20 units below the "END OF DETAIL REPORT" text

      // Add the image to the PDF at the calculated position
      doc.addImage(verified, 'JPEG', centerX, centerY, imgWidth, imgHeight);

      // Continue with adding the footer and saving the document

      const FomratedDate = reportInfo.report_date && !isNaN(new Date(reportInfo.report_date))
        ? `${String(new Date(reportInfo.report_date).getDate()).padStart(2, '0')}-${String(new Date(reportInfo.report_date).getMonth() + 1).padStart(2, '0')}-${new Date(reportInfo.report_date).getFullYear()}`
        : 'NIL'
      addFooter(doc);

      doc.save(`${reportInfo.application_id}-${reportInfo.name}-${FomratedDate}`);

      swalLoading.close();

      // Optionally, show a success message
      Swal.fire({
        title: 'PDF Generated!',
        text: 'Your PDF has been successfully generated.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    }
    catch (error) {
      // In case of error, close the Swal loading and show an error message
      swalLoading.close();
      Swal.fire({
        title: 'Error!',
        text: 'Something went wrong while generating the PDF.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  function sanitizeText(text) {
    if (!text) return text;
    return text.replace(/_[^\w\s]/gi, ""); // Removes all non-alphanumeric characters except spaces.
  }

  const Loader = () => (
    <div className="flex w-full justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );


  const exportToExcel = () => {
    const worksheetData = currentItems.map((data, index) => ({
      "Index": index + 1,
      "Admin TAT": data.adminTAT || "NIL",
      "Location": data.location || "NIL",
      "Name": data.name || "NIL",
      "Application ID": data.application_id || "NIL",
      "Employee ID": data.employee_id || "NIL",
      "Created At": data.created_at ? new Date(data.created_at).toLocaleDateString() : "NIL",
      "Updated At": data.updated_at ? new Date(data.updated_at).toLocaleDateString() : "NIL",
      "Report Type": data.report_type || "NIL",
      "Report Date": data.report_date ? new Date(data.report_date).toLocaleDateString() : "NIL",
      "Generated By": data.report_generated_by_name || "NIL",
      "QC Done By": data.qc_done_by_name || "NIL",
      "First Level Insufficiency": data.first_insufficiency_marks || "NIL",
      "First Level Insuff Date": data.first_insuff_date ? new Date(data.first_insuff_date).toLocaleDateString() : "NIL",
      "First Level Insuff Reopen Date": data.first_insuff_reopened_date ? new Date(data.first_insuff_reopened_date).toLocaleDateString() : "NIL",
      "Second Level Insuff": data.second_insufficiency_marks || 'NIL',
      "Second Level Insuff Date": data.second_insuff_date ? new Date(data.second_insuff_date).toLocaleDateString() : "NIL",
      "Second Level Insuff Reopen Date": data.second_insuff_reopened_date ? new Date(data.second_insuff_reopened_date).toLocaleDateString() : "NIL",
      "Third Level Insuff Marks": data?.third_insufficiency_marks || 'NIL',
      "Third Level Insuff Date": data.third_insuff_date ? new Date(data.third_insuff_date).toLocaleDateString() : "NIL",
      "Third Level Insuff Reopen Date": data?.third_insuff_reopened_date ? new Date(data.third_insuff_reopened_date).toLocaleDateString() : "NIL",
      "Reason For Delay": data.delay_reason || "NIL",
      "overall_status": data?.overall_status || "NIL",
      "Delay Reason": data.delay_reason || "NIL",
      "tat_days": data?.tat_days || "NIL",
    }));



    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");

    // Save the workbook to a file
    XLSX.writeFile(wb, "Data.xlsx");
  };

  return (
    <div className="">
      <h2 className="py-4 text-2xl font-bold text-center ">
        Report & Case Status
      </h2>
      <div className="mt-8 bg-white mx-4 p-4 rounded-md">
        <div className="md:grid grid-cols-2 justify-between items-center md:my-4 border-b-2 pb-4">
          <div className="col">
            <form action="">
              <div className="flex gap-2">
                <select name="options" id="" onChange={(e) => {
                  handleSelectChange(e); // Call the select change handler
                  setCurrentPage(1); // Reset current page to 1
                }} className='outline-none pe-14 ps-2 text-left p-3 md:w-6/12 w-7/12 rounded-md border'>
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
              <div className="flex md:items-stretch items-center gap-3">
                <input
                  type="search"
                  className="outline-none border-2 p-3 text-sm rounded-md w-full my-4 md:my-0"
                  placeholder="Search Here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
        <div className="overflow-x-auto  bg-white shadow-md rounded-md">
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
            <table className="min-w-full border-collapse border overflow-scroll rounded-lg whitespace-nowrap">
              <thead className="rounded-lg">
                <tr className="bg-[#3e76a5] text-white">
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    SL NO
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    TAT Days
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    Location
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    Name
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    Reference Id
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    Generate PDF
                  </th>

                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    Photo
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    Applicant Employe Id
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    Initiation Date
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    Deadline Date
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    View More
                  </th>
                  <th className="py-3 px-4 border-b border-r-2 whitespace-nowrap uppercase">
                    Overall Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={17} className="py-4 text-center text-gray-500">
                      <Loader className="text-center" />
                    </td>
                  </tr>
                ) : (
                  <>
                    {currentItems.map((data, index) => {
                      const globalIndex = index + (currentPage - 1) * itemsPerPage; // Calculate the global index

                      return (
                        <React.Fragment key={data.id}>
                          <tr className="text-center">
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {index + 1 + (currentPage - 1) * itemsPerPage}
                            </td>

                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {adminTAT || "NIL"}
                            </td>
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {data.location || "NIL"}
                            </td>
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {data.name || "NIL"}
                            </td>
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {data.application_id || "NIL"}
                            </td>
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              <button

                                onClick={() => {
                                  const reportDownloadFlag =
                                    data.overall_status === "completed" && data.is_verify === "yes" ? 1 : 0;

                                  // Set the button to loading
                                  setLoadingStates((prevState) => ({
                                    ...prevState,
                                    [globalIndex]: true,
                                  }));

                                  // Directly call generatePDF
                                  generatePDF(globalIndex, reportDownloadFlag, data).finally(() => {
                                    setLoadingStates((prevState) => ({
                                      ...prevState,
                                      [globalIndex]: false,
                                    }));
                                  });
                                }}
                                className={`bg-[#3e76a5] uppercase border border-white hover:border-[#3e76a5] text-white px-4 py-2 rounded hover:bg-white hover:text-[#3e76a5] ${data.overall_status !== "completed" || data.is_verify !== "yes" ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={data.overall_status !== "completed" || data.is_verify !== "yes" || loadingStates[globalIndex] || isBranchApiLoading}
                              >
                                {loadingStates[globalIndex] ? "Please Wait, Your PDF is Generating" : data.overall_status === "completed" ? data.is_verify === "yes" ? "DOWNLOAD" : "QC PENDING" : "NOT READY"}
                              </button>
                            </td>
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {data.photo ? (
                                data.photo.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                  <img src={data.photo} alt="Image" className="md:h-20 h-10 w-20 rounded-full" />
                                ) : (
                                  <a href={data.photo} target="_blank" rel="noopener noreferrer">
                                    <button type="button" className="px-4 py-2 bg-[#3e76a5] text-white rounded">
                                      View Document
                                    </button>
                                  </a>
                                )
                              ) : (
                                "No Image Found"
                              )}
                            </td>
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {data.employee_id || "NIL"}
                            </td>
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {new Date(data.created_at).getDate()}-{new Date(data.created_at).getMonth() + 1}-{new Date(data.created_at).getFullYear()}
                            </td>
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {new Date(data.updated_at).getDate()}-{new Date(data.updated_at).getMonth() + 1}-{new Date(data.updated_at).getFullYear()}
                            </td>

                            <td className="border px-4  py-2">
                              <button
                                disabled={isBranchApiLoading}
                                className={`rounded-md p-3 text-white ${isBranchApiLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#3e76a5] hover:bg-[#3e76a5]'}`}
                                onClick={() => handleViewMore(index)} // Use globalIndex here
                              >
                                {expandedRow && expandedRow.index === globalIndex ? 'Less' : 'View'}
                              </button>
                            </td>
                            <td className="py-3 px-4 border-b border-r-2 whitespace-nowrap capitalize">
                              {data.overall_status || "WIP"}
                            </td>
                          </tr>

                          {servicesLoading[globalIndex] && (
                            <tr>
                              <td colSpan={12} className="py-4 text-center text-gray-500">
                                <div className="flex justify-center">
                                  <PulseLoader color="#36D7B7" loading={servicesLoading[globalIndex]} size={15} aria-label="Loading Spinner" />
                                </div>
                              </td>
                            </tr>
                          )}

                          {expandedRow && expandedRow.index === globalIndex && (
                            <tr id={`expanded-row-${globalIndex}`} className="expanded-row">
                              <td colSpan="100%" className="text-center p-4 bg-gray-100">
                                <div ref={tableRef} className="relative w-full max-w-full overflow-hidden">
                                  <table className="w-full table-auto">
                                    <tbody className="min-h-[260px] overflow-y-auto block">
                                      <tr>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">Report Type</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">Report Date</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">Report Generated By</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">QC Done By</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">First Level Insuff</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">First Level Insuff Date</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">First Level Insuff Reopen Date</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">Second Level Insuff</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">Second Level Insuff Date</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">Third Level Insuff Marks</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">Third Level Insuff Date</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">Third Level Insuff Reopen Date</th>
                                        <th className="text-left p-2 border border-black uppercase font-normal bg-gray-200">Reason For Delay</th>
                                      </tr>
                                      <tr>
                                        <td className="text-left p-2 border border-black capitalize">{data.report_type || 'NIL'}</td>

                                        <td className="text-left p-2 border border-black capitalize">
                                          {data.report_date && !isNaN(new Date(data.report_date))
                                            ? `${String(new Date(data.report_date).getDate()).padStart(2, '0')}-${String(new Date(data.report_date).getMonth() + 1).padStart(2, '0')}-${new Date(data.report_date).getFullYear()}`
                                            : 'NIL'}
                                        </td>

                                        <td className="text-left p-2 border border-black capitalize">{data.report_generated_by_name || 'NIL'}</td>
                                        <td className="text-left p-2 border border-black capitalize">{data.qc_done_by_name || 'NIL'}</td>
                                        <td className="text-left p-2 border border-black capitalize">{sanitizeText(data.first_insufficiency_marks) || 'NIL'}</td>

                                        <td className="text-left p-2 border border-black capitalize">
                                          {data.first_insuff_date && !isNaN(new Date(data.first_insuff_date))
                                            ? `${String(new Date(data.first_insuff_date).getDate()).padStart(2, '0')}-${String(new Date(data.first_insuff_date).getMonth() + 1).padStart(2, '0')}-${new Date(data.first_insuff_date).getFullYear()}`
                                            : 'NIL'}
                                        </td>

                                        <td className="text-left p-2 border border-black capitalize">
                                          {data.first_insuff_reopened_date && !isNaN(new Date(data.first_insuff_reopened_date))
                                            ? `${String(new Date(data.first_insuff_reopened_date).getDate()).padStart(2, '0')}-${String(new Date(data.first_insuff_reopened_date).getMonth() + 1).padStart(2, '0')}-${new Date(data.first_insuff_reopened_date).getFullYear()}`
                                            : 'NIL'}
                                        </td>

                                        <td className="text-left p-2 border border-black capitalize">{sanitizeText(data.second_insufficiency_marks) || 'NIL'}</td>

                                        <td className="text-left p-2 border border-black capitalize">
                                          {data.second_insuff_date && !isNaN(new Date(data.second_insuff_date))
                                            ? `${String(new Date(data.second_insuff_date).getDate()).padStart(2, '0')}-${String(new Date(data.second_insuff_date).getMonth() + 1).padStart(2, '0')}-${new Date(data.second_insuff_date).getFullYear()}`
                                            : 'NIL'}
                                        </td>

                                        <td className="text-left p-2 border border-black capitalize">{sanitizeText(data.third_insufficiency_marks) || 'NIL'}</td>

                                        <td className="text-left p-2 border border-black capitalize">
                                          {data.third_insuff_date && !isNaN(new Date(data.third_insuff_date))
                                            ? `${String(new Date(data.third_insuff_date).getDate()).padStart(2, '0')}-${String(new Date(data.third_insuff_date).getMonth() + 1).padStart(2, '0')}-${new Date(data.third_insuff_date).getFullYear()}`
                                            : 'NIL'}
                                        </td>

                                        <td className="text-left p-2 border border-black capitalize">
                                          {data.third_insuff_reopened_date && !isNaN(new Date(data.third_insuff_reopened_date))
                                            ? `${String(new Date(data.third_insuff_reopened_date).getDate()).padStart(2, '0')}-${String(new Date(data.third_insuff_reopened_date).getMonth() + 1).padStart(2, '0')}-${new Date(data.third_insuff_reopened_date).getFullYear()}`
                                            : 'NIL'}
                                        </td>

                                        <td className="text-left p-2 border border-black capitalize">{sanitizeText(data.delay_reason) || 'NIL'}</td>
                                      </tr>
                                      <tbody style={{ maxHeight: '200px', overflowY: 'auto', display: 'block' }}>
                                        {expandedRow.headingsAndStatuses && expandedRow.headingsAndStatuses.length > 0 && (
                                          <tbody style={{ maxHeight: '200px', overflowY: 'auto', display: 'block' }}>
                                            {expandedRow.headingsAndStatuses.map((item, idx) => (
                                              <tr key={`row-${idx}`}>
                                                <td className="text-left p-2 border border-black capitalize bg-gray-200">
                                                  {sanitizeText(item.heading)}
                                                </td>
                                                <td className="text-left p-2 border border-black capitalize">
                                                  {sanitizeText(item.status || 'NIL')}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        )}

                                      </tbody>
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}

                  </>
                )}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-6">
              <p>No Data Found</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end  rounded-md bg-white px-4 py-3 sm:px-6 md:m-4 mt-2">
          <button
            onClick={showPrev}
            disabled={currentPage === 1}
            className="inline-flex items-center rounded-0 border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            aria-label="Previous page"
          >
            <MdArrowBackIosNew />
          </button>
          <div className="flex items-center">{renderPagination()}</div>
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
  );
};

export default ReportCaseTable;
