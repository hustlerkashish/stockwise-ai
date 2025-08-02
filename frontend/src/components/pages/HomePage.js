import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app'; // We'll need to export this from App.js
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import Footer from './Footer';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If a user is already logged in, redirect them to the dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="bg-white text-gray-800">
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default HomePage;