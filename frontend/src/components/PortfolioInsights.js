import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { FiAlertTriangle, FiGift, FiInfo } from 'react-icons/fi';

const PortfolioInsights = () => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/portfolio/insights');
                setInsights(response.data.insights || []);
            } catch (error) {
                console.error("Failed to fetch portfolio insights:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    const getIconForInsight = (insight) => {
        const lowerInsight = insight.toLowerCase();
        if (lowerInsight.includes('risk') || lowerInsight.includes('overbought')) {
            return <FiAlertTriangle className="text-yellow-400 flex-shrink-0" />;
        }
        if (lowerInsight.includes('opportunity') || lowerInsight.includes('oversold')) {
            return <FiGift className="text-green-400 flex-shrink-0" />;
        }
        return <FiInfo className="text-blue-400 flex-shrink-0" />;
    };

    if (loading) {
        return <div className="text-center text-gray-500 text-sm">Analyzing portfolio...</div>;
    }

    if (insights.length === 0) {
        return null; // Don't show the component if there are no insights
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mt-8">
            <h3 className="text-xl font-bold mb-4 text-white">AI Portfolio Insights</h3>
            <div className="space-y-3">
                {insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm text-gray-300">
                        {getIconForInsight(insight)}
                        <p>{insight}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PortfolioInsights;