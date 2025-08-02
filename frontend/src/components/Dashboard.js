import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MarketHeader from './MarketHeader';
import Watchlist from './Watchlist';
import MainChart from './MainChart';

// Define all tickers we need to track in one place
const MARKET_INDEX_TICKERS = ["^NSEI", "^BSESN"]; // NIFTY, SENSEX
const WATCHLIST_TICKERS = [
    "TATAPOWER.NS", "RELIANCE.NS", "INFY.NS", "SBIN.NS", 
    "HDFCBANK.NS", "TCS.NS", "ITC.NS", "AXISBANK.NS"
];
const ALL_TICKERS_TO_FETCH = [...MARKET_INDEX_TICKERS, ...WATCHLIST_TICKERS];

const Dashboard = () => {
  const [ticker, setTicker] = useState('TATAPOWER'); // Note: No '.NS' or 'NSE:' prefix
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [liveData, setLiveData] = useState({}); // State to hold all real-time prices

  useEffect(() => {
    const fetchAllPrices = async () => {
      try {
        const response = await axios.post("http://localhost:8000/prices/batch", {
          tickers: ALL_TICKERS_TO_FETCH
        });
        if (response.data && !response.data.error) {
          setLiveData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch batch prices:", error);
      }
    };

    // Fetch prices immediately on load
    fetchAllPrices();

    // Set up a "heartbeat" to fetch prices every 8 seconds
    const intervalId = setInterval(fetchAllPrices, 8000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this runs only once on mount

  return (
    <div className="flex flex-col h-full">
      <MarketHeader liveData={liveData} />
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/4 max-w-xs min-w-[250px] flex-shrink-0">
          <Watchlist
            watchlistTickers={WATCHLIST_TICKERS}
            liveData={liveData}
            setTicker={setTicker}
          />
        </div>
        <div className="flex-grow">
          <MainChart
            ticker={ticker}
            prediction={prediction}
            setPrediction={setPrediction}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            liveTickerData={liveData[`${ticker}.NS`]}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;