// /frontend/src/components/DailyBriefing.js

import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { auth } from '../api/firebase';
import { FiZap, FiCalendar, FiBarChart2 } from 'react-icons/fi';

const DailyBriefing = ({ watchlist }) => {
    const [briefing, setBriefing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.displayName) {
            setUserName(currentUser.displayName.split(' ')[0]);
        }
    }, []);

    useEffect(() => {
        if (!watchlist || watchlist.length === 0) {
            setLoading(false);
            setBriefing([]);
            return;
        }

        const fetchBriefing = async () => {
            setLoading(true);
            try {
                const response = await apiClient.post('/daily-briefing', { watchlist });
                setBriefing(response.data.items || []);
            } catch (error) {
                console.error("Failed to fetch daily briefing:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBriefing();
    }, [watchlist]);

    const getIconForItem = (item) => {
        const lowerItem = item.toLowerCase();
        // UPDATED: Icon colors for dark background
        if (lowerItem.includes('earnings')) return <FiCalendar className="text-purple-300" />;
        if (lowerItem.includes('volume')) return <FiBarChart2 className="text-blue-300" />;
        return <FiZap className="text-yellow-300" />;
    };
    
    if (loading) {
        return <div className="p-4 text-sm text-center text-gray-400">Generating your daily briefing...</div>;
    }

    // UPDATED: Background and text colors for dark theme
    if (briefing.length === 0) {
        return (
            <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white">Good Morning, {userName}!</h3>
                <p className="text-gray-400 mt-2">No major alerts for your watchlist today. The market is quiet.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white">Good Morning, {userName}! Here's your briefing:</h3>
            <ul className="mt-4 space-y-3">
                {briefing.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                        <span className="mt-1">{getIconForItem(item)}</span>
                        {/* UPDATED: Text color for dark theme */}
                        <span className="text-gray-300">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DailyBriefing;