import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, onAuthStateChanged } from './api/firebase';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Auth from './components/Auth';
import FloatingChatButton from './components/FloatingChatButton';
import ScreenerPage from './components/ScreenerPage';
import HeatmapPage from './components/HeatmapPage'; // 1. Import the new HeatmapPage component
import './App.css';

// Debug: Log all imported components
console.log('Header:', Header);
console.log('Dashboard:', Dashboard);
console.log('ScreenerPage:', ScreenerPage);
console.log('Profile:', Profile);
console.log('Settings:', Settings);
console.log('Auth:', Auth);
console.log('FloatingChatButton:', FloatingChatButton);
console.log('HeatmapPage:', HeatmapPage); // Log for the new component

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);
    return { user, loading };
};

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="bg-[#0c1016] min-h-screen"></div>;
    return user ? children : <Navigate to="/login" />;
};

function App() {
    const { user } = useAuth();
    return (
        <Router>
            <div className="bg-[#0c1016] text-white min-h-screen font-sans flex flex-col">
                {user && <Header user={user} />}
                <main className="flex-grow" style={{ height: user ? 'calc(100vh - 65px)' : '100vh' }}>
                    <Routes>
                        <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
                        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/screener" element={<PrivateRoute><ScreenerPage /></PrivateRoute>} />
                        {/* 2. Add the new route for the heatmap page */}
                        <Route path="/heatmap" element={<PrivateRoute><HeatmapPage /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
                    </Routes>
                </main>
                {user && <FloatingChatButton />}
            </div>
        </Router>
    );
}

export default App;