// /frontend/src/components/MainChart.js

import React from 'react';
import TradingViewWidget from 'react-tradingview-widget';
import axios from 'axios';
import { FiTrendingUp, FiTrendingDown, FiPauseCircle, FiArrowUpRight, FiArrowDownRight, FiCpu } from 'react-icons/fi';
import { Oval } from 'react-loader-spinner';
import NewsPanel from './NewsPanel'; // 1. Import the new component

const MemoizedTradingChart = React.memo(({ ticker }) => {
  return (
    <TradingViewWidget key={ticker} symbol={`NSE:${ticker}`} theme="Light" autosize />
  );
});

const ChartHeader = ({ ticker, liveData }) => {
    // (This component is unchanged)
    if (!liveData) return <div className="flex flex-col items-start"><h2 className="font-bold text-black text-2xl">{ticker}</h2><div className="font-semibold text-gray-400">Initializing...</div></div>;
    const liveTickerData = liveData[`${ticker}.NS`] || liveData[`${ticker}.BO`];
    let priceContent;
    if (liveTickerData) {
        const isUp = liveTickerData.change >= 0; const colorClass = isUp ? 'text-green-600' : 'text-red-600';
        priceContent = <div className={`flex items-center gap-3 font-semibold ${colorClass}`}><span className="text-2xl">₹{liveTickerData.price.toFixed(2)}</span><span className="text-sm flex items-center">{isUp ? <FiArrowUpRight/> : <FiArrowDownRight/>}{liveTickerData.change.toFixed(2)} ({liveTickerData.percent_change.toFixed(2)}%)</span></div>;
    } else { priceContent = <div className="font-semibold text-gray-400">Loading price...</div>; }
    return <div className="flex flex-col items-start"><h2 className="font-bold text-black text-2xl">{ticker}</h2>{priceContent}</div>;
};

const PredictionDisplay = ({ isLoading, prediction }) => {
    // (This component is unchanged)
    if (isLoading) return <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg"><Oval color="#4B5563" height={16} width={16} strokeWidth={4} />Analyzing...</div>;
    if (!prediction) return null;
    let icon, colorClass;
    if (prediction.recommendation === 'Buy') { icon = <FiTrendingUp />; colorClass = 'bg-green-100 text-green-700'; }
    else if (prediction.recommendation === 'Sell') { icon = <FiTrendingDown />; colorClass = 'bg-red-100 text-red-700'; }
    else if (prediction.recommendation === 'Hold') { icon = <FiPauseCircle />; colorClass = 'bg-gray-100 text-gray-700'; }
    else { icon = '⚠️'; colorClass = 'bg-yellow-100 text-yellow-700'; prediction.confidence_score = "Prediction failed"; }
    return <div className={`flex items-center gap-4 px-4 py-2 rounded-lg ${colorClass}`}><div className="flex items-center gap-2 text-lg font-bold">{icon} <span>{prediction.recommendation}</span></div><div className="text-sm">Confidence: <strong>{prediction.confidence_score}</strong></div></div>;
}

const MainChart = ({ ticker, prediction, setPrediction, isLoading, setIsLoading, liveData }) => {
  const handleGetPrediction = async () => {
    // (This function is unchanged)
    setIsLoading(true); setPrediction(null);
    try {
      const apiTicker = ticker + '.NS'; 
      const response = await axios.post("http://127.0.0.1:8000/predict", { ticker: apiTicker });
      setPrediction(response.data);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "An unexpected error occurred.";
      setPrediction({ recommendation: 'Error', confidence_score: errorMsg });
    } finally { setIsLoading(false); }
  };

  return (
    // This parent div allows the whole content area to scroll
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      {/* Top section: Header and Prediction */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <ChartHeader ticker={ticker} liveData={liveData} />
        <div className="flex items-center gap-4">
            <PredictionDisplay isLoading={isLoading} prediction={prediction} />
            <button onClick={handleGetPrediction} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"><FiCpu /><span>Get AI Prediction</span></button>
        </div>
      </div>

      {/* TradingView Chart */}
      <div className="h-[500px] flex-shrink-0">
        <MemoizedTradingChart ticker={ticker} />
      </div>

      {/* --- 2. ADD THE NEW NEWS PANEL COMPONENT HERE --- */}
      <div className="border-t border-gray-200">
        <NewsPanel ticker={ticker} />
      </div>
    </div>
  );
};

export default MainChart;