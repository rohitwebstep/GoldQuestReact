import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { useDashboard } from "./DashboardContext";
import { PulseLoader } from "react-spinners"; // Import PulseLoader
import { useApiCall } from "../ApiCallContext";

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const Chart = () => {
  const { tableData, fetchDashboard, loading } = useDashboard();
  const { isBranchApiLoading, checkBranchAuthentication } = useApiCall();

  const [hasData, setHasData] = useState(true); // State to check if there is data

  useEffect(() => {
    // Check if the data is loaded and if there are applications
    if (tableData && tableData.clientApplications) {
      const applications = tableData.clientApplications;
      const hasApplications = Object.values(applications).some(
        (category) => category.applicationCount > 0
      );
      setHasData(hasApplications); // Set hasData to true/false based on the applications present
    }
  }, [tableData]); // Run this useEffect whenever `tableData` changes

  useEffect(() => {
    const fetchData = async () => {
      if (!isBranchApiLoading) {
        await checkBranchAuthentication();
        await fetchDashboard();
      }
    };

    fetchData();
  }, [fetchDashboard]);

  // Function to process the data and create the pie chart
  const processData = () => {
    if (!tableData || !tableData.clientApplications) return null;

    const categoryCounts = {};

    // Loop through the categories and count the applications
    Object.keys(tableData.clientApplications).forEach((category) => {
      categoryCounts[category] =
        tableData.clientApplications[category].applicationCount; // Getting application count for each category
    });

    // Check if there is any data to display
    const hasApplications = Object.values(categoryCounts).some((count) => count > 0);
    if (!hasApplications) return null;

    // Prepare data for the chart
    const labels = Object.keys(categoryCounts); // Categories (wip, insuff, etc.)
    const dataPoints = Object.values(categoryCounts); // Corresponding application counts

    return {
      labels,
      datasets: [
        {
          data: dataPoints,
          backgroundColor: [
            "#FF5733", // Red for WIP
            "#33FF57", // Green for Completed
            "#3357FF", // Blue for Insufficient
            "#FF33A1", // Pink for Nil
            "#FFB933", // Orange for others
          ], // Colors for the chart slices
          hoverBackgroundColor: [
            "#FF8A66", // Lighter red for hover
            "#66FF8A", // Lighter green for hover
            "#668DFF", // Lighter blue for hover
            "#FF66C2", // Lighter pink for hover
            "#FFDA66", // Lighter orange for hover
          ], // Hover colors for each slice
        },
      ],
    };
  };

  // Getting chart data
  const chartData = processData();

  const options = {
    responsive: true, // Make chart responsive
    plugins: {
      legend: {
        position: "top", // Position of the legend
        labels: {
          font: {
            size: 14, // Adjust font size for the legend
            family: "Arial, sans-serif", // Change font family
          },
          padding: 20, // Add padding between legend and chart
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return tooltipItem.label + ": " + tooltipItem.raw + " Applications"; // Display count with label
          },
        },
      },
    },
    maintainAspectRatio: false, // Prevent chart from maintaining aspect ratio
    cutout: "40%", // Make the pie chart slightly cut out in the middle for a donut-like look
    elements: {
      arc: {
        borderWidth: 2, // Add border around slices
        borderColor: "white", // White border between slices for better contrast
      },
    },
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        backgroundColor: "#f9f9f9", // Light background for the container
        borderRadius: "10px", // Rounded corners
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", // Soft shadow for better aesthetics
      }}
    >
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <PulseLoader color="#36d7b7" size={15} />
        </div>
      ) : chartData ? (
        <>
          <h2 className="text-center font-bold py-4 text-lg">
            Application Count by Category
          </h2>

          <div
            style={{
              width: "100%",
              height: "400px",
              margin: "0 auto",
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Pie data={chartData} options={options} />
          </div>
        </>
      ) : (
        <h2 className="text-center font-bold py-4 text-lg text-gray-500">
          No Applications Found
        </h2>
      )}
    </div>
  );
};

export default Chart;
