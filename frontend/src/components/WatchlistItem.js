import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WatchlistItem = ({ stock, setTicker }) => {
  // State to hold the live price data for this specific stock
  const [liveData, setLiveData] = useState({
    price: stock.price,
    change: stock.change,
    percent_change: stock.percent,
    dir: stock.dir
  });

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/price/${stock.name}.NS`);
        const data = response.data;
        if (!data.error) {
          setLiveData({
            price: data.price,
            change: data.change,
            percent_change: data.percent_change,
            dir: data.change >= 0 ? 'up' : 'down'
          });
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${stock.name}.NS`, error);
      }
    };

    // Fetch the price immediately when the component mounts
    fetchPrice();

    // Then, set up an interval to fetch the price every 10 seconds (10000 milliseconds)
    const intervalId = setInterval(fetchPrice, 10000);

    // This is a crucial cleanup step. When the component is unmounted,
    // it clears the interval to prevent memory leaks.
    return () => clearInterval(intervalId);
  }, [stock.name]); // Re-run the effect if the stock name changes

  return (
    <div
      onClick={() => setTicker(stock.name)}
      className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100"
    >
      <div>
        <p className={`font-bold text-sm ${liveData.dir === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {stock.name}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-semibold text-sm ${liveData.dir === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {liveData.price.toFixed(2)}
        </p>
        <p className={`text-xs ${liveData.dir === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {liveData.change > 0 ? '+' : ''}{liveData.change.toFixed(2)} ({liveData.percent_change.toFixed(2)}%)
        </p>
      </div>
    </div>
  );
};

export default WatchlistItem;