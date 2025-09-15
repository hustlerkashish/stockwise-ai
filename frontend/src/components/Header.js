import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { auth, signOut as firebaseSignOut } from '../api/firebase';
// 1. Import the FiMap icon
import { FiTrendingUp, FiLogOut, FiSettings, FiUser, FiFilter, FiGrid, FiMap } from 'react-icons/fi';
import { FiBriefcase } from 'react-icons/fi'; 

const Header = ({ user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    setDropdownOpen(false);
    firebaseSignOut(auth)
      .then(() => navigate('/login'))
      .catch(error => console.error("Sign out error", error));
  };

  const getLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
    }`;

  return (
    <header className="bg-white p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-black">
          <FiTrendingUp className="text-blue-500" />
          <span>StockWise.AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" className={getLinkClass}>
            <FiGrid size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/screener" className={getLinkClass}>
            <FiFilter size={16} />
            Screener
          </NavLink>
          {/* 2. Add the new link to the Heatmap page here */}
          <NavLink to="/heatmap" className={getLinkClass}>
            <FiMap size={16} />
            Market Heatmap
          </NavLink>
          <NavLink to="/portfolio" className={getLinkClass}>
        <FiBriefcase size={16} />
        Portfolio
          </NavLink>
        </nav>
      </div>

      {user && (
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} onBlur={() => setTimeout(() => setDropdownOpen(false), 150)} className="flex items-center space-x-2 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
            <img src={user.photoURL || `https://placehold.co/32x32/E0E7FF/4F46E5?text=${user.email[0].toUpperCase()}`} alt="avatar" className="w-8 h-8 rounded-full" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <FiUser /> Profile
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