import { React, useEffect, useState } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import { useDashboard } from './DashboardContext';
import { PulseLoader } from 'react-spinners';  // Import PulseLoader

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const Chart2 = () => {
  const {tableData } = useDashboard();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);  // Add loading state

 

  useEffect(() => {
    if (tableData && tableData.clientApplications) {
      const dateMap = {};

      // Aggregate by day
      Object.values(tableData.clientApplications).forEach((statusData) => {
        statusData.applications.forEach((app) => {
          const date = new Date(app.created_at);
          if (isNaN(date.getTime())) {
            console.error("Invalid date encountered:", app.created_at);
            return;
          }

          const day = date.toISOString().split('T')[0];

          if (!dateMap[day]) {
            dateMap[day] = 0;
          }
          dateMap[day] += 1;
        });
      });

      const dataPoints = Object.entries(dateMap).map(([day, count]) => {
        const parsedDate = new Date(day);
        return {
          x: parsedDate,
          y: count,
        };
      });

      setChartData([
        {
          type: "splineArea",
          showInLegend: true,
          legendText: "Applications",
          dataPoints,
          color: "#2196F3",
          name: "Applications",
        },
      ]);
    }
  }, [tableData]);

  const options = {
    animationEnabled: true,
    title: {
      text: "Client Applications Over Time",
      fontSize: 20,
      fontColor: "#333",
    },
    axisX: {
      title: "Date",
      valueFormatString: "DD MMM YYYY",
      labelAngle: -45,
    },
    axisY: {
      title: "Application Count",
      includeZero: true,
      gridThickness: 1,
      labelFormatter: function (e) {
        return e.value.toLocaleString();
      },
    },
    toolTip: {
      shared: true,
      content: "Applications: {y} on {x}",
    },
    data: chartData,
    legend: {
      verticalAlign: "top",
      horizontalAlign: "center",
    },
    backgroundColor: "#f4f4f9",
    subTitle: {
      text: "Total applications created over time",
      fontSize: 14,
      fontColor: "#666",
    },
  };

  return (
    <div className="chart-container flex items-center justify-center h-full rounded-md p-5">
      {loading ? (
        <PulseLoader color="#36A2EB" loading={loading} size={15} />
      ) : (
        <CanvasJSChart options={options} />
      )}
    </div>
  );
};

export default Chart2;
