// /frontend/src/components/TradeModal.js

import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';
import { FiX } from 'react-icons/fi';

const TradeModal = ({ isOpen, onClose, ticker, currentPrice, tradeType }) => {
    const [quantity, setQuantity] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const estimatedValue = (quantity * currentPrice).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const handleConfirmTrade = async () => {
        setIsProcessing(true);
        setMessage('');
        try {
            const endpoint = tradeType === 'Buy' ? '/portfolio/buy' : '/portfolio/sell';
            const symbol = `${ticker}.NS`; // Assuming NSE stocks
            
            const response = await apiClient.post(endpoint, {
                symbol,
                quantity: parseInt(quantity),
                price: currentPrice
            });

            setMessage(`Success! ${tradeType} order for ${quantity} share(s) of ${ticker} executed.`);
            // Automatically close the modal after a successful trade
            setTimeout(() => {
                onClose();
                setMessage('');
                setQuantity(1);
            }, 2000);

        } catch (error) {
            const errorMessage = error.response?.data?.detail || "An unexpected error occurred.";
            setMessage(`Error: ${errorMessage}`);
            console.error(`Failed to execute ${tradeType} order:`, error);
        } finally {
            setIsProcessing(false);
        }
    };

    const isBuy = tradeType === 'Buy';
    const modalTitle = `${isBuy ? 'Buy' : 'Sell'} ${ticker}`;
    const buttonClass = isBuy ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm text-white border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={24} /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            className="w-full mt-1 p-3 bg-gray-900 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Current Price</span>
                        <span className="font-mono">₹{currentPrice.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between items-center text-lg font-bold border-t border-gray-700 pt-3">
                        <span>Estimated Value</span>
                        <span className="font-mono">₹{estimatedValue}</span>
                    </div>
                </div>

                {message && <p className={`mt-4 text-sm text-center ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}

                <div className="mt-6">
                    <button 
                        onClick={handleConfirmTrade} 
                        disabled={isProcessing || quantity < 1}
                        className={`w-full py-3 rounded-md font-bold text-lg transition-colors disabled:bg-gray-500 ${buttonClass}`}
                    >
                        {isProcessing ? 'Processing...' : `Confirm ${tradeType}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TradeModal;