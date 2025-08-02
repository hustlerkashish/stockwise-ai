import React from 'react';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

const IndexDisplay = ({ name, ticker, liveData }) => {
    const data = liveData[ticker];
    if (!data) return <div className="font-semibold text-sm text-gray-400">{name} Loading...</div>;

    const isUp = data.change >= 0;
    const colorClass = isUp ? 'text-green-500' : 'text-red-500';

    return (
        <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-600">{name}</span>
            <span className={`font-bold ${colorClass}`}>{data.price.toLocaleString('en-IN')}</span>
            <div className={`flex items-center text-xs ${colorClass}`}>
                {isUp ? <FiArrowUpRight /> : <FiArrowDownRight />}
                <span>{data.change > 0 ? '+' : ''}{data.change.toFixed(2)} ({data.percent_change.toFixed(2)}%)</span>
            </div>
        </div>
    );
};

const MarketHeader = ({ liveData }) => {
  return (
    <div className="bg-white px-4 py-2 flex items-center gap-6 border-b border-gray-200 flex-shrink-0">
      <IndexDisplay name="NIFTY" ticker="^NSEI" liveData={liveData} />
      <IndexDisplay name="SENSEX" ticker="^BSESN" liveData={liveData} />
    </div>
  );
};

export default MarketHeader;