import React from 'react';
import TradingViewWidget from 'react-tradingview-widget';
import axios from 'axios';
import { FiTrendingUp, FiTrendingDown, FiPauseCircle } from 'react-icons/fi';

const AiPredictionDisplay = ({ prediction, isLoading, handleGetPrediction }) => {
  let content;

  if (isLoading) {
    content = <div className="text-sm text-gray-400">Analyzing...</div>;
  } else if (prediction) {
    if (prediction.recommendation === "Error") {
        content = <div className="text-sm text-red-400">Error: {prediction.confidence_score}</div>
    } else {
        const details = {
            Buy: { color: 'green', icon: <FiTrendingUp />, text: 'AI Signal: Buy' },
            Sell: { color: 'red', icon: <FiTrendingDown />, text: 'AI Signal: Sell' },
            Hold: { color: 'yellow', icon: <FiPauseCircle />, text: 'AI Signal: Hold' },
        };
        const current = details[prediction.recommendation];
        content = (
            <div className={`flex items-center gap-2 text-sm font-bold text-${current.color}-400`}>
                {current.icon}
                <span>{current.text} ({prediction.confidence_score})</span>
            </div>
        );
    }
  } else {
    content = null; // Don't show anything before the first click
  }

  return (
    <div className="flex items-center gap-4">
        {content}
        <button onClick={handleGetPrediction} className="bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-blue-700">
            Get AI Prediction
        </button>
    </div>
  );
};


const MainChart = ({ ticker, prediction, setPrediction, isLoading, setIsLoading }) => {
  const handleGetPrediction = async () => {
    setIsLoading(true);
    setPrediction(null);
    try {
      const apiTicker = ticker + '.NS'; // Format for Yahoo Finance API // Format for Yahoo Finance API
      const response = await axios.post("http://127.0.0.1:8000/predict", { ticker: apiTicker });
      // Handle the case where the backend returns an error object
      if (response.data.error) {
        setPrediction({ recommendation: 'Error', ticker: ticker, confidence_score: response.data.error });
      } else {
        setPrediction(response.data);
      }
    } catch (error) {
      console.error("Error fetching prediction:", error);
      const errorDetail = error.response ? error.response.data.detail : "Network connection failed.";
      setPrediction({ recommendation: 'Error', ticker: ticker, confidence_score: errorDetail });
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#0c1016]">
      <div className="flex items-center justify-between p-2 pl-4 border-b border-gray-700/50">
        <h2 className="font-bold text-white text-lg">{ticker.replace('NSE:', '')}</h2>
        <AiPredictionDisplay 
            prediction={prediction} 
            isLoading={isLoading} 
            handleGetPrediction={handleGetPrediction}
        />
      </div>
      <div className="flex-grow">
        <TradingViewWidget
          symbol={ticker}
          theme="Light"
          autosize
          style="1"
          locale="in"
          toolbar_bg="#0c1016"
          enable_publishing={false}
          hide_side_toolbar={false}
          allow_symbol_change={true}
          container_id="tradingview_chart_container"
        />
      </div>
    </div>
  );
};
export default MainChart