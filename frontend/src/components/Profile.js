import React, { useState, useEffect } from 'react';
import { auth, db } from '../api/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const Profile = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.currentUser) {
      const watchlistRef = collection(db, 'users', auth.currentUser.uid, 'watchlist');
      // onSnapshot listens for real-time updates
      const unsubscribe = onSnapshot(watchlistRef, (snapshot) => {
        const stocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWatchlist(stocks);
        setLoading(false);
      });

      // Cleanup listener on component unmount
      return () => unsubscribe();
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-6 p-6 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold mb-2">My Profile</h2>
      <p className="text-gray-400 mb-6">Email: {auth.currentUser?.email}</p>
      
      <h3 className="text-2xl font-bold mb-4">My Watchlist</h3>
      {loading ? (
        <p>Loading watchlist...</p>
      ) : watchlist.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg">
            <thead>
              <tr>
                <th className="text-left py-3 px-4">Ticker</th>
                <th className="text-left py-3 px-4">Added On</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map(stock => (
                <tr key={stock.id} className="border-t border-gray-600">
                  <td className="py-3 px-4 font-mono">{stock.ticker}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {stock.addedAt ? new Date(stock.addedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-400">Your watchlist is empty. Add stocks from the dashboard.</p>
      )}
    </div>
  );
};

export default Profile;