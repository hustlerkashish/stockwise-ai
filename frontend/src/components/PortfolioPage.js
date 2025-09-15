// /frontend/src/components/PortfolioPage.js

import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig'; // Use our new authenticated client
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import PortfolioInsights from './PortfolioInsights';


const PortfolioPage = () => {
    const [portfolio, setPortfolio] = useState(null);
    const [livePrices, setLivePrices] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolioAndPrices = async () => {
            try {
                // Fetch the user's portfolio (holdings and cash)
                const portfolioRes = await apiClient.get('/portfolio');
                const portfolioData = portfolioRes.data;
                setPortfolio(portfolioData);

                // Get a list of symbols the user owns
                const symbols = Object.keys(portfolioData.holdings || {});
                if (symbols.length > 0) {
                    // Fetch live prices for those symbols
                    const pricesRes = await apiClient.post('/prices/batch', { tickers: symbols });
                    setLivePrices(pricesRes.data);
                }
            } catch (error) {
                console.error("Error fetching portfolio data:", error);
                // You can add more robust error handling here
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolioAndPrices(); // Fetch on initial load
        const interval = setInterval(fetchPortfolioAndPrices, 20000); // Refresh every 20 seconds
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    const holdingsArray = portfolio?.holdings ? Object.entries(portfolio.holdings).map(([symbol, data]) => ({
        symbol,
        ...data
    })) : [];

    // --- Real-time Calculations ---
    const calculations = holdingsArray.reduce((acc, holding) => {
        const liveData = livePrices[holding.symbol];
        const investmentValue = holding.quantity * holding.averagePrice;
        acc.totalInvestmentValue += investmentValue;
        
        if (liveData) {
            const currentValue = holding.quantity * liveData.price;
            const pnl = currentValue - investmentValue;
            acc.totalHoldingsValue += currentValue;
            acc.totalPnl += pnl;
        } else {
            // If live price isn't available yet, use the investment value
            acc.totalHoldingsValue += investmentValue;
        }
        return acc;
    }, { totalHoldingsValue: 0, totalInvestmentValue: 0, totalPnl: 0 });

    const totalPortfolioValue = (portfolio?.cashBalance || 0) + calculations.totalHoldingsValue;
    const isProfit = calculations.totalPnl >= 0;

    if (loading) {
        return <div className="p-6 text-center text-white">Loading Your Portfolio...</div>;
    }

    return (
        <div className="p-4 md:p-6 bg-[#0c1016] h-full text-white overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6">Paper Trading Portfolio</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400">Total Portfolio Value</h3>
                    <p className="text-3xl font-bold mt-2">₹{totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400">Total Profit & Loss</h3>
                    <p className={`text-3xl font-bold mt-2 flex items-center ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        {isProfit ? <FiTrendingUp className="mr-2"/> : <FiTrendingDown className="mr-2"/>}
                        ₹{calculations.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400">Available Cash</h3>
                    <p className="text-3xl font-bold mt-2 flex items-center text-yellow-500">
                         <FiDollarSign className="mr-2"/>
                        ₹{(portfolio?.cashBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Holdings Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <h3 className="text-xl font-bold p-4 text-white">Your Holdings ({holdingsArray.length})</h3>
                <table className="min-w-full">
                    <thead className="bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Avg. Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Current Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total P&L</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {holdingsArray.length > 0 ? holdingsArray.map(holding => {
                            const liveData = livePrices[holding.symbol];
                            const currentValue = liveData ? holding.quantity * liveData.price : holding.quantity * holding.averagePrice;
                            const investmentValue = holding.quantity * holding.averagePrice;
                            const pnl = currentValue - investmentValue;
                            const isHoldingProfit = pnl >= 0;

                            return (
                                <tr key={holding.symbol} className="hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-bold text-white">{holding.symbol.replace('.NS', '')}</td>
                                    <td className="px-6 py-4 text-right font-mono">{holding.quantity}</td>
                                    <td className="px-6 py-4 text-right font-mono">₹{holding.averagePrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-mono">{liveData ? `₹${liveData.price.toFixed(2)}` : 'Loading...'}</td>
                                    <td className={`px-6 py-4 text-right font-mono font-semibold ${isHoldingProfit ? 'text-green-500' : 'text-red-500'}`}>
                                        ₹{pnl.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="5" className="text-center py-8 text-gray-500">You have no holdings. Buy stocks from the dashboard to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
             {/* 2. ADD THE NEW INSIGHTS COMPONENT HERE */}
            <PortfolioInsights />
        </div>
    );
};

export default PortfolioPage;