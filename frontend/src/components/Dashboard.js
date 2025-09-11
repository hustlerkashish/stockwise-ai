// /frontend/src/components/Dashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MarketHeader from './MarketHeader';
import Watchlist from './Watchlist';
import MainChart from './MainChart';

const MARKET_INDEX_TICKERS = ["^NSEI", "^BSESN"];

const INITIAL_WATCHLIST = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "SBIN.NS", "ITC.NS"
];

const Dashboard = () => {
  const [ticker, setTicker] = useState('RELIANCE');
  const [prediction, setPrediction] = useState(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [liveData, setLiveData] = useState({}); // Initialized as {}

  const [watchlist, setWatchlist] = useState(() => {
    const savedWatchlist = localStorage.getItem('stockwise_watchlist');
    return savedWatchlist ? JSON.parse(savedWatchlist) : INITIAL_WATCHLIST;
  });

  const addStockToWatchlist = async (newTicker) => {
    if (watchlist.includes(newTicker)) {
      setTicker(newTicker.replace(/\.NS$|\.BO$/, ''));
      return;
    }
    const updatedWatchlist = [...watchlist, newTicker];
    setWatchlist(updatedWatchlist);
    setTicker(newTicker.replace(/\.NS$|\.BO$/, ''));
    try {
      const response = await axios.post("http://localhost:8000/prices/batch", { tickers: [newTicker] });
      if (response.data && response.data[newTicker]) {
        setLiveData(prevData => ({ ...prevData, ...response.data }));
      }
    } catch (error) {
      console.error(`Failed to fetch instant price for ${newTicker}:`, error);
    }
  };

  const removeStockFromWatchlist = (tickerToRemove) => {
    const updatedWatchlist = watchlist.filter(t => t !== tickerToRemove);
    setWatchlist(updatedWatchlist);
    if (ticker.toUpperCase() === tickerToRemove.replace(/\.NS$|\.BO$/, '')) {
      if (updatedWatchlist.length > 0) {
        setTicker(updatedWatchlist[0].replace(/\.NS$|\.BO$/, ''));
      } else {
        setTicker('');
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('stockwise_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const fetchAllPrices = async () => {
      const allTickersToFetch = [...new Set([...MARKET_INDEX_TICKERS, ...watchlist])];
      if (allTickersToFetch.length === 0) return;
      try {
        const response = await axios.post("http://localhost:8000/prices/batch", { tickers: allTickersToFetch });
        if (response.data && !response.data.error) {
          setLiveData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch batch prices:", error);
      }
    };
    fetchAllPrices();
    const intervalId = setInterval(fetchAllPrices, 15000);
    return () => clearInterval(intervalId);
  }, [watchlist]);

  useEffect(() => {
    setPrediction(null);
  }, [ticker]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <MarketHeader liveData={liveData} />
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/4 max-w-xs min-w-[250px] flex-shrink-0 border-r border-gray-200 bg-white">
          <Watchlist
            watchlistTickers={watchlist}
            liveData={liveData}
            setTicker={setTicker}
            activeTicker={ticker}
            addStock={addStockToWatchlist}
            removeStock={removeStockFromWatchlist}
          />
        </div>
        <div className="flex-grow">
          <MainChart
            ticker={ticker}
            prediction={prediction}
            setPrediction={setPrediction}
            isLoading={isLoadingPrediction}
            setIsLoading={setIsLoadingPrediction}
            liveData={liveData}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;