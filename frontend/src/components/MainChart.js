import React from 'react';
import TradingViewWidget from 'react-tradingview-widget';
import axios from 'axios';
import { FiTrendingUp, FiTrendingDown, FiPauseCircle, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

// This is the optimized, memoized chart component from before.
const MemoizedTradingChart = React.memo(({ ticker }) => {
  return (
    <TradingViewWidget
      key={ticker} 
      symbol={ticker}
      theme="Light"
      autosize
    />
  );
});

const ChartHeader = ({ ticker, liveTickerData }) => {
    let content;
    if (liveTickerData) {
        const isUp = liveTickerData.change >= 0;
        const colorClass = isUp ? 'text-green-500' : 'text-red-500';
        content = (
            <div className={`flex items-center gap-2 font-bold ${colorClass}`}>
                <span>₹{liveTickerData.price.toFixed(2)}</span>
                <span className="text-sm flex items-center">
                    {isUp ? <FiArrowUpRight/> : <FiArrowDownRight/>}
                    {liveTickerData.change.toFixed(2)} ({liveTickerData.percent_change.toFixed(2)}%)
                </span>
            </div>
        );
    } else {
        content = <div className="font-bold text-gray-400">Loading price...</div>;
    }

    return (
        <div className="flex items-center gap-4">
            <h2 className="font-bold text-black text-lg">{ticker}</h2>
            {content}
        </div>
    );
};

const MainChart = ({ ticker, prediction, setPrediction, isLoading, setIsLoading, liveTickerData }) => {
  
  const handleGetPrediction = async () => {
    setIsLoading(true);
    setPrediction(null);
    try {
      const apiTicker = ticker + '.NS';
      const response = await axios.post("http://127.0.0.1:8000/predict", { ticker: apiTicker });
      if (response.data.error) {
        setPrediction({ recommendation: 'Error', ticker: ticker, confidence_score: response.data.error });
      } else {
        setPrediction(response.data);
      }
    } catch (error) {
      const errorDetail = error.response ? error.response.data.detail : "Network connection failed.";
      setPrediction({ recommendation: 'Error', ticker: ticker, confidence_score: errorDetail });
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-2 pl-4 border-b border-gray-200">
        <ChartHeader ticker={ticker} liveTickerData={liveTickerData} />
        {/* AI Prediction Display remains the same as previous step */}
      </div>
      <div className="flex-grow">
        <MemoizedTradingChart ticker={ticker} />
      </div>
    </div>
  );
};

export default MainChart;