import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Award,
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  Mail,
  FileText,
  Settings,
  Wallet,
  Truck,
  X,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    title: "Sales",
    items: [
      { to: "/orders", label: "Orders", icon: ShoppingBag },
      { to: "/payments", label: "Payments", icon: Wallet },
      { to: "/deliveries", label: "Deliveries", icon: Truck },
    ],
  },
  {
    title: "Catalog",
    items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/categories", label: "Categories", icon: Tags },
      { to: "/brands", label: "Brands", icon: Award },
      { to: "/reviews", label: "Reviews", icon: Star },
      { to: "/curated", label: "Curated Lists", icon: TrendingUp },
    ],
  },
  {
    title: "Customers",
    items: [{ to: "/users", label: "Users", icon: Users }],
  },
  {
    title: "Engagement",
    items: [
      { to: "/contact-messages", label: "Contact Messages", icon: MessageSquare },
      { to: "/newsletter", label: "Newsletter", icon: Mail },
      { to: "/content", label: "Site Content", icon: FileText },
    ],
  },
  {
    title: "Account",
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
];

// Motion Variants
const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 400, damping: 28 },
  },
};

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-30 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 z-40 flex flex-col transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header Brand Info */}
        <motion.div
          variants={headerVariants}
          className="flex items-center justify-between px-5 h-20 border-b border-gray-200 shrink-0"
        >
          <div className="flex items-center gap-3.5">
            <motion.img
              whileHover={{ scale: 1.08, rotate: -2 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              src="https://www.cameramobilezone.com/app_icon_without_bg.png"
              alt="Camera Mobile Zone Logo"
              className="w-10 h-10 object-contain shrink-0 cursor-pointer"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-900 font-heading tracking-tight truncate max-w-[150px]">
                Camera Mobile Zone
              </p>
              <p className="text-xs font-bold text-[#F97316] uppercase tracking-wider mt-0.5">
                Admin Panel
              </p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </motion.div>

        {/* Navigation Item Sections */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
          {NAV_SECTIONS.map((section) => (
            <motion.div key={section.title} variants={sectionVariants}>
              <motion.p
                variants={itemVariants}
                className="px-3 text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-2.5"
              >
                {section.title}
              </motion.p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                  >
                    {({ isActive }) => (
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors duration-150 ${
                          isActive
                            ? "text-[#EA6A0A]"
                            : "text-gray-700 hover:text-gray-900"
                        }`}
                      >
                        {/* Smooth Sliding Active Background Pill */}
                        {isActive && (
                          <motion.div
                            layoutId="activeNavBackground"
                            className="absolute inset-0 bg-[#FFF1E6] rounded-xl shadow-xs -z-0"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}

                        {/* Active Left Indicator Line */}
                        {isActive && (
                          <motion.div
                            layoutId="activeSideNavLine"
                            className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#F97316] rounded-r-full"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}

                        <motion.div
                          animate={{ scale: isActive ? 1.1 : 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="z-10 shrink-0"
                        >
                          <item.icon
                            size={19}
                            className={`transition-colors ${
                              isActive ? "text-[#F97316]" : "text-gray-400"
                            }`}
                          />
                        </motion.div>
                        <span className="z-10 tracking-tight">{item.label}</span>
                      </motion.div>
                    )}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
}