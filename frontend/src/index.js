import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './app';

// --- ADD THESE TWO LINES ---
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
// --- END OF ADDED LINES ---

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);