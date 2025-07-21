import React from 'react';
import { FiArrowDownRight } from 'react-icons/fi';

const MarketHeader = () => {
   return (
    <div className="bg-white px-4 py-2 flex items-center gap-6 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-gray-600">SENSEX</span>
        <span className="font-bold text-red-600">81,757.73</span>
        <div className="flex items-center text-xs text-red-600">
          <FiArrowDownRight />
          <span>-501.51 (-0.61%)</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-gray-600">NIFTY</span>
        <span className="font-bold text-red-600">24,968.40</span>
        <div className="flex items-center text-xs text-red-600">
          <FiArrowDownRight />
          <span>-143.05 (-0.57%)</span>
        </div>
      </div>
    </div>
  );
};

export default MarketHeader;