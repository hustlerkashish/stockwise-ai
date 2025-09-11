// /frontend/src/components/HeatmapPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts';

const HeatmapPage = () => {
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState("NIFTY 50");

    useEffect(() => {
        const fetchHeatmapData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:8000/market-heatmap?index=${selectedIndex}`);
                setSeries([{ data: response.data }]);
            } catch (error) {
                console.error("Error fetching heatmap data:", error);
                alert("Could not load heatmap data.");
            } finally {
                setLoading(false);
            }
        };

        fetchHeatmapData();
    }, [selectedIndex]); // Re-fetch when the selected index changes

    const formatMarketCap = (cap) => {
        if (!cap) return 'N/A';
        if (cap >= 1000000000000) return `₹${(cap / 1000000000000).toFixed(2)} L Cr`;
        return `₹${(cap / 100000000).toFixed(2)} Cr`;
    };

    const options = {
        chart: { type: 'treemap', toolbar: { show: false }, foreColor: '#fff' },
        legend: { show: false },
        dataLabels: {
            enabled: true,
            style: { fontSize: '14px', fontFamily: 'Arial' },
            formatter: (text, { series, seriesIndex, dataPointIndex, w }) => {
                const { change } = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                const sign = change > 0 ? '+' : '';
                return [text, `${sign}${change.toFixed(2)}%`];
            },
            offsetY: -4
        },
        plotOptions: {
            treemap: {
                enableShades: false,
                distributed: true,
                useFillColorAsStroke: true,
                colorScale: {
                    ranges: [
                        { from: -Infinity, to: -2, color: '#b91c1c' }, // red-700
                        { from: -2, to: -0.01, color: '#ef4444' }, // red-500
                        { from: -0.01, to: 0.01, color: '#4b5563' }, // gray-600
                        { from: 0.01, to: 2, color: '#22c55e' }, // green-500
                        { from: 2, to: Infinity, color: '#16a34a' }  // green-600
                    ]
                }
            }
        },
        // A fully custom tooltip for a professional look
        tooltip: {
            enabled: true,
            theme: 'dark',
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const { x, y, change } = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                const sign = change > 0 ? '+' : '';
                const color = change >= 0 ? 'text-green-400' : 'text-red-400';
                return `
                    <div class="bg-gray-700 p-3 rounded-md border border-gray-600 shadow-lg">
                        <p class="font-bold text-white text-lg">${x}</p>
                        <p class="font-semibold ${color} text-md">${sign}${change.toFixed(2)}%</p>
                        <p class="text-gray-400 text-sm mt-1">Market Cap: ${formatMarketCap(y)}</p>
                    </div>
                `;
            }
        }
    };

    return (
        <div className="p-4 md:p-6 bg-[#0c1016] h-full text-white">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-white">Market Heatmap</h1>
                <select 
                    value={selectedIndex} 
                    onChange={(e) => setSelectedIndex(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                >
                    <option value="NIFTY 50">NIFTY 50</option>
                    <option value="NIFTY BANK">NIFTY BANK</option>
                </select>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800">
                {loading ? (
                    <div className="flex justify-center items-center h-[600px] text-gray-400">Loading Heatmap...</div>
                ) : (
                    <div id="chart">
                        <Chart options={options} series={series} type="treemap" height={650} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeatmapPage;