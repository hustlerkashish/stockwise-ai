import React, { useState } from 'react';
import axios from 'axios';
import TradingViewWidget from 'react-tradingview-widget';
import { FiTrendingUp, FiTrendingDown, FiPauseCircle, FiArrowUpRight, FiArrowDownRight, FiCpu } from 'react-icons/fi';
import { Oval } from 'react-loader-spinner';
import NewsPanel from './NewsPanel';
import TradeModal from './TradeModal'; // 1. Import your TradeModal

const MemoizedTradingChart = React.memo(({ ticker }) => {
  return (
    <TradingViewWidget key={ticker} symbol={`NSE:${ticker}`} theme="Light" autosize />
  );
});

const ChartHeader = ({ ticker, liveData }) => {
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
  // 2. Add state to manage the modal
  const [modalState, setModalState] = useState({ isOpen: false, tradeType: null });
  const liveTickerData = liveData[`${ticker}.NS`] || liveData[`${ticker}.BO`];

  const handleGetPrediction = async () => {
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
    <div className="h-full flex flex-col bg-white overflow-y-auto">
        {/* 3. Render the TradeModal */}
        <TradeModal
            isOpen={modalState.isOpen}
            onClose={() => setModalState({ isOpen: false, tradeType: null })}
            ticker={ticker}
            currentPrice={liveTickerData?.price || 0}
            tradeType={modalState.tradeType}
        />
      
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <ChartHeader ticker={ticker} liveData={liveData} />
        <div className="flex items-center gap-2">
            {/* 4. Add the new Buy and Sell buttons */}
            <button 
              onClick={() => setModalState({ isOpen: true, tradeType: 'Buy' })} 
              disabled={!liveTickerData} 
              className="px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:bg-gray-400"
            >
              Buy
            </button>
            <button 
              onClick={() => setModalState({ isOpen: true, tradeType: 'Sell' })} 
              disabled={!liveTickerData} 
              className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:bg-gray-400"
            >
              Sell
            </button>
            <PredictionDisplay isLoading={isLoading} prediction={prediction} />
            <button onClick={handleGetPrediction} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"><FiCpu /><span>Get AI Prediction</span></button>
        </div>
      </div>

      <div className="h-[500px] flex-shrink-0">
        <MemoizedTradingChart ticker={ticker} />
      </div>

      <div className="border-t border-gray-200">
        <NewsPanel ticker={ticker} />
      </div>
    </div>
  );
};

export default MainChart;