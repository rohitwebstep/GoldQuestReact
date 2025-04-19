import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useDashboard } from "./DashboardContext";
import { PulseLoader } from "react-spinners"; // Import PulseLoader

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Chart2 = () => {
  const { tableData, loading } = useDashboard();


  const data = tableData.clientApplications;

  if (!data) {
    console.error("clientApplications is undefined or null");
    return null; // Avoid further processing if data is missing
  }

  const processData = () => {

    const groupedByDateCategory = {};
    let hasApplications = false; // Track if there are any valid applications

    // Group applications by category and date
    Object.keys(data).forEach((category) => {
      groupedByDateCategory[category] = {};

      data[category].applications?.forEach((app) => {
        if (!app.created_at || app.created_at.trim() === "") {
          console.warn(`Skipping application due to invalid date:`, app);
          return; // Skip this application if created_at is null, undefined, or empty
        }

        hasApplications = true; // Found at least one valid application

        const date = new Date(app.created_at).toISOString().split("T")[0];

        if (!groupedByDateCategory[category][date]) {
          groupedByDateCategory[category][date] = 0;
        }
        groupedByDateCategory[category][date] += 1;
      });
    });

    if (!hasApplications) {
      return null; // Return null if there are no applications
    }


    // Collect all unique dates across all categories
    const labels = new Set();
    Object.keys(groupedByDateCategory).forEach((category) => {
      Object.keys(groupedByDateCategory[category]).forEach((date) =>
        labels.add(date)
      );
    });

    const sortedLabels = Array.from(labels).sort();

    let datasets = Object.keys(groupedByDateCategory).map((category) => {
      const dataPoints = sortedLabels.map(
        (date) => groupedByDateCategory[category][date] || 0
      );

      return {
        label: `${category.charAt(0).toUpperCase() + category.slice(1)} Applications`,
        data: dataPoints,
        borderColor: getRandomColor(),
        tension: 0.1,
        borderWidth: 1,
      };
    });

    // ✅ Ensure categories with ONLY zero values are fully removed
    datasets = datasets.filter((dataset) => dataset.data.some((value) => value > 0));


    return { labels: sortedLabels, datasets };
  };

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const chartData = processData();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw} Applications`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
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
              maxWidth: "100%",
              margin: "0 auto",
            }}
          >
            <Line data={chartData} options={options} />
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

export default Chart2;
