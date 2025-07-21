import React, { useState } from 'react';
import MarketHeader from './MarketHeader';
import Watchlist from './Watchlist';
import MainChart from './MainChart';

const Dashboard = () => {
  const [ticker, setTicker] = useState('TATAPOWER');
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <MarketHeader />
      <div className="flex flex-grow overflow-hidden">
        {/* Watchlist Sidebar (Fixed Width) */}
        <div className="w-1/4 max-w-xs min-w-[250px] flex-shrink-0">
          <Watchlist setTicker={setTicker} />
        </div>
        
        {/* Main Chart Area (Takes Remaining Space) */}
        <div className="flex-grow">
          <MainChart 
            ticker={ticker} 
            prediction={prediction}
            setPrediction={setPrediction}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;