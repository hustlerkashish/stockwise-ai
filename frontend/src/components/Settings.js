import React, { useState } from 'react';
import { auth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from '../api/firebase';

const Settings = () => {
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const user = auth.currentUser;
    // Re-authenticate user before sensitive operations
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    try {
      await reauthenticateWithCredential(user, credential);
      // Now change the password
      await updatePassword(user, newPassword);
      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError('Failed to update password. Please check your current password and try again.');
      console.error(err);
    }
  };

  const handleDeleteAccount = () => {
    // This is a destructive action, so always ask for confirmation
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      const user = auth.currentUser;
      // You would typically need re-authentication here as well for security
      // user.delete().then(...).catch(...);
      setError("Account deletion feature is under development.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-6 p-6 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold mb-6">Account Settings</h2>
      
      <div className="bg-gray-700 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange}>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current Password"
            className="w-full p-3 mb-4 bg-gray-800 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password (min. 6 characters)"
            className="w-full p-3 mb-4 bg-gray-800 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            required
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded">
            Update Password
          </button>
        </form>
        {message && <p className="text-green-400 mt-4">{message}</p>}
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>

      <div className="bg-red-900/50 mt-6 p-6 rounded-lg border border-red-500">
        <h3 className="text-xl font-bold mb-2 text-red-300">Delete Account</h3>
        <p className="text-red-300 mb-4">This will permanently delete your account and all associated data.</p>
        <button onClick={handleDeleteAccount} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded">
          Delete My Account
        </button>
      </div>
    </div>
  );
};

export default Settings;