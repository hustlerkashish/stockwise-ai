import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from '../api/firebase';
import LoginCarousel from './LoginCarousel'; // Import the new carousel
import { FiMail, FiLock } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const Auth = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      setError("Failed to sign in with Google.");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    const action = isLoginView ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
    try {
      await action(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' ? 'Invalid email or password.' : 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex h-screen bg-white text-black">
      {/* Left Panel - Animated Carousel */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-12">
        <LoginCarousel />
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-sm w-full">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h1 className="text-3xl font-bold text-blue-600 text-center mb-2">StockWise.AI</h1>
            <p className="text-center text-gray-700 font-semibold mb-8">
              Welcome to India's fastest platform!
            </p>
            
            <form onSubmit={handleEmailAuth} className="space-y-5">
              <div className="relative">
                <FiMail className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="relative">
                <FiLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg"
              >
                {isLoginView ? 'PROCEED' : 'REGISTER'}
              </button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FcGoogle className="text-xl" />
              <span className="text-gray-600 font-semibold text-sm">INSTANT LOGIN WITH GOOGLE</span>
            </button>

            <p className="text-center text-sm text-gray-600 mt-8">
              {isLoginView ? "Don't have an account?" : "Already have an account?"}
              <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-blue-600 hover:underline ml-1">
                {isLoginView ? 'Register Now!' : 'Login Now!'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;