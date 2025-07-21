import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signOut as firebaseSignOut } from '../api/firebase';
import { FiTrendingUp, FiLogOut, FiSettings, FiUser } from 'react-icons/fi'; // Icons

const Header = ({ user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    firebaseSignOut(auth)
      .then(() => navigate('/login'))
      .catch(error => console.error("Sign out error", error));
  };

   return (
    <header className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-black">
        <FiTrendingUp className="text-blue-500" />
        StockWise.AI
      </Link>
      {user && (
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 bg-gray-100 p-2 rounded-md hover:bg-gray-200 transition-colors">
            <FiUser className="text-gray-600"/>
            <span className="text-sm font-medium text-gray-700">{user.email}</span>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
              <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <FiUser /> Profile & Watchlist
              </Link>
              <Link to="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <FiSettings /> Settings
              </Link>
              <div className="border-t border-gray-200 my-1"></div>
              <button onClick={handleSignOut} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <FiLogOut /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;