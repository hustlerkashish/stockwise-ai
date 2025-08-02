import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <div className="relative bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 py-24 sm:py-32">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
              The Super App for India's Investors
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Leverage the power of AI to get real-time stock insights, live charts, and data-driven predictions. Make your next move with confidence.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                to="/login"
                className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login to Trade
              </Link>
              <Link
                to="/login" // You can change this to a sign-up page later
                className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Open an Account
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Background Image - Replace with your own */}
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover opacity-10"
          src="https://images.pexels.com/photos/7728224/pexels-photo-7728224.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
          alt="Financial charts background"
        />
      </div>
    </div>
  );
};

export default HeroSection;