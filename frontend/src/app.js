import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, onAuthStateChanged } from './api/firebase';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Auth from './components/Auth';
import FloatingChatButton from './components/FloatingChatButton';
import './App.css';

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