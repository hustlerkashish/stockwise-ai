import React from 'react';
import { FiTrendingUp, FiCpu, FiBarChart2 } from 'react-icons/fi';

const featureList = [
  {
    icon: <FiCpu className="text-blue-500" />,
    title: 'AI-Powered Predictions',
    description: 'Get Buy, Sell, or Hold signals from our advanced ML model, trained on years of market data.'
  },
  {
    icon: <FiBarChart2 className="text-blue-500" />,
    title: 'Live Trading Charts',
    description: 'Access professional-grade, real-time charts powered by TradingView with all the tools you need.'
  },
  {
    icon: <FiTrendingUp className="text-blue-500" />,
    title: 'Real-Time Market Data',
    description: 'Stay on top of the market with a live-updating watchlist and header showing NIFTY & SENSEX movements.'
  }
];

const FeaturesSection = () => {
  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">All Your Trading Tools in One Place</h2>
          <p className="mt-4 text-lg text-gray-600">
            From intelligent analysis to live data, StockWise.AI has you covered.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {featureList.map((feature, index) => (
            <div key={index} className="bg-gray-50 p-8 rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;