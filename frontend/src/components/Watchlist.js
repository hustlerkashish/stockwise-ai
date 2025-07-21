import React from 'react';
import { FiSearch } from 'react-icons/fi';

// Mock data to replicate the look of a real watchlist
const watchlistData = [
  { name: 'TATAPOWER', price: 407.90, change: -5.55, percent: -1.34, dir: 'down' },
  { name: 'IDEA', price: 7.72, change: -0.04, percent: -0.52, dir: 'down' },
  { name: 'BPCL', price: 343.50, change: -3.25, percent: -0.94, dir: 'down' },
  { name: 'NHPC', price: 7.03, change: -0.81, percent: -0.92, dir: 'down' },
  { name: 'GAIL', price: 185.23, change: -0.06, percent: -0.03, dir: 'down' },
  { name: 'SAIL', price: 136.45, change: 2.85, percent: 2.13, dir: 'up' },
  { name: 'COALINDIA', price: 388.50, change: 2.60, percent: 0.67, dir: 'up' },
  { name: 'IOC', price: 150.06, change: -0.95, percent: -0.60, dir: 'down' },
  { name: 'ONGC', price: 246.31, change: 2.44, percent: 1.00, dir: 'up' },
  { name: 'NTPC', price: 342.10, change: -0.55, percent: -0.16, dir: 'down' },
  { name: 'POWERGRID', price: 294.15, change: -2.43, percent: -0.83, dir: 'down' },
  { name: 'WIPRO', price: 266.95, change: 6.35, percent: 2.44, dir: 'up' },
  { name: 'JSWSTEEL', price: 1034.40, change: 0.20, percent: 0.02, dir: 'up' },
];

const Watchlist = ({ setTicker }) => {
  return (
    <div className="bg-white h-full flex flex-col border-r border-gray-200">
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search e.g. TATA"
            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 pl-10 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {watchlistData.map((stock) => (
          <div
            key={stock.name}
            onClick={() => setTicker(stock.name)}
            className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100"
          >
            <div>
              <p className={`font-bold text-sm ${stock.dir === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {stock.name}
              </p>
            </div>
            <div className="text-right">
              <p className={`font-semibold text-sm ${stock.dir === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {stock.price.toFixed(2)}
              </p>
              <p className={`text-xs ${stock.dir === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percent.toFixed(2)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
