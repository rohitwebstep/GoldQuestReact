import React, { useEffect, useState } from 'react';
import { useData } from './DataContext';
import SelectSearch from 'react-select-search';
import 'react-select-search/style.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';
import { useCustomFunction } from '../CustomFunctionsContext';
import { useApiCall } from '../ApiCallContext'; // Import the hook for ApiCallContext

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

        // Handle new token if it exists in the response
      

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
    const logoImg = "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";
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
    doc.text(`Location: ${customer.address}`, billToXPosition, billToYPosition + 18);


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


    const tableWidthNew = doc.internal.pageSize.width * 0.8; // Set the width to 60% of page width
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
    // Finalize and Save PDF
    doc.save('invoice.pdf');
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
              onChange={(value) => setClientCode(value)}
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
              className="p-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-blue-400 disabled:bg-gray-400"
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
