import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { bodyFont } from "../../font.js";

// Motion Variant Definitions for Clean Staggered Page Load
const containerVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for snappy enterprise feel
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemLeftVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const itemRightVariants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.96,
    transition: { duration: 0.1, ease: "easeIn" },
  },
};

export default function Topbar({ onMenuClick }) {
  const { admin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Extract single first letter of user's name or email
  const userFirstLetter =
    admin?.fullName?.trim()?.charAt(0)?.toUpperCase() ||
    admin?.email?.trim()?.charAt(0)?.toUpperCase() ||
    "A";

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 font-body ${bodyFont.className}`}
    >
      {/* Left Section: App Logo & Admin Panel Title */}
      <motion.div variants={itemLeftVariants} className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle Button */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Toggle navigation sidebar"
          className="lg:hidden text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 active:scale-95 transition-all"
        >
          Menu
        </button>

        {/* Application Brand Logo */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* Logo Container */}
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 p-1.5 border border-gray-200 group-hover:border-[#F97316]/50 transition-colors shrink-0 shadow-xs">
            <img
              src="/app_icon_without_bg.png"
              alt="App Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Clean Enterprise "ADMIN PANEL" Typography */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-heading font-extrabold text-sm tracking-tight text-gray-900 group-hover:text-[#EA6A0A] transition-colors">
              ADMIN
            </span>
            <span className="font-heading font-medium text-sm tracking-tight text-gray-300">
              /
            </span>
            <span className="font-heading font-semibold text-xs uppercase tracking-widest text-[#F97316]">
              PANEL
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Section: User Profile & Dropdown */}
      <motion.div variants={itemRightVariants} className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all text-left border ${
            open
              ? "bg-gray-50 border-gray-300 shadow-xs"
              : "border-transparent hover:bg-gray-50 hover:border-gray-200"
          }`}
        >
          {/* Executive Pure White Letter Avatar */}
          <div className="relative flex items-center justify-center shrink-0">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
              className="w-9 h-9 rounded-xl bg-white border-2 border-[#F97316] text-[#EA6A0A] flex items-center justify-center shadow-xs"
            >
              <span className="text-sm font-extrabold font-heading">
                {userFirstLetter}
              </span>
            </motion.div>

            {/* Minimal Online Status */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          {/* User Details */}
          <div className="hidden sm:block leading-tight">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-gray-900 font-heading truncate max-w-[120px]">
                {admin?.fullName || "Administrator"}
              </p>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#EA6A0A] bg-[#FFF1E6] rounded border border-[#F97316]/20">
                Admin
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray-500 truncate max-w-[150px] mt-0.5">
              {admin?.email || "admin@cameramobilezone.com"}
            </p>
          </div>

          {/* Animated Dropdown Indicator Arrow */}
          <motion.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`w-3.5 h-3.5 ${open ? "text-[#F97316]" : "text-gray-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        {/* Clean White Dropdown Menu with AnimatePresence */}
        <AnimatePresence>
          {open && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden"
            >
              {/* Mobile Header */}
              <div className="sm:hidden px-3.5 py-2.5 border-b border-gray-100 mb-1 bg-gray-50/50">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {admin?.fullName || "Administrator"}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {admin?.email}
                </p>
              </div>

              <motion.button
                whileHover={{ x: 2 }}
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#EA6A0A] transition-colors flex items-center justify-between"
              >
                <span>Account Settings</span>
                <span className="text-[10px] text-gray-400 font-mono">⌘S</span>
              </motion.button>

              <div className="h-px bg-gray-100 my-1" />

              <motion.button
                whileHover={{ x: 2 }}
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between"
              >
                <span>Log Out</span>
                <span className="text-[10px] text-red-400">➔</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.header>
  );
}