import React from 'react';
import PublicHeader from './public/PublicHeader';
import HeroSection from './public/HeroSection';
import FeaturesSection from './public/FeaturesSection';
import Footer from './public/footer';

const HomePage = () => {
  return (
    <div className="bg-white">
      <PublicHeader />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default HomePage;