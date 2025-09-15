import React, { useState, useEffect } from 'react';
import axios from 'axios';

// A helper function to format the time since the news was published
const timeSince = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp * 1000)) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

// --- A dedicated component for each news card ---
const NewsCard = ({ article, index }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    // A fallback image in case an article has none.
    const placeholderImage = "/placeholder.png";

    // Use the backend proxy for images to avoid CORS errors
    const proxiedImageUrl = article.imageUrl 
        ? `http://localhost:8000/image-proxy?url=${encodeURIComponent(article.imageUrl)}`
        : placeholderImage;

    return (
        <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
            style={{
                opacity: 0,
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`
            }}
        >
            <div className="overflow-hidden rounded-t-lg h-40 bg-gray-200">
                <img
                    src={proxiedImageUrl}
                    alt={article.title}
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsImageLoaded(true)}
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />
            </div>
            <div className="p-4">
                <p className="text-xs text-blue-600 font-semibold">{article.publisher}</p>
                <h4 className="font-bold text-gray-800 leading-tight mt-1 group-hover:text-blue-700 transition-colors">
                    {article.title}
                </h4>
                <p className="text-xs text-gray-500 mt-2">
                    {timeSince(article.providerPublishTime)}
                </p>
            </div>
        </a>
    );
};

const NewsPanel = ({ ticker }) => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;

    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/stock-news?ticker=${ticker}`);
        setNews(response.data);
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [ticker]);

  return (
    <div className="p-4 md:p-6 bg-white">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Latest News for {ticker}</h3>
      {isLoading ? (
        <div className="text-center text-gray-500 py-8">Loading news...</div>
      ) : (
        <>
          {news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((article, index) => (
                <NewsCard article={article} key={article.uuid} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No recent news found.</div>
          )}
        </>
      )}
    </div>
  );
};

// REMINDER: Make sure this animation code is in your /frontend/src/index.css file
/*
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
*/

export default NewsPanel;