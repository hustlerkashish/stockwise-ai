// /frontend/src/components/NewsPanel.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiExternalLink } from 'react-icons/fi';

// A helper function to format the time since the news was published
const timeSince = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp * 1000)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const NewsPanel = ({ ticker }) => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;

    const fetchNews = async () => {
      setIsLoading(true);
      try {
        // --- UPDATED LINE ---
        // We now send the clean ticker; the backend will figure out if it's .NS or .BO
        const response = await axios.get(`http://localhost:8000/stock-news?ticker=${ticker}`);
        setNews(response.data);
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setNews([]); // Clear news on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [ticker]); // Re-fetch news whenever the ticker changes

  return (
    <div className="p-4 bg-white">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Latest News for {ticker}</h3>
      {isLoading ? (
        <div className="text-center text-gray-500 py-4">Loading news...</div>
      ) : (
        <div className="space-y-4">
          {news.length > 0 ? (
            news.map((article) => (
              <a 
                href={article.link} 
                key={article.uuid} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900 leading-tight">{article.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {article.publisher} • {timeSince(article.providerPublishTime)}
                    </p>
                  </div>
                  <FiExternalLink className="text-gray-400 ml-4 flex-shrink-0" />
                </div>
              </a>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">No recent news found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsPanel;