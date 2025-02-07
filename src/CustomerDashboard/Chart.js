import React, { useEffect, useState } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import { useDashboard } from './DashboardContext';
import PulseLoader from 'react-spinners/PulseLoader';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const Chart = () => {
    const { fetchDashboard, tableData } = useDashboard();
    const [loading, setLoading] = useState(true);
    const color = "#36A2EB"; // Define loader color

    const override = {
        display: "block",
        margin: "0 auto",
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchDashboard();
            setLoading(false);
        };

        loadData();
    }, [fetchDashboard]);

    const totalApplications = tableData.totalApplicationCount;
    const dataPoints = [];

    for (const [key, value] of Object.entries(tableData.clientApplications)) {
        const percentage = totalApplications > 0
            ? ((value.applicationCount / totalApplications) * 100).toFixed(2)
            : 0;
        dataPoints.push({
            y: Number(percentage),
            label: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
            color: getColorByStatus(key),
            count: value.applicationCount
        });
    }

    function getColorByStatus(status) {
        const colors = {
            wip: "#FFCE56",
            completed: "#36A2EB",
            ready: "#4BC0C0",
            not_ready: "#FF6384",
            insuff: "#FF6384",
        };
        return colors[status] || "#000";
    }

    const options = {
        theme: "light",
        animationEnabled: true,
        exportFileName: "Client Applications Status",
        exportEnabled: true,
        title: {
            text: "Client Applications Status",
            fontSize: 20,
            padding: { top: 10, bottom: 10 }
        },
        data: [{
            type: "pie",
            showInLegend: true,
            legendText: "{label}",
            toolTipContent: "{label}: <strong>{y}%</strong> (Count: {count}) ",
            indexLabel: "{y}% ({count})",
            indexLabelPlacement: "inside",
            indexLabelFontColor: "#fff",
            indexLabelFontSize: 16,
            dataPoints: dataPoints
        }]
    };

    return (
        <div className="chart-container flex items-center justify-center border h-full rounded-md">
            {loading ? (
                <PulseLoader
                    color={color}
                    loading={loading}
                    cssOverride={override}
                    size={15}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                />
            ) : dataPoints.length > 0 ? ( // Check if there is data in dataPoints array
                <CanvasJSChart options={options} />
            ) : (
                <p className="text-center py-5 text-lg">No data available</p> // Display message if no data
            )}
        </div>
    );
};

export default Chart;
