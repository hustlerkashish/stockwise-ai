import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Chart from 'react-apexcharts';
import { FiArrowLeft, FiTrendingUp, FiTrendingDown, FiMeh, FiBarChart2, FiInfo, FiAward } from 'react-icons/fi';

// Helper function to format large numbers
const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (Math.abs(num) >= 1.0e+12) return `₹${(num / 1.0e+12).toFixed(2)} L Cr`;
    if (Math.abs(num) >= 1.0e+7) return `₹${(num / 1.0e+7).toFixed(2)} Cr`;
    return `₹${num.toLocaleString('en-IN')}`;
};

const TickerAnalysisPage = () => {
    const { ticker } = useParams(); // Get ticker from URL (e.g., /analysis/RELIANCE)
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!ticker) return;
        const fetchAnalysis = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:8000/ticker-analysis/${ticker}`);
                setData(response.data);
            } catch (error) {
                console.error("Error fetching ticker analysis:", error);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, [ticker]);

    if (loading) {
        return <div className="p-6 text-center text-white">Loading Analysis for {ticker}...</div>;
    }
    if (!data) {
        return (
            <div className="p-6 text-center text-white">
                <p className="text-red-400 mb-4">Could not load data for {ticker}. The stock may be delisted or the symbol is incorrect.</p>
                <button onClick={() => navigate(-1)} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500">Go Back</button>
            </div>
        );
    }

    const { profile, financials, technicals, analystRatings } = data;

    // Chart Data for Analyst Ratings
    const ratingCategories = ['Buy', 'Hold', 'Sell'];
    const ratingSeries = [{
        name: 'Ratings',
        data: ratingCategories.map(cat => analystRatings[cat] || 0)
    }];
    const ratingOptions = {
        chart: { type: 'bar', toolbar: { show: false }, foreColor: '#9ca3af' },
        plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true, barHeight: '50%' } },
        colors: ['#22c55e', '#f59e0b', '#ef4444'],
        dataLabels: { enabled: true, style: { colors: ['#fff'] }, formatter: (val) => val > 0 ? val : '' },
        xaxis: { categories: ratingCategories, labels: { style: { colors: '#9ca3af' } } },
        yaxis: { labels: { style: { colors: '#9ca3af', fontSize: '14px' } } },
        grid: { borderColor: '#374151' },
        legend: { show: false },
        tooltip: { theme: 'dark' },
    };

    const TechnicalGauge = ({ signal }) => {
        let color, icon;
        switch (signal) {
            case 'Bullish': color = 'text-green-400'; icon = <FiTrendingUp />; break;
            case 'Bearish': color = 'text-red-400'; icon = <FiTrendingDown />; break;
            default: color = 'text-yellow-400'; icon = <FiMeh />; break;
        }
        return (
            <div className={`flex flex-col items-center justify-center p-4 bg-gray-900 rounded-lg h-full border ${color.replace('text-', 'border-')} bg-opacity-50`}>
                <div className="text-6xl">{icon}</div>
                <p className="mt-2 text-2xl font-bold">{signal}</p>
                <p className="text-sm text-gray-400">Based on SMA & RSI</p>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 bg-[#0c1016] h-full text-white overflow-y-auto">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-gray-400 hover:text-white">
                <FiArrowLeft /> Back
            </button>
            <div className="mb-6">
                <h1 className="text-4xl font-bold">{profile.longName}</h1>
                <p className="text-lg text-gray-400">{profile.symbol.replace('.NS', '')} · {profile.sector}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FiBarChart2 /> Key Financials</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 text-sm">
                            <div><p className="text-gray-400">Market Cap</p><p className="font-bold text-lg">{formatNumber(financials.marketCap)}</p></div>
                            <div><p className="text-gray-400">P/E Ratio</p><p className="font-bold text-lg">{financials.trailingPE?.toFixed(2) || 'N/A'}</p></div>
                            <div><p className="text-gray-400">P/B Ratio</p><p className="font-bold text-lg">{financials.priceToBook?.toFixed(2) || 'N/A'}</p></div>
                            <div><p className="text-gray-400">Dividend Yield</p><p className="font-bold text-lg">{financials.dividendYield?.toFixed(2) || '0.00'}%</p></div>
                            <div><p className="text-gray-400">52W High</p><p className="font-bold text-lg">₹{financials.fiftyTwoWeekHigh?.toFixed(2)}</p></div>
                            <div><p className="text-gray-400">52W Low</p><p className="font-bold text-lg">₹{financials.fiftyTwoWeekLow?.toFixed(2)}</p></div>
                            <div><p className="text-gray-400">Avg. Volume</p><p className="font-bold text-lg">{financials.averageVolume?.toLocaleString('en-IN')}</p></div>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FiInfo /> Company Profile</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{profile.longBusinessSummary}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold mb-4">Technical Summary</h3>
                        <TechnicalGauge signal={technicals.signal} />
                    </div>
                     <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FiAward /> Analyst Ratings</h3>
                        {Object.keys(analystRatings).length > 0 ? (
                           <Chart options={ratingOptions} series={ratingSeries} type="bar" height={250} />
                        ) : (
                           <p className="text-center text-gray-500 py-10">No analyst ratings available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TickerAnalysisPage;