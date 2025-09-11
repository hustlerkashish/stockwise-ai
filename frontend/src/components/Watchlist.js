// /frontend/src/components/Watchlist.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiSearch, FiXCircle, FiPlusCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// --- Search component for finding and adding new stocks ---
const StockSearchBar = ({ addStock, currentWatchlist }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce prevents the API from being called on every single keystroke
  const debouncedFetch = useCallback(
    debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/search-stocks?query=${searchQuery}`);
        // Filter out results that are already in the user's watchlist
        setResults(response.data.filter(res => !currentWatchlist.includes(res.symbol)));
      } catch (error) {
        console.error("Failed to search stocks:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300), 
    [currentWatchlist] // Recreate debounce if the watchlist changes
  );

  useEffect(() => {
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  const handleAddStock = (ticker) => {
    addStock(ticker); // Call function from Dashboard to add stock
    setQuery('');     // Reset search bar
    setResults([]);
  };

  return (
    <div className="relative p-3 border-b-2 border-gray-200">
      <FiSearch className="absolute top-1/2 left-6 -translate-y-1/2 text-gray-400 z-10" />
      <input
        type="text"
        placeholder="Search to add stocks..."
        className="relative w-full bg-gray-100 border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)} // Delay blur to allow click
      />
      
      {/* Search Results Dropdown */}
      {isFocused && query.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-72 overflow-y-auto">
          {isLoading && <div className="p-4 text-center text-gray-500">Searching...</div>}
          
          {!isLoading && results.length > 0 && results.map(stock => (
            <div 
              key={stock.symbol} 
              onClick={() => handleAddStock(stock.symbol)} 
              className="flex justify-between items-center p-3 cursor-pointer hover:bg-blue-50 border-b last:border-b-0"
            >
              <div className="flex flex-col">
                <p className="font-bold text-sm text-gray-900">{stock.symbol.replace(/\.NS$|\.BO$/, '')}</p>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{stock.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {stock.symbol.endsWith('.NS') ? 'NSE' : 'BSE'}
                </span>
                <FiPlusCircle className="text-blue-500 hover:text-blue-600" size={20}/>
              </div>
            </div>
          ))}

          {!isLoading && results.length === 0 && query.length > 1 && (
            <div className="p-4 text-center text-gray-500">No results found for "{query}".</div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Component for each item already in the watchlist ---
const WatchlistItem = ({ ticker, liveData, setTicker, isActive, removeStock }) => {
    const data = liveData[ticker];
    const cleanTicker = ticker.replace(/\.NS$|\.BO$/, '');
    const bgClass = isActive ? 'bg-blue-50' : 'bg-white';
    const textClass = isActive ? 'text-blue-600' : 'text-gray-900';
    const borderClass = isActive ? 'border-l-4 border-blue-500' : 'border-l-4 border-transparent';

    return (
        <li className={`flex items-center p-3 border-b border-gray-100 ${bgClass} ${borderClass}`}>
            <div onClick={() => setTicker(cleanTicker)} className="flex-grow flex justify-between items-center cursor-pointer">
              <p className={`font-semibold text-sm ${textClass}`}>
    <Link to={`/analysis/${cleanTicker}`} className="hover:underline">
      {cleanTicker}
    </Link>
</p>
              {data ? (
                <div className={`text-right font-mono ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <p className="font-semibold text-sm">₹{data.price.toFixed(2)}</p>
                    <p className="text-xs">{data.percent_change.toFixed(2)}%</p>
                </div>
              ) : <div className="text-sm text-gray-400">...</div> }
            </div>
            <button onClick={() => removeStock(ticker)} className="ml-3 p-1 text-gray-400 hover:text-red-500">
              <FiXCircle size={16} />
            </button>
        </li>
    );
};

// --- The main Watchlist component ---
const Watchlist = ({ watchlistTickers, liveData, setTicker, activeTicker, addStock, removeStock }) => {
  return (
    <div className="bg-white h-full flex flex-col">
      <StockSearchBar addStock={addStock} currentWatchlist={watchlistTickers} />
      <div className="flex-grow overflow-y-auto">
        {watchlistTickers.length > 0 ? (
          <ul>
            {watchlistTickers.map((ticker) => (
              <WatchlistItem
                key={ticker}
                ticker={ticker}
                liveData={liveData}
                setTicker={setTicker}
                isActive={activeTicker === ticker.replace(/\.NS$|\.BO$/, '')}
                removeStock={removeStock}
              />
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm mt-4">
            Your watchlist is empty.
            <br />
            Use the search bar above to add stocks.
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for debouncing
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }
}

export default Watchlist;