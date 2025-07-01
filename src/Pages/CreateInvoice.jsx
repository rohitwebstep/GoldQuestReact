import React, { useEffect, useState, useCallback } from 'react';
import { useData } from './DataContext';
import SelectSearch from 'react-select-search';
import 'react-select-search/style.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useCustomFunction } from '../CustomFunctionsContext';
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext
import logoImg from '../Images/logo-both.png'
import jaySignature from '../Images/jay-signature.png'
const CreateInvoice = () => {
  const { isApiLoading, setIsApiLoading } = useApiCall(); // Access isApiLoading from ApiCallContext

  const wordify = useCustomFunction();
  const { listData, fetchData } = useData();
  const [clientCode, setClientCode] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loader state

  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: '',
    month: '',
    year: '',
    exportType: '',
    gstApplicable:'',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const options = listData.map((client) => ({
    name: client.name + `(${client.client_unique_id})`,
    value: client.main_id,
    clientId: client.client_unique_id

  }));



  useEffect(() => {
    if (!isApiLoading) {
      fetchData();
    }

  }, [fetchData]);

  const handleDateChange = useCallback((date, name) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: date,
    }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true); // Show loader
    setIsApiLoading(true);
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    const queryString = new URLSearchParams({
      customer_id: clientCode,
      admin_id: admin_id,
      _token: storedToken,
      month: formData.month,
      year: formData.year,
      exportType: formData.exportType,
      gstApplicable: formData.gstApplicable,
    }).toString();

    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    const swalInstance = Swal.fire({
      title: 'Processing...',
      text: 'Please wait while we generate your invoice',
      didOpen: () => {
        Swal.showLoading(); // This starts the loading spinner
      },
      allowOutsideClick: false, // Prevent closing Swal while processing
      showConfirmButton: false, // Hide the confirm button
    });

    // Make the fetch call to generate the invoice
    fetch(`https://api.goldquestglobal.in/generate-invoice?${queryString}`, requestOptions)
      .then((response) => {
        if (!response.ok) {
          const newToken = response._token || response.token;
          if (newToken) {
            localStorage.setItem("_token", newToken);
          }
          // If response is not OK, handle the error
          return response.json().then((result) => {
            const errorMessage = result?.message || "An unknown error occurred";
            const newToken = result._token || result.token;
            if (newToken) {
              localStorage.setItem("_token", newToken);
            }

            // Check if the error message contains "invalid token" (case-insensitive)
            if (result?.message && result.message.toLowerCase().includes("invalid token")) {
              Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again.",
                icon: "warning",
                confirmButtonText: "Ok",
              }).then(() => {
                // Redirect to the login page
                window.location.href = "/admin-login"; // Replace with your login route
              });
              return; // Prevent further execution if session has expired
            }

            // Show the error message from API response
            Swal.fire({
              title: "Error",
              text: errorMessage,
              icon: "error",
              confirmButtonText: "Ok",
            });

            throw new Error(errorMessage); // Throw error to skip further code execution
          });
        }

        // If response is OK, parse the JSON body and proceed
        return response.json();
      })
      .then((data) => {
        const newToken = data._token || data.token;
        if (newToken) {
          localStorage.setItem("_token", newToken); // Update the token in localStorage
        }

        // **Check for token expiration again if it's not handled earlier**
        if (data.message && data.message.toLowerCase().includes("invalid token")) {
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            // Redirect to admin login page
            window.location.href = "/admin-login"; // Replace with your login route
          });
          return; // Stop further execution if session has expired
        }

        let applications = [];
        if (Array.isArray(data.applications)) {
          applications = data.applications; // Set applications from response if valid
        }

        const serviceNames = data?.serviceNames || [];
        const customer = data?.customer || [];
        const companyInfo = data?.companyInfo || [];
        const {
          costInfo: { overallServiceAmount, cgst, sgst, totalTax, totalAmount } = {},
          serviceInfo = [],
        } = data?.finalArr || {}; // Destructure costInfo and serviceInfo from finalArr
        console.log('formData', formData);
        // If there are applications, generate the PDF
        if (applications.length > 0) {
          if (formData.exportType == 'pdf') {
            generatePdf(
              serviceNames,
              customer,
              applications,
              companyInfo,
              overallServiceAmount,
              cgst,
              totalTax,
              totalAmount,
              serviceInfo,
              sgst,
              formData.gstApplicable,
            );
          } else if (formData.exportType == 'excel') {
            generateExcel(
              serviceNames,
              customer,
              applications,
              companyInfo,
              overallServiceAmount,
              cgst,
              totalTax,
              totalAmount,
              serviceInfo,
              sgst
            );
          }
          console.log('overallServiceAmount', overallServiceAmount)

          Swal.fire({
            title: "Success!",
            text: "PDF generated successfully.",
            icon: "success",
            confirmButtonText: "Ok",
          });
        } else {
          // No applications found
          Swal.fire({
            title: 'No Application Found',
            text: 'There are no applications available to generate an invoice.',
            icon: 'warning',
            confirmButtonText: 'OK',
          });
        }
      })
      .catch((error) => {
        // If an error occurs in the fetch or .then() blocks
        Swal.fire({
          title: "Error",
          text: error.message || "An unexpected error occurred. Please try again.",
          icon: "error",
          confirmButtonText: "Ok",
        });
      })
      .finally(() => {
        swalInstance.close(); // Close the processing Swal
        setIsLoading(false);
        setIsApiLoading(false);
        // Hide loader after process is complete
      });
  };




  function getTotalAdditionalFeeByService(serviceId, applications) {
    let totalFee = 0;

    // Check if applications is an array and contains elements
    if (Array.isArray(applications) && applications.length > 0) {
      for (const appGroup of applications) {
        if (appGroup.applications && Array.isArray(appGroup.applications)) {
          for (const application of appGroup.applications) {
            if (application.statusDetails && Array.isArray(application.statusDetails)) {
              for (const statusDetail of application.statusDetails) {
                if (statusDetail.serviceId === String(serviceId)) {
                  const fee = parseFloat(statusDetail.additionalFee) || 0;
                  totalFee += fee;
                }
              }
            }
          }
        }
      }
    }

    return totalFee;
  }

  function getTotalApplicationCountByService(serviceId, applications) {
    let count = 0;

    if (Array.isArray(applications) && applications.length > 0) {
      for (const appGroup of applications) {
        if (appGroup.applications && Array.isArray(appGroup.applications)) {
          for (const application of appGroup.applications) {
            if (
              application.statusDetails &&
              Array.isArray(application.statusDetails)
            ) {
              const hasMatchingService = application.statusDetails.some(
                (statusDetail) => statusDetail.serviceId === String(serviceId)
              );
              if (hasMatchingService) {
                count++;
              }
            }
          }
        }
      }
    }

    return count;
  }


  function calculatePercentage(amount, percentage) {
    return (amount * percentage) / 100;
  }
  function getServicePriceById(serviceId, serviceInfo) {
    const service = serviceInfo.find(item => item.serviceId === serviceId);
    return service ? service.price : "NIL";
  }
  function getTotalAdditionalFee(id, applications) {
    for (const appGroup of applications) {
      for (const application of appGroup.applications) {
        if (application.id === id) {

          const totalAdditionalFee = application.statusDetails.reduce((total, statusDetail) => {
            const fee = parseFloat(statusDetail.additionalFee) || 0;
            return total + fee;
          }, 0);
          return totalAdditionalFee;
        }
      }
    }

    return 0;
  }

  function addFooter(doc) {

    const footerHeight = 15;
    const pageHeight = doc.internal.pageSize.height;
    const footerYPosition = pageHeight - footerHeight + 10;

    const pageWidth = doc.internal.pageSize.width;
    const centerX = pageWidth / 2;

    const pageCount = doc.internal.getNumberOfPages();
    const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
    const pageNumberText = `Page ${currentPage} / ${pageCount}`;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.text(pageNumberText, centerX, footerYPosition - 3, { align: 'center' });
  }


const generateExcel = (
  serviceNames,
  customer,
  applications,
  companyInfo,
  overallServiceAmount,
  cgst,
  totalTax,
  totalAmount,
  serviceInfo,
  sgst
) => {
  const serviceCodes = serviceNames.map(service => service.shortCode);
  const headers = [
    "SL NO", "Application ID", "Employee ID", "Case Received", "Candidate Full Name",
    ...serviceCodes, "Add Fee", "Pricing", "Report Date"
  ];

  const serviceTotals = Array(serviceNames.length).fill(0);
  let overallPricing = 0;
  let overAllAdditionalFee = 0;

  const rows = (applications[0]?.applications?.length > 0)
    ? applications[0].applications.map((app, index) => {
      let totalCost = 0;
      const appAdditionalFee = getTotalAdditionalFee(app.id, applications) || 0;
      overAllAdditionalFee += appAdditionalFee;

      const row = [
        index + 1,
        app.application_id,
        app.employee_id,
        app.created_at ? app.created_at.split("T")[0] : "N/A",
        app.name,
        ...serviceNames.map((service, i) => {
          if (!service || !service.id) return "NIL";

          const serviceExists = Array.isArray(app?.statusDetails) &&
            app.statusDetails.some(
              detail => String(detail?.serviceId) === String(service?.id)
            );

          if (serviceExists) {
            const colPrice = getServicePriceById(service.id, serviceInfo) || 0;
            service.serviceIndexPrice = (service.serviceIndexPrice || 0) + colPrice;
            totalCost += colPrice;
            serviceTotals[i] += colPrice;
            return colPrice;
          } else {
            return "NIL";
          }
        }),
        appAdditionalFee,
        totalCost + appAdditionalFee,
        app.report_date ? app.report_date.split("T")[0] : ""
      ];

      overallPricing += totalCost + appAdditionalFee;
      return row;
    })
    : [];

  // Total row
  const totalRow = [
    "Total", "", "", "", "",
    ...serviceTotals,
    overAllAdditionalFee,
    overallPricing,
    ""
  ];

  rows.push(totalRow);

  // Final Excel Sheet Array
  const worksheetData = [headers, ...rows];

  // Create worksheet and workbook
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

  // Download Excel file
  XLSX.writeFile(workbook, `Applications_Report_${Date.now()}.xlsx`);
};

  const generatePdf = (serviceNames, customer, applications, companyInfo, overallServiceAmount, cgst, totalTax, totalAmount, serviceInfo, sgst,gstApplicable) => {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10; // Initial y-position for content alignment

    // Set Logo

    const imgWidth = 80;
    const imgHeight = 30;
    doc.addImage(logoImg, 'PNG', 10, yPosition, imgWidth, imgHeight);



    const addressLines = companyInfo.address.split(',');

    let formattedLine1 = '';
    let formattedLine2 = '';
    let formattedLine3 = '';

    // Loop through the address array
    for (let i = 0; i < addressLines.length; i++) {
      if (i === 0) {
        formattedLine1 += addressLines[i]; // First element
      } else if (i === 1) {
        formattedLine1 += `, ${addressLines[i]}`; // Second element
      } else if (i === 2) {
        formattedLine2 = addressLines[i]; // Third element
      } else if (i >= 4 && i <= 6) {
        // For Bangalore, Karnataka, and India
        if (i > 4) {
          formattedLine3 += `, `;
        }
        formattedLine3 += addressLines[i];
      } else if (i === 7) {
        formattedLine3 += `, ${addressLines[i]}`; // Pincode
      }
    }

    const companyInfoArray = [
      companyInfo.name,
      companyInfo.gstin,
      formattedLine1,
      formattedLine2,
      formattedLine3,
      "Website: http://www.goldquestglobal.in"
    ];

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const rightMargin = 10;

    // Align text to the right of the logo
    companyInfoArray.forEach((line, index) => {
      if (line.includes("Website:")) {
        doc.setTextColor(9, 138, 196);
        doc.text(line, pageWidth - rightMargin, yPosition + (index * 5), { align: 'right' }); // Positioned to the right of the logo
        doc.setTextColor(0, 0, 0);  // RGB color for black
      } else {
        doc.text(line, pageWidth - rightMargin, yPosition + (index * 5), { align: 'right' }); // Positioned to the right of the logo
      }
    });
    addFooter(doc)
    yPosition += imgHeight + 20;


    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 3;

    doc.setLineWidth(0.3);
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 5;

    const sectionWidth = pageWidth * 0.8; // Total width for the content (60% of the page width)
    const sectionLeftMargin = (pageWidth - sectionWidth) / 2; // Center the 60% section horizontally
    const columnWidth = sectionWidth / 2; // Divide into two equal columns


    const billToXPosition = sectionLeftMargin; // Start at the left margin of the section
    const billToYPosition = yPosition; // Start at the top

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", billToXPosition, billToYPosition + 5); // Left-aligned in the first column
    doc.setFont("helvetica", "normal");
    doc.text(`Attention: ${customer.name}`, billToXPosition, billToYPosition + 13);
    const address = customer.address;

    // Find the index of the second comma
    const firstCommaIndex = address.indexOf(',');
    const secondCommaIndex = address.indexOf(',', firstCommaIndex + 1);

    // Split the address into two parts at the second comma
    const part1 = address.substring(0, secondCommaIndex).trim();  // Text before the second comma
    const part2 = address.substring(secondCommaIndex + 1).trim();  // Text after the second comma

    // Display the parts in the PDF
    let currentYPosition = billToYPosition + 18;
    doc.text('Location:' + part1, billToXPosition, currentYPosition);
    currentYPosition += 6; // Adjust vertical spacing
    doc.text(part2, billToXPosition, currentYPosition);


    const billToEndYPosition = billToYPosition + 25; // Adjust based on the content height

    const invoiceDetailsXPosition = billToXPosition + columnWidth; // Start at the middle of the section
    let invoiceYPosition = billToEndYPosition - 20; // Add spacing between BILL TO and Invoice Details

    const invoiceDetails = [
      ["GSTIN", `${customer.gst_number}`],
      ["State", `${customer.state}`],
      ["Invoice Date", new Date(formData.invoice_date).toLocaleDateString()],
      ["Invoice Number", `${formData.invoice_number}`],
      ["State Code", `${customer.state_code}`]
    ];


    const labelXPosition = invoiceDetailsXPosition + 30; // Start at the right column margin
    const valueXPosition = invoiceDetailsXPosition + 70; // Add spacing between label and value
    const cellHeight = 6; // Height of each cell

    invoiceDetails.forEach(([label, value]) => {

      doc.text(`${label}:`, labelXPosition, invoiceYPosition);


      doc.text(value, valueXPosition, invoiceYPosition);
      doc.rect(valueXPosition - 2, invoiceYPosition - cellHeight + 2, 50, cellHeight); // Adjust width as needed

      invoiceYPosition += cellHeight; // Move down for the next line
    });

    invoiceYPosition += 5;


    addFooter(doc)
    const headers1 = [["Product Description", "SAC Code", "Qty", "Rate", "Additional Fee", "Taxable Amount"]];
    let overallServiceAdditionalFeeAmount = 0;
    let overallServiceAmountRaw = 0
    const rows1 = serviceInfo.map(service => {
      const serviceAdditionalFee = getTotalAdditionalFeeByService(service.serviceId, applications);
      const serviceCount = getTotalApplicationCountByService(service.serviceId, applications);

      const unitPrice = (service.price ?? 0) + serviceAdditionalFee;
      const servicePrice = unitPrice * serviceCount;

      overallServiceAdditionalFeeAmount += serviceAdditionalFee;
      overallServiceAmountRaw += servicePrice ?? 0;

      return [
        service.serviceTitle ?? '',
        "998521",
        serviceCount.toString(),
        (service.price ?? 0).toString(),
        serviceAdditionalFee.toString(),
        (servicePrice ?? 0).toString()
      ];
    });


    const tableWidth = doc.internal.pageSize.width * 0.8; // Set the width to 60% of page width
    const leftMargin = (doc.internal.pageSize.width - tableWidth) / 2; // Center the table horizontally

    doc.autoTable({
      startY: invoiceYPosition + 5,
      head: headers1,
      body: rows1,
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.4 },
      bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.4, textColor: [0, 0, 0], },
      theme: 'grid',
      textColor: [0, 0, 0],
      margin: { top: 10, bottom: 10, left: leftMargin, right: leftMargin },
      pageBreak: 'auto',
    });
    addFooter(doc)

    const pageWidths = doc.internal.pageSize.width;
    const tableWidths = pageWidths * 0.8; // 80% of the page width (adjusted for better fit)

    // Set the initial Y position for the invoice
    invoiceYPosition = doc.autoTable.previous.finalY + 20;

    // Set font for title
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(0, 0, 0); // Set line color to black (RGB: 0, 0, 0)
    doc.setLineWidth(0.5);

    // Draw a border around the title text
    invoiceYPosition = 20;
    doc.addPage();
    const titleX = 29.5;
    const titleY = invoiceYPosition - 10; // Adjust slightly above to center the title
    const titleWidth = 119; // Add some padding to width
    const titleHeight = 10; // Height of the border around the title
    doc.rect(titleX, titleY - 1, titleWidth, titleHeight); // Draw a border around the title
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold");
    doc.text("GoldQuest Global Bank Account Details", titleX + 2, titleY + 5); // Adjusted for proper vertical centering

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9)

    const bankDetails = [
      ["Bank Name", String(companyInfo.bank_name)],
      ["Bank A/C No", String(companyInfo.bank_account_number)],
      ["Bank Branch", String(companyInfo.bank_branch_name)],
      ["Bank IFSC/ NEFT/ RTGS", String(companyInfo.bank_ifsc)],
      ["MICR", String(companyInfo.bank_micr)],
    ];

    const bankDetailsLeftX = (pageWidths - tableWidths) / 2; // Left X position of the bank details table
    const taxDetailsRightX = bankDetailsLeftX + tableWidths / 2; // Right X position of the tax details table

    const bankLabelColumnWidth = tableWidths / 4; // Half of the total table width for labels
    const bankValueColumnWidth = tableWidths / 4; // Half of the total table width for values

    const startY = invoiceYPosition - 1; // Starting position after the title
    const rowHeight = 6;

    for (let i = 0; i < bankDetails.length; i++) {
      const label = bankDetails[i][0];
      const value = bankDetails[i][1];

      doc.rect(bankDetailsLeftX, startY + i * rowHeight, bankLabelColumnWidth, rowHeight); // Label cell
      doc.rect(bankDetailsLeftX + bankLabelColumnWidth, startY + i * rowHeight, bankValueColumnWidth, rowHeight); // Value cell

      // Justify the text within the cells
      doc.text(label, bankDetailsLeftX + 6, startY + i * rowHeight + 4); // Label text
      doc.text(value, bankDetailsLeftX + bankLabelColumnWidth + 2, startY + i * rowHeight + 4); // Value text
    }

    // Tax Details Calculation
    doc.setFontSize(8)
    const parsedServiceAmount = parseInt(overallServiceAmountRaw) || 0;
    const parsedAdditionalFee = parseInt(overallServiceAdditionalFeeAmount) || 0;
    console.log('parsedServiceAmount', parsedServiceAmount);
    console.log('parsedAdditionalFee', parsedAdditionalFee);
    console.log('overallServiceAmountRaw', overallServiceAmountRaw);


    const newOverallServiceAmount = parsedServiceAmount + parsedAdditionalFee;

    const cgstPercent = parseFloat(cgst?.percentage) || 0;
    const sgstPercent = parseFloat(sgst?.percentage) || 0;

    const cgstTax = calculatePercentage(newOverallServiceAmount, cgstPercent);
    const sgstTax = calculatePercentage(newOverallServiceAmount, sgstPercent);

    const totalTaxPercent = cgstPercent + sgstPercent;
    const totalAmountWithTax = newOverallServiceAmount + cgstTax + sgstTax;

    const taxDetails = [
      { label: "Total Amount Before Tax", amount: String(newOverallServiceAmount) },
    ];

    if (customer.state_code === "29") {
      taxDetails.push(
        { label: `Add: CGST - ${cgstPercent}%`, amount: String(cgstTax) },
        { label: `Add: SGST - ${sgstPercent}%`, amount: String(sgstTax) },
        { label: `Total Tax - ${totalTaxPercent}%`, amount: String(cgstTax + sgstTax) }
      );
    } else {
      taxDetails.push(
        { label: `IGST - ${totalTaxPercent}%`, amount: String(cgstTax + sgstTax) }
      );
    }

    taxDetails.push(
      { label: "Total Tax Amount (Round off)", amount: String(totalAmountWithTax) },
      { label: "GST On Reverse Charge", amount: "No" }
    );



    const taxLabelColumnWidth = tableWidths / 4;
    const taxValueColumnWidth = tableWidths / 4.5;

    const taxStartY = startY - 10;
    addFooter(doc)
    for (let i = 0; i < taxDetails.length; i++) {
      const taxDetail = taxDetails[i];
      const label = taxDetail.label;
      const amount = taxDetail.amount;

      const taxLabelX = taxDetailsRightX + 10;
      const taxAmountX = taxLabelX + taxLabelColumnWidth - 2;
      doc.setFontSize(10)
      // Make specific labels bold
      if (label === "Total Amount Before Tax" || label === "Total Tax Amount (Round off)") {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }

      doc.rect(taxAmountX, taxStartY + i * rowHeight, taxValueColumnWidth, rowHeight);

      doc.text(label, taxLabelX + 2, taxStartY + i * rowHeight + 4); // Label text

      const textWidth = doc.getTextWidth(amount);
      const centerX = taxAmountX + (taxValueColumnWidth - textWidth) / 2; // Center-align amount text
      doc.text(amount, centerX, taxStartY + i * rowHeight + 5); // Center-aligned value text

      doc.setFont("helvetica", "normal");
    }
    invoiceYPosition = startY + taxDetails.length * rowHeight + 4; // Ensure the final Y position is updated
    addFooter(doc)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12)

    const pageWidthHere = doc.internal.pageSize.width;
    const contentWidth = pageWidthHere * 0.8; // 80% of the page width
    const leftX = (pageWidthHere - contentWidth) / 2; // Center the content

    // Draw a border around the area where the label and amount will appear
    doc.setDrawColor(0, 0, 0); // Set border color to black
    doc.setLineWidth(0.5); // Set border thickness

    if (customer.state_code === "29") {
      doc.rect(leftX, invoiceYPosition - 1, contentWidth, 12); // Intra-state
    } else {
      doc.rect(leftX, invoiceYPosition + 5, contentWidth, 12); // Inter-state
    }

    doc.setFont("helvetica", "normal");

    // Ensure numeric sum before converting to words
    const totalInvoiceAmount = Number(newOverallServiceAmount) + Number(cgstTax) + Number(sgstTax);
    const words = wordify(totalInvoiceAmount);

    // Add label with padding (2 units) to avoid overlap with the border
    if (customer.state_code === "29") {
      doc.text("Invoice Amount in Words: " + words + " Rupees Only", leftX + 2, invoiceYPosition + 6);
    }
    else {
      doc.text("Invoice Amount in Words: " + words + " Rupees Only", leftX + 2, invoiceYPosition + 13);
    }



    // Application Details Table
    doc.addPage();
    const serviceCodes = serviceNames.map(service => service.shortCode);
    let overAllAdditionalFee = 0;
    // doc.addPage('landscape');
    const annexureText = "Annexure";
    const annexureFontSize = 12; // Font size for Annexure text
    const annexureBorderColor = [0, 0, 0]; // Blue color for the border

    // Calculate the horizontal center of the page
    const annexureTextWidth = doc.getTextWidth(annexureText);
    const annexureXPosition = (pageWidth - annexureTextWidth) / 2;

    // Set Y position for the Annexure text
    const annexureYPosition = 20; // Adjust based on the spacing required

    // Draw the text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(annexureFontSize);
    doc.setTextColor(0, 0, 0); // Black text color
    doc.text(annexureText, annexureXPosition, annexureYPosition, { align: 'center' });

    // Draw the blue border below the Annexure text
    const borderMargin = 30; // Margin from left and right
    const borderYPosition = annexureYPosition + 2; // Slightly below the text
    doc.setLineWidth(0.5);
    doc.setDrawColor(...annexureBorderColor);
    doc.line(borderMargin, borderYPosition, pageWidth - borderMargin, borderYPosition);


    /*
    const headers3 = [
      ["SL NO", "Application ID", "Employee ID", "Case Received", "Candidate Full Name", ...serviceCodes, "Add Fee", "CGST", "SGST", "Pricing", "Report Date"]
    ];
    */

    const headers3 = [
      ["SL NO", "Application ID", "Employee ID", "Case Received", "Candidate Full Name", ...serviceCodes, "Add Fee", "Pricing", "Report Date"]
    ];

    // Initialize total tracking
    const serviceTotals = Array(serviceNames.length).fill(0);
    let overallPricing = 0;

    const rows3 = (applications[0]?.applications?.length > 0)
      ? applications[0].applications.map((app, index) => {
        let totalCost = 0;
        const appAdditionalFee = getTotalAdditionalFee(app.id, applications) || 0;
        overAllAdditionalFee += appAdditionalFee;

        const applicationRow = [
          index + 1,
          app.application_id,
          app.employee_id,
          app.created_at ? app.created_at.split("T")[0] : "N/A",
          app.name,
          ...serviceNames.map((service, i) => {
            if (!service || !service.id) return "NIL";

            const serviceExists = Array.isArray(app?.statusDetails) &&
              app.statusDetails.some(
                detail => String(detail?.serviceId) === String(service?.id)
              );

            if (serviceExists) {
              const colPrice = getServicePriceById(service.id, serviceInfo) || 0;
              service.serviceIndexPrice = (service.serviceIndexPrice || 0) + colPrice;
              totalCost += colPrice;
              serviceTotals[i] += colPrice; // Accumulate per-service totals
              return colPrice;
            } else {
              return "NIL";
            }
          }),
          appAdditionalFee,
        ];

        const pricingTotal = totalCost + appAdditionalFee;
        overallPricing += pricingTotal;

        applicationRow.push(pricingTotal);
        applicationRow.push(app.report_date ? app.report_date.split("T")[0] : "");

        return applicationRow;
      })
      : [];

    // Create final total row
    const totalRow = [
      {
        content: "Total",
        colSpan: 5,
        styles: { halign: 'center', fontStyle: 'bold' }
      },
      ...serviceTotals.map(total => ({
        content: total || 0,
        styles: { fontStyle: 'bold' }
      })),
      {
        content: overAllAdditionalFee || 0,
        styles: { fontStyle: 'bold' }
      },
      {
        content: overallPricing || 0,
        styles: { fontStyle: 'bold' }
      },
      {
        content: "",
        styles: { fontStyle: 'bold' }
      }
    ];


    // Add total row tthe table
    rows3.push(totalRow);

    // Table rendering
    const tableWidthNew = doc.internal.pageSize.width - 20;
    const leftMarginNew = (doc.internal.pageSize.width - tableWidthNew) / 2;

    doc.autoTable({
      startY: annexureYPosition + 10,
      head: headers3,
      body: rows3,
      styles: { fontSize: 8, halign: 'center', cellWidth: 'auto' },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        textColor: [0, 0, 0]
      },
      theme: 'grid',
      margin: { top: 10, bottom: 10, left: leftMarginNew, right: leftMarginNew },
      x: 0,
    });


    addFooter(doc)

    addNotesPage(doc)

    addFooter(doc)
    if (customer.id === clientCode) {
      // If the customer ID matches the clientCode, use the client_unique_id
      const clientUniqueId = customer.client_unique_id;

      // Finalize and Save PDF using customer.client_unique_id in the filename
      doc.save(`${clientUniqueId}_${formData.invoice_date}_Invoice`);
    } else {
      // If the IDs don't match, you can handle this case as needed
    }

  }
  function addNotesPage(doc) {
    doc.addPage();

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const leftMargin = 10;
    const rightMargin = 10;

    const boxYPosition = 20;
    const boxHeight = 30;
    const boxWidth = pageWidth - leftMargin - rightMargin;

    doc.setLineWidth(0.5);
    doc.rect(leftMargin, boxYPosition, boxWidth, boxHeight);

    const headerText = "SPECIAL NOTES, TERMS AND CONDITIONS";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(headerText, pageWidth / 2, boxYPosition + 6, { align: 'center' });

    const notesText = `
Make all your payment Cheques, RTGS/NEFT Payable to: "GOLDQUEST GLOBAL HR SERVICES PRIVATE LIMITED". Payment to be made as per the terms of Agreement. Payments received after the due date shall be liable for interest @ 3% per month, part of month taken as full month. Any discrepancy shall be intimated within 3 working days of receipt of bill. Please email us at accounts@goldquestglobal.com or Contact Us: +91 8754562623.
    `;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(notesText, leftMargin + 2, boxYPosition + 8, { maxWidth: boxWidth - 4 });

    // Position "Thank you" text on the left side
    const thankYouText = "[ Thank you for your patronage ]";
    const thankYouXPosition = leftMargin + 5; // Adjust this value to your preference
    const thankYouYPosition = boxYPosition + boxHeight + 20;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(thankYouText, thankYouXPosition, thankYouYPosition);

    // Position signature image on the right side
    const signatureYPosition = thankYouYPosition + 20;
    const signatureImageWidth = 50;
    const signatureImageHeight = 20;
    const signatureXPosition = pageWidth - rightMargin - signatureImageWidth;

    doc.addImage(jaySignature, 'PNG', signatureXPosition, signatureYPosition - signatureImageHeight, signatureImageWidth, signatureImageHeight);
  }
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="p-2 md:p-12">
      <div className="bg-white p-3 md:p-12 rounded-md w-full mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#3e76a5]">Generate Invoice</h2>
        <form onSubmit={handleSubmit} className="">
          <div className='mb-3'>
            <label htmlFor="clrefin" className="block  mb-2 text-gray-700 text-sm uppercase font-bold ">Client Code:</label>
            <SelectSearch
              options={options}
              value={clientCode}
              name="language"
              placeholder="Choose client code"
              onChange={(value) => setClientCode(value, options)}
              search
            />
          </div>
          <div>
            <label htmlFor="invoice_number" className="block text-gray-700 text-sm uppercase font-bold  mb-2">Invoice Number:</label>
            <input
              type="text"
              name="invoice_number"
              id="invoice_number"
              required
              className="w-full border-gray-300 shadow-md p-3  mb-[20px] border border-gray-300 rounded-md"
              value={formData.invoice_number}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="invoice_date" className="block text-gray-700 text-sm uppercase font-bold  mb-2">Invoice Date:</label>
            {/* <input
              type="date"
              name="invoice_date"
              id="invoice_date"
              required
              className="w-full border-gray-300 shadow-md p-3  mb-[20px] text-gray-700 text-sm uppercase  border border-gray-300 rounded-md"
              value={formData.invoice_date}
              onChange={handleChange}
            /> */}
            <DatePicker
              selected={formData.invoice_date}
              onChange={(date) => handleDateChange(date, 'invoice_date')}
              dateFormat="dd-MM-yyyy"
              className="w-full border-gray-300 shadow-md p-3  mb-[20px] text-gray-700 text-sm uppercase  border border-gray-300 rounded-md"
              name="invoice_date"
              id="invoice_date"
            />
          </div>
          <div>
            <label htmlFor="moinv" className="block text-gray-700 text-sm uppercase font-bold  mb-2">Month & Year:</label>
            <select
              id="month"
              name="month"
              required
              className="w-full border-gray-300 shadow-md p-3  mb-[20px] border text-gray-700 text-sm uppercase border-gray-300 rounded-md"
              value={formData.month}
              onChange={handleChange}
            >
              <option value="">--Select Month--</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={String(i + 1).padStart(2, '0')}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              id="year"
              name="year"
              required
              className="w-full border-gray-300 shadow-md p-3 mb-[20px] border text-gray-700 text-sm uppercase border-gray-300 rounded-md"
              value={formData.year}
              onChange={handleChange}
            >
              <option value="">--Select Year--</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="exportType" className="block text-gray-700 text-sm uppercase font-bold  mb-2">Export Type</label>
            <select
              id="exportType"
              name="exportType"
              required
              className="w-full border-gray-300 shadow-md p-3  mb-[20px] border text-gray-700 text-sm uppercase border-gray-300 rounded-md"
              value={formData.exportType}
              onChange={handleChange}
            >
              <option value="">--Select Type--</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>

            </select>
          </div>
             <div>
            <label htmlFor="gstApplicable" className="block text-gray-700 text-sm uppercase font-bold  mb-2">GST Applicable</label>
            <select
              id="gstApplicable"
              name="gstApplicable"
              required
              className="w-full border-gray-300 shadow-md p-3  mb-[20px] border text-gray-700 text-sm uppercase border-gray-300 rounded-md"
              value={formData.gstApplicable}
              onChange={handleChange}
            >
              <option value="">--Select--</option>
              <option value="yes">YES</option>
              <option value="no">NO</option>

            </select>
          </div>
          <div className="text-left">
            <button
              type="submit"
              className="p-6 py-3 bg-[#3e76a5] text-white font-bold rounded-md hover:bg-blue-400 disabled:bg-gray-400"
              disabled={isLoading || isApiLoading} // Button is disabled while loading
            >
              {isLoading ? "Please Wait Your PDF is Generating..." : "Submit"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoice;
