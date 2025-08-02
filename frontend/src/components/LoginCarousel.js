import React from 'react';
import Slider from 'react-slick';

// Simple, stylish SVG illustrations for each slide
const AITrendIllustration = () => (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="260" rx="20" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2"/>
        <path d="M 50 200 Q 120 80, 200 150 T 350 100" stroke="#3B82F6" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <circle cx="350" cy="100" r="8" fill="#3B82F6" />
        <rect x="50" y="230" width="300" height="10" rx="5" fill="#F3F4F6"/>
        <rect x="50" y="250" width="250" height="10" rx="5" fill="#F3F4F6"/>
    </svg>
);
const AIPredictionIllustration = () => (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="260" rx="20" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2"/>
        <rect x="50" y="50" width="120" height="60" rx="10" fill="#D1FAE5"/>
        <text x="110" y="85" fontFamily="Arial" fontSize="20" fontWeight="bold" fill="#065F46" textAnchor="middle">BUY</text>
        <rect x="230" y="50" width="120" height="60" rx="10" fill="#FEE2E2"/>
        <text x="290" y="85" fontFamily="Arial" fontSize="20" fontWeight="bold" fill="#991B1B" textAnchor="middle">SELL</text>
        <rect x="140" y="140" width="120" height="60" rx="10" fill="#FEF3C7"/>
        <text x="200" y="175" fontFamily="Arial" fontSize="20" fontWeight="bold" fill="#92400E" textAnchor="middle">HOLD</text>
    </svg>
);
const AIChatIllustration = () => (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="360" height="260" rx="20" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2"/>
        <path d="M 60 80 H 250 a 10 10 0 0 1 10 10 V 120 a 10 10 0 0 1 -10 10 H 70 a 10 10 0 0 1 -10 -10 V 90 a 10 10 0 0 1 10 -10 Z" fill="#EFF6FF"/>
        <text x="75" y="105" fontFamily="Arial" fontSize="14" fill="#1E40AF">What is the trend for INFY?</text>
        <path d="M 340 150 H 150 a 10 10 0 0 0 -10 10 V 190 a 10 10 0 0 0 10 10 H 330 a 10 10 0 0 0 10 -10 V 160 a 10 10 0 0 0 -10 -10 Z" fill="#F3F4F6"/>
        <text x="155" y="175" fontFamily="Arial" fontSize="14" fill="#374151">The AI signal is currently 'Buy'.</text>
    </svg>
);

const slideData = [
  {
    illustration: <AITrendIllustration />,
    title: 'Access Advanced Trading Analytics',
    description: 'Analyse your entire trading activity, uncover hidden patterns, and make smarter trades.',
  },
  {
    illustration: <AIPredictionIllustration />,
    title: 'AI-Powered Predictions',
    description: 'Get clear Buy, Sell, and Hold signals for your favorite stocks, powered by our advanced machine learning models.',
  },
  {
    illustration: <AIChatIllustration />,
    title: 'Conversational AI Assistant',
    description: 'Ask our Gemini-powered assistant about market trends and stock forecasts in plain English.',
  },
];

const LoginCarousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    dotsClass: 'slick-dots custom-dots',
  };

  return (
    <div className="w-full h-full">
      <Slider {...settings}>
        {slideData.map((slide, index) => (
          <div key={index} className="text-center px-12">
            <div className="flex justify-center">{slide.illustration}</div>
            <h2 className="mt-8 text-3xl font-bold text-gray-800">{slide.title}</h2>
            <p className="mt-4 text-gray-600 max-w-md mx-auto">{slide.description}</p>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default LoginCarousel;