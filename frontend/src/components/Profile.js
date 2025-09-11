import React, { useState, useEffect } from 'react';
import { auth, db } from '../api/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
// After
import { collection, onSnapshot, doc, addDoc, deleteDoc, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
// CHANGED: Replaced FiBank with FiHome
import { FiEdit2, FiTrash2, FiPlus, FiUser, FiBarChart2, FiHome, FiHelpCircle, FiChevronRight } from 'react-icons/fi';

// --- A custom hook to manage authentication state ---
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  return { user, loading };
};

// --- A custom hook to fetch user profile data from Firestore ---
const useUserProfile = (userId) => {
    const [userData, setUserData] = useState(null);
    useEffect(() => {
        if (!userId) return;
        const userDocRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
                setUserData(snap.data());
            } else {
                const currentUser = auth.currentUser;
                const defaultProfile = {
                    displayName: currentUser.displayName || "Anonymous User",
                    photoURL: currentUser.photoURL || '',
                    email: currentUser.email || 'No email',
                    bank: { bankName: '', accountNumber: '', ifsc: '' },
                    segments: ['Equity']
                };
                setDoc(userDocRef, defaultProfile);
            }
        });
        return () => unsubscribe();
    }, [userId]);
    return { userData };
};

// --- Reusable UI Components ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-700 p-6 rounded-lg w-full max-w-md animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

const FormInput = ({ label, ...props }) => (
    <div>
        <label className="block text-gray-400 mb-2 text-sm">{label}</label>
        <input {...props} className="w-full p-2 bg-gray-800 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
);

const SubmitButton = ({ children, ...props }) => (
    <button {...props} className="w-full py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-gray-500 transition-colors">{children}</button>
);

// --- Form Components for Modals ---
const PersonalDetailsForm = ({ user, userData, onClose }) => {
    const [displayName, setDisplayName] = useState(user.displayName || userData.displayName);
    const [photoURL, setPhotoURL] = useState(user.photoURL || userData.photoURL);
    const [isSaving, setIsSaving] = useState(false);
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProfile(user, { displayName, photoURL });
            await updateDoc(doc(db, 'users', user.uid), { displayName, photoURL });
            onClose();
        } catch (error) { console.error("Error updating profile:", error); }
        finally { setIsSaving(false); }
    };
    return (
        <form onSubmit={handleSave} className="space-y-4">
            <FormInput label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <FormInput label="Photo URL" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} />
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Cancel</button>
                <SubmitButton type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</SubmitButton>
            </div>
        </form>
    );
};
const BankDetailsForm = ({ user, userData, onClose }) => {
    const [bankDetails, setBankDetails] = useState(userData.bank || { bankName: '', accountNumber: '', ifsc: '' });
    const [isSaving, setIsSaving] = useState(false);
    const handleChange = (e) => setBankDetails({...bankDetails, [e.target.name]: e.target.value});
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), { bank: bankDetails });
            onClose();
        } catch (error) { console.error("Error updating bank details:", error); }
        finally { setIsSaving(false); }
    };
    return (
        <form onSubmit={handleSave} className="space-y-4">
            <FormInput label="Bank Name" name="bankName" value={bankDetails.bankName} onChange={handleChange} />
            <FormInput label="Account Number" name="accountNumber" value={bankDetails.accountNumber} onChange={handleChange} />
            <FormInput label="IFSC Code" name="ifsc" value={bankDetails.ifsc} onChange={handleChange} />
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Cancel</button>
                <SubmitButton type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</SubmitButton>
            </div>
        </form>
    );
};

const SegmentsForm = ({ user, userData, onClose }) => {
    const ALL_SEGMENTS = ['Equity', 'Futures & Options', 'Commodity', 'Currency'];
    const [segments, setSegments] = useState(userData.segments || []);
    const [isSaving, setIsSaving] = useState(false);
    const handleToggle = (segment) => setSegments(prev => prev.includes(segment) ? prev.filter(s => s !== segment) : [...prev, segment]);
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), { segments });
            onClose();
        } catch (error) { console.error("Error updating segments:", error); }
        finally { setIsSaving(false); }
    };
     return (
        <form onSubmit={handleSave} className="space-y-4">
            {ALL_SEGMENTS.map(s => (
                <label key={s} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <span className="font-medium text-gray-300">{s}</span>
                    <input type="checkbox" checked={segments.includes(s)} onChange={() => handleToggle(s)} className="h-5 w-5 rounded text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-500" />
                </label>
            ))}
            <div className="flex justify-end gap-4 pt-4">
                 <button type="button" onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-500">Cancel</button>
                <SubmitButton type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Segments'}</SubmitButton>
            </div>
        </form>
    );
};

// --- The Main Profile Page Component ---
const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { userData } = useUserProfile(user?.uid);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [newTicker, setNewTicker] = useState('');
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    if (user) {
      const watchlistRef = collection(db, 'users', user.uid, 'watchlist');
      const unsubscribe = onSnapshot(watchlistRef, (snapshot) => {
        setWatchlist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setWatchlistLoading(false);
      });
      return () => unsubscribe();
    } else {
        setWatchlist([]);
        setWatchlistLoading(false);
    }
  }, [user]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newTicker.trim() || !user) return;
    try {
        await addDoc(collection(db, 'users', user.uid, 'watchlist'), { ticker: newTicker.toUpperCase(), addedAt: serverTimestamp() });
        setNewTicker('');
    } catch (error) { console.error("Error adding stock:", error); }
  };

  const handleRemoveStock = async (stockId) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'watchlist', stockId));
    } catch (error) { console.error("Error removing stock:", error); }
  };

  if (authLoading || (user && !userData)) {
    return <div className="text-center p-8 text-white">Loading user profile...</div>;
  }
  if (!user) {
    return <div className="text-center p-8 text-white">Please sign in to view your profile.</div>;
  }

  const manageAccountItems = [
      { title: 'Personal Details', icon: <FiUser />, modal: 'personal' },
      // CHANGED: Replaced FiBank with FiHome
      { title: 'Bank Account', icon: <FiHome />, modal: 'bank' },
      { title: 'Active Segments', icon: <FiBarChart2 />, modal: 'segments' },
  ];

  const renderModal = () => {
      switch(activeModal) {
          case 'personal': return <PersonalDetailsForm user={user} userData={userData} onClose={() => setActiveModal(null)} />;
          case 'bank': return <BankDetailsForm user={user} userData={userData} onClose={() => setActiveModal(null)} />;
          case 'segments': return <SegmentsForm user={user} userData={userData} onClose={() => setActiveModal(null)} />;
          default: return null;
      }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 p-6 bg-gray-800 rounded-lg text-white">
      <Modal isOpen={!!activeModal} onClose={() => setActiveModal(null)} title={`${activeModal} Details`}>
        {renderModal()}
      </Modal>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <img 
              src={userData.photoURL || `https://placehold.co/64x64/374151/E0E7FF?text=${userData.displayName?.[0] || 'A'}`} 
              alt="Avatar" 
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" 
            />
            <div>
                <h2 className="text-3xl font-bold">{userData.displayName}</h2>
                <p className="text-gray-400">{userData.email}</p>
                 <div className="mt-2 inline-block bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-semibold">KYC PENDING</div>
            </div>
        </div>
        <button onClick={() => setActiveModal('personal')} className="flex items-center gap-2 py-2 px-4 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors">
            <FiEdit2 size={14} /> Edit Profile
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h3 className="text-2xl font-bold mb-4">Manage Account</h3>
            <div className="space-y-2">
                {manageAccountItems.map(item => (
                    <button key={item.modal} onClick={() => setActiveModal(item.modal)} className="w-full flex justify-between items-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">{item.icon}<span>{item.title}</span></div>
                        <FiChevronRight />
                    </button>
                ))}
            </div>
        </div>
        
        <div>
          <h3 className="text-2xl font-bold mb-4">My Watchlist</h3>
          <form onSubmit={handleAddStock} className="flex gap-2 mb-4">
              <input type="text" value={newTicker} onChange={(e) => setNewTicker(e.target.value)} placeholder="e.g., RELIANCE.NS" className="flex-grow p-3 bg-gray-900 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" disabled={!newTicker.trim()} className="flex items-center gap-2 p-3 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-gray-500"><FiPlus /></button>
          </form>

          {watchlistLoading ? (<p>Loading watchlist...</p>) : watchlist.length > 0 ? (
            <div className="space-y-2">
              {watchlist.map(stock => (
                <div key={stock.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <span className="font-mono">{stock.ticker}</span>
                    <button onClick={() => handleRemoveStock(stock.id)} className="text-red-500 hover:text-red-400 p-1"><FiTrash2 /></button>
                </div>
              ))}
            </div>
          ) : (<p className="text-gray-400 text-center py-4">Your watchlist is empty.</p>)}
        </div>
      </div>
    </div>
  );
};

export default Profile;