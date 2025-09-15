import React, { useState, useEffect } from "react";
import { auth, db } from "../api/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUser,
  FiBarChart2,
  FiHome,
  FiChevronRight,
  FiMoon,
  FiSun,
  FiType,
} from "react-icons/fi";

// --- Custom hook for auth state ---
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

// --- Custom hook for user profile ---
const useUserProfile = (userId) => {
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    if (!userId) return;
    const userDocRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        const currentUser = auth.currentUser;
        const defaultProfile = {
          displayName: currentUser.displayName || "Anonymous User",
          photoURL: currentUser.photoURL || "",
          email: currentUser.email || "No email",
          bank: { bankName: "", accountNumber: "", ifsc: "" },
          segments: ["Equity"],
        };
        setDoc(userDocRef, defaultProfile);
      }
    });
    return () => unsubscribe();
  }, [userId]);
  return { userData };
};

// --- Modal ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const FormInput = ({ label, ...props }) => (
  <div>
    <label className="block text-gray-600 mb-1 text-sm font-medium">
      {label}
    </label>
    <input
      {...props}
      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const SubmitButton = ({ children, ...props }) => (
  <button
    {...props}
    className="w-full py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-400 transition-colors"
  >
    {children}
  </button>
);

// --- Forms ---
const PersonalDetailsForm = ({ user, userData, onClose }) => {
  const [displayName, setDisplayName] = useState(
    user.displayName || userData.displayName
  );
  const [photoURL, setPhotoURL] = useState(
    user.photoURL || userData.photoURL
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName, photoURL });
      await updateDoc(doc(db, "users", user.uid), { displayName, photoURL });
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <FormInput
        label="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <FormInput
        label="Photo URL"
        value={photoURL}
        onChange={(e) => setPhotoURL(e.target.value)}
      />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
        >
          Cancel
        </button>
        <SubmitButton type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </SubmitButton>
      </div>
    </form>
  );
};

const BankDetailsForm = ({ user, userData, onClose }) => {
  const [bankDetails, setBankDetails] = useState(
    userData.bank || { bankName: "", accountNumber: "", ifsc: "" }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) =>
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { bank: bankDetails });
      onClose();
    } catch (error) {
      console.error("Error updating bank details:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <FormInput
        label="Bank Name"
        name="bankName"
        value={bankDetails.bankName}
        onChange={handleChange}
      />
      <FormInput
        label="Account Number"
        name="accountNumber"
        value={bankDetails.accountNumber}
        onChange={handleChange}
      />
      <FormInput
        label="IFSC Code"
        name="ifsc"
        value={bankDetails.ifsc}
        onChange={handleChange}
      />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
        >
          Cancel
        </button>
        <SubmitButton type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </SubmitButton>
      </div>
    </form>
  );
};

const SegmentsForm = ({ user, userData, onClose }) => {
  const ALL_SEGMENTS = ["Equity", "Futures & Options", "Commodity", "Currency"];
  const [segments, setSegments] = useState(userData.segments || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (segment) =>
    setSegments((prev) =>
      prev.includes(segment)
        ? prev.filter((s) => s !== segment)
        : [...prev, segment]
    );

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { segments });
      onClose();
    } catch (error) {
      console.error("Error updating segments:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {ALL_SEGMENTS.map((s) => (
        <label
          key={s}
          className="flex items-center justify-between p-2 border rounded-md cursor-pointer"
        >
          <span>{s}</span>
          <input
            type="checkbox"
            checked={segments.includes(s)}
            onChange={() => handleToggle(s)}
            className="h-5 w-5"
          />
        </label>
      ))}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
        >
          Cancel
        </button>
        <SubmitButton type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Segments"}
        </SubmitButton>
      </div>
    </form>
  );
};

// --- Profile Page ---
const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { userData } = useUserProfile(user?.uid);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [newTicker, setNewTicker] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [font, setFont] = useState("sans");
  const [fontSize, setFontSize] = useState("base"); // ✅ new

  useEffect(() => {
    if (user) {
      const watchlistRef = collection(db, "users", user.uid, "watchlist");
      const unsubscribe = onSnapshot(watchlistRef, (snapshot) => {
        setWatchlist(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
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
      await addDoc(collection(db, "users", user.uid, "watchlist"), {
        ticker: newTicker.toUpperCase(),
        addedAt: serverTimestamp(),
      });
      setNewTicker("");
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  };

  const handleRemoveStock = async (stockId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "watchlist", stockId));
    } catch (error) {
      console.error("Error removing stock:", error);
    }
  };

  if (authLoading || (user && !userData)) {
    return <div className="text-center p-8">Loading user profile...</div>;
  }
  if (!user) {
    return (
      <div className="text-center p-8">
        Please sign in to view your profile.
      </div>
    );
  }

  const manageAccountItems = [
    { title: "Personal Details", icon: <FiUser />, modal: "personal" },
    { title: "Bank Account", icon: <FiHome />, modal: "bank" },
    { title: "Active Segments", icon: <FiBarChart2 />, modal: "segments" },
  ];

  const renderModal = () => {
    switch (activeModal) {
      case "personal":
        return (
          <PersonalDetailsForm
            user={user}
            userData={userData}
            onClose={() => setActiveModal(null)}
          />
        );
      case "bank":
        return (
          <BankDetailsForm
            user={user}
            userData={userData}
            onClose={() => setActiveModal(null)}
          />
        );
      case "segments":
        return (
          <SegmentsForm
            user={user}
            userData={userData}
            onClose={() => setActiveModal(null)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } font-${font} text-${fontSize}`} // ✅ applied global font + size
    >
      <div className="max-w-5xl mx-auto my-6 p-6 rounded-xl shadow-md">
        <Modal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={`${activeModal} Details`}
        >
          {renderModal()}
        </Modal>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img
              src={
                userData.photoURL ||
                `https://placehold.co/64x64/ddd/333?text=${
                  userData.displayName?.[0] || "A"
                }`
              }
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border"
            />
            <div>
              <h2 className="text-2xl font-bold">{userData.displayName}</h2>
              <p className="text-sm text-gray-500">{userData.email}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal("personal")}
            className="flex items-center gap-2 py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-500"
          >
            <FiEdit2 size={14} /> Edit Profile
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manage Account */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Manage Account</h3>
            <div className="space-y-2">
              {manageAccountItems.map((item) => (
                <button
                  key={item.modal}
                  onClick={() => setActiveModal(item.modal)}
                  className={`w-full flex justify-between items-center p-4 rounded-lg border transition-colors hover:bg-blue-50 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  <FiChevronRight />
                </button>
              ))}
            </div>
          </div>

          {/* Watchlist */}
          <div>
            <h3 className="text-lg font-semibold mb-3">My Watchlist</h3>
            <form onSubmit={handleAddStock} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                placeholder="e.g., RELIANCE.NS"
                className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newTicker.trim()}
                className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-400"
              >
                <FiPlus />
              </button>
            </form>

            {watchlistLoading ? (
              <p>Loading watchlist...</p>
            ) : watchlist.length > 0 ? (
              <div className="space-y-2">
                {watchlist.map((stock) => (
                  <div
                    key={stock.id}
                    className={`flex justify-between items-center p-3 rounded-lg border ${
                      darkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-100 border-gray-300"
                    }`}
                  >
                    <span className="font-mono">{stock.ticker}</span>
                    <button
                      onClick={() => handleRemoveStock(stock.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Your watchlist is empty.
              </p>
            )}
          </div>

          {/* Preferences */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-3">Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dark Mode */}
              <div
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  {darkMode ? <FiMoon /> : <FiSun />}
                  {darkMode ? "Dark Mode" : "Light Mode"}
                </span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="py-1 px-3 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                >
                  Toggle
                </button>
              </div>

              {/* Font */}
              <div
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FiType /> Font
                </span>
                <select
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="sans">Sans</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Mono</option>
                </select>
              </div>

              {/* Font Size */}
              <div
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FiType /> Font Size
                </span>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="sm">Small</option>
                  <option value="base">Medium</option>
                  <option value="lg">Large</option>
                  <option value="xl">Extra Large</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
