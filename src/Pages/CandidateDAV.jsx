import React, { useState, useRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import PulseLoader from 'react-spinners/PulseLoader';
import { useApiCall } from '../ApiCallContext';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
// import sharp from 'sharp'; // Only works in Node.js (not in-browser)
import axios from 'axios';

import logoImg from '../../public/Logo.png'
const CandidiateDav = () => {
    const { isApiLoading, setIsApiLoading, checkAuthentication } = useApiCall();
    const [distance, setDistance] = useState(null);
    const mapRef = useRef(null);
    const [davData, setDAVData] = useState([]);

    const urlParams = new URLSearchParams(window.location.search);

    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Step 2: Get values from localStorage




    const FileViewer = ({ fileUrl }) => {
        if (!fileUrl) {
            return <p>No file provided</p>; // Handle undefined fileUrl
        }

        const getFileExtension = (url) => url.split('.').pop().toLowerCase();

        const renderIframe = (url) => (
            <iframe
                src={`https://docs.google.com/gview?url=${url}&embedded=true`}
                width="100%"
                height="100%"
                title="File Viewer"
            />
        );

        const fileExtension = getFileExtension(fileUrl);

        // Determine the type of file and render accordingly
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(fileExtension)) {
            return <img src={fileUrl} alt="Image File" style={{}} />;
        }

        if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
            return renderIframe(fileUrl);
        }

        return <p>Unsupported file type</p>;
    };
    const isApplicationExists = useCallback(() => {
        setIsApiLoading(true);
        setLoading(true);  // Set loading to true before making the fetch request.

        const applicationId = urlParams.get('applicationId');
        const branchId = urlParams.get('branch_id');
        const token = localStorage.getItem('_token');
        const adminData = JSON.parse(localStorage.getItem('admin'));
        const admin_id = adminData?.id;

        // Validate necessary parameters before proceeding
        if (!applicationId || !branchId || !token || !admin_id) {
            setIsApiLoading(false);
            setLoading(false);
            Swal.fire({
                title: 'Error',
                text: 'Missing required parameters.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return;
        }

        fetch(`https://api.goldquestglobal.in/candidate-master-tracker/dav-application-by-id?application_id=${applicationId}&branch_id=${branchId}&admin_id=${admin_id}&_token=${token}`)
            .then(res => res.json())
            .then(result => {
                const newToken = result.token || result._token || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Save the new token in localStorage
                }
                setLoading(false);  // Stop loading spinner when the request is complete.

                if (!result.status) {

                    Swal.fire({
                        title: 'Error',
                        text: result.message,
                        icon: 'error',
                        confirmButtonText: 'OK',
                    });

                    // Ensure form is present before trying to remove it
                    const form = document.getElementById('bg-form');
                    if (form) {
                        form.remove();
                    }

                    // Create and show the error message div
                    const errorMessageDiv = document.createElement('div');
                    errorMessageDiv.classList.add(
                        'bg-red-100', 'text-red-800', 'border', 'border-red-400', 'p-6',
                        'rounded-lg', 'max-w-lg', 'mx-auto', 'shadow-lg', 'absolute',
                        'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2'
                    );

                    errorMessageDiv.innerHTML = `
                        <h1 class="font-semibold text-2xl">Error</h1>
                        <p class="text-lg">${result.message}</p>
                    `;
                    document.body.appendChild(errorMessageDiv);
                } else {
                    setDAVData(result.DEFData);
                }
            })
            .catch(err => {
                setLoading(false);  // Ensure loading is false even if there's an error.
                setIsApiLoading(false);  // Stop global loading spinner in case of error.

                Swal.fire({
                    title: 'Error',
                    text: err.message || 'An error occurred while fetching application data.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                });
            })
            .finally(() => {
                setIsApiLoading(false); // Ensure global loading state is reset
            });
    }, []);

    useEffect(() => {
        const fetchMainData = async () => {
            if (!isApiLoading) {
                await checkAuthentication();
                await isApplicationExists();  // Correct function call
            }
        };

        fetchMainData();  // Call the async function inside useEffect

    }, [isApplicationExists]);  // Correct dependencies

    const getImageAsBase64FromAPI = async (imageUrl) => {
        try {
            const response = await fetch("https://api.goldquestglobal.in/test/image-to-base", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ imageUrl }), // send imageUrl in body
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (data?.base64Image) {
                return data.base64Image; // ✅ base64 string to use in doc.addImage
            } else {
                throw new Error("No base64Image returned from API.");
            }
        } catch (error) {
            console.error("Error fetching base64 image from API:", error);
            return null;
        }
    };

    const homePhotoUrls = davData?.house_name_main_door?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));

    const identityProofUrls = davData?.id_proof?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));

    const localityUrls = davData?.building_photo?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));
    const streetPhotoUrls = davData?.street_photo?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));
    const nearestLandmarkUrls = davData?.nearest_landmark?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));

    const mapScreenshot_urls = davData?.map_screenshot?.split(',')
        .map(url => url.trim())
        .map(url => url.replace(/\\/g, '/'));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDavData((prev) => ({ ...prev, [name]: value }));
    }


    const blob = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };
    const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const toRad = (angle) => (angle * Math.PI) / 180;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Number(R * c).toFixed(2); // returns string distance in km
    };
    const fixUrl = (url) => {
        return url.replace(/\\/g, '/');
    };
    const scaleImage = (img, maxWidth, maxHeight) => {
        const imgWidth = img.width;
        const imgHeight = img.height;

        let width = imgWidth;
        let height = imgHeight;

        if (imgWidth > maxWidth) {
            width = maxWidth;
            height = (imgHeight * maxWidth) / imgWidth;
        }

        if (height > maxHeight) {
            height = maxHeight;
            width = (imgWidth * maxHeight) / imgHeight;
        }

        return { width, height };
    };
    const checkImageExists = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    };
    const validateImageInBrowser = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function () {
                resolve({
                    src: url,
                    width: this.width,
                    height: this.height,
                    format: url.split('.').pop().split('?')[0] || 'unknown',
                });
            };
            img.onerror = function () {
                console.warn(`Unable to load image: ${url}`);
                resolve(null);
            };
            img.src = url;
        });
    };

    const getImageFormat = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        if (ext === 'png') return 'PNG';
        if (ext === 'jpg' || ext === 'jpeg') return 'JPEG';
        if (ext === 'webp') return 'WEBP';
        return 'PNG'; // default fallback
    };
    const fetchImageToBaseBlob = async (imageUrls) => {
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

            // Assuming the response data contains an array of images
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
        }
    };
    const toBase64FromUrl = async (url) => {
        try {
            const result = await fetchImageToBaseBlob([url]);

            // Safely get the base64 string
            const base64 = Array.isArray(result)
                ? typeof result[0] === 'string'
                    ? result[0]
                    : result[0]?.base64
                : null;

            if (!base64 || typeof base64 !== "string") {
                throw new Error("Invalid base64 returned");
            }

            return base64;
        } catch (error) {
            console.error("❌ Error converting image:", error);
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAgMBAAw6keUAAAAASUVORK5CYII=';
        }
    };



    const downloadPDF = async (event) => {
        event.preventDefault(); // Prevent any default link/form behavior
        setPdfLoading(true);

        try {
            // Simulate PDF generation logic
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const doc = new jsPDF();
            let yPosition = 10;
            const gapY = 8;
            const marginX = 15;
            const logoY = yPosition;

            const createdAt = new Date(davData.created_at);
            const formattedDate = createdAt.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            }).replace(',', '');
            const pageWidth = doc.internal.pageSize.getWidth() - 30; // 15 left + 15 right
            // --- Add Logo (smaller width, left side) ---
            const LogoimageWidth = 30;
            const LogoimageHeight = 15;
            const logoX = marginX;
            const titleX = marginX + LogoimageWidth + 10; // Space between logo and title
            const textY = logoY + LogoimageHeight / 2 + 1.5; // vertical center of the logo
            // Load and add the logo
            const imageData = await blob(logoImg);
            console.log('logoImg', logoImg)
            console.log('imageData', imageData)
            doc.addImage(imageData, 'PNG', logoX, yPosition, LogoimageWidth, LogoimageHeight);
            yPosition += 30; // Adjust Y after logo
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bolditalic');

            doc.text(
                'Digital Address Verification Form',
                doc.internal.pageSize.getWidth() - marginX,
                textY,
                { align: 'right' }
            );
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bolditalic');
            doc.text(
                formattedDate,
                doc.internal.pageSize.getWidth() - marginX,
                textY + 6,
                { align: 'right' }
            );

            const lineStartX = marginX;
            const lineEndX = doc.internal.pageSize.getWidth() - marginX;
            const lineY = textY + 10;

            doc.setDrawColor(0); // black
            doc.setLineWidth(0.3);
            doc.line(lineStartX, lineY, lineEndX, lineY);

            yPosition = lineY + gapY - 2;
            console.log('davData', davData)
            const fullAddress = [
                davData.house_flat_no,
                davData.street_adress,
                davData.locality_name,
                davData.landmark,
                davData.city,
                davData.state,
                davData.country
            ].filter(Boolean).join(', ');

            const distanceKm = calculateDistanceInKm(
                davData.latitude, davData.longitude,
                davData.address_latitude, davData.address_longitude,
            );

            // console.log(`Distance: ${distanceKm} km`);

            if (typeof doc.autoTable !== 'function') {
                throw new Error('jspdf-autotable plugin is not loaded.');
            }

            // Section: Candidate Residential Address Detail
            doc.autoTable({
                startY: yPosition,
                head: [[{
                    content: 'Candidate Residential Address Detail',
                    colSpan: 4,
                    styles: {
                        halign: 'left',
                        fontSize: 12,
                        fontStyle: 'bold',
                        fillColor: [197, 217, 241],
                        textColor: [80, 80, 80],
                    }
                }]],
                body: [
                    [
                        { content: "Candidate Name", styles: { fontStyle: 'bold' } },
                        { content: davData?.name || "N/A", colSpan: 3, styles: { overflow: 'linebreak' } }
                    ],
                    [
                        { content: "Address", styles: { fontStyle: 'bold' } },
                        { content: fullAddress || "N/A", colSpan: 3, styles: { overflow: 'linebreak' } }
                    ],
                    [
                        { content: "Company Name", styles: { fontStyle: 'bold' } },
                        { content: davData?.company_name || "N/A" },
                        { content: "Relation With the candidate", styles: { fontStyle: 'bold' } },
                        { content: davData?.relation_with_verifier || "N/A" }
                    ],
                    [
                        { content: "Mobile", styles: { fontStyle: 'bold' } },
                        { content: davData?.mobile_number || "N/A" },
                        { content: "Email Id", styles: { fontStyle: 'bold' } },
                        { content: `${davData?.email || "N/A"}` }
                    ],
                    [
                        { content: "Verification Date", styles: { fontStyle: 'bold' } },
                        { content: davData?.verification_date || "N/A" },
                        { content: "Employee ID:", styles: { fontStyle: 'bold' } },
                        { content: davData?.employee_id || "N/A" }
                    ],
                    [
                        { content: "Verifier Name", styles: { fontStyle: 'bold' } },
                        { content: davData?.verifier_name || "N/A" },
                        { content: "Nature of Residence", styles: { fontStyle: 'bold' } },
                        { content: davData?.nature_of_residence || "N/A" }
                    ],
                    [
                        { content: "Period of Stay", styles: { fontStyle: 'bold' } },
                        { content: `${davData?.from_date || "N/A"} - ${davData?.to_date || "N/A"}` },
                        { content: "Pincode", styles: { fontStyle: 'bold' } },
                        { content: davData?.pin_code || "N/A" }
                    ]
                ],
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    cellPadding: 2,
                    fontSize: 10,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0],
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 45 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 45 },
                    3: { cellWidth: 45 }
                }
            });


            yPosition = doc.autoTable.previous.finalY + gapY;
            doc.autoTable({
                startY: yPosition,
                head: [[{
                    content: 'Address shown on the map',
                    colSpan: 5,
                    styles: {
                        halign: 'left',
                        fontSize: 12,
                        fontStyle: 'bold',
                        fillColor: [197, 217, 241],
                        textColor: [80, 80, 80],
                    }
                }]],
                body: [
                    [
                        { content: "Address", styles: { fontStyle: 'bold' } },
                        { content: 'Source' || "N/A", styles: { fontStyle: 'bold' } },
                        { content: 'Distance' || "N/A", styles: { fontStyle: 'bold' } },
                        { content: 'Location API', styles: { fontStyle: 'bold', whiteSpace: 'nowrap' } },
                        { content: 'Legend' || "N/A", styles: { fontStyle: 'bold' } },
                    ],
                    [
                        { content: fullAddress || "N/A" },
                        { content: 'Input Address' || "N/A" },
                        { content: '0km' || "N/A" },
                        {
                            content: 'Google Location API', styles: {
                                overflow: 'visible',
                                cellWidth: 'auto'
                            }
                        },
                        { content: '', styles: {} },  // leave blank, we'll draw in it
                    ],
                    [
                        { content: `${davData?.address_latitude || "N/A"} - ${davData?.address_longitude || "N/A"}` },
                        { content: 'GPS' || "N/A" },
                        { content: distanceKm ? `${distanceKm} km` : "N/A" },
                        { content: 'Google Location API', styles: { whiteSpace: 'nowrap' } },
                        { content: '', styles: {} },  // leave blank, we'll draw in it
                    ]
                ],
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    cellPadding: 2,
                    fontSize: 10,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0],
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 60 }, // Address
                    1: { cellWidth: 30 }, // Source (Input Address)
                    2: { cellWidth: 30 }, // Distance
                    3: { cellWidth: 40 }, // Google Location API
                    4: { cellWidth: 20 }  // Legend (color box)
                },
                didDrawCell: function (data) {
                    // Only for legend cells (column index 4, rows 1 and 2)
                    if (data.column.index === 4 && (data.row.index === 1 || data.row.index === 2)) {
                        const boxSize = 6; // Size of the square box

                        // Center the box horizontally and vertically in the cell
                        const x = data.cell.x + (data.cell.width - boxSize) / 2;
                        const y = data.cell.y + (data.cell.height - boxSize) / 2;

                        // Set fill color based on row
                        if (data.row.index === 1) {
                            doc.setFillColor(255, 165, 0); // Orange
                        } else if (data.row.index === 2) {
                            doc.setFillColor(0, 0, 255); // Blue
                        }

                        // Draw the filled box
                        doc.rect(x, y, boxSize, boxSize, 'F');
                    }
                }

            });

            doc.addPage()

            doc.addImage(imageData, 'PNG', logoX, logoY, LogoimageWidth, LogoimageHeight);
            yPosition += 30; // Adjust Y after logo
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bolditalic');

            doc.text(
                'Digital Address Verification Form',
                doc.internal.pageSize.getWidth() - marginX,
                textY,
                { align: 'right' }
            );
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bolditalic');
            doc.text(
                formattedDate,
                doc.internal.pageSize.getWidth() - marginX,
                textY + 6,
                { align: 'right' }
            );
            doc.setDrawColor(0); // black
            doc.setLineWidth(0.3);
            doc.line(lineStartX, lineY, lineEndX, lineY);
            yPosition = lineY + gapY - 2;

            // === Map Generation ===
            // yPosition = doc.autoTable.previous.finalY + gapY;

            const imageWidth = pageWidth;
            const imageHeight = (imageWidth * 2) / 3; // 3:2 ratio

            const imageMapUrlFull = davData.static_map_picture.trim();
            const mapImageFormat = getImageFormat(imageMapUrlFull);
            let mapImg, mapWidth, mapHeight, mapImageBase64Img, mapImgWidth, mapImgHeight;
            if (await checkImageExists(imageMapUrlFull)) {
                mapImg = await validateImageInBrowser(imageMapUrlFull);

                if (mapImg) {
                    ({ mapWidth, mapHeight } = scaleImage(
                        mapImg,
                        doc.internal.pageSize.width - 20,
                        80
                    ));

                    console.log('mapImg.src', mapImg.src);
                    const mapImageBase64Array = await fetchImageToBaseBlob(mapImg.src);
                    const mapImageBase64Img = mapImageBase64Array?.[0]; // get first image object

                    if (mapImageBase64Img?.base64 && mapImageBase64Img?.imageUrl) {
                        const format = mapImageBase64Img.base64.split(";")[0].split("/")[1].toUpperCase(); // e.g., "image/png" → "PNG"

                        const imageWidth = pageWidth;
                        const imageHeight = (imageWidth * 2) / 3; // 3:2 ratio

                        doc.addImage(
                            mapImageBase64Img.base64,
                            format,
                            marginX,
                            yPosition,
                            imageWidth,
                            imageHeight
                        );

                        yPosition += imageHeight + 10; // adjust based on fixed height
                    } else {
                        console.warn("⚠️ mapImageBase64Img or its properties are undefined", mapImageBase64Img);
                    }
                }
            }
            yPosition = imageHeight + 30;
            console.log('yPosition ', yPosition)
            // Nearby Places Table
            doc.autoTable({
                startY: yPosition + 10,
                head: [
                    [{
                        content: 'Nearby Place Details',
                        colSpan: 5,
                        styles: {
                            halign: 'left',
                            fontSize: 12,
                            fontStyle: 'bold',
                            fillColor: [197, 217, 241],
                            textColor: [80, 80, 80],
                        }
                    }],
                    [
                        { content: "Nearby Place", styles: { fontStyle: 'bold' } },
                        { content: "Name", styles: { fontStyle: 'bold' } },
                        { content: "Address", styles: { fontStyle: 'bold' } },
                        { content: "Latitude", styles: { fontStyle: 'bold' } },
                        { content: "Longitude", styles: { fontStyle: 'bold' } }
                    ]
                ],
                body: [
                    [
                        { content: "Police Station" },
                        { content: davData?.police_station_name || "N/A" },
                        { content: davData?.police_station_address || "N/A" },
                        { content: davData?.police_station_latitude || "N/A" },
                        { content: davData?.police_station_longitude || "N/A" }
                    ],
                    [
                        { content: "Post Office" },
                        { content: davData?.post_office_name || "N/A" },
                        { content: davData?.post_office_address || "N/A" },
                        { content: davData?.post_office_latitude || "N/A" },
                        { content: davData?.post_office_longitude || "N/A" }
                    ],
                    [
                        { content: "Tourism Place" },
                        { content: davData?.tourist_attraction_name || "N/A" },
                        { content: davData?.tourist_attraction_address || "N/A" },
                        { content: davData?.tourist_attraction_latitude || "N/A" },
                        { content: davData?.tourist_attraction_longitude || "N/A" }
                    ]
                ],
                theme: 'grid',
                margin: { top: 10, left: 15, right: 15 },
                styles: {
                    cellPadding: 2,
                    fontSize: 10,
                    lineWidth: 0.2,
                    lineColor: [0, 0, 0],
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 36 },
                    1: { cellWidth: 36 },
                    2: { cellWidth: 36 },
                    3: { cellWidth: 36 },
                    4: { cellWidth: 36 }
                }
            });



            doc.addPage()

            doc.addImage(imageData, 'PNG', logoX, logoY, LogoimageWidth, LogoimageHeight);
            yPosition += 30; // Adjust Y after logo
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bolditalic');

            doc.text(
                'Digital Address Verification Form',
                doc.internal.pageSize.getWidth() - marginX,
                textY,
                { align: 'right' }
            );
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bolditalic');
            doc.text(
                formattedDate,
                doc.internal.pageSize.getWidth() - marginX,
                textY + 6,
                { align: 'right' }
            );
            doc.setDrawColor(0); // black
            doc.setLineWidth(0.3);
            doc.line(lineStartX, lineY, lineEndX, lineY);
            yPosition = lineY + gapY - 2;

            // yPosition = doc.lastAutoTable.finalY + 10;

            const rawImageDataBox = [
                { name: 'id / Proof', url: davData?.id_proof },
                { name: 'House Name', url: davData?.house_name_main_door },
                { name: 'Building Photo', url: davData?.building_photo },
                { name: 'Street Photo', url: davData?.street_photo },
                { name: 'Nearest Landmark', url: davData?.nearest_landmark },
                { name: 'Map Screenshot', url: davData?.map_screenshot },
            ];

            const imageDataBox = await Promise.all(
                rawImageDataBox.map(async (img) => {
                    try {
                        const urls = img.url?.split(',').map(u => u.trim()).filter(Boolean); // Split and clean

                        if (!urls || urls.length === 0) {
                            return { name: img.name, url: null };
                        }

                        // Convert only the first image to base64 (you can loop all if needed)
                        console.log(`🔄 Converting image to base64: ${img.name} -> ${urls[0]}`);
                        const base64Url = await toBase64FromUrl(urls[0]);
                        console.log(`✅ Converted: ${img.name}`);
                        return { name: img.name, url: base64Url };
                    } catch (error) {
                        console.error(`❌ Error converting image: ${img.name}`, error);
                        return { name: img.name, url: null };
                    }
                })
            );

            const imageWidthBox = 70;
            const imageHeightBox = 50;

            console.log('📄 Generating autoTable...');
            doc.autoTable({
                startY: yPosition,

                body: Array(Math.ceil(imageDataBox.length / 2)).fill().map(() => [null, null]),
                margin: { top: 20, left: 20, right: 20, bottom: 20 },
                styles: {
                    cellPadding: 2,
                    fontSize: 0,
                    minCellHeight: imageHeightBox + 20,
                    valign: 'top',
                    textColor: [0, 0, 0],
                    lineWidth: 0,
                    lineColor: [255, 255, 255],
                },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 'auto' },
                },
                didDrawCell: function (data) {
                    if (data.section !== 'body') return;

                    const { cell, row, column } = data;
                    const cellDataIndex = row.index * 2 + column.index; // 2 columns per row

                    const cellData = imageDataBox[cellDataIndex];
                    if (!cellData || !cellData.url || !cellData.name) return;

                    // Draw cell border
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.5);
                    doc.rect(cell.x + 1, cell.y + 1, cell.width - 2, cell.height - 4);

                    // Center and position image
                    const imageXCenter = cell.x + (cell.width - imageWidthBox) / 2;
                    const imageYTop = cell.y + 5;

                    try {
                        doc.addImage(cellData.url, 'JPEG', imageXCenter, imageYTop, imageWidthBox, imageHeightBox);
                    } catch (e) {
                        console.warn(`Failed to render image at row ${row.index}, column ${column.index}: ${cellData.name}`, e);
                    }

                    // Add image label
                    const labelX = cell.x + 8;
                    let labelY = imageYTop + imageHeightBox + 5;

                    doc.setFontSize(9);
                    doc.setTextColor(0, 0, 0);
                    doc.text(cellData.name, labelX, labelY);

                    labelY += 5; // Move the next label slightly below the previous one
                    doc.text(`Location: ${davData?.address_latitude || "N/A"} , ${davData?.address_longitude || "N/A"}`, labelX, labelY);
                },
                useCss: true,
            });


            let newYPosition = 20
            const backgroundColor = '#c5d9f1';

            doc.setDrawColor(0, 0, 0); // Set border color to black
            doc.setFillColor(backgroundColor);
            doc.setTextColor(80, 80, 80); // Black text
            doc.setFontSize(13);

            doc.setFont('helvetica', 'bold'); // Set font to Helvetica Bold

            doc.setFont('helvetica', 'normal'); // Reset to normal for following text

            newYPosition = doc.autoTable.previous.finalY - 70; // Adjusting for space from the last table

            // Save 
            const name = davData?.name?.replace(/\s+/g, "-") || "Unknown";
            const id = davData?.candidate_application_id || "NoID";
            const pdfFileName = `${name}_${id}_DAV.pdf`;

            console.log("pdfFileName -", pdfFileName);
            doc.save(pdfFileName);

        } catch (error) {
            console.error("PDF generation failed:", error);
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <>
            <form className='p-4' id='bg-form'>
                {
                    loading ? (
                        <div className='flex justify-center items-center py-6 ' >
                            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />
                        </div >
                    ) : (
                        <>
                            <h3 className="text-center py-3 font-bold text-2xl">Digital Address Verification</h3>
                            <div className="border md:w-7/12 m-auto p-4 ">
                                <div className="md:grid grid-cols-1 md:grid-cols-3 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Company Name:</label>
                                        <input type="text" value={davData?.company_name} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="company_name" name="company_name" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="candidate_name" className="block text-sm font-medium text-gray-700">Candidate Name:</label>
                                        <input type="text" value={davData?.name} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="candidate_name" name="candidateName" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label className="block text-sm font-medium text-gray-700">Employee ID:</label>
                                        <input type="text" value={davData?.employee_id} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="employee_id" />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="mob_no" className="block text-sm font-medium text-gray-700">Mobile No:</label>
                                        <input type="text" value={davData?.mobile_number} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="mob_no" name="mobNo" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="email_id" className="block text-sm font-medium text-gray-700">Email ID:</label>
                                        <input type="email" value={davData?.email} readOnly className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="email_id" name="emailId" />
                                    </div>
                                </div>

                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude:</label>
                                        <input type="text" value={davData?.latitude} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="latitude" name="latitude" />
                                    </div>
                                    <div className=" my-3 form-group">
                                        <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude:</label>
                                        <input type="text" value={davData?.longitude} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="longitude" name="longitude" />
                                    </div>

                                </div>

                                {davData?.static_map_picture && (
                                    <img
                                        src={davData.static_map_picture}
                                        alt="Static Map"
                                        style={{ height: "400px", width: "100%", objectFit: "cover" }}
                                    />
                                )}
                                {davData?.distance && (
                                    <p className="mt-4 text-lg font-semibold text-blue-700">
                                        Distance from reference: {davData.distance}km
                                    </p>
                                )}


                                <div className="col-span-2 mt-5 mb-2">
                                    <h4 className="text-center text-lg font-semibold">Personal Information</h4>
                                </div>


                                <div className="md:grid grid-cols-1 md:grid-cols-1 gap-4 mb-2">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="id_card_details" className="block text-sm font-medium text-gray-700">Id Card details (Passport/Dl/Resident Card/Adhaar)
                                        </label>
                                        <input type="text" value={davData?.id_card_details} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="id_card_details" />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="verifier_name" className="block text-sm font-medium text-gray-700">Verifier Name:</label>
                                        <input type="text" value={davData?.verifier_name} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="verifier_name" id="verifier_name" />
                                    </div>
                                    <div className=" my-3 form-group">
                                        <label htmlFor="relation_with_verifier" className="block text-sm font-medium text-gray-700">Relation With Verifier:  </label>
                                        <input type="text" value={davData?.relation_with_verifier} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="relation_with_verifier" id="relation_with_verifier" />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">

                                    <div className="form-group mb-2">
                                        <label htmlFor="house_flat_no" className="block text-sm font-medium text-gray-700">House Number / Flat Number</label>
                                        <input type="text" value={davData?.house_flat_no} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="house_flat_no" />
                                    </div>
                                    <div className="form-group mb-2">
                                        <label htmlFor="street_adress" className="block text-sm font-medium text-gray-700">Street Address</label>
                                        <input type="text" value={davData?.street_adress} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="street_adress" />
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Locality Name</p>
                                        <div className="flex space-x-4 flex-wrap">
                                            <input type="text" value={davData?.locality_name} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="locality_name" />
                                        </div>
                                    </div>

                                    <div className=" my-3 form-group">
                                        <p className="text-sm font-medium text-gray-700 mb-2">City</p>
                                        <div className="flex space-x-4 flex-wrap">
                                            <input type="text" value={davData?.city} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="city" />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="pin_code" className="block text-sm font-medium text-gray-700">Pin code:</label>
                                        <input type="text" value={davData?.pin_code} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="pin_code" />
                                    </div>

                                    <div className=" my-3 form-group">
                                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">State:</label>
                                        <input type="text" value={davData?.state} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="state" />
                                    </div>


                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 mb-2 gap-4">

                                    <div className=" my-3 form-group">
                                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country:</label>
                                        <input type="text" value={davData?.country} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="country" />
                                    </div>
                                    <div className=" my-3 form-group">
                                        <label htmlFor="nature_of_residence" className="block text-sm font-medium text-gray-700">Nature of Residence :</label>
                                        <input type="text" value={davData?.nature_of_residence} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="nature_of_residence" />
                                    </div>

                                </div>
                                {/* <div className="md:grid grid-cols-1 md:grid-cols-1 mb-2 gap-4">

                                    <div className=" my-3 form-group">
                                        <label htmlFor="landmark" className="block text-sm font-medium text-gray-700">Prominent Landmark:</label>
                                        <input type="text" value={davData?.landmark} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="landmark" />
                                    </div>
                                </div> */}
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="police_station" className="block text-sm font-medium text-gray-700">Nearest Police Station:</label>
                                        <input type="text" value={davData?.police_station} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="police_station" />
                                    </div>
                                    <div className=" my-3 form-group">
                                        <label htmlFor="post_office" className="block text-sm font-medium text-gray-700">Nearest Post Office:</label>
                                        <input type="text" value={davData.post_office} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="post_office" />
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-xl text-center my-5 font-medium text-gray-700">Period of Stay:</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label>From Date:</label>
                                            <input type="text" value={davData?.from_date} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="from_date" />
                                        </div>
                                        <div>
                                            <label>To Date:</label>
                                            <input type="text" value={davData?.to_date} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="to_date" />
                                        </div>
                                    </div>
                                </div>

                                <div className=" my-3 form-group">
                                    <label htmlFor="id_type" className="block text-sm font-medium text-gray-700">Type of ID Attached:</label>
                                    <input type="text" value={davData?.id_type} className="mt-1 block w-full border-gray-300 rounded-md border p-2" id="id_type" name="id_type" />
                                </div>

                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className=" my-3 form-group">
                                        <label htmlFor="id_proof" className="block text-sm font-medium text-gray-700">Upload id or Proof of Residence (Electricity Bill, Rent Receipt, Adhaar, Passport with same Address )</label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                identityProofUrls && identityProofUrls.length > 0 ? (
                                                    identityProofUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No identity Proof  available.</p>
                                                )
                                            }
                                        </div>
                                    </div>

                                    <div className="my-3 form-group">
                                        <label htmlFor="house_name_main_door" className="block text-sm font-medium text-gray-700">
                                            House name board / Main Door*
                                        </label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                homePhotoUrls && homePhotoUrls.length > 0 ? (
                                                    homePhotoUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No home photo available.</p>
                                                )
                                            }
                                        </div>
                                    </div>

                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-1 gap-4">

                                    <div className=" my-3 form-group">
                                        <label htmlFor="building_photo" className="block text-sm font-medium text-gray-700">Building / Home Photo</label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                localityUrls && localityUrls.length > 0 ? (
                                                    localityUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No locality Proof available.</p>
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className=" my-3 form-group">
                                        <label htmlFor="street_photo" className="block text-sm font-medium text-gray-700">Street Photo</label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                streetPhotoUrls && streetPhotoUrls.length > 0 ? (
                                                    streetPhotoUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No locality Proof available.</p>
                                                )
                                            }
                                        </div>
                                    </div>
                                    <div className=" my-3 form-group">
                                        <label htmlFor="nearest_landmark" className="block text-sm font-medium text-gray-700">Nearest landmark if any</label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                nearestLandmarkUrls && nearestLandmarkUrls.length > 0 ? (
                                                    nearestLandmarkUrls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No locality Proof available.</p>
                                                )
                                            }
                                        </div>
                                    </div>
                                    <div className=" my-3 form-group">
                                        <label htmlFor="map_screenshot" className="block text-sm font-medium text-gray-700">Map Screenshot</label>
                                        <div className="mt-2 w-1/3">
                                            {
                                                mapScreenshot_urls && mapScreenshot_urls.length > 0 ? (
                                                    mapScreenshot_urls.map((url, index) => (
                                                        <FileViewer key={index} fileUrl={url} className="w-full max-w-xs" />
                                                    ))
                                                ) : (
                                                    <p>No Screenshot available.</p>
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="md:grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group my-3">
                                        <label htmlFor="nof_yrs_staying" className="block text-sm font-medium text-gray-700">No of years staying in the address:</label>
                                        <div className="mt-2 w-1/3">
                                            <input type="text" value={davData?.years_staying} className="mt-1 block w-full border-gray-300 rounded-md border p-2" name="years_staying" />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={downloadPDF}
                                    disabled={pdfLoading}
                                    className={`bg-green-600 hover:bg-green-700 mt-10 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ${pdfLoading ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                >
                                    {pdfLoading ? "Loading..." : "Download PDF"}
                                </button>

                            </div>
                        </>
                    )}



            </form>


        </>
    );
};

export default CandidiateDav;

