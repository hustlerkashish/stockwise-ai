import React from 'react';
import { FiSearch } from 'react-icons/fi';

const WatchlistItem = ({ ticker, liveData, setTicker }) => {
    const data = liveData[ticker];
    const cleanTicker = ticker.replace('.NS', '');

    if (!data) {
        return (
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
                <p className="font-bold text-sm text-gray-400">{cleanTicker}</p>
                <p className="text-sm text-gray-400">Loading...</p>
            </div>
        );
    }
    
    const isUp = data.change >= 0;
    const colorClass = isUp ? 'text-green-500' : 'text-red-500';

    return (
        <div
            onClick={() => setTicker(cleanTicker)}
            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100"
        >
            <div>
                <p className={`font-bold text-sm ${colorClass}`}>{cleanTicker}</p>
            </div>
            <div className="text-right">
                <p className={`font-semibold text-sm ${colorClass}`}>{data.price.toFixed(2)}</p>
                <p className={`text-xs ${colorClass}`}>
                    {data.change > 0 ? '+' : ''}{data.change.toFixed(2)} ({data.percent_change.toFixed(2)}%)
                </p>
            </div>
        </div>
    );
};

const Watchlist = ({ watchlistTickers, liveData, setTicker }) => {
  return (
    <div className="bg-white h-full flex flex-col border-r border-gray-200">
      <div className="p-2 border-b border-gray-200">
        {/* Search input remains the same */}
      </div>
      <div className="flex-grow overflow-y-auto">
        {watchlistTickers.map((ticker) => (
          <WatchlistItem
            key={ticker}
            ticker={ticker}
            liveData={liveData}
            setTicker={setTicker}
          />
        ))}
      </div>
    </div>
  );
};

export default Watchlist;