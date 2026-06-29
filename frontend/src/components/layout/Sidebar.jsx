import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout, isAdmin, isTeacher, isStudent, isParent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const adminNav = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/students", label: "Students", icon: "🎓" },
    { to: "/teachers", label: "Teachers", icon: "👨‍🏫" },
    { to: "/classes", label: "Classes", icon: "🏫" },
    { to: "/subjects", label: "Subjects", icon: "📚" },
    { to: "/attendance", label: "Attendance", icon: "📋" },
    { to: "/profile", label: "Profile", icon: "👤" },
    { to: "/tickets/submit", label: "Report Issue", icon: "🐛" },
  ];

  const teacherNav = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/attendance", label: "Attendance", icon: "📋" },
    { to: "/profile", label: "Profile", icon: "👤" },
    { to: "/tickets/submit", label: "Report Issue", icon: "🐛" },
  ];

  const studentNav = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/my-attendance", label: "Attendance", icon: "📋" },
    { to: "/profile", label: "Profile", icon: "👤" },
    { to: "/tickets/submit", label: "Report Issue", icon: "🐛" },
  ];

  const parentNav = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/parent-portal", label: "Child Portal", icon: "👨‍👧" },
    { to: "/profile", label: "Profile", icon: "👤" },
    { to: "/tickets/submit", label: "Report Issue", icon: "🐛" },
  ];

  const developerNav = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/tickets", label: "Issue Tickets", icon: "🎫" },
    { to: "/students", label: "Students", icon: "🎓" },
    { to: "/teachers", label: "Teachers", icon: "👨‍🏫" },
    { to: "/classes", label: "Classes", icon: "🏫" },
    { to: "/subjects", label: "Subjects", icon: "📚" },
    { to: "/attendance", label: "Attendance", icon: "📋" },
    { to: "/profile", label: "Profile", icon: "👤" },
  ];

  const navItems = user?.role === 'developer'
    ? developerNav
    : isAdmin
      ? adminNav
      : isTeacher
        ? teacherNav
        : isParent
          ? parentNav
          : studentNav;

  const content = (
    <>
      <div className="border-b border-gray-200 flex flex-col items-center py-2">
        <img
          src="/logo-1.png"
          alt="School Logo"
          className="h-24 w-auto object-contain"
        />

        <p className="text-sm font-semibold text-gray-600 text-center leading-tight">
          Quit Green Valley
        </p>

        <p className="text-xs text-gray-400 uppercase tracking-wide leading-tight">
          Convent School
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 min-h-screen flex-col shrink-0">
        {content}
      </aside>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="relative w-72 bg-white min-h-screen flex flex-col shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
