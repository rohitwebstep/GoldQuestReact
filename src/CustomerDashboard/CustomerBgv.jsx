import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';
import { MdOutlineArrowRightAlt } from "react-icons/md";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // Correct path for newer Swiper versions
import axios from 'axios';
import LogoBgv from '../Images/LogoBgv.jpg'
import { FaGraduationCap, FaBriefcase, FaIdCard } from 'react-icons/fa';
import { FaUser, FaCog, FaCheckCircle } from 'react-icons/fa'
import { jsPDF } from 'jspdf';
const CandidateBGV = () => {
    const { isBranchApiLoading, setIsBranchApiLoading,checkBranchAuthentication } = useApiCall();
    const contentRef = useRef();
    const [error, setError] = useState(null);
    const [customBgv, setCustomBgv] = useState('');
    const [nationality, setNationality] = useState([]);
    const [cefData, setCefData] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [purpose, setPurpose] = useState('');
    const [serviceData, setServiceData] = useState([]);
    const [customerInfo, setCustomerInfo] = useState([]);
    const [serviceValueData, setServiceValueData] = useState([]);

    const location = useLocation();
    const currentURL = location.pathname + location.search;

    const queryParams = new URLSearchParams(location.search);

    const branchId = queryParams.get('branch_id');
    const applicationId = queryParams.get('applicationId');

    const fetchImageToBase = async (imageUrls) => {
        setIsBranchApiLoading(true);
        // Set loading state to true before making the request
        try {
            // Define headers for the POST request
            const headers = {
                "Content-Type": "application/json",
            };

            // Prepare the body payload for the POST request
            const raw = {
                image_urls: imageUrls,
            };

            // Send the POST request to the API and wait for the response
            const response = await axios.post(
                "https://api.goldquestglobal.in/test/image-to-base",
                raw,
                { headers }
            );


            return response.data.images || [];  // Return images or an empty array if no images are found
        } catch (error) {
            console.error("Error fetching images:", error);

            // If the error contains a response, log the detailed response error
            if (error.response) {
                console.error("Response error:", error.response.data);
            } else {
                // If no response, it means the error occurred before the server could respond
                console.error("Request error:", error.message);
            }

            return null; // Return null if an error occurs
        } finally {
            // Reset the loading state after the API request finishes (success or failure)
            setIsBranchApiLoading(false);
        }
    };

    const generatePdf = async () => {
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
            // Create a new PDF document
            calculateGaps();
            const doc = new jsPDF();
            let yPosition = 10;  // Initial y position

            // Add the form title

            if (customBgv === 1) {
                doc.addImage(LogoBgv, 'PNG', 75, yPosition, 60, 10);
            }
            // Set font size for the title
            doc.setFontSize(20);  // Sets the font size to 20
            doc.setFont("helvetica", "bold");  // Sets the font to Helvetica and makes it bold
            // Calculate the width of the text
            const title = 'Background Verification Form';
            const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
            const xPosition = (doc.internal.pageSize.width - titleWidth) / 2;
            // Calculate the x-coordinate for centering


            // Add the text in the center of the page
            doc.text(title, xPosition, customBgv === 1 ? yPosition + 20 : yPosition + 10);

            // Move yPosition down for the next content
            yPosition += 20; // Adjust spacing as needed

            // Add Company Name
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            // Set the left position for "Company name"
            doc.text(`Company name: ${companyName}`, 10, yPosition + 10);

            // Set the right position for "Purpose of Application"
            const pageWidth = doc.internal.pageSize.width; // Get the page width
            const marginRight = 10; // Right margin
            const purposeXPosition = pageWidth - marginRight - doc.getTextWidth(`Purpose of Application: ${purpose || 'NIL'}`);

            doc.text(`Purpose of Application: ${purpose || 'NIL'}`, purposeXPosition, yPosition + 10);

            yPosition += 20; // Move yPosition down for the next section

            const imageWidth = doc.internal.pageSize.width - 10; // 20px padding for margins
            const imageHeight = 80; // Fixed height of 500px for the image
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            if (purpose === 'NORMAL BGV(EMPLOYMENT)') {
                // Add a form group with Applicant's CV label
                doc.setFontSize(12);
                doc.text("Applicant’s CV", doc.internal.pageSize.width / 2, yPosition, {
                    align: 'center'
                });

                if (cefData && cefData.resume_file) {
                    // Check if the file is an image (this can be enhanced with MIME type checks, e.g., 'image/png', 'image/jpeg')
                    const resumeFile = cefData.resume_file.trim();

                    if (isImage(resumeFile)) {
                        // If the resume file is an image, fetch and add it to the document
                        const imageBases = await fetchImageToBase([resumeFile]);

                        if (imageBases?.[0]?.base64) {
                            doc.addImage(imageBases?.[0]?.base64, 'PNG', 5, yPosition + 10, imageWidth, imageHeight);
                        } else {
                            doc.text("Unable to load image.", 10, 40);
                        }
                    } else {
                        const doctext = 'View Document';
                        const doctextWidth = doc.getTextWidth(doctext);
                        const noCVTextX = (doc.internal.pageSize.width - doctextWidth) / 2;
                        const resumeUrl = resumeFile;
                        doc.setTextColor(255, 0, 0); // Set the text color to blue (like a link)
                        doc.textWithLink(doctext, noCVTextX, 60, { url: resumeUrl });  // Opens the document in a new tab
                    }
                } else {
                    // If no resume file is available, center the text for "No CV uploaded."
                    const noCVText = "No CV uploaded.";
                    const noCVTextWidth = doc.getTextWidth(noCVText);
                    const noCVTextX = (doc.internal.pageSize.width - noCVTextWidth) / 2;

                    doc.text(noCVText, noCVTextX + 40, 40);
                }


                // Helper function to determine if the file is an image (you can improve this with more MIME type checks)
                function isImage(fileName) {
                    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
                    return imageExtensions.some(extension => fileName.toLowerCase().endsWith(extension));
                }

            }
            doc.setTextColor(0, 0, 0);
            if (purpose === 'NORMAL BGV(EMPLOYMENT)') {
                yPosition += imageHeight + 10;
            }
            yPosition += 5;
            if (cefData && cefData.govt_id) {
                // Split the comma-separated string into an array of image URLs
                const govtIdUrls = cefData.govt_id.split(',').map(url => url.trim());

                // Check if there are any URLs in the array
                if (govtIdUrls.length > 0) {
                    for (let i = 0; i < govtIdUrls.length; i++) {
                        const govtIdUrl = govtIdUrls[i];

                        // Fetch the image as base64
                        const imageBases = await fetchImageToBase([govtIdUrl]);

                        // Check if the image is valid
                        if (imageBases?.[0]?.base64) {
                            // Set font size and add the label for each image
                            doc.setFontSize(12);
                            const labelText = "Govt ID #" + (i + 1);
                            const labelTextWidth = doc.getTextWidth(labelText);
                            const labelCenterX = (doc.internal.pageSize.width - labelTextWidth) / 2;

                            // Add label at the center for each image
                            doc.text(labelText, labelCenterX, yPosition);

                            // Add image to the document (ensure image fits properly)
                            const imageWidth = doc.internal.pageSize.width - 10; // 20px padding for margins
                            let imageHeight = 100; // Adjust according to your requirements
                            if (yPosition > doc.internal.pageSize.height - 40) {
                                doc.addPage(); // Add a new page
                                imageHeight = 150;
                                yPosition = 20; // Reset yPosition for new page
                            }
                            doc.addImage(imageBases[0].base64, 'PNG', 5, yPosition + 5, imageWidth, imageHeight);

                            // Update yPosition after adding the image
                            yPosition += imageHeight + 10; // Adjust for image height + some margin

                            // Check if the yPosition exceeds the page height, and if so, add a new page

                        } else {
                            // If no image is found for this govt_id, center the message
                            const messageText = "Image #" + (i + 1) + " not found.";
                            const messageTextWidth = doc.getTextWidth(messageText);
                            const messageCenterX = (doc.internal.pageSize.width - messageTextWidth) / 2;

                            doc.text(messageText, messageCenterX, yPosition);

                            // Update yPosition after showing the message
                            yPosition += 20 + 30; // Adjust for message height + margin

                            // Check if the yPosition exceeds the page height, and if so, add a new page
                            if (yPosition > doc.internal.pageSize.height - 40) {
                                doc.addPage();
                                imageHeight = 150;// Add a new page
                                yPosition = 20; // Reset yPosition for new page
                            }
                        }
                    }
                } else {
                    // If no government ID images are available in the string, center the message
                    const noImagesText = "No Government ID images uploaded.";
                    const noImagesTextWidth = doc.getTextWidth(noImagesText);
                    const noImagesCenterX = (doc.internal.pageSize.width - noImagesTextWidth) / 2;

                    doc.text(noImagesText, noImagesCenterX, 40);
                }
            } else {
                // If govt_id is not present in cefData, center the message
                const noGovtIdText = "No Government ID uploaded.";
                const noGovtIdTextWidth = doc.getTextWidth(noGovtIdText);
                const noGovtIdCenterX = (doc.internal.pageSize.width - noGovtIdTextWidth) / 2;

                doc.text(noGovtIdText, noGovtIdCenterX, 40);
            }





            if (customBgv === 1) {
                doc.addPage();
            }
            const passport_photoHeight = 62;
            yPosition = 10;

            if (customBgv === 1) {
                // Center the "Passport Photo" header
                const headerText = "Passport Photo.";
                doc.text(headerText, doc.internal.pageSize.width / 2, yPosition, { align: 'center' });

                if (cefData && cefData.passport_photo) {
                    // Split the comma-separated image URLs into an array
                    const imageUrls = cefData.passport_photo.trim().split(',').map(url => url.trim());

                    // Filter valid image URLs based on file extensions
                    const validImageUrls = imageUrls.filter(url => {
                        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
                        return validImageExtensions.some(ext => url.toLowerCase().endsWith(ext));
                    });

                    if (validImageUrls.length > 0) {
                        // Constants for grid layout
                        const cols = validImageUrls.length > 3 ? 3 : validImageUrls.length;  // Limit to 3 columns at most
                        const margin = 5;  // Space between images
                        const xStart = 5;  // Starting x position
                        const yStart = yPosition + 10;  // Starting y position (below the header)
                        const pageWidth = doc.internal.pageSize.width; // Get the page width

                        let xPos = xStart;
                        yPosition = yStart;

                        // Dynamically calculate the image width based on the number of images
                        const imageWidth = validImageUrls.length === 1 ? pageWidth - 2 * margin :
                            validImageUrls.length === 2 ? (pageWidth / 2) - margin :
                                validImageUrls.length === 3 ? (pageWidth / 3) - margin :
                                    (pageWidth / 3) - margin; // Use 3 columns for more than 3 images

                        // Loop through each valid image URL and process it
                        for (let i = 0; i < validImageUrls.length; i++) {
                            const imageUrl = validImageUrls[i];
                            try {
                                // Fetch the base64 image for each URL
                                const imageBases = await fetchImageToBase([imageUrl]);

                                if (imageBases && imageBases[0]?.base64) {
                                    // Add image to the PDF at the correct xPos and yPosition (grid layout)
                                    doc.addImage(imageBases[0].base64, imageBases[0].type, xPos, yPosition, imageWidth, passport_photoHeight);

                                    // Update xPos for the next image (move horizontally)
                                    xPos += imageWidth + margin;

                                    // If we have reached the end of the row (3 columns), reset xPos and move to the next row
                                    if ((i + 1) % cols === 0) {
                                        xPos = xStart;
                                        yPosition += passport_photoHeight + margin;  // Move to the next row
                                    }
                                } else {
                                    console.error(`Image at index ${i} could not be loaded.`);
                                    const imageNotFoundText = `Image #${i + 1} not found.`;
                                    const imageNotFoundTextWidth = doc.getTextWidth(imageNotFoundText);
                                    const imageNotFoundCenterX = (doc.internal.pageSize.width - imageNotFoundTextWidth) / 2;
                                    doc.text(imageNotFoundText, imageNotFoundCenterX, yPosition + 10);
                                    yPosition += 10;  // Update yPos for the error message
                                }
                            } catch (error) {
                                console.error(`Error loading image at index ${i}:`, error);
                                const errorMessage = `Error loading image #${i + 1}.`;
                                const errorTextWidth = doc.getTextWidth(errorMessage);
                                const errorTextCenterX = (doc.internal.pageSize.width - errorTextWidth) / 2;
                                doc.text(errorMessage, errorTextCenterX, yPosition + 10);
                                yPosition += 20;  // Update yPos for the error message
                            }
                        }
                    } else {
                        // If no valid image URLs are found, display a message
                        const noImagesText = "No valid Passport Photo images found.";
                        const noImagesTextWidth = doc.getTextWidth(noImagesText);
                        const noImagesCenterX = (doc.internal.pageSize.width - noImagesTextWidth) / 2;
                        doc.text(noImagesText, noImagesCenterX, yPosition + 10);
                        yPosition += 20; // Adjust for the message
                    }

                } else {
                    // If no passport photo is available, display a message
                    const noPhotoText = "No Passport Photo uploaded.";
                    const noPhotoTextWidth = doc.getTextWidth(noPhotoText);
                    const noPhotoCenterX = (doc.internal.pageSize.width - noPhotoTextWidth) / 2;
                    doc.text(noPhotoText, noPhotoCenterX, yPosition + 10);
                    yPosition += 20; // Adjust position for the message
                }
            }






            const tableData = [
                { title: "Full Name", value: cefData.full_name || "N/A" },
                { title: "Former Name / Maiden Name", value: cefData.former_name || "N/A" },
                { title: "Mobile Number", value: cefData.mb_no || "N/A" },
                { title: "Father's Name", value: cefData.father_name || "N/A" },
                { title: "Spouse's Name", value: cefData.husband_name || "N/A" },
                { title: "Date of Birth", value: cefData.dob || "N/A" },
                { title: "Gender", value: cefData.gender || "N/A" },
                // Add conditional fields based on customBgv and nationality
            ];

            // Conditionally add fields
            if (customBgv === 1 && nationality === "Indian") {
                tableData.push(
                    { title: "Name as per Aadhar", value: cefData.aadhar_card_name || "N/A" },
                    { title: "Name as per Pan Card", value: cefData.pan_card_name || "N/A" }
                );
            }

            if (nationality === "Other") {
                tableData.push(
                    { title: "Passport No", value: cefData.passport_no || "N/A" },
                    { title: "Driving License / Resident Card / ID No", value: cefData.dme_no || "N/A" },
                    { title: "Tax No", value: cefData.tax_no || "N/A" }
                );
            }
            if (customBgv == 0 && nationality === "Other") {
                tableData.push(
                    { title: "Social Security Number", value: cefData.ssn_number || "N/A" },
                );
            }

            tableData.push(
                { title: "Aadhar Card Number", value: cefData.aadhar_card_number || "N/A" },
                { title: "Pan Card Number", value: cefData.pan_card_number || "N/A" },
                { title: "Nationality", value: cefData.nationality || "N/A" },
                { title: "Marital Status", value: cefData.marital_status || "N/A" }
            );



            doc.addPage();
            yPosition = 20;


            doc.autoTable({
                startY: yPosition + 5, // Start the table just below the last added entry
                head: [[{ content: 'Personal Information', colSpan: 2, styles: { halign: 'center', fontSize: 16, bold: true } }],
                ],
                body: tableData.map(row => {
                    return [row.title, row.value];
                }),
                theme: 'grid',
                margin: { top: 10 },
                styles: {
                    cellPadding: 3,        // Padding around text for a cleaner look
                    fontSize: 10,          // Font size for better readability
                    halign: 'left',        // Align text to the left for better structure
                    valign: 'middle',      // Align vertically to the middle of the cells
                    lineWidth: 0.2,        // Increase line width for better visibility
                    font: 'helvetica'      // Use Helvetica for better font rendering
                },
                headStyles: {
                    textColor: 255,        // White text for header for contrast
                    fontStyle: 'bold',     // Make header text bold
                },
                columnStyles: {
                    0: { cellWidth: 'auto' },  // Auto width for the first column (Field)
                    1: { cellWidth: 'auto' }   // The second column (Value) should adjust width automatically
                }
            });




            const aadharcardimageHeight = 100;
            yPosition = doc.autoTable.previous.finalY + 10;

            if (customBgv === 1 && nationality === "Indian") {
                // Add Aadhaar card image if available
                if (cefData.aadhar_card_image) {
                    doc.addPage();
                    let yPosition = 10; // Reset yPosition for a new page
                    doc.setTextColor(0, 0, 0);
                    // Center the "Aadhar Card Image" header
                    doc.text('Aadhar Card Image', doc.internal.pageSize.width / 2, yPosition + 10, {
                        align: 'center'
                    });

                    // Process Aadhaar card image
                    const imageUrls = [cefData.aadhar_card_image.trim()];
                    const imageUrlsToProcess = imageUrls.filter(url => {
                        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
                        return validImageExtensions.some(ext => url.toLowerCase().endsWith(ext));
                    });

                    // If it's an image, add to PDF
                    if (imageUrlsToProcess.length > 0) {
                        const imageBases = await fetchImageToBase(imageUrlsToProcess);
                        doc.addImage(imageBases[0]?.base64, imageBases[0]?.type, 5, yPosition + 20, imageWidth, aadharcardimageHeight);
                        yPosition += aadharcardimageHeight;
                    } else {
                        // If not an image (e.g., PDF or XLS), show a clickable link centered
                        const fileUrl = cefData.aadhar_card_image.trim();
                        const buttonText = `Click to open Aadhar Card File`;
                        const textWidth = doc.getTextWidth(buttonText);
                        const centerX = (doc.internal.pageSize.width - textWidth) / 2;

                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        doc.setTextColor(255, 0, 0);
                        doc.text(buttonText, centerX, yPosition + 20);

                        // Create clickable link to open the file
                        doc.link(centerX, yPosition + 10, textWidth, 10, { url: fileUrl });

                        yPosition += 20;
                    }
                }

                yPosition = aadharcardimageHeight + 40;
                if (cefData.pan_card_image) {
                    // Center the "Pan Card Image" header
                    doc.setTextColor(0, 0, 0);
                    doc.text('Pan Card Image', doc.internal.pageSize.width / 2, yPosition + 10, {
                        align: 'center'
                    });

                    const imageUrls = [cefData.pan_card_image.trim()];
                    const imageUrlsToProcess = imageUrls.filter(url => {
                        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
                        return validImageExtensions.some(ext => url.toLowerCase().endsWith(ext));
                    });

                    // If it's an image, add to PDF
                    if (imageUrlsToProcess.length > 0) {
                        const imageBases = await fetchImageToBase(imageUrlsToProcess);
                        doc.addImage(imageBases[0]?.base64, imageBases[0]?.type, 5, yPosition + 20, imageWidth, aadharcardimageHeight);
                        yPosition += aadharcardimageHeight + 20;
                    } else {
                        // If not an image (e.g., PDF or XLS), show a clickable link centered
                        const fileUrl = cefData.pan_card_image.trim();
                        const buttonText = `Click to open Pan Card File`;
                        const textWidth = doc.getTextWidth(buttonText);
                        const centerX = (doc.internal.pageSize.width - textWidth) / 2;

                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        doc.setTextColor(255, 0, 0);
                        doc.text(buttonText, centerX, yPosition + 20);

                        // Create clickable link to open the file
                        doc.link(centerX, yPosition + 10, textWidth, 10, { url: fileUrl });

                        yPosition += 20;
                    }
                }
            }


            else {
                yPosition = doc.autoTable.previous.finalY + 10;
            }

            if (customBgv === 1 && nationality === "Indian") {
                doc.addPage();
                yPosition = 10;
            }

            doc.setFontSize(14);
            yPosition += 10; // Move yPosition down for the next section

            // Table for Permanent Address
            doc.autoTable({
                startY: yPosition,
                head: [[{ content: 'Permanent Address', colSpan: 2, styles: { halign: 'center', fontSize: 16, bold: true } }],
                ],
                body: [
                    ['Permanent Address', cefData.permanent_address || 'N/A'],
                    ['Pin Code', cefData.permanent_pin_code || 'N/A'],
                    ['Mobile Number', cefData.permanent_address_landline_number || 'N/A'],
                    ['Current State', cefData.permanent_address_state || 'N/A'],
                    ['Current Landmark', cefData.permanent_prominent_landmark || 'N/A'],
                    ['Current Address Stay No.', cefData.permanent_address_stay_to || 'N/A'],
                    ['Nearest Police Station', cefData.permanent_address_nearest_police_station || 'N/A']
                ],
                theme: 'grid',
                margin: { top: 10 },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            // Update yPosition after the permanent address table
            yPosition = doc.autoTable.previous.finalY + 20; // Add a small margin after the table

            // Check if current address is different from permanent address
            if (!isSameAsPermanent) {
                // Table for Current Address if not same as Permanent Address
                doc.autoTable({
                    startY: yPosition,
                    head: [[{ content: 'Current Address', colSpan: 2, styles: { halign: 'center', fontSize: 16, bold: true } }],
                    ],
                    body: [
                        ['Current Address', cefData.current_address || 'N/A'],
                        ['Pin Code', cefData.current_address_pin_code || 'N/A'],
                        ['Mobile Number', cefData.current_address_landline_number || 'N/A'],
                        ['Current State', cefData.current_address_state || 'N/A'],
                        ['Current Landmark', cefData.current_prominent_landmark || 'N/A'],
                        ['Current Address Stay No.', cefData.current_address_stay_to || 'N/A'],
                        ['Nearest Police Station', cefData.current_address_nearest_police_station || 'N/A']
                    ],
                    theme: 'grid',
                    margin: { top: 10 },
                    styles: { fontSize: 10, cellPadding: 3 }
                });

                // Update yPosition after the current address table
                yPosition = doc.autoTable.previous.finalY + 10; // Add a small margin after the table
            }


            yPosition = doc.autoTable.previous.finalY + 10;


           


            (async () => {
                if (!serviceDataMain.length) return; // If no services, return early

                // const selectedServices = serviceDataMain.slice(0, 2); // Get only the first 2 services

                for (let i = 0; i < serviceDataMain.length; i++) {
                    const service = serviceDataMain[i];
                    const tableData = [];

                    if (serviceDataMain.length > 1) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    // Reset yPosition before each service

                    function renderGapMessageNew(gap) {
                        if (!gap) {
                            return 'No Gap'; // Return 'N/A' if gap is undefined or null
                        }
                        const { years, months } = gap; // Safely destructure if gap is valid
                        return `${years} years and ${months} months`;
                    }

                    if (service.db_table === "gap_validation") {


                        doc.setFontSize(12);
                        doc.setTextColor(0, 0, 0);
                        if (annexureData?.gap_validation?.highest_education_gap === 'phd') {


                            // Table for PhD information
                            yPosition += 10;
                            doc.autoTable({
                                startY: yPosition,
                                head: [[{ content: 'PHD', colSpan: 2, styles: { halign: 'center', fontSize: 12, bold: true } }],
                                ],
                                body: [
                                    ['Institute Name', annexureData?.gap_validation?.education_fields?.phd_1?.phd_institute_name_gap || 'N/A'],
                                    ['School Name', annexureData?.gap_validation?.education_fields?.phd_1?.phd_school_name_gap || 'N/A'],
                                    ['Start Date', annexureData?.gap_validation?.education_fields?.phd_1?.phd_start_date_gap || 'N/A'],
                                    ['End Date', annexureData?.gap_validation?.education_fields?.phd_1?.phd_end_date_gap || 'N/A'],
                                    ['Specialization', annexureData?.gap_validation?.education_fields?.phd_1?.phd_specialization_gap || 'N/A'],
                                    ["Gap Status", renderGapMessageNew(gaps?.gapPostGradToPhd) || 'N/A']
                                ],
                                theme: 'grid',
                                margin: { top: 10 },
                                styles: { fontSize: 10, cellPadding: 3 }
                            });

                            let index = 1;
                            let phdSections = [];

                            while (true) {
                                const key = `phd_corespondence_${index}`;

                                // Check if the key exists in annexureData
                                if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                    break; // Exit loop if the key is missing
                                }

                                const phdSection = annexureData.gap_validation.education_fields[key];

                                // Log the current phdSection to ensure data is being read correctly

                                phdSections.push([
                                    `Correspondence Phd ${index}`,
                                    phdSection?.phd_institute_name_gap || 'N/A',
                                    phdSection?.phd_school_name_gap || 'N/A',
                                    phdSection?.phd_start_date_gap || 'N/A',
                                    phdSection?.phd_end_date_gap || 'N/A',
                                    phdSection?.phd_specialization_gap || 'N/A'
                                ]);

                                index++; // Move to the next phd_corespondence_*
                            }

                            // Check if phdSections is populated before attempting to render

                            if (phdSections.length > 0) {
                                doc.setFontSize(16);
                                const textWidth = doc.internal.pageSize.width;
                                doc.text("Correspondence Phd Details", doc.internal.pageSize.width / 2, doc.autoTable.previous.finalY + 10, {
                                    align: 'center'
                                });
                                // Add the table data
                                doc.autoTable({
                                    head: [['Correspondence', 'Institute Name', 'School Name', 'Start Date', 'End Date', 'Specialization']],
                                    body: phdSections,
                                    startY: doc.autoTable.previous.finalY + 20, // Start below the title
                                    theme: 'grid',
                                    styles: {
                                        cellPadding: 4,
                                        fontSize: 10
                                    }
                                });
                            } else {
                            }

                        }
                        yPosition = doc.autoTable.previous.finalY + 10;
                        // Post Graduation
                        if (annexureData?.gap_validation?.highest_education_gap === 'post_graduation' || annexureData?.gap_validation?.highest_education_gap === 'phd') {
                            doc.addPage();
                            yPosition = 20;

                            const postGradData = [
                                ["University / Institute Name", annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_university_institute_name_gap || 'N/A'],
                                ["Course", annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_course_gap || 'N/A'],
                                ["Specialization Major", annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_specialization_major_gap || 'N/A'],
                                ["Start Date", annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_start_date_gap || 'N/A'],
                                ["End Date", annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_end_date_gap || 'N/A'],
                                ["Gap Status", renderGapMessageNew(gaps?.gapGradToPostGrad) || 'N/A']
                            ];


                            doc.autoTable({
                                head: [[{ content: 'POST GRADUATION', colSpan: 2, styles: { halign: 'center', fontSize: 12, bold: true } }],
                                ],
                                body: postGradData,
                                startY: yPosition + 5,
                                theme: 'grid',
                                styles: {
                                    cellPadding: 4,
                                    fontSize: 10
                                }
                            });

                            let index = 1;
                            let postGradSections = [];
                            while (true) {
                                const key = `post_graduation_corespondence_${index}`;

                                // Check if the key exists in the annexureData
                                if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                    break; // Exit loop if the key is missing
                                }

                                const postGradSection = annexureData.gap_validation.education_fields[key];

                                // Push the section data into postGradSections array
                                postGradSections.push([
                                    `Correspondence Post Graduation ${index}`,
                                    postGradSection?.post_graduation_university_institute_name_gap || 'N/A',
                                    postGradSection?.post_graduation_course_gap || 'N/A',
                                    postGradSection?.post_graduation_specialization_major_gap || 'N/A',
                                    postGradSection?.post_graduation_start_date_gap || 'N/A',
                                    postGradSection?.post_graduation_end_date_gap || 'N/A'
                                ]);

                                index++; // Move to the next post_graduation_corespondence_*
                            }

                            // Add a title for the table
                            yPosition += 20;

                            if (postGradSections.length > 0) {
                                doc.setFontSize(16);
                                doc.text("Correspondence Post Graduation Details", doc.internal.pageSize.width / 2, doc.autoTable.previous.finalY + 10, {
                                    align: 'center'
                                });

                                doc.autoTable({
                                    head: [['Correspondence', 'University/Institute Name', 'Course', 'Specialization Major', 'Start Date', 'End Date']],
                                    body: postGradSections,
                                    startY: doc.autoTable.previous.finalY + 20, // Start below the title
                                    theme: 'grid',
                                    styles: {
                                        cellPadding: 4,
                                        fontSize: 10
                                    }
                                });
                            }

                        }

                        // Graduation
                        yPosition = yPosition += 30;
                        if (annexureData?.gap_validation?.highest_education_gap === 'graduation' || annexureData?.gap_validation?.highest_education_gap === 'post_graduation' || annexureData?.gap_validation?.highest_education_gap === 'phd') {


                            const gradData = [
                                ["University / Institute Name", annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_university_institute_name_gap || 'N/A'],
                                ["Course", annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_course_gap || 'N/A'],
                                ["Specialization Major", annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_specialization_major_gap || 'N/A'],
                                ["Start Date", annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_start_date_gap || 'N/A'],
                                ["End Date", annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_end_date_gap || 'N/A'],
                                ["Gap Status", renderGapMessageNew(gaps?.gapSrSecToGrad) || 'N/A']

                            ];

                            doc.autoTable({
                                head: [[{ content: 'GRADUATION', colSpan: 2, styles: { halign: 'center', fontSize: 12, bold: true } }],
                                ],
                                body: gradData,
                                startY: doc.autoTable.previous.finalY + 10,
                                theme: 'grid',
                                styles: {
                                    cellPadding: 4,
                                    fontSize: 10
                                }
                            });

                            let index = 1;
                            let Graduation = [];
                            while (true) {
                                const key = `graduation_corespondence_${index}`;

                                // Check if the key exists in the annexureData
                                if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                    break; // Exit loop if the key is missing
                                }

                                const GradSec = annexureData.gap_validation.education_fields[key];

                                // Push the section data into Graduation array
                                Graduation.push([
                                    `Correspondence Graduation ${index}`,
                                    GradSec?.graduation_university_institute_name_gap || 'N/A',
                                    GradSec?.graduation_course_gap || 'N/A',
                                    GradSec?.graduation_specialization_major_gap || 'N/A',
                                    GradSec?.graduation_start_date_gap || 'N/A',
                                    GradSec?.graduation_end_date_gap || 'N/A'
                                ]);

                                index++; // Move to the next post_graduation_corespondence_*
                            }

                            if (Graduation.length > 0) {
                                // Add a title for the table
                                doc.setFontSize(16);
                                doc.text("Correspondence Graduation Details", doc.internal.pageSize.width / 2, doc.autoTable.previous.finalY + 10, {
                                    align: 'center'
                                });
                                // Add the table data
                                doc.autoTable({
                                    head: [['Correspondence', 'University/Institute Name', 'Course', 'Specialization Major', 'Start Date', 'End Date']],
                                    body: Graduation,
                                    startY: doc.autoTable.previous.finalY + 30, // Start below the title
                                    theme: 'grid',
                                    styles: {
                                        cellPadding: 4,
                                        fontSize: 10
                                    }
                                });

                            }

                            // Call this function separately if required for gap message
                        }

                        if (annexureData?.gap_validation?.highest_education_gap === 'senior_secondary' || annexureData?.gap_validation?.highest_education_gap === 'graduation' || annexureData?.gap_validation?.highest_education_gap === 'phd' || annexureData?.gap_validation?.highest_education_gap === 'post_graduation') {

                            const seniorSecondaryData = [
                                ["School Name", annexureData?.gap_validation?.education_fields?.senior_secondary?.senior_secondary_school_name_gap || 'N/A'],
                                ["Start Date", annexureData?.gap_validation?.education_fields?.senior_secondary?.senior_secondary_start_date_gap || 'N/A'],
                                ["End Date", annexureData?.gap_validation?.education_fields?.senior_secondary?.senior_secondary_end_date_gap || 'N/A'],
                                ["Gap Status", renderGapMessageNew(gaps?.gapSecToSrSec) || 'N/A']
                            ];

                            doc.autoTable({
                                head: [[{ content: 'SENIOR SECONDARY', colSpan: 2, styles: { halign: 'center', fontSize: 12, bold: true } }],
                                ],
                                body: seniorSecondaryData,
                                startY: doc.autoTable.previous.finalY + 30,
                                theme: 'grid',
                                styles: {
                                    cellPadding: 4,
                                    fontSize: 10
                                }
                            });

                            let index = 1;
                            let seniorSecondarySections = [];

                            while (true) {
                                const key = `senior_secondary_corespondence_${index}`;

                                // Check if the key exists in annexureData
                                if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                    break; // Exit loop if the key is missing
                                }

                                const seniorSecondarySection = annexureData.gap_validation.education_fields[key];

                                // Push the section data into seniorSecondarySections array
                                seniorSecondarySections.push([
                                    `Correspondence SENIOR SECONDARY ${index}`,
                                    seniorSecondarySection?.senior_secondary_school_name_gap || 'N/A',
                                    seniorSecondarySection?.senior_secondary_start_date_gap || 'N/A',
                                    seniorSecondarySection?.senior_secondary_end_date_gap || 'N/A'
                                ]);

                                index++; // Move to the next senior_secondary_corespondence_*
                            }

                            // Add a title for the table
                            if (seniorSecondarySections.length > 0) {
                                doc.setFontSize(16);
                                doc.text("Correspondence Senior Secondary Details", doc.internal.pageSize.width / 2, doc.autoTable.previous.finalY + 10, {
                                    align: 'center'
                                });
                                // Add the table data
                                doc.autoTable({
                                    head: [['Correspondence', 'School Name', 'Start Date', 'End Date']],
                                    body: seniorSecondarySections,
                                    startY: doc.autoTable.previous.finalY + 20, // Start below the title
                                    theme: 'grid',
                                    styles: {
                                        cellPadding: 4,
                                        fontSize: 10
                                    }
                                });

                            }

                            ;  // Call this function separately if required for gap message
                        }

                        doc.addPage();
                        yPosition = 10;
                        // Secondary Education Section
                        if (
                            annexureData["gap_validation"].highest_education_gap === 'secondary' ||
                            annexureData["gap_validation"].highest_education_gap === 'senior_secondary' ||
                            annexureData["gap_validation"].highest_education_gap === 'graduation' ||
                            annexureData["gap_validation"].highest_education_gap === 'phd' ||
                            annexureData["gap_validation"].highest_education_gap === 'post_graduation'
                        ) {

                            const secondaryData = [
                                ["School Name", annexureData?.gap_validation?.education_fields?.secondary?.secondary_school_name_gap || 'N/A'],
                                ["Start Date", annexureData?.gap_validation?.education_fields?.secondary?.secondary_start_date_gap || 'N/A'],
                                ["End Date", annexureData?.gap_validation?.education_fields?.secondary?.secondary_end_date_gap || 'N/A']
                            ];

                            // Generate the table for secondary education
                            doc.autoTable({
                                head: [[{ content: 'SECONDARY', colSpan: 2, styles: { halign: 'center', fontSize: 12, bold: true } }],
                                ],
                                body: secondaryData,
                                startY: yPosition,
                                theme: 'grid',
                                styles: {
                                    cellPadding: 4,
                                    fontSize: 10
                                }
                            });

                            let index = 1;
                            let SecondarySections = [];

                            // Loop through to find any "secondary_corespondence_*" sections and add them
                            while (true) {
                                const key = `secondary_corespondence_${index}`;

                                // Check if the key exists in annexureData
                                if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                    break; // Exit loop if the key is missing
                                }

                                const secondarySection = annexureData.gap_validation.education_fields[key];

                                // Push the section data into SecondarySections array
                                SecondarySections.push([
                                    `Correspondence SECONDARY ${index}`,
                                    secondarySection?.secondary_school_name_gap || 'N/A',
                                    secondarySection?.secondary_start_date_gap || 'N/A',
                                    secondarySection?.secondary_end_date_gap || 'N/A'
                                ]);

                                index++; // Move to the next secondary_corespondence_*
                            }

                            // Add a title for the table if there are any secondary sections
                            if (SecondarySections.length > 0) {
                                doc.setFontSize(16);
                                doc.text("Correspondence Secondary Education Details", doc.internal.pageSize.width / 2, doc.autoTable.previous.finalY + 10, {
                                    align: 'center'
                                });
                                // Add the table data
                                doc.autoTable({
                                    head: [['Secondary No.', 'School Name', 'Start Date', 'End Date']],
                                    body: SecondarySections,
                                    startY: doc.autoTable.previous.finalY + 20, // Start below the title
                                    theme: 'grid',
                                    styles: {
                                        cellPadding: 4,
                                        fontSize: 10
                                    }
                                });


                            }
                        }


                        yPosition = doc.autoTable.previous.finalY + 10;

                        // Employment Section
                        doc.setFontSize(18);
                        const employmentData = [
                            ["Years of Experience", annexureData["gap_validation"].years_of_experience_gap || ''],
                            ["No of Employment", annexureData["gap_validation"].no_of_employment || '']
                        ];

                        doc.autoTable({
                            head: [[{ content: `Employment Deails`, colSpan: 2, styles: { halign: 'center', fontSize: 12, bold: true } }],
                            ],
                            body: employmentData,
                            startY: doc.autoTable.previous.finalY + 10,
                            theme: 'grid',
                            styles: {
                                cellPadding: 4,
                                fontSize: 10
                            }
                        });

                        doc.setFontSize(12);
                        // Dynamically render Employment Forms
                        if (annexureData["gap_validation"].no_of_employment > 0) {
                            let yPosition = doc.autoTable.previous.finalY + 10;

                            Array.from({ length: annexureData["gap_validation"].no_of_employment || 0 }, (_, index) => {
                                const employmentFormData = [
                                    ["Employment Type", annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_type_gap`] || ''],
                                    ["Start Date", annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_start_date_gap`] || ''],
                                    ["End Date", annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_end_date_gap`] || '']
                                ];

                                doc.autoTable({
                                    head: [[{ content: `Employment (${index + 1})`, colSpan: 2, styles: { halign: 'center', fontSize: 12, bold: true } }],
                                    ],
                                    body: employmentFormData,
                                    startY: yPosition,
                                    theme: 'grid',
                                    styles: {
                                        cellPadding: 4,
                                        fontSize: 10
                                    }
                                });

                                yPosition = doc.autoTable.previous.finalY + 10;
                                for (let idx = 0; idx < employGaps.length; idx++) {
                                    const item = employGaps[idx];  // Fix: Use idx directly, not idx - 1


                                    if (item) {
                                        const isNoGap = item.difference.toLowerCase().includes("no") && item.difference.toLowerCase().includes("gap");

                                        const isMatchingEndDate = item.endValue === annexureData["gap_validation"]?.employment_fields?.[`employment_${index}`]?.[`employment_end_date_gap`];

                                        if (isMatchingEndDate) {
                                            // Prepare the text to be shown in the document
                                            const textToDisplay = `${isNoGap ? item.difference : `GAP:${item.difference || 'No gap Found'}`}`;

                                            // Log the text that will be displayed

                                            // Display the text in the document
                                            doc.text(
                                                textToDisplay,
                                                14,
                                                doc.autoTable.previous.finalY + 7
                                            );

                                            // Update yPosition for next table or text
                                            yPosition = doc.autoTable.previous.finalY + 10;

                                        }
                                    }
                                }


                            });
                        }



                    }
                    else {
                        service.rows.forEach((row, rowIndex) => {

                            if (hiddenRows[`${i}-${rowIndex}`]) {
                                return null;
                            }
                            row.inputs.forEach((input) => {
                                const isCheckbox = input.type === 'checkbox';
                                const isDoneCheckbox = isCheckbox && (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'));
                                const isChecked = ["1", 1, true, "true"].includes(annexureData[service.db_table]?.[input.name] ?? false);

                                // Handle logic for checkbox checked state
                                if (isDoneCheckbox && isChecked) {
                                    // Hide all rows except the one with the checked checkbox
                                    service.rows.forEach((otherRow, otherRowIndex) => {
                                        if (otherRowIndex !== rowIndex) {
                                            hiddenRows[`${i}-${otherRowIndex}`] = true; // Hide other rows
                                        }
                                    });
                                    hiddenRows[`${i}-${rowIndex}`] = false; // Ensure current row stays visible
                                }
                                if (input.type === 'file') return; // Skip file inputs

                                const inputValue = annexureData[service.db_table]?.[input.name] || "NIL";
                                tableData.push([input.label, inputValue]);
                            });
                        });

                        // Add service heading
                        doc.setFontSize(16);
                        yPosition += 10;
                        doc.autoTable({
                            startY: yPosition,
                            head: [[{ content: service.heading, colSpan: 2, styles: { halign: 'center', fontSize: 16, bold: true } }],
                            ],
                            body: tableData,
                            theme: 'grid',
                            margin: { horizontal: 10 },
                            styles: { fontSize: 10 },
                        });

                        yPosition = doc.lastAutoTable.finalY + 10; // Update yPosition after table


                        // Process and add images for this service
                        const fileInputs = service.rows.flatMap(row =>
                            row.inputs.filter(({ type }) => type === "file").map(input => input.name)
                        );

                        if (fileInputs.length > 0) {
                            const filePromises = fileInputs.map(async (inputName) => {
                                const annexureFilesStr = annexureData[service.db_table]?.[inputName];
                                let annexureDataImageHeight = 220;

                                if (annexureFilesStr) {
                                    const fileUrls = annexureFilesStr.split(",").map(url => url.trim());
                                    if (fileUrls.length === 0) {
                                        doc.setFont("helvetica", "italic");
                                        doc.setFontSize(10);
                                        doc.setTextColor(150, 150, 150);
                                        doc.text("No annexure files available.", 10, yPosition + 10);
                                        yPosition += 10;
                                        return;
                                    }

                                    // Filter out non-image URLs (pdf, xls, etc.)
                                    const imageUrlsToProcess = fileUrls.filter(url => {
                                        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
                                        return validImageExtensions.some(ext => url.toLowerCase().endsWith(ext));
                                    });

                                    // Filter out URLs that are not images
                                    const nonImageUrlsToProcess = fileUrls.filter(url => {
                                        const validNonImageExtensions = ['pdf', 'xls', 'xlsx'];
                                        return validNonImageExtensions.some(ext => url.toLowerCase().endsWith(ext));
                                    });

                                    // Handle image files
                                    if (imageUrlsToProcess.length > 0) {
                                        const imageBases = await fetchImageToBase(imageUrlsToProcess);
                                        for (const image of imageBases) {
                                            if (!image.base64.startsWith('data:image/')) continue;

                                            doc.addPage();
                                            yPosition = 20;

                                            try {
                                                const imageWidth = doc.internal.pageSize.width - 10;
                                                // Adjust height if needed based on image dimensions or conditions
                                                doc.addImage(image.base64, image.type, 5, yPosition + 20, imageWidth, annexureDataImageHeight);
                                                yPosition += (annexureDataImageHeight + 30);
                                            } catch (error) {
                                                console.error(`Error adding image:`, error);
                                            }
                                        }
                                    }

                                    // Handle non-image files (PDF, XLS, etc.)
                                    const pageHeight = doc.internal.pageSize.height;
                                    const margin = 10; // margin from top and bottom
                                    let lineHeight = 10; // space between lines

                                    if (nonImageUrlsToProcess.length > 0) {
                                        nonImageUrlsToProcess.forEach(url => {
                                            // Calculate available space on the current page
                                            if (yPosition + lineHeight > pageHeight - margin) {
                                                doc.addPage(); // Add a new page if there's not enough space
                                                yPosition = margin; // Reset yPosition after adding a new page
                                            }

                                            // Add a button to open the file in a new tab
                                            doc.setFont("helvetica", "normal");
                                            doc.setFontSize(10);
                                            doc.setTextColor(255, 0, 0);
                                            const buttonText = `Click to open the file`;
                                            const textWidth = doc.getTextWidth(buttonText);
                                            const centerX = (doc.internal.pageSize.width - textWidth) / 2;

                                            // Add the text at the center and create the link
                                            doc.text(buttonText, centerX, yPosition + 10);
                                            doc.link(centerX, yPosition + 10, textWidth, 10, { url: url });

                                            // Adjust yPosition for the next line
                                            yPosition += lineHeight + 2; // Adjust for button space
                                        });
                                    }

                                }
                            });

                            await Promise.all(filePromises);
                        }


                    }

                }

                doc.addPage();
                let newYPosition = 20
                doc.autoTable({
                    head: [[
                        { content: 'Declaration and Authorization', colSpan: 4, styles: { halign: 'center', fontSize: 16, bold: true } }
                    ]],
                    body: [
                        [
                            { content: 'I hereby authorize GoldQuest Global HR Services Private Limited and its representative to verify information provided in my application for employment and this employee background verification form, and to conduct enquiries as may be necessary, at the company’s discretion. I authorize all persons who may have information relevant to this enquiry to disclose it to GoldQuest Global HR Services Pvt Ltd or its representative. I release all persons from liability on account of such disclosure. I confirm that the above information is correct to the best of my knowledge. I agree that in the event of my obtaining employment, my probationary appointment, confirmation as well as continued employment in the services of the company are subject to clearance of medical test and background verification check done by the company.',
                            colSpan: 4, styles: { halign: 'center', fontSize: 9, cellPadding: 5 } }
                        ],
                        ['Name', cefData?.name_declaration || 'N/A', 'Date', cefData?.declaration_date || 'N/A']
                    ],
                    startY: newYPosition,
                    margin: { top: 20 },
                    theme: 'grid',
                });
                
    
    
    
                newYPosition = doc.autoTable.previous.finalY + 20; // Adjusting for space from the last table
    
                doc.text("Attach Signature.", doc.internal.pageSize.width / 2, newYPosition, { align: 'center' });
    
                const lineHeight = 10;
                const margin = 10;
                const DocHeight = 100; // Height for images (adjust as needed)
    
                // Check if the signature exists
                if (cefData && cefData.signature) {
                    // Check if the signature is an image
                    const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
                    const isImage = validImageExtensions.some(ext => cefData.signature.toLowerCase().endsWith(ext));
    
                    if (isImage) {
                        // Fetch the base64 image
                        const imageBases = await fetchImageToBase([cefData.signature]);
    
                        // Assuming imageBases[0] exists and contains the base64 string
                        if (imageBases && imageBases[0] && imageBases[0].base64) {
                            const imageBase64 = imageBases[0].base64;
                            const imageWidth = doc.internal.pageSize.width - 10; // 20px padding for margins
    
                            // Add the image to the PDF
                            doc.addImage(imageBase64, 'PNG', 5, newYPosition + 20, imageWidth, DocHeight);
                            newYPosition += DocHeight + 20; // Update the position after the image
                        }
                    } else {
                        // If not an image, show a clickable button to view the document
                        const buttonText = "Click to view attached document";
                        const textWidth = doc.getTextWidth(buttonText);
                        const centerX = (doc.internal.pageSize.width - textWidth) / 2;
    
                        // Add the text at the center
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        doc.setTextColor(255, 0, 0); // Red color for the button text
                        doc.text(buttonText, centerX + 10, newYPosition + 10);
    
                        // Create the clickable link to open the document (e.g., cefData.signature could be a URL to the document)
                        doc.link(centerX, newYPosition + 10, textWidth, 10, { url: cefData.signature });
    
                        // Update the position after the link
                        newYPosition += lineHeight + 20; // Adjust space for next content
                    }
                } else {
                    // If no signature exists, add a message or alternative content
                    doc.text("No Signature uploaded.", 10, newYPosition + 10);
                    newYPosition += lineHeight + 20; // Adjust space for next content
                }
    
                doc.addPage();

                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                const pageWidth = doc.internal.pageSize.width; // Get the page width
                const textWidth = doc.getTextWidth("Documents (Mandatory)"); // Get the width of the text
                
                doc.text("Documents (Mandatory)", (pageWidth - textWidth) / 2, 15); // Center-align text
                
                // Define table columns
                const columns = [
                    { content: "Education", styles: { fontStyle: "bold" } },
                    { content: "Employment", styles: { fontStyle: "bold" } },
                    { content: "Government ID / Address Proof", styles: { fontStyle: "bold" } }
                ];

                // Define table rows
                const rows = [
                    [
                        "Photocopy of degree certificate and final mark sheet of all examinations.",
                        "Photocopy of relieving / experience letter for each employer mentioned in the form.",
                        "Aadhaar Card / Bank Passbook / Passport Copy / Driving License / Voter ID."
                    ]
                ];

                // Generate table
                doc.autoTable({
                    startY: 20,
                    head: [columns],
                    headStyles: {
                        lineWidth: 0.3,
                    },
                    body: rows,
                    styles: { fontSize: 10, cellPadding: 4 },
                    theme: "grid",
                    columnStyles: {
                        0: { halign: "center", minCellWidth: 60 },
                        1: { halign: "center", minCellWidth: 60 },
                        2: { halign: "center", minCellWidth: 60 }
                    }
                });

                // Footer Note
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "normal");
                doc.text(
                    "NOTE: If you experience any issues or difficulties with submitting the form, please take screenshots of all pages, including attachments and error messages, and email them to onboarding@goldquestglobal.in. Additionally, you can reach out to us at onboarding@goldquestglobal.in.",
                    14,
                    doc.lastAutoTable.finalY + 10,
                    { maxWidth: 180 }
                );
                doc.save(`${customerInfo?.client_unique_id}-${customerInfo?.name}`);

                swalLoading.close();

                // Optionally, show a success message
                Swal.fire({
                    title: 'PDF Generated!',
                    text: 'Your PDF has been successfully generated.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            })();


        } catch (error) {
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


    function isImage(fileUrl) {
        const validImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        return validImageExtensions.some(ext => fileUrl.toLowerCase().endsWith(ext));
    }
    const fetchData = useCallback(() => {
        const branchData = JSON.parse(localStorage.getItem("branch")) || {};
        const branchEmail = branchData?.email;
        setIsBranchApiLoading(true);
        setLoading(true);
        const branchId = JSON.parse(localStorage.getItem("branch"))?.branch_id;
        const token = localStorage.getItem("branch_token");

        const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
        const admin_id = adminData?.id;

        if (!token || !admin_id || !applicationId || !branchId) {
            setLoading(false);
            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;// Stop loading if required params are missing
            return;
        }

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };


        const payLoad = {
            application_id: applicationId,
            branch_id: branchId,
            _token: token,
            ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
        };

        // Zet het object om naar een query string
        const queryString = new URLSearchParams(payLoad).toString();


        fetch(
            `https://api.goldquestglobal.in/branch/candidate-application/bgv-application-by-id?${queryString}`,
            requestOptions
        )
            .then(res => {
                return res.json().then(data => {
                    const newToken = data.token || data._token || '';
                    if (newToken) {
                        localStorage.setItem("branch_token", newToken); // Save the new token in localStorage
                    }
                    if (data.message && data.message.toLowerCase().includes("invalid") && data.message.toLowerCase().includes("token")) {
                        // Session expired, redirect to login
                        Swal.fire({
                            title: "Session Expired",
                            text: "Your session has expired. Please log in again.",
                            icon: "warning",
                            confirmButtonText: "Ok",
                        }).then(() => {
                            // Redirect to customer login page in the current tab
                            window.location.href = `/customer-login?email=${encodeURIComponent(branchEmail)}`;
                        });
                        return; // Stop further execution after session expiry
                    }

                    // Handle non-OK responses
                    if (!res.ok) {
                        throw new Error(`Error fetching data: ${res.statusText}`);
                    }

                    // Process the data if the response is OK
                    setCompanyName(data.application?.customer_name || 'N/A');
                    setPurpose(data.application?.purpose_of_application || 'N/A');
                    setCefData(data.CEFData || {});

                    // Handle service data safely
                    const serviceDataa = data.serviceData || {};
                    const jsonDataArray = Object.values(serviceDataa)?.map(item => item.jsonData) || [];
                    const serviceValueDataArray = Object.values(serviceDataa)?.map(item => item.data) || [];

                    setServiceData(jsonDataArray);
                    setServiceValueData(serviceValueDataArray);

                    setCustomBgv(data.customerInfo?.is_custom_bgv || '');
                    setCustomerInfo(data.customerInfo || []);
                    const parsedData = data?.serviceData || [];

                    let allJsonData = [];
                    let allJsonDataValue = [];

                    // Sorting and restructuring the parsed data
                    const sortedData = Object.entries(parsedData)
                        .sort(([, a], [, b]) => {
                            const groupA = a.group || '';  // Default to empty string if a.group is null or undefined
                            const groupB = b.group || '';  // Default to empty string if b.group is null or undefined
                            return groupA.localeCompare(groupB);
                        })
                        .reduce((acc, [key, value]) => {
                            acc[key] = value;  // Reconstruct the object with sorted entries
                            return acc;
                        }, {});

                    // Collecting jsonData and jsonDataValue
                    for (const key in parsedData) {
                        if (parsedData.hasOwnProperty(key)) {
                            const jsonData = parsedData[key]?.jsonData;  // Safe navigation in case it's null or undefined
                            if (jsonData) {
                                allJsonData.push(jsonData);  // Store jsonData in the array
                                ;
                            }

                            const jsonDataValue = parsedData[key]?.data;  // Safe navigation in case it's null or undefined
                            if (jsonDataValue) {
                                allJsonDataValue.push(jsonDataValue);  // Store jsonData in the array
                            }
                        }
                    }
                    setAnnexureImageData(allJsonDataValue)


                    // Constructing the annexureData object
                    allJsonData.forEach(service => {
                        if (service.db_table !== 'gap_validation') {
                            service?.rows?.forEach(row => {  // Check if rows exist before iterating
                                row?.inputs?.forEach(input => {
                                    // Fetch the static inputs dynamically from annexureData

                                    // Fetch the dynamic field value from allJsonDataValue
                                    let fieldValue = allJsonDataValue.find(data => data && data.hasOwnProperty(input.name)); // Check for null or undefined before accessing `hasOwnProperty`
                                    // If fieldValue exists, we set it, otherwise, static value should remain
                                    if (fieldValue && fieldValue.hasOwnProperty(input.name)) {

                                        // Set dynamic value in the correct field in annexureData
                                        if (!annexureData[service.db_table]) {
                                            annexureData[service.db_table] = {}; // Initialize the service table if it doesn't exist
                                        }

                                        // Set the dynamic value in the service table under the input's name
                                        annexureData[service.db_table][input.name] = fieldValue[input.name] || "  ";


                                    } else {

                                    }
                                });
                            });
                        } else {
                            let fieldValue = allJsonDataValue.find(data => data && data.hasOwnProperty('no_of_employment')); // Check for null or undefined before accessing `hasOwnProperty`
                            let initialAnnexureDataNew = initialAnnexureData;
                            if (fieldValue && fieldValue.hasOwnProperty('no_of_employment')) {
                                initialAnnexureDataNew = updateEmploymentFields(fieldValue.no_of_employment, fieldValue); // Call function to handle employment fields
                            } else {
                            }
                            annexureData[service.db_table].employment_fields = initialAnnexureDataNew.gap_validation.employment_fields;
                        }

                    });


                    setAnnexureData(annexureData);
                    const fileInputs = allJsonData
                        .flatMap(item =>
                            item.rows.flatMap(row =>
                                row.inputs
                                    .filter(input => input.type === "file")
                                    .map(input => ({
                                        [input.name]: `${item.db_table}_${input.name}`
                                    }))
                            )
                        );
                    calculateGaps();
                    setServiceDataImageInputNames(fileInputs);
                    setServiceDataMain(allJsonData);
                    setNationality(data.application?.nationality || '');
                });
            })
            .catch(err => {
                setError(err.message || 'An unexpected error occurred.');
            })
            .finally(() => {
                setLoading(false)
                setIsBranchApiLoading(false); // End loading
            });
    }, [applicationId, branchId]);

    const [isSameAsPermanent, setIsSameAsPermanent] = useState(false);
    const [gaps, setGaps] = useState({});
    const [employGaps, setEmployGaps] = useState({});
    const [loading, setLoading] = useState(false);
    const [conditionHtml, setConditionHtml] = useState("");

    const [activeTab, setActiveTab] = useState(0); // Tracks the active tab (0, 1, or 2)

    const [initialAnnexureData, setInitialAnnexureData] = useState({
        gap_validation: {
            highest_education_gap: '',
            years_of_experience_gap: '',
            no_of_employment: 0,

        }
    });

    const createEmploymentFields = (noOfEmployments, fieldValue) => {
        let employmentFieldsData = fieldValue.employment_fields;

        // Check if it's a string (i.e., it's been stringified previously) and parse it
        if (typeof employmentFieldsData === 'string') {
            employmentFieldsData = JSON.parse(employmentFieldsData);
        } else {
        }

        const employmentFields = {}; // Initialize the employmentFields object to store all employment data

        // Dynamically structure the data like: employment_1, employment_2, etc.
        for (let i = 1; i <= noOfEmployments; i++) {

            const employmentData = employmentFieldsData[`employment_${i}`] || {};

            employmentFields[`employment_${i}`] = {
                [`employment_type_gap`]: employmentData[`employment_type_gap`] || '',
                [`employment_start_date_gap`]: employmentData[`employment_start_date_gap`] || '',
                [`employment_end_date_gap`]: employmentData[`employment_end_date_gap`] || '',
            };

        }

        return employmentFields;
    };

    const updateEmploymentFields = (noOfEmployments, fieldValue) => {

        // Generate new employment fields based on the provided number of employments
        const allEmploymentFields = createEmploymentFields(noOfEmployments, fieldValue);


        // Create a copy of the current annexureData
        const updatedAnnexureData = { ...annexureData };

        // Check if gap_validation exists before modifying
        if (updatedAnnexureData.gap_validation) {
            // Delete the existing employment_fields key
            delete updatedAnnexureData.gap_validation.employment_fields;
        } else {
            // If gap_validation doesn't exist, initialize it
            updatedAnnexureData.gap_validation = {};
        }

        // Add the new employment_fields data
        updatedAnnexureData.gap_validation.highest_education_gap = fieldValue.highest_education_gap;
        updatedAnnexureData.gap_validation.no_of_employment = fieldValue.no_of_employment;
        updatedAnnexureData.gap_validation.years_of_experience_gap = fieldValue.years_of_experience_gap;
        updatedAnnexureData.gap_validation.i_am_fresher = fieldValue.i_am_fresher;
        updatedAnnexureData.gap_validation.education_fields = JSON.parse(fieldValue.education_fields);
        updatedAnnexureData.gap_validation.employment_fields = allEmploymentFields;

        // Set state with updated data
        setAnnexureData(updatedAnnexureData);

        return updatedAnnexureData; // This can be used for further handling if needed
    };
    const [annexureData, setAnnexureData] = useState(initialAnnexureData);

    const [hiddenRows, setHiddenRows] = useState({});
    const [serviceDataMain, setServiceDataMain] = useState([]);
    const [serviceDataImageInputNames, setServiceDataImageInputNames] = useState([]);
    const [cefDataApp, setCefDataApp] = useState([]);
    const [annexureImageData, setAnnexureImageData] = useState([]);



    const renderGapMessage = (gap) => {
        // Check if gap exists and if years or months are greater than 0
        if (gap && (gap.years > 0 || gap.months > 0)) {
            return (
                <p style={{ color: 'red' }}>
                    Gap: {gap.years} {gap.years === 1 ? 'year' : 'years'}, {gap.months} {gap.months === 1 ? 'month' : 'months'}
                </p>
            );
        }

        // If no gap or zero gap, show "No Gap" in green
        return (
            <p style={{ color: 'green' }}>
                No Gap
            </p>
        );
    };


    const toggleRowsVisibility = (serviceIndex, rowIndex, isChecked) => {


        setHiddenRows((prevState) => {
            const newState = { ...prevState };
            const serviceRows = serviceDataMain[serviceIndex].rows || serviceDataMain.rows;
            const row = serviceRows[rowIndex];
            const fileInputs = row.inputs.filter(input => input.type === 'file');
            let removedFileInputs = [];

            // Check if any checkbox in this row is either 'done_or_not' or 'has_not_done'
            const isSpecialCheckbox = row.inputs.some(input =>
                input.type === 'checkbox' &&
                (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'))
            );


            if (isSpecialCheckbox) {
                if (isChecked) {

                    // Remove from serviceDataImageInputNames when checked
                    setServiceDataImageInputNames((prevFileInputs) => {
                        const updatedFileInputs = prevFileInputs.filter(fileInput => {
                            const fileInputName = Object.values(fileInput)[0];
                            const isCurrentServiceFile = fileInputName.startsWith(`${serviceDataMain[serviceIndex].db_table}_`);

                            const isCheckboxRelated = row.inputs.some(input =>
                                input.type === 'checkbox' &&
                                (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'))
                            );

                            if (isCurrentServiceFile && !isCheckboxRelated) {
                                // Track removed file inputs to restore them later
                                removedFileInputs.push(fileInput);
                                return false;
                            }

                            return true;
                        });

                        return updatedFileInputs;
                    });

                    // Add rows visibility when checked
                    for (let i = rowIndex + 1; i < serviceRows.length; i++) {
                        const row = serviceRows[i];
                        const hasCheckbox = row.inputs && row.inputs.some(input => input.type === 'checkbox');

                        const isSpecialCheckbox = hasCheckbox && row.inputs.some(input => {
                            if (typeof input.name === 'string') {
                                return input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done');
                            }
                            return false;
                        });

                        if (isSpecialCheckbox) continue;

                        newState[`${serviceIndex}-${i}`] = true; // Show next row
                    }

                    // Handle dynamic content (HTML, PDFs, etc.)
                    const conditions = serviceDataMain[serviceIndex]?.conditions || [];
                    if (Array.isArray(conditions)) {
                        conditions.forEach(condition => {
                            if (row.inputs.some(input => input.name === condition.name) && isChecked) {
                                const attributes = condition.show?.attribute || [];
                                attributes.forEach(attr => {
                                    const replaceAttributes = condition.replace_attributes || [];
                                    let updatedContent = condition[attr] || "";

                                    if (replaceAttributes.length > 0) {
                                        replaceAttributes.forEach(replaceAttr => {
                                            let dynamicValue = cefDataApp[replaceAttr] || 'NIL';
                                            if (replaceAttr === 'date') {
                                                dynamicValue = new Date().toISOString().split('T')[0]; // Current date in 'YYYY-MM-DD'
                                            }
                                            const regex = new RegExp(`{{${replaceAttr}}}`, 'g');
                                            updatedContent = updatedContent.replace(regex, dynamicValue);
                                        });

                                        // Update the condition HTML state
                                        setConditionHtml(prevState => ({
                                            ...prevState,
                                            [attr]: updatedContent,
                                            service_index: serviceIndex
                                        }));
                                    } else {
                                        setConditionHtml(prevState => ({
                                            ...prevState,
                                            service_index: serviceIndex,
                                            [attr]: 'NIL' // Default to 'NIL' if no attributes present
                                        }));
                                    }
                                });
                            }
                        });
                    }

                } else {

                    // Restore removed file inputs when unchecked
                    setServiceDataImageInputNames((prevFileInputs) => {
                        const updatedFileInputs = [...prevFileInputs, ...removedFileInputs];
                        return updatedFileInputs;
                    });

                    // Remove rows visibility when unchecked
                    for (let i = rowIndex + 1; i < serviceRows.length; i++) {
                        const row = serviceRows[i];
                        const hasCheckbox = row.inputs && row.inputs.some(input => input.type === 'checkbox');

                        const isSpecialCheckbox = hasCheckbox && row.inputs.some(input => {
                            if (typeof input.name === 'string') {
                                return input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done');
                            }
                            return false;
                        });

                        if (isSpecialCheckbox) continue;

                        delete newState[`${serviceIndex}-${i}`]; // Hide next row
                    }

                    // Clear dynamic content (reset condition HTML)
                    setConditionHtml({});
                }
            }

            return newState;
        });
    };


    const handleBack = () => {
        if (activeTab > 0) {
            setActiveTab(activeTab - 1); // Adjust the active tab to go back
        }
    };

    const handleNext = () => {
        setActiveTab(activeTab + 1);
        if (activeTab > 0 && activeTab <= serviceDataMain.length) {
            // Iterate over serviceDataMain for the rows to toggle visibility
            serviceDataMain[activeTab - 1].rows.forEach((row, rowIndex) => {
                const isChecked = ["1", 1, true, "true"].includes(
                    annexureData[serviceDataMain[activeTab - 1].db_table]?.[row.inputs.find(input => input.type === 'checkbox')?.name] ?? false
                );

                toggleRowsVisibility(activeTab - 1, rowIndex, isChecked);
            });
        }
    };


    const calculateDateGap = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return null; // Return null for negative gaps (startDate is later than endDate)
        }

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        return { years: Math.abs(years), months: Math.abs(months) };
    };


    function calculateDateDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        if (isNaN(d1) || isNaN(d2)) return "Invalid Date";

        // Check if date1 is greater than or equal to date2
        if (d1 >= d2) return "No gap";

        let years = d2.getFullYear() - d1.getFullYear();
        let months = d2.getMonth() - d1.getMonth();
        let days = d2.getDate() - d1.getDate();

        if (days < 0) {
            months--;
            days += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        return `${years > 0 ? years + " year(s) " : ""}${months > 0 ? months + " month(s) " : ""}${days > 0 ? days + " day(s)" : ""}`.trim();
    }

    const calculateGaps = () => {

        // Data from your JSON
        const secondaryEndDate = annexureData?.gap_validation?.education_fields?.secondary?.secondary_end_date_gap || null;
        const seniorSecondaryStartDate = annexureData?.gap_validation?.education_fields?.senior_secondary?.senior_secondary_start_date_gap || null;
        const seniorSecondaryEndDate = annexureData?.gap_validation?.education_fields?.senior_secondary?.senior_secondary_end_date_gap || null;
        const graduationStartDate = annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_start_date_gap || null;
        const graduationEndDate = annexureData?.gap_validation?.education_fields?.graduation_1?.graduation_end_date_gap || null;
        const postGraduationStartDate = annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_start_date_gap || null;
        const postGraduationEndDate = annexureData?.gap_validation?.education_fields?.post_graduation_1?.post_graduation_end_date_gap || null;
        const phdStartDate = annexureData?.gap_validation?.education_fields?.phd_1?.phd_start_date_gap || null;

        const gapSecToSrSec = calculateDateGap(secondaryEndDate, seniorSecondaryStartDate);
        const gapSrSecToGrad = calculateDateGap(seniorSecondaryEndDate, graduationStartDate);
        const gapGradToPostGrad = calculateDateGap(graduationEndDate, postGraduationStartDate);
        const gapPostGradToPhd = calculateDateGap(postGraduationEndDate, phdStartDate);

        const validGaps = {
            gapSecToSrSec,
            gapSrSecToGrad,
            gapGradToPostGrad,
            gapPostGradToPhd
        };

        // Filter out null gaps (negative values)
        const nonNegativeGaps = Object.fromEntries(
            Object.entries(validGaps).filter(([key, value]) => value !== null)
        );


        // Update state with non-negative gaps
        setGaps(nonNegativeGaps);

        function getEmploymentDates(annexureData) {
            const employmentStartDates = [];
            const employmentEndDates = [];
            let i = 1; // Start index


            const employmentValues = annexureData?.gap_validation?.employment_fields;

            if (!employmentValues) {
                console.warn('%cNo employment fields found in the data.', 'color: red; font-weight: bold;');
                return { employmentStartDates, employmentEndDates };
            }

            while (true) {
                const employmentKey = `employment_${i}`;
                const employmentData = employmentValues[employmentKey];

                if (!employmentData) {
                    console.warn(`%cNo data found for ${employmentKey}, stopping loop.`, 'color: orange;');
                    break;
                }

                // Define keys
                const startKey = `employment_start_date_gap`;
                const endKey = `employment_end_date_gap`;


                // Check if start or end date exists
                const hasStartDate = startKey in employmentData;
                const hasEndDate = endKey in employmentData;


                if (!hasStartDate && !hasEndDate) {
                    console.warn(`%cNo start or end date found for ${employmentKey}, stopping loop.`, 'color: orange;');
                    break;
                }

                // Push values if they exist
                if (hasStartDate) {
                    employmentStartDates.push({
                        name: startKey,
                        value: employmentData[startKey]
                    });
                }
                if (hasEndDate) {
                    employmentEndDates.push({
                        name: endKey,
                        value: employmentData[endKey]
                    });
                }

                i++; // Move to next employment record
            }

        
            return { employmentStartDates, employmentEndDates };
        }



        const { employmentStartDates, employmentEndDates } = getEmploymentDates(annexureData);

        function getEmploymentDateDifferences(startDates, endDates) {
            let differences = [];


            for (let i = 0; i < endDates.length; i++) {
                const currentEnd = endDates[i].value;
                const nextStart = startDates[i + 1] ? startDates[i + 1].value : null;


                if (currentEnd && nextStart && currentEnd !== nextStart) {
                    const diff = calculateDateDifference(currentEnd, nextStart);

                    // Only add valid differences (not empty strings or null)
                    if (diff) {
                        differences.push({
                            endName: endDates[i].name,
                            endValue: currentEnd,
                            startName: startDates[i + 1].name,
                            startValue: nextStart,
                            difference: diff
                        });
                    }
                }
            }

            // Log differences

            return differences;
        }

        // Get differences
        const dateDifferences = getEmploymentDateDifferences(employmentStartDates, employmentEndDates);

        // Log final employment gaps

        setEmployGaps(dateDifferences);
    };


     useEffect(() => {
           const fetchDataMain = async () => {
               if (!isBranchApiLoading) {
                   await checkBranchAuthentication();
                   await fetchData();
               }
           };
   
           fetchDataMain();
       }, [fetchData]);


    return (
        <>
            {
                loading ? (
                    <div className='flex justify-center items-center py-6 ' >
                        <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
                    </div >
                ) :
                    <>
                        <form className='py-6 bg-[#e5e7eb24] p-4' ref={contentRef} id='bg-form'>
                            <div className="md:w-10/12 mx-auto md:p-6" >
                                {customBgv === 1 && (
                                    <div className='flex justify-center my-3'>
                                        <img src={LogoBgv} className='md:w-[12%] w-[50%] m-auto' alt="Logo" />
                                    </div>
                                )}

                                <h4 className="text-Black md:text-3xl text-center text-xl md:mb-6 mb-3 font-bold mt-3">Background Verification Form</h4>
                                <div className='md:flex gap-5 justify-center'>
                                    <div className="mb-2 py-4 rounded-md">
                                        <h5 className="text-lg font-bold text-center md:text-start">Company name: <span className="text-lg font-normal">{companyName}</span></h5>
                                    </div>
                                    <div className="md:mb-6 mb-2 py-4 rounded-md">
                                        <h5 className="text-lg font-bold text-center md:text-start">Purpose of Application: <span className="text-lg font-normal">{purpose || 'NIL'}</span></h5>
                                    </div>
                                </div>

                                <div className="mb-6 flex p-2 filter-menu overflow-x-auto border rounded-md items-center flex-nowrap relative space-x-4">
                                    {/* Personal Information Tab */}
                                    <div className="text-center flex items-end gap-2">
                                        <button
                                            type='button'
                                            className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center ${activeTab === 0 ? "text-[#3e76a5]" : "text-gray-700"}`}
                                        >
                                            <FaUser
                                                className="mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full bg-[#3e76a5] text-white"
                                            />
                                            Personal Information
                                        </button>
                                        <MdOutlineArrowRightAlt className='text-2xl' />
                                    </div>

                                    {/* Current/Permanent Address Tab */}
                                    <div className="text-center flex items-end gap-2">
                                        <button
                                            type='button'
                                            className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
${activeTab === 1 ? "text-[#3e76a5]" : "text-gray-700"}`} // Text color changes based on tab active customBgv
                                        >
                                            <FaUser
                                                className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
${activeTab === 1 ? "bg-[#3e76a5] text-white" : (activeTab > 0 ? "bg-[#3e76a5] text-white" : "bg-gray-100 text-gray-400")}`} // Icon color changes based on active tab
                                            />
                                            Current/Permanent Address
                                        </button>
                                        <MdOutlineArrowRightAlt className={`text-2xl ${activeTab === 1 ? "text-[#3e76a5]" : "text-gray-700"}`} />


                                    </div>

                                    {/* Service Tabs */}
                                    {serviceData.map((service, index) => {
                                        const isTabEnabled = activeTab > index + 1;
                                        return (
                                            <div key={index} className="text-center flex items-end gap-2">
                                                <button
                                                    type='button'
                                                    className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
${activeTab === index + 2 ? "text-[#3e76a5]" : (isTabEnabled ? "text-gray-700" : "text-gray-400")}`}
                                                >
                                                    <FaCog
                                                        className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
${activeTab === index + 2 ? "bg-[#3e76a5] text-white" : (isTabEnabled ? "bg-[#3e76a5] text-white" : "bg-gray-100 text-gray-400")}`}
                                                    />
                                                    {service.heading}
                                                </button>
                                                <MdOutlineArrowRightAlt className='text-2xl' />
                                            </div>
                                        );
                                    })}

                                    {/* Declaration and Authorization Tab */}
                                    <div className="text-center">
                                        <button
                                            type='button'
                                            className={`px-0 py-2 pb-0 flex flex-wrap justify-center rounded-t-md whitespace-nowrap text-sm font-semibold items-center 
${activeTab === serviceData.length + 2 ? "text-[#3e76a5]" : "text-gray-400"}`} // Text color changes based on tab active customBgv
                                        >
                                            <FaCheckCircle
                                                className={`mr-2 text-center w-12 h-12 flex justify-center mb-3 border p-3 rounded-full 
${activeTab === serviceData.length + 2 ? "bg-[#3e76a5] text-white" : "bg-gray-100 text-gray-400"}`} // Icon color changes based on active tab
                                            />
                                            Declaration and Authorization
                                        </button>

                                    </div> </div>


                                <div className="border p-4 rounded-md shadow-md">
                                    {activeTab === 0 && (
                                        <div>
                                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6 border rounded-md  p-4" >
                                                {purpose == 'NORMAL BGV(EMPLOYMENT)' && (
                                                    <div className="form-group col-span-2" >
                                                        <label className='text-sm' > Applicant’s CV: <span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            type="file"
                                                            accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                            className="form-control border rounded w-full bg-white p-2 mt-2"
                                                            name="resume_file"
                                                            id="resume_file"

                                                        />

                                                        {cefData.resume_file && (
                                                            <div className='mt-3 border rounded-md p-2'>
                                                                {isImage(cefData.resume_file) ? (
                                                                    <img
                                                                        src={cefData.resume_file}
                                                                        className='object-contain p-3'
                                                                        alt="Resume Image"
                                                                    />
                                                                ) : (
                                                                    <a
                                                                        href={cefData.resume_file}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center justify-center h-full w-auto p-3 border bg-blue-500 text-white rounded-md"
                                                                    >
                                                                        View Document
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}

                                                    </div>
                                                )}
                                                < div className="form-group col-span-2" >
                                                    <label className='text-sm' > Attach Govt.ID Proof: <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png" // Restrict to image files
                                                        className="form-control border rounded w-full bg-white p-2 mt-2"
                                                        name="govt_id"
                                                        disabled // Allow  disabled file selection
                                                    />

                                                    <div className='md:grid grid-cols-5 gap-3'>

                                                        {cefData.govt_id ? (
                                                            cefData.govt_id.split(',').map((item, index) => {
                                                                // Check if the item is an image (based on its extension)
                                                                const isImage = item && (item.endsWith('.jpg') || item.endsWith('.jpeg') || item.endsWith('.png'));

                                                                return (
                                                                    <div key={index} className='border rounded-md flex items-center justify-center'>
                                                                        {isImage ? (
                                                                            <img src={item} alt={`Image ${index}`} className='p-3 ' />
                                                                        ) : (
                                                                            <div>
                                                                                <button onClick={() => window.open(item, '_blank')} type='button' className='border-[#3e76a5] rounded-md p-3 '>Open Link</button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <p><></></p>
                                                        )}
                                                    </div>


                                                </div>



                                                {
                                                    customBgv === 1 && (
                                                        <>
                                                            <div className="form-group col-span-2" >
                                                                <label className='text-sm' > Passport size photograph - (mandatory with white Background)<span className="text-red-500 text-lg" >* </span></label >
                                                                <input
                                                                    type="file"
                                                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                                    className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                    name="passport_photo"
                                                                    disabled

                                                                />

                                                                <div className='md:grid grid-cols-5 gap-3'>
                                                                    {cefData.passport_photo ? (
                                                                        cefData.passport_photo.split(',').map((item, index) => {
                                                                            // Check if the item is an image (based on its extension)
                                                                            const isImage = item && (item.endsWith('.jpg') || item.endsWith('.jpeg') || item.endsWith('.png'));

                                                                            return (
                                                                                <div key={index} className='border rounded-md flex items-center justify-center mt-2 p-3'>
                                                                                    {isImage ? (
                                                                                        <img src={item} alt={`Image ${index}`} className='p-3' />
                                                                                    ) : (
                                                                                        <div>
                                                                                            <button onClick={() => window.open(item, '_blank')} type='button' className='text-blue-600 font-bold p-5'>Open Link</button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <p><></></p>
                                                                    )}
                                                                </div>


                                                            </div>
                                                        </>
                                                    )}

                                            </div>

                                            < div className='border p-4' >
                                                <h4 className="md:text-start text-start md:text-2xl text-sm my-6 font-bold " > Personal Information </h4>

                                                < div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 " >
                                                    <div className="form-group" >
                                                        <label className='text-sm' > Full Name as per Govt ID Proof(first, middle, last): <span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.full_name}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="full_name"
                                                            name="full_name"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="former_name" > Former Name / Maiden Name(if applicable)<span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.former_name}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="former_name"
                                                            name="former_name"
                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="mob_no" > Mobile Number: <span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.mb_no}
                                                            type="number"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            name="mb_no"
                                                            id="mob_no"
                                                            minLength="10"
                                                            maxLength="10"

                                                        />
                                                    </div>
                                                </div>
                                                < div className="grid grid-cols-1 md:grid-cols-3 gap-4" >

                                                    <div className="form-group" >
                                                        <label className='text-sm' htmlFor="father_name">Father's Name: <span className="text-red-500 text-lg">*</span></label>
                                                        <input
                                                            disabled
                                                            value={cefData.father_name}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="father_name"
                                                            name="father_name"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="husband_name" > Spouse's Name</label>
                                                        < input
                                                            disabled
                                                            value={cefData.husband_name}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="husband_name"
                                                            name="husband_name"
                                                        />
                                                    </div>

                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="dob" > DOB: <span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.dob}
                                                            type="date"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            name="dob"
                                                            id="dob"

                                                        />
                                                    </div>
                                                </div>
                                                < div className="grid grid-cols-1 md:grid-cols-1 gap-4" >

                                                    <div className="form-group my-4" >
                                                        <label className='text-sm' htmlFor="gender" >
                                                            Gender: <span className="text-red-500 text-lg" >* </span>
                                                        </label>
                                                        < select
                                                            disabled
                                                            value={cefData.gender}
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            name="gender"
                                                            id="gender"
                                                        >
                                                            <option value=""  >
                                                                Select gender
                                                            </option>
                                                            < option value="male" > Male </option>
                                                            < option value="female" > Female </option>
                                                            < option value="other" > Other </option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {nationality === "Indian" && (
                                                    <div className='form-group'>
                                                        <label className='text-sm'>Aadhar card No</label>
                                                        <input
                                                            type="text"
                                                            name="aadhar_card_number"
                                                            value={cefData.aadhar_card_number}
                                                            disabled
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                        />
                                                    </div>
                                                )}
                                                < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
                                                    {
                                                        customBgv === 1 && nationality === "Indian" && (
                                                            <>
                                                                <div className='form-group'>
                                                                    <label className='text-sm'>
                                                                        Name as per Aadhar card <span className='text-red-500 text-lg'>*</span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        name="aadhar_card_name"
                                                                        value={cefData.aadhar_card_name}
                                                                        disabled
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />

                                                                </div>

                                                                <div className='form-group'>
                                                                    <label className='text-sm'>
                                                                        Aadhar Card Image <span className='text-red-500 text-lg'>*</span>
                                                                    </label>
                                                                    <input
                                                                        disabled
                                                                        type="file"
                                                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                                        name="aadhar_card_image"
                                                                        className="form-control border rounded w-full p-1 mt-2"
                                                                    />



                                                                </div>
                                                            </>
                                                        )
                                                    }

                                                </div>
                                                {
                                                    cefData.aadhar_card_image && (
                                                        isImage(cefData.aadhar_card_image) ? (
                                                            // If it's an image, display it
                                                            <div className=' border rounded-md p-2 my-4'>
                                                                <p className=' font-bold'>Aadhar Card Image</p>
                                                                <div className=""> <img
                                                                    src={cefData.aadhar_card_image || "NO IMAGE FOUND"}
                                                                    alt="Aadhar Card"
                                                                    className=' object-contain p-3'
                                                                /></div>
                                                            </div>
                                                        ) : (
                                                            // If it's not an image, show a clickable link (view document)
                                                           
                                                            <div className='mt-2 p-5 border text-center'>
                                                                <a
                                                                    href={cefData.aadhar_card_image}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-500 text-center font-bold "
                                                                >
                                                                    View Aadhar Card Document
                                                                </a>
                                                            </div>
                                                        )
                                                    )
                                                }

                                                {nationality === "Indian" && (
                                                    <div className='form-group' >
                                                        <label className='text-sm' > Pan card No </label>
                                                        <input
                                                            type="text"
                                                            disabled
                                                            name="pan_card_number"
                                                            value={cefData.pan_card_number}
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                        />
                                                    </div>
                                                )
                                                }
                                                < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >

                                                    {
                                                        customBgv === 1 && nationality === "Indian" && (
                                                            <>

                                                                <div className='form-group' >
                                                                    <label className='text-sm' >Name as per Pan Card< span className='text-red-500 text-lg' >* </span></label >
                                                                    <input
                                                                        disabled
                                                                        type="text"
                                                                        name="pan_card_name"
                                                                        value={cefData.pan_card_name}
                                                                        className="form-control border rounded w-full p-2 mt-2"
                                                                    />
                                                                </div>
                                                            </>
                                                        )}

                                                    {customBgv === 1 && nationality === "Indian" && (
                                                        <div className='form-group' >
                                                            <label className='text-sm' > Pan Card Image < span className='text-red-500 text-lg' >* </span></label >
                                                            <input
                                                                type="file"
                                                                disabled
                                                                accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                                name="pan_card_image"
                                                                className="form-control border rounded w-full p-1 mt-2"

                                                            />




                                                        </div>
                                                    )}



                                                </div>

                                                {cefData.pan_card_image && (
                                                    isImage(cefData.pan_card_image) ? (
                                                        // If it's an image, display it
                                                        <div className=' border rounded-md p-2 my-4'>
                                                            <p className=' font-bold'>Pan Card Image</p>
                                                            <div className="">
                                                                <img
                                                                    src={cefData.pan_card_image || "NO IMAGE FOUND"}
                                                                    className='object-contain p-3'
                                                                    alt="Pan Card Image"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // If it's not an image, show a clickable link (view document)
                                                        <div className='mt-2 p-5 border text-center'>
                                                            <a
                                                                href={cefData.pan_card_image}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 font-bold "
                                                            >
                                                                View Pan Card Document
                                                            </a>
                                                        </div>
                                                    )
                                                )}
                                                {
                                                    customBgv == 0 && nationality === "Other" && (
                                                        <div className="form-group" >
                                                            <label className='text-sm' > Social Security Number(if applicable): </label>
                                                            < input
                                                                disabled
                                                                value={cefData.ssn_number}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                name="ssn_number"

                                                            />
                                                        </div>
                                                    )
                                                }
                                                {nationality === "Other" && (
                                                    <>
                                                        < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >

                                                            <div className="form-group" >
                                                                <label className='text-sm' >Passport No</label>
                                                                < input
                                                                    disabled
                                                                    value={cefData.passport_no}
                                                                    type="text"
                                                                    className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                    name="passport_no"

                                                                />
                                                            </div>
                                                            <div className="form-group" >
                                                                <label className='text-sm' >Driving Licence / Resident Card / Id no</label>
                                                                < input
                                                                    disabled
                                                                    value={cefData.dme_no}
                                                                    type="text"
                                                                    className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                    name="dme_no"

                                                                />
                                                            </div>

                                                        </div>
                                                        <div className="form-group" >
                                                            <label className='text-sm' >TAX No</label>
                                                            < input
                                                                disabled
                                                                value={cefData.tax_no}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                                name="tax_no"
                                                            />
                                                        </div>

                                                    </>
                                                )}
                                                < div className="grid grid-cols-1 md:grid-cols-2 gap-4 " >
                                                    <div className="form-group" >
                                                        <label className='text-sm' htmlFor="nationality" > Nationality: <span className="text-red-500 text-lg" >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.nationality}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            name="nationality"
                                                            id="nationality"

                                                        />
                                                    </div>
                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="marital_status" > Marital Status: <span className="text-red-500 text-lg" >* </span></label >
                                                        <select
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            name="marital_status"
                                                            id="marital_status"
                                                            disabled
                                                            value={cefData.marital_status}

                                                        >
                                                            <option value="" > SELECT Marital Status </option>
                                                            < option value="Dont wish to disclose" > Don't wish to disclose</option>
                                                            < option value="Single" > Single </option>
                                                            < option value="Married" > Married </option>
                                                            < option value="Widowed" > Widowed </option>
                                                            < option value="Divorced" > Divorced </option>
                                                            < option value="Separated" > Separated </option>
                                                        </select>
                                                    </div>
                                                </div>

                                            </div>
                                            {
                                                customBgv === 1 && (
                                                    <>
                                                        <div className='border border-gray-300 p-6 rounded-md mt-5 hover:transition-shadow duration-300' >

                                                            <label className='text-sm' > Blood Group </label>
                                                            < div className='form-group' >
                                                                <input
                                                                    type="text"
                                                                    name="blood_group"
                                                                    value={cefData.blood_group}
                                                                    disabled
                                                                    className="form-control border rounded w-full p-2 mt-2"
                                                                />
                                                            </div>

                                                            < div className='border rounded-md p-3 my-5 ' >
                                                                <h3 className='md:text-center text-start md:text-xl text-sm font-bold pb-4' > Add Emergency Contact Details </h3>
                                                                < div className='md:grid grid-cols-3 gap-3 ' >
                                                                    <div className='form-group' >
                                                                        <label className='text-sm' > Name < span className='text-red-500 text-lg' >* </span></label >
                                                                        <input
                                                                            type="text"
                                                                            name="emergency_details_name"
                                                                            value={cefData.emergency_details_name}
                                                                            disabled
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                    < div className='form-group' >
                                                                        <label className='text-sm' > Relation < span className='text-red-500 text-lg' >* </span></label >
                                                                        <input
                                                                            type="text"
                                                                            name="emergency_details_relation"
                                                                            value={cefData.emergency_details_relation}
                                                                            disabled
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                    < div className='form-group' >
                                                                        <label className='text-sm' > Contact Number < span className='text-red-500 text-lg' >* </span></label >
                                                                        <input
                                                                            type="text"
                                                                            name="emergency_details_contact_number"
                                                                            value={cefData.emergency_details_contact_number}
                                                                            disabled
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>


                                                            < div className='border rounded-md p-3 mt-3  ' >
                                                                <h3 className='md:text-center text-start md:text-xl text-sm font-bold pb-2' > Insurance Nomination Details: - (A set of parent either Parents or Parents in Law, 1 child, Spouse Nominee details)</h3>
                                                                < div className='md:grid grid-cols-2 gap-3' >
                                                                    <div className='form-group' >
                                                                        <label className='text-sm' > Name(s)
                                                                        </label>
                                                                        < input
                                                                            type="text"
                                                                            name="insurance_details_name"
                                                                            value={cefData.insurance_details_name}
                                                                            disabled
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                    < div className='form-group' >
                                                                        <label className='text-sm' > Nominee Relationship
                                                                        </label>
                                                                        < input
                                                                            type="text"
                                                                            name="insurance_details_nominee_relation"
                                                                            value={cefData.insurance_details_nominee_relation}
                                                                            disabled
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                    < div className='form-group' >
                                                                        <lalbel>Nominee Date of Birth
                                                                        </lalbel>
                                                                        < input
                                                                            type="date"
                                                                            name="insurance_details_nominee_dob"
                                                                            value={cefData.insurance_details_nominee_dob}
                                                                            disabled
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                    < div className='form-group' >
                                                                        <label className='text-sm' > Contact No.
                                                                        </label>
                                                                        < input
                                                                            type="text"
                                                                            name="insurance_details_contact_number"
                                                                            value={cefData.insurance_details_contact_number}
                                                                            disabled
                                                                            className="form-control border rounded w-full p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            < label className='text-sm mt-5 block' > Do you want to opt for a Food Coupon ? <span className='text-red-500 text-lg' >* </span></label >

                                                            <div className='flex gap-6 mb-4  ' >
                                                                <div className='form-group pt-2 flex gap-2' >
                                                                    <input
                                                                        type="radio"
                                                                        name="food_coupon"
                                                                        value="Yes"
                                                                        checked={cefData.food_coupon === 'Yes'} // Check if "No" is selected

                                                                        disabled
                                                                        className="form-control border rounded p-2"
                                                                    />
                                                                    <label className='text-sm' > Yes </label>
                                                                </div>
                                                                < div className='form-group pt-2 flex gap-2' >
                                                                    <input
                                                                        type="radio"
                                                                        name="food_coupon"
                                                                        value="No"
                                                                        checked={cefData.food_coupon === 'No'} // Check if "No" is selected

                                                                        disabled
                                                                        className="form-control border rounded p-2"
                                                                    />
                                                                    <label className='text-sm' > No </label>
                                                                </div>
                                                            </div>


                                                            <p className='text-left ' > Food coupons are vouchers or digital meal cards given to employees to purchase food and non - alcoholic beverages.Specific amount as per your requirement would get deducted from your Basic Pay.These are tax free, considered as a non - monetary benefit and are exempt from tax up to a specified limit.</p>
                                                        </div>
                                                    </>
                                                )}





                                        </div>
                                    )}

                                    {activeTab === 1 && (
                                        <>
                                            <div className=' border-gray-300 rounded-md mt-5 hover:transition-shadow duration-300' >

                                                <h3 className='md:text-start md:mb-2 text-start md:text-2xl text-sm font-bold my-5' > Permanent Address </h3>
                                                <div className='border border-black p-4 rounded-md'>
                                                    < div className="grid grid-cols-1 md:grid-cols-2 gap-4 " >

                                                        <div className="form-group" >
                                                            <label className='text-sm' htmlFor="permanent_address" > Permanent Address < span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.permanent_address}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="permanent_address"
                                                                name="permanent_address"

                                                            />
                                                        </div>

                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="permanent_pin_code" > Pin Code < span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.permanent_pin_code}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="permanent_pin_code"
                                                                name="permanent_pin_code"

                                                            />
                                                        </div>
                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="permanent_address_landline_number" > Mobile Number < span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.permanent_address_landline_number}
                                                                type="number"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="permanent_address_landline_number"
                                                                name="permanent_address_landline_number"

                                                            />
                                                        </div>
                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="permanent_address_state" > Current State < span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.permanent_address_state}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="permanent_address_state"
                                                                name="permanent_address_state"

                                                            />
                                                        </div>
                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="permanent_prominent_landmark" > Current Landmark < span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.permanent_prominent_landmark}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="permanent_prominent_landmark"
                                                                name="permanent_prominent_landmark"

                                                            />
                                                        </div>
                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="permanent_address_stay_to" > Current Address Stay No.< span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.permanent_address_stay_to}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="permanent_address_stay_to"
                                                                name="permanent_address_stay_to"

                                                            />
                                                        </div>

                                                    </div>

                                                    < div className="form-group" >
                                                        <label className='text-sm' htmlFor="nearest_police_station" > Nearest Police Station.</label>
                                                        < input
                                                            disabled
                                                            value={cefData.permanent_address_nearest_police_station}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="permanent_address_nearest_police_station"
                                                            name="permanent_address_nearest_police_station"

                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className=' border-gray-300 rounded-md mt-5 hover:transition-shadow duration-300' >
                                                <input type="checkbox" name="" checked={isSameAsPermanent}
                                                    id="" className='me-2' /><label>Same as Permanent Address</label>

                                                <h3 className='md:text-start md:mb-2 text-start md:text-2xl text-sm font-bold my-5' > Current Address </h3>
                                                <div className='border border-black p-4 rounded-md'>
                                                    < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >


                                                        < div className="form-group" >
                                                            <label className='text-sm' > Current Address <span className="text-red-500 text-lg" >*</span></label >
                                                            <input
                                                                value={cefData.current_address}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="current_address"
                                                                name="current_address"
                                                                disabled

                                                            />
                                                        </div>
                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="current_address_pin_code" > Pin Code < span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.current_address_pin_code}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="current_address_pin_code"
                                                                name="current_address_pin_code"

                                                            />
                                                        </div>
                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="current_address_landline_number" > Mobile Number < span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.current_address_landline_number}
                                                                type="number"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="current_address_landline_number"
                                                                name="current_address_landline_number"

                                                            />
                                                        </div>
                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="current_address_state" > Current State < span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.current_address_state}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="current_address_state"
                                                                name="current_address_state"

                                                            />
                                                        </div>
                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="current_prominent_landmark" > Current Landmark < span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.current_prominent_landmark}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="current_prominent_landmark"
                                                                name="current_prominent_landmark"

                                                            />
                                                        </div>
                                                        < div className="form-group" >
                                                            <label className='text-sm' htmlFor="current_address_stay_to" > Current Address Stay No.< span className="text-red-500 text-lg" >* </span></label >
                                                            <input
                                                                disabled
                                                                value={cefData.current_address_stay_to}
                                                                type="text"
                                                                className="form-control border rounded w-full p-2 mt-2"
                                                                id="current_address_stay_to"
                                                                name="current_address_stay_to"
                                                            />
                                                        </div>

                                                    </div>

                                                    <div className="form-group" >
                                                        <label className='text-sm' htmlFor="nearest_police_station" > Nearest Police Station.</label>
                                                        < input
                                                            disabled
                                                            value={cefData.current_address_nearest_police_station}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2"
                                                            id="current_address_nearest_police_station"
                                                            name="current_address_nearest_police_station"

                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {serviceData.map((service, serviceIndex) => {
                                        if (activeTab === serviceIndex + 2) {
                                            return (
                                                <div key={serviceIndex} className="md:p-6">
                                                    <h2 className="text-2xl font-bold mb-6">{service.heading}</h2>
                                                    {service.db_table == "gap_validation" && <><label for="highest_education" className='font-bold uppercase'>Your Highest Education:</label>
                                                        <select id="highest_education_gap" name="highest_education_gap"
                                                            value={annexureData["gap_validation"].highest_education_gap || ''}
                                                            disabled
                                                            className="mt-1 mb-3 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="">Select Your Highest Education</option>
                                                            <option value="phd">PHD</option>
                                                            <option value="post_graduation">Post Graduation</option>
                                                            <option value="graduation">Graduation</option>
                                                            <option value="senior_secondary">Senior Secondary Education</option>
                                                            <option value="secondary">Secondary Education</option>
                                                        </select>
                                                        {
                                                            annexureData["gap_validation"].highest_education_gap === 'phd' && (
                                                                <>
                                                                    <h3 className="text-lg font-bold py-3">PHD</h3>
                                                                    <div className='border border-black p-4 rounded-md'>
                                                                        <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                            <div>
                                                                                <label>Institute Name</label>
                                                                                <input
                                                                                    disabled
                                                                                    type="text"
                                                                                    value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_institute_name_gap`] || ''}
                                                                                    name="phd_institute_name_gap"
                                                                                    className="p-2 border w-full border-gray-300 rounded-md"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label>School Name</label>
                                                                                <input
                                                                                    disabled
                                                                                    type="text"
                                                                                    value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_school_name_gap`] || ''}
                                                                                    name="phd_school_name_gap"
                                                                                    className="p-2 border w-full border-gray-300 rounded-md"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label>Start Date</label>
                                                                                <input
                                                                                    type="date"
                                                                                    disabled
                                                                                    value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_start_date_gap`] || ''}
                                                                                    name="phd_start_date_gap"
                                                                                    className="p-2 border w-full border-gray-300 rounded-md"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label>End Date</label>
                                                                                <input
                                                                                    type="date"
                                                                                    disabled
                                                                                    value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_end_date_gap`] || ''}
                                                                                    name="phd_end_date_gap"
                                                                                    className="p-2 border w-full border-gray-300 rounded-md"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-2 mb-3">
                                                                            <label htmlFor="phd_specialization_gap" className="block text-sm font-medium text-gray-700">Specialization</label>
                                                                            <input
                                                                                type="text"
                                                                                disabled
                                                                                id="phd_specialization_gap"
                                                                                value={annexureData?.gap_validation?.education_fields?.phd_1?.[`phd_specialization_gap`] || ''}
                                                                                name="phd_specialization_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                        {renderGapMessage(gaps.gapPostGradToPhd)}
                                                                    </div>
                                                                    {
                                                                        (() => {
                                                                            let index = 1;
                                                                            let elements = [];

                                                                            while (true) {
                                                                                const key = `phd_corespondence_${index}`;

                                                                                // Check if the key exists in education_fields
                                                                                if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                                                                    break; // Exit loop if the key is missing
                                                                                }

                                                                                const phdSection = annexureData.gap_validation.education_fields[key];

                                                                                elements.push(
                                                                                    <div key={index} className='border border-black p-4 mt-4 rounded-md'>
                                                                                        <h3 className="text-lg font-bold py-3">Correspondence PHD {index}</h3>
                                                                                        <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                            <div>
                                                                                                <label>Institute Name</label>
                                                                                                <input
                                                                                                    type="text"
                                                                                                    disabled
                                                                                                    value={phdSection?.phd_institute_name_gap || ''}

                                                                                                    name="phd_institute_name_gap"
                                                                                                    className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label>School Name</label>
                                                                                                <input
                                                                                                    type="text"
                                                                                                    disabled
                                                                                                    value={phdSection?.phd_school_name_gap || ''}

                                                                                                    name="phd_school_name_gap"
                                                                                                    className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label>Start Date</label>
                                                                                                <input
                                                                                                    type="date"
                                                                                                    value={phdSection?.phd_start_date_gap || ''}
                                                                                                    disabled
                                                                                                    name="phd_start_date_gap"
                                                                                                    className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label>End Date</label>
                                                                                                <input
                                                                                                    type="date"
                                                                                                    value={phdSection?.phd_end_date_gap || ''}
                                                                                                    disabled
                                                                                                    name="phd_end_date_gap"
                                                                                                    className="p-2 border w-full border-gray-300 rounded-md"
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="mt-2 mb-3">
                                                                                            <label htmlFor="phd_specialization_gap" className="block text-sm font-medium text-gray-700">Specialization</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                disabled
                                                                                                id="phd_specialization_gap"
                                                                                                value={phdSection?.phd_specialization_gap || ''}

                                                                                                name="phd_specialization_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                );

                                                                                index++; // Move to the next phd_corespondence_*
                                                                            }

                                                                            return elements;
                                                                        })()
                                                                    }


                                                                </>
                                                            )
                                                        }


                                                        {(annexureData["gap_validation"].highest_education_gap === 'post_graduation' || annexureData["gap_validation"].highest_education_gap === 'phd') && (
                                                            <>

                                                                <h3 className="text-lg font-bold py-3">POST GRADUATION</h3>
                                                                <div className="border border-black p-4 rounded-md">
                                                                    <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                        <div>
                                                                            <label>University / Institute Name</label>
                                                                            <input
                                                                                type="text"
                                                                                disabled
                                                                                value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_university_institute_name_gap`] || ''}
                                                                                name="post_graduation_university_institute_name_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label>Course</label>
                                                                            <input
                                                                                type="text"
                                                                                disabled
                                                                                value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_course_gap`] || ''}
                                                                                name="post_graduation_course_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label>Specialization Major</label>
                                                                            <input
                                                                                type="text"
                                                                                disabled
                                                                                value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_specialization_major_gap`] || ''}

                                                                                name="post_graduation_specialization_major_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label>Start Date</label>
                                                                            <input
                                                                                type="date"
                                                                                value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_start_date_gap`] || ''}
                                                                                disabled
                                                                                name="post_graduation_start_date_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>

                                                                    </div>
                                                                    <div>
                                                                        <label>End Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData?.gap_validation?.education_fields?.post_graduation_1?.[`post_graduation_end_date_gap`] || ''}
                                                                            name="post_graduation_end_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    {renderGapMessage(gaps.gapGradToPostGrad)}
                                                                </div>

                                                                {
                                                                    (() => {
                                                                        let index = 1;
                                                                        let elements = [];

                                                                        while (true) {
                                                                            const key = `post_graduation_corespondence_${index}`;

                                                                            // Check if the key exists in education_fields
                                                                            if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                                                                break; // Exit loop if the key is missing
                                                                            }

                                                                            const phdSection = annexureData.gap_validation.education_fields[key];

                                                                            elements.push(
                                                                                <div className="border border-black  mt-4 p-4 rounded-md">
                                                                                    <h3 className="text-lg font-bold py-3 ">Correspondence POST GRADUATION {index}</h3>
                                                                                    <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                                        <div>
                                                                                            <label>University / Institute Name</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                disabled
                                                                                                value={phdSection?.post_graduation_university_institute_name_gap || ''}

                                                                                                name="post_graduation_university_institute_name_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label>Course</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                disabled
                                                                                                value={phdSection?.post_graduation_course_gap || ''}

                                                                                                name="post_graduation_course_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label>Specialization Major</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                disabled
                                                                                                value={phdSection?.post_graduation_specialization_major_gap || ''}

                                                                                                name="post_graduation_specialization_major_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>

                                                                                        <div>
                                                                                            <label>Start Date</label>
                                                                                            <input
                                                                                                type="date"
                                                                                                value={phdSection?.post_graduation_start_date_gap || ''}

                                                                                                disabled
                                                                                                name="post_graduation_start_date_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>

                                                                                    </div>
                                                                                    <div>
                                                                                        <label>End Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={phdSection?.post_graduation_end_date_gap || ''}
                                                                                            disabled
                                                                                            name="post_graduation_end_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            );

                                                                            index++; // Move to the next phd_corespondence_*
                                                                        }

                                                                        return elements;
                                                                    })()
                                                                }


                                                            </>
                                                        )}



                                                        {(annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'post_graduation' || annexureData["gap_validation"].highest_education_gap === 'phd') && (
                                                            <>
                                                                <h3 className="text-lg font-bold py-3">GRADUATION</h3>
                                                                <div className="border border-black p-4 rounded-md">
                                                                    <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                        <div>
                                                                            <label>University / Institute Name</label>
                                                                            <input
                                                                                type="text"
                                                                                disabled
                                                                                value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_university_institute_name_gap`] || ''}
                                                                                name="graduation_university_institute_name_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label>Course</label>
                                                                            <input
                                                                                type="text"
                                                                                disabled
                                                                                value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_course_gap`] || ''}
                                                                                name="graduation_course_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label>Specialization Major</label>
                                                                            <input
                                                                                type="text"
                                                                                disabled
                                                                                value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_specialization_major_gap`] || ''}

                                                                                name="graduation_specialization_major_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label>Start Date</label>
                                                                            <input
                                                                                disabled
                                                                                type="date"
                                                                                value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_start_date_gap`] || ''}
                                                                                name="graduation_start_date_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>

                                                                    </div>
                                                                    <div>
                                                                        <label>End Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            value={annexureData?.gap_validation?.education_fields?.graduation_1?.[`graduation_end_date_gap`] || ''}
                                                                            name="graduation_end_date_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    {renderGapMessage(gaps.gapSrSecToGrad)}
                                                                </div>

                                                                {
                                                                    (() => {
                                                                        let index = 1;
                                                                        let elements = [];

                                                                        while (true) {
                                                                            const key = `graduation_corespondence_${index}`;

                                                                            // Check if the key exists in education_fields
                                                                            if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                                                                break; // Exit loop if the key is missing
                                                                            }

                                                                            const phdSection = annexureData.gap_validation.education_fields[key];

                                                                            elements.push(
                                                                                <div className="border border-black p-4 mt-4 rounded-md">
                                                                                    <h3 className="text-lg font-bold py-3">Correspondence GRADUATION {index}</h3>
                                                                                    <div className="md:grid grid-cols-2 gap-3 my-4 ">
                                                                                        <div>
                                                                                            <label>University / Institute Name</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                disabled
                                                                                                value={phdSection?.graduation_university_institute_name_gap || ''}

                                                                                                name="graduation_university_institute_name_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label>Course</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                disabled
                                                                                                value={phdSection?.graduation_course_gap || ''}

                                                                                                name="graduation_course_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label>Specialization Major</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                disabled
                                                                                                value={phdSection?.graduation_specialization_major_gap || ''}

                                                                                                name="graduation_specialization_major_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>

                                                                                        <div>
                                                                                            <label>Start Date</label>
                                                                                            <input
                                                                                                type="date"
                                                                                                value={phdSection?.graduation_start_date_gap || ''}

                                                                                                disabled
                                                                                                name="graduation_start_date_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>

                                                                                    </div>
                                                                                    <div>
                                                                                        <label>End Date</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={phdSection?.graduation_end_date_gap || ''}
                                                                                            disabled
                                                                                            name="graduation_end_date_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            );

                                                                            index++; // Move to the next phd_corespondence_*
                                                                        }

                                                                        return elements;
                                                                    })()
                                                                }


                                                            </>
                                                        )}



                                                        {(annexureData["gap_validation"].highest_education_gap === 'senior_secondary' || annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'phd' || annexureData["gap_validation"].highest_education_gap === 'post_graduation') && (
                                                            <>
                                                                <h3 className="text-lg font-bold py-3">SENIOR SECONDARY</h3>
                                                                <div className="border border-black  p-4 rounded-md">
                                                                    <div className="my-3">
                                                                        <label>School Name</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData?.gap_validation?.education_fields?.senior_secondary?.[`senior_secondary_school_name_gap`] || ''}
                                                                            name="senior_secondary_school_name_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                        <div>
                                                                            <label>Start Date</label>
                                                                            <input
                                                                                type="date"
                                                                                disabled
                                                                                value={annexureData?.gap_validation?.education_fields?.senior_secondary?.[`senior_secondary_start_date_gap`] || ''}
                                                                                name="senior_secondary_start_date_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label>End Date</label>
                                                                            <input
                                                                                type="date"
                                                                                disabled
                                                                                value={annexureData?.gap_validation?.education_fields?.senior_secondary?.[`senior_secondary_end_date_gap`] || ''}
                                                                                name="senior_secondary_end_date_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>

                                                                        {renderGapMessage(gaps.gapSecToSrSec)}
                                                                    </div>
                                                                </div>
                                                                {
                                                                    (() => {
                                                                        let index = 1;
                                                                        let elements = [];

                                                                        while (true) {
                                                                            const key = `senior_secondary_corespondence_${index}`;

                                                                            // Check if the key exists in education_fields
                                                                            if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                                                                break; // Exit loop if the key is missing
                                                                            }

                                                                            const phdSection = annexureData.gap_validation.education_fields[key];

                                                                            elements.push(
                                                                                <div className="border border-black mt-4 p-4 rounded-md">
                                                                                    <h3 className="text-lg font-bold py-3">Correspondence SENIOR SECONDARY {index}</h3>

                                                                                    <div className="my-3">
                                                                                        <label>School Name</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            disabled
                                                                                            value={phdSection?.senior_secondary_school_name_gap || ''}

                                                                                            name="senior_secondary_school_name_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                        <div>
                                                                                            <label>Start Date</label>
                                                                                            <input
                                                                                                type="date"
                                                                                                value={phdSection?.senior_secondary_end_date_gap || ''}
                                                                                                disabled
                                                                                                name="senior_secondary_end_date_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label>End Date</label>
                                                                                            <input
                                                                                                type="date"
                                                                                                value={phdSection?.senior_secondary_end_date_gap || ''}
                                                                                                disabled
                                                                                                name="senior_secondary_end_date_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );

                                                                            index++; // Move to the next phd_corespondence_*
                                                                        }

                                                                        return elements;
                                                                    })()
                                                                }


                                                            </>
                                                        )}



                                                        {(annexureData["gap_validation"].highest_education_gap === 'secondary' || annexureData["gap_validation"].highest_education_gap === 'senior_secondary' || annexureData["gap_validation"].highest_education_gap === 'graduation' || annexureData["gap_validation"].highest_education_gap === 'phd' || annexureData["gap_validation"].highest_education_gap === 'post_graduation') && (
                                                            <>
                                                                <h3 className="text-lg font-bold py-3">SECONDARY</h3>
                                                                <div className=" border border-black p-4 rounded-md">
                                                                    <div className="my-3">
                                                                        <label>School Name</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled
                                                                            value={annexureData?.gap_validation?.education_fields?.secondary?.[`secondary_school_name_gap`] || ''}
                                                                            name="secondary_school_name_gap"
                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                    <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                        <div>
                                                                            <label>Start Date</label>
                                                                            <input
                                                                                type="date"
                                                                                disabled
                                                                                value={annexureData?.gap_validation?.education_fields?.secondary?.[`secondary_start_date_gap`] || ''}
                                                                                name="secondary_start_date_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label>End Date</label>
                                                                            <input
                                                                                disabled
                                                                                type="date"
                                                                                value={annexureData?.gap_validation?.education_fields?.secondary?.[`secondary_end_date_gap`] || ''}
                                                                                name="secondary_end_date_gap"
                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {
                                                                    (() => {
                                                                        let index = 1;
                                                                        let elements = [];

                                                                        while (true) {
                                                                            const key = `secondary_corespondence_${index}`;

                                                                            // Check if the key exists in education_fields
                                                                            if (!annexureData?.gap_validation?.education_fields?.[key]) {
                                                                                break; // Exit loop if the key is missing
                                                                            }

                                                                            const phdSection = annexureData.gap_validation.education_fields[key];

                                                                            elements.push(
                                                                                <div className="border border-black p-4 mt-4 rounded-md">
                                                                                    <h3 className="text-lg font-bold py-3">Correspondence SECONDARY {index}</h3>

                                                                                    <div className="my-3">
                                                                                        <label>School Name</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            disabled
                                                                                            value={phdSection?.secondary_school_name_gap || ''}

                                                                                            name="secondary_school_name_gap"
                                                                                            className="p-2 border w-full border-gray-300 rounded-md"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="md:grid grid-cols-2 gap-3 my-4">
                                                                                        <div>
                                                                                            <label>Start Date</label>
                                                                                            <input
                                                                                                type="date"
                                                                                                value={phdSection?.secondary_start_date_gap || ''}
                                                                                                disabled
                                                                                                name="secondary_start_date_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label>End Date</label>
                                                                                            <input
                                                                                                type="date"
                                                                                                disabled
                                                                                                value={phdSection?.secondary_end_date_gap || ''}

                                                                                                name="secondary_end_date_gap"
                                                                                                className="p-2 border w-full border-gray-300 rounded-md"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );

                                                                            index++; // Move to the next phd_corespondence_*
                                                                        }

                                                                        return elements;
                                                                    })()
                                                                }


                                                            </>
                                                        )}


                                                        <div className='flex gap-3 items-center my-2'>
                                                            <input
                                                                type="checkbox"
                                                                name="i_am_fresher"
                                                                id="i_am_fresher"
                                                                checked={
                                                                    annexureData["gap_validation"].i_am_fresher === true ||
                                                                    annexureData["gap_validation"].i_am_fresher === "1" ||
                                                                    annexureData["gap_validation"].i_am_fresher === 1
                                                                }
                                                                disabled
                                                                className="border rounded-md p-2 capitalize"
                                                            />
                                                            <label htmlFor="i_am_fresher" className='font-bold capitalize text-lg'>I am Fresher</label>
                                                        </div>

                                                        {/* Conditional Rendering Fix */}
                                                        {!(annexureData["gap_validation"].i_am_fresher === true ||
                                                            annexureData["gap_validation"].i_am_fresher === "1" ||
                                                            annexureData["gap_validation"].i_am_fresher === 1) && (

                                                                <div className='mt-5'>
                                                                    <label htmlFor="employmentType_gap" className='font-bold'>EMPLOYMENT</label>
                                                                    <div className='mb-3'>
                                                                        <label htmlFor="years_of_experience_gap">Year's of Experience</label>
                                                                        <input
                                                                            type="number"
                                                                            disabled
                                                                            id="years_of_experience_gap"
                                                                            name="years_of_experience_gap"
                                                                            value={annexureData["gap_validation"].years_of_experience_gap || ''}
                                                                            className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label htmlFor="no_of_employment">No of Employment</label>
                                                                        <input
                                                                            type="number"
                                                                            disabled
                                                                            id="no_of_employment"
                                                                            name="no_of_employment"
                                                                            value={annexureData["gap_validation"].no_of_employment || ''}
                                                                            className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Dynamically render Employment Forms based on no_of_employment */}
                                                        {Array.from({ length: annexureData["gap_validation"].no_of_employment || 0 }, (_, index) => (
                                                            <div key={index} className='border border-black p-4 rounded-md my-3'>
                                                                <h3 className="text-lg font-bold pb-3">Employment({index + 1})</h3>
                                                                <div>
                                                                    <label htmlFor={`employment_type_gap`}>Employment Type</label>
                                                                    <select
                                                                        type="text"
                                                                        disabled
                                                                        id={`employment_type_gap`}
                                                                        name={`employment_type_gap`}
                                                                        value={annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_type_gap`] || ''}
                                                                        className="form-control border rounded w-full bg-white p-2 mt-2 mb-2"
                                                                    >
                                                                        <option value="">Select Your Employment Type</option>
                                                                        <option value="employed">Employed</option>
                                                                        <option value="self-employed">Self Employed</option>
                                                                        <option value="freelancer">Freelancer</option>
                                                                        <option value="family-business">Family Business</option>
                                                                    </select>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {/* Start Date Field */}
                                                                    <div>
                                                                        <label htmlFor={`employment_start_date_gap`}>Start Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            id={`employment_start_date_gap`}
                                                                            name={`employment_start_date_gap`}
                                                                            value={annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_start_date_gap`] || ''}
                                                                            className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                        />
                                                                    </div>


                                                                    {/* End Date Field */}
                                                                    <div>
                                                                        <label htmlFor={`employment_end_date_gap`}>End Date</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled
                                                                            id={`employment_end_date_gap`}
                                                                            name={`employment_end_date_gap`}
                                                                            value={annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_end_date_gap`] || ''}
                                                                            className="form-control border rounded w-full bg-white p-2 mt-2"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {employGaps.map((item, idx) => {
                                                                    const isNoGap = item.difference.toLowerCase().includes("no") && item.difference.toLowerCase().includes("gap");

                                                                    if (item.startValue === annexureData["gap_validation"]?.employment_fields?.[`employment_${index + 1}`]?.[`employment_start_date_gap`]) {
                                                                        return (
                                                                            <p key={idx} className={`${isNoGap ? 'text-[#3e76a5]' : 'text-red-500'} py-2`}>
                                                                                {isNoGap ? item.difference : `GAP-${item.difference || 'No gap Found'}`}
                                                                            </p>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })}
                                                            </div>
                                                        ))}

                                                    </>
                                                    }

                                                    {service.db_table !== "gap_validation" && (
                                                        <>
                                                            <div className="md:space-y-6" id="servicesForm" key={serviceIndex}>
                                                                {service.rows.map((row, rowIndex) => {
                                                                    if (hiddenRows[`${serviceIndex}-${rowIndex}`]) {
                                                                        return null;
                                                                    }

                                                                    return (
                                                                        <div key={rowIndex} className={`${row.class || 'grid'}`}>
                                                                            {/* Render row heading if it exists */}
                                                                            {row.heading && <h3 className="text-lg font-bold mb-4">{row.heading}</h3>}



                                                                            {/* Render row description if it exists */}
                                                                            {row.description && (
                                                                                <p className="text-sm text-gray-600">{row.description}</p>
                                                                            )}

                                                                            <div className="space-y-4">
                                                                                <div className={`md:grid grid-cols-${row.inputs.length === 1 ? '1' : row.inputs.length === 2 ? '2' : row.inputs.length === 4 ? '2' : row.inputs.length === 5 ? '3' : '3'} gap-3`}>

                                                                                    {row.inputs.map((input, inputIndex) => {

                                                                                        const isCheckbox = input.type === 'checkbox';
                                                                                        const isDoneCheckbox = isCheckbox && (input.name.startsWith('done_or_not') || input.name.startsWith('has_not_done'));
                                                                                        const isChecked = ["1", 1, true, "true"].includes(annexureData[service.db_table]?.[input.name] ?? false);

                                                                                        // Handle logic for checkbox checked state
                                                                                        if (isDoneCheckbox && isChecked) {
                                                                                            // Hide all rows except the one with the checked checkbox
                                                                                            service.rows.forEach((otherRow, otherRowIndex) => {
                                                                                                if (otherRowIndex !== rowIndex) {
                                                                                                    hiddenRows[`${serviceIndex}-${otherRowIndex}`] = true; // Hide other rows
                                                                                                }
                                                                                            });
                                                                                            hiddenRows[`${serviceIndex}-${rowIndex}`] = false; // Ensure current row stays visible
                                                                                        }

                                                                                        return (
                                                                                            <div key={inputIndex} className={row.inputs.length === 5 && (inputIndex === 3 || inputIndex === 4) ? 'col-span-3' : ''}>
                                                                                                <label className="text-sm block font-medium mb-0 text-gray-700 capitalize">
                                                                                                    {input.label.replace(/[\/\\]/g, '')}
                                                                                                    {input.required && <span className="text-red-500">*</span>}
                                                                                                </label>

                                                                                                {/* Render input types dynamically */}
                                                                                                {input.type === 'input' && (
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        disabled
                                                                                                        name={input.name}
                                                                                                        value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                    />
                                                                                                )}
                                                                                                {input.type === 'textarea' && (
                                                                                                    <textarea
                                                                                                        name={input.name}
                                                                                                        rows={1}
                                                                                                        disabled
                                                                                                        value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                    />
                                                                                                )}
                                                                                                {input.type === 'datepicker' && (
                                                                                                    <input
                                                                                                        type="date"
                                                                                                        disabled
                                                                                                        name={input.name}
                                                                                                        value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                    />
                                                                                                )}
                                                                                                {input.type === 'number' && (
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        disabled
                                                                                                        name={input.name}
                                                                                                        value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                    />
                                                                                                )}
                                                                                                {input.type === 'email' && (
                                                                                                    <input
                                                                                                        type="email"
                                                                                                        disabled
                                                                                                        name={input.name}
                                                                                                        value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                    />
                                                                                                )}
                                                                                                {input.type === 'select' && (
                                                                                                    <select
                                                                                                        name={input.name}
                                                                                                        disabled
                                                                                                        value={annexureData[service.db_table]?.[input.name] || ''}
                                                                                                        className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                    >
                                                                                                        <option value="">Select</option>
                                                                                                        {Object.entries(input.options).map(([key, option], optionIndex) => (
                                                                                                            <option key={optionIndex} value={key}>
                                                                                                                {option}
                                                                                                            </option>
                                                                                                        ))}
                                                                                                    </select>
                                                                                                )}

                                                                                                {input.type === 'file' && (
                                                                                                    <>
                                                                                                        <input
                                                                                                            type="file"
                                                                                                            disabled
                                                                                                            name={input.name}
                                                                                                            accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                                                                                                            className="mt-1 p-2 border w-full border-gray-300 rounded-md focus:outline-none"
                                                                                                        />
                                                                                                        {annexureData[service.db_table] && annexureData[service.db_table][input.name] ? (
                                                                                                            <div className="border p-3 rounded-md mt-4">
                                                                                                                <Swiper
                                                                                                                    spaceBetween={10} // Space between slides
                                                                                                                    slidesPerView={5} // Default is 5 images per view for larger screens
                                                                                                                    loop={true} // Loop through images
                                                                                                                    autoplay={{
                                                                                                                        delay: 1000,
                                                                                                                        disableOnInteraction: false, // Keeps autoplay active on interaction
                                                                                                                    }}
                                                                                                                    pagination={{
                                                                                                                        clickable: true,
                                                                                                                    }}
                                                                                                                    navigation={{ // Enable next/prev buttons
                                                                                                                        nextEl: '.swiper-button-next',
                                                                                                                        prevEl: '.swiper-button-prev',
                                                                                                                    }}
                                                                                                                    breakpoints={{
                                                                                                                        // When the screen width is 640px or smaller (mobile devices)
                                                                                                                        640: {
                                                                                                                            slidesPerView: 1, // Show 1 image per slide on mobile
                                                                                                                        },
                                                                                                                        // When the screen width is 768px or larger (tablet and desktop)
                                                                                                                        768: {
                                                                                                                            slidesPerView: 3, // Show 3 images per slide on tablets (optional)
                                                                                                                        },
                                                                                                                        1024: {
                                                                                                                            slidesPerView: 4, // Show 3 images per slide on tablets (optional)
                                                                                                                        },
                                                                                                                    }}
                                                                                                                >
                                                                                                                    {annexureData[service.db_table][input.name].split(',').map((item, index) => {
                                                                                                                        const isImage = item && (item.endsWith('.jpg') || item.endsWith('.jpeg') || item.endsWith('.png'));

                                                                                                                        return (
                                                                                                                            <SwiperSlide key={index}>
                                                                                                                                <div className="swiper-slide-container">
                                                                                                                                    {isImage ? (
                                                                                                                                        <img
                                                                                                                                            src={item}
                                                                                                                                            alt={`Image ${index}`}
                                                                                                                                            className='md:h-[100px]'
                                                                                                                                        />
                                                                                                                                    ) : (
                                                                                                                                        <button onClick={() => window.open(item, '_blank')} type='button'>Open Link</button>
                                                                                                                                    )}
                                                                                                                                </div>
                                                                                                                            </SwiperSlide>
                                                                                                                        );
                                                                                                                    })}
                                                                                                                </Swiper>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <p><></></p>
                                                                                                        )}

                                                                                                    </>
                                                                                                )}

                                                                                                {input.type === 'checkbox' && (
                                                                                                    <div className="flex items-center space-x-3">
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            disabled
                                                                                                            name={input.name}
                                                                                                            checked={
                                                                                                                ["1", 1, true, "true"].includes(annexureData[service.db_table]?.[input.name] ?? false)
                                                                                                            } // Check if the value is 1, indicating it is checked
                                                                                                            value={annexureData[service.db_table]?.[input.name] || ''}  // Set the value to an empty string if no value is found
                                                                                                            className="h-5 w-5 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"

                                                                                                        />
                                                                                                        <span className="text-sm text-gray-700">{input.label}</span>
                                                                                                    </div>
                                                                                                )}


                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>

                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    )}

                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                    {activeTab === conditionHtml.service_index + 2 && Object.keys(conditionHtml).map((attr, index) => {
                                        const content = conditionHtml[attr];
                                        return content ? (  // Check if content is not empty or null
                                            <div key={index}>
                                                <div dangerouslySetInnerHTML={{ __html: content }} />
                                            </div>
                                        ) : null; // If content is empty or null, return null (i.e., don't render anything)
                                    })}



                                    {/* Step 3 logic */}
                                    {activeTab === serviceData.length + 2 && (
                                        <div>
                                            <div className='mb-6  p-4 rounded-md border  bg-white mt-8' >
                                                <h4 className="md:text-start text-start md:text-xl text-sm my-6 font-bold" > Declaration and Authorization </h4>
                                                < div className="mb-6" >
                                                    <p className='text-sm' >
                                                        I hereby authorize GoldQuest Global HR Services Private Limited and its representative to verify information provided in my application for employment and this employee background verification form, and to conduct enquiries as may be necessary, at the company’s discretion.I authorize all persons who may have information relevant to this enquiry to disclose it to GoldQuest Global HR Services Pvt Ltd or its representative.I release all persons from liability on account of such disclosure.
                                                        I confirm that the above information is correct to the best of my knowledge.I agree that in the event of my obtaining employment, my probationary appointment, confirmation as well as continued employment in the services of the company are subject to clearance of medical test and background verification check done by the company.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-6" >


                                                    < div className="form-group" >
                                                        <label className='text-sm'>Name</label>
                                                        < input
                                                            value={cefData.name_declaration}
                                                            type="text"
                                                            className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                            name="name_declaration"
                                                            disabled
                                                        />
                                                    </div>


                                                    < div className="form-group" >
                                                        <label className='text-sm' > Date < span className='text-red-500' >* </span></label >
                                                        <input
                                                            disabled
                                                            value={cefData.declaration_date}
                                                            type="date"
                                                            className="form-control border rounded w-full p-2 mt-2 bg-white mb-0"
                                                            name="declaration_date"
                                                        />

                                                    </div>
                                                </div>
                                                <div className="form-group" >
                                                    <label className='text-sm'> Attach signature: <span className="text-red-500 text-lg" >* </span></label >
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx" // Restrict to specific file types
                                                        className="form-control border rounded w-full p-1 mt-2 bg-white mb-0"
                                                        name="signature"
                                                        id="signature"
                                                        disabled
                                                    />

                                                    {
                                                        cefData.signature && (
                                                            isImage(cefData.signature) ? (
                                                                // If it's an image, display it
                                                                <div className=' border rounded-md p-2 mt-3'>
                                                                    <img
                                                                        src={cefData.signature || "NO IMAGE FOUND"}
                                                                        alt="Signature"
                                                                        className=' object-contain p-3'
                                                                    />
                                                                </div>
                                                            ) : (
                                                                // If it's not an image, show a clickable link (view document)
                                                                <div className='mt-3'>
                                                                    <a
                                                                        href={cefData.signature}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-500 "
                                                                    >
                                                                        View Signature Document
                                                                    </a>
                                                                </div>
                                                            )
                                                        )
                                                    }


                                                </div>
                                            </div>

                                            <div className='p-1 bg-white  rounded-md border md:p-4'>
                                                < h5 className="md:text-start text-start text-lg my-6 font-bold "> Documents(Mandatory) </h5>
                                                < div className="grid grid-cols-1  md:grid-cols-3 gap-4 pt-4">
                                                    <div className="p-4 border rounded-md" >
                                                        <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                                            <FaGraduationCap className="mr-3" />
                                                            Education
                                                        </h6>
                                                        < p className='text-sm' > Photocopy of degree certificate and final mark sheet of all examinations.</p>
                                                    </div>

                                                    < div className="p-4 border rounded-md" >
                                                        <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                                            <FaBriefcase className="mr-3" />
                                                            Employment
                                                        </h6>
                                                        < p className='text-sm' > Photocopy of relieving / experience letter for each employer mentioned in the form.</p>
                                                    </div>

                                                    < div className="p-4 border rounded-md" >
                                                        <h6 className="flex items-center md:text-lg text-sm font-bold mb-2" >
                                                            <FaIdCard className="mr-3" />
                                                            Government ID / Address Proof
                                                        </h6>
                                                        < p className='text-sm' > Aadhaar Card / Bank Passbook / Passport Copy / Driving License / Voter ID.</p>
                                                    </div>
                                                </div>


                                                < p className='md:text-start text-start text-sm mt-4' >
                                                    NOTE: If you experience any issues or difficulties with submitting the form, please take screenshots of all pages, including attachments and error messages, and email them to < a href="mailto:onboarding@goldquestglobal.in" > onboarding@goldquestglobal.in</a> . Additionally, you can reach out to us at <a href="mailto:onboarding@goldquestglobal.in">onboarding@goldquestglobal.in</a > .
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>


                                <div className="flex space-x-4 mt-6">
                                    {activeTab > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleBack} // Call the handleBack function when the button is clicked
                                            className="px-6 py-2 text-gray-500 bg-gray-200 rounded-md hover:bg-gray-300"
                                        >
                                            Go Back
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleNext} // Call the handleNext function when the button is clicked
                                        disabled={activeTab === serviceData.length + 2} // Disable the button if on the last tab (e.g., tab 2)
                                        className="bg-[#3e76a5] text-white p-3 rounded-md"
                                    >
                                        Next
                                    </button>

                                    <button className='bg-[#3e76a5] text-white p-3 rounded-md' type='button' onClick={generatePdf}>Download PDF</button>

                                </div>





                            </div>



                        </form>

                    </>


            }


        </>
    );
};

export default CandidateBGV;
