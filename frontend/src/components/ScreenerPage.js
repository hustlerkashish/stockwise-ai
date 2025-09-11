import React, { useState } from 'react';
import axios from 'axios';
import { FiFilter } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const ScreenerPage = () => {
    const [filters, setFilters] = useState({
        minMarketCap: "50000000000",
        maxPeRatio: "",
        minDividendYield: "",
        sector: ""
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const indianSectors = [
        'Technology', 'Financial Services', 'Energy', 'Healthcare', 'Consumer Cyclical',
        'Industrials', 'Basic Materials', 'Consumer Defensive', 'Utilities', 'Real Estate'
    ];

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const runScreen = async () => {
        setLoading(true);
        setHasSearched(true);
        setResults([]);
        try {
            const response = await axios.post('http://localhost:8000/screener', filters);
            setResults(response.data);
        } catch (error) {
            console.error("Error running screener:", error);
            alert(error.response?.data?.detail || "Failed to run screener.");
        } finally {
            setLoading(false);
        }
    };

    const formatMarketCap = (cap) => {
        if (!cap) return 'N/A';
        if (cap >= 1000000000000) return `₹${(cap / 1000000000000).toFixed(2)} L Cr`;
        return `₹${(cap / 100000000).toFixed(2)} Cr`;
    };

    return (
        // THE FIX IS HERE: Added 'text-gray-900' to set a default dark text color for this page
        <div className="p-4 md:p-6 bg-gray-50 h-full overflow-y-auto text-gray-900">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Stock Screener</h1>
            
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Market Cap (Min)</label>
                        <select name="minMarketCap" value={filters.minMarketCap} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md bg-white">
                            <option value="50000000000">5,000 Cr</option>
                            <option value="200000000000">20,000 Cr</option>
                            <option value="1000000000000">1 L Cr</option>
                            <option value="5000000000000">5 L Cr</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">P/E Ratio (Max)</label>
                        <input type="number" name="maxPeRatio" value={filters.maxPeRatio} onChange={handleFilterChange} placeholder="e.g., 50" className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Dividend Yield (Min %)</label>
                        <input type="number" name="minDividendYield" value={filters.minDividendYield} onChange={handleFilterChange} placeholder="e.g., 1.5" className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Sector</label>
                        <select name="sector" value={filters.sector} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md bg-white">
                            <option value="">Any Sector</option>
                            {indianSectors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button onClick={runScreen} disabled={loading} className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                        <FiFilter /> {loading ? 'Screening...' : 'Run Screen'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price (₹)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Market Cap</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P/E Ratio</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {!loading && results.map(stock => (
                            <tr key={stock.symbol} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">
    <Link to={`/analysis/${stock.symbol}`} className="text-blue-600 hover:underline">
        {stock.symbol}
    </Link>
</td>
                                <td className="px-6 py-4 text-right font-mono text-gray-700">{stock.price.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-mono text-gray-700">{formatMarketCap(stock.marketCap)}</td>
                                <td className="px-6 py-4 text-right font-mono text-gray-700">{stock.peRatio ? stock.peRatio.toFixed(2) : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div className="p-4 text-center text-gray-500">Loading results...</div>}
                {hasSearched && !loading && results.length === 0 && <div className="p-4 text-center text-gray-500">No stocks match your criteria. Try adjusting the filters.</div>}
                {!hasSearched && <div className="p-4 text-center text-gray-500">Click "Run Screen" to see results.</div>}
            </div>
        </div>
    );
};

export default ScreenerPage;