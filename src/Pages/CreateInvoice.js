import React, { useEffect, useState } from 'react';
import { useData } from './DataContext';
import SelectSearch from 'react-select-search';
import 'react-select-search/style.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';
import { useCustomFunction } from '../CustomFunctionsContext';
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext
import logoImg from '../Images/logo-both.png'
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
    clientId:client.client_unique_id

  }));
 


  useEffect(() => {
    if (!isApiLoading) {
      fetchData();
    }

  }, [fetchData]);

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

        // If there are applications, generate the PDF
        if (applications.length > 0) {
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
            sgst
          );

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

  const generatePdf = (serviceNames, customer, applications, companyInfo, overallServiceAmount, cgst, totalTax, totalAmount, serviceInfo, sgst) => {
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
    doc.text('Location:'+part1, billToXPosition, currentYPosition);
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
    const rows1 = serviceInfo.map(service => {
      const serviceAdditionalFee = getTotalAdditionalFeeByService(service.serviceId, applications);
      overallServiceAdditionalFeeAmount += serviceAdditionalFee;
      return [
        service.serviceTitle,
        "998521",
        service.count.toString(),
        service.price.toString(),
        serviceAdditionalFee,
        (serviceAdditionalFee + service.totalCost).toString()
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
    let newOverallServiceAmount = parseInt(overallServiceAmount) + parseInt(overallServiceAdditionalFeeAmount);
    const cgstTax = calculatePercentage(newOverallServiceAmount, parseInt(cgst.percentage));
    const sgstTax = calculatePercentage(newOverallServiceAmount, parseInt(sgst.percentage));
    const taxDetails = [
      { label: "Total Amount Before Tax", amount: String(newOverallServiceAmount) },
      { label: `Add: CGST - ${cgst.percentage}%`, amount: String(cgstTax) },
      { label: `Add: SGST - ${sgst.percentage}%`, amount: String(sgstTax) },
      { label: `Total Tax - ${parseInt(cgst.percentage) + parseInt(sgst.percentage)}%`, amount: String(cgstTax + sgstTax) },
      { label: "Total Tax Amount (Round off)", amount: String(newOverallServiceAmount + cgstTax + sgstTax) },
      { label: "GST On Reverse Charge", amount: "No" }
    ];

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
    const labelWidth = doc.getTextWidth("Invoice Amount in Words:");

    const pageWidthHere = doc.internal.pageSize.width;
    const contentWidth = pageWidthHere * 0.8; // 80% of the page width
    const leftX = (pageWidthHere - contentWidth) / 2; // Center the content

    // Draw a border around the area where the label and amount will appear
    doc.setDrawColor(0, 0, 0); // Set border color to black
    doc.setLineWidth(0.5); // Set border thickness
    doc.rect(leftX, invoiceYPosition - 3, contentWidth, 12); // Draw border (width: 80% of page, height: fixed)
    doc.setFont("helvetica", "normal");
    const words = wordify(parseInt(newOverallServiceAmount + cgstTax + sgstTax));
    // Add label with padding (4 units) to avoid overlap with the border
    doc.text("Invoice Amount in Words:" + words + ' Rupees Only', leftX + 2, invoiceYPosition + 5); // 4 units padding from the left



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


    const headers3 = [
      ["SL NO", "Application ID", "Employee ID", "Case Received", "Candidate Full Name", ...serviceCodes, "Add Fee", "CGST", "SGST", "Pricing", "Report Date"]
    ];
    const rows3 = (applications[0]?.applications?.length > 0)
      ? applications[0].applications.map((app, index) => {
        let totalCost = 0;
        const appAdditionalFee = getTotalAdditionalFee(app.id, applications);
        overAllAdditionalFee += appAdditionalFee;

        const applicationRow = [
          index + 1,
          app.application_id,
          app.employee_id,
          // Safely check if app.created_at is defined before calling .split()
          app.created_at ? app.created_at.split("T")[0] : "N/A",  // Use "N/A" or some default value
          app.name,
          ...serviceNames.map(service => {
            if (!service || !service.id) {
              return "NIL";
            }
            const serviceExists = app.statusDetails.some(
              detail => detail.serviceId === service.id.toString()
            );
            if (serviceExists) {
              const colPrice = parseInt(getServicePriceById(service.id, serviceInfo)) || 0;
              service.serviceIndexPrice = (service.serviceIndexPrice || 0) + colPrice;
              totalCost += colPrice;
              return colPrice;
            } else {
              return "NIL";
            }
          }),
          parseInt(appAdditionalFee) || 0,
        ];

        const appCGSTTax = calculatePercentage(parseInt(totalCost + appAdditionalFee), parseInt(cgst.percentage)) || 0;
        const appSGSTTax = calculatePercentage(parseInt(totalCost + appAdditionalFee), parseInt(sgst.percentage)) || 0;
        applicationRow.push(appCGSTTax, appSGSTTax, parseInt(totalCost + appCGSTTax + appSGSTTax + appAdditionalFee) || 0);

        // Safely check if app.report_date exists before calling .split()
        applicationRow.push(app.report_date ? app.report_date.split("T")[0] : "");  // Use empty string if report_date is not defined

        return applicationRow;
      })
      : [];


    const tableWidthNew = doc.internal.pageSize.width-20; // Set the width to 60% of page width
    const leftMarginNew = (doc.internal.pageSize.width - tableWidthNew) / 2; // Center the table horizontally

    doc.autoTable({
      startY: annexureYPosition + 10, // Adjust position to avoid overlapping with the Annexure text and border
      head: headers3,
      body: rows3,
      styles: { fontSize: 8, halign: 'center', cellWidth: 'auto' },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
      bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.5, textColor: [0, 0, 0] },
      theme: 'grid',
      margin: { top: 10, bottom: 10, left: leftMarginNew, right: leftMarginNew },
      x: 0, // Starting position at the left edge
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

    const signatureBase64 = "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";
    doc.addImage(signatureBase64, 'PNG', signatureXPosition, signatureYPosition - signatureImageHeight, signatureImageWidth, signatureImageHeight);
  }
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="p-2 md:p-12">
      <div className="bg-white p-3 md:p-12 rounded-md w-full mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Generate Invoice</h2>
        <form onSubmit={handleSubmit} className="">
          <div className='mb-3'>
            <label htmlFor="clrefin" className="block mb-2">Client Code:</label>
            <SelectSearch
              options={options}
              value={clientCode}
              name="language"
              placeholder="Choose client code"
              onChange={(value) => setClientCode(value,options)}
              search
            />
          </div>
          <div>
            <label htmlFor="invoice_number" className="block mb-2">Invoice Number:</label>
            <input
              type="text"
              name="invoice_number"
              id="invoice_number"
              required
              className="w-full p-3  mb-[20px] border border-gray-300 rounded-md"
              value={formData.invoice_number}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="invoice_date" className="block mb-2">Invoice Date:</label>
            <input
              type="date"
              name="invoice_date"
              id="invoice_date"
              required
              className="w-full p-3  mb-[20px] border border-gray-300 rounded-md"
              value={formData.invoice_date}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="moinv" className="block mb-2">Month & Year:</label>
            <select
              id="month"
              name="month"
              required
              className="w-full p-3  mb-[20px] border border-gray-300 rounded-md"
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
              className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
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
